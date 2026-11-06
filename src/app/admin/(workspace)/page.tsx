/**
 * @file page.tsx
 * @description Executive CRM dashboard backed by persisted lead, conversion, and ownership records.
 * @module app/admin/(workspace)/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import { ROLE_DEFAULT_TABS, type CrmUserRole, type FunnelBucket } from '@/types/crm';
import {
  ExecutiveMasthead,
  ExecutiveKpiGrid,
  AttentionQueue,
  RevenueDynamicsCard,
  PipelineAllocationCard,
  CommercialDealsTable,
  type ActiveDealItem,
  type ExecutiveDashboardKpis,
  type StageAllocationItem,
  type AttentionQueueItem,
} from '@/app/admin/components/Dashboard';
import {
  aggregateTimeframeRevenue,
  calculateMetricDelta,
  resolveTimeframeBounds,
  timeframeToSlug,
} from '@/app/admin/lib/timeframeUtils';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Executive Overview & Revenue Intelligence | Marca Ubi Enterprise CRM',
  robots: { index: false, follow: false },
};

export interface AdminDashboardPageProps {
  searchParams?: Promise<{ timeframe?: string }>;
}

const PAGE_SIZE = 1000;
const MAX_DASHBOARD_ROWS = 50000;
const SYNTHETIC_EXCLUSION = 'brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true';

interface PageRead<T> {
  data: T[] | null;
  error: { message: string } | null;
}

interface PageReadAll<T> {
  summary: T | null;
  error: string | null;
}

interface StageStatusRecord {
  id: string;
  name: string;
  bucket: FunnelBucket;
  color_code: string | null;
  sort_order: number;
}

interface ActivePipelineRecord {
  id: string;
  status_id: string;
  expected_value: number | string;
  next_follow_up: string | null;
  revisit_date: string | null;
}

interface CohortRecord {
  id: string;
  status_id: string;
  expected_value: number | string;
  created_at: string;
  lost_reason: string | null;
}

interface RevenueRecord {
  converted_at: string | null;
  created_at: string;
  expected_value: number | string | null;
}

interface TeamDirectoryRecord {
  id: string;
  full_name: string | null;
}

interface AttentionRecord {
  id: string;
  lead_id: string;
  name: string;
  company: string | null;
  status_id: string;
  priority: string;
  expected_value: number | string | null;
  next_follow_up: string;
  revisit_date: string | null;
}

interface CohortTotals {
  total: number;
  disqualified: number;
  converted: number;
  active: number;
  potentialValue: number;
}

/** Folds each bounded page immediately, preserving exact totals without retaining CRM rows in memory. */
async function reduceAllPages<T, Summary>(
  loadPage: (from: number, to: number) => Promise<PageRead<T>>,
  summary: Summary,
  consume: (summary: Summary, rows: T[]) => void,
): Promise<PageReadAll<Summary>> {
  let processed = 0;
  for (let from = 0; from < MAX_DASHBOARD_ROWS; from += PAGE_SIZE) {
    const { data, error } = await loadPage(from, from + PAGE_SIZE - 1);
    if (error) return { summary: null, error: error.message };
    if (!data) return { summary: null, error: 'The CRM query returned no result payload.' };
    if (processed + data.length > MAX_DASHBOARD_ROWS) return { summary: null, error: 'The dashboard data set exceeds the safe aggregation limit.' };
    consume(summary, data);
    processed += data.length;
    if (data.length < PAGE_SIZE) return { summary, error: null };
  }
  const boundary = await loadPage(MAX_DASHBOARD_ROWS, MAX_DASHBOARD_ROWS);
  if (boundary.error) return { summary: null, error: boundary.error.message };
  if (!boundary.data) return { summary: null, error: 'The CRM query returned no boundary-check payload.' };
  return boundary.data?.length
    ? { summary: null, error: 'The dashboard data set exceeds the safe aggregation limit.' }
    : { summary, error: null };
}

/** Treats malformed stored numerics as zero only for accumulation; the source query remains the availability gate. */
function amountOf(value: number | string): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

/** Applies only explicitly approved stage weights; unknown stages stay unavailable instead of inheriting a guess. */
function weightForStage(stageName: string): number | null {
  const normalized = stageName.trim().toLowerCase();
  if (normalized === 'qualified') return 0.25;
  if (normalized === 'proposal sent') return 0.5;
  if (normalized === 'negotiation') return 0.85;
  return null;
}

/** Creates independent counters for each creation-time cohort before current status is evaluated. */
function createEmptyCohort(): CohortTotals {
  return { total: 0, disqualified: 0, converted: 0, active: 0, potentialValue: 0 };
}

/** Excludes only known invalid/out-of-scope leads and leaves an empty denominator unavailable. */
function cohortConversionRate(cohort: CohortTotals): number | null {
  const eligible = cohort.total - cohort.disqualified;
  return eligible > 0 ? (cohort.converted / eligible) * 100 : null;
}

function currency(amount: number): string {
  return formatCrmCurrency(amount);
}

export default async function AdminDashboardPage(
  props: AdminDashboardPageProps
): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login?next=%2Fadmin');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, status, allowed_tabs')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError || !profile || profile.status !== 'active') notFound();

  const role = profile.role as CrmUserRole;
  const allowedTabs = profile.allowed_tabs;
  const hasCommandCenterAccess = role === 'admin'
    || (Array.isArray(allowedTabs) && allowedTabs.length > 0
      ? allowedTabs.includes('command_center')
      : Boolean(ROLE_DEFAULT_TABS[role]?.command_center));
  if (!hasCommandCenterAccess) notFound();

  const resolvedSearchParams = props.searchParams ? await props.searchParams : undefined;
  const bounds = resolveTimeframeBounds(timeframeToSlug(resolvedSearchParams?.timeframe));
  const currentStartIso = bounds.currentStart.toISOString();
  const currentEndIso = bounds.currentEnd.toISOString();
  const priorStartIso = bounds.priorStart.toISOString();

  const { data: statuses, error: statusesError } = await supabase
    .from('funnel_statuses')
    .select('id, name, bucket, color_code, sort_order')
    .order('sort_order', { ascending: true });
  if (statusesError) console.error('[admin-dashboard] Funnel status query failed:', statusesError.message);

  const statusRows = (statuses ?? []) as StageStatusRecord[];
  const statusById = new Map(statusRows.map((status) => [status.id, status]));
  const activeStatuses = statusRows.filter((status) => status.bucket === 'open' || status.bucket === 'potential');
  const activeStatusIds = activeStatuses.map((status) => status.id);
  const convertedStatusIds = statusRows.filter((status) => status.bucket === 'converted').map((status) => status.id);

  const now = new Date();
  const nowMs = now.getTime();
  const nowIso = now.toISOString();
  const todayUtc = nowIso.slice(0, 10);
  const startOfTodayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const endOfTodayMs = startOfTodayMs + 86_400_000 - 1;
  const endOfTodayIso = new Date(endOfTodayMs).toISOString();

  const pipelineSummary = {
    stageTotals: new Map<string, { count: number; value: number; weightedValue: number }>(),
    pipelineValue: 0,
    weightedPipelineValue: 0,
    weightedPipelineAvailable: true,
    overdueCount: 0,
    scheduledFollowUps: 0,
    dueTodayCount: 0,
    activeDealsCount: 0,
  };
  const cohortSummary = { current: createEmptyCohort(), prior: createEmptyCohort() };
  const revenueSummary = {
    currentRevenue: 0,
    priorRevenue: 0,
    currentCount: 0,
    cycleTotalDays: 0,
    cycleCount: 0,
    intervalTotals: aggregateTimeframeRevenue(bounds.slug, bounds, []).map(() => 0),
  };

  const activeRowsResult = statusesError
    ? { summary: null, error: statusesError.message }
    : activeStatusIds.length === 0
      ? { summary: pipelineSummary, error: null }
      : await reduceAllPages<ActivePipelineRecord, typeof pipelineSummary>(async (from, to) => {
          const result = await supabase
            .from('leads')
            .select('id, status_id, expected_value, next_follow_up, revisit_date')
            .in('status_id', activeStatusIds)
            .or(SYNTHETIC_EXCLUSION)
            .order('id', { ascending: true })
            .range(from, to);
          return { data: result.data as ActivePipelineRecord[] | null, error: result.error };
        }, pipelineSummary, (summary, rows) => {
          for (const lead of rows) {
            const amount = amountOf(lead.expected_value);
            const status = statusById.get(lead.status_id);
            if (!status) continue;
            summary.activeDealsCount += 1;
            summary.pipelineValue += amount;
            const probability = status.bucket === 'potential' ? weightForStage(status.name) : null;
            const weightedAmount = probability === null ? 0 : amount * probability;
            if (status.bucket === 'potential' && probability === null) summary.weightedPipelineAvailable = false;
            if (status.bucket === 'potential') summary.weightedPipelineValue += weightedAmount;
            const stage = summary.stageTotals.get(status.id) ?? { count: 0, value: 0, weightedValue: 0 };
            stage.count += 1;
            stage.value += amount;
            stage.weightedValue += weightedAmount;
            summary.stageTotals.set(status.id, stage);
            if (!lead.next_follow_up) continue;
            summary.scheduledFollowUps += 1;
            const revisitIsDue = status.name !== 'On Hold' || !lead.revisit_date || lead.revisit_date <= todayUtc;
            const followUpTime = Date.parse(lead.next_follow_up);
            if (!Number.isFinite(followUpTime) || !revisitIsDue) continue;
            if (followUpTime < nowMs) summary.overdueCount += 1;
            else if (followUpTime <= endOfTodayMs) summary.dueTodayCount += 1;
          }
        });

  const cohortRowsResult = statusesError
    ? { summary: null, error: statusesError.message }
    : await reduceAllPages<CohortRecord, typeof cohortSummary>(async (from, to) => {
        const result = await supabase
          .from('leads')
          .select('id, status_id, expected_value, created_at, lost_reason')
          .gte('created_at', priorStartIso)
          .lte('created_at', currentEndIso)
          .or(SYNTHETIC_EXCLUSION)
          .order('id', { ascending: true })
          .range(from, to);
        return { data: result.data as CohortRecord[] | null, error: result.error };
      }, cohortSummary, (summary, rows) => {
        for (const lead of rows) {
          const createdAt = Date.parse(lead.created_at);
          const cohort = createdAt >= bounds.currentStart.getTime() ? summary.current : summary.prior;
          const status = statusById.get(lead.status_id);
          if (!status) continue;
          cohort.total += 1;
          if (lead.lost_reason === 'spam_invalid' || lead.lost_reason === 'out_of_scope') cohort.disqualified += 1;
          if (status.bucket === 'converted') cohort.converted += 1;
          if (status.bucket === 'open' || status.bucket === 'potential') cohort.active += 1;
          if (status.bucket === 'potential') cohort.potentialValue += amountOf(lead.expected_value);
        }
      });

  const emptyRevenuePoints = aggregateTimeframeRevenue(bounds.slug, bounds, []);
  const revenueRowsResult = statusesError
    ? { summary: null, error: statusesError.message }
    : convertedStatusIds.length === 0
      ? { summary: revenueSummary, error: null }
      : await reduceAllPages<RevenueRecord, typeof revenueSummary>(async (from, to) => {
          const result = await supabase
            .from('leads')
            .select('converted_at, created_at, expected_value')
            .in('status_id', convertedStatusIds)
            .gte('converted_at', priorStartIso)
            .lte('converted_at', currentEndIso)
            .or(SYNTHETIC_EXCLUSION)
            .order('id', { ascending: true })
            .range(from, to);
          return { data: result.data as RevenueRecord[] | null, error: result.error };
        }, revenueSummary, (summary, rows) => {
          const chartStart = bounds.currentStart.getTime();
          const chartSpan = bounds.currentEnd.getTime() - chartStart;
          for (const event of rows) {
            const convertedAt = Date.parse(event.converted_at ?? '');
            if (!Number.isFinite(convertedAt)) continue;
            const amount = amountOf(event.expected_value ?? 0);
            if (convertedAt >= chartStart) {
              summary.currentRevenue += amount;
              summary.currentCount += 1;
              if (chartSpan > 0 && summary.intervalTotals.length > 0) {
                const index = Math.min(summary.intervalTotals.length - 1, Math.floor(((convertedAt - chartStart) / chartSpan) * summary.intervalTotals.length));
                summary.intervalTotals[index] += amount;
              }
              const cycleDays = (convertedAt - Date.parse(event.created_at)) / 86_400_000;
              if (Number.isFinite(cycleDays) && cycleDays >= 0) {
                summary.cycleTotalDays += cycleDays;
                summary.cycleCount += 1;
              }
            } else {
              summary.priorRevenue += amount;
            }
          }
        });

  for (const [source, error] of [
    ['active pipeline', activeRowsResult.error],
    ['conversion cohort', cohortRowsResult.error],
    ['converted contract value', revenueRowsResult.error],
  ] as const) {
    if (error) console.error('[admin-dashboard] ' + source + ' query failed:', error);
  }

  const activeSummary = activeRowsResult.summary;
  const cohortTotals = cohortRowsResult.summary;
  const revenueTotals = revenueRowsResult.summary;
  const stageTotals = activeSummary?.stageTotals ?? new Map<string, { count: number; value: number; weightedValue: number }>();
  const pipelineValue = activeSummary?.pipelineValue ?? 0;
  const weightedPipelineValue = activeSummary?.weightedPipelineValue ?? 0;
  const weightedPipelineAvailable = activeSummary?.weightedPipelineAvailable ?? false;
  const overdueCount = activeSummary?.overdueCount ?? 0;
  const scheduledFollowUps = activeSummary?.scheduledFollowUps ?? 0;
  const dueTodayCount = activeSummary?.dueTodayCount ?? 0;
  const activeDealsCount = activeSummary?.activeDealsCount ?? 0;
  const currentCohort = cohortTotals?.current ?? createEmptyCohort();
  const currentRevenue = revenueTotals?.currentRevenue ?? 0;
  const priorRevenue = revenueTotals?.priorRevenue ?? 0;
  const currentRevenueCount = revenueTotals?.currentCount ?? 0;
  const averageSalesCycle = revenueTotals && revenueTotals.cycleCount > 0
    ? revenueTotals.cycleTotalDays / revenueTotals.cycleCount
    : null;

  const { data: attentionRows, error: attentionError } = activeStatusIds.length === 0
    ? { data: [] as AttentionRecord[], error: null }
    : await supabase
        .from('leads')
        .select('id, lead_id, name, company, status_id, priority, expected_value, next_follow_up, revisit_date')
        .in('status_id', activeStatusIds)
        .not('next_follow_up', 'is', null)
        .lte('next_follow_up', endOfTodayIso)
        .or(SYNTHETIC_EXCLUSION)
        .order('next_follow_up', { ascending: true })
        .order('id', { ascending: true })
        .limit(24);
  if (attentionError) console.error('[admin-dashboard] Attention queue query failed:', attentionError.message);

  const pipelineAvailable = !statusesError && !activeRowsResult.error;
  const cohortAvailable = !statusesError && !cohortRowsResult.error;
  const revenueAvailable = !statusesError && !revenueRowsResult.error;
  const executiveKpis: ExecutiveDashboardKpis = {
    totalPipelineValue: pipelineAvailable ? pipelineValue : null,
    weightedPipelineValue: pipelineAvailable && weightedPipelineAvailable ? weightedPipelineValue : null,
    pipelineDealsCount: pipelineAvailable ? activeDealsCount : null,
    pipelineDeltaPercentage: null,
    convertedRevenueValue: revenueAvailable ? currentRevenue : null,
    convertedDealsCount: revenueAvailable ? currentRevenueCount : null,
    revenueDeltaPercentage: revenueAvailable ? calculateMetricDelta(currentRevenue, priorRevenue) : null,
    activeDealsCount: pipelineAvailable ? activeDealsCount : null,
    overdueDealsCount: pipelineAvailable ? overdueCount : null,
    dealsDeltaPercentage: null,
    conversionWinRate: cohortAvailable ? cohortConversionRate(currentCohort) : null,
    winRateDeltaPercentage: null,
    conversionWonCount: cohortAvailable ? currentCohort.converted : null,
    conversionEligibleCount: cohortAvailable ? currentCohort.total - currentCohort.disqualified : null,
    cadenceLabel: bounds.cadenceLabel,
    slaOnTrackPercentage: pipelineAvailable && scheduledFollowUps > 0
      ? ((scheduledFollowUps - overdueCount) / scheduledFollowUps) * 100
      : null,
    averageSalesCycleDays: revenueAvailable ? averageSalesCycle : null,
  };

  const dynamicStages: StageAllocationItem[] = activeStatuses.map((status) => {
    const stage = stageTotals.get(status.id);
    const amount = stage?.value ?? 0;
    const dealCount = stage?.count ?? 0;
    return {
      id: status.id,
      code: undefined,
      name: status.name,
      color: status.color_code || '#ea002a',
      dealCount,
      amount,
      formattedAmount: currency(amount),
      percentage: pipelineValue > 0 ? (amount / pipelineValue) * 100 : 0,
      statusLabel: status.bucket === 'potential' ? 'Qualified' : 'Open',
    };
  });

  const revenueSplinePoints = revenueRowsResult.error || !revenueTotals
    ? []
    : emptyRevenuePoints.map((point, index) => {
        const cashVal = revenueTotals.intervalTotals[index] ?? 0;
        return { ...point, cashVal, cashFormatted: currency(cashVal) };
      });

  const { data: topLeads, error: topLeadsError } = activeStatusIds.length === 0
    ? { data: [], error: null }
    : await supabase
        .from('leads')
        .select('id, lead_id, assigned_to, name, company, service_category, expected_value, priority, next_follow_up, revisit_date, created_at, status_id')
        .in('status_id', activeStatusIds)
        .or(SYNTHETIC_EXCLUSION)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(10);
  if (topLeadsError) console.error('[admin-dashboard] recent deal query failed:', topLeadsError.message);

  const assignedIds = [...new Set((topLeads ?? []).flatMap((lead) => lead.assigned_to ? [lead.assigned_to] : []))];
  const { data: directory, error: directoryError } = assignedIds.length === 0
    ? { data: [], error: null }
    : await supabase.from('crm_team_directory').select('id, full_name').in('id', assignedIds);
  if (directoryError) console.error('[admin-dashboard] safe team directory query failed:', directoryError.message);
  const ownerById = new Map(((directory ?? []) as TeamDirectoryRecord[]).map((member) => [member.id, member.full_name]));

  const activeDealsList: ActiveDealItem[] = (topLeads ?? []).map((lead) => {
    const status = statusById.get(lead.status_id);
    const assignedName = lead.assigned_to ? ownerById.get(lead.assigned_to) : null;
    return {
      id: lead.id,
      leadId: lead.lead_id,
      name: lead.name,
      company: lead.company,
      serviceCategory: lead.service_category,
      stageName: status?.name ?? 'Unknown stage',
      stageBucket: status?.bucket ?? 'unknown',
      expectedValue: amountOf(lead.expected_value),
      nextFollowUp: lead.next_follow_up,
      isOverdue: Boolean(lead.next_follow_up && Date.parse(lead.next_follow_up) < nowMs && (status?.name !== 'On Hold' || !lead.revisit_date || lead.revisit_date <= todayUtc)),
      priority: lead.priority,
      owner: lead.assigned_to ? assignedName ?? 'Former team member' : 'Unassigned',
    };
  });

  const stageStatus = activeRowsResult.error || statusesError ? 'unavailable' : 'ready';
  const revenueStatus = revenueRowsResult.error ? 'unavailable' : 'ready';
  const dealsStatus = statusesError || topLeadsError || directoryError ? 'unavailable' : 'ready';
  const currentConversionRate = cohortAvailable ? cohortConversionRate(currentCohort) : null;
  const exportData = pipelineAvailable && cohortAvailable && revenueAvailable && stageStatus === 'ready' && revenueStatus === 'ready' && dealsStatus === 'ready'
    ? {
        timeframe: bounds.label,
        cadence: bounds.cadenceLabel,
        dateWindow: { start: currentStartIso, end: currentEndIso },
        generatedAt: new Date().toISOString(),
        metrics: [
          { label: 'Active pipeline', value: currency(pipelineValue) },
          { label: 'Weighted potential pipeline', value: weightedPipelineAvailable ? currency(weightedPipelineValue) : 'Unavailable' },
          { label: 'Converted contract value', value: currency(currentRevenue) },
          { label: 'Closed deals', value: currentRevenueCount },
          { label: 'Active deals', value: activeDealsCount },
          { label: 'Current status conversion rate for eligible leads created in period', value: currentConversionRate === null ? 'Unavailable' : currentConversionRate.toFixed(1) + '%' },
        ],
        stages: dynamicStages.map((stage) => ({
          stageName: stage.name,
          dealCount: stage.dealCount,
          totalValue: stage.amount,
        })),
        deals: activeDealsList.map((deal) => ({
          leadId: deal.leadId,
          name: deal.name,
          company: deal.company ?? null,
          serviceCategory: deal.serviceCategory,
          stageName: deal.stageName,
          expectedValue: deal.expectedValue,
          priority: deal.priority,
          nextFollowUp: deal.nextFollowUp ?? null,
          owner: deal.owner ?? null,
        })),
      }
    : undefined;

  return (
    <div className={styles.dashboardContainer}>
      <main className={styles.fluidCanvas}>
        <ExecutiveMasthead selectedTimeframe={bounds.label} exportData={exportData} />
        <ExecutiveKpiGrid kpis={executiveKpis} cadenceLabel={bounds.cadenceLabel} metricStatus={{ pipeline: pipelineAvailable ? 'ready' : 'unavailable', revenue: revenueAvailable ? 'ready' : 'unavailable', cohort: cohortAvailable ? 'ready' : 'unavailable' }} />
        <AttentionQueue
          items={(attentionRows ?? []).filter((lead) => {
            const stage = statusById.get(lead.status_id);
            return stage?.name !== 'On Hold' || !lead.revisit_date || lead.revisit_date <= todayUtc;
          }).slice(0, 6).map((lead): AttentionQueueItem => ({
            id: lead.id,
            leadId: lead.lead_id,
            name: lead.name,
            company: lead.company,
            stage: statusById.get(lead.status_id)?.name ?? 'Unknown stage',
            priority: lead.priority as AttentionQueueItem['priority'],
            expectedValue: amountOf(lead.expected_value ?? 0),
            nextFollowUp: lead.next_follow_up,
          }))}
          overdueCount={pipelineAvailable ? overdueCount : null}
          dueTodayCount={pipelineAvailable ? dueTodayCount : null}
          dataStatus={attentionError ? 'unavailable' : 'ready'}
        />
        <PipelineAllocationCard
          totalValuation={pipelineAvailable ? pipelineValue : null}
          stages={dynamicStages}
          dataStatus={stageStatus}
        />
        <section className={styles.bottomSection} aria-label="Recent work and conversion trend">
          <RevenueDynamicsCard
            dataPoints={revenueSplinePoints}
            timeframe={bounds.label}
            dataStatus={revenueStatus}
            conversionCount={currentRevenueCount}
          />
          <CommercialDealsTable deals={activeDealsList} dataStatus={dealsStatus} />
        </section>
      </main>
    </div>
  );
}
