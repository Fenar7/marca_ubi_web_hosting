# Practice Areas Section Removal Plan (About Curtain)

**Document ID**: `docs/about_curtain/practice_areas_removal_plan.md`  
**Target Reference**: `Screenshot 2026-10-27 145639.png`  
**Target Files**:
- `src/app/components/Sections/AboutCurtain.tsx`
- `src/app/components/Sections/AboutCurtain.module.scss`
**Target Branch**: `showcase/homepage-works-cutout-and-portfolio-showcase`  
**Target PR**: [Pull Request #84](https://github.com/Fenar7/marca_ubi_web_hosting/pull/84) (Strictly `OPEN`)

---

## 1. Requirement & User Intent

In reference to `Screenshot 2026-10-27 145639.png`, remove the **"Practice Areas"** 4-card grid (01 Brand Engineering, 02 Identity & Art Systems, 03 Digital Experience Design, 04 Communication & Growth) from the About section (`AboutCurtain.tsx`).

### Rationale:
- The 5 core capabilities are already showcased prominently in the Navigation Overlay's right-panel kinetic stage and in the dedicated View 06 (Capabilities) section.
- Removing this section eliminates redundancy and streamlines the About curtain into a focused editorial layout:
  1. Sticky Anchor Rail (Left: 30%) with tagline and red-arrow "Start a Project Brief" button.
  2. Monumental Headline & Narrative Block (Right: 70%).
  3. Quantified Delivery Scope Metrics Grid with brand red trailing symbols (`100+`, `12+`, `3*`, `360°`).

---

## 2. Technical Modifications

### A. `src/app/components/Sections/AboutCurtain.tsx`
1. **Remove `CoreService` & `SERVICES` Constant**:
   - Delete `interface CoreService` and `const SERVICES: CoreService[]`.
2. **Remove JSX Markup**:
   - Delete the `{/* 4 Core Services Flex Strip */}` container:
     ```tsx
     <div className={styles.servicesContainer}>
       <span className={styles.subKicker}>Practice Areas</span>
       <div className={styles.servicesGrid}>
         ...
       </div>
     </div>
     ```

### B. `src/app/components/Sections/AboutCurtain.module.scss`
1. **Purge Unused Style Classes**:
   - Clean up `.servicesContainer`, `.servicesGrid`, `.serviceItem`, `.serviceHeader`, `.serviceNumber`, `.serviceTitle`, and `.serviceDesc`.

---

## 3. Invariants & Governance

- **Test Invariants**: Preserves `data-header-theme="light"` and button border-radius constraints (zero 9999px).
- **Git Authorship**: Commits authored strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- **PR Delivery**: Push directly to `showcase/homepage-works-cutout-and-portfolio-showcase` and update PR #84 description while leaving it strictly `OPEN`.
