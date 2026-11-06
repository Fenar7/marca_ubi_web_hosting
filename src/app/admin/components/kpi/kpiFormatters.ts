/**
 * @file kpiFormatters.ts
 * @description High-precision currency conversion, metric normalization, and numeral formatters
 *              for the Marca Ubi Executive KPI Ribbon. Supports full-digit INR and USD
 *              and USD with a fixed institutional exchange rate of 1 USD = ₹83.50.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { PipelineRpcMetrics } from '@/types/crm';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
export { USD_TO_INR_RATE } from '@/app/admin/lib/currency';

/** Normalized internal representation of pipeline metrics. */
export interface NormalizedKpiMetrics {
  totalLeads: number;
  openLeads: number;
  potentialLeads: number;
  potentialValue: number;
  stageWeightedValue: number;
  convertedLeads: number;
  convertedRevenue: number;
  conversionRate: number;
  overdueCount: number;
  activeLeads: number;
}

/**
 * Normalizes raw PostgreSQL RPC returns or API envelopes into a consistent
 * strongly-typed metric object, reconciling SQL aliases with TypeScript contracts.
 *
 * @param {PipelineRpcMetrics | null | undefined} raw Raw metric payload.
 * @returns {NormalizedKpiMetrics} Safe normalized metrics with fallback zeros.
 */
export function extractKpiMetrics(raw?: PipelineRpcMetrics | null): NormalizedKpiMetrics {
  if (!raw) {
    return {
      totalLeads: 0,
      openLeads: 0,
      potentialLeads: 0,
      potentialValue: 0,
      stageWeightedValue: 0,
      convertedLeads: 0,
      convertedRevenue: 0,
      conversionRate: 0,
      overdueCount: 0,
      activeLeads: 0,
    };
  }

  const totalLeads = raw.total_leads_count ?? raw.total_leads ?? 0;
  const openLeads = raw.open_leads_count ?? 0;
  const potentialLeads = raw.potential_leads_count ?? raw.potential_count ?? 0;
  const potentialValue = Number(raw.potential_pipeline_value ?? raw.potential_value ?? 0);
  const stageWeightedValue = Number(raw.stage_weighted_pipeline_value ?? 0);
  const convertedLeads = raw.converted_leads_count ?? raw.converted_count ?? 0;
  const convertedRevenue = Number(raw.converted_revenue_value ?? raw.converted_value ?? 0);
  const conversionRate = Number(raw.conversion_rate_percentage ?? raw.conversion_rate ?? 0);
  const overdueCount = raw.overdue_follow_ups_count ?? raw.overdue_count ?? 0;
  const activeLeads = openLeads + potentialLeads;

  return {
    totalLeads,
    openLeads,
    potentialLeads,
    potentialValue,
    stageWeightedValue,
    convertedLeads,
    convertedRevenue,
    conversionRate,
    overdueCount,
    activeLeads,
  };
}

/**
 * Formats a monetary figure with full localized digits in INR or USD.
 *
 * @param {number} amountInInr Base currency amount in Indian Rupees (₹).
 * @param {'INR' | 'USD'} currency Target presentation currency.
 * @returns {string} Full localized currency string (e.g. "₹ 48,50,000", "$ 58,084").
 */
export function formatKpiCurrency(amountInInr: number, currency: 'INR' | 'USD'): string {
  return formatCrmCurrency(amountInInr, currency);
}

/**
 * Returns the exact, non-abbreviated currency value with locale separators.
 * Used for full-precision tooltips and accessibility labels.
 *
 * @param {number} amountInInr Base currency amount in Indian Rupees (₹).
 * @param {'INR' | 'USD'} currency Target presentation currency.
 * @returns {string} Full localized currency string (e.g. "₹ 4,850,000", "$ 58,083").
 */
export function formatFullCurrency(amountInInr: number, currency: 'INR' | 'USD'): string {
  return formatCrmCurrency(amountInInr, currency);
}

/**
 * Humanizes the duration elapsed since the last real-time calculation.
 *
 * @param {Date | null} lastUpdated Date of the last successful synchronization.
 * @returns {string} Relative time string (e.g. "Updated just now", "Updated 4m ago").
 */
export function formatSyncTimestamp(lastUpdated: Date | null): string {
  if (!lastUpdated) return 'Sync pending';

  const elapsedSeconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
  if (elapsedSeconds < 30) return 'Updated just now';
  if (elapsedSeconds < 60) return 'Updated <1m ago';

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `Cached ${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `Cached ${elapsedHours}h ago`;
}
