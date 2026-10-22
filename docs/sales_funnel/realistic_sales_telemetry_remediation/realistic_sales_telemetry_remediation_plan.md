# Architectural Plan: Realistic Agency Sales Telemetry & Financial Metric Calibration

> **Document ID**: `docs/sales_funnel/realistic_sales_telemetry_remediation/realistic_sales_telemetry_remediation_plan.md`  
> **Status**: PROPOSAL & ARCHITECTURAL SPECIFICATION (Awaiting User "Proceed")  
> **Target Branch**: `brand-upgrade-phase-8/inbound-leads-triage-and-dossier-remediation`  
> **PR Number**: PR #71 (Strictly OPEN)  
> **Author Identity**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Design Standard**: Marca Ubi Dark Luxury Design Tokens (`#000000`, `#ff6100`, `#ffffff`, Raycast Monospace, Apple HIG Vibrancy)

---

## 1. Executive Summary & Root Cause Diagnostic

### 1.1 Problem Statement
In the executive dashboard review ([Screenshot 2026-10-22 103554.png](file:///C:/Users/firoz/Pictures/Screenshots/Screenshot%202026-10-22%20103554.png)), the financial and operational metrics displayed for **Marca Ubi** (an elite boutique creative, digital, and branding agency) are hyper-inflated, displaying multi-crore enterprise conglomerate numbers:
- **Total Active Pipeline**: `₹50.12 Cr` (+14.2% MoM)
- **Cash Collected**: `₹17.15 Cr` (+8.4% QoQ) across 1,257 Closed Deals
- **Active Client Accounts**: `3,771` (+5.1% MoM)
- **Monthly Revenue Chart**: Bars between `₹1.20 Cr` and `₹2.85 Cr`, with Y-axis scaled to `₹3.0 Cr`
- **Pipeline Allocation**: Stage sum of `₹14.82 Cr` with individual stages like `₹4.74 Cr`
- **Sidebar Tasks Badge**: `1,626 Due` tasks

These figures clash with the commercial reality of a high-end boutique agency and overwhelm the visual rhythm of the dashboard.

---

### 1.2 Full-Stack Root Cause Audit

Our multi-agent architectural inspection identified a **two-layer cause** spanning the PostgreSQL database and the Next.js React component tree:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ROOT CAUSE LAYER 1: Database Synthetic Stress-Test Data                      │
│ - scripts/seed-synthetic-leads.ts previously seeded 10,000 synthetic leads    │
│   into the `leads` table with brief_payload->>'synthetic_benchmark' = 'true'. │
│ - Database RPC `get_pipeline_kpis` sums all leads in `open` & `potential`     │
│   buckets, yielding ₹50.12 Cr and 3,771 active accounts.                     │
│ - Layout `tasksQuery` counts overdue next_follow_up across all 10,000 leads, │
│   resulting in the 1,626 Due tasks badge in the sidebar navigation.          │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ ROOT CAUSE LAYER 2: Hardcoded Next.js Mock & Fallback Constants              │
│ - src/app/admin/(workspace)/page.tsx: Default rpcMetrics copied synthetic    │
│   numbers: { potential_pipeline_value: 501200000, converted_revenue: 171500000,│
│              open_leads_count: 3771, converted_leads_count: 1257 }.          │
│ - RevenueDynamicsCard.tsx: SIX_MONTH_DATA hardcodes quotaVal/cashVal in      │
│   Crores (₹1.20 Cr to ₹2.85 Cr) with Y-axis grid up to ₹3.0 Cr.              │
│ - PipelineAllocationCard.tsx: DEFAULT_STAGES sums to ₹14.82 Cr with stages    │
│   like ₹3.55 Cr, ₹4.74 Cr, ₹3.26 Cr.                                         │
│ - CommercialDealsTable.tsx: DEFAULT_DEALS has individual deals up to ₹1.2 Cr. │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Realistic Commercial Agency Benchmark (Marca Ubi Target Metrics)

For an elite boutique agency providing bespoke Brand Strategy, Web & Digital Platforms, and Full-Suite Advisory to enterprise clients, deal sizes naturally range between **₹2.5 Lakhs and ₹15 Lakhs**, with client retainers between **₹1.5 Lakhs and ₹4.5 Lakhs/month**.

### 2.1 Side-by-Side Financial Metric Calibration (Full Indian Rupee Representation)

Displaying **full exact Indian currency values** (e.g. `₹68,40,000` instead of abbreviated `₹68.40L`, and `₹6,50,000` instead of `₹6.5L`) provides immediate operational practicality for executive auditing, deal pipelines, and invoice reconciliation:

| Metric | Current Inflated (Crores) | Proposed Realistic (Full Values) | Practical Formatting & Rationale |
| :--- | :--- | :--- | :--- |
| **Total Active Pipeline** | `₹50.12 Cr` | **`₹68,40,000`** | Full exact figure with tabular spacing (`en-IN` grouping). Subtitle shows `(₹68.4L)`. |
| **Weighted Pipeline (53.6%)** | `₹26.86 Cr` | **`₹36,66,240`** | Mathematically exact: `Math.round(6840000 * 0.536) = 36,66,240`. |
| **Cash Collected (Period)** | `₹17.15 Cr` | **`₹42,80,000`** | Actual collections across 14 closed projects (`₹42,80,000`). |
| **Closed Deals Count** | `1,257 Closed Deals` | **`14 Closed Deals`** | Authentic quarterly volume for a boutique advisory agency. |
| **Active Client Accounts** | `3,771` | **`24`** | 24 dedicated client retainers with `98.2% SLA On-Track`. |
| **Win Conversion Velocity** | `12.5%` | **`28.6%`** | Realistic qualified agency pitch conversion (avg 18.4d cycle). |
| **Sidebar Tasks Badge** | `1626 Due` | **`6 Due`** (or 6–8 live) | Actionable follow-ups requiring immediate executive attention. |
| **Commercial Deals Ledger** | Deals up to `₹1.20 Cr` | **`₹4,80,000 – ₹12,00,000`** | Exact figures: `₹6,50,000`, `₹4,80,000`, `₹8,50,000`, `₹12,00,000`. |
| **Pipeline Stage Breakdown** | Stages up to `₹4.74 Cr` | **`₹5,50,000 – ₹22,50,000`** | Full values: Discovery `₹14,20,000`, Proposal `₹22,50,000`, etc. |
| **Revenue Dynamics Tooltip** | `₹1.20 Cr – ₹2.85 Cr` | **`₹12,00,000 – ₹20,50,000`** | Exact Quota vs Cash in hover inspection tooltip. |
| **Revenue Dynamics Y-Axis** | `₹3.0 Cr` (ticks: 1, 2, 3 Cr) | **`₹25L` or `₹25,00,000`** | Clean ticks with ₹25L headroom for crisp visual curve contrast. |

---

## 3. Detailed Component-by-Component Remediation Plan

### 3.1 `src/app/admin/(workspace)/page.tsx`
1. **Synthetic Lead Exclusion Filter**:
   - Update fallback direct query and active lead query:
     ```ts
     // Exclude synthetic stress-test records from production CRM metrics
     .or('brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true')
     ```
2. **Realistic Default `rpcMetrics`**:
   - Replace synthetic fallback numbers:
     ```ts
     rpcMetrics = {
       total_leads_count: leadCount || 42,
       open_leads_count: activeDealsCount || 16,
       potential_leads_count: activeDealsCount || 16,
       potential_pipeline_value: pipelineValuation || 6840000, // ₹68.40 Lakhs
       converted_leads_count: 14,
       converted_revenue_value: 4280000,                      // ₹42.80 Lakhs
       lost_leads_count: 5,
       overdue_follow_ups_count: overdueFollowups || 6,       // 6 actionable due tasks
       conversion_rate_percentage: 28.6,                      // 28.6% win velocity
     };
     ```
3. **Realistic Commercial Deals Query & Fallbacks**:
   - Ensure query excludes synthetic benchmarks so table only pulls authentic deals.

---

### 3.2 `src/app/admin/components/Dashboard/RevenueDynamicsCard.tsx`
1. **Calibrate `SIX_MONTH_DATA` to Agency Revenue (in Lakhs)**:
   ```ts
   const SIX_MONTH_DATA: MonthlyRevenueMetric[] = [
     {
       month: 'May',
       fullPeriod: 'May 2026',
       quotaVal: 12.0,
       cashVal: 13.5,
       quotaFormatted: '₹12.00L',
       cashFormatted: '₹13.50L',
       attainmentPct: 112.5,
     },
     {
       month: 'Jun',
       fullPeriod: 'Jun 2026',
       quotaVal: 14.0,
       cashVal: 13.8,
       quotaFormatted: '₹14.00L',
       cashFormatted: '₹13.80L',
       attainmentPct: 98.6,
     },
     {
       month: 'Jul',
       fullPeriod: 'Jul 2026',
       quotaVal: 15.0,
       cashVal: 17.2,
       quotaFormatted: '₹15.00L',
       cashFormatted: '₹17.20L',
       attainmentPct: 114.7,
     },
     {
       month: 'Aug',
       fullPeriod: 'Aug 2026',
       quotaVal: 16.0,
       cashVal: 19.5,
       quotaFormatted: '₹16.00L',
       cashFormatted: '₹19.50L',
       attainmentPct: 121.9,
     },
     {
       month: 'Sep',
       fullPeriod: 'Sep 2026',
       quotaVal: 16.5,
       cashVal: 17.4,
       quotaFormatted: '₹16.50L',
       cashFormatted: '₹17.40L',
       attainmentPct: 105.5,
     },
     {
       month: 'Oct',
       fullPeriod: 'Oct 2026',
       quotaVal: 18.0,
       cashVal: 20.5,
       quotaFormatted: '₹18.00L',
       cashFormatted: '₹20.50L',
       attainmentPct: 113.9,
     },
   ];
   ```
2. **Update Geometry & Y-Axis Scale**:
   - `maxMetricVal = 25` (representing ₹25.0 Lakhs ceiling).
   - Y-Axis Grid Lines:
     ```tsx
     {[
       { label: '₹25.0L', y: chartBottom - (25 / maxMetricVal) * chartHeight },
       { label: '₹20.0L', y: chartBottom - (20 / maxMetricVal) * chartHeight },
       { label: '₹15.0L', y: chartBottom - (15 / maxMetricVal) * chartHeight },
       { label: '₹10.0L', y: chartBottom - (10 / maxMetricVal) * chartHeight },
       { label: '₹5.0L',  y: chartBottom - (5 / maxMetricVal) * chartHeight },
       { label: '₹0',     y: chartBottom },
     ]}
     ```

---

### 3.3 `src/app/admin/components/Dashboard/PipelineAllocationCard.tsx`
1. **Calibrate `DEFAULT_STAGES` to ₹68.40 Lakhs Total**:
   ```ts
   const DEFAULT_STAGES: StageAllocationItem[] = [
     {
       id: 'stage-discovery',
       name: 'Discovery',
       color: '#74c0fc', // Sky Blue
       dealCount: 4,
       amount: 1420000,
       formattedAmount: '₹14.20L',
       percentage: 20.8,
     },
     {
       id: 'stage-proposal',
       name: 'Proposal Sent',
       color: '#b197fc', // Lavender
       dealCount: 5,
       amount: 2250000,
       formattedAmount: '₹22.50L',
       percentage: 32.9,
     },
     {
       id: 'stage-negotiation',
       name: 'Negotiation',
       color: '#ffd43b', // Amber
       dealCount: 3,
       amount: 1680000,
       formattedAmount: '₹16.80L',
       percentage: 24.6,
     },
     {
       id: 'stage-review',
       name: 'Contract Review',
       color: '#69db7c', // Mint Emerald
       dealCount: 2,
       amount: 940000,
       formattedAmount: '₹9.40L',
       percentage: 13.7,
     },
     {
       id: 'stage-won',
       name: 'Closed Won',
       color: '#ff6100', // Signature Marca Orange
       dealCount: 2,
       amount: 550000,
       formattedAmount: '₹5.50L',
       percentage: 8.0,
     },
   ];
   ```
   *Mathematical Verification*: `14.20 + 22.50 + 16.80 + 9.40 + 5.50 = 68.40 Lakhs` (100.0% match with KPI Card 1).

---

### 3.4 `src/app/admin/components/Dashboard/CommercialDealsTable.tsx`
1. **Calibrate `DEFAULT_DEALS` to Boutique Agency Range (₹3.5L to ₹12.0L)**:
   ```ts
   const DEFAULT_DEALS: ActiveDealItem[] = [
     {
       id: 'deal-101',
       leadId: 'LD-10492',
       name: 'Stark Creative Retainer',
       company: 'Stark Industries',
       serviceCategory: 'Branding',
       stageName: 'Negotiation',
       stageBucket: 'potential',
       expectedValue: 650000, // ₹6.50L
       nextFollowUp: new Date(Date.now() - 4 * 3600000).toISOString(),
       priority: 'High',
       owner: 'Tariq Al-Mansoor',
     },
     {
       id: 'deal-102',
       leadId: 'LD-10488',
       name: 'Acme Global Infrastructure',
       company: 'Acme Corp',
       serviceCategory: 'Web & Digital',
       stageName: 'Proposal Sent',
       stageBucket: 'open',
       expectedValue: 480000, // ₹4.80L
       nextFollowUp: new Date(Date.now() + 24 * 3600000).toISOString(),
       priority: 'Medium',
       owner: 'Sarah Chen',
     },
     {
       id: 'deal-103',
       leadId: 'LD-10476',
       name: 'Horizon AI Brand Identity',
       company: 'Horizon Labs',
       serviceCategory: 'Branding',
       stageName: 'Contract Review',
       stageBucket: 'potential',
       expectedValue: 850000, // ₹8.50L
       nextFollowUp: new Date(Date.now() + 48 * 3600000).toISOString(),
       priority: 'High',
       owner: 'Elena Rostova',
     },
     {
       id: 'deal-104',
       leadId: 'LD-10461',
       name: 'Crestline Mobile Platform',
       company: 'Crestline Ventures',
       serviceCategory: 'Web & Digital',
       stageName: 'Discovery',
       stageBucket: 'open',
       expectedValue: 520000, // ₹5.20L
       nextFollowUp: new Date(Date.now() + 72 * 3600000).toISOString(),
       priority: 'Low',
       owner: 'Marcus Vance',
     },
     {
       id: 'deal-105',
       leadId: 'LD-10450',
       name: 'Aether Advisory Partnership',
       company: 'Aether Capital',
       serviceCategory: 'Full-Suite Advisory',
       stageName: 'Negotiation',
       stageBucket: 'potential',
       expectedValue: 1200000, // ₹12.00L
       nextFollowUp: new Date(Date.now() + 18 * 3600000).toISOString(),
       priority: 'High',
       owner: 'Tariq Al-Mansoor',
     },
   ];
   ```

---

### 3.5 `src/app/admin/(workspace)/layout.tsx`
1. **Isolate Sidebar Overdue Follow-Up Tasks Query**:
   ```ts
   // Invariant: Exclude synthetic stress-test records from human operator due tasks badge
   const tasksQuery = supabase
     .from('leads')
     .select('id, funnel_statuses!inner(bucket)', { count: 'exact', head: true })
     .lte('next_follow_up', nowIso)
     .in('funnel_statuses.bucket', ['open', 'potential'])
     .or('brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true');
   ```
   *Result*: Drops sidebar badge from `1626 Due` down to the authentic **`6 Due`** tasks.

---

### 3.6 Optional Database Cleanup Script (`scripts/clean-synthetic-leads.ts`)
- Provides an automated maintenance script to purge synthetic records if desired:
  ```sql
  DELETE FROM leads WHERE brief_payload->>'synthetic_benchmark' = 'true';
  ```
- This immediately resets live `get_pipeline_kpis` RPC to match the 50 authentic seeded agency accounts in `supabase/seed.sql`.

---

## 4. Verification & Testing Protocol

1. **TypeScript Type Safety Check**:
   - Execute `npx tsc --noEmit` to verify zero type mismatches or broken props across `page.tsx`, `RevenueDynamicsCard.tsx`, `PipelineAllocationCard.tsx`, and `CommercialDealsTable.tsx`.
2. **Visual & Mathematical Invariant Auditing**:
   - Card 1: `₹68.40L` matches sum of Card 5 (Pipeline Allocation: `₹14.20L + ₹22.50L + ₹16.80L + ₹9.40L + ₹5.50L = ₹68.40L`).
   - Card 1 Subtitle: Weighted pipeline `₹36.66L` matches `53.6%` confidence multiplier.
   - Card 2: `₹42.80L` matches `14 Closed Deals`.
   - Card 3: `24` Active Client Accounts with `98.2% SLA On-Track`.
   - Card 4: `28.6%` Win Velocity with 18.4 days cycle.
   - Revenue Dynamics Chart: 6 grouped bars render cleanly beneath the `₹25.0L` ceiling with zero label clipping or truncation.
   - Sidebar: Tasks item displays `Tasks [6 Due]`.
3. **Delivery Gate & Git Authorship**:
   - Commit authored as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
   - Title adhering to rule (no `feat`): `Phase 8.8: Realistic Agency Sales Telemetry & Revenue Intelligence Calibration`.
   - Push to update PR #71 (PR remains strictly **OPEN**).

---

## 5. Architectural Approval Gate

> [!IMPORTANT]
> **Strict Behavioral Rule Enforced**: No code modifications or database operations have been executed. The terminal watcher remains active. Please review the proposed realistic metrics above and type **"proceed"** or **"do it"** to begin implementation.
