# Marca Ubi Commercial Desk — Master Sidebar Architecture, Swiss Typography Dual-Font System & Visual Cockpit Height Equalization (V5)

**Repository:** `Fenar7/marca_ubi_web_hosting`  
**Child PR:** [#122](https://github.com/Fenar7/marca_ubi_web_hosting/pull/122) (Targeting `redesign/crm-commercial-desk-master-luxury-cockpit`)  
**Base Cockpit PR:** [#121](https://github.com/Fenar7/marca_ubi_web_hosting/pull/121)  
**Author:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Status:** Strictly OPEN for Human Review & Direct Approval. Zero automated merges.

---

## 1. Architectural Summary & Scope of Overhaul

Following forensic audit and benchmark alignment against **AI Manager** and **Finexy**, this sprint executes the complete V5 overhaul across core surfaces:

### A. Tier 2 Visual Intelligence Cockpit Height Equalization & Baseline Lock
- **Height Synchronization (0px Delta)**: Fixed the ~158px height delta between `CommercialVelocityBarChart` and `PipelineDonutChart`. Applied `height: 100%`, `flex: 1 1 auto`, and `justify-content: space-between` to both card containers and their parent grid columns (`.chartColumn`, `.donutColumn`) in `OverviewWorkspace.module.scss`. Both cards now stretch and terminate at the exact same horizontal baseline across all desktop viewports.
- **Finexy Cadence Telemetry Shelf**: Integrated a stately 3-pod operational footer into `CommercialVelocityBarChart` (`.telemetryShelf`):
  - **Pod 1 (Velocity Pace)**: Average intake cadence (`₹ 13.08L / wk`).
  - **Pod 2 (Peak Cadence)**: Highest intake surge point (`Peak: 3 Nov · ₹ 17.0L`).
  - **Pod 3 (Realized Yield)**: Conversion ratio percentage (`0.0% · Cadence benchmark`).
  This balances vertical purpose between the left bar chart and the right category list.

### B. Commercial Velocity Dual-Bar Chart Overhaul (`CommercialVelocityBarChart.tsx` & `.module.scss`)
- **Purged Grey Test-Tube Monoliths**: Eliminated permanent grey `.channelTrack` rects. Bars now rise freely from an open-air white canvas. Slot capsules are now ephemeral hover washes (`#f5f5f3`) that fade in only behind the hovered month (`.slotCapsuleIdle` vs `.slotCapsuleHover`).
- **True Grounded Pill Geometry**: Replaced generic `<rect rx="6">` with authentic SVG path `getGroundedPillPath` (flat baseline grounding with rounded top shoulders `rx="5"`), preventing floating sausages.
- **Calibrated Zero-Baseline Tick**: When realized revenue is ₹0, renders an ultra-delicate grounded zero tick (`fill: #e2e2df; width: 18px; height: 3px; rx: 1.5px`), looking like a calibrated zero tick on an expensive chronograph.
- **Expanded Headroom ViewBox**: Expanded SVG viewBox to `0 0 640 300` (`chartHeight = 232px`, +38% vertical headroom), with `barWidth = 18px`, `barGap = 6px`.

### C. Pipeline Distribution Donut Chart Overhaul (`PipelineDonutChart.tsx` & `.module.scss`)
- **Streamlined Donut Geometry**: Calibrated SVG diameter to 176px (viewBox `0 0 180 180`, radius `68`, stroke width `12`, aperture `120px`), providing crisp breathing room for Total Valuation and deal count.
- **Eliminated "Detached Underline" Defect**: Replaced the 4px full-width bar with sleek **2.5px inset micro-meters** (`.microTrack` with `margin-top: 1px`). Category rows styled as interactive micro-cardlets with subtle hover padding and smooth `#f7f7f5` wash.
- **WCAG AA Calibrated Luxury Palette**: Upgraded category colors to strictly exceed WCAG AA contrast on white:
  - Lead: `#111111` (Obsidian Ink)
  - Secondary: `#ea002a` (Signature Brand Red)
  - Tertiary: `#3f3f46` (Deep Charcoal Zinc — >7:1 contrast)
  - Quaternary: `#52525b` (Medium Zinc — >5.8:1 contrast)

### D. Master Sidebar Redesign (`AdminSidebar.tsx` & `.module.scss`, `UserProfileDropdown.tsx` & `.module.scss`)
- **Integrated Search Launcher**: In-sidebar search capsule (`🔍 Search or navigate... ⌘K`) triggering the Command Palette modal. In collapsed mode (72px rail), renders a clean 38px search icon button.
- **Collapsible Navigation Groups**: Added accordion state with rotating micro-chevrons (`Work`, `Workspace`).
- **Velvety Warm Alabaster Active State**: Replaced the harsh 3px left red border strip with a soft `#f2f2ef` / `#f5f5f3` rounded pill, dark obsidian `#111111` typography, and matching icon.
- **Urgent Follow-Up Badge Refinement**: Converted from jarring neon pink to an elegant soft rose capsule (`#fee2e2`, `#991b1b`, border `#fecaca`), zero AI slop.
- **Executive Profile Cardlet**: Upgraded `UserProfileDropdown` trigger to a 52px cardlet with avatar squircle (32×32px), emerald live presence indicator dot (`#10b981`), Circular XX name, Graphik role badge (`Admin`), and SVG dual selector chevrons (`⇅`).

### E. Dual-Font Swiss Scorecards & Executive Masthead (`ExecutiveTelemetryMasthead.tsx` & `.module.scss`)
- **Restored Public Site Swiss Typography**: Replaced chunky bold numbers by wiring `.primaryMetric` directly to `var(--font-helvetica-neue)` with `font-weight: 300` (Light), `-0.035em` tracking, and `tabular-nums lining-nums`.
- **Card 1 as Architectural Anchor**: Features a crisp 3px solid Marca Ubi Red (`#ea002a`) top crown, subtle alabaster stationery paper gradient, and an inverted obsidian badge (`39 Deals`).

---

## 2. Technical Quality & Verification Results

1. **TypeScript Compiler Check**:
   - Command: `npx tsc --noEmit`
   - Result: **0 errors across the entire codebase** (Exit code 0).
2. **Knowledge Graph**:
   - Command: `graphify update .`
   - Result: **7,529 nodes, 12,416 edges, 481 communities rebuilt** (Exit code 0).
3. **Regression Contracts**:
   - Command: `npx tsx --test tests/unit/phase-2-brand-upgrade-layout-and-fixed-rail.test.ts`
   - Result: **5/5 tests passing** (100% pass rate).
4. **Git Authorship & Rules**:
   - Author: Strictly `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
   - PR Titles: Strictly ZERO `feat:` or `feat` prefixes.
   - Merging Policy: Strictly OPEN awaiting manual human review.
