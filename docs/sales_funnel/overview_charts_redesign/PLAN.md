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

## 2. User Directives & Color Invariant (Immediate Restoration)

Following direct user review of screenshots `Screenshot 2026-11-24 161322.png` and `Screenshot 2026-11-24 161331.png`:
1. **Restore Original Vibrant Blue Color Scheme**: The user explicitly instructed to restore the original colors across `Earning Overview` and `Spending Overview`. The electric blue spline curve, cyan guide stem, electric blue apex beacon, and vibrant multi-tone blue spending gradient bar must be restored immediately.
2. **Increase Cash Flow Graph Height to Fill Entire Vertical Space**: Remove the artificial height constraints (`max-height: 320px`) and scale the SVG coordinate system to `680 x 400` with `chartHeight = 310px`, allowing the bars to stand tall and anchor cleanly with zero unused space at the bottom.

---

## 3. Detailed Component Blueprint

### A. Earning Overview Spline Card (`EarningOverviewSplineCard`)

#### 1. Geometry & Clipping Resolution
- Keep the verified flex column layout: `.chartContainer` with `.svgWrapper` (`115px`) and `.monthLabelsRow` (`24px`).
- Card bottom padding at `20px` and `.monthLabelsRow` with `padding: 0 calc(35 / 500 * 100%)` for pixel-exact stem alignment and 20px clearance above the bottom rounded border.
- 44px invisible touch targets on month buttons.

#### 2. Restore Original Electric Blue Palette
- Spline curve stroke: Vibrant Electric Blue `#2563eb` (`strokeWidth="2.5"`).
- Linear area gradient:
  - Offset 0%: `#2563eb` at 20% opacity
  - Offset 60%: `#3b82f6` at 6% opacity
  - Offset 100%: `#3b82f6` at 0% opacity
- Vertical dashed stem: `#93c5fd` (`strokeWidth="1.5"`, `strokeDasharray="3 3"`).
- Apex beacon: Inner circle `#ffffff` with `#2563eb` stroke and glow filter; outer halo `#2563eb` with 18% opacity.
- Floating tooltip: `#16181d` with `#2563eb` hairline border.

#### 3. Interactive Timeframe Dropdown
- Retain the working W3C ARIA 1.2 popover (`This Week`, `This Month`, `This Quarter`, `This Year`) with 0ms in-memory cadence switching and coordinate bounds clamping.

---

### B. Spending Overview Card (`SpendingOverviewBarCard`)

#### 1. Restore Original Vibrant Blue Gradient Palette
- Category 1 (Web & Digital): Color `#2563eb`, gradient `linear-gradient(90deg, #1d4ed8 0%, #3b82f6 100%)`
- Category 2 (Full-Suite Advisory): Color `#60a5fa`, gradient `linear-gradient(90deg, #60a5fa 0%, #93c5fd 100%)`
- Category 3 (Others): Color `#cbd5e1`, gradient `linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 100%)`
- Continuous 38px gradient pill bar renders these vibrant blue segments with fluid animated width transitions (`transition: width 0.35s`).

#### 2. Interactive Timeframe Dropdown
- Retain the working W3C ARIA 1.2 popover with 0ms in-memory cadence switching.

---

### C. Cash Flow Bar Chart (`CommercialVelocityBarChart`)

#### 1. Significant Height Increase & Complete Dead Space Elimination
- **Scale SVG Coordinate System**:
  - `svgWidth = 680`
  - `svgHeight = 400` (up from 300, and up from original 220 — **+81.8% taller viewBox**)
  - `paddingLeft = 56`, `paddingRight = 20`, `paddingTop = 32`, `paddingBottom = 42`
  - `chartHeight = 326` (up from original 158 — **+106% bar height!**)
  - `baselineY = 358`
  - X-axis date labels: `y = 388`
- **Sass Layout Alignment**:
  - Remove `max-height: 320px` from `.chartSvg`. Set `height: 100%; width: 100%; display: block;`.
  - In `.svgWrapper`: `flex: 1 1 auto; height: 100%; display: flex; align-items: stretch; justify-content: center;`.
  - In `.cardContainer`: `justify-content: space-between;` ensures the bar chart fills the available column height, anchoring flush to the bottom padding with **0px dead space**.
- **Preserve Archetypes**: Grounded pill bars, active spotlight `#fundoraCrimsonGradient`, apex beacon ring, and instrument zero pedestals `#e8e8e5`.

---

## 4. Delivery Gate Checklist

Before proposing any code as ready for review:
- [ ] `npm run test:boundaries` — 100% pass (50/50 server action boundaries).
- [ ] `npm run test:unit` — 100% pass across all unit test suites.
- [ ] `tsc --noEmit` — 0 type errors, 0 `any` types.
- [ ] Accessibility: WCAG AA contrast (4.5:1 text, 3:1 graphical components), 44px min-touch targets on all new dropdown triggers and options.
- [ ] Zero layout shift: CLS = 0.000 verified.
- [ ] Strict Zero PR Merge compliance: PR will remain strictly OPEN on GitHub.
