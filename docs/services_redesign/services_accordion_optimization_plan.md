# Services Accordion Architectural Optimization Plan
**Module:** `src/app/components/Sections/ServicesAccordion/`  
**Components:** `ServicesAccordion.tsx`, `ServicesAccordion.module.scss`, `types.ts`  
**Author Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Status:** Audit & Plan Complete — Awaiting User Approval to Execute  

---

## 1. Problem Diagnostics (From Screenshot Analysis)

1. **Title Font Severing Words Mid-Character:**
   - In `ServicesAccordion.module.scss`, `.overlayTitle` has:
     ```scss
     font-size: clamp(3.2rem, 9vw, 8.5rem); // up to 136px
     line-height: 0.82;
     overflow-wrap: anywhere;
     ```
   - In an expanded card (~460–560px wide), long words cannot fit and are severed mid-syllable (`INFLUENC` / `ER`, `MARKETIN` / `G`).
   - The title is positioned at the bottom (`margin: auto 0 0`), causing a direct spatial collision with the resting card title (`.restingTitle`).

2. **Jerky / Broken Panel Expansion Animation:**
   - `.cardColumn` declares `transition: flex-basis 0.55s ...`, but the hover state sets `flex-grow: 4` without transitioning `flex-grow`.
   - As a result, the card expansion **snaps immediately with zero transition interpolation**.
   - Hovering near card boundaries causes cursor fluttering and rapid layout recalculation.
   - Mounting the `<video>` synchronously on active triggers main-thread decode jank right at Frame 0 of the transition.

3. **Mobile Crushing & Swipe Conflict:**
   - Cards lack minimum widths (`flex: 1 1 0; min-width: 0`). On 375px mobile screens, all 8 cards get crushed into 46px slivers.
   - Raw `onTouchStart` triggers expansion on initial finger touch, conflicting with horizontal swiping.

---

## 2. Engineering Solutions

### A. Fluid 60fps Motion Architecture
1. **Synchronized Flex Transition:**
   ```scss
   transition: flex-grow 0.55s cubic-bezier(0.16, 1, 0.3, 1),
               flex-basis 0.55s cubic-bezier(0.16, 1, 0.3, 1),
               filter 0.35s ease;
   contain: layout paint;
   will-change: flex-grow, flex-basis;
   ```
2. **Decouple Video Decoder Jank:**
   - Keep Next.js `<Image>` poster permanently as the base layer.
   - Fade video in smoothly over `0.4s` once `onPlaying` fires, eliminating Frame 0 stalls.
3. **Stabilized Hover Intent:**
   - Debounce mouse enter (40ms) and clear active state only when pointer leaves the `.cardsRow` container.

### B. Swiss Editorial Typography & Layout Hierarchy
1. **Refined Font Scale:**
   - Change `.overlayTitle` to `clamp(1.75rem, 2.8vw, 2.5rem)` (mobile: `clamp(1.45rem, 5.5vw, 1.85rem)`).
   - Set `overflow-wrap: normal; word-break: normal; hyphens: none; text-wrap: balance;`.
2. **Top-to-Bottom Editorial Flow (Zero Text Collision):**
   - Move title to the top under the metadata header (`04` + `B2B Enterprise`), followed by description, and place the 2-column "WHAT WE DO" bullet grid at the bottom.
   - Separates active text completely from the bottom-anchored resting title footprint.

### C. Responsive Mobile Design
1. **Desktop (1280px+):**
   - Inactive: `flex: 1 1 0%; min-width: 100px;`
   - Active: `flex: 4 1 0%; flex-basis: 440px;`
2. **Tablet (768px - 1024px):**
   - Inactive: `flex: 0 0 130px; min-width: 130px;`
   - Active: `flex: 0 0 420px; min-width: 420px;`
3. **Mobile (375px - 480px):**
   - Active: `flex: 0 0 82vw; min-width: 300px; max-width: 360px; scroll-snap-align: start;`
   - Inactive: `flex: 0 0 76px; min-width: 76px;` (preview tabs).
   - Touch: Replace raw `onTouchStart` with `onClick` on `.cardTrigger`. Tapping a card smoothly centers it using `.scrollIntoView({ behavior: 'smooth', inline: 'center' })`.

---

## 3. Execution Plan
1. Create dedicated branch: `redesign/services-cards-smooth-motion`.
2. Update `src/app/components/Sections/ServicesAccordion/ServicesAccordion.module.scss`.
3. Update `src/app/components/Sections/ServicesAccordion/ServicesAccordion.tsx`.
4. Run `npx tsc --noEmit` to verify 0 type errors.
5. Create Pull Request and keep it strictly `OPEN`.
