/**
 * @file page.tsx
 * @description Commercial Personnel Directory & Governance Workspace (/admin/team).
 *              Server Component protected by Next.js 16 Edge Middleware and Server Action role guards.
 *              Computes Stripe Scorecards for team KPIs and renders the Commercial Personnel Directory.
 * @module app/admin/team/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { getTeamRoster } from '@/app/actions/team';
import { SALES_REP_CAPACITY_LIMIT } from '@/app/lib/team-schemas';
import { getInitialAllowedTabs } from '@/app/lib/team-permissions-config';
import type { CrmTabKey, CrmUserRole, TeamMemberRosterItem } from '@/types/crm';
import { TeamWorkspaceClient } from './components/TeamWorkspaceClient';
import styles from './team.module.scss';

export const metadata: Metadata = {
  title: 'User Management & Access Control | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Formats monetary amounts into clean Indian Lakhs/Crores or base currency with tabular precision.
 */
function formatPortfolioValue(value: number): string {
  if (!value || value <= 0) return '₹0';
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

export default async function AdminTeamPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login?next=%2Fadmin%2Fteam');
  }

  // Retrieve authenticated caller profile
  const { data: callerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, status, allowed_tabs')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !callerProfile) {
    redirect('/admin/login?error=profile_not_found');
  }

  if (callerProfile.status !== 'active') {
    redirect('/admin/login?error=account_suspended');
  }

  const role = callerProfile.role as CrmUserRole;
  const allowedTabs = callerProfile.allowed_tabs as string[] | undefined;

  const hasUsersAccess = Array.isArray(allowedTabs)
    ? allowedTabs.includes('users')
    : role === 'admin' || role === 'sales_manager';

  if (!hasUsersAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  // Fetch complete team roster with deal load aggregations
  const rosterResult = await getTeamRoster();
  const roster: TeamMemberRosterItem[] = rosterResult.success ? rosterResult.data || [] : [];

  // Calculate Stripe Scorecard Metrics
  const totalStaff = roster.length;
  const activeStaff = roster.filter((m) => m.status === 'active').length;
  const suspendedStaff = roster.filter((m) => m.status === 'suspended').length;

  const totalActiveDeals = roster.reduce((acc, m) => acc + (m.active_deals_count || 0), 0);
  const totalPortfolioValue = roster.reduce((acc, m) => acc + (m.total_deal_value || 0), 0);
  // F-06: Compute staff members with genuine custom tab overrides compared to role baseline
  const customPermissionStaff = roster.filter((m) => {
    if (!Array.isArray(m.allowed_tabs)) return false;
    const defaults = getInitialAllowedTabs(m.role);
    if (m.allowed_tabs.length !== defaults.length) return true;
    return !m.allowed_tabs.every((tab) => defaults.includes(tab as CrmTabKey));
  }).length;
  const adminCount = roster.filter((m) => m.role === 'admin').length;
  const managerCount = roster.filter((m) => m.role === 'sales_manager').length;

  return (
    <div className={styles.workspace}>
      {/* Workspace Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>System Governance</span>
          <h1 className={styles.pageTitle}>Commercial Team & Governance.</h1>
          <p className={styles.pageSubtitle}>
            Manage agency personnel accounts, configure granular tab-level access permissions, and oversee team operations.
          </p>
        </div>
      </header>

      {/* Stripe Scorecards Ribbon */}
      <section className={styles.kpiGrid} aria-label="Commercial Team Key Metrics">
        {/* KPI 1: Total Personnel */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Team Members</span>
            <div className={styles.kpiIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className={styles.kpiValue}>{totalStaff}</div>
          <div className={styles.kpiDetail}>
            <span className={styles.kpiDetailEmerald}>{activeStaff} Active</span>
            <span>·</span>
            <span>{suspendedStaff} Suspended</span>
          </div>
        </div>

        {/* KPI 2: Tab Permissions Distribution */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Tab Governance</span>
            <div className={styles.kpiIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>
          <div className={styles.kpiValue}>{customPermissionStaff}</div>
          <div className={styles.kpiDetail}>
            <span className={styles.kpiDetailHighlight}>Custom Tab Overrides</span>
            <span>·</span>
            <span>{totalStaff - customPermissionStaff} Default</span>
          </div>
        </div>

        {/* KPI 3: Pipeline Portfolio Volume */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Portfolio Value</span>
            <div className={styles.kpiIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div className={styles.kpiValue}>{formatPortfolioValue(totalPortfolioValue)}</div>
          <div className={styles.kpiDetail}>
            <span>{totalActiveDeals} Active Deals in Pipeline</span>
          </div>
        </div>

        {/* KPI 4: Governance & Supervisory Enclave */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Governance Tier</span>
            <div className={styles.kpiIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>
          <div className={styles.kpiValue}>{adminCount + managerCount}</div>
          <div className={styles.kpiDetail}>
            <span className={styles.kpiDetailEmerald}>{adminCount} Admins</span>
            <span>·</span>
            <span>{managerCount} Managers</span>
          </div>
        </div>
      </section>

      {/* Interactive Personnel Directory & Provisioning Modals */}
      <TeamWorkspaceClient
        initialRoster={roster}
        currentUserRole={role}
        currentUserId={callerProfile.id}
      />
    </div>
  );
}
