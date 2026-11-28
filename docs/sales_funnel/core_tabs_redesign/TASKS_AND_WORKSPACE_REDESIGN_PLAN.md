# Tasks & Workspace SaaS Light UI Redesign Specification

> Detailed architecture & UX blueprint implemented on branch `redesign/core-tabs-conversion-engine` (PR #132).

## Design Principles Enforced
1. **Plain Human Language (`antislop-copywriting`)**: Eliminate internal buzzwords (`Commercial Desk`, `Workload Telemetry`, `Upcoming Horizon`, `Agency Turnaround SLA`, `Expected Scope`, `Coordinates`, `Open dossier`) in favor of immediate clarity (`Follow-ups`, `Overdue`, `Due Today`, `Upcoming`, `Unassigned`, `Deal Value`, `View lead`).
2. **Purposeful Color & Iconography Without Stripes (`antislop-ui`)**: Eliminate all `border-top: 3px` and `border-left: 3px` colored stripe bands and unmotivated decorative dots. Anchor KPI/queue cards with `36×36px` soft-tinted icon squircles, tabular figures, and crisp active state borders.
3. **Streamlined Action Hierarchy**: Replace duplicate lead-detail buttons (`Open dossier`) with clickable entity links and a 1-row action cluster (`Complete`, `Reschedule`, `Deal →`) maintaining `>= 44px` touch targets and WCAG AA contrast (`>= 4.5:1` text, `>= 3:1` UI borders).

## Affected Modules
- **Follow-ups Queue**: `src/app/admin/(workspace)/tasks/{page.tsx,loading.tsx,tasks.module.scss,components/TaskCard.tsx}`
- **Leads Summary Ribbon**: `src/app/admin/(workspace)/leads/components/QuickMetricsRibbon/`
- **Sales Analytics**: `src/app/admin/(workspace)/analytics/components/{AnalyticsMasthead,StageDwellMatrix,PracticeMatrix,FunnelVisualizer}/`
- **Shared Shell & Dashboard**: `PersonnelSecurityEnclave.module.scss`, `AdminMobileDrawer.tsx`, `LuxuryVirtualCard.*`, `ExecutiveTelemetryMasthead.*`, `CommercialDealsLedger.*`, `LuxurySlaFeedCard.tsx`, `ConyestTransactionsTable.tsx`, `AttentionQueue.tsx`, `CommercialDealsTable.tsx`
