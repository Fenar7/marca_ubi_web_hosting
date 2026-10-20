/**
 * @file page.tsx
 * @description Pipeline Deals Workspace (/admin/deals).
 *              Server Component querying active commercial deal opportunities,
 *              deal valuations, commercial stage progression, and representative ownership.
 * @module app/admin/(workspace)/deals/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import type { CrmUserRole, PipelineRpcMetrics } from '@/types/crm';
import { KpiRibbon } from '@/app/admin/components/kpi';
import { LeadsTableSkeleton } from '@/app/admin/components/LeadsTable';
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
    stage?: string;
    assigned_to?: string;
    source?: string;
    priority?: string;
    search?: string;
  }>;
}

export default async function AdminDealsPage(
  props: AdminDealsPageProps
): Promise<React.ReactElement> {
  await (props.searchParams ? props.searchParams : Promise.resolve(undefined));
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

  const role = (profile?.role as CrmUserRole) || 'viewer';
  const allowedTabs = profile?.allowed_tabs as string[] | undefined;

  const hasDealsAccess = Array.isArray(allowedTabs)
    ? allowedTabs.includes('deals')
    : true;

  if (!hasDealsAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  // Parallel server query execution for instant pipeline rendering
  const [rpcRes, sourcesRes, profilesRes, statusesRes, dealsRes] = await Promise.all([
    supabase.rpc('get_pipeline_kpis'),
    supabase.from('lead_sources').select('id, name').order('name'),
    supabase.from('profiles').select('id, full_name, email, role, status').order('full_name'),
    supabase.from('funnel_statuses').select('id, name, sort_order, bucket, color_code').order('sort_order'),
    supabase
      .from('leads')
      .select(`
        id,
        lead_id,
        name,
        company,
        phone,
        email,
        expected_value,
        priority,
        next_follow_up,
        revisit_date,
        created_at,
        updated_at,
        assigned_to,
        status_id,
        lead_source_id,
        brief_payload,
        assigned_profile:profiles!leads_assigned_to_fkey (
          id,
          full_name,
          email,
          role
        ),
        funnel_status:funnel_statuses!leads_status_id_fkey (
          id,
          name,
          sort_order,
          bucket,
          color_code
        ),
        lead_source:lead_sources!leads_lead_source_id_fkey (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const rawKpi = rpcRes.data as PipelineRpcMetrics | null;
  const initialKpis: PipelineRpcMetrics = rawKpi || {
    total_leads_count: 0,
    open_leads_count: 0,
    potential_leads_count: 0,
    potential_pipeline_value: 0,
    stage_weighted_pipeline_value: 0,
    converted_leads_count: 0,
    converted_revenue_value: 0,
    lost_leads_count: 0,
    overdue_follow_ups_count: 0,
    conversion_rate_percentage: 0,
  };

  const sources = sourcesRes.data || [];
  const profiles = (profilesRes.data || []).filter((p) => p.status === 'active');
  const statuses = statusesRes.data || [];

  // Transform relational leads to typed deal records
  const deals: HydratedDealItem[] = ((dealsRes.data || []) as unknown[]).map((raw) => {
    const item = raw as Record<string, unknown>;
    const statusObj = item.funnel_status as { id: string; name: string; sort_order: number; bucket: string; color_code: string } | null;
    const profileObj = item.assigned_profile as { id: string; full_name: string; email: string } | null;
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
      assigned_to_name: profileObj?.full_name || 'Unassigned',
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
          <div className={styles.eyebrow}>Stage 02: Pipeline Negotiations</div>
          <h1 className={styles.heading}>Commercial Deals.</h1>
          <p className={styles.subheading}>
            Active commercial negotiations, proposal development, and high-ticket engagement staging.
          </p>
        </div>
      </header>

      <section className={styles.kpiContainer} aria-label="Pipeline Metrics">
        <KpiRibbon initialData={initialKpis} />
      </section>

      {/* Main Deals Grid with Filter Controls */}
      <Suspense fallback={<LeadsTableSkeleton />}>
        <DealsWorkspaceClient
          initialDeals={deals}
          sources={sources}
          profiles={profiles}
          statuses={statuses}
          userRole={role}
        />
      </Suspense>
    </div>
  );
}
