# 02 — Research Findings

Seven expert agents were run: four on external research, three on this codebase. This document is the condensed, citable record. Where a finding changed the plan, that is stated.

---

## Agent 1 — Deterministic NLU without an LLM (external)

**Question:** how do production rule-based assistants resolve free text without a model?

**Findings:**

1. **Three-tier resolution is the standard shape.** Exact/alias lookup first, keyword (whole-word) matching second, scored similarity third. Each tier is cheap and explainable; the expensive tier only sees what the cheap tiers missed.
2. **Explainable thresholds beat tuned ones.** Publish the numbers: accept ≥0.80 with a ≥0.15 margin over the runner-up; below that, disambiguate; below 0.55, admit ignorance. A margin requirement is what stops a near-tie from silently picking a wrong answer.
3. **Trigram similarity + token overlap** is the workhorse for short queries and needs no dependency. Levenshtein earns its place only for single-token input, where trigrams degenerate.
4. **`fastest-levenshtein` ≈0.75KB** is the cheapest credible option. **Fuse.js was rejected**: heavier, and its scoring is opaque, which makes thresholds unexplainable — the opposite of what a no-AI assistant needs.
5. **Cap the guessing.** Two consecutive failures → stop matching and present a menu. Users forgive "I don't know" far more readily than a confident wrong answer.
6. **Stop words are dropped only in tiers 2/3.** Tier 1 must see the literal phrase or exact matching breaks.
7. **Normalisation matters more than the algorithm.** Case, punctuation, whitespace, apostrophe and hyphen folding do most of the work.

**Plan impact:** §01 §4 adopts this verbatim, including the thresholds and the two-fallback cap.

---

## Agent 2 — Chat-widget motion & interaction craft (external)

**Question:** what separates a crafted assistant widget from a "sad bot"?

**Findings (measured values, all adopted in §05):**

| Element | Spec |
|---|---|
| Panel open | scale 0.92 → 1 **from the launcher origin**, + `translateY(12px) → 0`, 380–420ms, `cubic-bezier(0.16,1,0.3,1)` |
| Panel close | 200–240ms — asymmetric, faster than open, no bounce |
| Message in | `translateY(8px) → 0` + opacity, 300ms |
| Typing indicator | three dots, 1.3s loop, 130ms stagger — **inside a container with reserved height** so the transcript never jumps |
| Chips | appear above the composer, staggered 40ms, dismissed on selection (not left dangling) |
| Mobile | full sheet, `translateY(100%) → 0`, 400ms, **flat scrim** (no blur), `visualViewport` keyboard avoidance |
| Launcher idle | **single** nudge after ≥20s idle and ≤50% scroll depth, once per session. No looping pulse, no shake, no badge count, no sound |

**Anti-patterns named and rejected:** looping attention pulses; a "1" badge that means nothing; typing indicators that appear instantly and lie about latency; auto-opening the panel on load; sound; confetti; a mascot that blinks.

**Reference teardown:** the Commvault Cami widget works because the persona is *badged as an assistant*, the panel is origin-anchored, and the launcher stays out of the way. The "Don't be shy! Say hi!" panel works because the invitation is two words and the tap target is huge. Both fail on visual identity for our canon — theirs is coloured and shadowed; ours must be hairline and flat.

**Plan impact:** §05 is a direct transcription with our easing curve and our radius/shadow rules substituted.

---

## Agent 3 — Conversational intake design (external)

**Question:** how do conversational forms collect structured data without frustrating the visitor?

**Findings:**

1. **One question per turn.** Never two. Multi-question turns are the single biggest abandonment cause.
2. **Slots, not pages.** A slot-filling FSM with an explicit required/optional split; ask required first, offer optional as skippable chips (`Prefer not to say`).
3. **Echo and confirm.** A review card listing every collected value with an inline edit affordance per slot, before submit. This is what makes a conversational form feel trustworthy.
4. **Validate at the turn, not at the end.** Email/phone format checked the moment it is given; the error names the slot and re-asks only that slot.
5. **Never trap.** Exit to a human route at any turn (phone, email, full form). State is retained.
6. **Draft persistence with consent.** A visitor who loses 8 answers to a refresh never comes back.
7. **Server re-validation is mandatory regardless of client checks.** Client validation is UX; server validation is the boundary.
8. **Idempotency key per submission attempt, reused across retries** — otherwise retries create duplicate leads.

**Plan impact:** §04 slot order, review card, per-slot edit, exit chips, and the retry-with-same-key rule.

---

## Agent 4 — Accessibility, performance, privacy & legal (external)

**Findings:**

- **A11y:** one `role="log" aria-live="polite"` region for the transcript (not `aria-live` on every message — that double-announces). Panel as `role="dialog"` with `aria-labelledby` pointing at the persona name. Focus trap while open; `Esc` closes **and returns focus to the launcher**. Use `aria-disabled` rather than `disabled` on the send button so it stays focusable and its state stays announced. Chips must be real `<button>`s in DOM order after the message that spawned them.
- **Contrast:** `#ea002a` on `#ffffff` = **4.63:1** (AA pass for normal text). `#ea002a` on `#fafafa` = **4.44:1** (**fail**). Meta/timestamp text must be ≥ `#767676` on white. Assistant bubbles therefore never sit on a tinted surface.
- **Perf:** `next/dynamic` with `ssr:false` inside a client component; prefetch on `pointerenter`/`focusin`; idle pre-mount with a timeout fallback; chunk ≤35KB gzip; CLS 0; LCP delta <50ms.
- **Privacy/PECR:** draft-only `localStorage` for the conversation in progress is **strictly necessary** storage (PECR reg 6) and needs no consent gate. No third-party scripts means no consent banner is triggered. Copy must still be honest: *"Nothing is sent to us until you press send."*
- **Keyboard:** full intake completable with Tab/Enter/Esc and no mouse. 44×44px minimum targets.

**Plan impact:** §05 §2 (a11y contract), §01 §7 (budget), §01 §8 (persistence + consent line).

---

## Agent 5 — The real intake contract in this codebase (internal) ⚠️ **plan-changing**

**Question:** what does `/start-project` actually collect and where does it send it?

**Findings:**

- `src/app/start-project/page.tsx:29` renders `<ProjectForm />` with **zero props**.
- `ProjectForm/types.ts:1-44` defines `ProjectFormData`.
- Wizard: **Step1** services (`Step1Services.tsx:28,42-51,129-196,268-277,286,379` — 52 services across 8 categories) → **Step2** business (`Step2Business.tsx` — `name` + `email` required; `phone`, `instagram`, `language`, `industry`, `projectName`, `website`, `agencyStatus`, `referral` optional) → **Step3** details (`Step3Details.tsx:30-63` — `inspirationLinks`, six `TIMELINE_OPTIONS`, `showcasePermission`, `extraNotes`) → **Step4** summary.
- **There is no budget field.** `budget_bracket` is populated from the selected timeline at `ProjectForm.tsx:96`.
- **Submission: `POST /api/sales-funnel/ingest`** (`ProjectForm.tsx:128`), retry ×3 with `X-Idempotency-Key` (`:51-54,132`).
- Payload keys (`:88-119`): `name, email, phone, company (=projectName), company_website, industry, service_category (via mapCategory :57-67), budget_bracket (=timeline), notes (combined :76-86), source_name: "Website Form", source_detail: "Start Project Brief Wizard (Multi-Service)", brief_payload{…}`.
- Server (`src/app/api/sales-funnel/ingest/route.ts`): 64KB cap `:38,62-71`; token-bucket rate limit `:73-95` via `src/app/lib/rateLimit.ts`; honeypot `_hp_company_url_confirm` `:121-135`; Zod `:137-149` via `src/app/lib/validations/ingest.ts:33-142` (email-OR-phone refine `:136-142`, `serviceCategories` enum `:19-26`); normalisation `:154-163`; dedup state machine `:275-536`; Supabase insert `:466-510` with pg fallback `:801-850`; alert `:512`.
- **`src/app/api/submit-brief/route.ts` is DEPRECATED** — writes Sanity `projectBrief`, returns `X-Deprecated-Endpoint`, and has **zero client callers**. The `ProjectBriefModal` that used it was retired in Phase 13.

**Plan impact:** the owner's "reuse projectBrief" choice was made against my earlier incorrect framing of the pipeline. **§00 §5 flags this for confirmation and recommends the ingest route.** Reusable primitives identified: `src/app/components/ui/PillButton/`, `SectionTitleBlock/`, and the chip styles in `ProjectForm.module.scss` / `steps/Step.module.scss`.

---

## Agent 6 — Grounding corpus & design tokens (internal)

**Where every answer comes from. No intent may cite anything outside this list.**

| Topic | Source | Notes |
|---|---|---|
| Services (16 slugs) | `src/app/components/Sections/ServicesAccordion/types.ts` — `B2B_SERVICES:28`, `B2C_SERVICES:130` | demand-generation, integrated-marketing, corporate-communications, social-influencer-marketing, content-and-scale, public-relations-pr, customer-marketing, account-based-marketing, integrated-creativity, social-influencer, digital-performance, sports-marketing, crm-and-loyalty, public-relations, live-experiences, retail-activation |
| Service detail decks | `src/app/services/content.ts` — `SERVICE_DETAILS:95`, `getAllServiceSlugs():100`, `getServiceBySlug():105`, `validateDeck:30`; decks in `src/app/services/content/b2b.ts` / `b2c.ts` | Deep-linkable to `/services/[slug]` — 16 pages shipped in Phase 12 |
| Journal (blog) | `src/sanity/lib/blog-queries.ts` — `postsQuery:6`, `categoriesQuery:51`, `postBySlugQuery:63`, `relatedPostsQuery:146` | Server-side only; `seo.noIndex != true` filter applies; `estimatedReadingTime` required |
| FAQs | `src/sanity/lib/faq-queries.ts` — `FALLBACK_FAQS:19-65`, `getFaqs():67` | |
| Careers | `src/sanity/lib/career-queries.ts` — `FALLBACK_CAREERS:101-183` | |
| Process | `HowWeWork.tsx:10-50` — four principles | |
| Contact | `MonumentalFooter.tsx` — tel `+91 7012 052 472` `:91-93`, `hello@` `:96-98`, `careers@` `:101-103`, Calicut + Trivandrum addresses `:110-113` | |
| Socials / press | `ConnectCutout.tsx:7-13` socials, press@ `:81` | |
| Locations | `GlobalLocationsCloud.tsx:14-28` | |

**Design tokens** (`src/app/styles/client-mixins.scss`): `$client-accent-red:26`, `-hover:27`, text-dark `:33`, body `:34`, muted `:35`, hairline `:40`, fonts `:10-12`, transition `:65`, radius `:56`, 44px target `:55`, focus ring `:78-81`. `DESIGN.md` dials ENERGY 2 / RHYTHM 2 / MOTION 1 — and its `#ff6100` accent is **overridden** by the enforced `#ea002a` rule.

**Plan impact:** §03 intents each carry a `source` pointing into this table. `knowledge-source-coverage.test.ts` fails the build on any orphan.

---

## Agent 7 — Motion, lazy-mount and test conventions (internal)

| Convention | Location | Applied how |
|---|---|---|
| `MOBILE_MOTION_BREAKPOINT`, `shouldUseMobileMotion()`, `prefersReducedMotion()` | `src/app/lib/motion.ts:1,3-12,14-20` | Pod uses these instead of re-implementing breakpoint/reduced-motion detection |
| GSAP `useGSAP` precedent | WorksGalleryClient, WorksSectionClient, AboutCurtain, OurValuesSection, ContactCtaSection, ClientHeader | Available, but the pod's motion is CSS-transition shaped (panel/chips/messages) — GSAP only if the persona reveal genuinely needs it. Decided M6 |
| Header roll duration | `ClientHeader.tsx:174` `ROLL_DURATION = 0.9`; pill morph `:262-296` | Pod open (380–420ms) must feel faster than the header, not compete with it |
| Lenis | `SmoothScrollProvider.tsx:359-365` `{duration:1.1, lerp:0.1}`; `menu:open`/`menu:close` → `lenis.stop()`/`start()` `:392-411`; skips `/studio` + `/admin` `:19-22` | **Pod dispatches the same two window events** on open/close so smooth scroll stops fighting the panel's internal scroll. Route exclusion list mirrors `:19-22` + `/start-project` |
| Event-gated mount | `FloatingExploreButton.tsx:19-67,82,88-138` waits `initial-loader:complete`, 12s fallback | Adopted as the pod's mount gate. **Zero `next/dynamic` / `React.lazy` / `requestIdleCallback` precedent exists** — this is a deliberate, recorded deviation |
| z-index scale | video −1, content 10, header 50 | Pod ≥50 |
| `.srOnly` | `ClientHeader.module.scss:237-241` | Reused for the AI-badge screen-reader text |
| Unit test style | `tests/unit/normalization.test.ts:9-27` — `node:test` + `node:assert/strict`, run via `tsx --test` | Matcher, FSM, compiler and parity tests follow this exactly |
| A11y e2e | `tests/e2e/accessibility.spec.ts` with `@axe-core/playwright` | Extended with a chat-pod spec |

**Known baseline, not to be re-investigated:** `tests/client/client_160over90_platform.test.ts` runs 59 pass / 3 fail — the 3 failures assert the `ProjectBriefModal` retired in Phase 13 and are pre-existing on `master`. The pod must not be blamed for them, and must not "fix" them.

---

## What the research changed

1. **Pipeline target** — from Sanity `projectBrief` to `/api/sales-funnel/ingest` (§00 §5, D1).
2. **Fuse.js dropped**, trigram + overlap + optional 0.75KB Levenshtein adopted.
3. **`menu:open`/`menu:close` reuse** — discovered the Lenis integration is already an event contract, so the pod needs no provider changes.
4. **Launcher collision** — `FloatingExploreButton` already owns a bottom corner; resolution deferred to M2 with browser measurement, not guessed.
5. **Mount strategy** — the codebase's native pattern is event-gated mount, not `next/dynamic`; the pod uses both, and the deviation is recorded rather than silently introduced.
