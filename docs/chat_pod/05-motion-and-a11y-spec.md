# 05 — Motion & Accessibility Specification

Motion dial inherited from `DESIGN.md`: **MOTION 1**. The pod's animation is therefore *restrained and precise*, not abundant. Every timing below is justified by function; none is decoration.

---

## 1. Motion spec

### 1.1 Easing and duration language

| Token | Value | Used for |
|---|---|---|
| `$pod-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | every entrance — the canon's existing curve |
| `$pod-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | every exit |
| open | **400ms** | panel entrance |
| close | **220ms** | panel exit — deliberately shorter; exits should never feel laggy |
| message-in | **300ms** | each transcript entry |
| chip-in | **240ms**, 40ms stagger | quick replies |
| nudge | **600ms**, once | launcher attention cue |
| sheet-in (mobile) | **400ms** | full-height panel |

All values sit below `ClientHeader`'s `ROLL_DURATION = 0.9s` (`ClientHeader.tsx:174`) so the pod never competes with the header for attention.

### 1.2 Launcher → panel

The panel scales **from the launcher's origin**, not from the viewport centre:

```
transform-origin: bottom right;             /* desktop, right-anchored */
from: scale(0.92) translateY(12px); opacity 0
to:   scale(1)    translateY(0);    opacity 1
```

Mobile (below `MOBILE_MOTION_BREAKPOINT`, via `shouldUseMobileMotion()` from `src/app/lib/motion.ts`):

```
from: translateY(100%)
to:   translateY(0)          /* full sheet, 400ms */
scrim: rgba(0,0,0,0.4), opacity 0 → 1, FLAT — no backdrop-filter, no blur
```

Origin is computed once on open from the launcher's `getBoundingClientRect()` and written to a CSS custom property, so the panel grows out of the button the visitor actually pressed rather than out of a hard-coded corner.

### 1.3 Messages

```
assistant message:  translateY(8px) → 0, opacity 0 → 1, 300ms
visitor message:    translateY(4px) → 0, opacity 0 → 1, 220ms   /* the visitor's own text should not perform */
card message:       same as assistant, contents fade 60ms later
```

New messages scroll the transcript with `scrollIntoView({ block: "end" })` **only if the visitor is already within 80px of the bottom**. If they have scrolled up to read, the pod must not yank them; instead a single `New message` pill appears at the transcript foot.

### 1.4 Typing indicator

Three dots, 6px, `#666666`, 1.3s loop, 130ms stagger between dots, `opacity 0.3 → 1 → 0.3`.

**Two rules make this honest rather than theatrical:**

1. It renders inside a container with a **reserved height** equal to one message row, so the transcript never jumps when it appears or disappears. This is the CLS-0 requirement in practice.
2. It is shown for a **minimum of 320ms and a maximum of 900ms**, and only before a canned answer. It never pretends to think for longer than the answer takes to resolve — the resolution is synchronous, and a fake three-second delay is a lie. It exists to prevent a message popping in faster than the eye can track, nothing more.

### 1.5 Chips

- Appear above the composer, not inside the transcript flow, so they stay reachable after scrolling.
- Stagger 40ms, `translateY(6px) → 0`, 240ms.
- **Dismissed on selection** — the chosen chip's label becomes the visitor's message and the row animates out in 180ms. Dangling chip rows that no longer apply are the most common chat-widget slop.
- A new chip row replacing an old one crossfades (old out 140ms, new in 240ms, 60ms overlap).

### 1.6 Launcher idle nudge

**One nudge. Per session. Conditional.**

```
if (!sessionStorage["mubi.pod.nudged"]
    && idleMs >= 20000
    && scrollDepthPct <= 50
    && !prefersReducedMotion()) {
  nudge();                            // launcher scales 1 → 1.04 → 1 over 600ms, once
  sessionStorage["mubi.pod.nudged"] = "1";
}
```

Rejected outright: looping pulse, shake, glow, badge count with a fake "1", sound, auto-open on load, an eyebrow that waves. All are attention bait with no information content (R-13, R-09).

### 1.7 Send affordance

Send button 44×44px, `#ea002a` fill, white glyph. On press: `scale(0.96)` for 90ms. On empty input: `aria-disabled="true"`, fill drops to `#cccccc`, **still focusable**, `title` explains why. Never the `disabled` attribute.

### 1.8 Persona photo

Static image, no ken-burns, no parallax, no blink, no breathing. 40px circle in the header, 2px hairline ring `rgba(0,0,0,0.08)`. The photo is identity, not animation.

### 1.9 Reduced motion

Per-component `prefers-reduced-motion` blocks, matching the codebase convention (no global kill block):

```scss
@media (prefers-reduced-motion: reduce) {
  .panel, .message, .chip, .launcher {
    animation: none;
    transition: opacity 150ms linear;
    transform: none;
  }
}
```

The pod must be fully usable with every transform removed. Read via `prefersReducedMotion()` from `src/app/lib/motion.ts:14-20` for the JS-side gates (nudge, typing indicator).

### 1.10 Lenis interaction

On panel open: `window.dispatchEvent(new CustomEvent("menu:open"))`. On close: `"menu:close"`.
`SmoothScrollProvider.tsx:392-411` already calls `lenis.stop()` / `lenis.start()` on these. **No provider changes required** — the pod joins an existing contract. The transcript's internal scroll is then never fought by smooth scroll.

### 1.11 GSAP or CSS?

Default is **CSS transitions**. The pod's motion is state-shaped (open/close/in/out), which is exactly what CSS does well and what keeps the chunk small. GSAP (`gsap 3.14` + `@gsap/react`, already a dependency) is used only if the persona reveal in M6 genuinely needs a timeline CSS cannot express. Decision recorded in M6 either way; "we used GSAP because it is there" is not a reason.

---

## 2. Accessibility contract

### 2.1 ARIA structure

```
<button aria-label="Chat with Ubi, our digital assistant" aria-expanded="false" aria-haspopup="dialog">   ← launcher
<div role="dialog" aria-labelledby="pod-title" aria-modal="false">                                        ← panel
  <header>
    <img alt="" aria-hidden="true">                        ← decorative; the name is text
    <h2 id="pod-title">Ubi</h2>
    <p>Digital assistant <span class="srOnly">. This is an automated assistant, not a person.</span></p>
    <button aria-label="Close chat">×</button>
  </header>
  <div role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation">                 ← transcript
  <div role="group" aria-label="Suggested replies">                                                       ← chips
  <form>                                                                                                  ← composer
    <label class="srOnly" for="pod-input">Message</label>
    <input id="pod-input" type="text" autocomplete="off">
    <button type="submit" aria-disabled="true">Send</button>
  </form>
</div>
```

Rules:

- **One** live region. `aria-live="polite"` on the transcript container only. Putting it on individual messages double-announces and is the most common chat-widget a11y bug.
- `aria-relevant="additions"` — the visitor's own echoed message and the assistant reply both announce, but removals (dismissed chips) do not spam.
- `aria-modal="false"` — the pod is a non-modal dialog. The page behind stays reachable by screen reader, which is correct for an assistant that coexists with the content. Focus is nonetheless trapped while open (§2.2) because that is what a dialog user expects from `Esc`-dismissal behaviour.
- The AI disclosure has a `.srOnly` expansion (`ClientHeader.module.scss:237-241` pattern) so the visual stays two words and the screen-reader version is explicit.
- Every chip is a real `<button>` in DOM order after the message that spawned it.
- Timestamps are `aria-hidden` and carry an `.srOnly` full date; visual is `14:02`, announced is `14:02, 1 Nov 2026`.

### 2.2 Keyboard

| Key | Behaviour |
|---|---|
| `Tab` / `Shift+Tab` | Cycles launcher → close → transcript controls → chips → composer → send → back to launcher. Trapped while the panel is open. |
| `Enter` | In composer: send. On a chip: select. |
| `Esc` | Closes the panel **and returns focus to the launcher**. If focus is in the composer during intake, `Esc` first exits intake to chat (state retained), then closes on a second press. |
| `↑` / `↓` | Moves through the chip row when focus is inside it (roving tabindex). |
| `Ctrl`/`Cmd` + `Enter` | Skips the current optional slot during intake. Announced in the slot's own copy. |

Full intake must be completable with keyboard only. This is an acceptance gate (§06), not an aspiration.

### 2.3 Focus management

- On open: focus moves to the composer input (desktop) or to the close button (mobile sheet, where the input would summon the keyboard over the transcript).
- On close: focus returns to the launcher. Always.
- On a new chip row appearing: focus is **not** moved. Chips are announced by the live region; stealing focus would break reading.
- On `EDIT_SLOT` during review: focus moves to the composer, and the slot's question is announced.
- Visible focus everywhere: `outline: 2px solid $client-accent-red; outline-offset: 4px` (`client-mixins.scss:78-81`). No `outline: none` anywhere in the module.

### 2.4 Contrast (measured, not assumed)

| Pair | Ratio | Verdict |
|---|---|---|
| `#0a0a0a` on `#ffffff` | 19.4:1 | pass |
| `#444444` on `#ffffff` | 9.7:1 | pass |
| `#666666` on `#ffffff` | 5.7:1 | pass (body) |
| `#767676` on `#ffffff` | 4.54:1 | pass — **the floor for meta/timestamp text** |
| `#ea002a` on `#ffffff` | 4.63:1 | pass AA |
| `#ea002a` on `#fafafa` | **4.44:1** | **FAIL** |
| `#ffffff` on `#ea002a` | 4.63:1 | pass AA |

**Consequence baked into the design:** assistant bubbles sit on `#ffffff`, bordered by the hairline `rgba(0,0,0,0.08)`. **No tinted bubble background anywhere in the pod.** The transcript backdrop is pure white. Visitor bubbles use `#0a0a0a` fill with `#ffffff` text (19.4:1), which also gives the two speakers a clear visual distinction without needing colour.

Verify with the `antislop-human` contrast checker before M7 sign-off.

### 2.5 Target sizes and layout

- Launcher 56×56px. Close, send, chips, menu items: minimum 44×44px (`client-mixins.scss:55`).
- Chip row wraps; no horizontal scroll of chips on mobile.
- Transcript scrolls internally; the page behind does not scroll while the panel is open (via the Lenis stop).
- **Zero horizontal overflow** at 390 / 768 / 1024 / 1440 / 1680 — gate in §06.
- Mobile keyboard: `visualViewport` `resize` + `scroll` listeners pin the composer above the keyboard; the sheet shrinks rather than the page scrolling.

### 2.6 The launcher collision

`FloatingExploreButton.tsx` already occupies a bottom corner and gates its mount on `initial-loader:complete`. Two floating controls in one corner is unacceptable. Resolution, decided and **measured in the browser** in M2:

- **Preferred:** the two merge into a single stacked rail (explore above, pod below), sharing one mount gate and one animation language.
- **Fallback:** pod bottom-right, explore bottom-left, both 24px from the edges.

Whichever is chosen, the collision is resolved before any other pod work continues. Shipping both overlapping is a Hard Gate failure.

---

## 3. antislop scan — the module's own tells, pre-empted

| Risk | Where it would appear | Pre-empted by |
|---|---|---|
| Generic AI icons (sparkle, robot, orb) | send button, launcher, persona | Real glyphs only: a paper-plane or arrow for send, the persona photo for the launcher. No sparkle. |
| Capsule badges with glow and a dot ("AI Powered") | panel header | The badge is 11px mono uppercase text with a hairline, no dot, no glow, and it says `Digital assistant · Not a person`, not `AI Powered` |
| Excessive border radius | bubbles, chips, panel | 2px radius, the canon's value. Bubbles are 2px, not 18px pills |
| Overly soft shadows | panel elevation | **Zero box-shadows.** Elevation comes from a 1px hairline and the flat scrim |
| Glassmorphism | panel, scrim | None. Solid white panel, flat `rgba(0,0,0,0.4)` scrim |
| Colored left stripe on bubbles | assistant messages | Speaker distinction is fill + alignment, not a decorative stripe |
| Small arrows on every button | chips, send | Arrows only where direction is the meaning (a route chip). Not on send |
| Emoji as decoration | answers, chips | Zero emoji in any string. Enforced by a regex sweep in the copy test |
| Fake statistics | answers | Only `kb.counts`, computed from real arrays. Enforced by `knowledge-source-coverage.test.ts` |
| Non-functional controls | chips, menu | Every chip has a real `intentId`, `route`, or FSM event. Enforced by a compile-time exhaustiveness check |
| Happy-path only | submit errors, empty states, no-JS | §01 §9 error table; `noscript` leaves the launcher out entirely rather than rendering a dead button |
| Dead navigation | route chips | Every `route` action is checked against the app router's real page list at build time |
