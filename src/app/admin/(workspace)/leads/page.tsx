/**
 * @file page.tsx
 * @description Commercial Deals & Inquiries Workspace (/admin/leads).
 *              Server Component querying active client engagements, funnel stages,
 *              deal valuations, and representative assignments with deep-link search filters.
 * @module app/admin/(workspace)/leads/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/app/lib/supabase/server';
import type { FunnelBucket, PipelineRpcMetrics } from '@/types/crm';
import { KpiRibbon } from '@/app/admin/components/kpi';
import { LeadsWorkspaceClient, type HydratedLeadItem } from './LeadsWorkspaceClient';
import styles from './leads.module.scss';

export const metadata: Metadata = {
  title: 'Deals & Inquiries | Marca Ubi Enterprise CRM',
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
  }>;
}

export default async function AdminLeadsPage(
  props: AdminLeadsPageProps
): Promise<React.ReactElement> {
  const resolvedParams = props.searchParams ? await props.searchParams : undefined;
  const supabase = await createClient();

  // Fetch initial Pipeline RPC Metrics for the KPI Ribbon
  const { data: rpcData } = await supabase.rpc('get_pipeline_kpis');
  const rpcMetrics = rpcData ? (rpcData as unknown as PipelineRpcMetrics) : null;

  let query = supabase
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
      created_at,
      updated_at,
      funnel_statuses!inner(id, name, bucket, color_code, sort_order),
      lead_sources!inner(id, name, color_code),
      profiles!leads_assigned_to_fkey(id, full_name, role)
    `);

  if (resolvedParams?.stage && resolvedParams.stage.trim().length > 0) {
    query = query.eq('status_id', resolvedParams.stage.trim());
  }

  if (resolvedParams?.assigned_to && resolvedParams.assigned_to.trim().length > 0) {
    query = query.eq('assigned_to', resolvedParams.assigned_to.trim());
  }

  if (resolvedParams?.bucket && resolvedParams.bucket.trim().length > 0 && resolvedParams.bucket !== 'all') {
    query = query.eq('funnel_statuses.bucket', resolvedParams.bucket.trim());
  }

  query = query.order('created_at', { ascending: false });

  const { data: rawLeads } = await query;

  const leads: HydratedLeadItem[] = (rawLeads || []).map((l) => {
    const statusData = l.funnel_statuses as {
      id?: string;
      name?: string;
      bucket?: FunnelBucket;
      color_code?: string;
      sort_order?: number;
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
      status_color: statusData?.color_code || '#ff6100',
      bucket: statusData?.bucket || 'open',
      assigned_to_name:
        (l.profiles as { full_name?: string } | null)?.full_name || 'Unassigned',
      next_follow_up: l.next_follow_up,
      created_at: l.created_at,
    };
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Commercial Pipeline & Staging</span>
          <h1 className={styles.pageTitle}>Deals & Inquiries</h1>
          <p className={styles.pageSubtitle}>
            Track incoming inquiries, negotiate high-ticket proposals, and manage deal progression.
          </p>
        </div>
      </header>

      {/* Dark Luxury Executive KPI Ribbon with Reactive Filter Recalculation */}
      <KpiRibbon initialData={rpcMetrics} syncWithUrlParams={true} />

      <LeadsWorkspaceClient initialLeads={leads} />
    </div>
  );
}
