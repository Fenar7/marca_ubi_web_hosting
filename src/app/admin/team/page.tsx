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
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { getTeamRoster } from '@/app/actions/team';
import type { CrmUserRole, TeamMemberRosterItem } from '@/types/crm';
import { TeamWorkspaceClient } from './components/TeamWorkspaceClient';
import styles from './team.module.scss';

export const metadata: Metadata = {
  title: 'Commercial Personnel & Governance | Marca Ubi Enterprise CRM',
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
    .select('id, role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !callerProfile) {
    redirect('/admin/login?error=profile_not_found');
  }

  if (callerProfile.status !== 'active') {
    redirect('/admin/login?error=account_suspended');
  }

  const role = callerProfile.role as CrmUserRole;

  if (role !== 'admin' && role !== 'sales_manager') {
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

  const repsAtCapacity = roster.filter((m) => m.role === 'sales_executive' && m.active_deals_count >= 15).length;
  const executiveCount = roster.filter((m) => m.role === 'sales_executive').length;
  const adminCount = roster.filter((m) => m.role === 'admin').length;

  return (
    <main className={styles.workspace}>
      {/* Workspace Brand Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Governance & Access Control</span>
          <h1 className={styles.pageTitle}>Commercial Personnel Directory</h1>
          <p className={styles.pageSubtitle}>
            Agency staff roster, role authorization matrix, and portfolio deal load allocation.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/admin" className={styles.backButton}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Command Center</span>
          </Link>
        </div>
      </header>

      {/* Stripe Scorecards Ribbon */}
      <section className={styles.kpiGrid} aria-label="Commercial Team Key Metrics">
        {/* KPI 1: Total Personnel */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Total Staff</span>
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

        {/* KPI 2: Active Deals Load */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Assigned Deals</span>
            <div className={styles.kpiIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>
          <div className={styles.kpiValue}>{totalActiveDeals}</div>
          <div className={styles.kpiDetail}>
            <span className={styles.kpiDetailHighlight}>{executiveCount} Account Executives</span>
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
            <span>Active Commercial Pipeline</span>
          </div>
        </div>

        {/* KPI 4: Reps at Capacity & Governance */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Reps at Capacity</span>
            <div className={styles.kpiIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>
          <div className={styles.kpiValue}>{repsAtCapacity}</div>
          <div className={styles.kpiDetail}>
            <span>{adminCount} Active Administrators</span>
          </div>
        </div>
      </section>

      {/* Interactive Personnel Directory & Provisioning Modals */}
      <TeamWorkspaceClient
        initialRoster={roster}
        currentUserRole={role}
        currentUserId={callerProfile.id}
      />
    </main>
  );
}
