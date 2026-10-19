/**
 * @file page.tsx
 * @description Executive Overview and Commercial Performance Dashboard for the Marca Ubi Agency CRM (/admin).
 *              Renders real-time Sypher scorecards, Commercial Funnel Trinity navigation,
 *              representative workload balancing, and the recent activity feed.
 * @module app/admin/(workspace)/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase/server';
import type { PipelineRpcMetrics } from '@/types/crm';
import { KpiRibbon } from '@/app/admin/components/kpi';
import { ManagerWorkloadCard } from '@/app/admin/components/Dashboard';
import styles from './page.module.scss';
import { ActivityRowItem } from './components/ActivityRowItem';

export const metadata: Metadata = {
  title: 'Executive Overview | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

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
  badgeStyle: 'orange' | 'emerald' | 'amber' | 'neutral' | 'blue';
  description: string;
  actor: string;
  createdAt: string;
  leadId?: string | null;
}

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();

  // 1. Fetch Aggregated Pipeline Metrics via RPC or Direct Aggregation Fallback
  let rpcMetrics: PipelineRpcMetrics | null = null;
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_pipeline_kpis');

  if (!rpcError && rpcData) {
    rpcMetrics = rpcData as unknown as PipelineRpcMetrics;
  } else {
    // Invariant: Direct table fallback if RPC is unpopulated in sandbox/mock environments
    const { count: leadCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    const { data: activeLeads } = await supabase
      .from('leads')
      .select('expected_value, next_follow_up, funnel_statuses!inner(bucket)')
      .in('funnel_statuses.bucket', ['open', 'potential']);

    let activeDealsCount = 0;
    let pipelineValuation = 0;
    let overdueFollowups = 0;

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

    rpcMetrics = {
      total_leads_count: leadCount || 0,
      open_leads_count: activeDealsCount,
      potential_leads_count: activeDealsCount,
      potential_pipeline_value: pipelineValuation,
      converted_leads_count: 0,
      converted_revenue_value: 0,
      lost_leads_count: 0,
      overdue_follow_ups_count: overdueFollowups,
      conversion_rate_percentage: 0,
    };
  }

  // 2. Fetch Active Client Works Delivery Count for Funnel Trinity Overview
  const { count: activeWorksCount } = await supabase
    .from('client_works')
    .select('*', { count: 'exact', head: true })
    .neq('delivery_stage', 'delivered');

  // 3. Fetch Recent Activity (Combining lead_activities and team_audit_logs)
  const activities: ActivityItem[] = [];

  const { data: leadActs } = await supabase
    .from('lead_activities')
    .select('id, lead_id, activity_type, description, created_at, actor_id, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(4);

  if (leadActs) {
    leadActs.forEach((act) => {
      const typeStr = (act.activity_type || 'update').replace(/_/g, ' ');
      const actorName = (act.profiles as { full_name?: string } | null)?.full_name || 'System';
      let badgeStyle: 'orange' | 'emerald' | 'amber' | 'neutral' | 'blue' = 'neutral';

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
        leadId: act.lead_id,
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

  const inboundPendingCount = rpcMetrics?.open_leads_count || 0;
  const activeNegotiationCount = rpcMetrics?.potential_leads_count || 0;
  const productionWorksCount = activeWorksCount || 0;

  return (
    <div className={styles.container}>
      {/* Executive Overview Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Executive Overview</span>
          <h1 className={styles.pageTitle}>Commercial Performance.</h1>
          <p className={styles.pageSubtitle}>
            Key commercial metrics, representative capacity, and recent touchpoints across the agency.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.nodeBadge}>
            <span className={styles.nodeDot} />
            <span>Operational Status: Active</span>
          </div>
          <Link href="/admin/leads" className={styles.newLeadBtn} title="Review inbound inquiries and create deals">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Inbound Leads</span>
          </Link>
        </div>
      </header>

      {/* Sypher Master Executive KPI Ribbon */}
      <KpiRibbon initialData={rpcMetrics} />

      {/* Commercial Rep Workload Balancing & SLA Oversight */}
      <ManagerWorkloadCard />

      {/* Commercial Funnel Trinity Pipeline Velocity Hub */}
      <section className={styles.funnelDistributionSection} aria-label="Commercial Funnel Trinity Overview">
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Commercial Funnel Trinity.</h2>
            <p className={styles.sectionDescription}>
              Real-time account distribution across Discovery, Negotiation, and Production workspaces.
            </p>
          </div>
        </div>

        <div className={styles.funnelCardsGrid}>
          {/* Card 1: Inbound Leads */}
          <Link href="/admin/leads" className={styles.funnelCard} title="Open Inbound Leads Triage Workspace">
            <div className={styles.funnelCardHeader}>
              <span className={styles.funnelPillarStep}>Stage 01</span>
              <span className={styles.funnelEnclaveBadge}>Discovery</span>
            </div>
            <div className={styles.funnelCardBody}>
              <h3 className={styles.funnelCardTitle}>Inbound Leads</h3>
              <p className={styles.funnelCardDesc}>
                Raw briefs & inquiries awaiting discovery qualification and deal conversion.
              </p>
              <div className={styles.funnelMetricRow}>
                <span className={styles.funnelMetricValue}>{inboundPendingCount}</span>
                <span className={styles.funnelMetricLabel}>Inquiries Pending</span>
              </div>
            </div>
            <div className={styles.funnelCardFooter}>
              <span>Open Leads Workspace</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </Link>

          {/* Card 2: Pipeline Deals */}
          <Link href="/admin/deals" className={styles.funnelCard} title="Open Pipeline Deals Kanban Workspace">
            <div className={styles.funnelCardHeader}>
              <span className={styles.funnelPillarStep}>Stage 02</span>
              <span className={`${styles.funnelEnclaveBadge} ${styles.enclaveOrange}`}>Negotiation</span>
            </div>
            <div className={styles.funnelCardBody}>
              <h3 className={styles.funnelCardTitle}>Pipeline Deals</h3>
              <p className={styles.funnelCardDesc}>
                Active commercial proposals, interactive stage progression, and contract negotiations.
              </p>
              <div className={styles.funnelMetricRow}>
                <span className={styles.funnelMetricValue}>{activeNegotiationCount}</span>
                <span className={styles.funnelMetricLabel}>Active Deals</span>
              </div>
            </div>
            <div className={styles.funnelCardFooter}>
              <span>Open Deals Kanban</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </Link>

          {/* Card 3: Client Works */}
          <Link href="/admin/works" className={styles.funnelCard} title="Open Client Works & Deliverables Workspace">
            <div className={styles.funnelCardHeader}>
              <span className={styles.funnelPillarStep}>Stage 03</span>
              <span className={`${styles.funnelEnclaveBadge} ${styles.enclaveEmerald}`}>Production</span>
            </div>
            <div className={styles.funnelCardBody}>
              <h3 className={styles.funnelCardTitle}>Client Works</h3>
              <p className={styles.funnelCardDesc}>
                Post-conversion client creative deliverables, milestone completions, and delivery health.
              </p>
              <div className={styles.funnelMetricRow}>
                <span className={styles.funnelMetricValue}>{productionWorksCount}</span>
                <span className={styles.funnelMetricLabel}>Active Deliverables</span>
              </div>
            </div>
            <div className={styles.funnelCardFooter}>
              <span>Open Works Tracker</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Activity */}
      <section className={styles.activitySection} aria-label="Recent Operational Activity">
        <div className={styles.ledgerHeader}>
          <h2 className={styles.ledgerTitle}>Recent Activity.</h2>
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
            {displayActivities.map((act) => (
              <ActivityRowItem
                key={act.id}
                id={act.id}
                type={act.type}
                badgeStyle={act.badgeStyle}
                description={act.description}
                actor={act.actor}
                timeAgo={formatTimeAgo(act.createdAt)}
                leadId={act.leadId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
