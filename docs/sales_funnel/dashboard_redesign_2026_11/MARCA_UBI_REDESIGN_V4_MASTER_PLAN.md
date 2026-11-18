# Marca Ubi CRM — Commercial Desk Redesign V4 Master Specification
## Complete Overhaul: Sidebar Architecture, Swiss Typography Dual-Font System & Visual Graphics Cockpit

**Document Path:** `docs/sales_funnel/dashboard_redesign_2026_11/MARCA_UBI_REDESIGN_V4_MASTER_PLAN.md`  
**Date:** 2026-11-15  
**Status:** Proposal for user review and explicit authorization. **Zero execution without explicit user 'proceed'.**  
**Author:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Benchmark Archetypes:** AI Manager (Sidebar & Ledger) & Finexy (Fintech Cockpit & Visual Graphics)

---

## 1. Forensic Audit & Root Cause Analysis

### A. Defect 1: AdminSidebar Was Completely Un-Redesigned
- **Finding**: In previous sprints, `AdminSidebar.tsx` was neglected. It retained:
  - An outdated brand header with a cramped `< ⌘B` button.
  - Zero search launcher (users had no in-sidebar search affordance).
  - Stiff, flat group headers (`COMMERCIAL`, `OPERATIONS`, `WORKSPACE`) with no collapsible accordions.
  - A harsh neon pink follow-up badge (`background: rgba(234, 0, 42, 0.08); color: #9c001e`).
  - An aggressive 3px red vertical strip on active items that feels dated and jarring.
  - A crude bottom user profile pod (a black circle with 'N' and raw unstyled text).
- **Benchmark Resolution (AI Manager & Finexy)**:
  - Add in-sidebar quick search launcher (`🔍 Search... ⌘S`) opening the Command Palette.
  - Collapsible navigation groups with smooth micro-chevrons (`OVERVIEW`, `TOOLS`, `WORKSPACE`).
  - Sleek active item: soft warm alabaster pill (`#f5f5f3`) with dark ink text and no harsh red strip.
  - Soft neutral badge for follow-up counts.
  - Architectural bottom user cardlet with avatar photo/initials, name, role badge, and switcher chevron (`⇅`).

### B. Defect 2: Card Fonts Rendered Fat & Heavy Instead of Sleek Swiss Thin
- **Finding**: In `ExecutiveTelemetryMasthead.module.scss`, `.primaryMetric` was declared as:
  ```scss
  font-family: var(--font-circular), var(--font-helvetica-neue), sans-serif;
  font-weight: 600;
  ```
  Because Circular XX is listed first and only has weights 400, 500, and 700, the browser resolved weight 600 to Bold (weight 700). As a result, the primary metrics (`₹ 65,40,000`, `₹ 0`, `₹ 23,54,500`) rendered as heavy, thick, clunky bold text.
- **Brand Typography DNA (User-Side Website & Swiss Reference)**:
  - In `src/app/fonts.ts` and `src/app/styles/client-mixins.scss`:
    - `$font-helvetica` (`var(--font-helvetica-neue)`) contains `HelveticaNeue-Thin` (weight 100/200) and `HelveticaNeue-Light` (weight 300).
    - On the main website, large display numerals and hero headlines use this razor-thin, minimal weight (`font-weight: 300` / `200; letter-spacing: -0.04em`).
  - **Benchmark Resolution**:
    - Wire `--font-admin-metric: var(--font-helvetica-neue), "Helvetica Neue", sans-serif` directly to `.primaryMetric` with `font-weight: 300` (Light) or `200` (Thin) and `font-variant-numeric: tabular-nums lining-nums`.
    - Retain Circular XX Medium (`weight: 500`) strictly for structural kickers and card headers.
    - Retain Graphik Book/Medium for operational text and footers.

### C. Defect 3: Commercial Velocity Looked Like Grim Pitch-Black Monoliths
- **Finding**:
  - In `CommercialVelocityBarChart.tsx`, when realized revenue in a given timeframe was 0, the red bar was suppressed. This left ONLY five pitch-black intake columns (`#111111`) sticking straight up without visual context.
  - Column spacing had awkward whitespace, and dotted gridlines looked raw.
- **Benchmark Resolution (Finexy Dual-Bar Archetype)**:
  - Introduce **subtle background column tracks** (`#f5f5f3` or `#f0f0ed`) for each monthly slot. Even when realized revenue is 0, the chart renders an intentional, elegant slot channel rather than an empty void or stark black gravestones.
  - Dual pill bars: Intake in deep obsidian/slate (`#18181b`) with rounded caps (`rx="8"`), Converted in signature brand red (`#ea002a`) with rounded caps (`rx="8"`).
  - Balanced slot occupancy: 52% of slot width (22-24px bars with 6px gap).
  - Crisp hairline gridlines (`#f0f0ed`) and formatted Y-axis milestones (`₹ 20L`, `₹ 15L`, `₹ 10L`, `₹ 5L`, `₹ 0`).

### D. Defect 4: Pipeline Distribution Donut Was Tiny & Isolated
- **Finding**: The donut ring was constrained to 175px in a giant card, surrounded by vast empty whitespace, with four dry bullet points stranded below.
- **Benchmark Resolution**:
  - Expand SVG geometry: 200×200 viewBox with `radius = 72`, `strokeWidth = 14`, expanding the interior hole to 132px for the central total valuation metric.
  - Replace dry bullet points with a **ranked cardlet list**: each category features a colored swatch, category name, horizontal micro-progress track, percentage pill, and tabular currency.

---

## 2. Exhaustive Step-by-Step Implementation Blueprint

### Phase 1: Master Sidebar Redesign (`AdminSidebar.tsx` & `.module.scss`)
1. **Brand Lockup**:
   - Monogram emblem with Marca Ubi red dot + Circular XX wordmark.
   - Clean collapse button (`⌘B`) integrated seamlessly into the top border.
2. **Search Launcher**:
   - In-sidebar search capsule: `<button className={styles.searchLauncher}><span>🔍 Search or navigate...</span><kbd>⌘S</kbd></button>`.
   - Dispatches `open-command-palette` custom event on click.
3. **Collapsible Navigation Groups**:
   - Add accordion toggle state for each group (`Work`, `Workspace`).
   - Smooth rotate transition on the chevron (`transform: rotate(180deg)`).
4. **Item & Badge Styling**:
   - Active state: `#f5f5f3` warm alabaster pill, `#111111` bold text, matching icon (no harsh 3px red strip).
   - Follow-up count: soft neutral capsule (`#ebebea`, `#454542`) or subtle brand red dot for urgent tasks (zero neon pink).
5. **Bottom Profile Pod**:
   - Redesign `UserProfileDropdown.tsx` trigger into a refined cardlet: avatar image or deterministic pastel monogram, user name, role badge (`Admin`), and selector chevron (`⇅`).

### Phase 2: Dual-Font Swiss Scorecards (`ExecutiveTelemetryMasthead.tsx` & `.module.scss`)
1. **Typographic Hierarchy**:
   ```scss
   .primaryMetric {
     font-family: var(--font-helvetica-neue), "Helvetica Neue", -apple-system, sans-serif !important;
     font-weight: 300 !important; // Swiss Light razor-sharp aesthetic
     font-size: clamp(1.85rem, 2.3vw, 2.35rem);
     letter-spacing: -0.04em;
     font-variant-numeric: tabular-nums lining-nums;
     color: #111111;
     margin-bottom: 8px;
     line-height: 1.1;
   }
   ```
2. **Card Surface Elevation**:
   - **Card 1 (Total Pipeline Valuation)**: Pure white surface with a 2px brand red top hairline accent line (`#ea002a`), brand dot, and deals count pill.
   - **Card 2 (Realized Revenue)**: Pure white surface, delta trend pill (`↗ +X%` or calm `—`), and cadence benchmark.
   - **Card 3 (Weighted Yield)**: Pure white surface, monospace ratio pill (`36.0%`), and probability-calibrated potential.
   - **Card 4 (Commercial Velocity)**: Pure white surface, target pill (`Target < 21d`), and turnaround days.

### Phase 3: Commercial Velocity Dual-Bar Chart Overhaul (`CommercialVelocityBarChart.tsx`)
1. **Background Column Tracks**:
   - For each month, render a full-height subtle background track (`fill="#f5f5f3"` or `#f7f7f5"`, `rx="8"`) representing the slot channel.
2. **Dual-Column Geometry**:
   - Intake Bar: Deep obsidian/slate `#18181b`, width 22px, `rx="8"`.
   - Realized Bar: Signature brand red `#ea002a`, width 22px, `rx="8"`.
   - When realized revenue is 0, render a clean baseline dash or 0-level ghost pill rather than an empty void.
3. **Refined Hairline Grid**:
   - Hairline lines (`stroke="#f0f0ed"`, `strokeWidth="1"`).
   - Clean Y-axis INR labels in Graphik Medium (`10px`, `#8c8c88`).

### Phase 4: Pipeline Distribution Donut Overhaul (`PipelineDonutChart.tsx`)
1. **Expanded SVG Donut Geometry**:
   - `viewBox="0 0 200 200"`, `radius = 72`, `strokeWidth = 14`.
   - Interior hole expanded to 132px.
   - Center text: "TOTAL PIPELINE" in Graphik uppercase (`10px`), and full valuation (`₹ 65.4L`) in Helvetica Neue Light (`1.45rem`, `font-weight: 300`).
2. **Structured Category List**:
   - For each category: colored swatch, category name, horizontal micro-bar (`height: 3px; background: color`), percentage pill, and formatted currency amount (`₹ 24,00,000`).

---

## 3. Strict Verification & Delivery Gates
1. **Type Safety**: `npx tsc --noEmit` must pass with exit code 0 (zero errors).
2. **Knowledge Graph**: `graphify update .` must pass with exit code 0.
3. **Branch & Author Rules**:
   - Branch: `redesign/commercial-desk-notion-linear`
   - Author: Strictly `Fenar7 <86710532+Fenar7@users.noreply.github.com>`
   - PR Title & Commits: Strictly NO `feat:` or `feat` prefixes.
4. **PR Merging Rule**: PR #122 and PR #121 must remain strictly in an **OPEN** state. Zero merges by agent.

---

## 4. Immediate Next Step
As mandated by the **Strict Behavioral Rule** and **Critical Zero-Tolerance Addendum**, no code modifications will be executed until you review this plan and explicitly type **"proceed"** or **"do it"** in the chat.
