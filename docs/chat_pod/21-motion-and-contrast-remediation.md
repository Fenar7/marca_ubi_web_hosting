# Chat Pod — Motion and contrast remediation (Part B)

Record date: 2 November 2026. Branch `remediation/turbopack-compaction-dev-server`, PR #107 **OPEN**.
Scope: `ChatPod.module.scss`, `ui/Transcript.tsx`, the guard test
`tests/unit/chatpod-contrast.test.ts`, and the touch-target gate in `tests/e2e/chatpod.spec.ts`.
Design Read for this surface: **ENERGY 2 / RHYTHM 2 / MOTION 2** (the pod's own read, set with the owner
before this phase; the site-wide canon is in `docs/chat_pod/18-overall-luxury-design-overhaul-plan.md`).

`05-motion-and-a11y-spec.md` is the spec this file reports against, and one line of it is corrected here.
`20-comprehension-and-conversation-state.md` is the other half of the same pass; the two halves share the
owner complaint that produced them, which was that the pod felt dead and unreadable, not that it was
missing a feature.

---

## 1. The defect that started it: a comment that claimed a number nobody measured

The stylesheet header asserted the ink tones were WCAG AA compliant. They were not, on the surface they
are painted on. `#767676` measures **4.54:1 on the white canvas and 4.24:1 inside the `#f7f7f8` assistant
bubble**, and `.listSub`, the review labels and the option rows all live in that bubble. The claim was
true of a background almost none of that text sits on.

So the promise moved out of the comment and into a test that parses the shipped SCSS and does the
relative-luminance arithmetic itself (`tests/unit/chatpod-contrast.test.ts`, `luminance`/`ratio`/`flatten`).
The header now says the numbers are measured by that file and fails the build when a pair drops under the
floor. The test also asserts the stylesheet names it, so neither half of the promise can be deleted
without the other noticing.

## 2. Every tone, as measured

Ratios are the shipped values, computed from the hexes in `ChatPod.module.scss` with the WCAG 2.1 relative
luminance formula. Translucent tones are composited over the surface they sit on before being measured,
because the eye receives the composite and not the `rgba()`. Where a cell says "fails", the pair was under
its floor and the tone was moved off that surface rather than re-darkened.

| Pair | Canvas `#ffffff` | Bubble / own fill | Floor | Decision |
|---|---|---|---|---|
| `$ink #0a0a0a` | 19.80 | 18.49 (`#f7f7f8`) | 4.5 (text) | unchanged |
| `$text-body #333333` | 12.63 | 11.80 (`#f7f7f8`) | 4.5 (text) | unchanged |
| `$muted` (was `#767676`) | **5.33** | **4.98** (`#f7f7f8`) | 4.5 (text) | darkened to `#6b6b6b` |
| `$quiet #767676` | 4.54 | 4.24 **fails** (bubble) | 4.5 (meta) | kept, restricted to timestamps on the canvas |
| `$client-accent-red #ea002a` | 4.63 | 4.33 **fails** (bubble) | 4.5 (text) | kept for the canvas and for fills |
| `$client-accent-red-hover #c40023` | 6.23 | 5.82 (`#f7f7f8`) | 4.5 (text) | now also the **ink** for accent text on a tint |
| white on `#ea002a` (send button) | 4.63 | — | 4.5 (text) | unchanged |
| `rgba(0,0,0,.55)` placeholder | — | 4.69 (`#6f6f70` on the field's own `#f7f7f8`) | 4.5 (text) | was `#999999` at 2.85 |
| `$muted` on the idle send fill `#f5f5f5` | 4.89 | — | 4.5 (text) | the label clears AA on the fill it sits in |
| `#ea002a` progress fill on its rail `#f0f0f0` | 4.07 | — | 3 (graphic) | measured against the composited rail |
| `#c40023` on the error tint `#fdebee` | 5.43 | — | 4.5 (text) | `.bubbleError` ink |
| `$muted` on the blocked-field wash `#fafafa` | 5.11 | — | 4.5 (text) | see 2.3, was 2.42 |
| composing dot, dimmest frame | **3.41** | — | 3 (graphic) | see 2.2, was 1.57 |
| composing dot, brightest frame | 8.45 | — | 3 (graphic) | the same measurement at the top of the wave |
| `.link` ink | 6.23 | 5.82 (`#f7f7f8`) | 4.5 (text) | see 2.1 |

Composites are rounded to eight bits before measuring, exactly as the guard test does, because a browser
paints a quantised colour and every figure above is the number that paint produces.

### 2.1 The route links were the last failing text pair

`.link` is the accent-coloured link list inside an assistant answer, and it was painted `#ea002a` on the
tinted bubble: **4.33:1**, under AA for text. It is also the only place the pod asks the visitor to tap
through to a page, so a faint link is a functional defect, not a shade preference.

The fix uses the darker brand step the hover state already published (`#c40023`) as the resting ink and
drops the colour shift on hover: the underline thickens instead, because a second red would be another
pair to measure and nothing new to read. `$client-accent-red-hover` is therefore no longer only a hover
state, and the comment on the token says so. `.bubbleError`'s ink went from a literal `#c40023` to the
same token, so there is one name for the decision. `05-motion-and-a11y-spec.md` §2.4 listed `#767676` as
the floor for meta text and said the pod ships no tinted bubble background; both were written before the
bubble existed. The spec is not edited to match the build here: this file is the record of what shipped
and what the numbers are.

### 2.2 A graphic measured against its fill instead of its frame

The composing dot is the pair the guard test itself got wrong first. It read `background: rgba(0, 0, 0,
0.55)`, composited it over the canvas and reported **4.74:1** against the 3:1 graphic floor — and the dot
on the screen measured **1.57:1**, because the rule also carries `opacity: 0.35` and `dotPulse` animates
between that and 1. Alpha multiplies: 0.55 through 0.35 is a single wash of 0.1925, which lands on
`#cecece`.

That is not a transient frame one could argue past. `prefers-reduced-motion` switches the animation off,
so a visitor who asked for less motion sees the 1.57 shade *permanently*, on the one control that says an
answer is coming. The fill is now `rgba(0, 0, 0, 0.7)` and the band is `0.65 → 1`: the dimmest frame is
`#8b8b8b` at 3.41:1, the brightest is `#4d4d4d` at 8.45:1, and the wave gets wider rather than narrower
because the floor is held by the fill, not by a faint pass. The test multiplies the shipped fill by every
opacity it finds — the declaration and each keyframe stop — so the next person cannot pass this pair by
reading one number out of the file again.

### 2.3 The disabled-component exception is not available to a field that keeps its words

While a send is in flight, or while the rate limit holds the panel shut, the composer takes
`aria-disabled="true"` — deliberately, so the control stays in the tab order and the visitor's text stays
in the box. The stylesheet styled that state with `color: rgba(0, 0, 0, 0.35)` over a 0.02 wash, which
composites to `#a3a3a3`: **2.42:1**. The WCAG exception for inactive components assumes an inert control
whose content carries no information; here the content is the brief, and the state is one the panel puts
the visitor in for reasons of its own.

The ink is `$muted` now (5.11:1 on that wash). The inactive look is carried by the fill and the border,
which is where it belongs: a state change should be told by the surface, not by making the words harder to
read. The guard test reads the wash and the ink out of the same rule and measures the pair, with the
floor charged to text rather than graphics.

## 3. Motion: what was changed and what each beat is for

The owner's words were "there should be fluid motions, you know, when sending message". The reading of
that is not "more animation"; it is that the panel's state changes should read as one continuous gesture.
Four things were doing the opposite.

**3.1 `animation-fill-mode: both` deadened every control it touched.** The rows and chips ran their
entrance with `both`, which keeps the animation owning `transform` after it finishes. The consequence was
invisible in a screenshot and obvious under a finger: `:hover { transform: translateY(-1.5px) }` and
`:active { scale(0.97) }` could never apply, because a filled animation had already written the property.
Every entrance in the module is now `backwards`, which holds the start frame through the delay and then
releases the element. The contract test greps for `animation: … both` and fails if one reappears, and the
e2e touch-target gate learned to wait for rest, because `getBoundingClientRect` reports the animated box
and a 44px chip mid-lift reads as 43.1.

**3.2 The typing indicator moved the transcript twice per message.** It used to mount and unmount. Now the
slot is always mounted at a reserved height (`CLS-0`, no layout shift) and the dots fade on
`data-on`, with `animation-play-state: paused` while hidden so an invisible indicator costs no frames.
The reply rises from exactly where the dots were, which is the single gesture that makes "Ubi is
answering" and the answer read as one event rather than a replacement.

**3.3 The panel appeared as a block.** The shell and its contents now arrive in two beats: the shell, then
everything inside it 120ms later, on the same ease family. Header, transcript, tray and composer are one
`> *` rule, so a fifth region cannot be added later and forget the choreography. Under reduced motion the
delay collapses to zero, and the glyph swap on the launcher, the avatar face, the rows, the chips, the
dots and the jump pill each carry their own `animation: none` branch.

**3.4 The transcript scrolled like a bug.** Three separate defects: an arrival always used `behavior: auto`
so nothing glided; a restored draft never scrolled to its end and offered a "new message" pill pointing at
content already on screen; and the "following" decision was recomputed inside the effect that also writes
it, which the hook rules are right to reject. Now a scroll listener owns `following`, an arrival glides
only when the reader was already at the bottom, the first fill snaps, and reduced motion swaps smooth for
auto instead of disabling the follow. The pill says "Jump to the latest", which is what it does.

**3.5 Saying "stop" made the panel look broken.** Four controls leave the questions (`stop` in the
composer, `Esc`, the "Stop the questions" button, the exit link in the progress row) and all four dispatch
one event, so the fix belongs on the transition rather than at four call sites. Until now that transition
printed nothing and unmounted the chip row: a visitor who tells a chat surface to be quiet is answered by
the surface removing everything, which reads as a crash. `ChatPod.tsx` now keeps the mode it last emitted
in a ref and speaks only on a *change* into chat, so the machine's rest states (`CHAT` before the first
message, `DONE` and `SUBMITTING` after a send) stay silent and only the exit gets the acknowledgement. The
sentence is charged to the ledger rather than assumed: one wording when answers are on file, naming how
many and saying the next question rather than the first is where `Start a project` picks up, and a plain
"nothing was recorded yet" when none are. Both branches are gated live by the two intake tests in §5.

## 4. What the guard test holds

`tests/unit/chatpod-contrast.test.ts` is two describes. The contrast one does the arithmetic above from
the shipped file: it reads each hex and each `rgba()` out of `ChatPod.module.scss`, flattens the translucent
ones over their real backing surface, and fails the pair. Nothing is restated as a number, so changing
`$muted` for a content reason re-measures instead of passing a constant. The composing dot is measured at
every opacity the stylesheet gives it — the declaration and each keyframe stop — because §2.2 is the case
where reading one property out of one rule produced a passing test over a failing render. The motion one
pins the things a later pass is most likely to undo: that every entrance listed is covered by the
reduced-motion branch, that no animation fills forwards, that the indicator is faded rather than mounted,
that the transcript uses the glide/snap/anchor discipline, that a tapped intent chip echoes as the
visitor's own line, and that a restored draft tells the resolver what is on screen. Those last two are
behaviour, not CSS, and they live in this file because they are the two rules the motion pass produced.

The stylesheet's own header names this file, and a test asserts that it does. A promise and its proof
cannot be deleted separately.

## 5. Evidence

Re-run on 2 November 2026 against the finished tree, on the dev server on 3003 (probed, never rebound):

| Gate | Result |
|---|---|
| `npm run test:unit` | 1283 passed, 0 failed |
| `npx tsx --test tests/unit/chatpod-*.test.ts` | 266 passed, 0 failed across 44 suites |
| `tsc --noEmit` | 0 errors (`--max-old-space-size=6144`; the host had 0.7 GB free when this file was first written and the compiler was killed twice) |
| `npm run test:boundaries` | 12 Server Action modules, 48 actions, 100% compliant |
| Playwright, `tests/playwright.chatpod.config.ts` | 28 passed, 0 failed (4.2m, workers 1) |
| `eslint src/app/chat-pod` | 3 errors, 3 warnings — all pre-existing, none introduced here |

A second pass ran on 3 November and changed prose only: the em dashes that survived in comment text
(`types.ts`, `engine/context.ts`, `engine/useChatEngine.ts`, `chatpod-persistence.test.ts`, two annotations
in `chatpod.spec.ts`), one double colon in the blocked-composer comment, and the placeholder figure, which
read 4.68 where the 8-bit composite the guard test performs gives 4.69. Gates re-run on that tree: the pod
suites 266 passed / 0 failed, and the strict type-check over every file this PR touches 0 errors. The
whole-project `tsc` died again on host memory (~1 GB free, `young object promotion failed`), so the scoped
run stands in for it; no file outside `src/app/chat-pod`, `src/app/lib/intake`, the pod unit suites and
`chatpod.spec.ts` is modified by this branch.

The lint items are recorded rather than fixed, and the reason is that each one is a shape this module
deliberately keeps. `ChatPod.tsx:382` is `useEffect(() => setConsented(hasGrantedConsent()), [])` — the
consent read that has to happen after mount because `localStorage` does not exist during SSR, and it is
byte-identical at `HEAD`. `:487` is the effect that turns the intake machine's state into transcript
lines, which is how a deterministic state machine prints an answer at all; `git show HEAD` already calls
`say({` twice inside that same effect, at its lines 474 and 493, so the violation is inherited and only
its line number moved. `:768` is `preserve-manual-memoization` on the chip handler whose dependency list
is the machine's own. The three warnings are two `exhaustive-deps` notes on those same callbacks and an
unused `error` binding in `persistence.ts:199`.

Two gates were wrong before they were right, and both are the same lesson as §2.2: the touch-target scan
measured a chip mid-entrance and reported 43.87px against a 43.9 floor, which was fixed by waiting for the
animation to settle rather than by lowering the floor; and the resume gate pressed a chip filtered on
`/Strategy|Design|Development/`, which matched no shipped category label, then asserted the question
"Which specific services" — a sentence the intake has never printed. It now answers through the same
`answerTurn` helper the full-walk test uses and asserts the slot's real question, so a taxonomy edit fails
it loudly instead of passing it silently with zero answers filed.

