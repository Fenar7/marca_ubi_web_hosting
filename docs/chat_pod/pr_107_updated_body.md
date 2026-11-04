## What is in this branch

Four passes over the same surface, one branch. The first rebuilt the pod's Swiss light editorial look, the
brand red and the launcher. The second, `15b2183`, is the one the owner asked for after using the pod live:
make it understand the questions people actually ask, and make it feel alive when a message is sent. The
third (`eff95ed`) made a typed message count as typed rather than authored, carried the subject across
turns, and closed ten intake defects. The fourth is this branch's working set: one scroll column instead of
two stacked boxes, one refcounted viewport lock across five overlays, and the intake regression the
independent re-audit caught and fixed. Each pass carries the gates that measure it.

Design Read for this surface: **ENERGY 2 / RHYTHM 2 / MOTION 2** (set with the owner before the pass; the
`MOTION 1` recorded further down is superseded, see the re-certification block).

---

## Follow-ups found in use (commits after `15b2183`)

### The transcript stopped following

The owner's report: "when I keep chatting this is still at top, messages should go the last". Real, and the
cause was arithmetic rather than animation. `ui/Transcript.tsx` decided whether to follow the end by
measuring `distanceFromEnd()` inside the post-paint effect, so the distance it read already contained the
row that had just arrived. A reader parked exactly at the bottom measured about 120px from the bottom, the
`<= 80` test failed, nothing scrolled, and because nothing scrolled, no scroll event ever fired to update
`following` either, so the "Jump to the latest" pill stayed hidden too. The first exchange looked correct
and every reply after it landed below the fold.

The reader's position is now held in a ref written only by the scroll handler, and the arrival effect asks
that ref instead of the DOM it has just changed. The frames a programmatic glide produces cannot clear the
anchor (the frame back inside the window ends it, and a 600ms timer settles an interrupted one), and a
`wheel`, `touchstart` or `keydown` on the region is a takeover that resolves the movement against where the
reader actually left it. Reduced motion still snaps; a reader who scrolled up to re-read is still never
pulled back down.

**Verification, stated plainly:** the 266 pod assertions pass, the strict type check over the subgraph is
0 errors, and `eslint` reports nothing new in this file, but the behaviour itself has no automated gate.
Nothing in the e2e file asserts that the newest row is on screen after a reply, which is exactly how the
earlier pass in this PR could rewrite the scroll block and ship it broken. It was also not run in a browser:
the host was at about 1 GB free and the compiler needed the memory. The gate this PR still owes, and the
reason to click through it by hand: send two messages, assert the last row sits inside the region's client
box, then scroll up, send a third, and assert the region did not move and the pill appeared.

### The transcript would not scroll at all

The owner's second report, one day later: the wheel turned and nothing moved, while the scrollbar thumb sat
there looking scrollable and the newest row was cut off under the chip rail.

This one is not the transcript's arithmetic, it is the pod's handshake with the site's page scroller.
`openPanel()` dispatches `menu:open` so `SmoothScrollProvider` calls `lenis.stop()` and the page behind the
panel cannot move. Stopping the scroller is correct; the cost was invisible. In the installed Lenis (1.3.17),
`onVirtualScroll` cancels every cancelable `wheel` and `touchmove` that is not inside a `data-lenis-prevent`
subtree, *including while it is stopped* (`node_modules/lenis/dist/lenis.mjs:632`): a stopped scroller still
owns the input, it just refuses to act on it. The transcript is a nested scroll container, so the browser
never received the gesture. Dragging the thumb worked, tabbing in and pressing arrows worked, and the region
did overflow correctly with `overflow-y: auto` and `overscroll-behavior: contain`, which is why every static
check stayed green while the surface was unusable with a mouse.

The fix is Lenis's documented opt-out on the scroll region: `data-lenis-prevent`, which returns the wheel and
the touch gesture to that subtree and nothing else. The page behind remains locked, because that lock is
`lenis.stop()` plus the body overflow guard, neither of which the attribute touches.

**Verification, stated plainly:** the contrast and motion suite is 12/12 with a new assertion covering both
halves of the interaction (the attribute on the region, and the `menu:open` dispatch that makes it
load-bearing), the persistence suite is 29/29, `eslint` reports nothing new on either changed file, and the
strict type check over the subgraph is 0 errors. What that does not prove is the gesture itself: a source
guard cannot observe a wheel event, so the browser pass still has to dispatch one over the transcript and
assert `scrollTop` moved while the document behind it did not.

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

---

# Pass 2 (Part D) — One Column, One Lock, and the Typed Message

Recorded 2026-11-03. Driven by the owner's own report, verbatim:

> *"what the heck is this view … two scrolls etc … also in many other pages the scrolls are not working …
> still messages like can yu pls tell me about services is not working … now i feel like a dumb chatbot"*

Three complaints, three layers, and the middle one is what made this the expensive pass.

## Root causes, established by reading the code before changing it

| Report | Layer | Cause | Fix |
| :--- | :--- | :--- | :--- |
| Two scrolls in one panel | UI | The message list and the chip rail each owned an `overflow-y: auto` box inside a fixed-height shell. The surface under the cursor decided whether a gesture did anything. | `.flow` is the single scroll owner; the transcript is `flex: 1 0 auto` inside it and the tray is the tail of the same column. `overflow-anchor: none`, because the browser's own anchoring is what slid the rail 22px under a tap. |
| Scrolls dead on other pages | global | Five surfaces held the viewport five ways — a body class, a dispatched event, a direct `body.style.overflow` write. Whichever released last decided whether all of them were still holding. | `src/app/lib/overlayScrollLock.ts`: one refcounted lock, four tokens (`site-navigation`, `company-profile`, `reel-modal`, `chat-pod`), and `SmoothScrollProvider` stops and starts Lenis from the lock instead of from `classList.contains("menu-open")`. |
| `can yu pls tell me about services` | engine | Three holes, none of them the abbreviation table: a four-character mistype charged as a topic, an interrogative at the end of a sentence, a request wrapped in `pls`. | `INTERROGATIVE_SWAPS` (openers only — `from` ↔ `form` is the reason), the trailing-interrogative branch, `please` in the request family, and a content route at the six verbatim slots through `engine.lookup`. |

## Behaviour, measured

| Message | Before | After |
| :--- | :--- | :--- |
| `whta do you do` | DISAMBIGUATE | ANSWER `identity.studio` 0.852 |
| `whta is marka ubi` | 0.853 | ANSWER `identity.studio` 1.000 |
| `the services are which` | DISAMBIGUATE | ANSWER `services.overview` 1.000 |
| `abt pricing` | — | ANSWER `pricing` 1.000 |
| `wat is your price` | filed as a name | refused on shape, routed to the corpus |
| `des is my manager’s name`, `tel me the number`, `press kit please` | — | still filed: they are answers, and that is the negative control |

## The scroll contract, and the maths that replaced the guess

- The follow destination is the **floor** (`max(0, scrollHeight - clientHeight)`), not the newest row’s
  `offsetTop`. The row-based version glided *backwards* whenever the replies under an answer were taller than
  the answer, and produced counted layout shifts.
- An arriving row is compensated **before paint** (`scrollTop += growth` in `useLayoutEffect`): the words on
  screen do not move, and the only visible motion is the 600ms glide to what arrived.
- A `ResizeObserver` over the scroll box *and its children* keeps `lastExtent` and the floor truthful between
  React commits — a web font swapping in, a seventeen-option rail re-wrapping, the soft-keyboard inset. It
  moves only a reader who was already following the end, and snaps rather than glides, because a reflow is
  not a delivery.
- A stopped Lenis still cancels wheel and `touchmove` outside a `data-lenis-prevent` subtree, so every
  overlay that holds the page and scrolls its own content now carries the exemption — asserted by test, not
  remembered by the author.

## Three gates that did not exist, each answering an audit finding

| Gate | What it would catch |
| :--- | :--- |
| `the panel fits a phone turned sideways` (844x390) | The desktop height `clamp(26rem, 74vh, 40rem)` has a 416px floor, which is taller than a sideways phone. The existing width sweep runs at `height: 900` and cannot see it. |
| `starting the brief does not leave the reader above the end of the column` | The ~46px progress rail is inserted above the scroll owner. `hadRecentInput` forgives any shift within 500ms of an input, so the CLS gate structurally cannot see it — the old gate name claimed that coverage, so it is renamed to what it measures and the push is measured directly (the column loses at least and at most the rail’s height; the newest line stays inside the column). The input-attributed count is recorded as a run annotation. |
| `a wheel away keeps the reader’s line when the reply lands and offers the pill` | A real wheel walks the reader up, then the whole next reply — typing reserve, the visitor’s own row, the answer, the fresh chips — arrives under a column the pod no longer owns. `scrollTop` must not move, the pill must appear, and pressing it must reach the floor. |

**One harness defect found on the way:** `three taps, one question, and the options do not move` failed by
32px and the pod was innocent — Playwright’s `focus()` and `click()` scroll the target into view, so the gate
was measuring its own scroll and reporting it as a product defect. `tapInPlace()` focuses with
`preventScroll`, and baselines are taken after the entrance glide settles, because `boundingBox()` includes
transforms.

`tests/e2e/chatpod.spec.ts` is now inside `tsconfig.podcheck.json`: Playwright transpiles specs without
type-checking them, so a gate that reads a property the DOM does not have would otherwise pass by being wrong
in a way nobody measures.

## Pass 2 verification actually executed

| Check | Result |
| :--- | :--- |
| `npm run test:unit` | **1329 pass / 0 fail**, 350 suites |
| `npx tsc -p tsconfig.podcheck.json --noEmit` | **0 errors, exit 0** |
| `npx playwright test --config=tests/playwright.chatpod.config.ts` | **41 passed in 4.9m**, 1 worker, against a server already on `127.0.0.1:3003` (two axe scans, a real wheel, a real touch, a keyboard-only intake) |
| `npm run build` | exit 0 |
| `npm run test:boundaries` | 12 modules, 48 actions, clean |
| `npx eslint` over the touched scope | 6 errors / 5 warnings, **all pre-existing**: HEAD copies of `ChatPod.tsx` and `ReelModal.tsx` emit the identical findings and `KineticStage.tsx` is untouched by this branch. No new lint finding. |

No LLM, no network call, no package added. Nothing in `engine/` or the typing path reaches `fetch`.

## Pass 3: the independent CTO re-audit, and the regression it caught

Two auditors were briefed to trust nothing they were handed — inspect the code, trace the execution paths,
verify the claims rather than read them. They ran the resolver. Five of their findings were real.

| # | Finding | What it was |
| :--- | :--- | :--- |
| 1 | **Legitimate intake answers hijacked as detours** | The Pass 2 detour route offered **any multi-word message** at a verbatim blank to the corpus. `social media`, `brand identity` and `demand generation` each resolve to a real studio answer at **1.000** and each is also what a visitor calls their project — so a visitor naming their project was answered about the studio and the brief stored nothing. The clause was written for `any discount available`, which measures DISAMBIGUATE 0.647, and `engine.lookup` returns null on a disambiguation: **it never once fired for its intended case**. Having an answer is not evidence of a question. The clause is deleted; the routes are now sentence shape (`looksLikeQuestion`) and a chat abbreviation at the head (new `opensWithChatShorthand`), and the same two signals extend to the last-chance refusal, so `u offer web design` is refused rather than filed while `abt pricing` is answered. |
| 2 | **The off-topic negative controls could not fail** | `assert.notEqual(kind, 'answer')` is satisfied by a disambiguation — three unrelated chips under a visitor's message — which is the failure mode the controls existed to catch. They now pin the four measured states in order (`fallback, fallback, disambiguate, disambiguate`) with the candidates in the comment. Reaching `fallback` on the last two needs a threshold; the thresholds are frozen, so the measured state is pinned and the gap is disclosed. |
| 3 | **The browser gate proved the branch that already worked** | The name-blank gate typed an auxiliary-led message — the shape-only path — while the hijack above lived in the content path and had no gate at all. Two new gates do: `a project name the corpus also sells is filed, not answered` (types `social media` at the project blank and requires the review card's `Project` row to carry it) and `a blank written in the chat register is answered, not filed` (`abt pricing` gets the pricing answer and the blank stays open). `atTheNameBlank` became `atTheBlank(page, placeholder)`. |
| 4 | **A reflow could teleport an in-flight glide** | The `ResizeObserver` wrote `node.scrollTop = end` while a 600 ms glide was moving the reader. It still retargets `destination` — a stale floor makes the *Jump to the latest* pill lie and reads a reflow as a takeover — but retargets the smooth move instead of snapping. |
| 5 | **The height gate measured the wrong geometry, and the CSS behind it was a defect** | `the panel fits a phone turned sideways` (844×390) is green only because `@media (max-width: 1023px)` wins on *width*, so a landscape phone gets the full sheet; the floating panel's `26rem` floor had never been exercised. At 1280×400 the float asks for 416 px, sits ~80 px off the bottom above the launcher, and put its header 48 px **above the screen**. `.panel` height is now `min(clamp(26rem, 74vh, 40rem), calc(100vh − var(--pod-y) − keyboard − 1rem))`, the landscape docstring is corrected, and `the panel fits a desktop window shorter than its own floor` exercises the float for real. |
| 6 | **The composer could eat its own content** | `.field` is capped at 8.75 rem with `overflow-y: hidden`: on engines honouring `field-sizing: content` the box grows to the cap and the lines beneath it are unreachable — a visitor's own brief, silently truncated. `overflow-y: auto` now applies on every engine and the redundant inline write is gone. The unit contract that *counted* `overflow-y: auto` in the stylesheet now names its owners (`.flow`, `.field`); the count was exactly one while this was live, and the new e2e gate types a 420-character brief and requires it intact, overflowing, scrolled off the first line, and leaving exactly two scroll boxes in the panel — `Conversation` and `Message`. |
| 7 | **Reported, not a defect** | `isScaffold` reading the stop-word set before the `known` guard is deliberate: `known` is `index.vocabulary`, which contains every authored word including `you`, `are`, `what`, so reordering promotes grammar to content and moves scores across the frozen table. `profile-modal-open` is not a dead class write — `FloatingExploreButton.module.scss` and `CompanyProfileModal.module.scss` both style on it. `.menu` outside the scroll column is intentional. Each is recorded because the audit asked. |

Three small ones went with them: `folded()` uses `Object.hasOwn`, so a message containing the inherited name
`constructor` can no longer fold to a function; the duplicate fallback-lock constant (a local `LOCK_AFTER = 2`
beside `FALLBACK_LIMIT = 2`) is now one constant; and the comprehension probe accepts `phrase >> priorIntentId`
so continuity can be asked from the command line instead of by editing the file.

## Pass 3 verification actually executed

| Check | Result |
| :--- | :--- |
| `npm run test:unit` | **1333 pass / 0 fail**, 351 suites |
| `npx tsc -p tsconfig.podcheck.json --noEmit` | **0 errors, exit 0** |
| `npx playwright test --config=tests/playwright.chatpod.config.ts` | **44 passed in 5.4m**, 1 worker, against the server on `127.0.0.1:3003`. Three runs to get here: 3 failed / 41 passed (the short-desktop cap, a strict-mode double refusal, a brief too short to overflow), then 1 failed (the 71 px column), then green. |
| `npm run build` | exit 0, and `http://127.0.0.1:3003/` still answers 200 afterwards |
| `npm run test:boundaries` | 12 modules, 48 actions, clean |
| `npx eslint --format json` over the files this pass touched | 4 errors / 2 warnings, all `react-hooks/*` in `ChatPod.tsx`. `git show HEAD:src/app/chat-pod/ChatPod.tsx` lints to the same four errors and two warnings on the same rules at earlier line numbers, so this pass adds no finding — checked because the audit reported the lint count as new. |
| Comprehension probe, live index | `social media` / `brand identity` / `demand generation` / `abt pricing` = ANSWER 1.000 · `u offer web design` = FALLBACK (top 0.418) · `any discount available` = DISAMBIGUATE 0.647 · `explain each service` cold DISAMBIGUATE (leader 0.775) vs ANSWER `services.overview` 0.837 with prior `services.b2b` |

## Pass 4: a third auditor, on the pushed commits, and what survived contact

The same brief, handed to a fresh agent against the range `230377b..49c3a64` — the commits, not a working
tree — with two extra constraints: modify nothing, and leave the owner's server on 3003 alone.

**Its MAJOR was dead code.** Reported: a second viewport lock leaking through `html.menu-open`, which
`Header.tsx` writes and `Header.module.scss` styles with `overflow: hidden`, cleared only in a GSAP
`onReverseComplete` that does not run if the reverse is interrupted — the page stays locked with an empty
refcount. Measured: every link in that chain is correct except the one that matters. `Header.tsx` has
**zero importers**, so its stylesheet is never emitted and no live code ever writes that class; the only
remaining `document.body.style.overflow` writers outside `overlayScrollLock.ts` are five admin-route
components in a tree that mounts neither the pod nor the drawer. Real code that cannot run — and the second
audit in a row to be misled by that file, which is the argument for deleting it.

**Two MINORs were real, and both are fixed in `tests/unit` with no product file touched:**

1. **The scroll-surface contract could not see a regression.** It matched the literal `overflow-y: auto`, so
   `overflow: auto`, `overflow-y:scroll`, or a no-space variant kept it green while putting a second
   scrollbar back in the panel. The gate now walks the stylesheet line by line, remembers the last selector
   and asserts the *owners* of every scrolling declaration: `['.field', '.flow']`. Proved by mutation rather
   than by argument — `overflow: auto` injected on `.tray` fails that assertion, and the file was reverted
   from git before anything was claimed about it.
2. **The question-shape test has a price, and it is now pinned instead of disclosed in prose.** With case
   folded away before the sentence is read, a title and an imperative are the same tokens: `who wants a
   proposal`, `what the heck studio`, `do it forward`, `tell me nothing` and `how to damp the roof` all read
   as questions and are refused at a verbatim blank, while `will of the people`, `can on the water`,
   `arjun mehta` and `the marketing club` still file. Refusal is the lesser error — a refusal is
   re-answerable, a stored question is a corrupt CRM record — and the re-ask at the blank remains the honest
   fix.

**Left as disclosures, not fixed:** the `ResizeObserver` keys on `[children]` and re-creates on every parent
render (that dependency is what lets it observe a row that did not exist last render — churn, not a wrong
number); and one lock token means one owner, since `acquire` early-returns for a held token, so two surfaces
sharing a token would release for each other.

| Check, after pass 4/5 | Result |
| :--- | :--- |
| `npm run test:unit` | **1334 pass / 0 fail**, 351 suites |
| `npx tsc -p tsconfig.podcheck.json --noEmit` | **0 errors, exit 0** |
| `npx eslint` over the two changed test files | 0 problems |
| Mutation check of the new scroll matcher | Injected `overflow: auto` on `.tray` → the gate fails on the real assertion; reverted, green again |
| Playwright suite | **not re-run, deliberately.** These two commits change `tests/unit` only, so the 44 gates stand against `7768ba5`, which is still the product tree under test. |

The auditor also falsified the standing claims itself rather than reading them here: no `any`, no swallowed
exception, `package.json` and the lockfile unchanged across the range, nothing in `engine/` reaching `fetch`,
no secret in the diff, type-check exit 0, unit suite 1333/0 on the pushed tree.

## Disclosed rather than hidden

1. `src/app/components/Header/Header.tsx` has **zero importers** — the live header is `ClientHeader` plus
   `NavigationOverlay`. The lock edit there is inert, and the Pass 1 text above that says “Opening the
   hamburger menu in `Header.tsx` dispatches `chatpod:close`” describes dead code.
2. `any discount available` (DISAMBIGUATE 0.647) is still filed at a verbatim blank: it has neither a
   question shape nor a chat abbreviation, so nothing distinguishes it from `Arjun Patel`. `u offer web
   design` no longer is — it opens on `u`, reads as a question, and the refusal branch catches it even
   though the corpus has no answer to give. A stop-word heuristic for names was rejected: `Brand & Co` and
   `The Marketing Club` are real answers this studio receives, and refusing them is an unrecoverable loop.
   The remaining honest fix is a `company`-shaped slot, not more guessing.
3. `CONTINUITY_PRIOR = 1.08` makes the effective cold-accept bar ~0.741 for a candidate in the same family as
   the previous answer. It cannot overturn an answer, but a reader of the frozen table would not infer it from
   `ACCEPT = 0.8`.
4. `X-Idempotency-Key` is sent by the client and read by no route; the tested guarantee is client-side
   one-press-one-request.
5. The root `playwright.config.ts` health-checks port 3000 and the studio server is the owner’s on 3003, so
   the admin, auth and site-wide accessibility specs were **not** run for this pass. Only the pod config’s
   gates were — 41 at Pass 2, 44 after the re-audit.
6. These browser gates ran against a dev server this session started after the owner’s own had died, on the
   usual `127.0.0.1:3003`.
7. A 400 px-tall desktop window leaves the conversation column **71 px** once the header, the progress rail
   and the composer are paid for. The Pass 3 fix brings the panel inside the screen instead of 48 px above
   it; three lines of a reply and a wheel for the rest is what a window that short can hold. The gate pins
   64 px, so a future cap that clips the column instead of the panel fails there rather than here being
   argued about.
8. `Header.tsx` is dead code with an inert lock edit. The audit recommends deleting it and its stylesheet;
   deleting shared code is the owner’s call, so it is left in place and named. Pass 4’s one MAJOR was this
   file’s `html.menu-open` viewport lock — a leak in code that cannot run.
9. The question-shape test refuses proper nouns that open like questions (`tell me nothing`, `who wants a
   proposal`, `do it forward`, `how to damp the roof`, `what the heck studio`), because case is folded away
   before the sentence is read. Refused at a blank is the chosen lesser error; the re-ask is the open fix.
10. One lock token means one owner: `acquireOverlayScrollLock` early-returns for a token already held, so two
    surfaces sharing a token would release for each other. Four tokens, four components today — an assumption
    written down rather than enforced.
11. Five admin-route components still write `document.body.style.overflow` directly. Different tree, no pod,
    no drawer, untouched by this branch — and therefore outside the refcount.
