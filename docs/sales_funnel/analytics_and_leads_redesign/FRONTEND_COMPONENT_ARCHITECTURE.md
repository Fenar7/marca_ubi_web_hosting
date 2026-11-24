# Marca Ubi Enterprise CRM — Frontend Component & Performance Architecture
**Workspaces:** `/admin/analytics` and `/admin/leads`  
**Engine:** Next.js 16 App Router, React 19 Suspense Streaming, SCSS Modules, `@tanstack/react-virtual`  
**Author:** Expert Frontend Developer Agent  
**Design Read:** ENERGY 1 / RHYTHM 2 / MOTION 2 (Marca Ubi Commercial Desk Luxury Editorial)

---

## 1. Executive Architecture Overview

This technical specification details the complete frontend architecture for the comprehensive redesign of the **Commercial Analytics Workspace** (`src/app/admin/(workspace)/analytics`) and the **Inbound Leads & Deals Workspace** (`src/app/admin/(workspace)/leads`).

### Core Architectural Pillars
1. **Zero-Waterfall Server Orchestration**: All top-level page components (`page.tsx`) are async Server Components executing parallel `Promise.all` queries with sub-250ms cold execution time.
2. **React 19 Suspense Streaming & Zero-CLS Fallbacks**: Skeletons enforce exact spatial footprint matching (`CLS = 0.000`) with hairline shimmer rhythm.
3. **High-Performance Virtualization Grid**: Powered by `@tanstack/react-virtual`, rendering a strict 72px fixed row rhythm with dynamic overscan buffers, effortlessly scrolling 10,000+ pipeline records at 60fps.
4. **Sub-16ms Instant Search & URL State Decoupling**: High-frequency search inputs leverage `useDeferredValue` coupled with shallow `window.history.replaceState` updates, eliminating unnecessary server-roundtrip jitter.
5. **In-Context Drawer Dispatch Engine**: Global `open-lead-drawer` CustomEvent dispatch allows deep record inspection via the 840px `ClientDossierDrawer` without page unloads or loss of scroll position.
6. **Multi-Select Batch State Machine**: High-efficiency `Set<string>` row selection triggering a fixed floating batch action toolbar with stage reassignment, bulk conversion, and tagging.
7. **Strict SCSS Modules Architecture**: Pure CSS Module selectors complying with Next.js Turbopack rules, styled strictly using Marca Ubi brand tokens (`#ffffff`, `#f5f5f3`, `#111111`, `#ea002a`, Circular XX, Graphik, Helvetica Neue).

---

## 2. Component Hierarchy Breakdown

### 2.1. Analytics Workspace Component Hierarchy (`/admin/analytics`)

```
src/app/admin/(workspace)/analytics/
├── page.tsx                           (Async Server Component: Parallel Promise.all data aggregator)
├── AnalyticsWorkspaceClient.tsx       (Interactive Client Component orchestrating period/scope state)
├── components/
│   ├── AnalyticsMasthead/
│   │   ├── AnalyticsMasthead.tsx      (Headline KPI scorecard: Active Value, Win Rate, Velocity)
│   │   ├── PeriodSelector.tsx         (Segmented pills: 30D / 90D / YTD / ALL)
│   │   └── AnalyticsMasthead.module.scss
│   ├── FunnelVisualizer/
│   │   ├── FunnelVisualizer.tsx       (Multi-stage conversion drop-off funnel & step loss)
│   │   ├── FunnelStageBar.tsx         (Individual stage bar with interactive drilldown trigger)
│   │   └── FunnelVisualizer.module.scss
│   ├── RevenueSpline/
│   │   ├── RevenueSpline.tsx          (SVG cubic bezier realized vs forecast revenue timeline)
│   │   ├── SplineCrosshairTooltip.tsx (Interactive tracking tooltip with full INR tabular numerals)
│   │   └── RevenueSpline.module.scss
│   ├── PracticeMatrix/
│   │   ├── PracticeMatrix.tsx         (Breakdown across agency service practices)
│   │   ├── PracticeBarRow.tsx         (Proportional share indicator with drilldown to /admin/deals)
│   │   └── PracticeMatrix.module.scss
│   ├── StageDwellMatrix/
│   │   ├── StageDwellMatrix.tsx       (Pipeline bottleneck analysis: avg days in status vs SLA)
│   │   ├── DwellMetricCard.tsx        (Stage cardlet with threshold breach indicators)
│   │   └── StageDwellMatrix.module.scss
│   └── AnalyticsSkeleton/
│       ├── AnalyticsSkeleton.tsx      (Zero-CLS layout reservation skeleton)
│       └── AnalyticsSkeleton.module.scss
└── analytics.module.scss              (Workspace container grid & spatial tokens)
```

### 2.2. Leads Workspace Component Hierarchy (`/admin/leads`)

```
src/app/admin/(workspace)/leads/
├── page.tsx                           (Async Server Component: Parallel Promise.all query aggregator)
├── LeadsWorkspaceClient.tsx           (Interactive Client Component: Selection state, URL sync, drawer)
├── NewLeadHeaderButton.tsx            (Intake CTA triggering 'open-new-lead-modal' CustomEvent)
└── leads.module.scss                  (Page container, header layout, responsive grid)

src/app/admin/components/
├── LeadsTable/
│   ├── index.ts                       (Public module exports)
│   ├── VirtualizedLeadsGrid.tsx       (Virtualizer engine with 72px fixed row rhythm & J/K navigation)
│   ├── LeadRowItem.tsx                (Individual row renderer: 9-column grid, checkbox, inline selects)
│   ├── InlineStatusSelect.tsx         (Optimistic inline stage dropdown with transition guards)
│   ├── InlinePrioritySelect.tsx       (Optimistic inline priority badge selector)
│   ├── LeadMobileCard.tsx             (Fluid touch card reflow for viewports < 768px)
│   ├── FloatingBatchActionBar.tsx     (Fixed bottom bar for multi-selected lead bulk actions)
│   ├── ResultPagination.tsx           (Cursor/offset page controller with scope indicator)
│   ├── LeadsTableSkeleton.tsx         (CLS = 0.000 loading shimmer with 9-column spatial layout)
│   └── LeadsDataGrid.module.scss      (Collision-free grid geometry, row styling, virtual viewport)
├── FilterActionBar/
│   ├── FilterActionBar.tsx            (Multi-Filter Rail: Segmented bucket tabs, search, dropdowns)
│   ├── BucketSegmentedTabs.tsx        (Tabs: All, Open, Potential, Converted, Lost, Overdue)
│   ├── FilterDropdownMenu.tsx         (Accessible popover for Sources, Assignees, Priority)
│   └── FilterActionBar.module.scss    (Segmented control styles, search input, active filter chips)
└── DossierDrawer/
    ├── ClientDossierDrawer.tsx        (840px slide-over Client 360° dossier drawer)
    └── DossierDrawer.module.scss      (Frosted scrim, drawer geometry, tabs, timeline)
```

---

## 3. React 19 & Next.js 16 Performance Strategy

### 3.1. Zero-Waterfall Server Data Fetching (`page.tsx`)
All queries in `src/app/admin/(workspace)/leads/page.tsx` and `src/app/admin/(workspace)/analytics/page.tsx` execute concurrently via `Promise.all`:

```typescript
const [sourcesRes, profilesRes, statusesRes, leadsRes] = await Promise.all([
  supabase.from('lead_sources').select('id, name, color_code').order('name'),
  supabase.from('crm_team_directory').select('id, full_name, role').order('full_name'),
  supabase.from('funnel_statuses').select('id, name, bucket, color_code, sort_order').eq('is_active', true).order('sort_order', { ascending: true }),
  leadsQuery.order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1),
]);
```

### 3.2. Virtualization Engine Architecture (`@tanstack/react-virtual`)
- Strict 72px row rhythm with dynamic 8-row overscan buffer.
- Collision-free 9-column grid layout with exact matching skeleton heights (`CLS = 0.000`).

### 3.3. Multi-Select Batch State Machine & Floating Action Bar
- State backed by `Set<string>` with single-item and Shift+Click range selection.
- Floating bottom bar (`bottom: 24px; left: 50%`) with batch status advance, bulk reassignment, and CSV export.

### 3.4. In-Context Drawer Integration via CustomEvent
- Dispatches `'open-lead-drawer'` with shallow URL synchronization (`?id=${leadId}`), preventing page unloads and preserving table scroll context.
