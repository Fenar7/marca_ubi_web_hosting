# Master Architecture & Redesign Plan V9: Thin Editorial Typography, 100% Functional Interactive Dropdowns & Pure Fundora Parity

**Target Module**: Commercial Desk Overview Cockpit (`/admin`)  
**Target Components**:
- `src/app/admin/components/Dashboard/CommercialVelocityBarChart.tsx` (& `.module.scss`)
- `src/app/admin/components/Dashboard/PipelineDonutChart.tsx` (& `.module.scss`)
- `src/app/admin/components/Dashboard/ExecutiveTelemetryMasthead.tsx` (& `.module.scss`)
- `src/app/admin/components/Dashboard/CommercialDealsLedger.tsx` (& `.module.scss`)
- `src/app/admin/components/Dashboard/OverviewWorkspace.tsx` (& `.module.scss`)  
**Reference Archetypes**: Fundora (`uploaded_media_1_1794814687509.webp`), Finlo Flash (`uploaded_media_2_1794814687509.webp`), Recover (`uploaded_media_0_1794814687509.webp`)  
**Author**: Fenar7 `<86710532+Fenar7@users.noreply.github.com>`  
**Branch**: `redesign/commercial-desk-notion-linear`  
**PR Policy**: Strictly **OPEN** (PR #122 Child, PR #121 Base) — *Zero Agent Merges*.

---

## 1. Forensic Audit: What the User Flagged in Live Output

Based on the live screenshots (`Screenshot 2026-11-16 143237.png` and `Screenshot 2026-11-16 143255.png`), three critical deficiencies were identified:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ THE 3 CRITICAL DEFICIENCIES IN THE CURRENT IMPLEMENTATION                                        │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. BULKY BOLD TYPOGRAPHY INSTEAD OF THIN EDITORIAL FONT:                                         │
│    • Current: Hero valuations ('₹ 65,40,000') use font-family: var(--font-circular);             │
│      font-weight: 700 (Heavy bold sans), creating a heavy, generic AI look.                      │
│    • Available in Project: src/app/fonts.ts contains Helvetica Neue Thin & Light                 │
│      (var(--font-helvetica-neue), weights 100, 200, 300) and Graphik Thin & Light               │
│      (var(--font-graphik), weights 100, 200, 300).                                              │
│    • Fundora Benchmark Parity: Fundora Cash Flow ('$342,323.44') uses an ultra-refined,          │
│      lightweight geometric numeral with generous tracking, tabular numerals, and tall figures.  │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. NON-FUNCTIONAL DUMMY DROPDOWN SPANS (User Screenshot 143255):                                │
│    • Current Left Card: <span className={styles.timeframePill}>{periodLabel} ▾</span>            │
│      A static span with NO click handlers, NO dropdown options, and NO timeframe switching!     │
│    • Current Right Card: <span className={styles.viewModePill}>By Category ▾</span>              │
│      A static span with NO toggle or grouping interaction!                                       │
│    • User Direct Reaction: "you are just folling me agin this is not fully funtionls for eg this │
│      button is not fully functional btw".                                                        │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. VISUAL IMPERFECTIONS IN CHART & TOOLTIP STYLING:                                              │
│    • Tooltip Badge: Currently a dark black obsidian pill ('5 Nov - 8 Nov: ₹ 13,73,400').         │
│      Fundora uses an elegant crisp WHITE card badge with a soft drop shadow, border, and dark   │
│      ink typography ('August 2025 : $8,689.20'), connected via a vertical stem line to the apex. │
│    • Legend Duplication in Right Card: The categories were rendered TWICE (once as a 2-row       │
│      legend above the bar, and once as ranked rows below the bar). This creates visual clutter.  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Master V9 Architectural Blueprint

### Core Principle 1: Swiss Thin Editorial Typography (`Helvetica Neue Thin / Light`)
In `src/app/fonts.ts`, the project defines:
- `helveticaNeue` (`--font-helvetica-neue`):
  - `HelveticaNeue-Thin.otf` (weights 100, 200)
  - `HelveticaNeue-Light.otf` (weight 300)
- `graphik` (`--font-graphik`):
  - `Graphik-Thin.ttf` (weight 100)
  - `Graphik-Extralight.ttf` (weight 200)
  - `Graphik-Light.ttf` (weight 300)

**Typography Specification for Cockpit Cards**:
```scss
.heroValuation {
  font-family: var(--font-helvetica-neue), var(--font-graphik), -apple-system, sans-serif;
  font-size: 2.15rem;
  font-weight: 300; // Refined Thin/Light Swiss Editorial
  letter-spacing: -0.035em;
  line-height: 1.1;
  color: var(--admin-text-primary, #111111);
  font-variant-numeric: tabular-nums lining-nums;
  margin: 0.35rem 0 0.75rem;
}
```
This instantly replaces the heavy bold 700 with the exact ultra-luxury Swiss aesthetic demonstrated in Fundora and Finlo Flash.

---

### Core Principle 2: 100% Fully Functional Stateful Interactive Dropdowns

#### A. Left Card: `TimeframeDropdown` (Replaces Dummy Span in `CommercialVelocityBarChart`)
1. **Interactive Trigger**:
   - Converts `.timeframePill` from a static `<span>` into an accessible `<button>` with `type="button"`, `aria-haspopup="listbox"`, `aria-expanded={isOpen}`.
   - Chevron icon rotates smoothly on open (`transform: rotate(180deg)`).
2. **Supported Timeframe Presets**:
   - `Last 7 Days` (`7d` — 7 daily intervals)
   - `Last 30 Days` (`30d` — 8 calibrated intervals)
   - `Last 90 Days` (`90d` — 12 weekly intervals)
   - `This Quarter` (`quarter` — monthly calendar intervals)
   - `This Year` (`year` — 12 monthly intervals)
3. **Behavior & State**:
   - Clicking opens a floating luxury card dropdown menu with subtle border, shadow, and checkmark on active item.
   - Outside click detection (`useRef` + `document.addEventListener("mousedown", ...)`).
   - Keyboard accessible: `Escape` closes, `ArrowDown`/`ArrowUp` navigates, `Enter`/`Space` selects.
   - On selection:
     - Updates local state immediately (instant UI feedback, zero perceived latency).
     - Dynamically recalculates interval data points, dates, and amounts.
     - Calls parent callback `onTimeframeChange(slug)` or triggers `router.push('/admin?timeframe=' + slug, { scroll: false })` via `useTransition` so the full page syncs with the server state.

#### B. Right Card: `ViewModeDropdown` (Replaces Dummy Span in `PipelineDonutChart`)
1. **Interactive Trigger**:
   - Converts `.viewModePill` into an accessible dropdown trigger button.
2. **Supported Grouping Modes**:
   - `By Category`: Groups by core service lines (Web & Digital, Full-Suite Advisory, UI/UX Design, Branding).
   - `By Stage`: Groups active pipeline by CRM funnel stages (Discovery, Proposal, Negotiation, Won/Closing).
   - `By Deal Size`: Groups active deals by commercial volume tiers (Enterprise > ₹10L, Mid-Market ₹5L–₹10L, Growth < ₹5L).
3. **Dynamic Aggregation Engine**:
   - When a mode is selected, the component dynamically aggregates `records` from `OverviewWorkspace`:
     - Calculates proportional segment widths for the continuous horizontal capsule bar.
     - Updates the ranked hairline list below with stage/size metrics.
     - Smooth 0.25s CSS flex transitions for seamless segment resizing.

---

### Core Principle 3: Fundora 1:1 Visual Parity (Chart, Tooltip & Clean Layout)

1. **Crisp White Floating Card Badge & Vertical Stem Line**:
   - Replace the obsidian black pill with Fundora's pristine white floating card:
     ```scss
     .floatingBadge {
       position: absolute;
       background: #ffffff;
       color: #111111;
       border: 1px solid #e7e7e4;
       border-radius: 8px;
       box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
       padding: 6px 12px;
       font-family: var(--font-graphik), sans-serif;
       font-size: 0.74rem;
       font-weight: 500;
       z-index: 10;
       pointer-events: none;
       white-space: nowrap;
       display: flex;
       align-items: center;
       gap: 6px;
     }
     .badgeDate {
       color: #696965;
       font-weight: 500;
     }
     .badgeAmount {
       color: #111111;
       font-family: var(--font-helvetica-neue), sans-serif;
       font-weight: 600;
       font-variant-numeric: tabular-nums;
     }
     ```
   - Add a subtle vertical stem line in SVG connecting the apex beacon circle on the active bar up to the floating card.

2. **Clean Layout in Right Card (Zero Legend Duplication)**:
   - Eliminate the duplicate legend above the bar.
   - Header with title, info icon, thin hero valuation, deal count badge, and functional `By Category ▾` dropdown button.
   - Subtitle: `Active deal value across services`.
   - Continuous horizontal progress bar (14px capsule, `border-radius: 9999px`).
   - Unified ranked detail list below with colored circular dot, title, deal count badge, percentage, and tabular currency.

3. **Active X-Axis Styling**:
   - Active interval label (`5 Nov` or active month) highlighted in crisp black (`#111111`) with bold weight and small red dot indicator below, while inactive labels remain muted `#8c8c88`.

---

## 3. Component Contract & Interface Upgrades

### `CommercialVelocityBarChart.tsx`
```typescript
export interface CommercialVelocityBarChartProps {
  chart?: DynamicRevenueSplinePoint[];
  totalIntake?: number | null;
  totalRealized?: number | null;
  periodLabel?: string;
  timeframe?: TimeframeSlug;
  financials?: boolean;
  onTimeframeChange?: (slug: TimeframeSlug) => void;
}
```

### `PipelineDonutChart.tsx`
```typescript
export type PipelineGroupingMode = "category" | "stage" | "size";

export interface PipelineDonutChartProps {
  categories?: { name: string; value: number; count?: number }[];
  records?: OverviewRecord[];
  totalValue?: number | null;
  financials?: boolean;
  initialMode?: PipelineGroupingMode;
}
```

---

## 4. Verification & Delivery Gates

1. **0 TypeScript Errors**: `$env:NODE_OPTIONS="--max-old-space-size=4096"; npx tsc --noEmit` must return 0 errors.
2. **100% Boundary Tests**: `npm run test:boundaries` must pass cleanly with 0 server-action leaks.
3. **WCAG 2.1 AA Compliance**: All text contrast > 4.5:1, component boundaries > 3:1, 44px tap targets on all dropdown triggers and pills.
4. **Mandatory Author Identity**: All commits authored strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
5. **PR Merging Prohibition**: PR #122 and PR #121 remain strictly **OPEN**. Zero agent merges.

---

## 5. Explicit User Permission Gate

> [!IMPORTANT]
> In accordance with the **Strict Behavioral Rule (NEVER EXECUTE WITHOUT EXPLICIT PERMISSION)** and the **Critical Zero-Tolerance Addendum**, no code files have been modified.
> 
> The plan is submitted for your direct inspection. The engineering team will execute the complete implementation only when you explicitly type **"proceed"** or **"do it"** in the chat window.
