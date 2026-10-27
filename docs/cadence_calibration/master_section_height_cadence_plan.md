# Architectural Plan: Cadence Calibration — Compact Statement Curtain & Letterbox Reel Cutout

> **Document Location**: `docs/cadence_calibration/master_section_height_cadence_plan.md`  
> **Status**: **AWAITING USER CONFIRMATION TO EXECUTE ("proceed")**  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Target Branch**: `refactor/kinetic-stage-scatter-and-operational-rail-removal` (or new sub-branch)  
> **Target PR**: PR #87 (strictly **OPEN**)

---

## 1. Executive Summary & Visual Directives

### A. The Client's Observation
The user provided 4 comparative screenshots:
1. **Current Marca Ubi**:
   - `Screenshot 2026-10-27 182649.png`: Statement Curtain takes up 100% of the screen height due to massive vertical padding (`11.5rem` / `12vw`).
   - `Screenshot 2026-10-27 182708.png`: Reel Cutout is explicitly styled as `height: 100dvh; min-height: 650px;`, occupying the full vertical viewport.
2. **Benchmark Reference (160over90)**:
   - `Screenshot 2026-10-27 182806.png`: Reel Cutout is an **editorial letterbox aperture** (not full 100dvh), allowing viewers to see the surrounding context and creating a cinematic horizontal window reveal.
   - `Screenshot 2026-10-27 182820.png`: Statement Curtain is a **compact, balanced white band** (not full 100vh), where the statement is legible in a single cohesive view without consuming the whole viewport.

### B. Core Architectural Goal
Recalibrate the vertical proportions of:
1. **`StatementCurtain`** (`View 04`): Reduce excessive top/bottom padding and refine container width to create a refined editorial statement band.
2. **`ReelCutout`** (`View 03`): Replace rigid `100dvh` with an authentic cinematic letterbox aperture (`clamp(460px, 68vh, 680px)`), matching the 160over90 benchmark reference.

---

## 2. Technical Audit & Dimensional Specifications

### A. Reel Cutout Calibration ([`ReelCutout.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/ReelCutout.module.scss))

#### Before:
```scss
.reelCutoutSection {
  position: relative;
  width: 100%;
  height: 100dvh; // <-- Forces full screen takeover
  min-height: 650px;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: clamp(3rem, 6vw, 6rem) clamp(1.5rem, 5vw, 4.5rem);
  box-sizing: border-box;
}
```

#### After (Cinematic Letterbox Window):
```scss
.reelCutoutSection {
  position: relative;
  width: 100%;
  height: clamp(480px, 68vh, 700px); // <-- Cinematic letterbox aperture
  min-height: 480px;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: clamp(2.5rem, 5vw, 4.5rem) clamp(1.5rem, 5vw, 4.5rem);
  box-sizing: border-box;

  @media (max-width: 1024px) {
    height: clamp(420px, 62vh, 580px);
    min-height: 420px;
    padding: clamp(2rem, 4vw, 3.5rem) clamp(1.5rem, 4vw, 3rem);
  }

  @media (max-width: 768px) {
    height: auto;
    min-height: 380px;
    padding: 3rem 1.5rem;
  }
}
```

---

### B. Statement Curtain Calibration ([`StatementCurtain.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/StatementCurtain.module.scss))

#### Before:
```scss
.statementCurtainSection {
  position: relative;
  z-index: 10;
  width: 100%;
  background-color: $client-canvas-white;
  color: $client-text-dark;
  padding: clamp(6.5rem, 12vw, 11.5rem) clamp(1.5rem, 5vw, 5rem); // <-- Excessive padding causing full viewport inflation
  box-shadow: 0 -24px 60px rgba(0, 0, 0, 0.18);
  box-sizing: border-box;

  @media (max-width: 1024px) {
    padding: clamp(5rem, 9vw, 8rem) clamp(1.5rem, 4vw, 3rem);
  }

  @media (max-width: 768px) {
    padding: 4rem 1.5rem;
  }
}
```

#### After (Balanced Editorial Band):
```scss
.statementCurtainSection {
  position: relative;
  z-index: 10;
  width: 100%;
  background-color: $client-canvas-white;
  color: $client-text-dark;
  padding: clamp(4.5rem, 7.5vw, 7.5rem) clamp(1.5rem, 5vw, 5rem); // <-- Elegant editorial breathing room
  box-shadow: 0 -24px 60px rgba(0, 0, 0, 0.18);
  box-sizing: border-box;

  @media (max-width: 1024px) {
    padding: clamp(3.5rem, 6vw, 5.5rem) clamp(1.5rem, 4vw, 3rem);
  }

  @media (max-width: 768px) {
    padding: 3rem 1.5rem;
  }
}

.statementStage {
  width: 100%;
  max-width: 1100px; // Refined optical balance
}

.monumentalStatement {
  font-family: $font-circular;
  font-size: clamp(2rem, 3.6vw, 3.5rem); // Optical proportion harmony
  font-weight: 400; // CircularXXWeb-Book.woff2
  line-height: 1.32;
  letter-spacing: -0.01em;
  color: $client-text-dark;
  margin: 0;
  text-wrap: balance;
  word-break: break-word;
}
```

---

## 3. Invariant & Test Verification

1. **Theme Sensor Continuity**:
   - `ReelCutout` retains `data-header-theme="dark"` (test line 307).
   - `StatementCurtain` retains `data-header-theme="light"` (test line 308).
   - Sticky header IntersectionObserver continues to toggle between white and dark typography seamlessly.
2. **Typography Weight Invariant**:
   - `StatementCurtain` strictly maintains `font-weight: 400` (Circular XX Book) per test line 49.
3. **Automated Suite**:
   - Run `node --import tsx --test tests/client/client_160over90_platform.test.ts` to confirm 37/37 passing (100%).
