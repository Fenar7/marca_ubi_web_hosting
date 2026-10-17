/**
 * @file page.tsx
 * @description Commercial Deals & Pipeline Workspace (/admin/leads).
 *              Server Component querying active client engagements, funnel stages,
 *              deal valuations, and representative assignments.
 * @module app/admin/(workspace)/leads/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/app/lib/supabase/server';
import type { FunnelBucket } from '@/types/crm';
import { LeadsWorkspaceClient, type HydratedLeadItem } from './LeadsWorkspaceClient';
import styles from './leads.module.scss';

export const metadata: Metadata = {
  title: 'Pipeline Deals & Ingested Leads | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLeadsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();

  const { data: rawLeads } = await supabase
    .from('leads')
    .select(`
      id,
      lead_id,
      name,
      company,
      phone,
      email,
      preferred_channel,
      service_category,
      expected_value,
      priority,
      status_id,
      next_follow_up,
      created_at,
      funnel_statuses!inner(name, bucket, color_code),
      profiles!leads_assigned_to_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  const leads: HydratedLeadItem[] = (rawLeads || []).map((l) => {
    const statusData = l.funnel_statuses as {
      name?: string;
      bucket?: FunnelBucket;
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
          <h1 className={styles.pageTitle}>Pipeline Deals & Ingested Leads</h1>
          <p className={styles.pageSubtitle}>
            Full commercial inventory, stage progression, deal valuations, and account ownership.
          </p>
        </div>
      </header>

      <LeadsWorkspaceClient initialLeads={leads} />
    </div>
  );
}
