/**
 * @file page.tsx
 * @description Dedicated Full-Page Inbound Lead 360° Dossier Workspace (/admin/leads/[id]).
 *              Next.js 16 Server Component executing direct server-side data fetching via getLeadDetails
 *              for 0ms waterfall, zero Cumulative Layout Shift (CLS: 0.00), dynamic metadata resolution,
 *              and granular RBAC enforcement.
 * @module app/admin/(workspace)/leads/[id]/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getLeadDetails } from '@/app/actions/leads';
import { createClient } from '@/app/lib/supabase/server';
import type { CrmUserRole } from '@/types/crm';
import { LeadDossierWorkspaceClient } from '@/app/admin/components/DossierWorkspace';
import styles from './page.module.scss';

interface LeadDossierPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Dynamically resolves document title and OpenGraph metadata based on the verified deal record.
 */
export async function generateMetadata(
  props: LeadDossierPageProps
): Promise<Metadata> {
  const { id } = await props.params;
  const result = await getLeadDetails(id);

  if (!result.success || !result.data?.lead) {
    return {
      title: 'Deal Record Not Found | Marca Ubi Enterprise CRM',
      robots: { index: false, follow: false },
    };
  }

  const lead = result.data.lead;
  const accountName = lead.company || lead.name;

  return {
    title: `${accountName} (${lead.lead_id}) | Client 360° Dossier`,
    description: `Comprehensive Client 360° Commercial Dossier & Operational Intelligence for ${accountName}.`,
    robots: { index: false, follow: false },
  };
}

export default async function LeadDossierPage(
  props: LeadDossierPageProps
): Promise<React.ReactElement> {
  const { id } = await props.params;

  // 1. Session verification & tab access guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/admin/login?next=%2Fadmin%2Fleads%2F${encodeURIComponent(id)}`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, allowed_tabs')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.status === 'suspended') {
    redirect('/admin/login?error=account_suspended');
  }

  const allowedTabs = profile?.allowed_tabs as string[] | undefined;
  const hasLeadsAccess = Array.isArray(allowedTabs) ? allowedTabs.includes('leads') : true;

  if (!hasLeadsAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  // 2. Direct RSC data resolution (0ms waterfall)
  const result = await getLeadDetails(id);

  if (!result.success || !result.data) {
    // Discriminate between 403 sandboxed access and 404 missing record
    if (result.error?.includes('Privilege Violation') || result.error?.includes('Unauthorized')) {
      return (
        <div className={styles.deniedWrapper} role="alert">
          <div className={styles.deniedCard}>
            <div className={styles.deniedBadge}>Access Restricted</div>
            <h2 className={styles.deniedTitle}>Portfolio Boundary Enforcement</h2>
            <p className={styles.deniedMessage}>
              Your executive account is restricted to commercial engagements assigned to your active
              portfolio. This lead is assigned to another representative or unassigned.
            </p>
            <a href="/admin/leads" className={styles.returnBtn}>
              ← Return to Inbound Leads
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

  // 3. Render Master Interactive Client Workspace
  return (
    <LeadDossierWorkspaceClient
      lead={result.data.lead}
      initialActivities={result.data.activities}
      funnelStatuses={result.data.availableStatuses}
      teamAssignees={teamAssignees}
      userRole={(profile?.role as CrmUserRole) || 'viewer'}
      workspaceMode="leads"
    />
  );
}
