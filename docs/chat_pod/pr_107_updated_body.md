## What is in this branch

Two passes, one branch. The first (already recorded below) rebuilt the pod's Swiss light editorial surface,
the brand red alignment and the launcher. The second, `15b2183`, is the one the owner asked for after using
the pod live: make it understand the questions people actually ask, and make it feel alive when a message
is sent. Both are now gated by tests that compute their own numbers.

Design Read for this surface: **ENERGY 2 / RHYTHM 2 / MOTION 2** (set with the owner before the pass; the
`MOTION 1` recorded further down is superseded, see the re-certification block).

---

## Pass 2: comprehension (Part A)

The owner's complaint, verbatim: asking "what are the services available" was answered with a count of the
catalogue, which does not help, and the pod should ask B2B or B2C and then explain each service.

| Change | Where |
|---|---|
| Coverage-scored three-tier resolver: accept at 0.80 with a 0.15 margin, disambiguate up to 3 candidates above the 0.55 floor, then a soft or hard fallback. Two misses lock the guess loop without spending a guess on a follow-up. | `engine/match.ts`, `engine/normalise.ts` |
| The services overview branches on the axis the studio already publishes (B2B / B2C), explains the lines, and offers per-service depth as the next step instead of reciting that there are 16 services. | `knowledge/intents.ts`, `knowledge/corpus.ts` |
| Per-service depth: `respond` now receives an `AnswerContext`, so "tell me more" renders the same service with its sub-service list attached. A third ask prints nothing new; the pod says the subject has run out and re-attaches the live chips. | `types.ts`, `engine/useChatEngine.ts` |
| Conversation state: the previous turn, the chips it rendered and a fingerprint of the blocks it printed. That is what makes "the second one", "tell me more" and a typed chip name resolve. Ordinals accept digits, and a digit past the end is answered with the honest size of the list. Authoring still outranks the idiom layer. | `engine/context.ts` (new, 289 lines) |
| The LLM phase is specified, not built. Every answer stays offline, deterministic and traceable to a `source` the coverage test can fail on. | `docs/chat_pod/20-comprehension-and-conversation-state.md` §7 |

## Pass 2: motion and contrast (Part B)

| Change | Evidence |
|---|---|
| Send, transcript hand-off, chip press, panel close, follow-scroll and the intake receipt are choreographed, each with a `prefers-reduced-motion` branch. The typing slot is reserved before the dots arrive, so the transcript shift stays at 0. | `ChatPod.module.scss`, `ui/Transcript.tsx`, `docs/chat_pod/21-motion-and-contrast-remediation.md` §1 and §3 |
| Stopping the questions now answers instead of clearing the panel. All four stop paths dispatch one event, so the acknowledgement sits on the transition, and its wording is charged to the ledger: it names how many answers are on file and says the next question (not the first) is where `Start a project` picks up, or states plainly that nothing was recorded yet. | `ChatPod.tsx` |
| The contrast promise moved out of a comment and into the build. `tests/unit/chatpod-contrast.test.ts` parses the shipped SCSS, composites every translucent tone over the surface it actually paints on, rounds to 8 bits the way a browser does, and fails on any text pair under 4.5:1 or graphic under 3:1. | 11 assertions, live |

### Four defects found by measurement, fixed in the app

1. **The stylesheet header claimed the ink tones were AA.** `#767676` is 4.54:1 on the white canvas and
   **4.24:1 inside the `#f7f7f8` assistant bubble**, which is where `.listSub`, the review labels and the
   option rows actually live. Tones lifted; the claim is now a test rather than a comment.
2. **The e2e resume gate was broken, not the app.** It filtered chips by a taxonomy that no longer exists,
   filed zero answers, then asserted a sentence the intake has never printed. Rewritten to answer one turn
   keyed off the tray's own shape and assert the question the machine really asks.
3. **The composing dot is a graphic, so its floor is 3:1, and it was measured against its fill.**
   `rgba(0, 0, 0, 0.55)` alone is 4.74:1, but the fill runs under a `0.65` opacity pulse: the trough
   composites to `#cecece` at **1.57:1**, and that trough is the permanent resting state for a
   reduced-motion visitor. Now `0.7` under `0.65`/`1.0`: trough 3.41:1, peak 8.45:1, and the guard test
   iterates the declared opacity plus every keyframe read out of `@keyframes dotPulse`.
4. **The blocked composer spent the WCAG inactive-component exception on the visitor's own draft.** It uses
   `aria-disabled`, so it stays focusable and keeps its content, and while a send is in flight that content
   was `#a3a3a3` at **2.42:1**. Now `$muted` (5.11:1 on that wash); the wash and border carry the inactive
   look instead of the ink.

---

## Re-certification of the gate report below (read before quoting any PASS above it)

| Row | Previous verdict | Now |
|---|---|---|
| **R-25 / R-30 contrast** | PASS, from a hand-listed set of pairs measured on one background | PASS, from `chatpod-contrast.test.ts`, which measures the shipped build including the surfaces the old row ignored. The pairs that failed are documented rather than hidden: `$quiet` 4.24 inside the bubble and `#ea002a` 4.33 on the tint are not used as text colours there. |
| **R-19 / Dials** | `MOTION 1`, four timings | **`MOTION 2`** with the choreography described above. The old row described a surface that no longer exists. |
| **R-02 em dash** | PASS | PASS, and now true of comments as well as copy. A sweep over `src/app/chat-pod`, `src/app/lib/intake`, the ten `tests/unit/chatpod-*.test.ts` suites and `tests/e2e/chatpod.spec.ts` leaves four hits, all functional: the strip-class in `engine/normalise.ts:16`, the two guards that fail the build if copy carries one, and the sample utterance in `chatpod-normalise.test.ts:30`. |
| **R-23 / R-22 portrait** | PASS: "no `<img>`, letterpress `U` frame" and "real photographic portrait of a lady concierge" | **Neither claim describes the build, and the second cannot be verified from this repo.** The launcher and the persona header render `/avatars/sophia-sterling.jpg`, a named person. The disclosure line is honest about the assistant; it does not establish the provenance of the face. If that portrait is generated or stock, R-23 and C-5 are not satisfied and the letterpress frame should come back. **This is the owner's call, and it is the one open item in this PR.** |

Still true and unchanged: R-01, R-03, R-04, R-06, R-07, R-08, R-09, R-12, R-13, R-14, R-16/R-36, R-17, R-18,
R-20, R-21, R-24, R-26, R-27, R-32, R-37, R-38, C-1 to C-4.

## Automated verification (pass 2, on the final tree)

| Gate | Result |
|---|---|
| `npx tsx --test tests/unit/chatpod-*.test.ts` | **266 passed / 0 failed**, 44 suites |
| `npm run test:unit` | **1283 passed / 0 failed** |
| `npx playwright test -c tests/playwright.chatpod.config.ts` | **28 passed / 0 failed in 4.2m** (workers 1, against a server already on `127.0.0.1:3003`; the config treats the server as an input, never a child) |
| `npm run test:boundaries` | 12 Server Action modules, 48 actions, 100% compliant |
| Type check, strict options | **0 errors** across `src/app/chat-pod/**`, `src/app/lib/intake/**`, the pod unit suites and `tests/e2e/chatpod.spec.ts`, i.e. every file this branch touches. The whole-project `tsc` could not complete on this host (`young object promotion failed` at about 1 GB free); no file outside the subgraph above is modified here. |
| `npx eslint src/app/chat-pod` | 3 errors, 3 warnings, each proven pre-existing at the previous commit by `git show` (the `setConsented` post-mount effect, the intake effect that prints state machine output, and `preserve-manual-memoization` on the chip handler). No CI lint gate exists. |

## Governance

- [x] **Author Identity**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`
- [x] **PR Naming**: zero occurrences of `feat` in commit messages, branch names or PR titles
- [x] **Docs**: mechanism in `docs/chat_pod/20-…` and `21-…`, gate re-certified in `docs/chat_pod/07-…`, hand-off in `docs/context/2026-11-03_11-23-34.md`
- [x] **Merge State**: STRICTLY OPEN awaiting manual human review (no agent merges on this repo)

---
---

# Pass 1 (recorded verbatim from the earlier commits on this branch)

Everything below is the pass-1 report. Read it together with the re-certification table above: four of its
rows are superseded, and its test metrics (226 / 40 suites) are the ones pass 2 raised.

## Executive Summary

This PR completes the comprehensive **Remediation: Chat Pod Swiss Light Editorial Luxury Overhaul, Brand Red Alignment & Launcher Avatar**, addressing design harmony, interactive micro-geometry, and modal overlay mutual exclusion for the public agency website:

1. **Swiss Light Editorial Luxury Visual Overhaul**:
   - Replaced temporary dark obsidian card styling with authentic Swiss Light Editorial tokens matching the public agency website (`#ffffff` canvas, black ink `#0a0a0a`, Circular XX typography, and `$client-accent-red: #ea002a`).
   - Modal Container (`.panel`): Pure white paper canvas with Apple HIG 16px corner radius and multi-layered ambient diffusion shadow (`box-shadow: 0 24px 64px -12px rgba(0, 0, 0, 0.16), 0 8px 24px -4px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04)`).
   - Assistant Bubbles (`.bubbleAssistant`): Soft warm paper surface (`#f7f7f8`) with delicate boundary hairline (`rgba(0, 0, 0, 0.05)`), high-contrast Swiss typography, and generous 1.55 line height.
   - Visitor Bubbles (`.bubbleVisitor`): High-contrast obsidian pill (`#0a0a0a`) with crisp white typography (`#ffffff`).

2. **Linear / Raycast Fluid Capsule Pill Geometry**:
   - Replaced boxy rectangular chips with fluid capsule pills (`border-radius: 9999px; background: #ffffff; border: 1.5px solid rgba(0, 0, 0, 0.12); color: #0a0a0a; font-weight: 500; font-size: 0.8125rem; padding: 0.45rem 1rem;`).
   - Micro-interactions: Subtle elevation lift on hover (`translateY(-1.5px)`), Brand Red focus ring (`outline: 2px solid #ea002a`), and dark inverse active selection (`.chipOn`: `#0a0a0a` background, `#ffffff` text).
   - Replaced boxy launcher with a floating capsule pill (`border-radius: 9999px; height: 52px; background: #0a0a0a;`).

3. **Signature Brand Red Alignment (Zero Orange on Public Website)**:
   - Configured public brand accent red (`$client-accent-red: #ea002a`) for active interactive elements: Send action button (`background: #ea002a; color: #ffffff; border-radius: 10px`) and composer focus rings.
   - **Strictly purged `#ff6100` orange** from the public agency website (reserved exclusively for internal admin dashboard).
   - **Strictly purged legacy `#cccccc` grey** from idle send and composer states.

4. **Concierge Portrait & Emerald Beacon** *(provenance of the portrait is the open item in the table above)*:
   - Modal header renders the portrait at `/avatars/sophia-sterling.jpg` inside an Apple HIG continuous squircle (10px radius) with an active emerald beacon (`#22c55e`).
   - Resting floating launcher pill renders the 34x34px circular thumbnail with beacon; transitions to a typographic crosshair (`x`) when open. Both wrappers are `aria-hidden`, so the accessible name comes from the name and hint text.

5. **Bi-Directional Overlay Mutual Exclusion & Focus Protection**:
   - Opening Chat Pod (`openPanel`) dispatches `navigation:close` and `chatpod:open`, immediately dismissing the site hamburger menu. Opening the hamburger menu in `Header.tsx` dispatches `chatpod:close`.
   - Focus Invariant: Caret drops prevented by native DOM `maxLength`, composition guard (`isComposingRef`), and `prevOpenRef` transition locks.

## Pass 1 Recorded R-35 Click-Through Smoke Test Evidence

| Interaction Step | Action Taken | Observed System Behavior | Gate Status |
| :--- | :--- | :--- | :--- |
| **Step 1: Launcher Rest State** | View resting page | Launcher pill displays the circular photographic thumbnail with pulsing emerald beacon; zero letter "U" tile | **PASS** |
| **Step 2: Launcher Open State** | Click Launcher pill | Panel opens; launcher transitions to circular crosshair (`x`) | **PASS** |
| **Step 3: Swiss Light Editorial Shell** | Inspect open ChatPod | Pure white paper card (`#ffffff`, 16px radius, layered diffusion shadow) renders over public site | **PASS** |
| **Step 4: Chip Interaction** | Hover/Click action chips | Fluid pill capsules respond with subtle hover lift (`-1.5px`) and Brand Red focus ring | **PASS** |
| **Step 5: Mutual Exclusion** | Open Navigation Overlay | Navigation overlay opens, dispatches `chatpod:close`, ChatPod dismisses. Opening ChatPod dismisses Navigation | **PASS** |
| **Step 6: Focus Invariant** | Type in Composer | Focus remains stable inside active input during typing; zero focus theft | **PASS** |
| **Step 7: Send Affordance** | Input query in composer | Send button illuminates in signature Brand Red (`#ea002a`); `.sendIdle` uses soft neutral with zero `#cccccc` grey | **PASS** |
| **Step 8: Keyboard Navigation** | Tab cycle & Escape | Tab key cycles through active controls; `Escape` closes dialog and restores focus to launcher pill | **PASS** |

## Pass 1 Automated Verification & Test Metrics

- **TypeScript Compilation**: `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit` to **0 errors (Exit code 0)**.
- **Chat Pod Scoped Unit Tests**: `npx tsx --test tests/unit/chatpod-composer-and-avatar.test.ts` to **27 / 27 PASS**.
- **Chat Pod Regression Suite (pass 1)**: `npx tsx --test tests/unit/chatpod-*.test.ts` to **226 / 226 PASS across 40 suites**, now 266 / 266 across 44 suites.
- **Server Action Boundaries**: `npm run test:boundaries` to **12 files audited, 48 actions verified (100% compliant)**.
- **Color Audit**: Verified **0** occurrences of `#ff6100` orange or `#2563eb` generic blue in `src/app/chat-pod`.
