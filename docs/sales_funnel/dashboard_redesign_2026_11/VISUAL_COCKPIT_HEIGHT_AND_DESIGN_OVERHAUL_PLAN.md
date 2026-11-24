# Marca Ubi CRM — Tier 2 Visual Intelligence Cockpit Equalization & Design Overhaul Specification

**Document Path:** `docs/sales_funnel/dashboard_redesign_2026_11/VISUAL_COCKPIT_HEIGHT_AND_DESIGN_OVERHAUL_PLAN.md`  
**Date:** 2026-11-16  
**Status:** Proposal for user review and explicit authorization. **Zero execution without explicit user 'proceed'.**  
**Author:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Benchmark Archetypes:** Finexy ("Profit and Loss" & "Total Income"), Stripe Sigma, Linear Insights

---

## 1. Forensic Audit & Root Cause Analysis

Based on forensic inspection of the user's screenshot (`uploaded_media_1794767948996.png`), direct feedback, and comprehensive subagent analysis, two critical defects and several aesthetic issues have been identified:

### Defect 1: The ~155px Staggered Height Mismatch
- **Finding**: The left card (`CommercialVelocityBarChart`) measures ~340px, while the companion right card (`PipelineDonutChart`) measures ~495px.
- **Root Cause**:
  1. In `OverviewWorkspace.module.scss`, `.visualCockpitGrid` has `align-items: stretch`, stretching the grid cells (`.chartColumn` and `.donutColumn`).
  2. However, `<article className={styles.cardContainer}>` inside both components lacks `height: 100%` and `flex: 1 1 auto`. In flexbox, child elements default to their intrinsic content height.
  3. `CommercialVelocityBarChart` has less content (Header 72px + SVG 230px + padding 40px = 342px), whereas `PipelineDonutChart` has more content (Header 54px + Donut 237px + 4-row category list with underline bars 165px + padding 40px = 496px).
  4. The left card stops abruptly at 342px, leaving a jarring ~155px empty void underneath, while the right card hangs down and breaks the visual baseline.

### Defect 2: The "Grey Test-Tube Pillars" Syndrome
- **Finding**: In `CommercialVelocityBarChart.tsx`, every month renders a full-height grey background slot capsule (`fill: #f7f7f5`, width: 58px) plus two full-height internal channel tracks (`fill: rgba(0,0,0,0.025)`, width: 20px). When Realized Revenue is ₹0, the right channel becomes an empty 168px tall grey cylinder. Across 5 months, this produces 10 giant pale grey monoliths reaching up to ₹20L, resembling an empty laboratory test-tube rack rather than an ultra-luxury Swiss fintech chart.
- **Benchmark Resolution (Finexy Standard)**:
  - Open-air white canvas (`#ffffff`). Bars rise freely from a delicate Swiss baseline.
  - Slot backdrops are **ephemeral hover washes**: transparent by default, smoothly fading in (`fill: #f5f5f3`) only behind the hovered month.
  - Bars use authentic **grounded pill paths** (flat bottom at baseline with rounded top shoulders `rx="5"`), preventing the "floating sausage" effect of `<rect rx="6">`.
  - When Realized Revenue is ₹0, render an ultra-delicate grounded zero tick (`fill: #e2e2df; width: 18px; height: 3px; rx: 1.5px`), looking like a calibrated zero tick on an expensive chronograph.

### Defect 3: The "Detached Underline" Category List Defect
- **Finding**: In `PipelineDonutChart.tsx`, each category row renders a full-width 4px progress line directly under the text. Because it spans edge-to-edge under both the label and the currency amount, it looks like a heavy, detached colored typo underline rather than an integrated precision meter.
- **Benchmark Resolution (Linear & Finexy Standard)**:
  - Streamline the donut diameter from 205px to 176px (viewBox `0 0 180 180`, radius `68`, stroke-width `12`, aperture `120px`), allowing comfortable vertical headroom.
  - Transform category rows into interactive micro-cardlets with subtle 2.5px micro-meter tracks cleanly grouped with the text, or inline micro-bars.
  - Upgrade color palette to strictly exceed WCAG AA contrast (replace `#a1a1aa` with `#52525b` / `#71717a`).

---

## 2. The Golden Height Convergence Blueprint (~480px - 490px)

Both cards will converge to an identical, purposeful height of **~485px** via `height: 100%` and `flex: 1 1 auto`:

| Layer | Commercial Velocity Bar Chart (Left - 68%) | Pipeline Donut Chart (Right - 32%) |
| :--- | :--- | :--- |
| **Card Header** | Cadence Intelligence · Commercial Velocity (~68px) | Allocation Intelligence · Pipeline Distribution (~54px) |
| **Visual Center Stage** | Expanded Stately Dual-Bar SVG (`viewBox="0 0 640 300"`, `chartHeight=232px`) (~300px) | Streamlined Donut Ring (176px diameter, 120px aperture) (~200px) |
| **Grounding Tier** | **Finexy Cadence Telemetry Shelf** (3-KPI operational footer: Velocity Pace, Peak Surge, Yield) (~65px) | **4 Ranked Category Cardlets** with sleek 2.5px micro-progress tracks (~165px) |
| **Internal Padding** | `20px` top + `20px` bottom (40px) | `20px` top + `20px` bottom (40px) |
| **Total Height** | **~485px** | **~485px** |
| **Visual Parity** | **100% Pixel-Locked (0px Delta)** | **100% Pixel-Locked (0px Delta)** |

---

## 3. Detailed Component-by-Component Specifications

### A. Layout Grid Synchronization (`OverviewWorkspace.module.scss`)
```scss
.visualCockpitGrid {
  display: grid;
  grid-template-columns: minmax(0, 68fr) minmax(340px, 32fr);
  gap: 20px;
  align-items: stretch;
  margin-bottom: 24px;

  @media (max-width: 1180px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
}

.chartColumn,
.donutColumn {
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%; // Locks column to grid cell height
}
```

### B. Commercial Velocity Dual-Bar Chart Overhaul (`CommercialVelocityBarChart.tsx` & `.module.scss`)
1. **Purge Test-Tube Monoliths**:
   - Eliminate permanent grey `.channelTrack` rects.
   - Slot capsule (`.slotCapsule`) is transparent by default and only renders `#f5f5f3` on hover.
2. **True Grounded Pill Geometry**:
   - Render bars using an SVG path with flat baseline and rounded top shoulders:
     ```tsx
     function getGroundedPillPath(x: number, y: number, width: number, height: number, radius = 5): string {
       if (height <= 0) return "";
       const r = Math.min(radius, width / 2, height);
       const bottom = y + height;
       return `M ${x} ${bottom} L ${x} ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} L ${x + width - r} ${y} A ${r} ${r} 0 0 1 ${x + width} ${y + r} L ${x + width} ${bottom} Z`;
     }
     ```
3. **Calibrated ViewBox Dimensions**:
   - `svgWidth = 640`, `svgHeight = 300`, `chartHeight = 232` (38% taller dynamic vertical range).
   - `barWidth = 18px`, `barGap = 6px`, dual-bar span = 42px (53.5% slot occupancy in 112px column).
4. **Finexy Cadence Telemetry Shelf (Bottom Footer)**:
   - Below the chart, render a 3-pod operational telemetry footer:
     - **Pod 1 (Velocity Pace)**: Average intake per interval (`₹ 13.08L / wk`).
     - **Pod 2 (Peak Cadence)**: Highest intake surge point (`Peak: 3 Nov · ₹ 17.0L`).
     - **Pod 3 (Realized Yield)**: Conversion ratio percentage (`0.0% · Cadence benchmark`).

### C. Pipeline Distribution Donut Chart Overhaul (`PipelineDonutChart.tsx` & `.module.scss`)
1. **Streamlined Donut Geometry**:
   - SVG diameter: `176px` (viewBox: `0 0 180 180`, `radius = 68`, `strokeWidth = 12`).
   - Central aperture: `120px` diameter, providing crisp breathing room for Total Valuation and deal count.
2. **Eliminated "Detached Underline" Defect**:
   - Micro-meter height reduced from 4px to **2.5px** (`.microTrack`).
   - Integrated as a clean, inset instrument track with 2px top margin.
   - Category rows styled as interactive micro-cardlets with subtle hover padding and smooth `#f7f7f5` wash.
3. **WCAG AA Calibrated Palette**:
   - Lead: `#111111` (Obsidian Ink)
   - Secondary: `#ea002a` (Signature Brand Red)
   - Tertiary: `#3f3f46` (Deep Charcoal Zinc)
   - Quaternary: `#52525b` (Medium Zinc — 5.8:1 text contrast on white)

---

## 4. Verification & Delivery Gates

1. **Pixel-Perfect Equal Height**: Verify that both cards terminate at the exact same vertical baseline across all screen widths above 1180px.
2. **Type Safety**: `npx tsc --noEmit` must pass with 0 errors.
3. **Knowledge Graph**: `graphify update .` must update with exit code 0.
4. **Git Governance**:
   - Author: Strictly `Fenar7 <86710532+Fenar7@users.noreply.github.com>`
   - Branch: `redesign/commercial-desk-notion-linear`
   - PR State: PR #122 and PR #121 remain strictly **`OPEN`** on GitHub. Zero agent merges.

---

## 5. Immediate Next Step

In strict compliance with our behavioral safety guidelines and zero-tolerance policy on unsolicited execution, **no code has been modified**. 

Please review this plan and reply with **"proceed"** or **"do it"** to authorize execution.
