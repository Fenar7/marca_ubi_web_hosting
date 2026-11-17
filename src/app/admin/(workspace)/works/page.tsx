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
import { getCrmDirectoryList, getCrmDirectoryMap } from '@/app/admin/lib/crmDirectory';
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

  if (!profile || profile.status !== 'active') {
    redirect('/admin/login?error=account_suspended');
  }

  const role = profile.role as CrmUserRole;
  const allowedTabs = profile.allowed_tabs as string[] | undefined;

  const hasWorksAccess = role === 'admin' || (Array.isArray(allowedTabs) && allowedTabs.length > 0
    ? allowedTabs.includes('works')
    : Boolean(ROLE_DEFAULT_TABS[role]?.works));

  if (!hasWorksAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  // Query active client works with decoupled directory resolution
  const { data: rawWorks, error, count } = await supabase
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
      updated_at
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AdminWorksPage] Failed to fetch client works:', error);
    return (
      <div className={styles.worksWorkspace}>
        <header className={styles.header}><div className={styles.titleArea}>
          <div className={styles.eyebrow}>Client delivery</div>
          <h1 className={styles.heading}>Client works</h1>
        </div></header>
        <p className={styles.dataError} role="alert">Projects could not be loaded. Refresh the page to try again.</p>
      </div>
    );
  }

  // Decoupled resolution of creative and technical director names
  const directorIds = [
    ...new Set(
      ((rawWorks || []) as Array<{ creative_lead_id?: string | null; tech_lead_id?: string | null }>).flatMap((item) => [
        ...(item.creative_lead_id ? [item.creative_lead_id] : []),
        ...(item.tech_lead_id ? [item.tech_lead_id] : []),
      ])
    ),
  ];
  const directorNameById = await getCrmDirectoryMap(supabase, directorIds);

  const clientWorks: ClientWorkItem[] = ((rawWorks || []) as unknown[]).map((raw) => {
    const item = raw as Record<string, unknown>;
    const creativeLeadId = (item.creative_lead_id as string) || null;
    const techLeadId = (item.tech_lead_id as string) || null;

    return {
      id: item.id as string,
      project_code: item.project_code as string,
      lead_id: item.lead_id as string,
      client_name: item.client_name as string,
      company: (item.company as string) || null,
      service_scope: typeof item.service_scope === 'string' && item.service_scope.trim() ? item.service_scope : 'Not recorded',
      contract_value: Number(item.contract_value) || 0,
      delivery_stage: (item.delivery_stage as ClientWorkItem['delivery_stage']) || 'kickoff',
      health_status: (item.health_status as ClientWorkItem['health_status']) || 'on_track',
      creative_lead_id: creativeLeadId,
      tech_lead_id: techLeadId,
      milestones: (item.milestones as ClientWorkItem['milestones']) || [],
      target_delivery_date: (item.target_delivery_date as string) || null,
      kickoff_date: (item.kickoff_date as string) || '',
      created_at: (item.created_at as string) || '',
      updated_at: (item.updated_at as string) || '',
      creative_lead: creativeLeadId && directorNameById.has(creativeLeadId)
        ? { full_name: directorNameById.get(creativeLeadId)! }
        : null,
      tech_lead: techLeadId && directorNameById.has(techLeadId)
        ? { full_name: directorNameById.get(techLeadId)! }
        : null,
    };
  });

  // Query active team personnel with automatic fallback for directorial governance
  const teamProfiles = await getCrmDirectoryList(supabase);
  const directoryAvailable = teamProfiles.length > 0;

  return (
    <div className={styles.worksWorkspace}>
      {/* Workspace Header Strip */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.eyebrow}>Client delivery</div>
          <h1 className={styles.heading}>Client works</h1>
          <p className={styles.subheading}>
            Track projects, milestones, and the people responsible for delivery.
          </p>
        </div>
      </header>

      {count !== null && count > clientWorks.length && <p className={styles.scopeNote}>Showing {clientWorks.length} of {count} projects. The remaining projects are not loaded.</p>}
      {!directoryAvailable && <p className={styles.dataError} role="alert">The team directory could not be loaded. Director assignment is unavailable; refresh to try again.</p>}

      {/* Main Works Workspace Client */}
      <WorksWorkspaceClient
        initialWorks={clientWorks}
        userRole={role}
        profiles={teamProfiles}
        directoryAvailable={directoryAvailable}
      />
    </div>
  );
}
