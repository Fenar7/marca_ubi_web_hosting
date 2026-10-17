/**
 * @file index.ts
 * @description Public exports for the Executive KPI Ribbon component suite (Sprint 6.2).
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export { KpiRibbon, type KpiRibbonProps } from './KpiRibbon';
export { KpiCard, type KpiCardProps } from './KpiCard';
export { KpiSkeleton } from './KpiSkeleton';
export {
  USD_TO_INR_RATE,
  extractKpiMetrics,
  formatKpiCurrency,
  formatFullCurrency,
  formatSyncTimestamp,
  type NormalizedKpiMetrics,
} from './kpiFormatters';
