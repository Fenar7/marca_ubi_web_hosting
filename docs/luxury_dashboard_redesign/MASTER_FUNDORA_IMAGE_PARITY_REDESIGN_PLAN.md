# Master Architecture Plan: 1:1 Parity with Fundora Dashboard Structure

> **Feature Directory:** `docs/luxury_dashboard_redesign/`  
> **Target Sub-Branch:** `redesign/crm-conyest-luxury-dashboard` (PR #125 OPEN)  
> **Target Archetype Reference:** `uploaded_media_0_1794984976228.jpg` (User's Exact Benchmark Screenshot)  
> **Current Live Comparison:** `uploaded_media_1_1794984976228.jpg`  
> **Author & Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Status:** MASTER SPECIFICATION COMPLETE — AWAITING EXPLICIT USER APPROVAL ("proceed")

---

## 1. Forensic Visual Gap Analysis

Comparing your current live screen (`uploaded_media_1_1794984976228.jpg`) directly against your uploaded target benchmark (`uploaded_media_0_1794984976228.jpg`):

| Section | Current Live Screen (Image 2) | Benchmark Reference (Image 1) | Architectural Transformation |
| :--- | :--- | :--- | :--- |
| **Top Scorecards Font** | Numbers use heavy `600` bold font. | Numbers use sleek **Swiss Helvetica Neue 300 Light** (`font-weight: 300`, `letter-spacing: -0.035em`, `tabular-nums`). | Revert all `.primaryMetric` and valuation numerals to 300 hairline light font. |
| **Virtual Card Slop** | Blinking green dot + green pill `● LIVE`. | Clean, executive, uncluttered cards with no gimmicky pulsing dots. | Eradicate `.liveIndicator`, `.liveBeacon`, and `@keyframes pulseBeacon`. |
| **Cockpit Row 1 Layout** | Cash Flow (68%) + Donut Chart with 5 stacked rows (32%). | **Two Equal 50% / 50% Cards**: Left = **Earning Overview** (Area Line Chart); Right = **Spending Overview** (Horizontal Legend + Continuous Gradient Bar). | Replace the Donut + vertical table with the exact 50/50 Earning Area Chart + Spending Gradient Bar pair. |
| **Cockpit Row 2 & 3 Layout** | Separate fragmented rows; Deals ledger at the very bottom. | **Asymmetric 65% / 35% Grid**: Left (65%) = **Cash Flow** + **Recent Transactions Table**; Right (35%) = **Tall Upcoming Bill & Payment / SLA Milestones Card** spanning both rows. | Reorganize into Left (Cash Flow + Recent Transactions table) + Right (Tall Upcoming SLA Card with `[View All]` button). |

---

## 2. Complete Visual Layout Blueprint (Matching Image 1)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  Welcome back, Marca Ubi 👋                                                [Last 30 Days ⌄]  [Export ↗]   │
│  Commercial operations, live pipeline, and cash velocity.                                                 │
├─────────────────────┬──────────────────────┬────────────────────────┬─────────────────────────────────────┤
│ EXECUTIVE DESK      │ CLOSED REVENUE ⓘ     │ WEIGHTED VALUE ⓘ       │ AVG. SALES CYCLE ⓘ                  │
│ MARCA UBI  [Toggle] │ ₹ 0                  │ ₹ 23,54,500            │ 14 Days                             │
│ Balance: ₹ 65,40,000│ vs last month        │ Probability adjusted   │ Target < 21d                        │
│ EXP 11/29   WIN 84% │ [0.0% —]             │ [↗ +36.0%]             │ [↗ On Track]                        │
└─────────────────────┴──────────────────────┴────────────────────────┴─────────────────────────────────────┘

============================= ROW 1: TWO EQUAL CARDS (50% / 50%) =============================
┌───────────────────────────────────────────────────┬───────────────────────────────────────────────────────┐
│ Earning Overview ⓘ               [This Month ⌄]   │ Spending Overview ⓘ                  [This Month ⌄]   │
│ ₹ 65,40,000  [+1.5% ↑]                            │ ₹ 65,40,000  [36 Active Deals]                        │
│                                                   │ Spending Breakdown                                    │
│                 [May 2025 : ₹ 8,68,920]           │ ● Web & Digital       ● Full-Suite       ● Others     │
│                           ●                       │   ₹ 24,00,000           ₹ 16,10,000        ₹ 8,10,000 │
│       ╭─────────╮       ╭─┴──────╮                │                                                       │
│    ╭──╯         ╰───────╯        ╰───────╮        │ ┌───────────────────┬──────────────┬────────────────┐ │
│ ───╯                                     ╰─────── │ │███████████████████│██████████████│░░░░░░░░░░░░░░░░│ │ │
│ Jan    Feb     Mar     Apr      May     Jun       │ └───────────────────┴──────────────┴────────────────┘ │ │
│ (Sleek Spline Area Chart with Apex Beacon Ring)   │ (38px Continuous Rounded Gradient Pill Bar — NO LIST!)│
└───────────────────────────────────────────────────┴───────────────────────────────────────────────────────┘

========================= ROW 2 & 3: ASYMMETRIC 65% / 35% WORKSPACE =========================
┌─────────────────────────────────────────────────────┬─────────────────────────────────────────────────────┐
│ Cash Flow ⓘ                                [Yearly ⌄]│ Upcoming Milestones & SLA                       [+] │
│ ₹ 65,40,000                                         │                                                     │
│ [Pipeline Intake]  Converted Revenue   Net Delta    │ ┌───┐  Nexus Enterprise Advisory                >   │
│                                                     │ │ N │  Full-Suite Advisory • Due Today              │
│                             [August 2025 :]         │ └───┘  ₹ 25,00,000                     [Due Today]  │
│                             [ ₹ 8,68,920  ]         │                                                     │
│ 30k                                 O               │ ┌───┐  Aura Health Global                       >   │
│ 20k                                 █               │ │ A │  Branding & Identity • Overdue 2d             │
│ 10k        █                        █               │ └───┘  ₹ 12,00,000                     [Overdue 2d] │
│  0k    █   █   █   █    █   █   █   █   █   █   █   │                                                     │
│       Jan Feb Mar Apr  May Jun Jul Aug Sep Oct Nov Dec │ ┌───┐  Vertex AI Systems                        >   │
│                                                     │ │ V │  Web & Digital • Due in 3d                    │
├─────────────────────────────────────────────────────┤ └───┘  ₹ 18,50,000                     [Due in 3d]  │
│ Recent Transactions                      [Filter ☷] │                                                     │
│ Activity                 Date       Total Amount Status │                                                 │
│ [M] Mobile App Platform  Wed 10:29  +₹ 24,00,000 [✔]  │                                                     │
│ [S] Strategic Advisory   Wed 10:29  +₹ 16,10,000 [✔]  │ ┌─────────────────────────────────────────────────┐ │
│ [D] Brand Architecture   Wed 09:15  +₹  8,10,000 [✔]  │ │ View All Milestone Commitments                  │ │
│ (Clean Monospace Table with Status Pills)           │ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┴─────────────────────────────────────────────────────┘
```

---

## 3. Component-by-Component Specifications

### A. Top Scorecards & Virtual Card (`ExecutiveTelemetryMasthead.tsx`)
- **Restoration of Swiss Hairline Thin Font**:
  - All `.primaryMetric` elements revert to `font-family: var(--font-helvetica-neue)`, `font-weight: 300`, `letter-spacing: -0.035em`, `tabular-nums`.
- **Slop Purge in `LuxuryVirtualCard.tsx`**:
  - Eradicate `<span className={styles.liveIndicator}><span className={styles.liveBeacon} />LIVE</span>`.
  - Balance amount uses `font-weight: 300` Helvetica Neue Light.
  - Card retains clean monogram `MARCA UBI`, toggle switch, and footer metadata chips (`EXP 11/29`, `WIN RATE 84%`, `ACTIVE 39 DEALS`).

---

### B. Row 1 Left: Earning Overview Area Line Chart (`EarningOverviewSplineCard.tsx`)
- **Dimensions & Container**: Pure white card (`#ffffff`, `border-radius: 20px`, `1px solid rgba(0, 0, 0, 0.06)`, padding `24px 26px`, soft shadow).
- **Header**: `Earning Overview ⓘ` on left; pill dropdown `[This Month ⌄]` on right.
- **Valuation Hero**: Swiss thin metric `₹ 65,40,000` (`font-weight: 300`) with emerald pill badge `[+1.5% ↑]`.
- **Interactive SVG Spline / Area Chart**:
  - Smooth cubic bezier spline (`M ... C ...`) across 6 intervals (`Jan` to `Jun`).
  - Underlying area gradient: `#2563eb` at 14% opacity smoothly fading to transparent at zero baseline.
  - Line stroke: `#2563eb` (Royal Navy), `stroke-width: 2.5px`.
  - Active Apex Beacon: Circular target dot (`r=4.5`, fill white, stroke `#2563eb`, stroke-width 2.5px) at peak month (`Apr`/`May`).
  - Vertical Stem Line: Hairline dashed guide line connecting apex to baseline.
  - Floating Tooltip Card: Crisp white pill badge with drop shadow: `May 2025 : ₹ 8,68,920`.

---

### C. Row 1 Right: Spending Overview Continuous Gradient Bar (`SpendingOverviewBarCard.tsx`)
- **Dimensions & Container**: Pure white card (`border-radius: 20px`, `1px solid rgba(0, 0, 0, 0.06)`, padding `24px 26px`).
- **Header**: `Spending Overview ⓘ` on left; pill dropdown `[This Month ⌄]` on right.
- **Valuation Hero**: Swiss thin metric `₹ 65,40,000` (`font-weight: 300`) with pill badge `[36 Active Deals]`.
- **Subhead**: `Spending Breakdown` in 13px medium gray.
- **Horizontal Legend**:
  - Row of side-by-side items:
    - `● Web & Digital` on line 1, `₹ 24,00,000` on line 2 (or inline).
    - `● Full-Suite Advisory` on line 1, `₹ 16,10,000` on line 2.
    - `● Others` on line 1, `₹ 8,10,000` on line 2.
- **Continuous Rounded Gradient Bar (Exact Image 1 Parity)**:
  - Height: `38px–40px`.
  - `border-radius: 10px`.
  - Multi-segment continuous horizontal capsule:
    - Segment 1: Royal Blue gradient (`#1d4ed8` → `#3b82f6`)
    - Segment 2: Sky Blue gradient (`#60a5fa` → `#93c5fd`)
    - Segment 3: Soft Slate (`#e2e8f0` → `#f1f5f9`)
  - **Zero vertical table rows underneath!**

---

### D. Row 2 & 3 Left (65%): Cash Flow + Recent Transactions
1. **Cash Flow Bar Chart (`CommercialVelocityBarChart.tsx`)**:
   - Header: `Cash Flow ⓘ` + `[Yearly ⌄]` pill dropdown.
   - Large metric `₹ 65,40,000` in Swiss 300 Light.
   - Filter pills: `[Pipeline Intake]` (active dark obsidian pill `#111111`), `Converted Revenue`, `Net Delta`.
   - 12 vertical rounded pill bars across months (`Jan`–`Dec`), light gray/slate (`#f1f3f5`, radius 8px).
   - Active bar: Branded gradient highlight with apex target ring `O`, vertical stem line, and floating tooltip `August 2025 : ₹ 8,68,920`.
2. **Recent Transactions Table (`RecentTransactionsTable.tsx`)**:
   - Header: `Recent Transaction` on left, `Filter ☷` on right.
   - Table columns: `Activity`, `Date`, `Total Amount`, `Status`, `...`.
   - Rows: Square brand/deal icons, deal title, date/time in monospace, amount in Swiss thin font with green `+`, and status pill `✔ Success`.

---

### E. Row 2 & 3 Right (35%): Tall Upcoming SLA & Follow-up Card (`UpcomingSlaCard.tsx`)
- **Container**: Tall pure-white card spanning the full height of Cash Flow + Transactions.
- **Header**: `Upcoming Milestones & SLA` with `+` action button.
- **List Items**:
  - Large rounded-square monogram avatars (`[N]`, `[A]`, `[V]`).
  - Deal name & service line.
  - Due date & urgency status pill (`Due Today`, `Overdue 2d`, `Due in 3d`).
  - Amount in Swiss thin tabular numerals.
  - Chevron `>` for 1-click dossier navigation.
- **Footer**: Full-width pill outline button `[View All Milestone Commitments]`.

---

## 4. Verification & Quality Gates

1. **TypeScript Verification**: `npx tsc --noEmit` -> Must exit 0 with 0 errors.
2. **Server Action Boundaries**: `npm run test:boundaries` -> Must pass 100%.
3. **Resilience Test Suite**: `tests/unit/crm-workspace-resilience.test.ts` -> Must pass 6/6.
4. **Visual Audit Against Benchmark**:
   - Row 1: Equal 50/50 Area Line Chart + Horizontal Gradient Bar.
   - Row 2 & 3: 65% Cash Flow + Transactions Table; 35% Tall Upcoming Milestones card.
   - Thin 300-weight numerals throughout.
   - Zero AI-slop `LIVE` pills or pulsing dots.
5. **Git Commit & Authorship**:
   - Strictly authored as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
   - PR #125 remains strictly OPEN awaiting human review.
