# Header Disciplines Ticker & Logo Spacing Architecture

> **Feature Scope**: Scrolled Header Disciplines Ticker Calibration, Logo-to-Text Gap Elimination, and 60fps GSAP Vertical Roll  
> **Component Target**: `src/app/components/ClientHeader/ClientHeader.tsx` & `ClientHeader.module.scss`  
> **Target Branch**: `refactor/master-brand-and-kinetic-refinements`  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`

---

## 1. Architectural Strategy
To achieve flawless luxury studio presentation in the floating Apple Liquid Glass capsule header:
1. **Ghost Width Eradication**: `.brandSubtitle` is removed from horizontal flow on scroll (`position: absolute; width: 0; max-width: 0; overflow: hidden;`), allowing `.brandLockup` to shrink-wrap the `MarcaUbiLogo` (~132px).
2. **Immediate Proximity**: `.streamAperture` margin is tightened to `12px` (`clamp(10px, 1vw, 14px)`), anchoring the dynamic disciplines directly adjacent to the logo with zero dead gap.
3. **Pure Flexbox Centering (No CSS/GSAP Transform Collision)**:
   - Eradicate CSS `top: 50%` and `transform: translate3d(0, -50%, 0)` on `.kineticCarrier`.
   - Leverage flexbox vertical centering (`top: 0; bottom: 0; display: inline-flex; align-items: center;`) so GSAP has 100% isolated control over `y`.
4. **Smooth Slot-Machine Cross-Transition**:
   - Symmetrical 14px vertical sweep: Outgoing carrier rolls to `y: -14, autoAlpha: 0` while incoming carrier rolls from `y: 14, autoAlpha: 0` to `y: 0, autoAlpha: 1` over `0.46s` with `power2.inOut`.
   - Hold duration calibrated to `2.8s` for effortless readability.
   - Eradicate CSS blur filters to retain razor-sharp subpixel vector typography across high-DPI and standard screens.
5. **Typographic Scale Elevation & Responsive Range**:
   - Desktop: `clamp(12.5px, 1.05vw, 15px)` with `line-height: 24px`, matching Marca Ubi's interactive text standards.
   - Tablet / Split-screen ($\le$ 768px): `font-size: 13px; margin-left: 9px;`
   - Mobile ($\le$ 480px): `font-size: 11.5px; margin-left: 7px;`

---

## 2. Universal Viewport Visibility & Instant-On Rendering
1. **Eradication of Responsive Deletion (`display: none`)**:
   - Eradicated legacy `@media (max-width: 680px) { display: none; }` which previously hid the ticker on split-screen or smaller viewports.
   - Ensured `.streamAperture` remains flexed and active across all viewport widths from 360px to 4K.
2. **Instant-On CSS First Frame**:
   - `.carrierAlpha` has `opacity: 1; visibility: visible;` declared in CSS, ensuring "Brand Strategy" renders immediately on the very first frame without waiting for GSAP execution.
   - `.carrierBeta` has `opacity: 0; visibility: hidden;` initialized in CSS, ready to roll in on cycle 1.
3. **Eradication of Horizontal Masks**:
   - Eradicated legacy `-webkit-mask-image` horizontal edge gradient fades, eliminating text edge clipping.
