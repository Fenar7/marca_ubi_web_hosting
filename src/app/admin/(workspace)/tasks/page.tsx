/**
 * @file page.tsx
 * @description Executive Follow-up Queue & Workload Telemetry Cockpit for Marca Ubi Enterprise CRM.
 *              Eliminates sequential request waterfalls by executing all queue counts, overdue exposure,
 *              lead payloads, and directory mappings concurrently via Promise.all and React 19 Suspense streaming.
 *              Enforces editorial design tokens with a balanced 4-queue grid and zero flat-red button spam.
 * @module admin/tasks/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { ROLE_DEFAULT_TABS, type CrmUserRole, type LeadPriority } from '@/types/crm';
import { getUtcDayWindow, parseFollowUpPage, parseFollowUpQueue, type FollowUpQueue } from '@/app/admin/lib/followUpQueue';
import { getCrmDirectoryMap } from '@/app/admin/lib/crmDirectory';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import { TaskCard, type TaskLeadItem } from './components/TaskCard';
import styles from './tasks.module.scss';

export const metadata: Metadata = {
  title: 'Follow-up Queue | Marca Ubi Enterprise CRM',
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 50;
const MAX_PAGE = 100_000;
const SYNTHETIC_EXCLUSION = 'brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true';

type QueueKey = FollowUpQueue;
type SearchParams = Promise<{ page?: string; queue?: string }>;

const QUEUES: Record<QueueKey, { label: string; description: string }> = {
  overdue: { label: 'Critical Overdue', description: 'Scheduled before today (UTC)' },
  today: { label: 'Due Today', description: 'Scheduled today (UTC)' },
  upcoming: { label: 'Upcoming Horizon', description: 'Scheduled after today (UTC)' },
  unassigned: { label: 'Unassigned Inbound', description: 'Active leads without an owner or scheduled touchpoint' },
};

interface QueueCount {
  count: number | null;
  code: string | null;
}

/** Sanitizes diagnostic error messages before server logging or support presentation. */
function sanitizeDiagnostic(message: string): string {
  return message
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, '[id]')
    .slice(0, 240);
}

/** Queries exact lead counts for a specific temporal queue segment. */
async function countQueue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  queue: QueueKey,
  start: string,
  end: string,
  today: string
): Promise<QueueCount> {
  try {
    const scoped = supabase
      .from('leads')
      .select('id, funnel_statuses!inner(bucket)', { count: 'exact', head: true })
      .in('funnel_statuses.bucket', ['open', 'potential'])
      .or(`and(or(revisit_date.is.null,revisit_date.lte.${today}),or(${SYNTHETIC_EXCLUSION}))`);
    const result = queue === 'unassigned'
      ? await scoped.is('assigned_to', null).is('next_follow_up', null)
      : queue === 'overdue'
        ? await scoped.not('next_follow_up', 'is', null).lt('next_follow_up', start)
        : queue === 'today'
          ? await scoped.not('next_follow_up', 'is', null).gte('next_follow_up', start).lte('next_follow_up', end)
          : await scoped.not('next_follow_up', 'is', null).gt('next_follow_up', end);
    return { count: result.count, code: result.error?.code ?? null };
  } catch (cause: unknown) {
    const message = cause instanceof Error ? sanitizeDiagnostic(cause.message) : 'Unexpected query failure';
    console.error('[tasks] Queue count failed', { queue, message });
    return { count: null, code: 'COUNT_REQUEST_FAILED' };
  }
}

/** Calculates total at-risk pipeline monetary valuation across all overdue follow-ups. */
async function fetchOverdueExposure(
  supabase: Awaited<ReturnType<typeof createClient>>,
  start: string,
  today: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('expected_value, funnel_statuses!inner(bucket)')
      .in('funnel_statuses.bucket', ['open', 'potential'])
      .or(`and(or(revisit_date.is.null,revisit_date.lte.${today}),or(${SYNTHETIC_EXCLUSION}))`)
      .not('next_follow_up', 'is', null)
      .lt('next_follow_up', start);

    if (error || !data) return 0;
    return data.reduce((sum, row) => sum + (Number(row.expected_value) || 0), 0);
  } catch {
    return 0;
  }
}

/** Fetches paginated lead rows for the active queue segment. */
async function fetchQueueLeads(
  supabase: Awaited<ReturnType<typeof createClient>>,
  queue: QueueKey,
  page: number,
  start: string,
  end: string,
  today: string
) {
  const baseRows = supabase
    .from('leads')
    .select(`
      id, lead_id, name, company, phone, email, preferred_channel, priority,
      expected_value, next_follow_up, revisit_date, assigned_to, created_at,
      funnel_statuses!inner(name, bucket)
    `)
    .in('funnel_statuses.bucket', ['open', 'potential'])
    .or(`and(or(revisit_date.is.null,revisit_date.lte.${today}),or(${SYNTHETIC_EXCLUSION}))`);

  const scopedRows = queue === 'unassigned'
    ? baseRows.is('assigned_to', null).is('next_follow_up', null)
    : queue === 'overdue'
      ? baseRows.not('next_follow_up', 'is', null).lt('next_follow_up', start)
      : queue === 'today'
        ? baseRows.not('next_follow_up', 'is', null).gte('next_follow_up', start).lte('next_follow_up', end)
        : baseRows.not('next_follow_up', 'is', null).gt('next_follow_up', end);

  const orderedRows = queue === 'unassigned'
    ? scopedRows.order('created_at', { ascending: true })
    : scopedRows.order('next_follow_up', { ascending: true });

  return orderedRows
    .order('id', { ascending: true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
}

function pageHref(queue: QueueKey, page: number): string {
  const params = new URLSearchParams({ queue });
  if (page > 1) params.set('page', String(page));
  return `/admin/tasks?${params.toString()}`;
}

function QueuePagination({
  queue,
  page,
  loadedCount,
  totalCount,
}: {
  queue: QueueKey;
  page: number;
  loadedCount: number;
  totalCount: number | null;
}): React.ReactElement {
  const first = loadedCount ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = loadedCount ? first + loadedCount - 1 : 0;
  const hasNext = totalCount === null ? loadedCount === PAGE_SIZE : page * PAGE_SIZE < totalCount;
  const lastPage = totalCount === null ? null : Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <nav className={styles.pagination} aria-label="Follow-up pages">
      <p className={styles.paginationSummary}>
        {totalCount === null
          ? `Showing ${first.toLocaleString('en-IN')}–${last.toLocaleString('en-IN')}; total unavailable`
          : `Showing ${first.toLocaleString('en-IN')}–${last.toLocaleString('en-IN')} of ${totalCount.toLocaleString('en-IN')}`}
      </p>
      <div className={styles.paginationControls}>
        {page > 1 ? <Link href={pageHref(queue, page - 1)}>Previous</Link> : <span aria-disabled="true">Previous</span>}
        <span aria-current="page">Page {page.toLocaleString('en-IN')}{lastPage ? ` of ${lastPage.toLocaleString('en-IN')}` : ''}</span>
        {hasNext ? <Link href={pageHref(queue, page + 1)}>Next</Link> : <span aria-disabled="true">Next</span>}
      </div>
    </nav>
  );
}

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}): Promise<React.ReactElement> {
  const params = searchParams ? await searchParams : undefined;
  const queue = parseFollowUpQueue(params?.queue);
  const page = parseFollowUpPage(params?.page, MAX_PAGE);
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect(`/admin/login?next=${encodeURIComponent('/admin/tasks')}`);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, status, allowed_tabs')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    const reference = randomUUID().slice(0, 8).toUpperCase();
    console.error('[tasks] Profile lookup failed', { reference, code: profileError.code });
    return <WorkspaceError reference={reference} queue={queue} page={page} message="Your access could not be verified." />;
  }
  if (!profile || profile.status !== 'active') redirect('/admin/login?error=account_suspended');

  const role = profile.role as CrmUserRole;
  const allowedTabs = profile.allowed_tabs as string[] | null;
  const hasTasksAccess = role === 'admin' || (Array.isArray(allowedTabs) && allowedTabs.length > 0
    ? allowedTabs.includes('tasks')
    : Boolean(ROLE_DEFAULT_TABS[role]?.tasks));
  if (!hasTasksAccess) redirect('/admin?error=unauthorized_role_access');

  const { start, end, date: today } = getUtcDayWindow(new Date());

  // Waterfall Elimination: Execute all queue counts, exposure metrics, lead rows, and directory lookup in parallel
  const [
    overdueCount,
    todayCount,
    upcomingCount,
    unassignedCount,
    overdueExposure,
    leadsResult,
    ownerNameById,
  ] = await Promise.all([
    countQueue(supabase, 'overdue', start, end, today),
    countQueue(supabase, 'today', start, end, today),
    countQueue(supabase, 'upcoming', start, end, today),
    countQueue(supabase, 'unassigned', start, end, today),
    fetchOverdueExposure(supabase, start, today),
    fetchQueueLeads(supabase, queue, page, start, end, today),
    getCrmDirectoryMap(supabase),
  ]);

  const queueCounts: QueueCount[] = [overdueCount, todayCount, upcomingCount, unassignedCount];
  const { data: rawLeads, error: leadsError } = leadsResult;

  if (leadsError || !rawLeads) {
    const reference = randomUUID().slice(0, 8).toUpperCase();
    const diagnostic = leadsError
      ? { reference, code: leadsError.code, message: sanitizeDiagnostic(leadsError.message) }
      : { reference, code: 'EMPTY_PAYLOAD', status: null, message: 'The query returned no row payload.' };
    console.error('[tasks] Follow-up query failed', diagnostic);
    return <WorkspaceError reference={reference} queue={queue} page={page} message="Follow-ups could not be loaded." />;
  }

  const leads: TaskLeadItem[] = rawLeads.map((lead) => ({
    id: lead.id,
    lead_id: lead.lead_id,
    name: lead.name,
    company: lead.company,
    phone: lead.phone,
    email: lead.email,
    preferred_channel: lead.preferred_channel || 'Email',
    priority: (lead.priority as LeadPriority) || 'Medium',
    expected_value: Number(lead.expected_value) || 0,
    next_follow_up: lead.next_follow_up,
    revisit_date: lead.revisit_date,
    assigned_to: lead.assigned_to,
    assignee_name: (lead.assigned_to && ownerNameById.get(lead.assigned_to)) || 'Unassigned',
    status_name: (lead.funnel_statuses as { name?: string } | null)?.name || 'Active',
  }));

  const queueIndices: Record<QueueKey, number> = {
    overdue: 0,
    today: 1,
    upcoming: 2,
    unassigned: 3,
  };
  const totalCount = queueCounts[queueIndices[queue]]?.count ?? null;
  const countError = queueCounts.some((item) => item.code !== null || item.count === null);
  const groupCounts: Record<QueueKey, number | null> = {
    overdue: overdueCount.count,
    today: todayCount.count,
    upcoming: upcomingCount.count,
    unassigned: unassignedCount.count,
  };

  const totalActiveVolume =
    (overdueCount.count ?? 0) +
    (todayCount.count ?? 0) +
    (upcomingCount.count ?? 0) +
    (unassignedCount.count ?? 0);

  return (
    <main className={styles.container}>
      {/* Executive Cockpit Masthead */}
      <header className={styles.header}>
        <div className={styles.headingBlock}>
          <p className={styles.eyebrow}>Commercial Desk / Client relationships</p>
          <h1 className={styles.pageTitle}>Follow-up queue</h1>
          <p className={styles.pageSubtitle}>
            Work the next scheduled client conversation with precision, then advance pipeline velocity.
          </p>
        </div>
        <Link className={styles.leadsLink} href="/admin/leads">
          Open leads directory
        </Link>
      </header>

      {/* Balanced 4-Queue Workload Telemetry & Switcher */}
      <section className={styles.queueOverview} aria-label="Follow-up counts and workload telemetry">
        <div className={styles.queueOverviewHeading}>
          <h2>Workload Telemetry</h2>
          <span>All counts follow your CRM access and are calculated across active pipeline records.</span>
        </div>

        <nav className={styles.queueTabs} aria-label="Follow-up timing">
          {(Object.keys(QUEUES) as QueueKey[]).map((key) => {
            const count = groupCounts[key];
            const isSelected = queue === key;
            return (
              <Link
                key={key}
                href={pageHref(key, 1)}
                className={`${styles.queueTab} ${isSelected ? styles.queueTabActive : ''}`}
                aria-current={isSelected ? 'page' : undefined}
              >
                <span className={styles.queueTabTitle}>{QUEUES[key].label}</span>
                <strong>{count === null ? '—' : count.toLocaleString('en-IN')}</strong>
              </Link>
            );
          })}
        </nav>

        {/* Executive Pipeline KPI Strip */}
        <div className={styles.kpiStrip} aria-label="Pipeline metrics summary">
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Total Queue Volume</span>
            <span className={styles.kpiValue}>{totalActiveVolume.toLocaleString('en-IN')} accounts</span>
            <span className={styles.kpiHint}>Across all active pipeline stages</span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>At-Risk Overdue Exposure</span>
            <span className={styles.kpiValue}>{formatCrmCurrency(overdueExposure)}</span>
            <span className={styles.kpiHint}>Valuation tied to overdue touchpoints</span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Turnaround Standard</span>
            <span className={styles.kpiValue}>Sub-24h Target SLA</span>
            <span className={styles.kpiHint}>Institutional cadence benchmark</span>
          </div>
        </div>

        {countError && (
          <p className={styles.countNotice} role="status">
            Some queue totals are temporarily unavailable. The active records below loaded successfully.
          </p>
        )}
      </section>

      {/* React 19 Streaming Suspense Boundary for Workstation Rows */}
      <Suspense fallback={<div className={styles.loadingRows} aria-hidden="true">{[1, 2, 3, 4].map((i) => <div key={i} className={styles.loadingRow} />)}</div>}>
        <section className={styles.workSection} aria-labelledby="work-heading">
          <div className={styles.workSectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>{QUEUES[queue].description}</p>
              <h2 id="work-heading">{QUEUES[queue].label}</h2>
            </div>
            <span className={styles.timezoneLabel}>Times shown in UTC</span>
          </div>

          {leads.length === 0 ? (
            <div className={styles.emptyState}>
              <div>
                <h3>{totalCount === 0 ? `No ${QUEUES[queue].label.toLowerCase()} follow-ups` : 'No records on this page'}</h3>
                <p>
                  {totalCount === 0
                    ? 'There are no scheduled client touchpoints in this time range.'
                    : 'Return to the first page or try another queue.'}
                </p>
              </div>
              {page > 1 && <Link href={pageHref(queue, 1)}>Return to first page</Link>}
            </div>
          ) : (
            <>
              <div className={styles.tableHead} aria-hidden="true">
                <span>Client & Coordinates</span>
                <span>Stage</span>
                <span>Account Executive</span>
                <span>Expected Scope</span>
                <span style={{ textAlign: 'right' }}>Actions</span>
              </div>
              <ol className={styles.taskList} aria-label={`${QUEUES[queue].label} client follow-ups`}>
                {leads.map((lead) => (
                  <TaskCard
                    key={lead.id}
                    lead={lead}
                    isUrgent={queue === 'overdue'}
                    allowCompletion={role !== 'viewer'}
                  />
                ))}
              </ol>
            </>
          )}
        </section>
      </Suspense>

      <QueuePagination queue={queue} page={page} loadedCount={leads.length} totalCount={totalCount} />
    </main>
  );
}

function WorkspaceError({
  reference,
  queue,
  page,
  message,
}: {
  reference: string;
  queue: QueueKey;
  page: number;
  message: string;
}): React.ReactElement {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headingBlock}>
          <p className={styles.eyebrow}>Commercial Desk / Client relationships</p>
          <h1 className={styles.pageTitle}>Follow-up queue</h1>
        </div>
      </header>
      <section className={styles.errorState} role="alert">
        <div>
          <h2>{message}</h2>
          <p>Your queue could not be verified for this request. Use the reference below if you contact support.</p>
          <code>Reference {reference}</code>
        </div>
        <a href={pageHref(queue, page)}>Retry</a>
      </section>
    </main>
  );
}
