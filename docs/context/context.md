# Full Engineering Context Register — Latest Active Context

> **Start here.** This is the live pointer file; the detail lives in the linked register.
> Any agent (human or AI) opening this project should read this file first, then the register.

**Recorded At:** `2026-11-04T10:20:00+05:30`
**Current Branch:** `remediation/turbopack-compaction-dev-server` (sub-branch under `redesign/chat-pod-luxury-interaction`)
**Base Branch:** `redesign/chat-pod-luxury-interaction` (which targets `feature/chat-pod` in PR #106)
**Latest State:** `Chat Pod Part D pushed and PR #107 rewritten — code 7768ba5, docs 415ef65/49c3a64, then a third independent audit of that pushed range whose one MAJOR turned out to be dead code and whose two real findings are now fixed in tests only. PR #107 OPEN, unmerged, 23 commits, MERGEABLE (agent never merges)`
**Open Pull Requests (ALL STRICTLY OPEN):**
- [PR #107 (OPEN)](https://github.com/Fenar7/marca_ubi_web_hosting/pull/107): `Remediation: Chat Pod Swiss Light Editorial Luxury Overhaul, Brand Red Alignment & Launcher Avatar` (`remediation/turbopack-compaction-dev-server` → `redesign/chat-pod-luxury-interaction`)
- [PR #106 (OPEN)](https://github.com/Fenar7/marca_ubi_web_hosting/pull/106): `Phase 15.2: Chat Pod Right-Side Docking, Editorial Concierge Profile & Fluid Interaction Engine` (`redesign/chat-pod-luxury-interaction` → `feature/chat-pod`)
- [PR #105 (OPEN)](https://github.com/Fenar7/marca_ubi_web_hosting/pull/105): `Phase 15: Chat Pod Deterministic Assistant and Conversational Intake Architecture` (`feature/chat-pod` → `master`)
**Author Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`
**TypeScript Status:** `0 errors`. Whole-project `tsc` (`node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`) was green at the last full run and then died twice on host memory (`young object promotion failed`, ~1 GB free) — not a type failure. The gate for this surface is `npx tsc -p tsconfig.podcheck.json --noEmit` → **0 errors, exit 0**; its scope now includes `tests/e2e/chatpod.spec.ts`, because Playwright transpiles specs without type-checking them.
**Unit Tests:** `1334 pass / 0 fail` across `351 suites` (full suite, re-run after the pass-4/5 test hardening). Scoped typecheck for this surface: `npx tsc -p tsconfig.podcheck.json --noEmit` → 0 errors.
**E2E:** `44 passed in 5.4m` (`tests/playwright.chatpod.config.ts`, one worker, against a server already on `127.0.0.1:3003`). `npm run build` exit 0 and the server still answers 200 afterwards; `npm run test:boundaries` clean. **Not re-run** after pass 4/5: those two commits change `tests/unit` only, so the 44 gates still describe the product tree at `7768ba5`.

---

## 1. Active Work: Chat Pod Parts A–D (comprehension, motion & contrast, typed-message intake, scroll ownership)

**Part D — 3 November, the browser pass.** The owner opened the pod, took a screenshot and asked what the
view was: *two scrolls*, and *in many other pages the scrolls are not working*, and `can yu pls tell me
about services` still wrong — *now i feel like a dumb chatbot*. Three layers, and the middle one was the
expensive find. The panel had been **two** `overflow-y: auto` boxes stacked in a fixed-height shell (the
messages, and the chip rail in its own 7.5 rem box), so the surface under the cursor decided whether a
gesture did anything; the viewport behind an overlay had been held five different ways by five surfaces —
a body class, a dispatched event, a direct `body.style.overflow` write — and whichever released last
decided whether every one of them was still holding, which is exactly the "does not work on the other
pages" report; and question recognition still had three holes (a four-character mistype, an interrogative
at the *end* of a sentence, and a request wrapped in `pls`). Now: `.flow` is the panel's only scroll owner
and follows the floor with pre-paint compensation plus a `ResizeObserver` for the reflows React never sees;
`src/app/lib/overlayScrollLock.ts` is a refcounted lock that four tokens share and that Lenis subscribes to
instead of guessing; `isScaffold`, `looksLikeQuestion` and the verbatim-slot detour route close the shape
holes without eating a subject. The gates that prove it are new: a landscape-phone sheet, the ~46 px
progress-rail push that `hadRecentInput` forgives (the CLS gate was renamed for what it actually measures),
and a real wheel-takeover gate. One harness bug surfaced first: Playwright's `focus()` scrolls its target
into view, and the multi-select stability gate had been reporting that scroll as a pod defect.
👉 [`docs/context/2026-11-03_21-07-00.md`](./2026-11-03_21-07-00.md) for that pass.

**Pass 3 was the independent CTO re-audit of that same tree**, and it caught a regression the Part D fix
introduced: the detour route at the six verbatim blanks offered *any multi-word message* to the corpus, so
`social media`, `brand identity` and `demand generation` — each answered at 1.000, each a perfectly ordinary
thing to name your project as — were answered about the studio and the brief stored nothing. The clause had
never once fired for the case it was written for, because `engine.lookup` returns null on a disambiguation.
It is deleted; the routes are now sentence shape and a chat abbreviation at the head (`opensWithChatShorthand`),
and the same two signals feed the refusal branch. Also from that audit: the off-topic negative controls were
rewritten to pin measured states instead of a `notEqual('answer')` that a disambiguation satisfied, the
content path got two real browser gates, a reflow no longer teleports an in-flight glide, the floating panel
is capped by the viewport (it sat 48 px off a 400 px-tall screen), and a visitor's own long brief can no
longer be clipped by the composer's 140 px cap with `overflow-y: hidden`.
👉 [`docs/context/2026-11-03_21-55-00.md`](./2026-11-03_21-55-00.md), with the findings table and the
verification numbers actually re-run on that tree, in §9 of
[`docs/chat_pod/23-one-column-one-lock-and-the-typed-message.md`](../chat_pod/23-one-column-one-lock-and-the-typed-message.md).
Still open there: `any discount available` gets filed at a verbatim blank (no shape, no abbreviation, and a
name heuristic would refuse real answers like `The Marketing Club`), `Header.tsx` — which has no importers —
carries an inert lock edit the auditor wants deleted, and a 400 px-tall desktop window leaves a 71 px
conversation column.

**Pass 4/5 — 4 November, the third auditor, aimed at the pushed commits.** Part D and pass 3 were committed
(`7768ba5` code, `415ef65` + `49c3a64` docs), pushed, and PR #107's body rewritten with the findings and the
numbers. A fresh agent with the same brief then audited the range `230377b..49c3a64` and reported a MAJOR:
a second viewport lock leaking through `html.menu-open`, cleared only on a GSAP `onReverseComplete` that may
never run. Every link in that trace is correct except the one that matters — `Header.tsx` has zero importers,
so its stylesheet is never emitted and no live code ever writes that class. The leak is real code that cannot
run, and it is the second audit in a row misled by that file. Two of its MINOR findings were real, and both
are fixed in `tests/unit` with no product file touched: the scroll-surface contract now names the owner of
every scrolling declaration instead of matching the literal `overflow-y: auto` (proved by injecting the
shorthand regression, watching the gate fail, and reverting), and the price of the question-shape test — five
proper nouns that read as questions and are therefore refused at a blank — is pinned by a test that says so
out loud.
👉 [`docs/context/2026-11-04_10-20-00.md`](./2026-11-04_10-20-00.md), and §10 of the same feature doc.
The honest fix for both `any discount available` and the quirky names is the re-ask at the blank, not another
heuristic; deleting `Header.tsx` still waits on the owner.

**Part C — 3 November, commit `eff95ed`.** The owner used the pod again, on a phone, and reported two more
things: asking *what do you do* got the services qualification question back, and the brief "feels broken".
Thirteen causes behind two sentences. The engine learned that a typed message is not an authored one (chat
abbreviations, one-keystroke forgiveness for grammar and for unknown topic words, aliases grouped by topic
words so a polite sentence reaches the same author as a terse one); continuity was added as a *second*
pass that can only break a tie the cold pass could not, never overturn an answer; `identity.studio` was
authored because the company question had no owner anywhere in the table. Ten intake defects were fixed —
a mid-brief question filed as the live slot's answer, a bare `no` skipped instead of matched, correct
refusals emitted in silence, two replies racing into the transcript, a stale tray, a tray that grew past
the panel, progress that moved backwards, an edit that needed a full stop, and Esc mid-send. The general
finding: **the machine's refusals were right and its lines were missing.**
👉 [`docs/context/2026-11-03_14-55-00.md`](./2026-11-03_14-55-00.md), with mechanism and the measured
resolver table in
[`docs/chat_pod/22-comprehension-continuity-and-intake-remediation.md`](../chat_pod/22-comprehension-continuity-and-intake-remediation.md).
No threshold moved, no dependency added, no network call, no model. The real browser pass over the intake
fixes that this record said was unrun has since been run — see Part D above.

Parts A and B are below.

The owner's two complaints were that the pod answered the wrong question about services ("there are 16
services" is a count, not a description) and that the surface felt dead. The phase ran a plan the owner
approved — A1–A9 resolver/conversation state, B1–B7 motion/contrast, C verification — and found four real
defects by measurement rather than by reading: the AA claim in the stylesheet header (4.24:1 inside the
assistant bubble), an e2e resume gate whose chip filter matched nothing, a composing dot whose *painted*
trough was 1.57:1 for reduced-motion users, and an `aria-disabled` composer that spent the WCAG
inactive-component exception on a visitor's own draft (2.42:1). All four are fixed in the app, and the
promise now lives in `tests/unit/chatpod-contrast.test.ts`, which parses the shipped SCSS, composites alpha
the way a browser paints it, and fails the build on any text pair under 4.5:1 or graphic under 3:1.

Full mechanism, defect tables, gate numbers, the rules learned, and one open question for the owner (the
provenance/consent of `/avatars/sophia-sterling.jpg`, which blocks R-23):
👉 [`docs/context/2026-11-03_11-23-34.md`](./2026-11-03_11-23-34.md)
Architecture detail: [`docs/chat_pod/20-comprehension-and-conversation-state.md`](../chat_pod/20-comprehension-and-conversation-state.md)
and [`docs/chat_pod/21-motion-and-contrast-remediation.md`](../chat_pod/21-motion-and-contrast-remediation.md).
Read the **Re-certification, 2 November 2026** block in
[`docs/chat_pod/07-delivery-gate-and-verification.md`](../chat_pod/07-delivery-gate-and-verification.md)
before quoting any PASS from that table — it supersedes R-25, R-19, R-02 and R-23.

**Shipped in this phase:** `15b2183` (comprehension + motion/contrast), `a3a6a82` (hand-off docs),
`6238aa7` (the stuck transcript the owner found by using the pod: the follow test measured the distance
*after* the new row was painted, so a reader at the end read as 120px away from it and the pod stopped
following forever, with no pill to explain why), `844b131` (the same owner, one day later: the transcript
would not scroll at all, because `menu:open` stops Lenis and a stopped Lenis 1.3.17 still cancels every wheel
and touchmove outside a `data-lenis-prevent` subtree; the scroll region now opts out). All pushed to
`remediation/turbopack-compaction-dev-server`; PR #107 retitled and its body rewritten with the
re-certification table. PRs #105/#106/#107 remain OPEN; the agent never merges. The single open item is the
portrait provenance question in §7 of the register. **Known gap:** neither scroll fix has an e2e gate, and
neither has been run in a browser (the host had no memory for a dev server); see doc 21 §5 for the two
assertions that pass owes.

---

## 2. Previous Session: Chat Pod Swiss Light Editorial Luxury Overhaul & Remediation

The latest active phase resolved five core defects identified during live browser smoke testing:
1. **Turbopack RocksDB Compaction Lock on Windows NTFS**: Created `scripts/clean-dev-cache.js` with atomic directory rename protocol (`.next` → `.next_trash_<timestamp>`) in under 5 ms to bypass Windows file locks and eliminate the 194.9s startup freeze.
2. **Reverse Typing & Caret Drops in Composer**: Eradicated programmatic `setSelectionRange()` in React 19 controlled input; isolated IME composition sessions via `isComposingRef` and delegated length constraints to native DOM `maxLength`.
3. **Focus Theft from 3.5s Slot Machine Ticker**: Guarded unconditional focus in `NavigationOverlay.tsx` with a `prevOpenRef` transition lock and memoized `closeDrawer` in `ClientHeader.tsx`.
4. **Legacy Letter "U" Tile Replaced by a Portrait**: The launcher pill (34px circle) and modal header (38px squircle) now render `/avatars/sophia-sterling.jpg` with an active emerald beacon (`#22c55e`), and the letterpress `U` frame is gone from the build. **Provenance is an open question, not a settled fact** — no document records the portrait as a consented photograph of a real person; see the 3 Nov register §7.
5. **Swiss Light Editorial Luxury Overhaul**: Replaced rejected dark obsidian styling with pure white paper canvas (`#ffffff`, 16px radius, layered diffusion shadow), Linear/Raycast fluid capsule pills (`border-radius: 9999px`), and signature Brand Red (`#ea002a`) send button. Completely purged `#ff6100` orange and `#cccccc` grey from public surfaces.
6. **Overlay Mutual Exclusion**: Synchronized `Header.tsx` and `ChatPod.tsx` via `navigation:close` and `chatpod:close` events so both full-screen overlays can never remain open simultaneously.

Full architectural specifications, root cause post-mortems, token contracts, and test evidence:
👉 [`docs/context/2026-11-02_17-55-00.md`](./2026-11-02_17-55-00.md)

Previous session register (initial build & audit):
👉 [`docs/context/2026-11-02_09-51-45.md`](./2026-11-02_09-51-45.md)

---

## 3. Previous Phases

1. **Phase 14 (PR #104 - Merged `3f1318a`):** Blog redesign — homepage **Journal** rail, `/blog` masthead + index ledger, `/blog/[slug]` article. The reading column *is* the measure: no `max-width` cap on prose, 16-18px body type. Detail: [`docs/context/2026-11-01_19-45-56.md`](./2026-11-01_19-45-56.md); plans in [`docs/blog_redesign/`](../blog_redesign/plan.md).
2. **Phase 8 (PR #98 - Merged):** Pentagram header dual-slot vertical aperture alignment, 0ms background video poster crossfade.
3. **Phase 9 (PR #99 - Merged):** Services Accordion horizontal hover expansion engine with video loop playback.
4. **Phase 10 (PR #100 - Merged):** GSAP fluid motion (`power3.out`), clear aperture dual-zone scrim, responsive mobile touch architecture.
5. **Phase 11 (PR #101 - Merged):** White-curtain title contrast, 16 resting cards at 2400px, Card 08 media swap, H.264 faststart loops with zero-jump WebP posters.
6. **Phase 12 (PR #102 - Merged):** 16 `/services/[slug]` detail pages, light editorial theme, deep-linked accordion bullets.
7. **Phase 13 (PR #103 - Merged):** `/start-project` rebuilt as a light page under a cinematic video hero; brief popup retired in favour of the dedicated intake route.
