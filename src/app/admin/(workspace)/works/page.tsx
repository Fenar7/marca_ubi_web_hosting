/**
 * @file page.tsx
 * @description Client Works & Post-Conversion Project Tracking Workspace (/admin/works).
 *              Queries active client project deliverables, milestone completion checklists,
 *              production stages, operational health metrics, and director assignments.
 * @module app/admin/(workspace)/works/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import {
  type ClientWorkItem,
  type CrmUserRole,
  ROLE_DEFAULT_TABS,
} from '@/types/crm';
import {
  getCrmDirectoryList,
  getCrmDirectoryMap,
} from '@/app/admin/lib/crmDirectory';
import { WorksWorkspaceClient } from './WorksWorkspaceClient';
import styles from './works.module.scss';

export const metadata: Metadata = {
  title: 'Client Works & Deliverables | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminWorksPageProps {
  searchParams: Promise<{ sample?: string | string[] }>;
}

/** Sample mode is authenticated, development-only and read-only. Real projects keep their existing access checks. */
export default async function AdminWorksPage({
  searchParams,
}: AdminWorksPageProps): Promise<React.ReactElement> {
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

  const hasWorksAccess =
    role === 'admin' ||
    (Array.isArray(allowedTabs) && allowedTabs.length > 0
      ? allowedTabs.includes('works')
      : Boolean(ROLE_DEFAULT_TABS[role]?.works));

  if (!hasWorksAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  const canOpenDeals =
    role === 'admin' ||
    (Array.isArray(allowedTabs) && allowedTabs.length > 0
      ? allowedTabs.includes('deals')
      : Boolean(ROLE_DEFAULT_TABS[role]?.deals));
  const sampleAvailable =
    process.env.NODE_ENV === 'development' && role === 'admin';
  const samplePreference = sampleAvailable
    ? (await searchParams).sample
    : undefined;
  const renderHeader = (showPreviewLink: boolean) => (
    <header className={styles.header}>
      <div>
        <h1 className={styles.heading}>Client works</h1>
        <p className={styles.subheading}>
          Track delivery stages, milestones, and project owners.
        </p>
      </div>
      {showPreviewLink && (
        <Link className={styles.sampleLink} href="/admin/works?sample=1">
          View sample projects
        </Link>
      )}
    </header>
  );

  /** Keep samples detached from the live query and all project mutations. */
  async function renderSamplePortfolio() {
    const { createSampleClientWorks } = await import('./worksSample');
    return (
      <div className={styles.worksWorkspace}>
        {renderHeader(false)}
        <WorksWorkspaceClient
          key="sample"
          initialWorks={createSampleClientWorks()}
          sample
        />
      </div>
    );
  }
  if (samplePreference === '1') return renderSamplePortfolio();

  // Query active client works with decoupled directory resolution
  const {
    data: rawWorks,
    error: queryError,
    count,
  } = await supabase
    .from('client_works')
    .select(
      `
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
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });

  const error =
    queryError ??
    (rawWorks === null ? new Error('Missing client works payload') : null);
  if (error) {
    console.error(
      '[AdminWorksPage] Failed to fetch client works:',
      error.message,
    );
    return (
      <div className={styles.worksWorkspace}>
        {renderHeader(sampleAvailable)}
        <div className={styles.dataError} role="alert">
          <span>Projects could not be loaded.</span>
          <form action="/admin/works">
            <button type="submit">Retry</button>
          </form>
        </div>
      </div>
    );
  }

  // Only a successful empty development query defaults to the sample portfolio.
  if (sampleAvailable && samplePreference !== '0' && rawWorks?.length === 0) {
    return renderSamplePortfolio();
  }

  // Decoupled resolution of creative and technical director names
  const directorIds = [
    ...new Set(
      (
        (rawWorks || []) as Array<{
          creative_lead_id?: string | null;
          tech_lead_id?: string | null;
        }>
      ).flatMap((item) => [
        ...(item.creative_lead_id ? [item.creative_lead_id] : []),
        ...(item.tech_lead_id ? [item.tech_lead_id] : []),
      ]),
    ),
  ];
  const mayAssignDirectors = role === 'admin' || role === 'sales_manager';
  const [directorNameById, teamProfiles] = await Promise.all([
    getCrmDirectoryMap(supabase, directorIds),
    mayAssignDirectors ? getCrmDirectoryList(supabase) : Promise.resolve([]),
  ]);

  const clientWorks: ClientWorkItem[] = ((rawWorks || []) as unknown[]).map(
    (raw) => {
      const item = raw as Record<string, unknown>;
      const creativeLeadId = (item.creative_lead_id as string) || null;
      const techLeadId = (item.tech_lead_id as string) || null;

      return {
        id: item.id as string,
        project_code: item.project_code as string,
        lead_id: item.lead_id as string,
        client_name: item.client_name as string,
        company: (item.company as string) || null,
        service_scope:
          typeof item.service_scope === 'string' && item.service_scope.trim()
            ? item.service_scope
            : 'Not recorded',
        contract_value: Number(item.contract_value) || 0,
        delivery_stage:
          (item.delivery_stage as ClientWorkItem['delivery_stage']) ||
          'kickoff',
        health_status:
          (item.health_status as ClientWorkItem['health_status']) || 'on_track',
        creative_lead_id: creativeLeadId,
        tech_lead_id: techLeadId,
        milestones: Array.isArray(item.milestones)
          ? (item.milestones as ClientWorkItem['milestones'])
          : [],
        target_delivery_date: (item.target_delivery_date as string) || null,
        kickoff_date: (item.kickoff_date as string) || '',
        created_at: (item.created_at as string) || '',
        updated_at: (item.updated_at as string) || '',
        creative_lead:
          creativeLeadId && directorNameById.has(creativeLeadId)
            ? { full_name: directorNameById.get(creativeLeadId)! }
            : null,
        tech_lead:
          techLeadId && directorNameById.has(techLeadId)
            ? { full_name: directorNameById.get(techLeadId)! }
            : null,
      };
    },
  );

  const directoryAvailable = teamProfiles.length > 0;

  return (
    <div className={styles.worksWorkspace}>
      {renderHeader(sampleAvailable)}

      {count !== null && count > clientWorks.length && (
        <p className={styles.scopeNote}>
          Showing {clientWorks.length} of {count} projects. The remaining
          projects are not loaded.
        </p>
      )}
      {mayAssignDirectors && clientWorks.length > 0 && !directoryAvailable && (
        <p className={styles.scopeNote} role="status">
          No directors are available to assign.
        </p>
      )}

      {/* Main Works Workspace Client */}
      <WorksWorkspaceClient
        key="live"
        initialWorks={clientWorks}
        userRole={role}
        userId={user.id}
        canOpenDeals={canOpenDeals}
        profiles={teamProfiles}
        directoryAvailable={directoryAvailable}
      />
    </div>
  );
}
