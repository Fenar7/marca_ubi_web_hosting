## Architectural Overview: Sprint 6.2 Dark Luxury Executive KPI Ribbon & Real-time Recalculation Engine

### 1. Objective & Motivation
This Pull Request delivers **Sprint 6.2: Dark Luxury Executive KPI Ribbon & Real-time Recalculation Engine** for Phase 6 (`phase-6/analytics-and-kpi-ribbon`).
It establishes the core executive visual scorecard layer across the entire CRM, rendering real-time commercial metrics with fluid clamp typography, tabular numerals, dual-currency formatting (INR Lakhs/Crores vs USD), reactive filter recalculation via Next.js `useSearchParams`, and click-through drilldown routing.

---

### 2. Delivered Work Packages

#### Package 6.2.1: Master KPI Ribbon Container (`KpiRibbon.tsx` & `KpiRibbon.module.scss`)
- **Reactive URL Synchronization**: Binds to Next.js `useSearchParams()`, auto-fetching `/api/sales-funnel/kpis` with parameterized filters (`start_date`, `end_date`, `source_id`, `assignee_id`).
- **AbortController Invariant Defense**: Automatically cancels in-flight fetch requests upon subsequent filter changes, eliminating out-of-order race conditions.
- **Dual-Currency Formatting**: Instantaneous client-side toggle between INR (₹ Lakhs/Crores) and USD ($ pegged at institutional ₹83.50 rate).
- **Manual Cache Invalidation**: Specular frosted glass action button triggering on-demand re-sync with spinning glyph and relative age formatting ("Updated just now", "Cached Xm ago").
- **Stage-Weighted Valuation Pill**: Secondary financial indicator displaying `stage_weighted_pipeline_value`.
- **Zero Cumulative Layout Shift (CLS < 0.01)**: Fixed card geometry with animated shimmer placeholder (`KpiSkeleton.tsx`).

#### Package 6.2.2: Stripe Scorecard Archetypes (`KpiCard.tsx`)
- **Card 1: Total Leads**: Gross inflow volume with active pipeline subtext, linking to `/admin/leads`.
- **Card 2: Potential Pipeline Value**: Active negotiation value with weighted multiplier subtext, linking to `/admin/leads?bucket=potential`.
- **Card 3: Converted Revenue**: Total closed revenue with emerald delta subtext, linking to `/admin/leads?bucket=converted`.
- **Card 4: Conversion Rate %**: Net win percentage excluding disqualified inquiries, linking to `/admin/leads?bucket=converted`.
- **Card 5: Overdue Follow-ups**: Active past-due touchpoints. When `count > 0`, activates vivid `#ff6100` alert bar, pulsing radar dot (`alertPulse` keyframes), and links to `/admin/leads?bucket=open`.

#### Package 6.2.3: CRM Workspace Integrations
- **Command Center (`/admin`)**: Replaced hardcoded static cards with `<KpiRibbon initialData={rpcData} />`.
- **Revenue Analytics (`/admin/analytics`)**: Replaced hardcoded cards with `<KpiRibbon initialData={rpcData} />`.
- **Deals & Inquiries (`/admin/leads`)**: Mounted `<KpiRibbon initialData={rpcData} syncWithUrlParams={true} />` at the top of the deals grid.

---

### 3. Automated Verification Matrix
- **Sprint 6.2 Delivery Gate (`scripts/verify-sprint-6-2.ts`)**: **57 / 57 assertions passed (100%)**.
- **Sprint 6.2 Test Suite (`tests/analytics/kpi_ribbon.test.ts`)**: **16 / 16 passed (100%)**.
- **Complete Test Suite (`tests/**/*.test.ts`)**: **220 / 220 passed across 67 suites (100%)**.
- **TypeScript Static Verification (`tsc --noEmit`)**: **0 errors**.
- **Anti-Slop AST Gate**: 0 `any` types, 0 generic blue (`#2563eb`), 0 decorative comment banners.
- **Git Authorship**: Authored strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- **Merge State**: Strict zero-merge policy enforced; PR remains strictly OPEN awaiting manual human review on GitHub.
