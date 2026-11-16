# Master Commercial Cockpit & Graph Redesign Specification (V6)
## Forensic Space Utilization, Finexy/Fundora Geometry & Luxury Cardlet Architecture

**Document Path:** `docs/sales_funnel/dashboard_redesign_2026_11/MASTER_GRAPH_AND_COCKPIT_REDESIGN_PLAN_V6.md`  
**Date:** 2026-11-16  
**Status:** Architectural Blueprint for Human Review. **Zero execution without explicit user 'proceed' or 'do it'.**  
**Author:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Benchmark Archetypes:** Finexy ("Total Income / Profit and Loss"), Fundora ("Cash Flow"), Recover (SaaS Metrics)

---

## 1. Executive Forensic Audit & Root Cause Analysis

Following rigorous multi-agent visual inspection comparing the live dashboard output (`screenshot_current_output.png`) directly against the user's references (`reference_user_downloads.webp`, `uploaded_media_1`, `uploaded_media_0`), three major structural and spatial defects have been diagnosed:

### Defect 1: The "16% Anorexic Bar & 84% Vacuum" Syndrome (`CommercialVelocityBarChart`)
* **Visual Observation**: In a card spanning 68% of the viewport (~820px), there are only **5 thin, isolated black bars** standing like telephone poles in a desert.
* **Root Cause In Code**:
  1. In `src/app/admin/lib/timeframeUtils.ts` (line 153):
     ```typescript
     const count = slug === '7d' ? 7 : slug === '30d' ? 5 : slug === 'year' ? 12 : 3;
     ```
     The 30-day view divides data into only **5 intervals** (`17 Oct`, `23 Oct`, `29 Oct`, `4 Nov`, `10 Nov`).
  2. In an SVG width of 640px, each column slot is an enormous **112px wide** (`colWidth = 112px`).
  3. Bar width is fixed at `barWidth = 18px`.
  4. Realized revenue in recent cohorts is ₹0, collapsing the companion bar to a flat 3px line.
  5. **Slot Occupancy: `18px / 112px = 16.07%`**. An overwhelming **83.93% of every column slot is empty dead void**!
  6. Furthermore, because bars are centered as a pair (`intakeX = centerX - barWidth - barGap / 2`), when Realized is 0, the solitary black bar is displaced 21px to the left of the slot center, creating an ungrounded, lopsided appearance.

### Defect 2: The "Floating Donut & 83px Desert Vacuum" (`PipelineDonutChart`)
* **Visual Observation**: The 176px donut ring floats near the top, followed by a **~83px empty vertical chasm** before the category list begins.
* **Root Cause In Code**:
  1. The right card container inherits the left card's ~476px height via CSS Grid `align-items: stretch`.
  2. Inside `PipelineDonutChart.module.scss`, `.cardContainer` uses `justify-content: space-between`.
  3. With only 3 elements (Header 42px, Donut 176px, Legend 130px = 348px), `justify-content: space-between` forcibly distributes the remaining **~128px of excess height** as dead white voids: ~45px above the donut, and an enormous **~83px dead vacuum between the bottom of the donut ring and the category list**.
  4. The donut SVG is hardcoded to `176px x 176px`, occupying only ~38% of the column width, appearing shrunken, lonely, and dwarfed.

### Defect 3: The "Detached Typo Underline" Defect in Category Breakdown
* **Visual Observation**: The 2.5px progress bars underneath each category item still visually read like **colored typographical spell-check underlines** rather than integrated precision gauges.
* **Root Cause In Code**:
  - In `PipelineDonutChart.module.scss`, `.categoryRow` uses `flex-direction: column` with zero background containment. The `.microTrack` is a full-width (100%) horizontal bar sitting directly beneath the category text line. Because it spans edge-to-edge under both the label and the price without an enclosing surface, human perception groups it as an underline rather than a gauge.

### Defect 4: Cockpit Header & Datum Line Asymmetry
* The left card header has a 3-tier vertical stack (Eyebrow, Title, Subtitle = **64px tall**). The right card is missing a subtitle entirely (**42px tall**), creating an immediate 22px baseline step across the top of the cockpit.

---

## 2. Benchmark Design Principles (Finexy & Fundora Synthesis)

| Design Element | Current Live Output | Finexy Archetype (`reference_user_downloads.webp`) | Fundora Archetype (`uploaded_media_1`) | Proposed V6 Specification |
| :--- | :--- | :--- | :--- | :--- |
| **Cadence Intervals** | 5 sparse slots | **8 dense slots** (`Jan`–`Aug`) | 12 dense slots (`Jan`–`Dec`) | **8 rolling cadence cohorts** (weekly rhythm) |
| **Slot Width** | 112px | ~42px | ~36px | **80px** (at 640px chart width) |
| **Bar Pair Width** | 18px (single bar) | 28px (stacked pill) | 24px (pill column) | **50px** (Dual 22px bars + 6px gap) |
| **Slot Occupancy** | **16.07% (84% void)** | **62%–65%** | **65%–70%** | **62.5%** (50px / 80px — dense & rhythmic) |
| **Zero-Realized State** | 3px flat sliver (asymmetric) | Full pill intact | Muted ambient pill | **22px × 6px grounded pedestal** |
| **Gridlines** | Solid hairline | **Dashed Swiss rules** (`50k..00`) | Dashed horizontal rules | **Dashed Swiss rules** (`stroke-dasharray="3 4"`) |
| **Hover Interaction** | Faint slot wash | High contrast column | **Tactile dot ring beacon** + HUD card | **Beacon ring + floating HUD tooltip card** |
| **Header Symmetry** | Left 64px, Right 42px | Uniform heights | Uniform card headers | **Identical 64px 3-line headers** (0px delta) |
| **Donut Gauge Scale** | 176px (isolated) | Balanced circular gauges | Integrated circular widgets | **204px stately diameter** (aperture 142.5px) |
| **Category Meters** | Full-width underline | Inset micro-cards | Horizontal segmented bars | **Luxury Micro-Cardlet Tiles** (zero underlines) |
| **Right Card Layout** | 83px void under donut | Compact balanced cards | Bottom view-all action | **Disciplined `gap: 10px`** (0px dead voids) |

---

## 3. Detailed Component-by-Component Specifications

### A. Commercial Velocity Bar Chart (`CommercialVelocityBarChart.tsx` & `.module.scss`)

1. **8-Column Cadence Rhythm**:
   - In `src/app/admin/lib/timeframeUtils.ts`:
     ```typescript
     const count = slug === '7d' ? 7 : slug === '30d' ? 8 : slug === 'year' ? 12 : 3;
     ```
   - Generates 8 rolling cadence cohorts across 30 days (e.g. `19 Oct`, `22 Oct`, `26 Oct`, `29 Oct`, `2 Nov`, `5 Nov`, `9 Nov`, `12 Nov`). Matches Finexy's exact 8-column visual frequency.
2. **Dense 62.5% Slot Occupancy Math**:
   - SVG viewBox: `0 0 700 300` (paddingLeft: 52, paddingRight: 20, paddingTop: 26, paddingBottom: 42).
   - `chartWidth = 628px`, `chartHeight = 232px`, `baselineY = 258px`.
   - `colWidth = 628 / 8 = 78.5px`.
   - `barWidth = 22px`, `barGap = 6px` -> Pair span = **50px**.
   - `capsuleWidth = 58px` (ambient hover track).
   - **Occupancy: `50px / 78.5px = 63.7%`**. Eliminates all horizontal voids.
3. **Calibrated Grounded Pedestal for Realized = 0**:
   - When `realizedHeight === 0`: render `<rect x={realizedX} y={baselineY - 6} width={barWidth} height={6} rx="3" className={styles.barPedestalZero} />` (`fill: #e8e8e5`).
   - Acts as a tactile chronograph zero-stop pin, preserving 100% geometric symmetry.
4. **Fundora Tactile Dot Ring Beacon & Floating HUD Tooltip**:
   - When hovering an active bar:
     - Render beacon ring: `<circle cx={activeBarX + barWidth / 2} cy={activeBarY} r="5" className={styles.beaconRing} />` with white fill, brand red/obsidian stroke, and subtle drop-shadow.
     - Pinned floating HUD tooltip directly above the beacon showing date, Intake, Realized, and conversion yield.
5. **Dashed Swiss Gridlines**:
   - Hairlines styled with `stroke: #ebebe8; stroke-dasharray: 3 4; stroke-width: 1;`.

---

### B. Pipeline Distribution Donut Gauge (`PipelineDonutChart.tsx` & `.module.scss`)

1. **Header Symmetry (0px Delta)**:
   - Add subtitle: `<p className={styles.subtitle}>Active deal capital allocation by service line</p>`.
   - Matches the 64px 3-line header of `CommercialVelocityBarChart` with exact baseline alignment.
2. **Stately 204px Donut Ring with 142.5px Aperture**:
   - ViewBox: `0 0 200 200`, `cx = 100`, `cy = 100`, `radius = 78`, `strokeWidth = 13`.
   - Active segment expands to `strokeWidth = 16.5` with `filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16))`.
   - Center aperture: **142.5px**, providing +42% more breathing room for `Total Pipeline`, `₹ 65.4L`, and deal count.
   - Fills the upper half of the card gracefully.
3. **Eliminated Underlines — Luxury Micro-Cardlet Tiles**:
   - Replace bare uncontained rows with structured, interactive surface tiles:
     ```tsx
     <ul className={styles.categoryCardletList}>
       {categories.map((cat, idx) => (
         <li key={idx} className={activeHoverIndex === idx ? styles.cardletItemActive : styles.cardletItem}>
           <div className={styles.cardletTopLine}>
             <div className={styles.cardletMetaLeft}>
               <span className={styles.colorSwatch} style={{ backgroundColor: cat.color }} />
               <span className={styles.categoryName}>{cat.name}</span>
               <span className={styles.dealCountTag}>{cat.count} deals</span>
             </div>
             <div className={styles.cardletMetaRight}>
               <span className={styles.categoryAmount}>{formatCrmCurrency(cat.value)}</span>
               <span className={styles.percentagePill}>{cat.percentage}%</span>
             </div>
           </div>
           <div className={styles.cardletMeterTrack}>
             <div className={styles.cardletMeterFill} style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
           </div>
         </li>
       ))}
     </ul>
     ```
   - Cardlet styling: `background: #fafaf9; border: 1px solid #ededeb; border-radius: 8px; padding: 8px 12px;`
   - Meter styling: `height: 3.5px; background: #e5e5e2; border-radius: 9999px; margin-top: 6px;`
   - **Result**: The meter is embedded *inside* the cardlet's physical boundary. It is **physically impossible** to perceive as a text underline.
4. **Eliminated Dead Vertical Space**:
   - Remove `justify-content: space-between` from `.cardContainer`.
   - Apply disciplined flex flow: `display: flex; flex-direction: column; gap: 10px;`.
   - Total card height budget: Header 64px + Gap 10px + Donut 204px + Gap 12px + Cardlets 154px + Padding 40px = **484px**.
   - Matches the left card's ~484px height naturally with **zero dead voids**.

---

## 4. Verification & Quality Gate Plan

1. **Visual Parity**: 0px height delta; 63.7% bar slot occupancy; zero detached underlines; 100% space utilization.
2. **Type Safety**: `npx tsc --noEmit` must pass with exit code 0.
3. **Unit Tests**: Workspace regression test suite must pass 100%.
4. **Knowledge Graph**: AST synchronized via `graphify update .`.
5. **Git Authorship**: Author strictly `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
6. **PR Governance**: PR #122 and PR #121 remain strictly **OPEN**. Zero agent merges.

---

## 5. Explicit Authorization Requirement

In strict adherence to our repository rules:
- **No code has been modified in this turn.**
- Please review this master redesign plan.
- Reply with **"proceed"** or **"do it"** to authorize full execution.
