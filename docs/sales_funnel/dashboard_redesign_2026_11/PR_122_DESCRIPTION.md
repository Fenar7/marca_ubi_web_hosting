# Marca Ubi Commercial Desk — Master Cockpit Redesign, Finexy/Fundora Graph Density & Luxury Micro-Cardlets (V6)

**Repository:** `Fenar7/marca_ubi_web_hosting`  
**Child PR:** [#122](https://github.com/Fenar7/marca_ubi_web_hosting/pull/122) (Targeting `redesign/crm-commercial-desk-master-luxury-cockpit`)  
**Base Cockpit PR:** [#121](https://github.com/Fenar7/marca_ubi_web_hosting/pull/121)  
**Author:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Status:** Strictly OPEN for Human Review & Direct Approval. Zero automated merges.

---

## 1. Architectural Summary & Scope of V6 Overhaul

Following forensic audit and benchmark synthesis against **Finexy** ("Total Income / Profit and Loss"), **Fundora** ("Cash Flow"), and **Recover** (SaaS Metrics), this sprint executes the complete V6 overhaul resolving graph density, space utilization, and micro-cardlet integration:

### A. Commercial Velocity Dual-Bar Chart Overhaul (`CommercialVelocityBarChart.tsx` & `.module.scss`)
- **8-Column Cadence Rhythm**: Expanded `timeframeUtils.ts` 30-day scope from 5 to **8 rolling cadence cohorts** (weekly frequency matching Finexy's exact 8-month rhythm `Jan`–`Aug`).
- **63.7% Dense Slot Occupancy**:
  - Expanded SVG coordinate canvas: `viewBox="0 0 700 300"`, `chartWidth = 628px`, `colWidth = 78.5px`.
  - Widen bars to **22px each + 6px gap = 50px dual pair**.
  - **Slot Occupancy: `50px / 78.5px = 63.7%`** (completely eliminating the previous 84% empty void!).
- **Calibrated Zero Pedestal**: When Realized revenue is ₹0, renders a **22px × 6px rounded grounding pedestal** (`rx="3"`, `fill: #e8e8e5`) acting as a tactile chronograph zero-stop pin, preserving 100% geometric symmetry.
- **Fundora Tactile Dot Ring Beacon**: Active bar apex renders `<circle r="5" fill="#fff" stroke="#ea002a" stroke-width="2.5" />` with a floating multi-tier HUD tooltip card directly above.
- **Swiss Dashed Gridlines**: Replaced solid hairlines with delicate dashed Swiss rules (`stroke: #ebebe8; stroke-dasharray: 3 4;`).

### B. Pipeline Distribution Donut Gauge Overhaul (`PipelineDonutChart.tsx` & `.module.scss`)
- **Header 1:1 Symmetry**: Added subtitle `<p className={styles.subtitle}>Active deal capital allocation by service line</p>` to match the left card's 64px 3-line header hierarchy with exact baseline alignment across the cockpit.
- **Stately 204px Donut Ring with 142.5px Aperture**:
  - Expanded SVG geometry to `204px x 204px` (viewBox `0 0 200 200`, `radius = 78`, `strokeWidth = 13` expanding to `16.5` on hover with drop-shadow).
  - Center aperture: **142.5px**, giving +42% more surface area for `Total Pipeline`, `₹ 65.4L`, and deal count.
- **Luxury Micro-Cardlet Tiles (Zero Underlines)**:
  - Replaced uncontained rows with structured, interactive surface tiles:
    `[Swatch] Category Name (Count) —————— Amount (Pill %)`
  - Embedded the progress meter **inside** the cardlet boundary (`.cardletMeterTrack: height: 3px; background: #e5e5e2; margin-top: 6px;`).
  - **Result**: It is physically impossible to perceive the meter as an accidental typographical text underline.
- **Eliminated Dead Vertical Space**:
  - Removed `justify-content: space-between` and applied disciplined flex flow: `display: flex; flex-direction: column; gap: 10px;`.
  - Height budget: Header 64px + Donut 204px + Cardlets 154px + Gaps 22px + Padding 40px = **484px** (matches left card with 0px dead voids).

---

## 2. Technical Quality & Verification Results

1. **TypeScript Compiler Check**:
   - Command: `npx tsc --noEmit`
   - Result: **0 errors across the entire codebase** (Exit code 0).
2. **Regression Contracts**:
   - Command: `npx tsx --test tests/unit/phase-2-brand-upgrade-layout-and-fixed-rail.test.ts`
   - Result: **5/5 tests passing** (100% pass rate).
   - Command: `npx tsx --test tests/unit/conyest-v2-luxury-telemetry.test.ts`
   - Result: **11/11 tests passing** (100% pass rate).
3. **Knowledge Graph**:
   - Command: `graphify update .`
   - Result: **7,552 nodes, 12,444 edges, 487 communities rebuilt** (Exit code 0).
4. **Git Authorship & Rules**:
   - Author: Strictly `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
   - PR Titles: Strictly ZERO `feat:` or `feat` prefixes.
   - Merging Policy: Strictly OPEN awaiting manual human review.
