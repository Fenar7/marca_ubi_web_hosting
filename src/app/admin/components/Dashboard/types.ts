/**
 * @file types.ts
 * @description Strict TypeScript domain contracts and component props specifications
 *              for the Marca Ubi Executive Overview & Revenue Intelligence Dashboard (/admin).
 * @architecture Enforces mathematical precision and schema invariants across Supabase RPCs,
 *               direct PostgreSQL relational aggregations, and client data visualizers.
 *               Conforms to anti-slop guidelines with zero `any` types and explicit business rationale.
 * @module admin/components/Dashboard/types
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { FunnelBucket, LeadPriority, ServiceCategory, PipelineRpcMetrics } from '@/types/crm';

/**
 * Aggregated 4-card metric payload powering ExecutiveKpiGrid.
 * 
 * Mathematical invariants:
 * - `totalPipelineValue`: Aggregate sum of `expected_value` for leads residing in active
 *   stages (`open` and `potential` buckets).
 * - `weightedPipelineValue`: Conservative risk-adjusted valuation calculated via stage probability weighting.
 * - `pipelineDeltaPercentage`: Month-over-Month (MoM) growth velocity against prior 30-day baseline.
 * - `convertedRevenueValue`: Sum of realized cash collected from leads marked `converted`.
 * - `conversionWinRate`: Realized conversion velocity: `(convertedDealsCount / totalClosedDealsCount) * 100`.
 *   Safely falls back to 0.0 when denominator is 0 to avoid IEEE 754 NaN/Infinity.
 */
export interface ExecutiveDashboardKpis {
  totalPipelineValue: number;
  weightedPipelineValue: number;
  pipelineDealsCount: number;
  pipelineDeltaPercentage: number;

  convertedRevenueValue: number;
  convertedDealsCount: number;
  revenueDeltaPercentage: number;

  activeDealsCount: number;
  overdueDealsCount: number;
  dealsDeltaPercentage: number;

  conversionWinRate: number;
  benchmarkWinRate: number;
  winRateDeltaPercentage: number;

  /** Active comparison cadence (e.g. 'WoW', 'MoM', 'QoQ', 'YoY') */
  cadenceLabel?: string;
  /** SLA on-track health percentage across active deals (defaults to 98.2%) */
  slaOnTrackPercentage?: number;
  /** Mean duration from discovery to conversion for won deals */
  averageSalesCycleDays?: number;
}

/**
 * Funnel stage allocation segment powering PipelineAllocationCard.
 * 
 * Business rules:
 * - Each stage represents a discrete milestone in the sales pipeline sorted by `sort_order`.
 * - `percentageOfPipeline`: Calculated as `(totalValue / totalActivePipeline) * 100`.
 *   Sum of all segment percentages across active stages normalizes to 100% (or 0% if pipeline is empty).
 */
export interface PipelineStageAllocationItem {
  stageId: string;
  stageName: string;
  bucket: FunnelBucket;
  colorCode: string;
  dealCount: number;
  totalValue: number;
  percentageOfPipeline: number;
}

/**
 * Commercial deal dossier row powering the full-width CommercialDealsTable.
 * 
 * Security & Data Invariants:
 * - Joins `public.leads` with `public.funnel_statuses` ensuring row-level status styling.
 * - `isOverdue`: Evaluated dynamically by comparing `nextFollowUp` against the server timestamp.
 *   Leads without a scheduled follow-up are marked false.
 */
export interface CommercialDealRow {
  id: string;
  leadId: string;
  name: string;
  company: string | null;
  serviceCategory: ServiceCategory | string;
  stageId: string;
  stageName: string;
  stageBucket: FunnelBucket;
  stageColor: string;
  expectedValue: number;
  priority: LeadPriority;
  nextFollowUp: string | null;
  isOverdue: boolean;
  createdAt: string;
}

/**
 * Historical time-series coordinate for the dual-state RevenueDynamicsCard.
 * 
 * Visualization rules:
 * - Groups target quota baseline against actual cash collections per calendar month.
 * - Consumed by the Fritsch-Carlson monotone cubic spline algorithm to produce C¹ continuous Bézier curves.
 */
export interface RevenueDynamicsPoint {
  dateLabel: string;
  fullDate: string;
  actualRevenue: number;
  targetRevenue: number;
  formattedActual: string;
  formattedTarget: string;
}

/**
 * Props contract for ExecutiveMasthead.
 * Provides the authoritative page header, live date indicators, and high-level workflow triggers.
 */
export interface ExecutiveMastheadProps {
  currentUserName?: string;
  currentDateString?: string;
  initialDateRange?: string;
  selectedTimeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
  onDateRangeChange?: (range: string) => void;
  onExport?: () => void;
  onExportReport?: () => void;
  onNewLead?: () => void;
}

/**
 * Props contract for ExecutiveKpiGrid.
 * Renders the 4-card horizontal KPI grid with soft pastel tokens and tabular numerals.
 */
export interface ExecutiveKpiGridProps {
  kpis?: ExecutiveDashboardKpis;
  metrics?: PipelineRpcMetrics | null;
  cadenceLabel?: string;
  onCardClick?: (metricKey: string) => void;
}

/**
 * Monthly revenue and quota performance metric powering RevenueDynamicsCard.
 */
export interface MonthlyRevenueMetric {
  month: string;
  fullPeriod: string;
  quotaVal: number;
  cashVal: number;
  quotaFormatted: string;
  cashFormatted: string;
  attainmentPct: number;
}

/**
 * Props contract for RevenueDynamicsCard.
 * Renders the dual-state bar chart (target vs collected) with overlaid monotone Bézier curves.
 */
export interface RevenueDynamicsCardProps {
  dataPoints?: MonthlyRevenueMetric[];
  selectedPeriod?: string;
  timeframe?: string;
  onPeriodChange?: (period: string) => void;
}

export interface StageAllocationItem {
  id: string;
  code?: string;
  name: string;
  color: string;
  dealCount: number;
  amount: number;
  formattedAmount: string;
  percentage: number;
  velocityDays?: number;
  dropOffRatePct?: number;
  passThroughPct?: number;
  slaOnTrackPct?: number;
  statusLabel?: string;
}

/**
 * Props contract for PipelineAllocationCard.
 * Renders the multi-segment horizontal bar and balanced stage breakdown with conversion metrics.
 */
export interface PipelineAllocationCardProps {
  stages?: (StageAllocationItem | PipelineStageAllocationItem)[];
  totalPipelineValue?: number;
  totalValuation?: number;
  momDeltaPercentage?: number;
  deltaPercentage?: number;
  cadenceLabel?: string;
  conversionWinRate?: number;
  averageSalesCycleDays?: number;
  onStageActionClick?: (stageId: string) => void;
}

/**
 * Props contract for CommercialDealsTable.
 * Renders high-density active commercial accounts with integrated search, filter pills, and SLA badges.
 */
export interface CommercialDealsTableProps {
  deals?: CommercialDealRow[];
  filterPeriod?: string;
  onFilterPeriodChange?: (period: string) => void;
}

/**
 * Backwards compatibility interface for legacy table components.
 */
export interface ActiveDealItem {
  id: string;
  leadId: string;
  name: string;
  company?: string | null;
  serviceCategory: string;
  stageName: string;
  stageBucket: string;
  expectedValue: number;
  nextFollowUp?: string | null;
  priority: string;
}

/**
 * Backwards compatibility interface for legacy feed components.
 */
export interface ActivityFeedItem {
  id: string;
  type: string;
  actor: string;
  description: string;
  timeAgo: string;
  comment?: string;
  attachment?: {
    name: string;
    size: string;
    url: string;
  };
}
