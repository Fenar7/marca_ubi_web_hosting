# Master Architectural Audit & Remediation Plan: Purging AI Slop & Restoring Marca Ubi Brand & Data Telemetry

> **Feature Directory:** `docs/crm_conyest_redesign/`  
> **Status:** FORENSIC AUDIT & PROPOSED REMEDIATION PLAN (Awaiting Explicit User "Proceed" Confirmation)  
> **Target Branch:** `fix/auth-runtime-diagnostics-and-resilience`  
> **Authorship Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Strict Rules:** ZERO Code Execution Without Explicit User Permission. PR Remains in OPEN State.

---

## 1. Forensic Root-Cause Audit: How the Mockup Slop Infiltrated the Build

A line-by-line inspection of commit `b2e8765`, the live screenshots (`screenshot_035251.png` and `screenshot_035301.png`), and the active components revealed that an unadapted personal banking template ("Conyest") was copy-pasted into the Marca Ubi Commercial Desk CRM. This created extreme domain dissonance, clashing color tokens, synthetic arithmetic pricing, and broken operational states.

### 1.1 The Forensic Pathology Matrix

| Component & Location | What Was Rendered in Screenshot | Real Marca Ubi Domain Expectation | Root Cause in Code |
| :--- | :--- | :--- | :--- |
| **Virtual Account Card**<br>`ConyestMetricsGrid.tsx:32-104` | `"JAMIE SMITH"`, `"EXP 11/29"`, `"CVV 232"`, active toggle switch. | **Marca Ubi Commercial Desk**: Authenticated user identity (`Marca Ubi Root Admin`), active pipeline count (`39 Deals`), weighted potential (`₹ 28,35,800`). Zero debit card CVVs. | `page.tsx:79` omitted `full_name` from profile query; `OverviewWorkspace.tsx:233` hardcoded `"JAMIE SMITH"` and personal card fields. |
| **Scorecard 2 (Revenue)**<br>`ConyestMetricsGrid.tsx:107-116` | `"Total Income"` with subtitle `"Last month $38,568"` and trend `"↗ 2.84%"`. | **Closed Converted Revenue**: `₹ 23,54,500` with authentic MoM percentage delta against prior period in full INR. | Subtitle and delta were hardcoded USD string literals in `OverviewWorkspace.tsx:244-245`. |
| **Scorecard 3 (Forecast)**<br>`ConyestMetricsGrid.tsx:118-128` | `"Total Expenses"` with subtitle `"Last month $26,340"` and trend `"↘ 4.78%"`. | **Weighted Pipeline Potential**: `₹ 28,35,800` (calculated from stage probability weights: Qualified 25%, Proposal Sent 50%, Negotiation 85%). | In `OverviewWorkspace.tsx:246`, `data.weightedPotential` was passed into a card titled "Total Expenses" with hardcoded USD subtitles. |
| **Scorecard 4 (Velocity / Win)**<br>`ConyestMetricsGrid.tsx:130-140` | `"Total Saving: ₹ 0"` with subtitle `"Last month $12,230"` and trend `"↗ 1.98%"`. | **Commercial Velocity / Cohort Win Rate**: Average cycle duration (`18.4 days`) or cohort win rate (`X% of eligible leads converted`). | `OverviewWorkspace.tsx:255` used a fake formula `convertedValue * 0.33` with hardcoded USD subtitles. |
| **Cashflow Dual Bar Chart**<br>`ConyestCashflowCard.tsx:15-136` | Dual bars with fixed Y-axis `10K`, `5K`, `0`, `-5k`, `-10k`. Hover tooltip: `"August 2025 Income $9,540 Expense $8,230"`. | **Commercial Pipeline Velocity**: Monthly intake of new inquiries vs monthly converted contract value in full INR, with dynamic scale up to lakhs/crores. | `OverviewWorkspace.tsx:271` never passed the `data` prop; component silently defaulted to static 12-month USD mockup array with fixed scale `maxScale = 11000`. |
| **Statistic Donut Chart**<br>`ConyestStatisticCard.tsx:14-28` | Donut showing personal living expenses: `"Rent & Living $12,100"`, `"Groceries $3,000"`, `"Transportation $2,000"`, `"Utilities $1,600"`, `"Entertainment $1,400"`. | **Pipeline Stage Allocation**: Genuine CRM stages (`Lead Discovery`, `Proposal Sent`, `Negotiation`, `Qualified Scope`, `Closing Review`) with live deal counts and INR valuations. | `OverviewWorkspace.tsx:280` never passed stage items; component defaulted to `DEFAULT_EXPENSE_CATEGORIES`. |
| **Transactions Ledger Table**<br>`ConyestTransactionsTable.tsx:95-124` | Enterprise clients (Sobha Realty Luxury, Raffles The Palm Dubai, Jumeirah Hotels) rendered with micro-amounts: `"$150.00"`, `"$235.00"`, `"$320.00"`, and **EVERY SINGLE ROW marked as "Failed" in bright red**. | **Commercial Engagements Queue**: Actual deal expected values (`₹ 15,00,000`, `₹ 24,00,000`), scheduled follow-up timestamps, and actionable urgency badges (`Follow-up Overdue`, `Due Today`, `On Schedule`). | 1. `page.tsx` never queried `expected_value` in `queueBase`.<br>2. `ConyestTransactionsTable.tsx:118` used synthetic formula `$(150 + index * 85)`.<br>3. Line 108 inverted logic: `selectedQueue === "overdue" ? "Failed" : "Pending"`. |
| **Sidebar Navigation**<br>`AdminSidebar.tsx:118-124` | Active "Overview" pill rendered in **radioactive neon chartreuse (`#94e622`)**, clashing with the official **Marca Ubi Red (`#ea002a`)** button. Murky pine promo card at bottom. | **Marca Ubi Swiss Precision Shell**: Active nav uses Obsidian Black (`#111111`) with pure white text and crisp icon. Remove the fake mockup promo card completely. | Injected foreign `--conyest-*` tokens into `tokens.scss` rather than adapting the structure to `DESIGN.md`. |

---

## 2. Brand Design System Alignment (`DESIGN.md`)

Per `DESIGN.md` (Design Read: `ENERGY 1 / RHYTHM 2 / MOTION 2`), we strictly enforce the authentic Marca Ubi visual identity:

### 2.1 Color Token Purge & Realignment
We will completely purge the alien `--conyest-*` tokens from `src/app/admin/styles/tokens.scss` and bind all components to the approved system:

```scss
// Brand Canvas & Surfaces
--admin-canvas-bg: #f5f5f3;        // Warm-neutral editorial background
--admin-card-bg: #ffffff;          // Crisp paper-white card surfaces
--admin-surface-muted: #efefed;    // Quiet pods, unboxed containers, table headers
--admin-surface-inverse: #111111;  // Obsidian black for Desk Card & Active Nav Pill

// Inks & Typography
--admin-text-primary: #111111;     // Near-black ink for headings & key metrics
--admin-text-secondary: #454542;   // Slate ink for labels & subtitles
--admin-text-muted: #696965;       // Muted metadata (WCAG AA 4.5:1 compliant)

// Brand Accent & Actions
--admin-accent-brand: #ea002a;     // Official Marca Ubi Red for primary CTA (+ New lead)
--admin-btn-primary-hover: #c40023;// Deepened red on hover
--admin-focus-ring: #9c001e;       // Accessible high-contrast focus ring

// Structural Boundaries
--admin-border-subtle: #e7e7e4;    // Hairline row separators & card borders
```

### 2.2 Navigation & Header Refinement
1. **Active Nav Marker**: Replace the radioactive neon lime pill with **Obsidian Black (`#111111`)** background and pure white (`#ffffff`) text/icon, or light warm neutral (`#efefed`) with an `#ea002a` brand indicator.
2. **Purge Fake Promo Card**: Delete `.sidebarPromoCard` ("Analyze spending, gain financial control...") from `AdminSidebar.tsx` to restore clean vertical space.
3. **Typography**: Ensure Circular XX is applied to all prominent numbers and card titles; Graphik for working labels, navigation, and tables. All numerals strictly use `tabular-nums`.

---

## 3. Data Pipeline & Full-Stack Engine Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SUPABASE SERVER DATA ENGINE                           │
│                      src/app/admin/(workspace)/page.tsx                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Profiles Query: Fetch user's actual profile.full_name                    │
│ 2. Prior-Period Fold: Aggregate prior conversions to calculate real MoM %   │
│ 3. Monthly Calendar Aggregation: 12-month Inbound Leads vs Converted Deals  │
│ 4. Queue Selection: Query expected_value & service_category via RBAC guard  │
│ 5. Stage Aggregation: Active funnel_statuses joined with leads count/value  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Hydrated OverviewData Payload)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            OVERVIEW WORKSPACE                               │
│            src/app/admin/components/Dashboard/OverviewWorkspace.tsx          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Row 1: CommercialMetricsGrid (1 Obsidian Desk Card + 3 Stripe Scorecards)   │
│  Row 2: PipelineVelocityCard (68%) + PipelineDistributionCard (32%)         │
│  Row 3: CommercialEngagementsTable (Real INR Deals + Urgency Badges)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Contract Extensions (`dashboardContracts.ts`)
Add RBAC-sanitized selector for queue previews so monetary data is only requested when permitted:
```ts
export function dashboardPreviewSelect(financial: boolean): string {
  const columns = "id, lead_id, name, company, status_id, assigned_to, next_follow_up, created_at, service_category";
  return financial ? `${columns}, expected_value` : columns;
}
```

### 3.2 Extended `OverviewRecord` Interface
```ts
export interface OverviewRecord {
  id: string;
  leadId: string;
  name: string;
  company: string | null;
  stage: string;
  stageBucket: FunnelBucket;
  due: string | null;
  createdAt: string;
  owner: string;
  href: string | null;
  serviceCategory: string | null;
  expectedValue: number | null;
}
```

---

## 4. Component-by-Component Remediation Blueprint

### A. Top Metric Band: `CommercialMetricsGrid` (formerly `ConyestMetricsGrid`)
- **Card 1: Commercial Desk Executive Card (Obsidian Black `#111111`)**:
  - Top Badge: `MARCA UBI · COMMERCIAL DESK` + Live emerald status dot (`#10b981`).
  - Account Title: User's authenticated name (e.g. `MARCA UBI ROOT ADMIN`).
  - Balance: `formatCrmCurrency(data.pipelineValue)` (e.g. `₹ 65,40,000`).
  - Footer (Replacing EXP/CVV):
    - Left: `39 Active Deals`
    - Right: `₹ 28,35,800 Weighted Forecast`
  - Remove toggle switch, credit card expiration, and CVV codes.
- **Card 2: Closed Converted Revenue**:
  - Title: `"Closed Converted Value"`
  - Amount: `formatCrmCurrency(data.convertedValue)` (e.g. `₹ 23,54,500`)
  - Trend Pill: `revenueDelta !== null ? `${revenueDelta >= 0 ? '↗' : '↘'} ${Math.abs(revenueDelta)}%` : '—'`
  - Subtitle: Real comparison against prior timeframe (e.g. `"Prior 30 days ₹ 20,61,000"`).
- **Card 3: Weighted Pipeline Forecast**:
  - Title: `"Weighted Pipeline Potential"`
  - Amount: `formatCrmCurrency(data.weightedPotential)` (e.g. `₹ 28,35,800`)
  - Metric Pill: `43.4% of gross pipeline`
  - Subtitle: `"Stage probability weighted · 39 active deals"`
- **Card 4: Commercial Velocity / Cohort Realization**:
  - Title: `"Commercial Velocity"`
  - Amount: `data.averageCycleDays !== null ? `${data.averageCycleDays.toFixed(1)} days` : '—'`
  - Metric Pill: `Target < 21 days`
  - Subtitle: `"Average lead-to-conversion velocity"`

### B. Middle Asymmetric Row: Pipeline Velocity & Stage Distribution
- **Left Card: Commercial Pipeline Velocity (`ConyestCashflowCard`)**:
  - Rebranded from "Cashflow" to **"Pipeline Velocity"**.
  - Positive Bars (Upward): Inbound deal intake created per month in INR.
  - Negative Bars (Downward): Realized converted contracts per month in INR.
  - Dynamic coordinate normalization: Replace fixed `maxScale = 11000` with dynamic maximum computed from actual data, with clean Indian Rupee Y-axis markers (`₹50L`, `₹25L`, `0`, `-₹25L`, `-₹50L`).
  - Popover Tooltip: Real formatted INR currency (`formatCrmCurrency`), zero USD dollars.
- **Right Card: Pipeline Stage Distribution (`ConyestStatisticCard`)**:
  - Rebranded from "Statistic" to **"Pipeline Distribution"**.
  - Tabs: **"By Value"** (pipeline INR distribution) vs **"By Volume"** (deal count distribution).
  - Center Donut: Active pipeline total (`₹ 65,40,000`) or deal count (`39 Deals`).
  - Stage Rows:
    - `Lead Discovery` (`45%` · `₹ 29,43,000` · `14 deals`)
    - `Proposal Sent` (`25%` · `₹ 16,35,000` · `10 deals`)
    - `Negotiation` (`15%` · `₹ 9,81,000` · `7 deals`)
    - `Qualified Scope` (`10%` · `₹ 6,54,000` · `5 deals`)
    - `Closing Review` (`5%` · `₹ 3,27,000` · `3 deals`)
  - **Zero groceries, zero rent, zero household utilities.**

### C. Bottom Section: Commercial Engagements Queue (`ConyestTransactionsTable`)
- **Headers & Structure**:
  - Columns: `Client & Company | Stage | Contract Value | Account Executive | Due / Follow-up | Urgency Health | Action`
- **Valuation**:
  - Display actual `expected_value` in full INR via `formatCrmCurrency` (e.g. `₹ 15,00,000`, `₹ 24,00,000`).
  - If financial access is restricted: Display `"Confidential"`.
  - **Zero `$(150 + index * 85)` arithmetic hacks.**
- **Urgency Health Status Badges (Replacing "Failed")**:
  - **Overdue Touchpoints**: `"Follow-up Overdue"` (`#fff0f2` bg, `#9c001e` text, `#ea002a` dot).
  - **Today's Actions**: `"Action Required Today"` (`#fffbeb` bg, `#78350f` text, `#d97706` dot).
  - **Scheduled Contacts**: `"On Schedule"` (`#f2f2f0` bg, `#393936` text).
  - **Converted Contracts**: `"Contract Closed"` (`#ecfdf5` bg, `#065f46` text).
  - **Zero active opportunities stamped as "Failed".**

---

## 5. Verification Gates & Execution Invariants

1. **Security & RLS Defense**:
   - Verify that `expected_value` is never selected from Supabase when `canFinancial` is false (`tests/unit/dashboard-server-assembly.test.ts`).
2. **Directory Fallback Resilience**:
   - Verify that failure of `crm_team_directory` falls back cleanly to `profiles` without crashing (`tests/unit/crm-workspace-resilience.test.ts`).
3. **Unit Test Pass Rate**:
   - All 1,312 unit tests across 326 test suites must pass with 0 failures (`npm run test:unit`).
4. **Zero TypeScript Errors**:
   - `npx tsc --noEmit` must report exactly 0 errors.
5. **Git Authorship**:
   - Commits authored strictly as: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
6. **PR Safety Policy**:
   - PR #117 remains strictly in an **OPEN** state. Zero merges.

---

## 6. Delivery Confirmation Request

Under the **Strict Behavioral Rule** and **Critical Zero-Tolerance Addendum**, this plan is presented for review. **No code edits will be performed until you explicitly review this plan and type "proceed" or "do it" in the chat.**
