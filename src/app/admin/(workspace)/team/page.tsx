import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { getTeamRoster } from '@/app/actions/team';
import { hasPersonnelDirectoryAccess } from '@/app/lib/team-permissions-config';
import { formatNumber } from '@/app/lib/team-utils';
import type { CrmUserRole } from '@/types/crm';
import { TeamWorkspaceClient } from './components/TeamWorkspaceClient';
import styles from './team.module.scss';

export const metadata: Metadata = {
  title: 'Team | Marca Ubi CRM',
  robots: { index: false, follow: false },
};

/** The roster and its actions are available only to authorized, active CRM users. */
export default async function AdminTeamPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login?next=%2Fadmin%2Fteam');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role, status, allowed_tabs')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile) redirect('/admin/login?error=profile_not_found');
  if (profile.status !== 'active') redirect('/admin/login?error=account_suspended');

  const role = profile.role as CrmUserRole;
  if (!hasPersonnelDirectoryAccess(role, profile.allowed_tabs as string[] | undefined)) {
    redirect('/admin?error=unauthorized_role_access');
  }

  const result = await getTeamRoster();
  if (!result.success || !result.data) {
    console.error('[team] Failed to load roster:', result.error || 'No roster returned');
    return (
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.eyebrow}>Agency operations</span>
            <h1 className={styles.pageTitle}>Team</h1>
            <p className={styles.pageSubtitle}>Manage your team and their access to the CRM.</p>
          </div>
        </header>
        <p className={styles.dataError} role="alert">The team directory could not be loaded. Refresh the page to try again.</p>
      </div>
    );
  }

  const roster = result.data;
  const summaries = [
    { label: 'Members shown', value: roster.length },
    { label: 'Active', value: roster.filter((member) => member.status === 'active').length },
    { label: 'Suspended', value: roster.filter((member) => member.status === 'suspended').length },
    { label: 'Admins and managers', value: roster.filter((member) => member.role === 'admin' || member.role === 'sales_manager').length },
  ];

  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Agency operations</span>
          <h1 className={styles.pageTitle}>Team</h1>
          <p className={styles.pageSubtitle}>Manage your team and their access to the CRM.</p>
        </div>
      </header>

      <dl className={styles.kpiGrid} aria-label="Team summary">
        {summaries.map((summary) => (
          <div className={styles.kpiCard} key={summary.label}>
            <dt className={styles.kpiLabel}>{summary.label}</dt>
            <dd className={styles.kpiValue}>{formatNumber(summary.value)}</dd>
          </div>
        ))}
      </dl>

      <TeamWorkspaceClient initialRoster={roster} currentUserRole={role} currentUserId={profile.id} />
    </div>
  );
}
