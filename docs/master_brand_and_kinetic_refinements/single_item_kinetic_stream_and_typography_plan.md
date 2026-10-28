# Marca Ubi Architectural Plan: Single-Statement Kinetic Stream & Typographic Hierarchy Polish

**Document Version**: 2.0.0  
**Status**: DRAFT (Awaiting Explicit Human Approval)  
**Author**: Fenar7 `<86710532+Fenar7@users.noreply.github.com>`  
**Governing Standard**: `AGENTS.md` & `DESIGN.md` (Anti-AI-Slop Commandments R-01 to R-38)

---

## 1. Executive Summary & Problem Diagnosis

Based on direct visual inspection of screenshots (`Screenshot 2026-10-28 123914.png` and `Screenshot 2026-10-28 123901.png`) and user feedback:

### Issue 1: Header Logo Subtitle is Too Small (`Screenshot 123914.png`)
- **Current State**: The subtitle `"The Brand Engineering Company"` underneath `Marca Ubi.` at rest is styled at `11px` (collapsing to `9.5px` on mobile) with wide `letter-spacing: 0.08em;` and `rgba(..., 0.75)` opacity.
- **Root Cause**: The 28px vector wordmark has a cap height of ~18px, while an 11px font has an x-height of only ~5.5px. It is visually overshadowed, reading like fine print rather than a confident corporate descriptor. Furthermore, `margin-top` was missing from the CSS transition properties, causing an abrupt layout jump on scroll.
- **Fix**: Elevate desktop font size to `13.5px` (`12.5px` tablet, `11.5px` mobile), tighten tracking to `0.025em`, increase opacity to `0.85` (**14.88:1 contrast** on black, **13.39:1** on white), expand container `max-height` to `24px`, and synchronize `margin-top` into the 0.35s Apple HIG deceleration curve.

### Issue 2: Ticker Structure Mismatch (`Screenshot 123901.png`)
- **Current State**: A continuous multi-item marquee ticker repeats all 5 statements simultaneously with `/` dividers in a constrained 540px centered aperture.
- **Root Cause & User Feedback**: The user explicitly rejected a repeating stock ticker:
  > *"this is not how i want this scrolling thing man, just ONE item moving from left to right, left means just after the logo to just before the hamburger, between this the text keeps changing"*
- **Fix**: Redesign the aperture and motion mechanics:
  1. Expand `.streamAperture` to span the full available liquid glass runway between the logo and hamburger menu (`flex: 1 1 0%` with horizontal margins).
  2. Display **exactly ONE statement** at a time (e.g., `The Brand Engineering Company`).
  3. The item starts immediately after the logo on the left, glides smoothly across the floating capsule towards the right, and concludes/fades out right before reaching the hamburger menu.
  4. Upon reaching the right end, it advances to the next statement in the sequence and starts again from the left:
     - Cycle 1: `The Brand Engineering Company`
     - Cycle 2: `The Brand Transformation Company`
     - Cycle 3: `The Identity & Art Systems Company`
     - Cycle 4: `The Digital Experience Design Company`
     - Cycle 5: `The Communication and Growth Company`
  5. Smooth fluid kinetic easing, pause-on-hover, zero layout shift, and full `prefers-reduced-motion` accessibility support.

---

## 2. Technical Architecture & Spatial Geometry

```
+--------------------------------------------------------------------------------------------------------------------+
|  [Marca Ubi.]   |  [• The Brand Engineering Company           --->]                 |       [ = Menu ]             |
|   (Wordmark)    |  <---------------- Full Liquid Glass Runway --------------------> |    (48px Touch Target)       |
+--------------------------------------------------------------------------------------------------------------------+
```

### A. Spatial Geometry
- **Runway Dimensions**: Spans from immediately right of `.brandLockup` to immediately left of `.navCluster`.
- **Aperture Container**:
  ```scss
  .streamAperture {
    flex: 1 1 0%;
    display: flex;
    align-items: center;
    height: 100%;
    margin: 0 clamp(1rem, 2vw, 2.5rem);
    overflow: hidden;
    position: relative;
    container-type: inline-size;
  }
  ```
- **Masking**: Optical edge bleed with linear-gradient masks so text softly materializes past the logo and fades before the hamburger.

### B. Motion Choreography Profile (7.2s Total Traversal)
- **Phase 1: Emergence (0.0s – 0.9s / 0% → 12% distance)**:
  - Statement enters from left boundary $x = 0$.
  - Opacity interpolates `0.0 → 0.95`.
- **Phase 2: Gliding Passage (0.9s – 6.2s / 12% → 85% distance)**:
  - Smooth linear or gentle cubic translation across the floating crystal capsule.
  - Constant crisp legibility (`opacity: 0.95`).
- **Phase 3: Dissolve (6.2s – 7.2s / 85% → 100% distance)**:
  - Statement approaches the hamburger boundary.
  - Opacity interpolates `0.95 → 0.0`.
- **Phase 4: Sequence Advance**:
  - Immediately triggers state increment: `(index + 1) % BRAND_STATEMENTS.length`.
  - Next statement begins journey from left boundary.

---

## 3. Subtitle Typographic Calibration Matrix

| Breakpoint / Context | Font Size | Letter Spacing | Line Height | Max Height | Margin Top | Contrast Ratio |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop (> 1024px)** | `13.5px` | `0.025em` | `1.25` | `24px` | `3px` | **14.88:1** (Dark) / **13.39:1** (Light) |
| **Tablet (769px–1024px)**| `12.5px` | `0.025em` | `1.25` | `22px` | `3px` | **14.88:1** (Dark) / **13.39:1** (Light) |
| **Mobile (<= 768px)** | `11.5px` | `0.020em` | `1.20` | `20px` | `2px` | **14.88:1** (Dark) / **13.39:1** (Light) |

---

## 4. Affected Files & Acceptance Criteria

### Files to Modify
1. `src/app/components/ClientHeader/ClientHeader.tsx`:
   - Replace duplicated stream marquee with single active statement component.
   - Wire sequencing state machine and reduced motion guards.
2. `src/app/components/ClientHeader/ClientHeader.module.scss`:
   - Calibrate `.brandSubtitle` and `.subtitleScrolled` styles.
   - Redefine `.streamAperture` to fill the available runway.
   - Replace marquee keyframes with single-item left-to-right translation keyframes.
3. `tests/client/client_160over90_platform.test.ts`:
   - Update Section 18 invariants to verify single-statement translation and calibrated typography.

### Acceptance Criteria
- [ ] At rest (`scrollY <= 50px`), `"The Brand Engineering Company"` renders at `13.5px` with refined `0.025em` spacing, left-aligned under the logo with crisp legibility.
- [ ] On scroll, the subtitle smoothly collapses via `opacity`, `transform`, `max-height`, and `margin-top` with zero layout jump.
- [ ] Inside the floating capsule, only **ONE single brand statement** is visible at any time.
- [ ] The statement starts immediately after the logo, glides across towards the hamburger menu, and dissolves before reaching the right edge.
- [ ] As each statement completes its journey, the text updates to the next statement in the sequence.
- [ ] Hovering over the statement pauses the animation.
- [ ] `prefers-reduced-motion` disables translation and presents a static statement at rest.
- [ ] All automated test suites (`tsc`, unit tests, platform tests, `next build`) pass with 100% compliance.
