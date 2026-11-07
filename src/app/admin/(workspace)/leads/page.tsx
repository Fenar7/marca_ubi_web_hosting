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
    .select('role, status, allowed_tabs')
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

  let leadsQuery = supabase.from('leads').select(`
        id, lead_id, name, company, company_website, industry, phone, email,
        preferred_channel, service_category, expected_value, priority, status_id,
        assigned_to, lead_source_id, notes, brief_payload, next_follow_up,
        revisit_date, created_at, updated_at,
        funnel_statuses!inner(id, name, bucket, color_code, sort_order)
      `, { count: 'exact' });
  if (!invalidFilter) {
    if (stage) leadsQuery = leadsQuery.eq('status_id', stage);
    if (assignedTo) leadsQuery = leadsQuery.eq('assigned_to', assignedTo);
    if (source) leadsQuery = leadsQuery.eq('lead_source_id', source);
    if (priority) leadsQuery = leadsQuery.ilike('priority', priority);
    if (bucket && !['all', 'overdue'].includes(bucket)) leadsQuery = leadsQuery.eq('funnel_statuses.bucket', bucket);
    if (search.filter) leadsQuery = leadsQuery.or(search.filter);
  }

  const [sourcesRes, profilesRes, statusesRes, leadsRes] = await Promise.all([
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
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1),
  ]);

  if (leadsRes.error) console.error('[leads-workspace] Failed to load leads:', { code: leadsRes.error.code, message: leadsRes.error.message });
  if (statusesRes.error) console.error('[leads-workspace] Failed to load stages:', { code: statusesRes.error.code, message: statusesRes.error.message });
  if (sourcesRes.error) console.error('[leads-workspace] Lead source filters unavailable:', { code: sourcesRes.error.code, message: sourcesRes.error.message });
  if (profilesRes.error) console.error('[leads-workspace] Owner directory unavailable:', { code: profilesRes.error.code, message: profilesRes.error.message });

  // Transform lookup catalog options for filter dropdown menus
  const availableSources: FilterDropdownOption[] = (sourcesRes.data || []).map((s) => ({
    id: s.id,
    label: s.name,
    colorCode: s.color_code,
  }));

  const availableAssignees: FilterDropdownOption[] = (profilesRes.data || []).map((p) => {
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
    color_code: s.color_code || '#1f242f',
    sort_order: s.sort_order,
  }));

  const ownerNameById = new Map((profilesRes.data || []).map((member) => [member.id, member.full_name]));
  const sourceById = new Map((sourcesRes.data || []).map((source) => [source.id, source]));

  // Hydrate client model with relational properties
  const leads: HydratedLeadItem[] = (leadsRes.data || []).map((l) => {
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
      expected_value: Number(l.expected_value) || 0,
      priority: l.priority || 'Medium',
      status_id: l.status_id,
      status_name: statusData?.name || 'Active Deal',
      status_color: statusData?.color_code || '#1f242f',
      bucket: statusData?.bucket || 'open',
      assigned_to: l.assigned_to,
      assigned_to_name: l.assigned_to
        ? ownerNameById.get(l.assigned_to) || (profilesRes.error ? 'Owner unavailable' : 'Inactive or unavailable owner')
        : 'Unassigned',
      lead_source_id: l.lead_source_id,
      lead_source_name: sourceData?.name || null,
      lead_source_color: sourceData?.color_code || null,
      next_follow_up: l.next_follow_up,
      revisit_date: l.revisit_date,
      created_at: l.created_at,
    };
  });

  return (
    <div className={styles.container}>
      {/* Workspace Header & Operational Context */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Sales pipeline</span>
          <h1 className={styles.pageTitle}>Inbound leads</h1>
          <p className={styles.pageSubtitle}>
            Review inquiries, assign owners and keep follow-ups moving.
          </p>
        </div>
        <div className={styles.headerRight}>
          <NewLeadHeaderButton userRole={role} />
        </div>
      </header>

      {/* React 19 Streaming Suspense Boundary: Zero-CLS Skeleton Fallback */}
      <Suspense fallback={<LeadsTableSkeleton rowCount={8} />}>
        {invalidFilter || leadsRes.error || statusesRes.error ? (
          <div className={styles.loadError} role="alert">
            <span>{invalidFilter ? 'A filter in this link is invalid. Open the leads page without filters to try again.' : leadsRes.error ? `Lead records could not be loaded${leadsRes.error.code ? ` (${leadsRes.error.code})` : ''}.` : `Pipeline stages could not be loaded${statusesRes.error?.code ? ` (${statusesRes.error.code})` : ''}.`}</span>
            <Link href="/admin/leads" className={styles.retryLink}>Reload leads</Link>
            <span>If the problem continues, contact support and include the error code shown above.</span>
          </div>
        ) : (
          <>
            {(sourcesRes.error || profilesRes.error) && <div className={styles.loadWarning} role="status">Lead records are available, but {sourcesRes.error && profilesRes.error ? 'source filters and owner names' : sourcesRes.error ? 'source filters' : 'owner names'} could not be loaded. Refresh to retry those details.</div>}
            {search.error ? <div className={styles.loadError} role="alert">{search.error}</div> : <ResultPagination page={page} pageSize={pageSize} loadedCount={leads.length} totalCount={leadsRes.count} />}
            <LeadsWorkspaceClient initialLeads={search.error ? [] : leads} availableSources={availableSources} availableAssignees={availableAssignees} availableStatuses={availableStatuses} userRole={role} />
          </>
        )}
      </Suspense>
    </div>
  );
}
