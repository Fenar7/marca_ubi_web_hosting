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

import type { FunnelBucket, LeadPriority, ServiceCategory } from "@/types/crm";

/**
 * Aggregated 4-card metric payload powering ExecutiveKpiGrid.
 *
 * Mathematical invariants:
 * - `totalPipelineValue`: Aggregate sum of `expected_value` for leads residing in active
 *   stages (`open` and `potential` buckets).
 * - `weightedPipelineValue`: Null when the configured funnel has no verified probability weights.
 * - `pipelineDeltaPercentage`: Null when the comparison cohort has no positive baseline.
 * - `convertedRevenueValue`: Converted contract value from leads marked `converted`; it does not represent payments.
 * - `conversionWinRate`: Realized conversion rate where the denominator is available.
 *   Metrics with missing denominators are unavailable, not zero.
 */
export interface ExecutiveDashboardKpis {
  totalPipelineValue: number | null;
  weightedPipelineValue: number | null;
  pipelineDealsCount: number | null;
  pipelineDeltaPercentage: number | null;

  convertedRevenueValue: number | null;
  convertedDealsCount: number | null;
  revenueDeltaPercentage: number | null;

  activeDealsCount: number | null;
  overdueDealsCount: number | null;
  dealsDeltaPercentage: number | null;

  conversionWinRate: number | null;
  winRateDeltaPercentage: number | null;
  conversionWonCount: number | null;
  conversionEligibleCount: number | null;

  /** Active comparison cadence (e.g. 'WoW', 'MoM', 'QoQ', 'YoY') */
  cadenceLabel?: string;
  /** SLA on-track health percentage across active deals (defaults to 98.2%) */
  slaOnTrackPercentage?: number | null;
  /** Mean duration from discovery to conversion for won deals */
  averageSalesCycleDays?: number | null;
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
 * - Groups converted contract values by calendar period; no target is inferred.
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
  kpis?: ExecutiveDashboardKpis | null;
  cadenceLabel?: string;
  dataStatus?: "ready" | "unavailable";
  metricStatus?: { pipeline: "ready" | "unavailable"; revenue: "ready" | "unavailable"; cohort: "ready" | "unavailable" };
}

/**
 * Monthly revenue and quota performance metric powering RevenueDynamicsCard.
 */
export interface MonthlyRevenueMetric {
  month: string;
  fullPeriod: string;
  cashVal: number;
  cashFormatted: string;
}

/**
 * Props contract for RevenueDynamicsCard.
 * Renders the dual-state bar chart (target vs collected) with overlaid monotone Bézier curves.
 */
export interface RevenueDynamicsCardProps {
  dataPoints: MonthlyRevenueMetric[];
  timeframe: string;
  dataStatus?: "ready" | "unavailable";
}

export interface ExecutiveReportExportData {
  timeframe: string;
  cadence: string;
  dateWindow: { start: string; end: string };
  generatedAt: string;
  metrics: { label: string; value: string | number }[];
  stages: { stageName: string; dealCount: number; totalValue: number }[];
  deals: {
    leadId: string;
    name: string;
    company: string | null;
    serviceCategory: string;
    stageName: string;
    expectedValue: number;
    priority: string;
    nextFollowUp: string | null;
    owner: string | null;
  }[];
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
  stages: StageAllocationItem[];
  totalValuation: number;
  deltaPercentage?: number;
  cadenceLabel?: string;
  dataStatus?: "ready" | "unavailable";
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
