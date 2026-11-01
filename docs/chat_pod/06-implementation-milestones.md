# 06 — Implementation Milestones & Acceptance Gates

Eight milestones. Each ends with a stated gate. **Nothing is committed until the gate passes.** No milestone may be started before the owner types "proceed"; after any feedback on this plan, the plan is updated and work stops again.

---

## Verification protocol (applies to every milestone)

The owner has repeatedly said not to waste time on builds and dev servers. So:

| Check | When | Cost |
|---|---|---|
| `npx tsc --noEmit` | after every milestone | seconds. **Always run.** |
| `tsx --test tests/unit/chatpod/*.test.ts` | after M3, M4, M5 | seconds. **Always run.** |
| Regex sweeps: banned vocabulary, emoji, `#ff6100`, `any`, `box-shadow`, em dashes in copy strings | after M5, M7 | seconds |
| Brace/syntax sanity by re-reading edited files | after every edit batch | free |
| Dev server + browser measurement | **only** for the four gates that genuinely need it: launcher collision (M2), overflow at 5 widths (M6), keyboard-only intake (M6), axe scan (M7) | minutes — **asked for explicitly before running**, and reuses the owner's server on port 3003. Never kill or rebind it. |
| Full `npm run build` | once, at M8, and only if the owner asks | minutes |

Known baseline, not to be re-investigated or "fixed": `tests/client/client_160over90_platform.test.ts` runs **59 pass / 3 fail** on `master` — the three failures assert the `ProjectBriefModal` retired in Phase 13.

---

## M1 — Scaffold & mount strategy

**Work**
1. Confirm D1 (intake target) and D4 (branch strategy) with the owner.
2. Create `feature/chat-pod` off the agreed base; branch author `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
3. Create `src/app/chat-pod/` with the file skeleton from §01 §6 — empty shells, no logic.
4. Write `ChatPodShell.tsx`: route exclusion (`/start-project`, `/studio`, `/admin`), mount gate on `initial-loader:complete` with a 12s timeout fallback (the `FloatingExploreButton.tsx:19-67,82,88-138` precedent), `next/dynamic(() => import("./ChatPod"), { ssr: false })`, prefetch on `pointerenter` / `focusin`.
5. Wire it into `src/app/layout.tsx:81-83` beside `<SmoothScrollProvider>`.

**Gate:** `tsc --noEmit` clean. Launcher renders on `/` and is absent on `/start-project`, `/studio`, `/admin`. Nothing visible happens yet beyond the launcher. No CLS introduced (measure by eye against the current homepage load).

---

## M2 — Launcher, panel shell & collision resolution

**Work**
1. Build the launcher: 56×56px, persona frame, `aria-expanded`, `aria-haspopup="dialog"`, `aria-label`.
2. **Resolve the `FloatingExploreButton` collision** (§05 §2.6). Preferred: merge into one stacked rail. Fallback: opposite corners. Requires the owner's dev server for measurement — ask first.
3. Build the panel container: `role="dialog"`, `aria-labelledby`, focus trap, `Esc` handling, `menu:open`/`menu:close` Lenis dispatch.
4. Write the full motion spec in SCSS: 400ms open from computed origin, 220ms close, mobile sheet, flat scrim, per-component reduced-motion blocks.
5. Zero shadows, 2px radius, hairline borders, pure-white transcript backdrop.

**Gate:** `tsc` clean. Open/close works by mouse and keyboard. Focus returns to the launcher on `Esc`. Lenis stops while open. **No overlap with any other floating control, verified in the browser at 390 / 768 / 1440 / 1680.** Reduced-motion path verified by toggling the OS setting.

---

## M3 — Knowledge compiler & matcher

**Work**
1. `knowledge/collect.ts` — server-side compiler over every source in §02 Agent 6's table. Awaits `postsQuery` / `categoriesQuery` server-side; falls back to `FALLBACK_FAQS` / `FALLBACK_CAREERS` and an empty journal if Sanity is unavailable, with a `console.warn` (never swallowed).
2. `knowledge/intents.ts` — the full intent table from §03, every entry carrying a `source`.
3. `engine/normalise.ts`, `engine/match.ts` — three tiers, thresholds 0.80 / 0.15 margin / 0.55, fallback counter capped at 2, `contact` + `intake.trigger` + greetings exempt from the cap.
4. `engine/useChatEngine.ts`.
5. Tests: `normalise.test.ts`, `match.test.ts`, `knowledge-source-coverage.test.ts`.

**Gate:** `tsc` clean. All three unit test files pass. `knowledge-source-coverage` proves: every intent has a `source`; every one of the 16 service slugs has a detail intent; every compiled FAQ has an intent; no template references a missing knowledge path; every `route` action exists in the app router; no answer contains a number not in `kb.counts`. **Zero network requests when a chat message resolves** — verifiable by reading the code path (no `fetch` outside intake submit).

---

## M4 — Conversation UI

**Work**
1. `Transcript.tsx` (`role="log"`, `aria-live="polite"`, `aria-relevant="additions"`), `MessageBubble.tsx` (assistant / visitor / card variants), `ChipRow.tsx`, `Composer.tsx`, `PersonaHeader.tsx`.
2. Typing indicator with reserved height, 320–900ms bounds.
3. Message-in animation, scroll-anchoring rule (only auto-scroll within 80px of the bottom; otherwise a `New message` pill).
4. Chip lifecycle: stagger in, dismiss on select, crossfade on replace.
5. Persistence: consent line, `localStorage` draft write/read/expiry/mismatch-drop, `sessionStorage` nudge flag.
6. The single conditional idle nudge.

**Gate:** `tsc` clean. Greeting → services → service detail → journal → contact → fallback → capped-fallback all resolve correctly by chip and by free text. Transcript announces once per turn under VoiceOver/NVDA semantics (single live region, verified by structure not by ear). CLS contribution 0. Copy sweep passes: no banned vocabulary, no emoji, no em dashes, no exclamation marks, British spelling, `en-GB` dates, literal **LinkedIn** / **X**.

---

## M5 — Intake mode

**Work**
1. `intake/slots.ts` — the 17-slot map from §04 §2, each with its validator and cap. Six slots are **closed sets** (`industry`, `language`, `referral`, `agencyStatus`, `showcasePermission`, `timeline`) and validate by array membership, not by length.
2. `intake/useIntakeFlow.ts` — the pure FSM from §04 §5.
3. `intake/review.ts` — slot → ingest payload mapping, plus the **shared-module extraction** of `mapCategory` (`ProjectForm.tsx:57-67`) and the five option arrays (`LANGUAGES`, `INDUSTRIES`, `REFERRAL_SOURCES`, `AGENCY_STATUS_OPTIONS`, `SHOWCASE_CHOICES`) into one module imported by both the form and the pod. The form's behaviour must be unchanged.
4. Review card with per-slot edit, showing the **stored** string for closed sets (not the short chip label).
5. Submit: `POST /api/sales-funnel/ingest`, `X-Idempotency-Key` created once and reused across retries, ×3 with `attempt * 1000ms` backoff, honeypot field present and empty.
6. `combinedNotes` 2,000-char truncation at a line boundary with overflow preserved in `brief_payload`.
7. Error paths for 422 / 429 / 5xx / network (§04 §6).
8. Tests: `intake-fsm.test.ts` (every legal and illegal transition), `ingest-payload-parity.test.ts` (§04 §8, all eight assertions).

**Gate:** `tsc` clean. Both test files pass. **Parity proven:** the pod's payload is deep-equal to the form's on every key except `source_name` / `source_detail`, both satisfy `ingestLeadSchema.parse()`, and the five closed-set arrays are the identical imported reference in both surfaces. `ProjectForm.tsx` behaviour unchanged by the extraction (the existing form still submits identically). A live submit produces a Supabase `leads` row with `source_name = "Chat Pod"` — verified once, with the owner's permission, against a test lead that is then deleted or marked.

---

## M6 — Responsive, mobile & polish

**Work**
1. Mobile sheet layout, `visualViewport` keyboard avoidance, composer pinned above the keyboard.
2. Chip row wrapping with no horizontal scroll.
3. Launcher placement at all breakpoints.
4. Idle nudge tuning; reduced-motion pass across every component.
5. `noscript`: the launcher is not rendered at all rather than rendered dead.

**Gate (requires the owner's dev server — ask first):** zero horizontal overflow at 390 / 768 / 1024 / 1440 / 1680 with the panel open. Full intake completable by keyboard only at 1440 and at 390. Mobile keyboard does not cover the composer. Reduced motion leaves the pod fully usable.

---

## M7 — Persona asset, accessibility audit, antislop Delivery Gate

**Work**
1. Install the owner-supplied persona photo and name (D2, D3). Until supplied, ship the neutral placeholder frame with **no face**.
2. Contrast verification with the `antislop-human` checker across every text pair in §05 §2.4.
3. `tests/e2e/chatpod.spec.ts` — axe scan of `/` with the pod open, keyboard-only intake completion, focus-return assertion.
4. Full 38-rule antislop scan; the pre-empted-tells table (§05 §3) re-checked against the built output.
5. Append the 4-Block Delivery Gate Report and R-35 click-through smoke-test evidence to the PR body.

**Gate:** axe-clean with the pod open. All contrast pairs pass AA. Every tell in §05 §3 confirmed absent. Delivery Gate Report attached. **The core question answered explicitly in the PR: if the logo and the studio name were swapped out, would this pod still feel like Marca Ubi's?** If no, M7 does not close.

---

## M8 — Bundle verification, analytics decision, PR

**Work**
1. Measure the pod chunk (target ≤35KB gzip) and the knowledge payload (target ≤25KB gzip). Trim the journal list, service summaries or FAQ set if over.
2. Measure LCP delta against the current homepage baseline (target <50ms) and confirm CLS 0.
3. Analytics events — D6. Proposed, wiring deferred unless approved: `pod_open`, `pod_intent_resolved` (intent id + tier), `pod_fallback` (count), `pod_intake_start`, `pod_intake_slot_skip` (slot id), `pod_intake_submit` (outcome), `pod_handoff`. No visitor text in any event. No third-party script.
4. Update `docs/context/context.md` with a new dated register entry for this module.
5. Open the PR: descriptive title, **never** containing `feat`. Author `Fenar7`. PR left **OPEN**.

**Gate:** all budgets met and the numbers recorded in the PR body. `tsc --noEmit` 0 errors. Zero `any`. Zero swallowed exceptions. Unit + intake tests green. PR opened and **not merged**. Context register updated.

---

## Dependency graph

```
D1, D4 ──► M1 ──► M2 ──► M3 ──► M4 ──► M5 ──► M6 ──► M7 ──► M8
                    │              ▲              ▲       ▲
                    │              │              │       │
              D5 (nudge) ──────────┘              │       │
              D2, D3 (persona) ───────────────────┼───────┘
              D6 (analytics) ─────────────────────┴──────────► M8
```

M2 and M3 can run in parallel once M1 lands (different files, no shared state), **if** the owner wants the swarm approach: one agent owns the panel/motion files, another owns `engine/` + `knowledge/`, a read-only auditor reviews both. That matches the recorded preference for parallel builders with a single owner per file and a separate auditor for fix passes. M4 needs both. M5 is sequential and single-owner — it touches `ProjectForm.tsx` (the `mapCategory` extraction) and must not be raced.

---

## Estimated shape

| Milestone | Files touched | New files | Risk |
|---|---|---|---|
| M1 | `layout.tsx` | 3 | low |
| M2 | possibly `FloatingExploreButton.tsx` | 4 | **medium — collision** |
| M3 | — | 6 + 3 tests | medium — corpus coverage |
| M4 | — | 7 | low |
| M5 | `ProjectForm.tsx` (extract `mapCategory` only) | 4 + 2 tests | **medium — payload parity** |
| M6 | — | 0 | medium — mobile keyboard |
| M7 | persona asset | 1 e2e test | low, blocked on D3 |
| M8 | `docs/context/context.md` | 0 | low |

Total: one new module directory, one shared helper extracted from the form, one layout line, possibly one floating-control adjustment. **No API route, no schema, no migration, no Sanity schema change.**
