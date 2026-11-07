/**
 * @file page.tsx
 * @description Pipeline Deals Workspace (/admin/deals).
 *              Server Component querying active commercial deal opportunities,
 *              deal valuations, commercial stage progression, and representative ownership.
 * @module app/admin/(workspace)/deals/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { ROLE_DEFAULT_TABS, type CrmUserRole } from '@/types/crm';
import { buildCommercialSearchFilter } from '@/app/admin/lib/commercialSearch';
import { LeadsTableSkeleton } from '@/app/admin/components/LeadsTable';
import { ResultPagination } from '@/app/admin/components/LeadsTable/ResultPagination';
import { DealsWorkspaceClient, type HydratedDealItem } from './DealsWorkspaceClient';
import styles from './deals.module.scss';

export const metadata: Metadata = {
  title: 'Pipeline Deals | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminDealsPageProps {
  searchParams?: Promise<{
    id?: string;
    dealId?: string;
    leadId?: string;
    stage?: string;
    assigned_to?: string;
    source?: string;
    priority?: string;
    search?: string;
    q?: string;
    bucket?: string;
    page?: string;
  }>;
}

export default async function AdminDealsPage(
  props: AdminDealsPageProps
): Promise<React.ReactElement> {
  const resolvedSearchParams = props.searchParams ? await props.searchParams : undefined;
  const requestedPage = Number(resolvedSearchParams?.page ?? '1');
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  const pageSize = 100;
  const targetDealId = resolvedSearchParams?.id || resolvedSearchParams?.dealId || resolvedSearchParams?.leadId;
  if (targetDealId) {
    redirect(`/admin/deals/${targetDealId}`);
  }
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login?next=%2Fadmin%2Fdeals');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, allowed_tabs')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.status !== 'active') redirect('/admin/login?error=account_suspended');
  const role = profile.role as CrmUserRole;
  const allowedTabs = profile.allowed_tabs as string[] | undefined;
  const hasDealsAccess = role === 'admin' || (Array.isArray(allowedTabs) && allowedTabs.length > 0
    ? allowedTabs.includes('deals')
    : Boolean(ROLE_DEFAULT_TABS[role]?.deals));

  if (!hasDealsAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const { bucket, stage, assigned_to: assignedTo, source, priority } = resolvedSearchParams ?? {};
  const search = buildCommercialSearchFilter(resolvedSearchParams?.search ?? resolvedSearchParams?.q);
  const invalidFilter = [stage, assignedTo, source].some((value) => value && !uuid.test(value))
    || Boolean(priority && !['high', 'medium', 'low'].includes(priority.toLowerCase()))
    || Boolean(bucket && !['all', 'open', 'potential', 'converted', 'lost'].includes(bucket));

  let dealsQuery = supabase.from('leads').select(`
        id, lead_id, name, company, phone, email, expected_value, priority,
        next_follow_up, revisit_date, created_at, updated_at, assigned_to,
        status_id, lead_source_id, brief_payload,
        funnel_status:funnel_statuses!leads_status_id_fkey!inner(id, name, sort_order, bucket, color_code),
        lead_source:lead_sources!leads_lead_source_id_fkey(id, name)
      `, { count: 'exact' });
  if (!invalidFilter) {
    if (stage) dealsQuery = dealsQuery.eq('status_id', stage);
    if (assignedTo) dealsQuery = dealsQuery.eq('assigned_to', assignedTo);
    if (source) dealsQuery = dealsQuery.eq('lead_source_id', source);
    if (priority) dealsQuery = dealsQuery.ilike('priority', priority);
    if (bucket && bucket !== 'all') dealsQuery = dealsQuery.eq('funnel_status.bucket', bucket);
    if (search.filter) dealsQuery = dealsQuery.or(search.filter);
  }

  const [sourcesRes, statusesRes, profilesRes, dealsRes] = await Promise.all([
    supabase.from('lead_sources').select('id, name').order('name'),
    supabase.from('funnel_statuses').select('id, name, sort_order, bucket, color_code').order('sort_order'),
    supabase.from('crm_team_directory').select('id, full_name').order('full_name'),
    dealsQuery
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1),
  ]);

  if (dealsRes.error) console.error('[deals-workspace] Failed to load deals:', { code: dealsRes.error.code, message: dealsRes.error.message });
  if (statusesRes.error) console.error('[deals-workspace] Failed to load stages:', { code: statusesRes.error.code, message: statusesRes.error.message });
  if (sourcesRes.error) console.error('[deals-workspace] Lead source filters unavailable:', { code: sourcesRes.error.code, message: sourcesRes.error.message });
  if (profilesRes.error) console.error('[deals-workspace] Owner directory unavailable:', { code: profilesRes.error.code, message: profilesRes.error.message });

  const sources = sourcesRes.data || [];
  const statuses = statusesRes.data || [];
  const ownerNameById = new Map((profilesRes.data || []).map((member) => [member.id, member.full_name]));

  // Transform relational leads to typed deal records
  const deals: HydratedDealItem[] = ((dealsRes.data || []) as unknown[]).map((raw) => {
    const item = raw as Record<string, unknown>;
    const statusObj = item.funnel_status as { id: string; name: string; sort_order: number; bucket: string; color_code: string } | null;
    const sourceObj = item.lead_source as { id: string; name: string } | null;

    return {
      id: item.id as string,
      lead_id: (item.lead_id as string) || (item.id as string).substring(0, 8),
      name: (item.name as string) || 'Undisclosed Client',
      company: (item.company as string) || null,
      phone: (item.phone as string) || null,
      email: (item.email as string) || null,
      expected_value: Number(item.expected_value) || 0,
      priority: (item.priority as 'High' | 'Medium' | 'Low') || 'Medium',
      next_follow_up: (item.next_follow_up as string) || null,
      revisit_date: (item.revisit_date as string) || null,
      created_at: (item.created_at as string) || new Date().toISOString(),
      updated_at: (item.updated_at as string) || new Date().toISOString(),
      assigned_to: (item.assigned_to as string) || null,
      status_id: (item.status_id as string) || '',
      lead_source_id: (item.lead_source_id as string) || '',
      assigned_to_name: item.assigned_to
        ? ownerNameById.get(item.assigned_to as string) || (profilesRes.error ? 'Owner unavailable' : 'Inactive or unavailable owner')
        : 'Unassigned',
      status_name: statusObj?.name || 'Open',
      status_bucket: (statusObj?.bucket as 'open' | 'potential' | 'converted' | 'lost') || 'open',
      status_color: statusObj?.color_code || '#1f242f',
      source_name: sourceObj?.name || 'Direct Ingestion',
    };
  });

  return (
    <div className={styles.dealsWorkspace}>
      {/* Dynamic KPI Header Strip */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.eyebrow}>Sales pipeline</div>
          <h1 className={styles.heading}>Deals</h1>
          <p className={styles.subheading}>
            Track opportunities, follow-ups and progress through each stage.
          </p>
        </div>
      </header>

      {/* Main Deals Grid with Filter Controls */}
      <Suspense fallback={<LeadsTableSkeleton />}>
        {invalidFilter || dealsRes.error || statusesRes.error ? (
          <div className={styles.loadError} role="alert">
            <span>{invalidFilter ? 'A filter in this link is invalid. Open the deals page without filters to try again.' : dealsRes.error ? `Deal records could not be loaded${dealsRes.error.code ? ` (${dealsRes.error.code})` : ''}.` : `Pipeline stages could not be loaded${statusesRes.error?.code ? ` (${statusesRes.error.code})` : ''}.`}</span>
            <Link href="/admin/deals" className={styles.retryLink}>Reload deals</Link>
            <span>If the problem continues, contact support and include the error code shown above.</span>
          </div>
        ) : (
          <>
            {(sourcesRes.error || profilesRes.error) && <div className={styles.loadWarning} role="status">Deal records are available, but {sourcesRes.error && profilesRes.error ? 'source filters and owner names' : sourcesRes.error ? 'source filters' : 'owner names'} could not be loaded. Refresh to retry those details.</div>}
            {search.error ? <div className={styles.loadError} role="alert">{search.error}</div> : <ResultPagination page={page} pageSize={pageSize} loadedCount={deals.length} totalCount={dealsRes.count} />}
            <DealsWorkspaceClient initialDeals={search.error ? [] : deals} sources={sources} statuses={statuses} userRole={role} />
          </>
        )}
      </Suspense>
    </div>
  );
}
