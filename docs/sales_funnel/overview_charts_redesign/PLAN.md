# Commercial Desk Overview Charts & Telemetry Redesign Plan

**Date:** 2026-11-24  
**Status:** Architectural Blueprint awaiting user review and explicit approval. Implementation is NOT started.  
**Design Read:** ENERGY 1 / RHYTHM 2 / MOTION 2 (Marca Ubi Editorial Luxury Standard).  
**Authors:** Team Lead Head Agent, Expert UI/UX Designer Agent, Expert Frontend Developer Agent, Senior CTO PR Auditor Agent.  
**Author Identity:** Fenar7 <86710532+Fenar7@users.noreply.github.com>

---

## 1. Executive Summary & Defect Analysis

Based on user review and visual screenshots (`Screenshot 2026-11-24 154651.png`, `Screenshot 2026-11-24 145922.png`, `Screenshot 2026-11-24 145932.png`, and `Screenshot 2026-11-24 154808.png`), three critical UX/UI defects and AI-slop relics have been identified across the Commercial Desk Overview dashboard (`/admin`):

1. **Spline Chart Month Label Clipping (`EarningOverviewSplineCard.tsx`)**:
   - **Defect**: The x-axis month labels (`Jan`, `Feb`, `Mar`, `Apr`, `May`, `Jun`) touch or are clipped by the card's 20px rounded bottom border.
   - **Root Cause**: `.splineSvg` is set to `height: 100%` within a fixed 160px `.chartContainer`. `.monthLabelsRow` is rendered inside `.chartContainer` after the SVG with zero bottom margin or padding, and `.cardContainer` uses `justify-content: space-between`, pushing the text against the bottom border.

2. **Excessive Dead Whitespace in Cash Flow (`CommercialVelocityBarChart.tsx`)**:
   - **Defect**: Large unused white space below the bar chart x-axis dates (`25 Oct ... 20 Nov`) before the card bottom boundary.
   - **Root Cause**: In the asymmetric cockpit grid (`fundoraAsymmetricCockpitGrid`), the right column (`UpcomingSlaCard` + `ExecutiveSlaVelocityGauge`) stretches the left column to ~420px height. However, the SVG viewBox is constrained to `680 x 220` (aspect ratio 3.09:1), so in a ~750px wide column, the SVG renders at only ~242px height, leaving ~140px of dead vertical space.

3. **Static AI-Slop "This Month" Buttons (`EarningOverviewSplineCard` & `SpendingOverviewBarCard`)**:
   - **Defect**: Both buttons are inert visual mockups with no dropdown state, no click handlers, no accessibility attributes, and no data filtering.
   - **Root Cause**: Relic from prototype inception. The user requires fully functional dropdowns (`This Week`, `This Month`, `This Quarter`, `This Year`) that dynamically update the respective chart data.

4. **Brand Token Non-Compliance (Senior CTO Audit Finding)**:
   - **Defect**: `EarningOverviewSplineCard` and `SpendingOverviewBarCard` currently contain hardcoded generic blue tokens (`#2563eb`, `#3b82f6`, `#1d4ed8`, `#60a5fa`, `#93c5fd`).
   - **Requirement**: Purge generic blue and replace with official Marca Ubi brand telemetry tokens (`#111111`, `#ea002a`, `#454542`, warm neutral `#f5f5f3`, `#efefed`).

---

## 2. Guardrails Learned from Previous Rollback (Commit `048408e`)

The previous chart PR was reverted because:
- It fundamentally altered chart aesthetics, broke familiar visual rhythms, and collapsed/hid charts when period counts were zero.
- **Strict Invariants for this Implementation**:
  1. **Preserve Visual Archetypes**: Retain the smooth cubic-bezier spline curve, the continuous horizontal gradient pill bar, and the grounded vertical pillar bars.
  2. **Grounded Zero Baselines**: Never collapse or hide charts on zero periods; render visible grounded pedestals.
  3. **Targeted Surgical Geometry**: Modify coordinate math, padding, and viewBox aspect ratios without breaking responsive fluidity.

---

## 3. Detailed Component Blueprint

### A. Earning Overview Spline Card (`EarningOverviewSplineCard`)

#### 1. Geometry & Layout Fixes
- **Card Padding**: Update `.cardContainer` padding from `24px 26px` to `24px 26px 20px 26px` to guarantee 20px clearance above the rounded border.
- **Chart Container Flexbox & Coordinate Alignment**:
  ```scss
  .chartContainer {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    margin-top: auto;
  }
  .svgWrapper {
    width: 100%;
    height: 115px;
    flex: 1 1 auto;
    min-height: 90px;
    position: relative;
  }
  .splineSvg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .monthLabelsRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    /* Exact 7.0% padding matches SVG coordinate paddingX (35/500), eliminating horizontal drift */
    padding: 0 calc(35 / 500 * 100%);
    margin-top: 6px;
    margin-bottom: 2px;
    height: 24px;
  }
  ```
- **Touch Target & Accessibility**: Each month label button receives an invisible 44px min-touch boundary via `::after` pseudo-element.

#### 2. Interactive Timeframe Dropdown & Decoupled State Architecture
- **State Model (Server-Hydrated Multi-Timeframe Hybrid)**:
  - Local `currentTimeframe` state (`'this_week' | 'this_month' | 'this_quarter' | 'this_year'`) inside each card for **instant 0ms switching**, with zero network waterfall and zero Cumulative Layout Shift (CLS = 0.000).
  - Server aggregates the 4 cadences during initial render in `page.tsx` (`< 2ms` execution) and hydrates into `OverviewData`.
- **Options**:
  - `This Week`: 7 daily velocity points (`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`)
  - `This Month`: 4 weekly cadences (`W1`, `W2`, `W3`, `W4`) or 6 trailing monthly points
  - `This Quarter`: 3 monthly points (e.g. `Oct`, `Nov`, `Dec` for Q4)
  - `This Year`: 12 monthly points (`Jan`–`Dec`)
- **Keyboard & Popover Accessibility**:
  - ARIA 1.2 Listbox pattern (`role="listbox"`, `role="option"`, `aria-selected`, `aria-expanded`).
  - Native keyboard navigation: ArrowUp/ArrowDown to traverse options, Enter/Space to select, Escape to dismiss and restore trigger focus.
  - Document `pointerdown` outside click listener with cleanup.
  - Fixed `min-width: 116px` on trigger button to prevent width jitter across label changes.
- **Data Model**: `computeSplineDataForTimeframe(timeframe, totalValue)` in `src/app/admin/lib/timeframeUtils.ts` ensures smooth curve calculation, active index clamping (`Math.min(activeIndex, points.length - 1)`), and zero-baseline preservation.

#### 3. Color Token Purge
- Replace `#2563eb` with Marca Ubi obsidian/crimson telemetry:
  - Spline curve: `#111111` or `#ea002a`
  - Area gradient: `linear-gradient(180deg, rgba(234, 0, 42, 0.12) 0%, rgba(234, 0, 42, 0.00) 100%)`
  - Beacon target ring: `#ea002a` with white core `#ffffff`.

---

### B. Spending Overview Card (`SpendingOverviewBarCard`)

#### 1. Interactive Timeframe Dropdown
- Identical accessible dropdown trigger and menu (`This Week`, `This Month`, `This Quarter`, `This Year`).
- Proportional category calculation via `computeSpendingDataForTimeframe(timeframe, totalValue, categories)`.
- Active deals count badge updates dynamically per timeframe.

#### 2. Color Token Purge
- Replace electric blue `#2563eb` and `#60a5fa` in the gradient capsule bar with brand-aligned tones:
  - Category 1 (Primary): Charcoal `#18181b` to `#27272a`
  - Category 2 (Secondary): Warm slate `#71717a` to `#a1a1aa`
  - Category 3 (Others): Neutral muted `#e4e4e7` to `#f4f4f5`
- Smooth width transitions on timeframe switch (`transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1)`).

---

### C. Cash Flow Bar Chart (`CommercialVelocityBarChart`)

#### 1. Vertical Space Optimization
- **SVG ViewBox**: Change from `0 0 680 220` (ratio 3.09:1) to `0 0 680 290` (ratio 2.34:1).
- **Coordinate Math**:
  - `svgHeight = 290` (previously 220, +70px taller)
  - `chartHeight = 215` (previously 158, +57px taller)
  - `baselineY = 243` (previously 186)
  - `paddingBottom = 47` (previously 34)
- **Visual Result**: Pillars stand significantly taller and more authoritative. The x-axis dates anchor cleanly above the baseline, completely eliminating dead whitespace at the bottom.
- **Floating Badge**: Crown position dynamically recalculated based on updated `svgHeight`.

---

## 4. Delivery Gate Checklist

Before proposing any code as ready for review:
- [ ] `npm run test:boundaries` — 100% pass (50/50 server action boundaries).
- [ ] `npm run test:unit` — 100% pass across all unit test suites.
- [ ] `tsc --noEmit` — 0 type errors, 0 `any` types.
- [ ] Accessibility: WCAG AA contrast (4.5:1 text, 3:1 graphical components), 44px min-touch targets on all new dropdown triggers and options.
- [ ] Zero layout shift: CLS = 0.000 verified.
- [ ] Strict Zero PR Merge compliance: PR will remain strictly OPEN on GitHub.
