# Marca Ubi Master Brand & Kinetic Motion Refinement Plan

**Document Version**: 1.0.0  
**Status**: DRAFT (Awaiting Explicit Human Approval)  
**Author**: Fenar7 `<86710532+Fenar7@users.noreply.github.com>`  
**Governing Standard**: `AGENTS.md` & `DESIGN.md` (Anti-AI-Slop Commandments R-01 to R-38)

---

## 1. Executive Summary & Objective

Based on direct visual inspection of screenshots (`115957`, `120155`, `120546`, `120623`) and user instructions, this architectural blueprint details five high-impact brand, typography, and motion enhancements:

1. **MonumentalFooter Anthem Headline & Trailing Red Dot**:
   - Update anthem text to: `Imagine limitless. Create limitless.`
   - Isolate the terminal period (`.`) with Marca Ubi Brand Red (`#ea002a`).
2. **ClientHeader At-Rest Subtitle** (`Screenshot 115957`):
   - Position `The Brand Engineering Company` directly underneath the `Marca Ubi.` logo when at rest (`scrollY <= 50px`).
   - Adapts dynamically to light/dark curtains and transitions out smoothly on scroll.
3. **Scrolled Liquid Glass Floating Capsule Dynamic Kinetic Ticker** (`Screenshot 120155`):
   - When scrolled (`isScrolled`), host a horizontal kinetic ticker in the floating pill HUD between the logo and hamburger trigger.
   - Smoothly cycles from left to right across 5 company statements in an infinite loop:
     1. `The Brand Engineering Company`
     2. `The Brand Transformation Company`
     3. `The Identity & Art Systems Company`
     4. `The Digital Experience Design Company`
     5. `The Communication and Growth Company`
   - Incorporates edge gradient fading (`mask-image`), 60fps GPU acceleration, and responsive collision prevention.
4. **MonumentalFooter Legal Rail Brand Red Refinement** (`Screenshot 120546`):
   - Style bottom legal text (`© 2026 Marca Ubi Enterprise Agency. All rights reserved.`, `Privacy Architecture`, `Terms of Engagement`, `Security Protocol`) in Brand Red (`#ea002a`).
   - Validated at **4.53:1** contrast ratio against `#000000` (WCAG AA compliant).
5. **ConnectCutout Kinetic Traveling Red Wave** (`Screenshot 120623`):
   - In the 3-column studio desks cluster (`Contact`, `General Inquiries`, `Kerala Studios`), implement a continuous traveling red laser beam and sequential illumination wave sweeping from the left of Item 1 to the right of Item 3.

---

## 2. Component Architecture & Blueprint Specifications

### 2.1 MonumentalFooter Anthem & Trailing Red Dot
- **Target File**: `src/app/components/Sections/MonumentalFooter.tsx` & `MonumentalFooter.module.scss`
- **Markup**:
  ```tsx
  <div className={styles.anthemBlock}>
    <h2 className={styles.anthemHeadline}>
      Imagine limitless. Create limitless<span className={styles.accentDot}>.</span>
    </h2>
  </div>
  ```
- **SCSS**:
  ```scss
  .anthemHeadline {
    font-family: $font-circular;
    font-size: clamp(1.4rem, 2.6vw, 2.25rem);
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: #ffffff;
    margin: 0;
    text-align: center;
  }

  .accentDot {
    color: $client-accent-red;
    display: inline-block;
  }
  ```

---

### 2.2 ClientHeader At-Rest Subtitle & Architecture
- **Target File**: `src/app/components/ClientHeader/ClientHeader.tsx` & `ClientHeader.module.scss`
- **Hierarchy**:
  ```tsx
  <div className={styles.brandCluster}>
    <Link href="/" className={styles.logoAnchor} aria-label="Marca Ubi Homepage" onClick={closeDrawer}>
      <MarcaUbiLogo width={160} height={34} className={styles.brandLogo} />
    </Link>
    <span className={`${styles.logoSubtitle} ${isScrolled ? styles.subtitleHidden : ""}`}>
      The Brand Engineering Company
    </span>
  </div>
  ```
- **Styling & Physics**:
  - Font: `$font-circular`, 11px, weight 500, letter-spacing `0.08em`.
  - Contrast: `rgba(255, 255, 255, 0.75)` in `.isDark`, `rgba(10, 10, 10, 0.75)` in `.isLight`.
  - When `isScrolled` is triggered:
    ```scss
    .subtitleHidden {
      opacity: 0;
      transform: translateY(-4px);
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    ```

---

### 2.3 Scrolled Floating Capsule Dynamic Kinetic Ticker
- **Target File**: `src/app/components/ClientHeader/ClientHeader.tsx`
- **Ticker Array**:
  ```ts
  const BRAND_STATEMENTS = [
    "The Brand Engineering Company",
    "The Brand Transformation Company",
    "The Identity & Art Systems Company",
    "The Digital Experience Design Company",
    "The Communication and Growth Company",
  ] as const;
  ```
- **Kinetic Mechanics**:
  - The ticker mounts in `.capsuleTicker` placed between `.brandCluster` and `.navCluster`.
  - Only visible when `isScrolled` is true (opacity 1, scale 1).
  - Every 3.2s, the current statement glides forward from left to right:
    - Enters: `x: -24px, opacity: 0` -> smoothly eases into `x: 0px, opacity: 1` over 0.5s.
    - Dwells: 2.2s resting period for effortless reading.
    - Exits: `x: 24px, opacity: 0` over 0.5s.
  - Edge Masking:
    ```scss
    .capsuleTicker {
      overflow: hidden;
      mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
      -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
    }
    ```
  - Mobile Guard:
    - Hidden on screens `< 640px` to preserve pristine breathing room for the logo and the 48px hamburger touch target.

---

### 2.4 MonumentalFooter Bottom Legal Rail Brand Red Colors
- **Target File**: `src/app/components/Sections/MonumentalFooter.module.scss`
- **Color Calibration**:
  ```scss
  .bottomLegalBar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 2rem;
    font-family: $font-mono;
    font-size: 11px;
    color: $client-accent-red; // Brand Red #ea002a
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;

    span {
      color: $client-accent-red;
    }
  }

  .legalLink {
    color: $client-accent-red;
    text-decoration: none;
    transition: color 0.2s ease, opacity 0.2s ease;

    &:hover {
      color: #ffffff;
      text-decoration: underline;
    }
  }
  ```
- **Accessibility**:
  - Luminance calculation: `#ea002a` on `#000000` = **4.53:1**, satisfying WCAG AA standards.

---

### 2.5 ConnectCutout Kinetic Traveling Red Wave
- **Target File**: `src/app/components/Sections/ConnectCutout.tsx` & `ConnectCutout.module.scss`
- **Visual Concept**:
  - A precision traveling laser beam sweeps along the hairline divider above the 3 desk items.
  - Synchronized sequential text illumination travels from `Contact` (left) across `General Inquiries` (center) to `Kerala Studios` (right).
- **SCSS Implementation**:
  ```scss
  .desksCluster {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin-top: 1.5rem;
    padding: 1.75rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);

    // Traveling Red Laser Beam Rail
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 0;
      width: 140px;
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, #ea002a 50%, transparent 100%);
      box-shadow: 0 0 12px rgba(234, 0, 42, 0.7);
      animation: travelingLaserSweep 6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      pointer-events: none;
    }
  }

  @keyframes travelingLaserSweep {
    0% {
      left: 0%;
      transform: translateX(-100%);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      left: 100%;
      transform: translateX(0%);
      opacity: 0;
    }
  }

  .deskItem {
    animation: sequentialIllumination 6s ease-in-out infinite;

    &:nth-child(1) {
      animation-delay: 0s;
    }
    &:nth-child(2) {
      animation-delay: 1.8s;
    }
    &:nth-child(3) {
      animation-delay: 3.6s;
    }
  }
  ```

---

## 3. Verification & Delivery Gate Strategy

1. **Automated Test Coverage**:
   - Update `tests/client/client_160over90_platform.test.ts` to assert:
     - `anthemHeadline` renders `"Imagine limitless. Create limitless."` with red dot.
     - `ClientHeader` contains subtitle and dynamic ticker components.
     - `ConnectCutout` contains the kinetic wave structural hooks.
     - `MonumentalFooter` legal rail reflects red styling.
2. **TypeScript & Static Analysis**:
   - Run `npx tsc --noEmit` to ensure 0 type errors.
   - Run `npm test` to verify 100% test pass rate across all suites.
3. **Behavioral Governance**:
   - Maintain author identity: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
   - Never merge pull requests automatically (remain strictly `OPEN`).
   - Stop and await explicit user confirmation before executing.
