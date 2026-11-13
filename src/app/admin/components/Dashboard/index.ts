/**
 * @file index.ts
 * @description Centralized barrel export for Executive Overview & Revenue Intelligence components.
 *              Exports all core MedTrackr-benchmarked executive dashboard modules and maintains
 *              backward-compatible aliases for consuming views.
 * @module admin/components/Dashboard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

// Core MedTrackr-Benchmarked Executive Dashboard Modules
export * from './types';
export { ExecutiveMasthead, type ExecutiveMastheadProps } from './ExecutiveMasthead';
export { ExecutiveKpiGrid, type ExecutiveKpiGridProps } from './ExecutiveKpiGrid';
export { AttentionQueue, type AttentionQueueItem, type AttentionQueueProps } from './AttentionQueue';
export { RevenueDynamicsCard, type MonthlyRevenueMetric } from './RevenueDynamicsCard';
export {
  PipelineAllocationCard,
  type StageAllocationItem,
  type PipelineAllocationCardProps,
} from './PipelineAllocationCard';
export {
  CommercialDealsTable,
  type ActiveDealItem,
  type CommercialDealsTableProps,
} from './CommercialDealsTable';

// Backward-Compatibility Aliases
export { ExecutiveKpiGrid as MinimalistStatPods } from './ExecutiveKpiGrid';
export { RevenueDynamicsCard as PerformanceChart } from './RevenueDynamicsCard';
export { CommercialDealsTable as CurrentDealsTable } from './CommercialDealsTable';

// Conyest Luxury Financial & CRM Dashboard Modules
export { ConyestMetricsGrid, type ConyestMetricsGridProps } from './ConyestMetricsGrid';
export { ConyestCashflowCard, type ConyestCashflowCardProps, type MonthlyCashflowPoint } from './ConyestCashflowCard';
export { ConyestStatisticCard, type ConyestStatisticCardProps, type StatisticCategoryItem } from './ConyestStatisticCard';
export { ConyestTransactionsTable, type ConyestTransactionsTableProps, type TransactionRow } from './ConyestTransactionsTable';

// Swiss Editorial Luxury Commercial Desk Modules
export { PipelineStageFlowBar, type PipelineStageFlowBarProps, type PipelineStageFlowItem } from './PipelineStageFlowBar';
export { ExecutiveTelemetryMasthead, type ExecutiveTelemetryMastheadProps } from './ExecutiveTelemetryMasthead';
export { CommercialActionDesk, type CommercialActionDeskProps, type DeskFilterTab } from './CommercialActionDesk';
export { CadenceUrgencyRail, type CadenceUrgencyRailProps } from './CadenceUrgencyRail';
export { OverviewWorkspace, type OverviewData, type OverviewRecord } from './OverviewWorkspace';
