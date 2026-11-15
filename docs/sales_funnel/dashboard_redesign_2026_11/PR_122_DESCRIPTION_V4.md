# Marca Ubi Commercial Desk — Master Sidebar Architecture, Swiss Typography Dual-Font System & Visual Graphics Cockpit Overhaul (V4)

**Repository:** `Fenar7/marca_ubi_web_hosting`  
**Child PR:** [#122](https://github.com/Fenar7/marca_ubi_web_hosting/pull/122) (Targeting `redesign/crm-commercial-desk-master-luxury-cockpit`)  
**Base Cockpit PR:** [#121](https://github.com/Fenar7/marca_ubi_web_hosting/pull/121)  
**Author:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Status:** Strictly OPEN for Human Review & Direct Approval. Zero automated merges.

---

## 1. Architectural Summary & Scope of Overhaul

Following forensic audit and benchmark alignment against **AI Manager** and **Finexy**, this sprint executes the complete V4 overhaul across four core surfaces:

### A. Master Sidebar Redesign (`AdminSidebar.tsx` & `.module.scss`, `UserProfileDropdown.tsx` & `.module.scss`)
- **Integrated Search Launcher**: In-sidebar search capsule (`🔍 Search or navigate... ⌘K`) triggering the Command Palette modal. In collapsed mode (72px rail), renders a clean 38px search icon button.
- **Collapsible Navigation Groups**: Added accordion state with rotating micro-chevrons (`Work`, `Workspace`).
- **Velvety Warm Alabaster Active State**: Replaced the harsh 3px left red border strip with a soft `#f2f2ef` / `#f5f5f3` rounded pill, dark obsidian `#111111` typography, and matching icon.
- **Urgent Follow-Up Badge Refinement**: Converted from jarring neon pink to an elegant soft rose capsule (`#fee2e2`, `#991b1b`, border `#fecaca`), zero AI slop.
- **Executive Profile Cardlet**: Upgraded `UserProfileDropdown` trigger to a 52px cardlet with avatar squircle (32×32px), emerald live presence indicator dot (`#10b981`), Circular XX name, Graphik role badge (`Admin`), and SVG dual selector chevrons (`⇅`).

### B. Dual-Font Swiss Scorecards & Executive Masthead (`ExecutiveTelemetryMasthead.tsx` & `.module.scss`)
- **Restored Public Site Swiss Typography**: Replaced chunky bold numbers by wiring `.primaryMetric` directly to `var(--font-helvetica-neue)` with `font-weight: 300` (Light), `-0.035em` tracking, and `tabular-nums lining-nums`.
- **Card 1 as Architectural Anchor**: Features a crisp 3px solid Marca Ubi Red (`#ea002a`) top crown, subtle alabaster stationery paper gradient (`linear-gradient(180deg, #ffffff 0%, #fafaf9 100%)`), and an inverted obsidian badge (`39 Deals`). Completely eliminates tacky neon pink gradients while preventing cookie-cutter monotony.
- **Refined Typographic Units**: Card 4 Commercial Velocity days unit styled with dedicated secondary unit (`font-size: 0.52em; font-family: var(--font-graphik)`).

### C. Commercial Velocity Dual-Bar Chart Overhaul (`CommercialVelocityBarChart.tsx` & `.module.scss`)
- **Eliminated Pitch-Black Monoliths**: Introduced Finexy-style architectural background slot capsules (`fill: #f7f7f5`, `rx="8"`) and internal pill channel tracks (`width = 20px`, `rx="6"`).
- **Dual Rounded Pill Bars**: Intake in deep obsidian slate (`#18181b`, `rx="6"`), Realized in Marca Ubi Red (`#ea002a`, `rx="6"`).
- **Zero-Baseline Grounding Indicator**: When realized revenue is ₹0, renders a subtle 4px baseline grounding pill (`fill: #e4e4e1`, `rx="2"`). Guarantees 100% geometric symmetry and eliminates empty voids or lopsided columns.
- **Swiss Hairlines & Scrubber**: Replaced jittery dotted lines with solid hairlines (`#eeeeec`) and added an interactive floating tooltip scrubber dynamically anchored directly above the hovered column.

### D. Pipeline Distribution Donut Chart Overhaul (`PipelineDonutChart.tsx` & `.module.scss`)
- **Expanded Aperture Geometry**: Expanded SVG from 175px to 200×200 viewBox, $R=74\text{px}$, stroke width 14px, expanding the interior aperture to **134px**.
- **Interactive Center HUD**: Shows Total Pipeline valuation in Helvetica Neue Light, along with deal counts. Dynamically pivots to hovered category name, exact currency, and percentage on slice or cardlet hover. Slices expand smoothly (`stroke-width: 18px`).
- **Ranked Category Cardlets**: Replaced raw bullet points with structured cardlets featuring a colored swatch, category name, deal count tag `(18)`, tabular currency, percentage pill badge, and a **4px horizontal micro-progress meter** visually reinforcing relative scale.

---

## 2. Technical Quality & Verification Results

1. **TypeScript Compiler Check**:
   - Command: `npx tsc --noEmit`
   - Result: **0 errors across the entire codebase** (Exit code 0).
2. **Knowledge Graph**:
   - Command: `graphify update .`
   - Result: **7,494 nodes, 12,377 edges, 469 communities rebuilt** (Exit code 0).
3. **Regression Contracts**:
   - Command: `npx tsx --test tests/unit/phase-2-brand-upgrade-layout-and-fixed-rail.test.ts`
   - Result: **5/5 tests passing** (100% pass rate).
4. **Git Authorship & Rules**:
   - Author: Strictly `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
   - PR Titles: Strictly ZERO `feat:` or `feat` prefixes.
   - Merging Policy: Strictly OPEN awaiting manual human review.
