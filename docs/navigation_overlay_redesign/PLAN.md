# Architectural Implementation Plan: Anchored In-Place Header Disciplines & Hamburger Menu Redesign

**PR Target:** [PR #91](https://github.com/Fenar7/marca_ubi_web_hosting/pull/91) (`refactor/master-brand-and-kinetic-refinements` -> `master`)  
**Design Direction:**
1. **Scrolled Header Text**: Stationary, anchored immediately to the right of the logo on the left side of the capsule. Zero horizontal left-to-right translation. In-place vertical morphing transition continuously cycling through the 12 core disciplines from `ProcessCurtain.tsx`.
2. **Hamburger Menu Drawer**: Clean Swiss editorial layout based on [Whoa Mama Design](https://whoamama.com/) with **Helvetica Neue Light**, all-lowercase typography, eradication of heavy `→` arrows, and preservation of Marca Ubi brand colors.

---

## 1. Root Cause Analysis & Design Rationalization

### A. Scrolled Header Kinetic Morphing
- **User Problem & Symptom**:
  Horizontal left-to-right traveling tickers inside a compact floating header capsule create visual clutter, potential collision with the hamburger menu trigger, and reading fatigue.
- **Root Solution**:
  Anchor the dynamic text at the left boundary of the capsule, positioned directly adjacent to the `Marca Ubi.` logo (similar to an active digital subtitle).
- **In-Place Morphing Mechanics**:
  Instead of horizontal translation (`x: 0 -> maxDistance`), the text stays stationary at `x: 0`. A smooth vertical kinetic morph (`y: 6px -> 0px -> -6px`, `opacity: 0 -> 1 -> 0`, `filter: blur(2px) -> blur(0px) -> blur(2px)`) cycles through the **12 canonical disciplines**:
  1. `Brand Strategy`
  2. `Visual Identity Systems`
  3. `Creative Direction`
  4. `Culture Marketing`
  5. `Experiential Production`
  6. `Digital Infrastructure`
  7. `Creative Technology`
  8. `Motion & Cinema`
  9. `Campaign Architecture`
  10. `Editorial Systems`
  11. `High-Growth GTM`
  12. `Spatial Brand Design`
- **Cadence**: 2.8s display hold per discipline with 0.45s fluid cubic-bezier transition.

---

### B. Hamburger Navigation Drawer (Whoa Mama Benchmark)
- **User Problem & Current State (`Screenshot 2026-10-28 152756.png`)**:
  Current menu uses bold Circular XX font in Title Case (`Work →`, `Services →`, etc.) with heavy directional arrows.
- **Target State (`Screenshot 2026-10-28 152012.png` & `whoamama.com`)**:
  - **Typeface**: **Helvetica Neue Light** (`HelveticaNeue-Light`, weight: `300` / `400 Light`).
  - **Casing**: Clean **all-lowercase** (`work`, `services`, `locations`, `careers`, `contact`).
  - **Arrow Eradication**: Remove the `→` arrows entirely for serene editorial confidence.
  - **Scale & Rhythm**: `font-size: clamp(3rem, 4.8vw, 4.5rem)`, `line-height: 1.1`, `letter-spacing: -0.015em`.
  - **Secondary Cluster**: Clean secondary links beneath main nav (Instagram, LinkedIn, X).
  - **Baseline**: `Copyright 2026 © Marca Ubi` at the bottom.
  - **Color Discipline**: Preserves existing Marca Ubi colors (`#ffffff` left panel, `#000000` dark kinetic stage, `#0a0a0a` text, `#ea002a` Brand Red hover accent).

---

## 2. Technical Execution Breakdown

### Step 1: Reference Font Integration (`public/fonts/helvetica/` & `src/app/fonts.ts`)
- Place extracted `HelveticaNeue-Light.otf` and `HelveticaNeue-Roman.otf` in `public/fonts/helvetica/`.
- Register in `src/app/fonts.ts` via Next.js `localFont`:
  ```ts
  export const helveticaNeue = localFont({
    src: [
      { path: "../../public/fonts/helvetica/HelveticaNeue-Light.otf", weight: "300", style: "normal" },
      { path: "../../public/fonts/helvetica/HelveticaNeue-Roman.otf", weight: "400", style: "normal" },
    ],
    variable: "--font-helvetica-neue",
    display: "swap",
  });
  ```
- Expose `$font-helvetica: var(--font-helvetica-neue), "Helvetica Neue", -apple-system, sans-serif;` in `client-tokens.scss`.

### Step 2: Anchored In-Place Header Disciplines Engine (`ClientHeader.tsx`)
- Replace the dual horizontal traveling carriers with an anchored in-place morpher:
  ```tsx
  <div className={styles.disciplinesAnchor}>
    <span className={styles.disciplineGhost} aria-hidden="true">
      Experiential Production
    </span>
    <span ref={disciplineTextRef} className={styles.disciplineText}>
      Brand Strategy
    </span>
  </div>
  ```
- GSAP Timeline: In-place vertical roll-up and cross-fade with 2.8s display interval.
- Micro-interactions: Pause on hover, resume on leave, reduced motion fallback, zero memory leaks.

### Step 3: SCSS Modernization for Scrolled Header (`ClientHeader.module.scss`)
- Remove `.streamTrack`, `.kineticCarrier`, and mask-based horizontal travel.
- Add `.disciplinesAnchor`:
  - `display: inline-flex; align-items: center; position: relative; margin-left: 1.25rem;`
  - `.disciplineText`: `font-family: $font-circular; font-size: 13.5px; font-weight: 500; color: inherit; letter-spacing: 0.02em;`
  - Hover accent: `$client-accent-red` (`#ea002a`).

### Step 4: Hamburger Menu Redesign (`NavigationOverlay.tsx` & `.module.scss`)
- In `NavigationOverlay.tsx`:
  - Lowercase navigation labels: `work`, `services`, `locations`, `careers`, `contact`.
  - Remove `.navArrow` and SVG markup.
  - Add bottom copyright: `Copyright 2026 © Marca Ubi`.
- In `NavigationOverlay.module.scss`:
  - Apply `$font-helvetica` to `.navLink` with `font-size: clamp(3rem, 4.8vw, 4.5rem); font-weight: 300; line-height: 1.1; letter-spacing: -0.015em;`.
  - Smooth Brand Red hover accent (`color: $client-accent-red; transform: translateX(6px);`).
  - Maintain 48px touch targets.

### Step 5: Verification & Independent CTO Audit
- Run `tests/client/client_160over90_platform.test.ts` (updated to assert Helvetica Neue font, anchored header disciplines, and arrow eradication).
- Run `npm run test:boundaries` and `npx tsc --noEmit`.
- Commit as `Fenar7` and push to PR #91 (strictly open).
