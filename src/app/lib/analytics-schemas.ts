/**
 * @file analytics-schemas.ts
 * @description Zod validation schemas and strongly-typed database RPC contracts
 *              for Commercial Analytics telemetry queries (/admin/analytics).
 * @module lib/analytics-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';

export const ANALYTICS_TIMEFRAME_SLUGS = [
  '7d',
  '30d',
  '90d',
  'q1',
  'q2',
  'q3',
  'q4',
  'ytd',
  'year',
] as const;

export type AnalyticsTimeframeSlug = (typeof ANALYTICS_TIMEFRAME_SLUGS)[number];

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const analyticsQuerySchema = z.object({
  timeframe: z.enum(ANALYTICS_TIMEFRAME_SLUGS).default('30d'),
  assigneeId: z.string().regex(UUID_REGEX).optional().nullable(),
  sourceId: z.string().regex(UUID_REGEX).optional().nullable(),
  serviceCategory: z.string().max(100).optional().nullable(),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

/** Database RPC Row: public.get_funnel_conversion_dropoff */
export interface FunnelDropoffRpcRow {
  stage_id: string;
  stage_name: string;
  stage_order: number;
  color_code: string;
  deals_reached: number | string;
  conversion_from_prev_pct: number | string;
  overall_conversion_pct: number | string;
  drop_off_count: number | string;
  avg_time_in_stage_days: number | string | null;
}

/** Database RPC Row: public.get_stage_dwell_time_metrics */
export interface StageDwellRpcRow {
  stage_id: string;
  stage_name: string;
  sort_order: number;
  color_code: string;
  deal_count: number | string;
  avg_dwell_days: number | string;
  median_dwell_days: number | string;
  stalled_deals_count: number | string;
}

/** Database RPC Row: public.get_timeframe_revenue_spline */
export interface RevenueSplineRpcRow {
  bucket_period: string;
  period_label: string;
  converted_revenue: number | string;
  inbound_potential_valuation: number | string;
  converted_deals_count: number | string;
  new_inquiries_count: number | string;
}

/** Database RPC Row: public.get_service_category_distribution */
export interface ServiceCategoryRpcRow {
  category_name: string;
  deal_count: number | string;
  active_valuation: number | string;
  share_percentage: number | string;
  avg_deal_size: number | string;
  color_code: string;
}

/** Database RPC Row: public.get_cohort_win_rates */
export interface CohortWinRatesRpcRow {
  cohort_month: string;
  total_ingested: number | string;
  active_in_flight: number | string;
  closed_won: number | string;
  closed_lost: number | string;
  closed_deal_win_rate: number | string;
  pipeline_win_rate: number | string;
  total_won_revenue: number | string;
  avg_cycle_days: number | string | null;
  weighted_pipeline_value: number | string;
}
