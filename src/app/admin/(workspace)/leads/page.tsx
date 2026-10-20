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
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import type { CrmUserRole, FunnelBucket, PipelineRpcMetrics } from '@/types/crm';
import { MinimalistStatPods } from '@/app/admin/components/Dashboard';
import { LeadsTableSkeleton, type InlineStatusOption } from '@/app/admin/components/LeadsTable';
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
    stage?: string;
    assigned_to?: string;
    bucket?: string;
    leadId?: string;
    source?: string;
    priority?: string;
    search?: string;
  }>;
}

export default async function AdminLeadsPage(
  props: AdminLeadsPageProps
): Promise<React.ReactElement> {
  // Await Next.js 16 dynamic search parameters
  await (props.searchParams ? props.searchParams : Promise.resolve(undefined));
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

  if (profile?.status === 'suspended') {
    redirect('/admin/login?error=account_suspended');
  }

  const role = (profile?.role as CrmUserRole) || 'viewer';
  const allowedTabs = profile?.allowed_tabs as string[] | undefined;

  const hasLeadsAccess = Array.isArray(allowedTabs)
    ? allowedTabs.includes('leads')
    : true;

  if (!hasLeadsAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  // Parallel server query execution for instant shell rendering and metadata resolution
  const [rpcRes, sourcesRes, profilesRes, statusesRes, leadsRes] = await Promise.all([
    supabase.rpc('get_pipeline_kpis'),
    supabase
      .from('lead_sources')
      .select('id, name, color_code')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('status', 'active')
      .order('full_name'),
    supabase
      .from('funnel_statuses')
      .select('id, name, bucket, color_code, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('leads')
      .select(`
        id,
        lead_id,
        name,
        company,
        company_website,
        industry,
        phone,
        email,
        preferred_channel,
        service_category,
        expected_value,
        priority,
        status_id,
        assigned_to,
        lead_source_id,
        notes,
        brief_payload,
        next_follow_up,
        revisit_date,
        created_at,
        updated_at,
        funnel_statuses!inner(id, name, bucket, color_code, sort_order),
        lead_sources(id, name, color_code),
        profiles!leads_assigned_to_fkey(id, full_name, role)
      `)
      .order('created_at', { ascending: false }),
  ]);

  const rpcMetrics = rpcRes.data ? (rpcRes.data as unknown as PipelineRpcMetrics) : null;

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

  // Hydrate client model with relational properties
  const leads: HydratedLeadItem[] = (leadsRes.data || []).map((l) => {
    const statusData = l.funnel_statuses as {
      id?: string;
      name?: string;
      bucket?: FunnelBucket;
      color_code?: string;
      sort_order?: number;
    } | null;

    const sourceData = l.lead_sources as {
      id?: string;
      name?: string;
      color_code?: string;
    } | null;

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
      assigned_to_name:
        (l.profiles as { full_name?: string } | null)?.full_name || 'Unassigned',
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
          <span className={styles.eyebrow}>Stage 01: Inbound Discovery</span>
          <h1 className={styles.pageTitle}>Inbound Leads.</h1>
          <p className={styles.pageSubtitle}>
            Triage incoming briefs, evaluate client scope, and advance qualified opportunities to negotiation.
          </p>
        </div>
        <div className={styles.headerRight}>
          <NewLeadHeaderButton userRole={role} />
        </div>
      </header>

      {/* Dark Luxury Executive KPI Ribbon with Reactive URL Filter Recalculation */}
      <MinimalistStatPods metrics={rpcMetrics} />

      {/* React 19 Streaming Suspense Boundary: Zero-CLS Skeleton Fallback */}
      <Suspense fallback={<LeadsTableSkeleton rowCount={8} />}>
        <LeadsWorkspaceClient
          initialLeads={leads}
          availableSources={availableSources}
          availableAssignees={availableAssignees}
          availableStatuses={availableStatuses}
          userRole={role}
        />
      </Suspense>
    </div>
  );
}
