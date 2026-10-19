/**
 * @file kpiFormatters.ts
 * @description High-precision currency conversion, metric normalization, and numeral formatters
 *              for the Marca Ubi Executive KPI Ribbon. Supports dual-currency INR (Lakhs/Crores)
 *              and USD with a fixed institutional exchange rate of 1 USD = ₹83.50.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { PipelineRpcMetrics } from '@/types/crm';

/** Institutional foreign exchange rate pegged for CRM reporting. */
export const USD_TO_INR_RATE = 83.5;

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
 * Formats a monetary figure into a compact, human-readable luxury currency representation.
 * Handles Indian numbering system (Lakhs, Crores) and international US Dollars.
 *
 * @param {number} amountInInr Base currency amount in Indian Rupees (₹).
 * @param {'INR' | 'USD'} currency Target presentation currency.
 * @returns {string} Formatted currency string (e.g. "₹ 48.5L", "₹ 1.25 Cr", "$ 35K").
 */
export function formatKpiCurrency(amountInInr: number, currency: 'INR' | 'USD'): string {
  const numericAmount = Number(amountInInr) || 0;

  if (numericAmount <= 0) {
    return currency === 'INR' ? '₹ 0' : '$ 0';
  }

  if (currency === 'INR') {
    if (numericAmount >= 10000000) {
      const crVal = parseFloat((numericAmount / 10000000).toFixed(2));
      return `₹ ${crVal} Cr`;
    }
    if (numericAmount >= 100000) {
      const lVal = parseFloat((numericAmount / 100000).toFixed(1));
      return `₹ ${lVal} L`;
    }
    return `₹ ${Math.round(numericAmount).toLocaleString('en-IN')}`;
  }

  // USD Conversion Branch
  const usdAmount = numericAmount / USD_TO_INR_RATE;

  if (usdAmount >= 1000000) {
    const mVal = parseFloat((usdAmount / 1000000).toFixed(2));
    return `$ ${mVal}M`;
  }
  if (usdAmount >= 1000) {
    const kVal = parseFloat((usdAmount / 1000).toFixed(1));
    return `$ ${kVal}K`;
  }

  return `$ ${Math.round(usdAmount).toLocaleString('en-US')}`;
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
  const numericAmount = Number(amountInInr) || 0;

  if (currency === 'INR') {
    return `₹ ${Math.round(numericAmount).toLocaleString('en-IN')}`;
  }

  const usdAmount = numericAmount / USD_TO_INR_RATE;
  return `$ ${Math.round(usdAmount).toLocaleString('en-US')}`;
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
