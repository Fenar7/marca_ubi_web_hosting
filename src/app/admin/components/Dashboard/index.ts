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
