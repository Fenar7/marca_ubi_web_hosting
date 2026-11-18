# Master Luxury Commercial Desk Dashboard Redesign Plan (Conyest, Fundora & Finlo Flash Architecture)

> **Module:** Commercial Desk Executive Workspace (`/admin`)  
> **Directory:** `src/app/admin/components/Dashboard/` & `src/app/admin/components/LuxuryDashboard/`  
> **Target References:** CONYEST Dashboard (`uploaded_media_1794342207825.webp`), Fundora (`uploaded_media_0_1794908736931.webp`), Finlo Flash (`uploaded_media_1_1794908736931.webp`)  
> **Author & Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Status:** ARCHITECTURE UPDATED BASED ON USER FEEDBACK — PENDING EXPLICIT USER APPROVAL ("proceed")

---

## 1. What Changed Based on Your Feedback

1. **Eradicated the Progress Bar in Favor of the Luxury Donut ("Cookie") Chart**:
   - The user explicitly rejected the horizontal progress bar.
   - Replaced with a **high-precision, multi-segment SVG Donut ("Cookie") Chart** directly matching the "Statistic" card in CONYEST / Finlo Flash.
   - Features a hollow center displaying **Total Pipeline Value (`₹ 65,40,000`)**, interactive segment hover animations, and colored square percentage chips (`37%`, `25%`, `21%`, `12%`, `5%`) with service names and values.

2. **Broke the Boring Old 3-Block Structure — Added the Full Reference Widget Ecosystem**:
   - The old layout kept forcing the same basic 3 containers (Masthead, Bar Chart, Ledger).
   - We are introducing the **exact high-end widget ecosystem** seen in the references:
     - **Top Row**: **Executive Virtual VIP Card** (Obsidian dark container with concentric vector arcs, live balance, card toggle switch) + **3 Floating White Scorecards** with trend pills.
     - **Middle Row (65% / 35%)**: **Cash Flow Velocity Bar Chart** (Grounded rounded bars, apex beacon ring) + **Luxury Donut ("Cookie") Chart**.
     - **Secondary Visual Row (New Reference Widgets)**:
       - **Quick Commercial Dispatch Pod** (modeled 1:1 on the reference "Quick Transfer" widget: sales rep avatar chips, amount input, 1-click stage advancement CTA).
       - **Upcoming SLA Follow-up & Touchpoint Feed** (modeled 1:1 on the reference "Upcoming Payments" widget: pending client touches, SLA countdowns, priority urgency badges).
     - **Bottom Row**: **Master Commercial Deals & Transactions Ledger** (full-width luxury data table with status pill badges, client monogram avatars, and drawer integration).

---

## 2. Complete Visual Layout Map

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  Marca Ubi Commercial Desk                                      [Search leads, deals ⌘K]  🔔  [Fenar 👤]│
├────────────────────────────────┬──────────────────────┬──────────────────────┬──────────────────────────┤
│ [VIRTUAL VIP EXECUTIVE CARD]   │ CLOSED REVENUE       │ WEIGHTED VALUE       │ AVG. SALES CYCLE         │
│ MARCA UBI DESK    [Toggle ●]   │ ₹ 0                  │ ₹ 23,54,500          │ 14 Days                  │
│ Active Balance: ₹ 65,40,000    │ vs last month        │ Adjusted for win rate│ Target < 21d             │
│ EXP 11/29     WIN RATE 84%     │ [0.0% —]             │ [↗ +36.0%]           │ [↗ On Track]             │
├────────────────────────────────┴──────────────────────┴──────────────────────┴──────────────────────────┤
│                                                       │                                                 │
│  Cash Flow ⓘ                         [Last 30 Days ⌄] │  Pipeline Allocation ⓘ          [This Month ⌄]  │
│  ₹ 65,40,000                                          │  [Category]  [Stage]                            │
│  [Pipeline Intake] [Converted Revenue] [Net Delta]    │                                                 │
│                                                       │                   ╭────────╮                    │
│            [6 Nov : ₹ 13.7L]                          │                ╭──╯        ╰──╮                 │
│                    ●                                  │               │   ₹ 65.4L      │ (SVG Donut     │
│                    █                                  │               │ 36 Active Deals│  Cookie Chart) │
│       █   █   █    █    █   █                         │                ╰──╮        ╭──╯                 │
│      18O 22O 26O  6N   10N 13N                        │                   ╰────────╯                    │
│                                                       │  ■ 37%  Web & Digital        ₹ 24,00,000        │
│                                                       │  ■ 25%  Full-Suite Advisory  ₹ 16,10,000        │
│                                                       │  ■ 21%  UI/UX Design         ₹ 13,65,000        │
│                                                       │  ■ 12%  Branding              ₹ 8,10,000        │
├───────────────────────────────────────────────────────┴─────────────────────────────────────────────────┤
│                                                       │                                                 │
│  [NEW] Quick Deal Dispatch & Action Pod               │  [NEW] Upcoming SLA Follow-ups & Urgency        │
│  (Ref: Quick Transfer Widget in CONYEST / Finlo)      │  (Ref: Upcoming Payments Widget in Fundora)     │
│  ● Rep Avatars: [FK] [AR] [SD] [MK] (+)               │  • Nexus Enterprise    Follow-up today   [HIGH] │
│  ● Deal Amount: [₹ 15,00,000             ]            │  • Aura Health         Follow-up 2d ago  [OVER] │
│  ● Advance Stage: [Negotiation ⌄] [Execute Action ➔]  │  • Vertex Logistics    Due in 3 days     [MED]  │
│                                                       │                                                 │
├───────────────────────────────────────────────────────┴─────────────────────────────────────────────────┤
│  Master Commercial Deals & Transactions Ledger                                       [Search] [Filter]  │
│  Client / Deal         Service Category    Stage Bucket       Expected Value     Status Badge   Actions │
│  Nexus Enterprise      Full-Suite Advisory Negotiation        ₹ 25,00,000        [Negotiation]  [Open ↗]│
│  Aura Health Global    Branding & Identity Qualified          ₹ 12,00,000        [Proposal]     [Open ↗]│
│  Vertex AI Systems     Web & Digital       Discovery          ₹ 18,50,000        [Discovery]    [Open ↗]│
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Granular Component Specifications

### A. The Donut ("Cookie") Chart Card (`ConyestStatisticDonutCard.tsx`)
- **Dimensions & Container**:
  - Pure white background (`#ffffff`), `border-radius: 20px`, `1px solid rgba(0, 0, 0, 0.06)`, padding `28px`.
  - Header with title `Pipeline Allocation ⓘ` and dropdown `[This Month ⌄]`.
  - Tab pills: `[By Category]` (active dark pill) and `[By Stage]`.
- **SVG Donut Geometry**:
  - ViewBox: `0 0 240 240`, center `(120, 120)`, radius `85`, stroke width `26px`.
  - Segments calculated using `strokeDasharray` and `strokeDashoffset` with rounded stroke ends (`stroke-linecap: round`) and subtle 3px gaps.
  - Hovering a slice smoothly scales the stroke width to `30px` and updates the center label.
- **Center Hero Metric**:
  - Total Pipeline Value: `₹ 65,40,000` (font-size: 22px, font-weight: 700, tabular numbers, `#111827`).
  - Subtitle: `36 Active Deals` (font-size: 11px, font-weight: 500, `#6b7280`).
- **Segment Breakdown Grid Below Donut**:
  - Grid of rows, each containing:
    - Colored percentage badge (e.g. `[37%]` with dark obsidian fill, `[25%]` with crimson fill, `[21%]` with navy fill, `[12%]` with amber fill).
    - Service / Stage name in 13px medium (`#374151`).
    - Formatted currency amount in 13px bold tabular font (`₹ 24,00,000`).

---

### B. Top Row: Virtual VIP Executive Card (`ConyestVirtualCard.tsx`) + 3 Companion Cards
- **Virtual VIP Executive Card (Widget 1)**:
  - Background: Dark forest obsidian `#111827` / `#1f4843` with luminous curved vector watermarks.
  - Top: Branded label `MARCA UBI DESK` + tactile interactive toggle switch.
  - Middle: Label `Active Commercial Balance`, followed by large bold display: `₹ 65,40,000`.
  - Bottom: Chips `EXP 11/29`, `WIN RATE 84%`, `ACTIVE DEALS 39`.
- **Companion Scorecard 1 (Closed Won)**:
  - Metric: `₹ 0`, Subtitle: `vs. previous period`, pill badge `0.0% —`.
- **Companion Scorecard 2 (Weighted Pipeline)**:
  - Metric: `₹ 23,54,500`, Subtitle: `Adjusted for win rate`, emerald pill badge `↗ +36.0%`.
- **Companion Scorecard 3 (Avg. Sales Cycle)**:
  - Metric: `14 Days`, Subtitle: `Target < 21d`, emerald pill badge `↗ On Track`.

---

### C. Middle Left: Cash Flow Velocity Bar Chart (`CommercialVelocityBarChart.tsx`)
- Pure white container (`border-radius: 20px`).
- Header: `Cash Flow ⓘ` + `[Last 30 Days ⌄]` dropdown pill.
- Large headline value: `₹ 65,40,000`.
- Segmented pills: `[Pipeline Intake]` (Active solid black), `[Converted Revenue]`, `[Net Delta]`.
- 8–12 grounded rounded vertical pill bars (`#f1f3f5`, radius 8px).
- Active hovered bar: Signature crimson/slate gradient, topped with apex beacon circle `●` and floating tooltip card (`6 Nov : ₹ 13,73,400`).

---

### D. New Widget Row: Quick Dispatch Pod & Upcoming SLA Feed
1. **Quick Commercial Dispatch Pod (`ConyestQuickDispatchCard.tsx`)**:
   - Modeled 1:1 after the **Quick Transfer / Send Money** widget in CONYEST / Finlo Flash.
   - Horizontal avatar row of commercial representatives: `[FK]`, `[AR]`, `[SD]`, `[MK]` with active selection ring.
   - Quick input for deal valuation and stage selector.
   - Prominent action button: `[Execute Stage Transition ➔]` (hooks directly into `StageTransitionModal`).
2. **Upcoming SLA Urgency Feed (`ConyestSlaFeedCard.tsx`)**:
   - Modeled 1:1 after the **Upcoming Invoices / Scheduled Transactions** widget in Fundora.
   - Real-time list of top 3 pending client interactions with SLA badges:
     - `Due Today` (Amber pill)
     - `Overdue 2d` (Crimson pill)
     - `Due in 3d` (Neutral slate pill)
   - Direct button to launch client dossier drawer (`open-lead-drawer`).

---

### E. Bottom Row: Master Deals & Commercial Ledger Table (`CommercialDealsLedger.tsx`)
- Retains high-density, full-width presentation with search, tab filters (`All`, `High Value`, `Overdue`, `Today`), client monogram avatars, and 1-click stage advancement.

---

## 4. Implementation Steps (To be executed directly by coordinator upon approval)

1. **Delete Stub Wrapper in `page.tsx`**:
   - Render the new master composition directly without dummy `<LuxuryDashboard>` wrappers.
2. **Implement Donut ("Cookie") Chart Component**:
   - Create `src/app/admin/components/Dashboard/LuxuryDonutCookieChart.tsx` and `.module.scss` with dynamic SVG arcs, center total value, and colored percentage badges.
3. **Implement Top Row Virtual VIP Card & 3 Floating Scorecards**:
   - Build `src/app/admin/components/Dashboard/LuxuryVirtualCard.tsx` and update `ExecutiveTelemetryMasthead.tsx`.
4. **Implement Secondary Widget Row**:
   - Build `LuxuryQuickDispatchPod.tsx` and `LuxurySlaFeedCard.tsx`.
5. **Connect Real CRM Data & RLS Boundaries**:
   - Wire `data.categories`, `data.stages`, `data.records`, and `data.chart` from Supabase server props into all widgets.
6. **Verify 100% Quality Gates**:
   - Run `npx tsc --noEmit` (0 errors).
   - Run `npm run test:boundaries`.
   - Run `npx tsx --test tests/unit/crm-workspace-resilience.test.ts`.
   - Audit rendered visual at `http://localhost:3003/admin`.
7. **Commit & Push**:
   - Author: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
   - Commit: Clean, descriptive message without `feat` prefix.
   - Keep PR #125 OPEN for human review.
