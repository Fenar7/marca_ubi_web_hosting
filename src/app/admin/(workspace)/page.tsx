/**
 * @file page.tsx
 * @description Executive Pipeline Command Center for the Marca Ubi Agency CRM (/admin).
 *              Renders real-time Stripe Scorecards, primary workflow quick-launch cards,
 *              and the live touchpoint and audit activity ledger.
 * @module app/admin/(workspace)/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase/server';
import type { PipelineRpcMetrics } from '@/types/crm';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Executive Command Center | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Formats numeric currency into clean Indian Lakhs/Crores or formatted rupees.
 */
function formatCurrency(amount: number): string {
  if (!amount || amount <= 0) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Relative time formatter for activity timestamps.
 */
function formatTimeAgo(isoDate: string): string {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

interface ActivityItem {
  id: string;
  type: string;
  badgeStyle: 'orange' | 'emerald' | 'amber' | 'blue';
  description: string;
  actor: string;
  createdAt: string;
}

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();

  // 1. Fetch Aggregated Pipeline Metrics via RPC or Direct Aggregation Fallback
  let totalLeads = 0;
  let pipelineValuation = 0;
  let overdueFollowups = 0;
  let activeDealsCount = 0;

  const { data: rpcData, error: rpcError } = await supabase.rpc('get_pipeline_kpis');

  if (!rpcError && rpcData) {
    const metrics = rpcData as unknown as PipelineRpcMetrics;
    totalLeads = metrics.total_leads_count || 0;
    pipelineValuation = Number(metrics.potential_pipeline_value || 0);
    overdueFollowups = metrics.overdue_follow_ups_count || 0;
    activeDealsCount = (metrics.open_leads_count || 0) + (metrics.potential_leads_count || 0);
  } else {
    // Invariant: Direct table fallback if RPC is unpopulated in sandbox/mock environments
    const { count: leadCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    totalLeads = leadCount || 0;

    const { data: activeLeads } = await supabase
      .from('leads')
      .select('expected_value, next_follow_up, funnel_statuses!inner(bucket)')
      .in('funnel_statuses.bucket', ['open', 'potential']);

    if (activeLeads) {
      activeDealsCount = activeLeads.length;
      pipelineValuation = activeLeads.reduce(
        (sum, l) => sum + (Number(l.expected_value) || 0),
        0
      );
      const nowIso = new Date().toISOString();
      overdueFollowups = activeLeads.filter(
        (l) => l.next_follow_up && l.next_follow_up < nowIso
      ).length;
    }
  }

  // 2. Fetch Commercial Personnel Metrics
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, status, role');

  const staffList = profiles || [];
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((p) => p.status === 'active').length;
  const suspendedStaff = staffList.filter((p) => p.status === 'suspended').length;

  // 3. Fetch Recent Activity Ledger (Combining lead_activities and team_audit_logs)
  const activities: ActivityItem[] = [];

  const { data: leadActs } = await supabase
    .from('lead_activities')
    .select('id, activity_type, description, created_at, actor_id, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(4);

  if (leadActs) {
    leadActs.forEach((act) => {
      const typeStr = (act.activity_type || 'update').replace(/_/g, ' ');
      const actorName = (act.profiles as { full_name?: string } | null)?.full_name || 'System';
      let badgeStyle: 'orange' | 'emerald' | 'amber' | 'blue' = 'blue';

      if (act.activity_type === 'status_change') badgeStyle = 'emerald';
      else if (act.activity_type === 'call_logged' || act.activity_type === 'meeting_notes')
        badgeStyle = 'orange';
      else if (act.activity_type === 'duplicate_inquiry') badgeStyle = 'amber';

      activities.push({
        id: act.id,
        type: typeStr,
        badgeStyle,
        description: act.description,
        actor: actorName,
        createdAt: act.created_at,
      });
    });
  }

  const { data: auditLogs } = await supabase
    .from('team_audit_logs')
    .select('id, action, target_user_email, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (auditLogs) {
    auditLogs.forEach((log) => {
      activities.push({
        id: log.id,
        type: 'governance',
        badgeStyle: 'orange',
        description: `${log.action.replace(/_/g, ' ')} on ${log.target_user_email}`,
        actor: 'Admin Console',
        createdAt: log.created_at,
      });
    });
  }

  // Sort chronological descending and slice top 6
  activities.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const displayActivities = activities.slice(0, 6);

  return (
    <div className={styles.container}>
      {/* Executive Command Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Sales Intelligence & Pipeline Ops</span>
          <h1 className={styles.pageTitle}>Executive Command Center</h1>
          <p className={styles.pageSubtitle}>
            Global deal velocity, commercial staff roster, and omnichannel ingestion telemetry.
          </p>
        </div>

        <div className={styles.headerMeta}>
          <div className={styles.nodeBadge}>
            <span className={styles.nodeDot} />
            <span>Supabase Cloud Node</span>
          </div>
        </div>
      </header>

      {/* 4 Stripe Scorecards Ribbon */}
      <section className={styles.kpiGrid} aria-label="Commercial Executive Scorecards">
        {/* KPI 1: Total Leads */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Total Leads</span>
            <div className={styles.kpiIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </div>
          </div>
          <div className={styles.kpiValue}>{totalLeads}</div>
          <div className={styles.kpiDetail}>
            <span className={styles.kpiDetailEmerald}>{activeDealsCount} In Pipeline</span>
            <span>·</span>
            <span>Omnichannel</span>
          </div>
        </div>

        {/* KPI 2: Active Pipeline Valuation */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Pipeline Valuation</span>
            <div className={styles.kpiIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div className={styles.kpiValue}>{formatCurrency(pipelineValuation)}</div>
          <div className={styles.kpiDetail}>
            <span className={styles.kpiDetailOrange}>Open & Potential Deals</span>
          </div>
        </div>

        {/* KPI 3: Commercial Staff */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Commercial Staff</span>
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

        {/* KPI 4: Overdue Follow-ups */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Overdue Tasks</span>
            <div className={styles.kpiIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className={styles.kpiValue}>{overdueFollowups}</div>
          <div className={styles.kpiDetail}>
            {overdueFollowups > 0 ? (
              <span className={styles.kpiDetailRed}>Immediate Action Required</span>
            ) : (
              <span className={styles.kpiDetailEmerald}>Queue Up To Date</span>
            )}
          </div>
        </div>
      </section>

      {/* 4 Feature Quick-Launch Hub */}
      <section className={styles.quickLaunchSection} aria-label="Feature Quick-Launch Cards">
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Commercial Workspaces</h2>
            <p className={styles.sectionDescription}>
              Direct navigation into dedicated operational enclaves and audit modules.
            </p>
          </div>
        </div>

        <div className={styles.quickLaunchGrid}>
          {/* Card 1: Commercial Directory */}
          <Link href="/admin/team" className={styles.launchCard}>
            <div className={styles.cardIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className={styles.launchCardContent}>
              <h3 className={styles.launchCardTitle}>Commercial Directory</h3>
              <p className={styles.launchCardDesc}>
                Staff roster, capacity caps, role governance, and portfolio reassignment.
              </p>
            </div>
            <div className={styles.launchCardFooter}>
              <span className={styles.launchActionLabel}>Open Roster</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.launchArrow} aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </Link>

          {/* Card 2: Leads Workspace */}
          <Link href="/admin/leads" className={styles.launchCard}>
            <div className={styles.cardIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </div>
            <div className={styles.launchCardContent}>
              <h3 className={styles.launchCardTitle}>Pipeline Deals</h3>
              <p className={styles.launchCardDesc}>
                Interactive deal pipeline, bucket filtering, valuations, and owner assignments.
              </p>
            </div>
            <div className={styles.launchCardFooter}>
              <span className={styles.launchActionLabel}>Inspect Deals</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.launchArrow} aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </Link>

          {/* Card 3: Follow-up Queue */}
          <Link href="/admin/tasks" className={styles.launchCard}>
            <div className={styles.cardIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className={styles.launchCardContent}>
              <h3 className={styles.launchCardTitle}>Follow-up Queue</h3>
              <p className={styles.launchCardDesc}>
                Overdue and scheduled prospect touchpoints with direct outreach coordinates.
              </p>
            </div>
            <div className={styles.launchCardFooter}>
              <span className={styles.launchActionLabel}>Review Tasks</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.launchArrow} aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </Link>

          {/* Card 4: Webhook Ingestion Telemetry */}
          <Link href="/admin/ingestion" className={styles.launchCard}>
            <div className={styles.cardIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </div>
            <div className={styles.launchCardContent}>
              <h3 className={styles.launchCardTitle}>Ingestion Telemetry</h3>
              <p className={styles.launchCardDesc}>
                Webhook endpoint health, rate-limiting stats, and deduplication diagnostics.
              </p>
            </div>
            <div className={styles.launchCardFooter}>
              <span className={styles.launchActionLabel}>Monitor Feed</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.launchArrow} aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </Link>
        </div>
      </section>

      {/* Live Activity & Audit Ledger */}
      <section className={styles.activitySection} aria-label="Recent Operational Activity">
        <div className={styles.ledgerHeader}>
          <h2 className={styles.ledgerTitle}>Recent Activity Ledger</h2>
          <div className={styles.liveFeedIndicator}>
            <span className={styles.liveFeedDot} />
            <span>Real-time Stream</span>
          </div>
        </div>

        {displayActivities.length === 0 ? (
          <div className={styles.emptyState}>
            <span>No commercial touchpoints or governance events recorded yet.</span>
          </div>
        ) : (
          <div className={styles.activityList}>
            {displayActivities.map((act) => {
              const badgeClass =
                act.badgeStyle === 'emerald'
                  ? styles.badgeEmerald
                  : act.badgeStyle === 'amber'
                  ? styles.badgeAmber
                  : act.badgeStyle === 'orange'
                  ? styles.badgeOrange
                  : styles.badgeBlue;

              return (
                <div key={act.id} className={styles.activityRow}>
                  <div className={styles.activityLeft}>
                    <span className={`${styles.activityBadge} ${badgeClass}`}>
                      {act.type}
                    </span>
                    <span className={styles.activityDesc}>{act.description}</span>
                  </div>
                  <div className={styles.activityRight}>
                    <span className={styles.activityActor}>{act.actor}</span>
                    <span className={styles.activityTime}>
                      {formatTimeAgo(act.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
