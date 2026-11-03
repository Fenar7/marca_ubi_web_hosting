# Full Engineering Context Register — Latest Active Context

> **Start here.** This is the live pointer file; the detail lives in the linked register.
> Any agent (human or AI) opening this project should read this file first, then the register.

**Recorded At:** `2026-11-03T11:23:34+05:30`
**Current Branch:** `remediation/turbopack-compaction-dev-server` (sub-branch under `redesign/chat-pod-luxury-interaction`)
**Base Branch:** `redesign/chat-pod-luxury-interaction` (which targets `feature/chat-pod` in PR #106)
**Latest State:** `Chat Pod comprehension + motion/contrast contract + transcript follow fix — commits 15b2183, a3a6a82, 6238aa7 pushed; PR #107 updated and OPEN`
**Open Pull Requests (ALL STRICTLY OPEN):**
- [PR #107 (OPEN)](https://github.com/Fenar7/marca_ubi_web_hosting/pull/107): `Remediation: Chat Pod Swiss Light Editorial Luxury Overhaul, Brand Red Alignment & Launcher Avatar` (`remediation/turbopack-compaction-dev-server` → `redesign/chat-pod-luxury-interaction`)
- [PR #106 (OPEN)](https://github.com/Fenar7/marca_ubi_web_hosting/pull/106): `Phase 15.2: Chat Pod Right-Side Docking, Editorial Concierge Profile & Fluid Interaction Engine` (`redesign/chat-pod-luxury-interaction` → `feature/chat-pod`)
- [PR #105 (OPEN)](https://github.com/Fenar7/marca_ubi_web_hosting/pull/105): `Phase 15: Chat Pod Deterministic Assistant and Conversational Intake Architecture` (`feature/chat-pod` → `master`)
**Author Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`
**TypeScript Status:** `0 errors`. Whole-project `tsc` (`node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`) was green at the last full run and then died twice on host memory (`young object promotion failed`, ~1 GB free) — not a type failure. The final pass was re-checked with the same strict options over every file this PR touches (`src/app/chat-pod/**`, `src/app/lib/intake/**`, `tests/unit/chatpod-*.test.ts`, `tests/e2e/chatpod.spec.ts`): **0 errors, exit 0**.
**Unit Tests:** `266 pass / 0 fail` (Chat Pod, 44 suites — re-run on the final tree); `1283 pass / 0 fail` (full suite)
**E2E:** `28 passed in 4.2m` (`tests/playwright.chatpod.config.ts`, against a server already on `127.0.0.1:3003`)

---

## 1. Active Work: Chat Pod Part A (comprehension) + Part B (motion & contrast)

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
following forever, with no pill to explain why). All pushed to
`remediation/turbopack-compaction-dev-server`; PR #107 retitled and its body rewritten with the
re-certification table. PRs #105/#106/#107 remain OPEN; the agent never merges. The single open item is the
portrait provenance question in §7 of the register. **Known gap:** the follow behaviour has no e2e gate, and
the fix has not been run in a browser (the host had no memory for a dev server); see doc 21 §5.

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
