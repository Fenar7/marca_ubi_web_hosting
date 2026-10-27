# Services Showcase Full-Width Equal Columns Architecture Plan

**Document ID**: `docs/services_accordion/full_width_equal_columns_master_plan.md`  
**Target Critique**: `Screenshot 2026-10-27 152828.png`  
**Target Benchmarks**:
- `Screenshot 2026-10-27 150824.png` (Equal column cards resting state with photography and bottom titles)
- `Screenshot 2026-10-27 151028.png` (Hovered card with solid dark overlay and localized text reveal; zero width change)
**Target Files**:
- `src/app/components/Sections/AboutCurtain.tsx` (Move outside 30/70 right column to direct child of section)
- `src/app/components/Sections/AboutCurtain.module.scss` (Full-width section spacing)
- `src/app/components/Sections/ServicesAccordion/ServicesAccordion.tsx` (Equal column render & localized hover state)
- `src/app/components/Sections/ServicesAccordion/ServicesAccordion.module.scss` (Eliminate flex-grow, enforce equal widths & overlay transitions)
**Target Branch**: `showcase/services-accordion-b2b-b2c`  
**Target PR**: [Pull Request #85](https://github.com/Fenar7/marca_ubi_web_hosting/pull/85) (Strictly `OPEN`)

---

## 1. Root Cause Analysis of Previous State (`Screenshot 152828`)

1. **Width Constrained Inside 70% Right Column**:
   - `<ServicesAccordion />` was mounted inside `<div className={styles.rightColumn}>`, leaving the left 30% sticky rail space completely blank and compressing the services cards into only 70% of the viewport width.
2. **Harmful Flex-Grow Expansion (`flex: 3.4`)**:
   - When a card expanded on hover, the other 7 cards were squeezed down to ~50px slivers, breaking title text into single-word vertical lines (`Dem and Gen erati on`, `Inte grat ed Mar ketin g`).
   - In benchmark `Screenshot 150824` and `Screenshot 151028`, **all cards divide the space equally at all times**. When hovered, the card **does not change width at all**; instead, an obsidian backdrop covers the photo and reveals the detailed text directly over that card.

---

## 2. Redesign Blueprint

### A. Full-Width Edge-to-Edge Structural Placement
In `src/app/components/Sections/AboutCurtain.tsx`:
- Move `<ServicesAccordion />` **outside** `<div className={styles.gridContainer}>` (which holds the 30/70 About narrative and metrics).
- Place `<ServicesAccordion />` directly inside `<section className={styles.aboutSection}>`, giving it **100% full-width span across the entire screen**.
- Layout flow:
  1. Header container (kicker, title, and B2B/B2C segmented toggle) aligns with the Swiss editorial max-width grid (`max-width: 1440px; margin: 0 auto; padding: 0 clamp(1.5rem, 5vw, 5rem);`).
  2. The multi-column cards strip bleeds **100% edge-to-edge full width** across the viewport (`width: 100%`).

### B. Invariant Equal Column Division (`Screenshot 150824` Parity)
- Every card has **strictly equal width**:
  ```scss
  .accordionCard {
    flex: 1 1 0px;
    min-width: 0;
    width: 100%;
    /* NO dynamic flex-grow expansion */
  }
  ```
- No card ever pushes, resizes, or squishes its neighbors.

### C. Localized Dark Text Overlay on Hover (`Screenshot 151028` Parity)
1. **Resting State**:
   - Card displays full-bleed editorial photograph with a subtle bottom gradient scrim (`rgba(0,0,0,0.85)`).
   - Bottom-aligned Title in Circular XX Medium (`#ffffff`).
   - Top-aligned monospace index number (`01`–`08`).
2. **Hovered State**:
   - Card width remains strictly invariant (`flex: 1`).
   - Image layer darkens with an obsidian overlay (`rgba(10, 10, 10, 0.95)` with `backdrop-filter: blur(6px)`).
   - Title moves gracefully to the top with a brand red accent line (`#ea002a`).
   - Full service description fades in (`opacity: 1, transform: translateY(0)`).
   - Brand red directional arrow `→` appears at the bottom.

### D. Responsive 8-Card Strategy
- **Wide Screens (≥ 1440px)**: 8 equal columns spanning edge-to-edge.
- **Medium Screens / Laptops (1024px – 1439px)**: Clean horizontal momentum scroll (`overflow-x: auto; scroll-snap-type: x mandatory;`) with minimum card width (`min-width: 220px`), ensuring text is never squished.
- **Mobile (< 768px)**: Reflows into touch-friendly cards with tap-to-reveal overlay.

---

## 3. Technical Changes

### 1. `src/app/components/Sections/AboutCurtain.tsx`
```tsx
  return (
    <section className={styles.aboutSection} id="about" ...>
      {/* 30/70 Asymmetric Editorial Grid */}
      <div className={styles.gridContainer}>
        <aside className={styles.leftColumn}>...</aside>
        <div className={styles.rightColumn}>
          {/* Statement, Narrative, 4 Metrics */}
          ...
        </div>
      </div>

      {/* Full-Width Panoramic Services Showcase */}
      <ServicesAccordion />
    </section>
  );
```

### 2. `src/app/components/Sections/ServicesAccordion/ServicesAccordion.module.scss`
- Remove all `flex: 3.4` and `flex: 3` expansion classes.
- Set `.accordionCard { flex: 1 1 0px; min-width: 0; position: relative; ... }`.
- Set `.hoverOverlay` to transition opacity and transform on `.accordionCard:hover`.
- Set container `.accordionStrip { width: 100%; display: flex; height: 520px; gap: 2px; }`.

---

## 4. Verification & Governance

- Commit authored strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- Push to sub-branch: `showcase/services-accordion-b2b-b2c`.
- Update [Pull Request #85](https://github.com/Fenar7/marca_ubi_web_hosting/pull/85) description while keeping it strictly `OPEN`.
