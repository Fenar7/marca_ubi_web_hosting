# Chat Pod — one column, one lock, and one typed message (Part D)

Record date: 3 November 2026. Branch `remediation/turbopack-compaction-dev-server`, PR #107 **OPEN**.
Scope: `chat-pod/ui/Transcript.tsx`, `chat-pod/ChatPod.tsx`, `chat-pod/ChatPod.module.scss`,
`chat-pod/engine/normalise.ts`, `chat-pod/engine/match.ts`, `lib/overlayScrollLock.ts` (new),
`components/SmoothScrollProvider`, `components/NavigationOverlay`, `components/ReelModal`,
`components/Hero/CompanyProfileModal`, and the browser and unit gates over them.
Design Read for this module: **ENERGY 2 / RHYTHM 2 / MOTION 2** (unchanged from `20-`, `21-`, `22-`).

`22-comprehension-continuity-and-intake-remediation.md` records the pass before this one and ended with
the honest sentence *"Still unrun: a real browser pass over the intake fixes."* This file is that browser
pass, plus the two defects the owner found by using the pod afterwards.

---

## 1. What the owner reported, in their own words

> *"what the heck is this view … two scrolls etc … also in many other pages the scrolls are not working …
> still messages like can yu pls tell me about services is not working … now i feel like a dumb chatbot"*

Three complaints, and the interesting thing about them is that they are three different layers:

| Complaint | Layer | Root cause | Fix |
|---|---|---|---|
| *two scrolls* in one panel | UI | The message list and the chip rail each owned an `overflow-y: auto` box inside a fixed-height panel. A wheel moved one box, then the other; the keyboard moved whichever had focus; on a phone the inner box ate the swipe. | One scroll owner: `.flow`. The transcript and the tray are non-shrinking children of one column. |
| *the scrolls are not working on other pages* | global | Five surfaces (navigation overlay, chat pod, profile modal, reel, header) each held the viewport for themselves — a body class, a dispatched event, a direct `document.body.style.overflow` write. Whichever released last decided whether every one of them was still holding. | One refcounted lock, `lib/overlayScrollLock.ts`, and Lenis driven from it instead of from a guess. |
| *can yu pls tell me about services* not understood | engine | Three separate holes, none of them the abbreviation table: a four-character mistype was still charged as a topic, a question with the interrogative at the **end** had no shape, and a request wrapped in politeness (`pls send info`) was read as an answer. | `INTERROGATIVE_SWAPS`, the trailing-interrogative branch, `please` in the request family, and a content-based detour route at the verbatim slots. |

## 2. One column: the mechanics

The scroll owner is `.flow` (`ChatPod.module.scss`), and three properties make it honest rather than merely
taller than its content:

- **`overflow-anchor: none`.** The browser's own scroll anchoring is what slid the whole rail 22px when a
  visitor tapped one chip: it compensates against a destination this component computes for itself.
- **The destination is the floor** — `max(0, scrollHeight - clientHeight)` — not "the newest turn's
  `offsetTop`". The reverted alternative (aiming at the newest row's top) glided *backwards* whenever the
  replies below it were taller than the answer, and produced measurable counted layout shifts.
- **Arrival is compensated before paint.** `useLayoutEffect` adds the row's own height to `scrollTop` in
  the frame that inserts it, so the words on screen do not move and the only visible motion is the 600 ms
  glide to what arrived. After paint is a jump that lands and then slides back.

The piece this pass adds is a `ResizeObserver` over the flow box *and its children*
(`Transcript.tsx:244-262`). The arrival maths has two inputs — `lastExtent` and `destination` — and neither
is only changed by React: a web font swapping in, a seventeen-option rail re-wrapping under a narrower
panel, and the soft-keyboard inset all move `scrollHeight` or `clientHeight` while React sits still. A
stale `lastExtent` compensates by the wrong amount; a stale floor makes the *Jump to the latest* pill lie.
The observer refreshes both, and moves only a reader who was already following the end, snapping rather
than gliding because a reflow is not a delivery.

## 3. One lock: the lifecycle

```
acquireOverlayScrollLock(token)   releaseOverlayScrollLock(token)
isOverlayScrollLocked()           onOverlayScrollLockChange(listener)
useOverlayScrollLock(active, token)
```

Four tokens, one Set: `site-navigation`, `company-profile`, `reel-modal`, `chat-pod`. Three properties the
scattered version could not have:

1. **A subscriber is told the current truth when it subscribes.** The old controller read
   `document.body.classList.contains("menu-open")` on an event it hoped had not yet fired; on a slow first
   load the event won and the hijack stayed stopped under a closed menu.
2. **The count and the viewport write are separate.** The refcount is asserted in a DOM-free unit runtime,
   because a counting failure is not a layout failure; a subscriber that throws is caught, logged and the
   round still finishes (`overlay-scroll-lock.test.ts`, "finishes the round when a subscriber fails").
3. **Lenis answers the lock and nothing else.** The four bespoke window events and the two class reads are
   gone. A stopped Lenis 1.3.17 still calls `preventDefault()` on every wheel and `touchmove` outside a
   `data-lenis-prevent` subtree — so a surface that holds the page *and* scrolls its own content must carry
   the exemption, which is now asserted for all four overlays rather than remembered.

## 4. The typed message: what the shape test had left open

`22-` gave the engine abbreviation folding and one-keystroke forgiveness for grammar. Measuring the pod in a
browser found three cases it still read wrong, and the fixes are deliberately asymmetric:

| Message | Was | Now | Why the fix is narrow |
|---|---|---|---|
| `whta do you do` | DISAMBIGUATE | ANSWER `identity.studio` 0.852 | `isScaffold` refused 4-character tokens while `looksLikeQuestion` already read `whta` as a mistyped opener. Two subsystems disagreeing about the same word is how the score fell under the floor. Now 4-character tokens are forgiven **only** against `INTERROGATIVE_SWAPS` — adjacent transpositions of the openers — and never against the whole stop-word set, because `from` transposes to `form` and a visitor talking about a form would lose their subject. |
| `the services are which` | DISAMBIGUATE | ANSWER `services.overview` 1.000 | Asking for the value of something on screen puts the interrogative last. Nothing written as an answer closes on one, so this branch needs no inversion evidence — only three words. |
| `pls send info` at the name blank | filed as a name | refused, routed to the corpus | `please` is the politeness marker a request is wrapped in, and the chat abbreviation folds to it before the opening is read. The auxiliary family still needs inversion proof; the request family does not. |
| `wat is your price` | filed | refused on shape | The deletion floor is 3 for *wh*-words and 4 for everything else: deleting from `what` gives `wat`, `wha`, `wht` — nothing an answer opens with — while deleting from `does` or `tell` gives `des` or `tel`, which are names. |

The fourth change is a route, not a shape, and it was rewritten by the audit in §9. At the six verbatim
slots (name, email, phone, project, website, Instagram) a message now goes to `engine.lookup` when it has
a question shape **or** opens on a chat abbreviation — and no longer when the corpus merely happens to
have an answer for it. The reason is in one measurement: `social media` resolves to the studio's own
social channel at 1.000, and it is also what a visitor calls their project.

## 5. The gates this pass adds, and the harness bug it found first

`three taps, one question, and the options do not move` failed by 32px on its first run. It was not the pod:
Playwright's `focus()` and `click()` scroll the target into view, and a chip rail taller than the panel
cannot be fully visible — so the gate was measuring the harness's own scroll and reporting it as a defect.
`tapInPlace()` (`chatpod.spec.ts:81-85`) focuses with `preventScroll`, and the baseline is taken 800 ms after
the turn lands because `boundingBox()` includes transforms and a bubble mid-entrance reads as movement.
`GLIDE_SETTLE_MS` is named once for both.

Three gates that did not exist before, all of them answering an audit finding rather than a feature:

| Gate | The defect it would catch |
|---|---|
| `the panel fits a phone turned sideways` (844×390) | The desktop panel is `clamp(26rem, 74vh, 40rem)`; on a 390 px-tall viewport that floor is 26 px *taller than the screen*, and the width sweep at `height: 900` cannot see it. Green today because `@media (max-width: 1023px)` turns the panel into a full-sheet — the gate exists so someone re-applying the clamp on a short viewport finds out here, not in a phone. |
| `starting the brief does not leave the reader above the end of the column` | The progress rail is ~46 px inserted above the scroll owner. `hadRecentInput` forgives any shift within 500 ms of an input, so the CLS gate structurally cannot see it — the audit's point was that the gate's *name* claimed coverage it did not have. The gate is renamed to say what it measures, and this one measures the two facts instead: the column lost at least and at most the rail's height, and the newest line is still inside the visible column. The input-attributed shift count is recorded as a run annotation rather than hidden. |
| `a wheel away keeps the reader's line when the reply lands and offers the pill` | The auto-follow is the only movement the panel makes on its own account, so it is the only one that can shove a reader. A real wheel walks the reader up, then the whole next reply — typing reserve, the visitor's own row, the answer, the fresh chips — arrives under a column the pod no longer owns. `scrollTop` must not change, the pill must be visible, and the pill must deliver the floor when pressed. |

The independent re-audit in §9 adds three more gates: the two content-path intake gates (a project name the
corpus also sells, a blank written in the chat register), the short-desktop floating panel, and
`the panel owns one conversation surface, and the field never eats a long brief` — that last one replacing
the stylesheet assertion that only counted `overflow-y: auto` occurrences, which could not tell the
conversation apart from a form control and passed on the defect.

`tests/e2e/chatpod.spec.ts` is now inside `tsconfig.podcheck.json`. Playwright transpiles specs without
type-checking them, so a gate that reads a property the DOM does not have otherwise passes by being wrong
in a way nobody measures.

## 6. Verification actually run (3 November)

| Check | Command | Result |
|---|---|---|
| Unit suite | `npm run test:unit` | **1329 pass / 0 fail**, 350 suites |
| Normalise contract | `npx tsx --test tests/unit/chatpod-normalise.test.ts` | 44 pass, incl. the four §4 messages and the negative controls (`des is my manager's name`, `tel me the number`, `press kit please` stay answers) |
| Lock contract | `npx tsx --test tests/unit/overlay-scroll-lock.test.ts` | 11 pass: nesting, idempotent acquire, orphan release, edge-only announcements, subscriber throw |
| Type-check, audited scope | `npx tsc -p tsconfig.podcheck.json --noEmit` | **0 errors, exit 0** (scope now includes the e2e spec) |
| Browser suite | `npx playwright test --config=tests/playwright.chatpod.config.ts` | **41 passed in 4.9 m**, 1 worker, against the server already on `127.0.0.1:3003` — includes the two axe scans and the real wheel, real touch and real keyboard gestures |
| Production build | `npm run build` | exit 0 |
| Server-action boundaries | `npm run test:boundaries` | 12 modules, 48 actions, clean |
| Comprehension probe | `npx tsx scripts/chat-pod/probe-comprehension.mts …` | the §4 table above, read off the live index |
| Lint, touched scope | `npx eslint <scope>` | 6 errors / 5 warnings — **all pre-existing**: the HEAD copy of `ChatPod.tsx` produces the identical four errors, HEAD `ReelModal.tsx` the same `react-hooks/immutability` error, and `KineticStage.tsx` is not modified by this branch. The branch adds no new lint finding. |

No model, no network call, no package added. Nothing in `engine/` or the typing path reaches `fetch`.

## 7. Disclosed, not hidden

1. **`Header.tsx` is dead code.** It has zero importers — the live header is `ClientHeader` +
   `NavigationOverlay`. The 14-line lock edit there is inert; it is kept so that if the file is ever
   mounted it arrives already correct, and it is disclosed here because a green gate that reads the file
   would otherwise imply it runs.
2. **One phrase still gets filed at a name blank**: `any discount available` (DISAMBIGUATE 0.647, no
   question shape). Nothing distinguishes it from a visitor who writes `Arjun Patel`, and the pod's two
   honest signals — shape and chat abbreviation — are both silent on it. A stop-word heuristic was
   considered and rejected: `Brand & Co` and `The Marketing Club` are real answers this studio receives,
   and refusing them is an unrecoverable loop. `u offer web design` used to be in this list; it now reads
   as a question because it opens on `u`, and the refusal branch catches it even though the corpus has no
   answer to give (§9). The remaining honest fix is a `company`-shaped slot, not more guessing.
3. **`CONTINUITY_PRIOR = 1.08`** lowers the effective cold-accept bar to ≈0.741 for a candidate in the same
   family as the previous answer. It cannot overturn an answer (it is a second pass), but it is a threshold
   a reader of the frozen table would not guess from `ACCEPT = 0.8`.
4. **`X-Idempotency-Key` is sent and no server route reads it.** The client-side one-press-one-request gate
   is what is actually tested.
5. **The root Playwright config cannot run in this environment.** `playwright.config.ts` health-checks port
   3000; the studio's dev server is the user's on 3003 and is never rebound. The admin, auth and
   site-wide accessibility specs therefore were **not** run for this pass; the pod config's gates were —
   41 at Part D, 44 after the re-audit in §9.
6. **The dev server used for these runs was started by this session** (`npm run dev`, after the user's own
   server had died) — it is on 3003, as the config expects.
7. **The takeover gate measures wheel-then-arrival, not a wheel inside the typing beat.** Racing the gesture
   against the pod's own 600 ms glide measures the harness, so the sequence is fixed and the doc says so.
8. **A 400 px-tall desktop window leaves the conversation column 71 px** once the header, the progress rail
   and the composer are paid for. The panel is now inside the screen instead of 48 px above it, which is the
   fix; three lines of a reply and a wheel for the rest is what a window that short can hold, and the gate
   pins 64 px so a future cap that clips the column instead of the panel fails here.

## 8. Open, in priority order

1. **A `company`-shaped intake slot** (or an explicit "is this your company name?" re-ask) to close §7.2
   without a heuristic.
2. **Author the contested residues apart** (`work`, `studio`, `human`, `project`) — carried from `22-` §9;
   the probe still prints eight collisions.
3. **Real-device confirmation** of the landscape sheet and the soft-keyboard inset. `the sheet lifts by the
   keyboard inset it is given` measures the CSS contract, because a headless browser has no keyboard; the
   inset itself has never been driven by an actual one.

## 9. The independent CTO re-audit (pass 3, same day)

Two auditors were briefed to assume nothing they were told: *"This implementation was written by another
AI coding agent. Conduct a brutally honest, independent review. Do not trust its implementation claims or
test results without verification."* They read the code and ran the resolver rather than reading this
document. Six findings came back; five were real, one was not, and the one that was not is recorded here
for the same reason the rest are.

| # | Finding | Root cause, as measured | What changed |
|---|---|---|---|
| 1 | **MAJOR — legitimate answers hijacked as detours.** `asksSomething` carried `(VERBATIM_FACT_SLOTS.has(slot) && trimmed.includes(" "))`, so every multi-word value at a blank was offered to the corpus first. | `social media` → `contact.socials` 1.000, `brand identity` → `services.detail.integrated-creativity` 1.000, `demand generation` → its own service page 1.000 — all three are plausible project titles, so a visitor naming their project was answered about the studio and the brief stored nothing. The clause was written for `any discount available`, which measures as DISAMBIGUATE; `engine.lookup` returns null on a disambiguation, so the clause **never once fired for its intended case**. Having an answer is not evidence of a question. | The clause is gone. `looksLikeQuestion` or a new `opensWithChatShorthand` decides, and both read the message rather than the corpus. |
| 2 | **MAJOR — the negative controls could not fail.** `assert.notEqual(result.kind, 'answer')` passed for a disambiguation, so a phrase producing three unrelated chips was green. | Measured: dissertations and printer repair → `fallback`; weather-in-Calicut and visa-letter → `disambiguate` (`location` 0.780, `work.clients` 0.611). Reaching `fallback` for the last two needs a threshold, and the thresholds are frozen. | The test now pins the four states in order (`fallback, fallback, disambiguate, disambiguate`) with the measured candidates in the comment. Off-topic phrases still cannot be *answered*, and a drift in either direction is now loud instead of silent. |
| 3 | **MAJOR — the browser gate proved the branch that already worked.** `a question the corpus cannot answer is refused at the name blank` typed one auxiliary-led message, i.e. the shape-only path, while the regression above lived in the content path and had no gate at all. | — | Two new gates: `a project name the corpus also sells is filed, not answered` (types `social media` at the project blank, walks to the review card and requires the `Project` row to carry it) and `a blank written in the chat register is answered, not filed` (`abt pricing` gets the pricing answer and the blank stays open). `atTheNameBlank` became `atTheBlank(page, placeholder)`. |
| 4 | **MINOR — a reflow could teleport an in-flight glide.** The `ResizeObserver` gated on `anchored.current` and then wrote `node.scrollTop = end` — mid-glide, that is a jump over the motion the reader is watching. | — | The observer still updates `destination` (a stale one makes `settle` read a reflow as a takeover and raise the pill for a reader who never moved) but retargets `scrollTo({behavior:"smooth"})` instead of snapping while `gliding.current` is true. |
| 5 | **MINOR — the height gate measured the wrong geometry, and the CSS behind it was a real defect.** My 844×390 gate passes only because `@media (max-width: 1023px)` wins on *width*, so a landscape phone gets the sheet; the floating panel's `26rem` floor was never exercised, and my gate's docstring cited a `max-width: 480px` rule that is not the one that applies. | At 1280×400 the float asks for 416px, floats 80px off the bottom (above the launcher, via `--pod-y`), and puts its header 48px above the screen. | `.panel` height is now `min(clamp(26rem, 74vh, 40rem), calc(100vh − --pod-y − keyboard − 1rem))`. The landscape docstring is corrected, the assertions are shared through `holdsItsControls()`, and `the panel fits a desktop window shorter than its own floor` exercises the float for real. The column left at that size is 71px, which is disclosed in §7 rather than argued about. |
| 6 | **MINOR — the composer could eat its own content.** `.field` is capped at `8.75rem` with `overflow-y: hidden`; on the engines that honour `field-sizing: content` the box grows to the cap and the lines under it are unreachable. The fallback path only set `overflow-y: auto` on engines that *do not* support `field-sizing`. | — | `.field` is `overflow-y: auto` for every engine, the redundant inline write in `Composer.tsx` is gone, and `the panel owns one conversation surface, and the field never eats a long brief` types a 420-character brief and requires it to be intact, overflowing, scrolled off the first line, and to leave exactly two scroll boxes in the panel: `Conversation` and `Message`. The unit contract that counted `overflow-y: auto` in the stylesheet now names its owners instead of counting to one. |
| 7 | **NOT A DEFECT — `isScaffold` checks the stop-word set before the `known` guard,** which the auditor read as a published subject word being eaten as grammar. | The `known` set is `index.vocabulary` — every word the corpus publishes, including `you`, `are`, `what` inside authored aliases. Reordering would make those words survive as *content* and move scores across the frozen table; the guard is documented as applying to the typo-forgiveness branches below it, which is where it sits. | Nothing changed. Recorded because the audit asked and because the ordering looks like a bug from the outside. |

Three small ones went with them: `folded()` now uses `Object.hasOwn`, so a message containing the
inherited name `constructor` can no longer fold to a function; the two-source fallback-lock constant
(`LOCK_AFTER = 2` next to `FALLBACK_LIMIT = 2`) is one constant; and the comprehension probe takes
`phrase >> priorIntentId`, so the second question the console exists for can be asked from the command
line instead of by editing the file.

`profile-modal-open` was reported as a dead class write. It is not: `FloatingExploreButton.module.scss`
and `CompanyProfileModal.module.scss` both style on it, so the writes are load-bearing and were left
alone. `.menu` is outside the scroll column by intent — it is a disclosure the visitor opened, not part of
the thread, and putting it in the column would let a reader scroll away from the conversation into a menu
they did not ask for. `Header.tsx` is genuinely dead (§7.1); deleting it is a change to shared code and is
left for the owner to decide.

The pass-3 tree, re-verified after every change above:

| Check | Command | Result |
|---|---|---|
| Unit suite | `npm run test:unit` | **1333 pass / 0 fail**, 351 suites |
| Type-check, audited scope | `npx tsc -p tsconfig.podcheck.json --noEmit` | **0 errors, exit 0** |
| Browser suite | `npx playwright test --config=tests/playwright.chatpod.config.ts` | **44 passed in 5.4 m**, 1 worker, against the server on `127.0.0.1:3003` |
| Production build | `npm run build` | exit 0, and `http://127.0.0.1:3003/` still answers 200 afterwards |
| Server-action boundaries | `npm run test:boundaries` | 12 modules, 48 actions, clean |
| Comprehension probe | `npx tsx scripts/chat-pod/probe-comprehension.mts …` | the §9 table read off the live index, plus `explain each service >> services.b2b` → ANSWER `services.overview` 0.837 against a cold DISAMBIGUATE at 0.775 |
| Lint, files this pass touched | `npx eslint --format json ChatPod.tsx engine/* ui/Transcript.tsx ui/Composer.tsx ui/MessageBubble.tsx` | 4 errors / 2 warnings, all in `ChatPod.tsx` and all `react-hooks/*`. `git show HEAD:…/ChatPod.tsx` lints to the same four errors and two warnings on the same rules (earlier line numbers), so this pass adds no finding. |
