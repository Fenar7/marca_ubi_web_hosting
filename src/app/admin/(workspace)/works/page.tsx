/**
 * @file page.tsx
 * @description Client Works & Post-Conversion Project Tracking Workspace (/admin/works).
 *              Queries active client project deliverables, milestone completion checklists,
 *              production stages, operational health metrics, and director assignments.
 * @module app/admin/(workspace)/works/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { type ClientWorkItem, type CrmUserRole, ROLE_DEFAULT_TABS } from '@/types/crm';
import { WorksWorkspaceClient } from './WorksWorkspaceClient';
import styles from './works.module.scss';

export const metadata: Metadata = {
  title: 'Client Works & Deliverables | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminWorksPage(): Promise<React.ReactElement> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login?next=%2Fadmin%2Fworks');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, allowed_tabs')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.status !== 'active') {
    redirect('/admin/login?error=account_suspended');
  }

  const role = (profile?.role as CrmUserRole) || 'viewer';
  const allowedTabs = profile?.allowed_tabs as string[] | undefined;

  const hasWorksAccess = Array.isArray(allowedTabs)
    ? allowedTabs.includes('works')
    : ROLE_DEFAULT_TABS[role]?.works ?? false;

  if (!hasWorksAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  // Query active client works with relational joins to lead directors
  const { data: rawWorks, error } = await supabase
    .from('client_works')
    .select(`
      id,
      project_code,
      lead_id,
      client_name,
      company,
      service_scope,
      contract_value,
      delivery_stage,
      health_status,
      creative_lead_id,
      tech_lead_id,
      milestones,
      target_delivery_date,
      kickoff_date,
      created_at,
      updated_at,
      creative_lead:profiles!client_works_creative_lead_id_fkey (
        id,
        full_name,
        email
      ),
      tech_lead:profiles!client_works_tech_lead_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AdminWorksPage] Failed to fetch client works:', error);
  }

  const clientWorks: ClientWorkItem[] = ((rawWorks || []) as unknown[]).map((raw) => {
    const item = raw as Record<string, unknown>;
    const creativeLeadObj = item.creative_lead as { full_name: string } | null;
    const techLeadObj = item.tech_lead as { full_name: string } | null;

    return {
      id: item.id as string,
      project_code: item.project_code as string,
      lead_id: item.lead_id as string,
      client_name: item.client_name as string,
      company: (item.company as string) || null,
      service_scope: (item.service_scope as string) || 'Digital Infrastructure',
      contract_value: Number(item.contract_value) || 0,
      delivery_stage: (item.delivery_stage as ClientWorkItem['delivery_stage']) || 'kickoff',
      health_status: (item.health_status as ClientWorkItem['health_status']) || 'on_track',
      creative_lead_id: (item.creative_lead_id as string) || null,
      tech_lead_id: (item.tech_lead_id as string) || null,
      milestones: (item.milestones as ClientWorkItem['milestones']) || [],
      target_delivery_date: (item.target_delivery_date as string) || null,
      kickoff_date: (item.kickoff_date as string) || new Date().toISOString(),
      created_at: (item.created_at as string) || new Date().toISOString(),
      updated_at: (item.updated_at as string) || new Date().toISOString(),
      creative_lead: creativeLeadObj ? { full_name: creativeLeadObj.full_name } : null,
      tech_lead: techLeadObj ? { full_name: techLeadObj.full_name } : null,
    };
  });

  // Query active team personnel for directorial assignment governance
  const { data: teamProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('status', 'active')
    .order('full_name', { ascending: true });

  return (
    <div className={styles.worksWorkspace}>
      {/* Workspace Header Strip */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.eyebrow}>Client Deliverables</div>
          <h1 className={styles.heading}>Client Deliverables.</h1>
          <p className={styles.subheading}>
            Tracking active post-conversion deliverables, milestone progress, and engineering health.
          </p>
        </div>
      </header>

      {/* Main Works Workspace Client */}
      <WorksWorkspaceClient
        initialWorks={clientWorks}
        userRole={role}
        profiles={teamProfiles || []}
      />
    </div>
  );
}
