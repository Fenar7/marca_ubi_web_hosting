import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { getTeamRoster } from '@/app/actions/team';
import { hasPersonnelDirectoryAccess } from '@/app/lib/team-permissions-config';
import { formatNumber, formatDealValuation } from '@/app/lib/team-utils';
import type { CrmUserRole } from '@/types/crm';
import { TeamWorkspaceClient } from './components/TeamWorkspaceClient';
import { AddMemberHeaderButton } from './components/AddMemberHeaderButton';
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
    .select('id, role, status, allowed_tabs, feature_permissions')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile) redirect('/admin/login?error=profile_not_found');
  if (profile.status !== 'active') redirect('/admin/login?error=account_suspended');

  const role = profile.role as CrmUserRole;
  if (!hasPersonnelDirectoryAccess(role, profile.allowed_tabs as string[] | undefined)) {
    redirect('/admin?error=unauthorized_role_access');
  }

  const featurePermissions = profile.feature_permissions as Record<string, unknown> | null;
  const canViewFinancials =
    role === 'admin' ||
    role === 'sales_manager' ||
    featurePermissions?.can_view_financials === true;

  const result = await getTeamRoster();
  if (!result.success || !result.data) {
    console.error('[team] Failed to load roster:', result.error || 'No roster returned');
    return (
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Team</h1>
            <p className={styles.pageSubtitle}>
              Manage agency seats, pipeline ownership, and workspace access permissions.
            </p>
          </div>
          <AddMemberHeaderButton userRole={role} />
        </header>
        <div className={styles.dataErrorBanner} role="alert">
          <span>The team directory could not be loaded. Refresh to retry.</span>
          <Link href="/admin/team" className={styles.retryActionLink}>
            Reload directory
          </Link>
        </div>
      </div>
    );
  }

  const roster = result.data;
  const activeMembers = roster.filter((member) => member.status === 'active');
  const suspendedCount = roster.filter((member) => member.status === 'suspended').length;
  const leadershipCount = activeMembers.filter(
    (member) => member.role === 'admin' || member.role === 'sales_manager'
  ).length;
  const salesCount = activeMembers.filter((member) => member.role === 'sales_executive').length;
  const pendingRotationCount = activeMembers.filter((member) => member.must_change_password).length;
  const totalAssignedDeals = roster.reduce((sum, member) => sum + (member.active_deals_count || 0), 0);
  const totalAssignedValue = canViewFinancials
    ? roster.reduce((sum, member) => sum + (member.total_deal_value || 0), 0)
    : 0;

  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Team</h1>
          <p className={styles.pageSubtitle}>
            Manage agency seats, pipeline ownership, and workspace access permissions.
          </p>
        </div>
        <AddMemberHeaderButton userRole={role} />
      </header>

      <dl className={styles.summaryStrip} aria-label="Team seat and portfolio summary">
        <div className={styles.summaryCell}>
          <dt className={styles.summaryLabel}>Active seats</dt>
          <dd className={styles.summaryValue}>{formatNumber(activeMembers.length)}</dd>
          <dd className={styles.summaryMeta}>
            {formatNumber(leadershipCount)} leadership · {formatNumber(salesCount)} sales reps
          </dd>
        </div>

        <div className={styles.summaryCell}>
          <dt className={styles.summaryLabel}>Assigned portfolio</dt>
          <dd className={styles.summaryValue}>
            {canViewFinancials
              ? formatDealValuation(totalAssignedValue)
              : `${formatNumber(totalAssignedDeals)} deals`}
          </dd>
          <dd className={styles.summaryMeta}>
            {canViewFinancials
              ? `${formatNumber(totalAssignedDeals)} active non-terminal deals`
              : 'Monetary valuations restricted by role'}
          </dd>
        </div>

        <div className={`${styles.summaryCell} ${suspendedCount > 0 ? styles.summaryAlertCell : ''}`}>
          <dt className={styles.summaryLabel}>Access health</dt>
          <dd className={`${styles.summaryValue} ${suspendedCount > 0 ? styles.summaryAlertValue : ''}`}>
            {formatNumber(suspendedCount)} suspended
          </dd>
          <dd className={styles.summaryMeta}>
            {pendingRotationCount > 0
              ? `${formatNumber(pendingRotationCount)} pending first-login password rotation`
              : 'All active passwords verified'}
          </dd>
        </div>
      </dl>

      <TeamWorkspaceClient
        initialRoster={roster}
        currentUserRole={role}
        currentUserId={profile.id}
        canViewFinancials={canViewFinancials}
      />
    </div>
  );
}
