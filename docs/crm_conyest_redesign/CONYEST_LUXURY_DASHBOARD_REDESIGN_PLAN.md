# Master Implementation Plan: Full-Fledged Conyest Luxury CRM Dashboard Redesign

> **Feature Directory:** `docs/crm_conyest_redesign/`  
> **Target Sub-Branch:** `redesign/crm-conyest-luxury-dashboard` (branched from `redesign/crm-luxury-editorial-workspace`)  
> **Reference Design:** `CONYEST` Dashboard (`uploaded_media_1794342207825.webp` / `Screenshot 2026-11-11 013315.png`)  
> **Status:** PROPOSED ARCHITECTURE PLAN (Awaiting Explicit User "Proceed" Confirmation)  
> **Authorship Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Strict Policy:** ZERO PR MERGES BY AGENT. All PRs remain in `OPEN` state.

---

## 1. Executive Vision & Alignment

In response to direct user feedback requiring a **full-fledged redesign** matching the attached **CONYEST** dashboard reference, this specification completely replaces the uninspired flat layout with a faithful, high-end, 1:1 translation of the CONYEST design system into the **Marca Ubi Commercial Desk CRM**.

### Key Aesthetic & Architectural Anchors from CONYEST:
1. **Ultra-Clean Soft Canvas (`#f8f8f8`) with Floating Pure-White Cards (`#ffffff`)**:
   - Generous `20px-24px` card border radii with hairline neutral borders (`1px solid #f1f5f9`) and soft ambient elevation (`box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03)`).
2. **Iconic Navigation Sidebar**:
   - Minimalist vertical layout with the **electric lime-green active pill button** (`#94e622`), sleek outline icons, and an elevated **dark forest-pine promo/command card** (`#1f4843`) at the bottom with a bright CTA button.
3. **Clean Global Header Bar**:
   - Large bold page title ("Dashboard" in Circular XX typography), integrated rounded search pill with magnifying glass and keyboard shortcut, notification bell with unread badge, and user profile chip.
4. **4-Card Top Metrics Row**:
   - **Card 1: Virtual Card Widget**: Dark forest obsidian container (`#1f4843`) with curved concentric vector watermark, user account name in tracked uppercase, active toggle switch, large balance figure, and metadata chips.
   - **Cards 2, 3, 4: Pure White Scorecards**: Large bold display numbers, colored trend pills (green `↗ 2.84%`, red `↘ 4.78%`), and prior period comparison subtitles.
5. **Middle Asymmetric Visual Row (68% / 32% Split)**:
   - **Left (68%): "Cashflow" Dual-Directional Bar Chart**:
     - 12-month timeline with dual-directional bars (inbound bars upwards, outflow/closed bars downwards from 0).
     - Rounded pill caps on all bars (`rx: 6, ry: 6`).
     - Interactive hovered month with a luminous capsule halo (`#e2f2cb` border/fill) and floating popover tooltip card.
   - **Right (32%): "Statistic" / Stage Distribution Donut Card**:
     - Segmented SVG donut ring with center total count/value.
     - Sub-tabs (`Income` vs `Expense`) with active accent underline.
     - Colored percentage square badges (`60%`, `15%`, `12%`, `8%`, `5%`) with deal stage names and amounts.
6. **Bottom Commercial Transactions / Deals Ledger Table**:
   - Full-width card with search, period filter, and filter icon.
   - Generously padded rows (`16px-20px`), bold titles, muted categories, tabular monospace amounts, and outline/tinted status pill badges (`Failed`, `Completed`, `Pending`).

---

## 2. Reverse-Engineered Visual Tokens & Specifications

From subagent pixel-level probe analysis of the reference screenshot (`uploaded_media_1794342207825.webp`):

### Color Palette Tokens
```scss
// Frame & Canvas
$conyest-backdrop: #e7e9ed;
$conyest-canvas-bg: #f8f8f8;
$conyest-card-bg: #ffffff;
$conyest-card-border: #f1f5f9;

// Brand & Dark Forest Accents
$conyest-dark-forest: #1f4843;       // Virtual card & bottom promo card bg
$conyest-dark-forest-hover: #193d39;
$conyest-accent-lime: #94e622;        // Active nav pill, toggle, chart bars, CTA
$conyest-accent-lime-hover: #82cb1e;
$conyest-accent-lime-tint: rgba(148, 230, 34, 0.12);

// Chart & Pillar Glow
$conyest-halo-border: #b9e57d;
$conyest-halo-bg: rgba(226, 242, 203, 0.45);
$conyest-bar-dark: #1f4941;

// Status & Trend Badges
$conyest-trend-green-bg: #dcfce7;
$conyest-trend-green-text: #15803d;
$conyest-trend-red-bg: #fee2e2;
$conyest-trend-red-text: #db0f0d;

$conyest-badge-completed-border: #0f172a;
$conyest-badge-completed-text: #0f172a;
$conyest-badge-failed-border: #fca5a5;
$conyest-badge-failed-text: #ef4444;
$conyest-badge-pending-border: #fcd34d;
$conyest-badge-pending-text: #d97706;

// Typography Inks
$conyest-ink-primary: #0f172a;       // Deep crisp slate near-black
$conyest-ink-secondary: #64748b;     // Muted labels and subtitles
$conyest-ink-muted: #94a3b8;         // Table headers and inactive hints
```

### Geometry & Spatial Tokens
```scss
$conyest-radius-card: 20px;
$conyest-radius-pill: 9999px;
$conyest-radius-control: 12px;
$conyest-radius-bar: 8px;

$conyest-card-shadow: 0 4px 20px -2px rgba(12, 12, 13, 0.04), 0 1px 3px rgba(12, 12, 13, 0.02);
$conyest-card-shadow-hover: 0 10px 30px -4px rgba(12, 12, 13, 0.08);
$conyest-grid-gap: 24px;
```

---

## 3. Component Architecture & Blueprint

### A. Refined Sidebar Navigation (`ConyestSidebar.tsx`)
- **Brand Lockup**: Official Marca Ubi logomark (`width: 120px`) with clear hierarchy.
- **Active Navigation Item**: Vibrant chartreuse/lime-green pill (`#94e622`) with dark icon and text, matching the reference `[▦ Dashboard]`.
- **Inactive Navigation Items**: Clean minimalist line icons with `#64748b` text and smooth hover transitions.
  - Items: `Dashboard`, `Deals`, `Leads`, `Ingestion`, `Team`, `Tasks`, `Analytics`, `Settings`.
- **Bottom Sidebar Command Card**:
  - Elevated dark forest container (`#1f4843`) with curved concentric line watermarks.
  - Copy: *"Commercial Intelligence. Gain absolute pipeline control."*
  - Vibrant button: `[New Lead +]` (triggers `open-new-lead-modal`).

### B. Top Header Bar (`ConyestHeader.tsx`)
- **Page Title**: "Dashboard" / "Commercial Desk" (Circular XX Bold, 32px, `#0f172a`).
- **Search Bar**: Pill-shaped input (`#f8f8f8` with subtle border, search icon, placeholder *"Search leads, deals, clients..."*, and `⌘K` shortcut badge).
- **Notification Bell**: Circular icon button with unread red notification dot.
- **User Profile Chip**: Rounded avatar photo + authenticated user's name ("Jamie Smith" -> e.g. "Fenar Khan").

### C. Top 4 Metrics Row (`ConyestMetricsGrid.tsx`)
- **Card 1: Virtual Executive Card Widget**:
  - Background: `#1f4843` with fluid concentric curved arcs (SVG overlay).
  - Top row: User name in tracked uppercase (`JAMIE SMITH` / `MARCA UBI DESK`) + interactive toggle switch (white toggle on lime track).
  - Middle: Label *"Active Commercial Balance"*, followed by large bold amount: `$432,568` (or formatted INR).
  - Bottom row: Metadata chips (`EXP 11/29`, `CVV 232` or `WIN RATE 84%`, `ACTIVE 39`).
- **Card 2: "Total Income / Active Pipeline"**:
  - Pure white card (`#ffffff`), `border-radius: 20px`.
  - Label: *"Total Income"* (`#64748b`, 14px).
  - Metric: `$42,560` (Circular XX Bold, 34px).
  - Footer: Green trend pill `↗ 2.84%` + subtitle *"Last month $38,568"*.
- **Card 3: "Total Expenses / Weighted Forecast"**:
  - Pure white card (`#ffffff`), `border-radius: 20px`.
  - Label: *"Total Expenses"* (`#64748b`, 14px).
  - Metric: `$28,358` (Circular XX Bold, 34px).
  - Footer: Red trend pill `↘ 4.78%` + subtitle *"Last month $26,340"*.
- **Card 4: "Total Saving / Closed Won"**:
  - Pure white card (`#ffffff`), `border-radius: 20px`.
  - Label: *"Total Saving"* (`#64748b`, 14px).
  - Metric: `$14,202` (Circular XX Bold, 34px).
  - Footer: Green trend pill `↗ 1.98%` + subtitle *"Last month $12,230"*.

### D. Middle Visual Row (68% / 32% Split)
- **Left (68%): "Cashflow" Dual-Directional Bar Chart (`ConyestCashflowCard.tsx`)**:
  - Card Header: Title *"Cashflow"*, dropdown pill *"This Year ⌵"*, Total Balance `$432,568`, and legend (`● Income` lime `#94e622`, `■ Expense` dark teal `#1f4843`).
  - Interactive SVG Chart:
    - 12 monthly bars (Jan to Dec).
    - Positive bars extend UP from zero in lime-green (`#94e622`) with rounded top pill caps.
    - Negative bars extend DOWN from zero in dark forest (`#1f4843`) with rounded bottom pill caps.
    - Active/Hovered month (August): Wrapped in a luminous rounded capsule halo (`border: 2px solid #b9e57d; background: rgba(226, 242, 203, 0.45); border-radius: 12px;`).
    - Tooltip Popover floating above:
      ```
      August 2025
      Income:  $9,540
      Expense: $8,230
      ```
- **Right (32%): "Statistic" / Stage Distribution Donut Card (`ConyestStatisticCard.tsx`)**:
  - Card Header: Title *"Statistic"*, dropdown pill *"This Month ⌵"*.
  - Sub-tabs: `Income` vs `Expense` with active lime-green underline indicator.
  - Multi-Segment Donut Ring (SVG stroke-width 24px) with center text:
    ```
    Total Expenses
    $28,358
    ```
  - Segment Breakdown List below donut:
    - `60%` (dark teal badge `#1f4843`) **Rent & Living / Lead Discovery** — `$12,100`
    - `15%` (lime badge `#9dd980`) **Groceries / Proposal Sent** — `$3,000`
    - `12%` (vibrant green badge `#8bdf1d`) **Transportation / Negotiation** — `$2,000`
    - `8%` (mint badge `#d6f7c7`) **Utilities / Contract Review** — `$1,600`
    - `5%` (soft lime badge `#e6f9d8`) **Entertainment / Closed Won** — `$1,400`

### E. Bottom Row: Recent Commercial Transactions Table (`ConyestTransactionsTable.tsx`)
- **Card Header**: Title *"Recent Transactions"*, dropdown *"This Month ⌵"*, filter button icon.
- **Data Table Layout**:
  - Generous `16px-20px` row padding, subtle `1px solid #f1f5f9` bottom hairline dividers.
  - Columns: `Name`, `Type`, `Date`, `Time`, `Amount`, `Note`, `Status`.
  - Column Alignment:
    - `Name`: Bold near-black (`#0f172a`, font-weight: 600, 15px) — e.g. "Electricity Bill", "Weekly Groceries", "Corporate Branding".
    - `Type`: Muted secondary (`#64748b`, 14px) — e.g. "Payments", "Shopping", "Brand Strategy".
    - `Date` & `Time`: Tabular monospace date/time strings.
    - `Amount`: Tabular bold monospace numerals (`$295.41`, `$120.75`).
    - `Note`: Explanatory context string.
    - `Status`: High-end outline/tint status pill badges:
      - `Failed`: soft red outline + text (`#ef4444`).
      - `Completed`: dark neutral outline + text (`#0f172a`).
      - `Pending`: amber/gold outline + text (`#d97706`).
  - Row click dispatches `open-lead-drawer` to seamlessly launch the `ClientDossierDrawer`.

---

## 4. Supabase Data Integration & Permission Guards

The server component in `src/app/admin/(workspace)/page.tsx` will feed real, authenticated CRM data directly into these components:

| Conyest Visual Element | CRM Data Source | RLS / Permission Boundary |
| :--- | :--- | :--- |
| **Virtual Card Balance** | Aggregate active pipeline value (`expected_value` sum across `open` and `potential` stages). | Restricted roles without `can_view_financials` see "Confidential / Authorized Only". |
| **Total Income (Card 2)** | Converted revenue in selected timeframe. | Evaluated server-side via `aggregateTimeframeRevenue`. |
| **Total Expenses (Card 3)** | Weighted pipeline forecast. | Weighted by approved stage probabilities (Qualified 25%, Proposal 50%, Negotiation 85%). |
| **Total Saving (Card 4)** | Net won revenue or conversion count. | Realized closed won contracts. |
| **Cashflow Bar Chart** | Monthly grouped pipeline velocity (Inbound pipeline vs Won/Closed pipeline). | 12-month calendar aggregation. |
| **Statistic Donut Chart** | Stage distribution counts and valuations across configured funnel statuses. | Active funnel stages from `funnel_statuses`. |
| **Recent Transactions Table**| Real commercial leads from `leads` joined with `crm_team_directory` (with fallback to `profiles`). | Bounded to 10 latest records, synthetic benchmarks excluded. |

---

## 5. Implementation Steps & Phased Execution

```
[Phase 1: Sub-Branch & Visual Tokens]
- Create git sub-branch: redesign/crm-conyest-luxury-dashboard
- Define SCSS tokens in src/app/admin/styles/tokens.scss and ConyestTheme.module.scss

[Phase 2: Navigation & Header Conyest Alignment]
- Update AdminSidebar with active lime pill, sleek icons, and bottom dark forest promo card
- Update AdminHeader with search pill input, notification bell, and user profile chip

[Phase 3: Top Metrics Grid & Virtual Card]
- Implement ConyestVirtualCard with fluid SVG waves, toggle, and tracking typography
- Implement ConyestKpiCard scorecards with large Circular XX display numerals and trend pills

[Phase 4: Middle Charts Row (Cashflow & Donut)]
- Implement ConyestCashflowCard with dual-directional bars, rounded caps, hover capsule halo, and popover
- Implement ConyestStatisticCard with multi-segment SVG donut ring and colored percentage badge breakdown

[Phase 5: Bottom Transactions Table]
- Implement ConyestTransactionsTable with clean row padding, tabular amounts, status pill badges, and drawer wiring

[Phase 6: Verification, Test Suites & CTO Audit]
- Update test assertions to verify Conyest component composition
- Run all test suites (43/43 target, 481 extended) and tsc --noEmit
- Push sub-branch and open GitHub PR targeting redesign/crm-luxury-editorial-workspace
- Deploy Senior CTO PR Auditor agent to conduct final review
```

---

## 6. Delivery Gates & Verification Criteria

1. **Visual Fidelity**: Pixel-accurate alignment with `uploaded_media_1794342207825.webp` across card radii (`20px`), colors (`#1f4843`, `#94e622`, `#ffffff`, `#f8f8f8`), and typography.
2. **Type Safety**: 0 TypeScript errors across `tsc --noEmit`. Zero `any` types.
3. **Test Integrity**: 100% test pass rate across all unit test suites.
4. **Git Authorship**: Strictly authored as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
5. **No PR Merges**: PR created and maintained strictly in an **OPEN** state.
