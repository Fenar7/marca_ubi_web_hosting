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
5. **Typographic Scale Elevation**:
   - Font size scaled from `13.5px` to `clamp(14px, 1.05vw, 15px)` with `line-height: 24px`, matching Marca Ubi's interactive text standards.
