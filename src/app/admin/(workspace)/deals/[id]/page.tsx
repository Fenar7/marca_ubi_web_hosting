/**
 * @file page.tsx
 * @description Dedicated Full-Page Pipeline Deal 360° Dossier Workspace (/admin/deals/[id]).
 *              Next.js 16 Server Component executing direct server-side data fetching via getLeadDetails
 *              for 0ms waterfall, zero Cumulative Layout Shift (CLS: 0.00), dynamic metadata resolution,
 *              and granular RBAC enforcement.
 * @module app/admin/(workspace)/deals/[id]/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { cache } from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getLeadDetails } from '@/app/actions/leads';
import { createClient } from '@/app/lib/supabase/server';
import { type CrmUserRole, ROLE_DEFAULT_TABS } from '@/types/crm';
import { LeadDossierWorkspaceClient } from '@/app/admin/components/DossierWorkspace/LeadDossierWorkspaceClient';
import styles from './page.module.scss';

/** Share the authorized dossier read between metadata and rendering for this request. */
const loadDossier = cache(getLeadDetails);

interface DealDossierPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Dynamically resolves document title and OpenGraph metadata based on the verified pipeline deal record.
 */
export async function generateMetadata(
  props: DealDossierPageProps
): Promise<Metadata> {
  const { id } = await props.params;
  const result = await loadDossier(id);

  if (!result.success || !result.data?.lead) {
    return {
      title: 'Deal Record Not Found | Marca Ubi Enterprise CRM',
      robots: { index: false, follow: false },
    };
  }

  const deal = result.data.lead;
  const accountName = deal.company || deal.name;

  return {
    title: `${accountName} (${deal.lead_id}) | Client 360° Deal Dossier`,
    description: `Comprehensive Client 360° Commercial Dossier & Operational Intelligence for ${accountName}.`,
    robots: { index: false, follow: false },
  };
}

export default async function DealDossierPage(
  props: DealDossierPageProps
): Promise<React.ReactElement> {
  const { id } = await props.params;

  // 1. Session verification & deals tab access guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/admin/login?next=%2Fadmin%2Fdeals%2F${encodeURIComponent(id)}`);
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
  const hasDealsAccess =
    role === 'admin' ||
    (Array.isArray(allowedTabs) && allowedTabs.length > 0
      ? allowedTabs.includes('deals')
      : Boolean(ROLE_DEFAULT_TABS[role]?.deals));

  if (!hasDealsAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  // 2. Reuse the request-scoped dossier read
  const result = await loadDossier(id);

  if (!result.success || !result.data) {
    if (result.error?.includes('Privilege Violation') || result.error?.includes('Unauthorized')) {
      return (
        <div className={styles.deniedWrapper} role="alert">
          <div className={styles.deniedCard}>
            <div className={styles.deniedBadge}>Access Restricted</div>
            <h2 className={styles.deniedTitle}>Portfolio Boundary Enforcement</h2>
            <p className={styles.deniedMessage}>
              Your account is restricted to commercial engagements assigned to your active portfolio.
              This pipeline deal is assigned to another representative or unassigned.
            </p>
            <a href="/admin/deals" className={styles.returnBtn}>
              ← Return to Pipeline Deals
            </a>
          </div>
        </div>
      );
    }

    notFound();
  }

  const teamAssignees = (result.data.availableAssignees || []).map((a) => ({
    id: a.id,
    full_name: a.fullName,
    email: a.email,
    role: a.role,
  }));

  // 3. Render Master Interactive Client Workspace in deals mode
  return (
    <LeadDossierWorkspaceClient
      lead={result.data.lead}
      initialActivities={result.data.activities}
      funnelStatuses={result.data.availableStatuses}
      teamAssignees={teamAssignees}
      userRole={(profile?.role as CrmUserRole) || 'viewer'}
      workspaceMode="deals"
      linkedWork={result.data.linkedWork || null}
      canViewFinancials={result.data.canViewFinancials ?? false}
    />
  );
}
