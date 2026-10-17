# Sprint 7.1: Multi-Filter Action Bar, Pipeline Bucket Tabs & Suspense Skeletons

## Architectural Scope & Business Context
Sprint 7.1 delivers the client-side multi-dimensional discovery layer and streaming shell for the Commercial Deals & Inquiries Workspace (`/admin/leads`). 

This sprint equips agency leadership and account representatives with sub-16ms interactive filtering across acquisition channels, assigned staff, priority tiers, and pipeline stages, coupled with zero Cumulative Layout Shift (`CLS < 0.01`) skeleton streaming and deep-link parameter synchronization.

---

## Technical Deliverables

### 1. Multi-Filter Action Bar (`src/app/admin/components/FilterActionBar/`)
- **Pipeline Bucket Segmented Tabs**: 6 segmented stage tabs (`All Deals`, `Open`, `Potential`, `Won`, `Lost`, `Overdue Today`).
  - Active Overdue alert state: pulses Marca Orange (`#ff6100`) via `@keyframes tabAlertGlow` when overdue count > 0.
  - Tab count badges rendered with Raycast Monospace tokens and `font-variant-numeric: tabular-nums`.
- **Debounced Search Engine**: 250ms debounce window powered by React 19 `useTransition` for non-blocking UI typing across `lead_id`, `name`, `company`, `email`, `phone`, `service_category`, and `assigned_to_name`. Quick-clear `✕` trigger and `Escape` keyboard dismissal.
- **Apple HIG Vibrancy Popovers**: Dark luxury frosted popovers (`rgba(18, 18, 22, 0.95)`, `backdrop-filter: blur(24px)`) for `Source`, `Representative`, and `Priority` filtering with mutual exclusion, keyboard controls, and outside-click dismissal.
- **Active Filter Chips Ribbon**: Dynamic filter summary bar rendering active criteria badges with 1-click removal and a global "Clear All Filters" reset button.

### 2. Zero-CLS Suspense Streaming Skeleton (`src/app/admin/components/LeadsTable/`)
- **Structural Precision**: Fixed 72px row heights matching exact data table row geometry across 7 columns (Deal ID pill, Client/Company dual-line, Service category, Funnel stage pill, Valuation numeral, Assigned Rep avatar + name, and Next touchpoint date).
- **Hairline Shimmer Keyframes**: `@keyframes skeletonShimmer` animating a hairline specular gradient across obsidian `#111111` surfaces.

### 3. Streaming Server Page & Workspace Integration (`src/app/admin/(workspace)/leads/`)
- **Parallel Server Queries**: `page.tsx` executes parallel metadata queries (`get_pipeline_kpis`, `lead_sources`, `profiles`, and hydrated `leads`).
- **Streaming Suspense Boundary**: Wrapped in React 19 `<Suspense fallback={<LeadsTableSkeleton rowCount={8} />}>`.
- **Sub-16ms URL State Synchronization**: `LeadsWorkspaceClient` synchronizes query parameters via `window.history.replaceState` and dispatches `popstate` events to reactively update the executive `KpiRibbon`.

---

## Verification & Quality Assurance Gate

- **Delivery Gate Audit**: `scripts/verify-sprint-7-1.ts` passed **24 / 24 assertions (100%)**.
- **Unit Test Suite**: `tests/leads/filter_action_bar.test.ts` passed **6 / 6 test suites (100%)**.
- **PostgreSQL Database Suite**: `tests/database/kpi_rpc_and_indexes.test.ts` passed **9 / 9 tests (100%)**.
- **Global CRM Test Suite**: **226 / 226 tests passed across all 68 suites (100%)**.
- **TypeScript Static Verification**: `npx tsc --noEmit` passed with **0 errors**.
- **Anti-AI-Slop Compliance**: Zero generic `#2563eb` blue, zero toy emojis, zero decorative separators, strict WCAG AA contrast, and zero `any` types.
