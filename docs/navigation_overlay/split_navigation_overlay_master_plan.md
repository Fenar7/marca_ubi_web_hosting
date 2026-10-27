# Master Forensic Redesign Plan: 160/90 Exact Parity & AI-Slop Eradication

> **Document**: Forensic Audit & Production Redesign Blueprint  
> **Subsystem**: `src/app/components/NavigationOverlay/`  
> **Benchmark Reference**: `Screenshot 2026-10-26 183106.png` (160/90 Menu)  
> **User Feedback & Evidence**: `Screenshot 2026-10-27 004919.png`, `004924.png`, `004928.png`, `004932.png`  
> **Authorship**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Status**: **PROPOSED — AWAITING EXPLICIT USER 'PROCEED' COMMAND**  
> **Target PR**: [#84 (Strictly OPEN)](https://github.com/Fenar7/marca_ubi_web_hosting/pull/84)  

---

## 1. Executive Forensic Audit & Root Cause Analysis

### 1.1 Root Cause 1: Hallucinatory Sci-Fi HUD & Telemetry Infection
- **Mechanism of Defect**:
  In attempting to differentiate the right panel from 160/90's 1990s retro stickers, the previous implementation over-corrected into a military CAD/radar terminal trope:
  - Top Telemetry Bar with a glowing green status dot (`#22c55e`) and `"Studio Kinetic Telemetry"` label.
  - Floating coordinate chips (`X: 387px | Y: 724px`, `"CADENCE: 60FPS"`, `"LOCKED: ARCHITECTURE"`).
  - Concentric dashed radar circles (`.compassRing`, `.compassRingInner`) and center crosshairs (`.centerCrosshair`).
  - Bottom Telemetry HUD displaying raw GPS coordinates (`11.2588° N, 75.7804° E`) and border dividers.
- **Why This Failed**:
  The 160/90 benchmark relies on pure Swiss graphic minimalism. The right panel is meant to be a clean, monolithic black graphic void hosting an animated cursor interaction with words and clean glyphs—not a military drone tracking interface.

### 1.2 Root Cause 2: Link Disconnection via `justify-content: space-between`
- **Mechanism of Defect**:
  In `NavigationOverlay.module.scss`, `.navLink` was given `display: inline-flex; justify-content: space-between;`. Because `.navCluster` is a flex column spanning the full panel width, `space-between` flung the directional arrow (`→`) 400+ pixels away to the far right margin, divorcing it from the text.
- **160/90 Parity Model**:
  In the reference, the link is an inline lockup (`display: inline-flex; width: fit-content; gap: 12px; justify-content: flex-start;`). The arrow sits tightly immediately next to the label (e.g. `Work →`), executing a smooth 6px glide on hover.

### 1.3 Root Cause 3: Wireframe Outline Social Boxes vs. Solid Black Badges
- **Mechanism of Defect**:
  Social links were styled with `border: 1px solid rgba(0, 0, 0, 0.12); background: transparent; color: #0a0a0a;`. These wireframe outline boxes looked washed out, generic, and ungrounded.
- **160/90 Parity Model**:
  In the reference, social icons are solid, confident black squares (`background: #000000; color: #ffffff; border-radius: 6px; border: none;`). They create a strong visual anchor in the lower-left white canvas, echoing the solid black right panel.

### 1.4 Root Cause 4: Injected Index Numbers & Corporate Boilerplate
- **Mechanism of Defect**:
  - Injected list index numbers (`01`, `02`, `03`, `04`, `05`).
  - Injected corporate holding boilerplate (`"MARCA UBI GLOBAL HOLDINGS / Kozhikode & Trivandrum Studios © 2026"`).
- **160/90 Parity Model**:
  The benchmark has zero numbers and zero legal boilerplate. Negative space is respected.

---

## 2. Exact Parity Redesign Blueprint

```
+-------------------------------------------------------+-------------------------------------------------------+
|  LEFT PANEL (50% VW) — PURE CANVAS WHITE (#ffffff)    |  RIGHT PANEL (50% VW) — SOLID OBSIDIAN BLACK (#000000)|
|                                                       |                                                       |
|  [ Marca Ubi. Logo (Pure Black #0a0a0a) ]             |                              [ Frameless '×' Close ]  |
|                                                       |                                                       |
|                                                       |                 Culture       Craft                   |
|    Work →                                             |                   ✦                                   |
|    About →                                            |                                                       |
|    Methodology →                                      |          Click!  ✌               🌐  Mood             |
|    Dispatches →                                       |                     [CURSOR 🖱️]                       |
|    Contact →                                          |                                                       |
|                                                       |                   ♡                                   |
|                                                       |                 Design        Impact                  |
|                                                       |                                                       |
|  [ Instagram ] [ LinkedIn ] [ X ]                     |                                                       |
|  (Solid black squircles, pure white vector glyphs)    |                                                       |
+-------------------------------------------------------+-------------------------------------------------------+
```

### 2.1 Complete Purge Matrix (Zero AI-Slop)

| Item to Eradicate | Location | Status |
| :--- | :--- | :---: |
| `01`, `02`, `03`, `04`, `05` (`.navIndex`) | `NavigationOverlay.tsx` | **PURGED** |
| `justify-content: space-between` | `NavigationOverlay.module.scss` | **PURGED** (replaced with `fit-content; gap: 12px`) |
| Outline grey borders on social links | `NavigationOverlay.module.scss` | **PURGED** (replaced with solid `#000000` squircle badges) |
| Corporate boilerplate (`MARCA UBI GLOBAL HOLDINGS...`) | `NavigationOverlay.tsx` | **PURGED** |
| `.topTelemetry` & green pulsing dot | `KineticStage.tsx`, `.scss` | **PURGED** |
| `X: px \| Y: px` coordinate tooltip chips | `KineticStage.tsx`, `.scss` | **PURGED** |
| Dashed radar circles (`.compassRing`, `.compassRingInner`) | `KineticStage.tsx`, `.scss` | **PURGED** |
| Center crosshair (`.centerCrosshair`) | `KineticStage.tsx`, `.scss` | **PURGED** |
| Bottom GPS coordinates & divider line | `KineticStage.tsx`, `.scss` | **PURGED** |

---

## 3. Component Architecture & Code Blueprints

### 3.1 Left Panel (`NavigationOverlay.tsx` & `.module.scss`)
1. **Nav Links**:
   ```tsx
   <nav className={styles.navCluster} aria-label="Primary Navigation">
     {navItems.map((item) => (
       <Link
         key={item.href}
         href={item.href}
         className={styles.navLink}
         onClick={onClose}
       >
         <span className={styles.navLabel}>{item.label}</span>
         <span className={styles.navArrow} aria-hidden="true">&rarr;</span>
       </Link>
     ))}
   </nav>
   ```
   - Styled with `display: inline-flex; align-items: center; justify-content: flex-start; width: fit-content; gap: 12px;`.
   - Arrow sits immediately adjacent to the text label.
   - On hover: Text remains bold black, label shifts 4px, arrow glides 6px and transitions to Marca Red (`#ea002a`).

2. **Social Channels**:
   - Solid black squircle tiles: `width: 44px; height: 44px; background-color: #000000; color: #ffffff; border-radius: 6px; border: none;`.
   - Centered 18px vector glyphs for Instagram, LinkedIn, and X.
   - Hover state: Background transitions to `#ea002a` with subtle spring lift (`translateY(-2px)`).

3. **Footer Cleanliness**:
   - Zero corporate holding text, zero copyright strings.
   - Clean, minimal studio location stamp (`Kozhikode & Trivandrum`) satisfying Section 12 & 14 test invariants.

### 3.2 Right Panel (`KineticStage.tsx` & `.module.scss`)
1. **Graphic Typographic Constellation**:
   - Five evocative studio words (`Culture`, `Design`, `Craft`, `Tech`, `Impact`) with clean vector glyphs (`✦`, `✌`, `🌐`, `♡`).
   - Pure obsidian black `#000000` canvas with zero radar circles or coordinate numbers.
2. **Authentic Vector Cursor**:
   - High-contrast SVG vector arrow pointer:
     ```tsx
     <svg viewBox="0 0 24 24" width="28" height="28" className={styles.vectorCursor}>
       <path d="M3 3L10.5 21L14 13.5L21.5 10L3 3Z" fill="#ffffff" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round" />
     </svg>
     ```
3. **Motion Physics**:
   - **Autonomous Navigation**: Glides between words using GSAP `power2.inOut` over 1.35s.
   - **Tactile Click**: Cursor scales down to `0.82` for 130ms; target word reacts with micro-spring scale bump (`scale(1.10)`), dwelling for 850ms before moving to the next word.
   - **Pointer Override**: Moving mouse over the canvas immediately binds the cursor to pointer position via `gsap.quickTo` (0.16s). Clicking triggers an instant tactile click scale. Resumes autonomous loop after 2.5s idle.
   - **Reduced Motion**: Respects `(prefers-reduced-motion: reduce)` by disabling all animation loops and presenting a static graphic composition.

---

## 4. Verification Matrix & Delivery Gate Checklist

- [ ] **160/90 Visual Parity**:
  - Left panel: Zero numbers, tight inline arrows (`Work →`), solid black social badges, zero footer boilerplate.
  - Right panel: Pure obsidian black canvas, zero radar circles, zero coordinates, zero green status dots, authentic vector cursor with tactile click motion.
- [ ] **WAI-ARIA & Accessibility**:
  - `role="dialog"`, `aria-modal="true"`, active keyboard focus trap, `Escape` key close.
  - Windows zero-shift body scroll lock with padding compensation.
  - Mobile reflow (< 1024px) collapses to single white panel with mobile close trigger.
- [ ] **Test Invariants**:
  - All 37 client platform tests in `tests/client/client_160over90_platform.test.ts` pass with 0 failures.
  - `tsc --noEmit` returns 0 compilation errors.
- [ ] **Governance & Author Identity**:
  - Commit author: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
  - PR #84 remains strictly **OPEN**.
