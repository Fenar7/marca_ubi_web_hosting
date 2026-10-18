/**
 * @file page.tsx
 * @description Dedicated Commercial Analytics Workspace (/admin/analytics).
 *              Server Component querying deal conversion rates, pipeline velocity,
 *              and revenue distribution across commercial stages.
 * @module app/admin/(workspace)/analytics/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import type { CrmUserRole, PipelineRpcMetrics } from '@/types/crm';
import { KpiRibbon } from '@/app/admin/components/kpi';
import styles from './analytics.module.scss';

export const metadata: Metadata = {
  title: 'Revenue & Pipeline Analytics | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

function formatCurrency(amount: number): string {
  if (!amount || amount <= 0) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default async function AdminAnalyticsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login?next=%2Fadmin%2Fanalytics');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, allowed_tabs')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role as CrmUserRole) || 'viewer';
  const allowedTabs = profile?.allowed_tabs as string[] | undefined;

  const hasAnalyticsAccess = Array.isArray(allowedTabs) && allowedTabs.length > 0
    ? allowedTabs.includes('analytics')
    : role !== 'sales_executive';

  if (!hasAnalyticsAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  let rpcMetrics: PipelineRpcMetrics | null = null;
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_pipeline_kpis');

  if (!rpcError && rpcData) {
    rpcMetrics = rpcData as unknown as PipelineRpcMetrics;
  } else {
    // Table query fallback
    const { data: leads } = await supabase
      .from('leads')
      .select('expected_value, funnel_statuses!inner(bucket)');

    let totalDeals = 0;
    let conversionRate = 0;
    let convertedRevenue = 0;
    let potentialValue = 0;

    if (leads && leads.length > 0) {
      totalDeals = leads.length;
      const converted = leads.filter(
        (l) => (l.funnel_statuses as { bucket?: string } | null)?.bucket === 'converted'
      );
      const potential = leads.filter(
        (l) => (l.funnel_statuses as { bucket?: string } | null)?.bucket === 'potential'
      );
      conversionRate = Number(((converted.length / totalDeals) * 100).toFixed(1));
      convertedRevenue = converted.reduce((acc, l) => acc + (Number(l.expected_value) || 0), 0);
      potentialValue = potential.reduce((acc, l) => acc + (Number(l.expected_value) || 0), 0);
    }

    rpcMetrics = {
      total_leads_count: totalDeals,
      open_leads_count: 0,
      potential_leads_count: 0,
      potential_pipeline_value: potentialValue,
      converted_leads_count: 0,
      converted_revenue_value: convertedRevenue,
      lost_leads_count: 0,
      overdue_follow_ups_count: 0,
      conversion_rate_percentage: conversionRate,
    };
  }

  // Fetch breakdown across all funnel statuses
  const { data: statuses } = await supabase
    .from('funnel_statuses')
    .select('id, name, bucket, color_code, sort_order')
    .order('sort_order', { ascending: true });

  const { data: allLeads } = await supabase
    .from('leads')
    .select('status_id, expected_value');

  const stageBreakdown = (statuses || []).map((status) => {
    const matchingLeads = (allLeads || []).filter((l) => l.status_id === status.id);
    const count = matchingLeads.length;
    const value = matchingLeads.reduce((acc, l) => acc + (Number(l.expected_value) || 0), 0);
    return {
      id: status.id,
      name: status.name,
      color: status.color_code || '#ff6100',
      count,
      value,
    };
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Forecasting & Commercial Intelligence</span>
          <h1 className={styles.pageTitle}>Revenue & Pipeline Analytics</h1>
          <p className={styles.pageSubtitle}>
            Track win rates, deal progression, and closed revenue across all agency services.
          </p>
        </div>
      </header>

      {/* Dark Luxury Executive KPI Ribbon */}
      <KpiRibbon initialData={rpcMetrics} />

      {/* Funnel Stage Breakdown */}
      <section className={styles.breakdownSection} aria-label="Funnel Stage Distribution">
        <h2 className={styles.sectionTitle}>Deals by Stage</h2>
        <div className={styles.stageList}>
          {stageBreakdown.map((stage) => (
            <Link
              key={stage.id}
              href={`/admin/leads?stage=${stage.id}`}
              className={styles.stageRow}
              style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}
              title={`Inspect deals in stage: ${stage.name}`}
            >
              <div className={styles.stageLeft}>
                <span
                  className={styles.stageDot}
                  style={{ backgroundColor: stage.color }}
                />
                <span className={styles.stageName}>{stage.name}</span>
              </div>
              <div className={styles.stageRight}>
                <span className={styles.stageCount}>{stage.count} deals</span>
                <span className={styles.stageVal}>{formatCurrency(stage.value)}</span>
                <span style={{ color: '#ff6100', marginLeft: '0.35rem', fontSize: '0.85rem' }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
