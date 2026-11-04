# 01 — Chat Pod Architecture

---

## 1. Runtime shape

```
                      BUILD / REQUEST TIME (server)
  ┌───────────────────────────────────────────────────────────────┐
  │  src/app/chat-pod/knowledge/collect.ts                        │
  │    reads: B2B_SERVICES / B2C_SERVICES  (services accordion)   │
  │           SERVICE_DETAILS + decks      (services/content.ts)   │
  │           FALLBACK_FAQS / getFaqs()    (sanity/lib)           │
  │           FALLBACK_CAREERS             (sanity/lib)           │
  │           HowWeWork principles         (studio facts)         │
  │           MonumentalFooter contacts    (studio facts)         │
  │           ConnectCutout socials        (studio facts)         │
  │           GlobalLocationsCloud         (studio facts)         │
  │    awaits: postsQuery / categoriesQuery (Sanity, server-side) │
  │    emits:  KnowledgeBase (plain JSON-safe object)             │
  └───────────────────────────┬───────────────────────────────────┘
                              │  serialized once, at module load of
                              │  the server component (ISR-cached)
                              ▼
                    <ChatPodShell knowledge={kb} />        ← thin client component
                              │
                              │  next/dynamic(() => import('./ChatPod'), { ssr:false })
                              │  prefetch on pointerenter / focusin
                              │  mount gated on 'initial-loader:complete' (+12s fallback)
                              ▼
      ┌───────────────────────────────────────────────────────────┐
      │                        CLIENT                             │
      │                                                           │
      │  ChatPod.tsx  (state owner)                               │
      │   ├── useChatEngine(knowledge)  ← deterministic matcher   │
      │   │     ├── normalise()  lowercase, strip punctuation,    │
      │   │     │                collapse whitespace, fold -/'    │
      │   │     ├── Tier 1  exact phrase hit on `utterances[]`    │
      │   │     ├── Tier 2  word-boundary keyword scoring         │
      │   │     ├── Tier 3  token-overlap + trigram similarity    │
      │   │     │           (fastest-levenshtein, ~0.75KB, only   │
      │   │     │            for single-token input)              │
      │   │     └── resolve(): ≥0.80 && margin ≥0.15 → answer     │
      │   │                    else → disambiguate top 3         │
      │   │                    <0.55 → honest fallback (+counter)│
      │   ├── useIntakeFlow(knowledge)  ← slot-filling FSM        │
      │   │     CHAT ⇄ INTAKE_FORM ⇄ HANDOFF                      │
      │   ├── Transcript (role="log", aria-live="polite")         │
      │   ├── ChipRow                                             │
      │   ├── Composer (input + send, 44px)                       │
      │   └── PersonaHeader (photo, name, AI badge, close)        │
      └───────────────────────────────────────────────────────────┘
                              │
                              │  ONLY network call in the whole module:
                              │  POST /api/sales-funnel/ingest
                              │  { ...ProjectFormData mapped,
                              │    source_name: "Chat Pod",
                              │    source_detail: "Conversational intake (chat pod)",
                              │    _hp_company_url_confirm: "",
                              │    X-Idempotency-Key: <uuid> }
                              ▼
                     existing Supabase `leads` pipeline (UNCHANGED)
```

**Two hard rules fall out of this shape:**

- Chat/FAQ mode makes **zero** network requests. The knowledge base arrives as props, already serialized.
- The only mutation the pod can perform is a single POST to an **existing** route. No new server code, no new endpoint, no new table.

---

## 2. Why the knowledge base is compiled, not fetched

The alternative — a client-side Sanity fetch per session — was rejected:

| | Compiled at server render (chosen) | Client fetch on open (rejected) |
|---|---|---|
| Network on message | 0 | 1+ per session |
| Sanity secret exposure | none | client-side query surface |
| Answer availability offline / on error | always | fails closed, needs error UI |
| Freshness | ISR revalidation, same as the blog listing | live |
| Bundle | data as JSON, tree-shakeable per intent | query client + GROQ strings |

Freshness is a non-issue: the corpus changes when services change (a deploy) or when a blog post is published (already ISR-revalidated across the site). The pod revalidates on exactly the same schedule as `/blog`.

**Serialization discipline.** `collect.ts` emits only plain strings, numbers and arrays — no functions, no Date objects, no Sanity image builders. Image URLs for blog cards inside answers go through the existing hotspot-aware `coverUrl()` helper on the server so the client never needs the Sanity image package.

---

## 3. Knowledge base schema

```ts
type KnowledgeBase = {
  generatedAt: string;            // ISO, for cache-busting the localStorage draft
  persona: { name: string; roleLine: string; photoSrc: string | null };
  services: ServiceEntry[];       // 16 slugs, 8 categories, B2B/B2C split, one-line summary
  categories: CategoryEntry[];
  journal: { slug: string; title: string; category: string; date: string }[]; // en-GB formatted
  journalCategories: string[];
  process: { title: string; body: string }[];   // HowWeWork's four principles
  faqs: { question: string; answer: string }[];
  careers: { title: string; location: string; slug: string }[];
  studio: {
    phone: string; email: string; careersEmail: string; pressEmail: string;
    socials: { label: string; href: string }[];
    locations: string[];
  };
  counts: { services: number; categories: number; posts: number; openRoles: number };
};

type Intent = {
  id: string;
  utterances: string[];           // exact/near-exact phrases
  keywords: string[];             // word-boundary tokens, weighted by order
  answer: AnswerNode;             // literal | template over KnowledgeBase | card list
  chips?: Chip[];                 // { label, action } — action is intentId | route | intake:start
  source: string;                 // file path or Sanity query name — REQUIRED, no orphans
};
```

`source` is mandatory on every intent and is asserted by a unit test: the compiler walks the intent table and fails the build if any intent lacks one, or if any template references a knowledge path that does not exist. This is the mechanical enforcement of "no fabricated answers".

---

## 4. Matching algorithm — deterministic, three tiers

```
normalise(input)
  → lowercase
  → strip leading/trailing punctuation
  → collapse internal whitespace
  → fold "’" → "'", fold "-" → " " (so "B2B" / "b-2-b" / "b2b" converge)
  → drop stop words ONLY for Tier 2/3 (kept for Tier 1)

Tier 1  exact
  normalised input ∈ intent.utterances → score 1.0, return immediately.

Tier 2  keyword (word-boundary)
  for each intent: hits = keywords matched as whole words (regex \b, escaped)
  score = Σ weight_i / Σ weight_all     (weight = 1.0 first keyword, 0.6 rest)
  requires ≥1 whole-word hit; substring matches do not count.

Tier 3  scored fuzzy
  token overlap  = |tokens(input) ∩ tokens(utterance)| / |tokens(utterance)|
  trigram sim    = |trigrams(a) ∩ trigrams(b)| / |trigrams(a) ∪ trigrams(b)|
  single-token input only → fastest-levenshtein similarity (1 - dist/maxLen)
  score = max(0.55·overlap + 0.45·trigram, levenshteinSimilarity)

resolve(candidates)
  best.score ≥ 0.80 AND (best.score - runnerUp.score) ≥ 0.15  → ANSWER best
  best.score ≥ 0.55 AND margin < 0.15                          → DISAMBIGUATE top 3 as chips
  best.score < 0.55                                            → FALLBACK (honest)
```

**Fallback counter:** stored in session state. After **2** fallbacks the matcher is bypassed for the rest of the session — the pod presents the persistent menu (Services / Our work / How we work / Talk to us / Start a project) and only responds to chip taps plus explicit contact intents. It stops pretending to understand.

**Rejected:** Fuse.js (heavier than needed, and its scoring is opaque — we need explainable thresholds); any embedding model (violates the no-AI rule). `fastest-levenshtein` is kept only because it is ~0.75KB and used for single tokens; trigram + overlap covers everything else with zero dependency. A hand-rolled implementation is acceptable if the bundle auditor prefers zero deps — decided in M3.

---

## 5. Intake FSM

```
        ┌──────────┐  intake trigger (chip / "start a project" intent)
        │   CHAT   │──────────────────────────────────────────┐
        └────┬─────┘                                          ▼
             │ "talk to a person" / "just email me"      ┌──────────┐
             │                                          │  INTAKE  │
             │◄─────────────── "back to questions" ─────│   FORM   │
             │                                          └────┬─────┘
             │                                               │ all required slots filled
             ▼                                               ▼
        ┌──────────┐                                    ┌──────────┐
        │ HANDOFF  │◄──── "send it to me instead" ──────│  REVIEW  │
        └──────────┘                                    └────┬─────┘
                                                             │ confirm
                                                             ▼
                                                        ┌──────────┐
                                                        │ SUBMITTING│ → DONE / ERROR(retry ×3)
                                                        └──────────┘
```

Slot order, validation and the exact field mapping live in §04. The FSM is a pure function `(state, event) → state`, unit-tested, with no side effects — the side effect (the POST) happens in one place in `ChatPod.tsx`.

---

## 6. File map (proposed)

```
src/app/chat-pod/
  ChatPodShell.tsx            'use client' — dynamic import host, mount gating, route exclusion
  ChatPod.tsx                 'use client' — state owner, panel, composer
  ChatPod.module.scss         panel, launcher, transcript, chips, composer
  PersonaHeader.tsx           photo + name + AI badge + close
  Transcript.tsx              role="log" region, message rendering
  MessageBubble.tsx           assistant / visitor variants, card variant
  ChipRow.tsx                 quick replies
  Composer.tsx                input + send, 44px, aria-disabled not disabled
  engine/
    normalise.ts
    match.ts                  three-tier resolver
    types.ts                  Intent, KnowledgeBase, Chip, AnswerNode
    useChatEngine.ts
  intake/
    slots.ts                  slot definitions, order, validators (zod, shared with ingest schema)
    useIntakeFlow.ts          pure FSM
    review.ts                 slot → ingest payload mapping
  knowledge/
    collect.ts                server-side compiler
    intents.ts                the intent table (data, with `source` on every entry)
    build.test-fixture.ts     small corpus for unit tests
tests/unit/chatpod/
  normalise.test.ts
  match.test.ts
  intake-fsm.test.ts
  knowledge-source-coverage.test.ts   ← asserts no orphan intents / no missing template paths
  ingest-payload-parity.test.ts       ← asserts chat payload shape === ProjectForm payload shape
tests/e2e/chatpod.spec.ts             ← keyboard-only intake, axe scan, no-overflow at 5 widths
```

Mount point: `src/app/layout.tsx:81-83`, beside `<SmoothScrollProvider>`, mirroring the existing `/studio` + `/admin` exclusion pattern and adding `/start-project`.

**Nothing else in the repo changes** except: the launcher/FloatingExploreButton collision resolution (M2), and optionally `layout.tsx`. No API route, no schema, no Supabase migration, no Sanity schema change.

---

## 7. Bundle & performance budget

| Item | Budget | Mechanism |
|---|---|---|
| Chat pod JS chunk | ≤35KB gzip | `next/dynamic` `ssr:false`; knowledge base is data, not code; no chat SDK |
| Knowledge payload | ≤25KB gzip | Journal limited to the 12 most recent posts; services to slug + one-line summary; FAQs to the fallback set; no Portable Text bodies |
| CLS contribution | 0 | Launcher is `position: fixed` with reserved dimensions; panel renders in a portal-free fixed container |
| LCP delta vs baseline | <50ms | Mount gated on `initial-loader:complete` + `requestIdleCallback` with a 12s timeout fallback (the `FloatingExploreButton` precedent) |
| Time to interactive after tap | <120ms | Prefetch the chunk on `pointerenter` / `focusin` of the launcher |
| First paint of the launcher | after loader only | Never competes with the initial cinematic loader |

Zero `next/dynamic` / `React.lazy` / `requestIdleCallback` precedent exists in this codebase — the native pattern is **event-gated mount**, which is what `FloatingExploreButton.tsx:19-67,82,88-138` does. The pod follows that pattern and adds the dynamic import on top; the deviation is deliberate and recorded here.

---

## 8. State & persistence

| Store | Key | Contents | Lifetime |
|---|---|---|---|
| React state | — | transcript, mode, current slot, fallback counter, panel open | page session |
| `sessionStorage` | `mubi.pod.nudged` | boolean | session — guarantees once-per-session nudge |
| `localStorage` | `mubi.pod.draft.v1` | `{ consent, mode, slots, transcriptTail, generatedAt, savedAt }` | 14 days; **cleared on submit, on "start over", and when `generatedAt` no longer matches the served knowledge base** |

**Consent line (first run, before any write):** `This chat stays on your device until you send it. Nothing is sent to us until you press send.` — one sentence, plain, and literally true: draft-only `localStorage` is a strictly-necessary storage under PECR reg 6, and no network call occurs until intake submit. No cookie banner, no consent modal, no third-party script, therefore no PECR/GDPR consent gate is triggered by this module.

**Privacy guarantees to hold in code review:**
- No visitor text is ever sent anywhere except as the mapped intake payload on explicit confirm.
- Free-text `extraNotes` is the only slot carrying raw visitor prose; it is length-capped client-side (2,000 chars) and re-validated server-side by the existing Zod schema, under the existing 64KB body cap.
- No device fingerprinting, no `navigator` sniffing beyond `prefers-reduced-motion` and `visualViewport`.
- No third-party requests from the pod, ever.

---

## 9. Error handling

| Failure | Behaviour |
|---|---|
| Knowledge base missing a path a template needs | Build-time test fails (`knowledge-source-coverage.test.ts`). Never a runtime surprise. |
| Sanity unavailable during `collect.ts` | Journal/FAQ/career sections fall back to the existing `FALLBACK_FAQS` / `FALLBACK_CAREERS` constants and an empty journal; the pod still answers service, process and contact intents. Logged with `console.warn`, never swallowed. |
| Intake POST fails (network/5xx) | Retry ×3 with backoff, reusing the **same** `X-Idempotency-Key` (the form's pattern at `ProjectForm.tsx:51-54,132`). Then a visible error message with two chips: `Try again` / `Open the full form` → `/start-project`. Draft is **retained**. |
| Intake POST 422 (Zod) | Show the specific field error, jump the FSM back to that slot, retain everything else. No generic "something went wrong". |
| Intake POST 429 (rate limit) | Honest copy: too many attempts, here is the phone number and email. Draft retained. |
| `localStorage` unavailable (private mode / quota) | Feature-detect; degrade to session-only with no draft persistence. No crash, no error surfaced to the visitor. |
| Reduced motion | Every animation collapses to opacity-only ≤150ms or is removed. Functionality unchanged. |

No `try {} catch {}` that swallows. Every catch either renders a visitor-visible state or logs with context.
