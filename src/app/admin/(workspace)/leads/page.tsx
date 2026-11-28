/**
 * @file page.tsx
 * @description Commercial Deals & Inquiries Workspace (/admin/leads).
 *              Server Component executing parallel streaming queries across active client engagements,
 *              deal valuations, pipeline stage state machines, and staff assignments.
 *              Wrapped in React 19 Suspense boundary with zero-CLS LeadsTableSkeleton fallback.
 * @module app/admin/(workspace)/leads/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { ROLE_DEFAULT_TABS, type CrmUserRole, type FunnelBucket } from '@/types/crm';
import { dashboardAmount, foldDashboardPages } from '@/app/admin/lib/dashboardContracts';
import { buildCommercialSearchFilter } from '@/app/admin/lib/commercialSearch';
import { LeadsTableSkeleton, type InlineStatusOption } from '@/app/admin/components/LeadsTable';
import { ResultPagination } from '@/app/admin/components/LeadsTable/ResultPagination';
import { LeadsWorkspaceClient, type HydratedLeadItem } from './LeadsWorkspaceClient';
import { NewLeadHeaderButton } from './NewLeadHeaderButton';
import type { FilterDropdownOption } from '@/app/admin/components/FilterActionBar';
import styles from './leads.module.scss';

export const metadata: Metadata = {
  title: 'Inbound Leads | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

interface FilterableLeadQuery<TResult = unknown> {
  eq(column: string, value: string): FilterableLeadQuery<TResult>;
  ilike(column: string, pattern: string): FilterableLeadQuery<TResult>;
  in(column: string, values: readonly string[]): FilterableLeadQuery<TResult>;
  not(column: string, operator: string, value: null): FilterableLeadQuery<TResult>;
  lt(column: string, value: string): FilterableLeadQuery<TResult>;
  or(filters: string): FilterableLeadQuery<TResult>;
  order(
    column: string,
    opts?: { ascending?: boolean; nullsFirst?: boolean }
  ): FilterableLeadQuery<TResult>;
  range(from: number, to: number): PromiseLike<TResult>;
}

interface LeadQueryResponse {
  data: unknown[] | null;
  error: { code?: string; message: string } | null;
  count: number | null;
}

const SORTABLE_LEAD_COLUMNS: Record<string, string> = {
  lead_id: 'lead_id',
  name: 'name',
  service_category: 'service_category',
  expected_value: 'expected_value',
  priority: 'priority',
  next_follow_up: 'next_follow_up',
  created_at: 'created_at',
};

interface AdminLeadsPageProps {
  searchParams?: Promise<{
    id?: string;
    leadId?: string;
    stage?: string;
    assigned_to?: string;
    bucket?: string;
    source?: string;
    priority?: string;
    search?: string;
    q?: string;
    action?: string;
    sort?: string;
    dir?: string;
    error?: string;
    page?: string;
  }>;
}

export default async function AdminLeadsPage(
  props: AdminLeadsPageProps
): Promise<React.ReactElement> {
  // Await Next.js 16 dynamic search parameters.
  // Note: Deep links with ?id= seamlessly hydrate the in-context Client 360 Slide-over
  // Drawer within LeadsWorkspaceClient, while legacy ?leadId= redirects to the dedicated full-page workspace.
  const resolvedSearchParams = props.searchParams ? await props.searchParams : undefined;
  const requestedPage = Number(resolvedSearchParams?.page ?? '1');
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  const pageSize = 100;
  if (resolvedSearchParams?.leadId) {
    redirect(`/admin/leads/${resolvedSearchParams.leadId}`);
  }
  if (resolvedSearchParams?.id) {
    redirect(`/admin/leads/${encodeURIComponent(resolvedSearchParams.id)}`);
  }
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login?next=%2Fadmin%2Fleads');
  }

  // Verify tab-level access against user's granular allowed_tabs
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, allowed_tabs, feature_permissions')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.status !== 'active') {
    redirect('/admin/login?error=account_suspended');
  }

  const role = profile.role as CrmUserRole;
  const allowedTabs = profile.allowed_tabs as string[] | undefined;
  const hasLeadsAccess = role === 'admin' || (Array.isArray(allowedTabs) && allowedTabs.length > 0
    ? allowedTabs.includes('leads')
    : Boolean(ROLE_DEFAULT_TABS[role]?.leads));

  if (!hasLeadsAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const { bucket, stage, assigned_to: assignedTo, source, priority } = resolvedSearchParams ?? {};
  const search = buildCommercialSearchFilter(resolvedSearchParams?.search ?? resolvedSearchParams?.q);
  const invalidFilter = [stage, assignedTo, source].some((value) => value && !uuid.test(value))
    || Boolean(priority && !['high', 'medium', 'low'].includes(priority.toLowerCase()))
    || Boolean(bucket && !['all', 'open', 'potential', 'converted', 'lost', 'overdue'].includes(bucket));

  const nowIso = new Date().toISOString();
  const requestNowMs = Date.parse(nowIso);
  const todayDate = nowIso.slice(0, 10);
  const { dashboardFeature } = await import('@/app/admin/lib/dashboardContracts');
  const canViewFinancials = dashboardFeature(role, profile.feature_permissions, 'can_view_financials');
  const requestedSort = resolvedSearchParams?.sort;
  const resolvedSortColumn =
    requestedSort &&
    SORTABLE_LEAD_COLUMNS[requestedSort] &&
    (canViewFinancials || requestedSort !== 'expected_value')
      ? SORTABLE_LEAD_COLUMNS[requestedSort]
      : 'created_at';
  const sortAscending = resolvedSearchParams?.dir === 'asc';
  const hasErrorBanner = Boolean(resolvedSearchParams?.error);

  const syntheticExclusion = 'brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true';

  function applyBaseLeadFilters<TResult>(
    q: FilterableLeadQuery<TResult>,
    includeBucket = true
  ): FilterableLeadQuery<TResult> {
    let query = q;
    if (!invalidFilter) {
      if (stage) query = query.eq('status_id', stage);
      if (assignedTo) query = query.eq('assigned_to', assignedTo);
      if (source) query = query.eq('lead_source_id', source);
      if (priority) query = query.ilike('priority', priority);

      const orGroups: string[] = [`or(${syntheticExclusion})`];
      if (search.filter) {
        orGroups.push(`or(${search.filter})`);
      }

      if (includeBucket && bucket && bucket !== 'all') {
        if (bucket === 'overdue') {
          query = query
            .in('funnel_statuses.bucket', ['open', 'potential'])
            .not('next_follow_up', 'is', null)
            .lt('next_follow_up', nowIso);
          orGroups.push(`or(revisit_date.is.null,revisit_date.lte.${todayDate})`);
        } else {
          query = query.eq('funnel_statuses.bucket', bucket);
        }
      }

      if (orGroups.length === 1) {
        query = query.or(syntheticExclusion);
      } else {
        query = query.or(`and(${orGroups.join(',')})`);
      }
    }
    return query;
  }

  const leadColumns = canViewFinancials
    ? `id, lead_id, name, company, phone, email, preferred_channel, service_category, expected_value, priority, status_id, assigned_to, lead_source_id, next_follow_up, revisit_date, created_at, funnel_statuses!inner(id, name, bucket, color_code, sort_order)`
    : `id, lead_id, name, company, phone, email, preferred_channel, service_category, priority, status_id, assigned_to, lead_source_id, next_follow_up, revisit_date, created_at, funnel_statuses!inner(id, name, bucket, color_code, sort_order)`;

  const leadsQuery = applyBaseLeadFilters<LeadQueryResponse>(
    supabase.from('leads').select(leadColumns, { count: 'exact' }) as unknown as FilterableLeadQuery<LeadQueryResponse>,
    true
  );

  const countBucketHead = async (targetBucket: 'all' | 'open' | 'potential' | 'converted' | 'lost' | 'overdue'): Promise<number | null> => {
    if (invalidFilter || hasErrorBanner) return null;
    if (targetBucket === 'overdue') {
      const orGroups = [
        `or(${syntheticExclusion})`,
        ...(search.filter ? [`or(${search.filter})`] : []),
        `or(revisit_date.is.null,revisit_date.lte.${todayDate})`,
      ];
      let oq = supabase
        .from('leads')
        .select('id, funnel_statuses!inner(bucket)', { count: 'exact', head: true })
        .in('funnel_statuses.bucket', ['open', 'potential'])
        .not('next_follow_up', 'is', null)
        .lt('next_follow_up', nowIso);
      if (stage) oq = oq.eq('status_id', stage);
      if (assignedTo) oq = oq.eq('assigned_to', assignedTo);
      if (source) oq = oq.eq('lead_source_id', source);
      if (priority) oq = oq.ilike('priority', priority);
      oq = oq.or(`and(${orGroups.join(',')})`);
      const res = await oq;
      return res.error ? null : res.count;
    }

    let q = applyBaseLeadFilters<{ count: number | null; error: { code?: string; message: string } | null }>(
      supabase.from('leads').select('id, funnel_statuses!inner(bucket)', { count: 'exact', head: true }) as unknown as FilterableLeadQuery<{ count: number | null; error: { code?: string; message: string } | null }>,
      false
    );
    if (targetBucket !== 'all') {
      q = q.eq('funnel_statuses.bucket', targetBucket);
    }
    const res = await (q as unknown as PromiseLike<{ count: number | null; error: { code?: string; message: string } | null }>);
    return res.error ? null : res.count;
  };

  const pipelineFoldPromise =
    invalidFilter || hasErrorBanner || !canViewFinancials
      ? Promise.resolve(null)
      : foldDashboardPages<{ expected_value?: number | string }, { total: number }>(
          async (from, to) => {
            const q = applyBaseLeadFilters<LeadQueryResponse>(
              supabase
                .from('leads')
                .select('id, expected_value, funnel_statuses!inner(bucket)')
                .in('funnel_statuses.bucket', ['open', 'potential']) as unknown as FilterableLeadQuery<LeadQueryResponse>,
              false
            )
              .order('id')
              .range(from, to);
            const res = await q;
            return {
              data: res.data as unknown as Array<{ expected_value?: number | string }> | null,
              error: res.error,
            };
          },
          { total: 0 },
          (acc, row) => {
            const amt = dashboardAmount(row.expected_value);
            if (amt !== null) acc.total += amt;
          }
        );

  const [
    sourcesRes,
    profilesRes,
    statusesRes,
    leadsRes,
    allBucketCount,
    openBucketCount,
    potentialBucketCount,
    convertedBucketCount,
    lostBucketCount,
    overdueBucketCount,
    pipelineValueFold,
  ] = await Promise.all([
    supabase
      .from('lead_sources')
      .select('id, name, color_code')
      .order('name'),
    supabase
      .from('crm_team_directory')
      .select('id, full_name, role')
      .order('full_name'),
    supabase
      .from('funnel_statuses')
      .select('id, name, bucket, color_code, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    leadsQuery
      .order(resolvedSortColumn, { ascending: sortAscending, nullsFirst: false })
      .order('id', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1),
    countBucketHead('all'),
    countBucketHead('open'),
    countBucketHead('potential'),
    countBucketHead('converted'),
    countBucketHead('lost'),
    countBucketHead('overdue'),
    pipelineFoldPromise,
  ]);

  if (leadsRes.error) console.error('[leads-workspace] Failed to load leads:', { code: leadsRes.error.code, message: leadsRes.error.message });
  if (statusesRes.error) console.error('[leads-workspace] Failed to load stages:', { code: statusesRes.error.code, message: statusesRes.error.message });
  if (sourcesRes.error) console.error('[leads-workspace] Lead source filters unavailable:', { code: sourcesRes.error.code, message: sourcesRes.error.message });
  if (profilesRes.error) console.error('[leads-workspace] Owner directory unavailable:', { code: profilesRes.error.code, message: profilesRes.error.message });

  // Keep the lookup inside the caller's RLS scope when the directory view is unavailable.
  const owners = profilesRes.error
    ? await supabase.from('profiles').select('id, full_name, role').eq('status', 'active').order('full_name')
    : profilesRes;
  if (owners.error) console.error('[leads-workspace] Owner fallback unavailable:', { code: owners.error.code, message: owners.error.message });

  // Transform lookup catalog options for filter dropdown menus
  const availableSources: FilterDropdownOption[] = (sourcesRes.data || []).map((s) => ({
    id: s.id,
    label: s.name,
    colorCode: s.color_code,
  }));

  const availableAssignees: FilterDropdownOption[] = (owners.data || []).map((p) => {
    const initials = p.full_name
      ? p.full_name
          .split(' ')
          .filter(Boolean)
          .map((n: string) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : 'MU';

    return {
      id: p.id,
      label: p.full_name,
      avatarText: initials,
    };
  });



  const availableStatuses: InlineStatusOption[] = (statusesRes.data || []).map((s) => ({
    id: s.id,
    name: s.name,
    bucket: s.bucket as FunnelBucket,
    color_code: s.color_code || '#111111',
    sort_order: s.sort_order,
  }));

  const ownerNameById = new Map((owners.data || []).map((member) => [member.id, member.full_name]));
  const sourceById = new Map((sourcesRes.data || []).map((source) => [source.id, source]));

  // Hydrate client model with relational properties
  const rawLeadRows = (leadsRes.data || []) as unknown as Array<{
    id: string;
    lead_id: string;
    name: string;
    company: string | null;
    phone: string | null;
    email: string | null;
    preferred_channel: string | null;
    service_category: string | null;
    expected_value?: number | string | null;
    priority: string | null;
    status_id: string;
    assigned_to: string | null;
    lead_source_id: string;
    next_follow_up: string | null;
    revisit_date: string | null;
    created_at: string;
    funnel_statuses?: unknown;
  }>;
  const leads: HydratedLeadItem[] = rawLeadRows.map((l) => {
    const statusData = l.funnel_statuses as {
      id?: string;
      name?: string;
      bucket?: FunnelBucket;
      color_code?: string;
      sort_order?: number;
    } | null;

    const sourceData = sourceById.get(l.lead_source_id);

    return {
      id: l.id,
      lead_id: l.lead_id,
      name: l.name,
      company: l.company,
      phone: l.phone,
      email: l.email,
      preferred_channel: l.preferred_channel || 'Email',
      service_category: l.service_category || 'Creative Agency',
      expected_value: canViewFinancials ? Number(l.expected_value) || 0 : 0,
      priority: l.priority || 'Medium',
      status_id: l.status_id,
      status_name: statusData?.name || 'Active Deal',
      status_color: statusData?.color_code || '#111111',
      bucket: statusData?.bucket || 'open',
      assigned_to: l.assigned_to,
      assigned_to_name: l.assigned_to
        ? ownerNameById.get(l.assigned_to) || 'Owner unavailable'
        : 'Unassigned',
      lead_source_id: l.lead_source_id,
      lead_source_name: sourceData?.name || null,
      lead_source_color: sourceData?.color_code || null,
      next_follow_up: l.next_follow_up,
      revisit_date: l.revisit_date,
      created_at: l.created_at,
    };
  });

  const missingOwnerDetails = owners.error || (profilesRes.error && leads.some(
    (lead) => lead.assigned_to && !ownerNameById.has(lead.assigned_to),
  ));
  const unavailableDetails = [sourcesRes.error && 'Sources', missingOwnerDetails && 'Owner names'].filter(Boolean);
  const lookupNotice = unavailableDetails.length ? `${unavailableDetails.join(' and ')} unavailable.` : undefined;

  const totalInquiries = allBucketCount ?? leadsRes.count ?? leads.length;
  const activeTriageCount =
    openBucketCount !== null && potentialBucketCount !== null
      ? openBucketCount + potentialBucketCount
      : leads.filter((l) => l.bucket === 'open' || l.bucket === 'potential').length;
  const overdueCount =
    overdueBucketCount ??
    leads.filter(
      (l) =>
        l.next_follow_up &&
        new Date(l.next_follow_up).getTime() < requestNowMs &&
        l.bucket !== 'converted' &&
        l.bucket !== 'lost'
    ).length;
  const totalPipelineValue = canViewFinancials
    ? pipelineValueFold?.total ??
      leads
        .filter((l) => l.bucket === 'open' || l.bucket === 'potential')
        .reduce((sum, l) => sum + (l.expected_value || 0), 0)
    : 0;

  const globalBucketCounts =
    allBucketCount !== null
      ? {
          all: allBucketCount,
          open: openBucketCount ?? 0,
          potential: potentialBucketCount ?? 0,
          converted: convertedBucketCount ?? 0,
          lost: lostBucketCount ?? 0,
          overdue: overdueBucketCount ?? 0,
        }
      : undefined;

  const telemetryMetrics = {
    totalInquiries,
    activeTriageCount,
    overdueCount,
    totalPipelineValue,
  };

  return (
    <div className={styles.container}>
      {/* Workspace Header & Operational Context */}
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Inbound leads</h1>
        <NewLeadHeaderButton userRole={role} />
      </header>

      {/* React 19 Streaming Suspense Boundary: Zero-CLS Skeleton Fallback */}
      <Suspense fallback={<LeadsTableSkeleton rowCount={8} />}>
        {invalidFilter || leadsRes.error || statusesRes.error ? (
          <div className={styles.loadError} role="alert">
            <span>{invalidFilter ? 'A filter in this link is invalid. Open the leads page without filters to try again.' : leadsRes.error ? `Lead records could not be loaded${leadsRes.error.code ? ` (${leadsRes.error.code})` : ''}.` : `Pipeline stages could not be loaded${statusesRes.error?.code ? ` (${statusesRes.error.code})` : ''}.`}</span>
            <Link href="/admin/leads" className={styles.retryLink}>{invalidFilter ? 'Clear filters' : 'Reload leads'}</Link>
          </div>
        ) : (
          <>
            {search.error && <p className={styles.loadError} role="alert">{search.error}</p>}
            <LeadsWorkspaceClient
              initialLeads={search.error ? [] : leads}
              availableSources={availableSources}
              availableAssignees={availableAssignees}
              availableStatuses={availableStatuses}
              userRole={role}
              telemetryMetrics={telemetryMetrics}
              globalBucketCounts={globalBucketCounts}
              canViewFinancials={canViewFinancials}
              lookupNotice={lookupNotice}
              pagination={!search.error && <ResultPagination
                page={page}
                pageSize={pageSize}
                loadedCount={leads.length}
                totalCount={leadsRes.count}
                scopeDescription="Metrics and bucket counts reflect the full matching workspace."
              />}
            />
          </>
        )}
      </Suspense>
    </div>
  );
}
