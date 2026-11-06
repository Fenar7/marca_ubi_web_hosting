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
import { ROLE_DEFAULT_TABS, type CrmUserRole, type FunnelBucket } from '@/types/crm';
import {
  ExecutiveMasthead,
  ExecutiveKpiGrid,
  RevenueDynamicsCard,
  PipelineAllocationCard,
  CommercialDealsTable,
  type ActiveDealItem,
  type ExecutiveDashboardKpis,
  type StageAllocationItem,
} from '@/app/admin/components/Dashboard';
import {
  aggregateTimeframeRevenue,
  calculateMetricDelta,
  resolveTimeframeBounds,
  timeframeToSlug,
  type RevenueEvent,
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
  data: T[] | null;
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

interface RevenueRecord extends RevenueEvent {
  createdAt: string;
}

interface TeamDirectoryRecord {
  id: string;
  full_name: string | null;
}

interface CohortTotals {
  total: number;
  disqualified: number;
  converted: number;
  active: number;
  potentialValue: number;
}

/**
 * Reads deterministic ordered pages to exhaustion. A failed page or an unusually large result
 * invalidates the whole aggregate so the dashboard never presents partial totals as complete.
 */
async function readAllPages<T>(loadPage: (from: number, to: number) => Promise<PageRead<T>>): Promise<PageReadAll<T>> {
  const rows: T[] = [];
  for (let from = 0; from <= MAX_DASHBOARD_ROWS; from += PAGE_SIZE) {
    const { data, error } = await loadPage(from, from + PAGE_SIZE - 1);
    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: 'The CRM query returned no result payload.' };
    if (rows.length + data.length > MAX_DASHBOARD_ROWS) {
      return { data: null, error: 'The dashboard data set exceeds the safe aggregation limit.' };
    }
    rows.push(...data);
    if (data.length < PAGE_SIZE) return { data: rows, error: null };
  }
  return { data: null, error: 'The dashboard query did not reach a final page.' };
}

function amountOf(value: number | string): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function weightForStage(stageName: string): number | null {
  const normalized = stageName.trim().toLowerCase();
  if (normalized === 'qualified') return 0.25;
  if (normalized === 'proposal sent') return 0.5;
  if (normalized === 'negotiation') return 0.85;
  return null;
}

function createEmptyCohort(): CohortTotals {
  return { total: 0, disqualified: 0, converted: 0, active: 0, potentialValue: 0 };
}

function cohortConversionRate(cohort: CohortTotals): number | null {
  const eligible = cohort.total - cohort.disqualified;
  return eligible > 0 ? (cohort.converted / eligible) * 100 : null;
}

function currency(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
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

  const activeRowsResult = statusesError || activeStatusIds.length === 0
    ? { data: statusesError ? null : [], error: statusesError?.message ?? null }
    : await readAllPages<ActivePipelineRecord>(async (from, to) => {
        const result = await supabase
          .from('leads')
          .select('id, status_id, expected_value, next_follow_up, revisit_date')
          .in('status_id', activeStatusIds)
          .or(SYNTHETIC_EXCLUSION)
          .order('id', { ascending: true })
          .range(from, to);
        return { data: result.data as ActivePipelineRecord[] | null, error: result.error };
      });

  const cohortRowsResult = statusesError
    ? { data: null, error: statusesError.message }
    : await readAllPages<CohortRecord>(async (from, to) => {
        const result = await supabase
          .from('leads')
          .select('id, status_id, expected_value, created_at, lost_reason')
          .gte('created_at', priorStartIso)
          .lte('created_at', currentEndIso)
          .or(SYNTHETIC_EXCLUSION)
          .order('id', { ascending: true })
          .range(from, to);
        return { data: result.data as CohortRecord[] | null, error: result.error };
      });

  const revenueRowsResult = statusesError || convertedStatusIds.length === 0
    ? { data: statusesError ? null : [], error: statusesError?.message ?? null }
    : await readAllPages<RevenueRecord>(async (from, to) => {
        const result = await supabase
          .from('leads')
          .select('converted_at, created_at, expected_value')
          .in('status_id', convertedStatusIds)
          .gte('converted_at', priorStartIso)
          .lte('converted_at', currentEndIso)
          .or(SYNTHETIC_EXCLUSION)
          .order('id', { ascending: true })
          .range(from, to);
        const rows = result.data?.map((row) => ({
          convertedAt: row.converted_at ?? '',
          createdAt: row.created_at,
          amount: amountOf(row.expected_value),
        })) ?? null;
        return { data: rows as RevenueRecord[] | null, error: result.error };
      });

  for (const [source, error] of [
    ['active pipeline', activeRowsResult.error],
    ['conversion cohort', cohortRowsResult.error],
    ['converted contract value', revenueRowsResult.error],
  ] as const) {
    if (error) console.error('[admin-dashboard] ' + source + ' query failed:', error);
  }

  const activeRows = activeRowsResult.data ?? [];
  const cohortRows = cohortRowsResult.data ?? [];
  const revenueRows = revenueRowsResult.data ?? [];
  const now = new Date();
  const nowMs = now.getTime();
  const nowIso = now.toISOString();
  const todayUtc = nowIso.slice(0, 10);

  const stageTotals = new Map<string, { count: number; value: number; weightedValue: number }>();
  let pipelineValue = 0;
  let weightedPipelineValue = 0;
  let weightedPipelineAvailable = true;
  let overdueCount = 0;
  let scheduledFollowUps = 0;
  for (const lead of activeRows) {
    const amount = amountOf(lead.expected_value);
    const status = statusById.get(lead.status_id);
    if (!status) continue;
    pipelineValue += amount;
    const coefficient = status.bucket === 'potential' ? weightForStage(status.name) : null;
    const weightedValue = coefficient === null ? 0 : amount * coefficient;
    if (status.bucket === 'potential' && coefficient === null) weightedPipelineAvailable = false;
    if (status.bucket === 'potential') weightedPipelineValue += weightedValue;
    const stage = stageTotals.get(status.id) ?? { count: 0, value: 0, weightedValue: 0 };
    stage.count += 1;
    stage.value += amount;
    stage.weightedValue += weightedValue;
    stageTotals.set(status.id, stage);

    if (lead.next_follow_up) {
      scheduledFollowUps += 1;
      const revisitIsDue = status.name !== 'On Hold' || !lead.revisit_date || lead.revisit_date <= todayUtc;
      if (lead.next_follow_up < nowIso && revisitIsDue) overdueCount += 1;
    }
  }

  const currentCohort = createEmptyCohort();
  const priorCohort = createEmptyCohort();
  for (const lead of cohortRows) {
    const createdAt = Date.parse(lead.created_at);
    const cohort = createdAt >= bounds.currentStart.getTime() ? currentCohort : priorCohort;
    const status = statusById.get(lead.status_id);
    if (!status) continue;
    cohort.total += 1;
    if (lead.lost_reason === 'spam_invalid' || lead.lost_reason === 'out_of_scope') cohort.disqualified += 1;
    if (status.bucket === 'converted') cohort.converted += 1;
    if (status.bucket === 'open' || status.bucket === 'potential') cohort.active += 1;
    if (status.bucket === 'potential') cohort.potentialValue += amountOf(lead.expected_value);
  }

  const currentRevenueEvents = revenueRows.filter((event) => Date.parse(event.convertedAt) >= bounds.currentStart.getTime());
  const priorRevenueEvents = revenueRows.filter((event) => Date.parse(event.convertedAt) < bounds.currentStart.getTime());
  const currentRevenue = currentRevenueEvents.reduce((total, event) => total + event.amount, 0);
  const priorRevenue = priorRevenueEvents.reduce((total, event) => total + event.amount, 0);
  const salesCycleDays = currentRevenueEvents
    .map((event) => (Date.parse(event.convertedAt) - Date.parse(event.createdAt)) / 86400000)
    .filter((days) => Number.isFinite(days) && days >= 0);
  const averageSalesCycle = salesCycleDays.length > 0
    ? salesCycleDays.reduce((total, days) => total + days, 0) / salesCycleDays.length
    : null;

  const executiveKpis: ExecutiveDashboardKpis | null =
    statusesError || activeRowsResult.error || cohortRowsResult.error || revenueRowsResult.error
      ? null
      : {
          totalPipelineValue: pipelineValue,
          weightedPipelineValue: weightedPipelineAvailable ? weightedPipelineValue : null,
          pipelineDealsCount: activeRows.length,
          pipelineDeltaPercentage: null,
          convertedRevenueValue: currentRevenue,
          convertedDealsCount: currentRevenueEvents.length,
          revenueDeltaPercentage: calculateMetricDelta(currentRevenue, priorRevenue),
          activeDealsCount: activeRows.length,
          overdueDealsCount: overdueCount,
          dealsDeltaPercentage: calculateMetricDelta(currentCohort.active, priorCohort.active),
          conversionWinRate: cohortConversionRate(currentCohort),
          winRateDeltaPercentage: calculateMetricDelta(
            cohortConversionRate(currentCohort) ?? Number.NaN,
            cohortConversionRate(priorCohort) ?? Number.NaN
          ),
          cadenceLabel: bounds.cadenceLabel,
          slaOnTrackPercentage: scheduledFollowUps > 0
            ? ((scheduledFollowUps - overdueCount) / scheduledFollowUps) * 100
            : null,
          averageSalesCycleDays: averageSalesCycle,
        };

  const dynamicStages: StageAllocationItem[] = activeStatuses.flatMap((status) => {
    const stage = stageTotals.get(status.id);
    if (!stage) return [];
    return [{
      id: status.id,
      code: undefined,
      name: status.name,
      color: status.color_code || '#ff6100',
      dealCount: stage.count,
      amount: stage.value,
      formattedAmount: currency(stage.value),
      percentage: pipelineValue > 0 ? (stage.value / pipelineValue) * 100 : 0,
      statusLabel: status.bucket === 'potential' ? 'Qualified' : 'Open',
    }];
  });

  const revenueSplinePoints = revenueRowsResult.error
    ? []
    : aggregateTimeframeRevenue(bounds.slug, bounds, currentRevenueEvents);

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

  const kpiStatus = executiveKpis ? 'ready' : 'unavailable';
  const stageStatus = activeRowsResult.error || statusesError ? 'unavailable' : 'ready';
  const revenueStatus = revenueRowsResult.error ? 'unavailable' : 'ready';
  const dealsStatus = statusesError || topLeadsError || directoryError ? 'unavailable' : 'ready';
  const currentConversionRate = cohortConversionRate(currentCohort);
  const exportData = kpiStatus === 'ready' && stageStatus === 'ready' && revenueStatus === 'ready' && dealsStatus === 'ready'
    ? {
        timeframe: bounds.label,
        cadence: bounds.cadenceLabel,
        dateWindow: { start: currentStartIso, end: currentEndIso },
        generatedAt: new Date().toISOString(),
        metrics: [
          { label: 'Active pipeline', value: currency(pipelineValue) },
          { label: 'Weighted potential pipeline', value: weightedPipelineAvailable ? currency(weightedPipelineValue) : 'Unavailable' },
          { label: 'Converted contract value', value: currency(currentRevenue) },
          { label: 'Closed deals', value: currentRevenueEvents.length },
          { label: 'Active deals', value: activeRows.length },
          { label: 'Current status conversion rate for leads created in period', value: currentConversionRate === null ? 'Unavailable' : currentConversionRate.toFixed(1) + '%' },
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
        <ExecutiveKpiGrid kpis={executiveKpis} dataStatus={kpiStatus} cadenceLabel={bounds.cadenceLabel} />
        <section className={styles.midTierGrid} aria-label="Executive Performance Analytics">
          <RevenueDynamicsCard
            dataPoints={revenueSplinePoints}
            timeframe={bounds.label}
            dataStatus={revenueStatus}
          />
          <PipelineAllocationCard
            totalValuation={pipelineValue}
            stages={dynamicStages}
            deltaPercentage={null}
            cadenceLabel={bounds.cadenceLabel}
            dataStatus={stageStatus}
          />
        </section>
        <section className={styles.bottomSection} aria-label="Commercial Deals Table">
          <CommercialDealsTable deals={activeDealsList} dataStatus={dealsStatus} />
        </section>
      </main>
    </div>
  );
}
