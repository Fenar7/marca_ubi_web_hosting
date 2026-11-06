import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { ROLE_DEFAULT_TABS, type CrmUserRole, type LeadPriority } from '@/types/crm';
import { getUtcDayWindow, parseFollowUpPage, parseFollowUpQueue, type FollowUpQueue } from '@/app/admin/lib/followUpQueue';
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
  overdue: { label: 'Overdue', description: 'Scheduled before today (UTC)' },
  today: { label: 'Due today', description: 'Scheduled today (UTC)' },
  upcoming: { label: 'Upcoming', description: 'Scheduled after today (UTC)' },
  unassigned: { label: 'Unassigned', description: 'Active leads without an owner or scheduled touchpoint' },
};

interface QueueCount {
  count: number | null;
  code: string | null;
}

function sanitizeDiagnostic(message: string): string {
  return message
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, '[id]')
    .slice(0, 240);
}

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

  const countsPromise = Promise.all([
    countQueue(supabase, 'overdue', start, end, today),
    countQueue(supabase, 'today', start, end, today),
    countQueue(supabase, 'upcoming', start, end, today),
    countQueue(supabase, 'unassigned', start, end, today),
  ]);

  const baseRows = supabase.from('leads').select(`
      id, lead_id, name, company, phone, email, preferred_channel, priority,
      expected_value, next_follow_up, revisit_date, assigned_to, created_at,
      profiles:crm_team_directory!leads_assigned_to_fkey(full_name),
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
  const { data: rawLeads, error: leadsError } = await orderedRows
    .order('id', { ascending: true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const queueCounts = await countsPromise;

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
    assignee_name: (lead.profiles as { full_name?: string } | null)?.full_name || 'Unassigned',
    status_name: (lead.funnel_statuses as { name?: string } | null)?.name || 'Active',
  }));

  const totalCount = queueCounts[['overdue', 'today', 'upcoming', 'unassigned'].indexOf(queue)]?.count ?? null;
  const countError = queueCounts.some((item) => item.code !== null || item.count === null);
  const groupCounts = {
    overdue: queueCounts[0].count,
    today: queueCounts[1].count,
    upcoming: queueCounts[2].count,
    unassigned: queueCounts[3].count,
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headingBlock}>
          <p className={styles.eyebrow}>Commercial Desk / Client relationships</p>
          <h1 className={styles.pageTitle}>Follow-up queue</h1>
          <p className={styles.pageSubtitle}>Work the next client conversation, then move on to the next one.</p>
        </div>
        <Link className={styles.leadsLink} href="/admin/leads">Open leads</Link>
      </header>

      <section className={styles.queueOverview} aria-label="Follow-up counts">
        <div className={styles.queueOverviewHeading}>
          <h2>Today’s workload</h2>
          <span>All counts follow your CRM access and are calculated across matching records.</span>
        </div>
        <nav className={styles.queueTabs} aria-label="Follow-up timing">
          {(Object.keys(QUEUES) as QueueKey[]).map((key) => (
            <Link
              key={key}
              href={pageHref(key, 1)}
              className={`${styles.queueTab} ${queue === key ? styles.queueTabActive : ''}`}
              aria-current={queue === key ? 'page' : undefined}
            >
              <span>{QUEUES[key].label}</span>
              <strong>{groupCounts[key] === null ? '—' : groupCounts[key]!.toLocaleString('en-IN')}</strong>
            </Link>
          ))}
        </nav>
        {countError && <p className={styles.countNotice} role="status">Some totals are unavailable. The records below loaded successfully.</p>}
      </section>

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
            <h3>{totalCount === 0 ? `No ${QUEUES[queue].label.toLowerCase()} follow-ups` : 'No records on this page'}</h3>
            <p>{totalCount === 0 ? 'There are no scheduled client touchpoints in this time range.' : 'Return to the first page or try another queue.'}</p>
            {page > 1 && <Link href={pageHref(queue, 1)}>Return to first page</Link>}
          </div>
        ) : (
          <>
            <div className={styles.tableHead} aria-hidden="true">
              <span>Client and next action</span><span>Stage</span><span>Owner</span><span>Expected value</span><span>Actions</span>
            </div>
            <ol className={styles.taskList} aria-label={`${QUEUES[queue].label} client follow-ups`}>
              {leads.map((lead) => <TaskCard key={lead.id} lead={lead} isUrgent={queue === 'overdue'} allowCompletion={role !== 'viewer'} />)}
            </ol>
          </>
        )}
      </section>

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
