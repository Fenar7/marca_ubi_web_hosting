import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { ROLE_DEFAULT_TABS, type CrmUserRole } from '@/types/crm';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import styles from './analytics.module.scss';

export const metadata: Metadata = {
  title: 'Revenue & Pipeline Analytics | Marca Ubi CRM',
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 1000;
const MAX_ROWS = 50000;
const SYNTHETIC_EXCLUSION = 'brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true';

/** Folds each bounded page into stage totals so reporting never retains the full lead set. */
async function readAnalyticsLeads(supabase: Awaited<ReturnType<typeof createClient>>) {
  const totals = new Map<string, { count: number; value: number }>();
  let count = 0;
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await supabase.from('leads')
      .select('id, status_id, expected_value')
      .or(SYNTHETIC_EXCLUSION)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error || !data) return { totals: null, count: null, error: error?.message ?? 'No data returned.' };
    if (count + data.length > MAX_ROWS) return { totals: null, count: null, error: 'Data exceeds the reporting limit.' };
    for (const lead of data) {
      const current = totals.get(lead.status_id) ?? { count: 0, value: 0 };
      const amount = Number(lead.expected_value);
      current.count += 1;
      current.value += Number.isFinite(amount) ? amount : 0;
      totals.set(lead.status_id, current);
    }
    count += data.length;
    if (data.length < PAGE_SIZE) return { totals, count, error: null };
  }
  const { data, error } = await supabase.from('leads')
    .select('id, status_id, expected_value')
    .or(SYNTHETIC_EXCLUSION)
    .order('id', { ascending: true })
    .range(MAX_ROWS, MAX_ROWS);
  if (error || !data) return { totals: null, count: null, error: error?.message ?? 'The reporting limit check returned no payload.' };
  return data.length
    ? { totals: null, count: null, error: 'Data exceeds the reporting limit.' }
    : { totals, count, error: null };
}

export default async function AdminAnalyticsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login?next=%2Fadmin%2Fanalytics');

  const { data: profile } = await supabase.from('profiles')
    .select('role, status, allowed_tabs').eq('id', user.id).maybeSingle();
  if (!profile || profile.status !== 'active') redirect('/admin/login?error=account_suspended');
  const role = profile.role as CrmUserRole;
  const allowedTabs = profile.allowed_tabs;
  const allowed = role === 'admin' || (Array.isArray(allowedTabs) && allowedTabs.length > 0
    ? allowedTabs.includes('analytics') : Boolean(ROLE_DEFAULT_TABS[role]?.analytics));
  if (!allowed) redirect('/admin?error=unauthorized_role_access');

  const [statusResult, leadResult] = await Promise.all([
    supabase.from('funnel_statuses').select('id, name, bucket, color_code, sort_order').order('sort_order'),
    readAnalyticsLeads(supabase),
  ]);
  const error = statusResult.error?.message ?? leadResult.error;
  if (error) console.error('[admin-analytics] Reporting query failed:', error);
  const statuses = statusResult.data ?? [];
  const totals = leadResult.totals ?? new Map<string, { count: number; value: number }>();
  const knownIds = new Set(statuses.map((status) => status.id));
  const incomplete = [...totals.keys()].some((statusId) => !knownIds.has(statusId));
  const unavailable = Boolean(error || incomplete);
  const active = statuses.filter((status) => status.bucket === 'open' || status.bucket === 'potential');
  const converted = statuses.filter((status) => status.bucket === 'converted');
  const sum = (ids: string[]) => ids.reduce((total, id) => total + (totals.get(id)?.value ?? 0), 0);
  const cards = [
    { label: 'Total leads', value: (leadResult.count ?? 0).toLocaleString('en-IN'), detail: 'Records visible to you' },
    { label: 'Active pipeline', value: formatCrmCurrency(sum(active.map((status) => status.id))), detail: 'Open and potential stages' },
    { label: 'Converted contract value', value: formatCrmCurrency(sum(converted.map((status) => status.id))), detail: 'Current converted records' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Commercial intelligence</p>
        <h1 className={styles.pageTitle}>Revenue &amp; pipeline analytics</h1>
        <p className={styles.pageSubtitle}>A current view of the leads and contract values available to you.</p>
      </header>
      {unavailable ? (
        <section className={styles.notice} role="status">
          <h2>Analytics unavailable</h2>
          <p>The complete pipeline data could not be loaded. Refresh the page to try again.</p>
        </section>
      ) : (
        <>
          <section className={styles.metrics} aria-label="Pipeline summary">
            {cards.map((card) => <div className={styles.metric} key={card.label}>
              <span className={styles.metricLabel}>{card.label}</span>
              <strong className={styles.metricValue}>{card.value}</strong>
              <span className={styles.metricDetail}>{card.detail}</span>
            </div>)}
          </section>
          <section className={styles.breakdownSection} aria-labelledby="stage-heading">
            <div className={styles.sectionHeader}>
              <div><h2 id="stage-heading" className={styles.sectionTitle}>Deals by stage</h2>
                <p>Current stage of visible leads. Synthetic benchmark records are excluded.</p></div>
              <Link href="/admin/leads" className={styles.viewLink}>View leads <span aria-hidden="true">-&gt;</span></Link>
            </div>
            {statuses.length === 0 ? <p className={styles.notice}>No stages are configured.</p> : (
              <div className={styles.stageList}>
                {statuses.map((status) => {
                  const stage = totals.get(status.id) ?? { count: 0, value: 0 };
                  return <Link key={status.id} href={`/admin/leads?stage=${encodeURIComponent(status.id)}`} className={styles.stageRow}>
                    <span className={styles.stageLeft}><span className={styles.stageDot} style={{ backgroundColor: status.color_code || '#666666' }} aria-hidden="true" />{status.name}</span>
                    <span className={styles.stageRight}><span>{stage.count.toLocaleString('en-IN')} deals</span><strong>{formatCrmCurrency(stage.value)}</strong><span aria-hidden="true">-&gt;</span></span>
                  </Link>;
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
