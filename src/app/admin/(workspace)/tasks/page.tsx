/**
 * @file page.tsx
 * @description Follow-ups workspace page for Marca Ubi Enterprise CRM.
 *              Eliminates sequential request waterfalls by executing queue counts, overdue exposure,
 *              lead payloads, SLA threshold, and directory mappings concurrently via Promise.all
 *              and React 19 Suspense streaming.
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
import { dashboardFeature, dashboardTab, foldDashboardPages } from '@/app/admin/lib/dashboardContracts';
import { getCrmDirectoryList, getCrmDirectoryMap } from '@/app/admin/lib/crmDirectory';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import { TaskCard, type TaskLeadItem } from './components/TaskCard';
import styles from './tasks.module.scss';

export const metadata: Metadata = {
  title: 'Follow-ups | Marca Ubi Enterprise CRM',
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 50;
const MAX_PAGE = 100_000;
const SYNTHETIC_EXCLUSION = 'brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true';

type QueueKey = FollowUpQueue;
type SearchParams = Promise<{ page?: string; queue?: string }>;

const QUEUES: Record<QueueKey, { label: string; hint: string; description: string }> = {
  overdue: {
    label: 'Overdue',
    hint: 'Needs immediate follow-up',
    description: 'Scheduled before today',
  },
  today: {
    label: 'Due Today',
    hint: 'Scheduled for today',
    description: 'Scheduled for today',
  },
  upcoming: {
    label: 'Upcoming',
    hint: 'Scheduled ahead',
    description: 'Scheduled after today',
  },
  unassigned: {
    label: 'Unassigned',
    hint: 'Needs an owner',
    description: 'Active leads without an owner',
  },
};

/** Renders a domain-specific 18px inline SVG badge icon for each queue card without icon-library bloat. */
function QueueCardIcon({ queue }: { queue: QueueKey }): React.ReactElement {
  if (queue === 'overdue') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 1.5" />
        <path d="M5 3 2 6" />
        <path d="m22 6-3-3" />
      </svg>
    );
  }
  if (queue === 'today') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    );
  }
  if (queue === 'upcoming') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}

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

/** Calculates total at-risk pipeline monetary valuation across all overdue follow-ups via pagination. */
async function fetchOverdueExposure(
  supabase: Awaited<ReturnType<typeof createClient>>,
  start: string,
  today: string,
  canViewFinancials: boolean
): Promise<number | null> {
  if (!canViewFinancials) return null;
  try {
    const summary = await foldDashboardPages<{ expected_value?: number | string }, { total: number }>(
      async (from, to) => {
        const res = await supabase
          .from('leads')
          .select('id, expected_value, funnel_statuses!inner(bucket)')
          .in('funnel_statuses.bucket', ['open', 'potential'])
          .or(`and(or(revisit_date.is.null,revisit_date.lte.${today}),or(${SYNTHETIC_EXCLUSION}))`)
          .not('next_follow_up', 'is', null)
          .lt('next_follow_up', start)
          .order('id')
          .range(from, to);
        return {
          data: res.data as unknown as Array<{ expected_value?: number | string }> | null,
          error: res.error,
        };
      },
      { total: 0 },
      (acc, row) => {
        acc.total += Number(row.expected_value) || 0;
      }
    );
    return summary ? summary.total : null;
  } catch {
    return null;
  }
}

/** Fetches paginated lead rows for the active queue segment. */
async function fetchQueueLeads(
  supabase: Awaited<ReturnType<typeof createClient>>,
  queue: QueueKey,
  page: number,
  start: string,
  end: string,
  today: string,
  canViewFinancials: boolean
) {
  const selectCols = canViewFinancials
    ? `id, lead_id, name, company, phone, email, preferred_channel, priority, expected_value, next_follow_up, revisit_date, assigned_to, created_at, funnel_statuses!inner(name, bucket)`
    : `id, lead_id, name, company, phone, email, preferred_channel, priority, next_follow_up, revisit_date, assigned_to, created_at, funnel_statuses!inner(name, bucket)`;

  const baseRows = supabase
    .from('leads')
    .select(selectCols)
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
    .select('role, status, allowed_tabs, feature_permissions')
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

  const canViewFinancials = dashboardFeature(
    role,
    profile.feature_permissions,
    'can_view_financials'
  );
  const canAccessDeals = dashboardTab(role, allowedTabs, 'deals');
  const canAssign = role === 'admin' || role === 'sales_manager';
  const showUnassignedQueue = role !== 'sales_executive';

  const requestNow = new Date();
  const referenceNowMs = requestNow.getTime();
  const { start, end, date: today } = getUtcDayWindow(requestNow);

  // Waterfall Elimination: Execute queue counts, paginated overdue exposure, SLA settings, lead rows, and directory in parallel
  const [
    overdueCount,
    todayCount,
    upcomingCount,
    unassignedCount,
    overdueExposure,
    leadsResult,
    ownerNameById,
    teamDirectory,
    slaSettingsResult,
  ] = await Promise.all([
    countQueue(supabase, 'overdue', start, end, today),
    countQueue(supabase, 'today', start, end, today),
    countQueue(supabase, 'upcoming', start, end, today),
    showUnassignedQueue
      ? countQueue(supabase, 'unassigned', start, end, today)
      : Promise.resolve({ count: 0, code: null }),
    fetchOverdueExposure(supabase, start, today, canViewFinancials),
    fetchQueueLeads(supabase, queue, page, start, end, today, canViewFinancials),
    getCrmDirectoryMap(supabase),
    canAssign ? getCrmDirectoryList(supabase, ['admin', 'sales_manager', 'sales_executive']) : Promise.resolve([]),
    supabase.from('agency_settings').select('lead_response_sla_minutes').limit(1).maybeSingle(),
  ]);

  const teamAssignees = teamDirectory.map((m) => ({ id: m.id, full_name: m.full_name }));
  const slaMinutes = slaSettingsResult.data?.lead_response_sla_minutes ?? 60;

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

  const leads: TaskLeadItem[] = (rawLeads as unknown as Array<{
    id: string;
    lead_id: string;
    name: string;
    company: string | null;
    phone: string | null;
    email: string | null;
    preferred_channel: string | null;
    priority: string | null;
    expected_value?: number | string | null;
    next_follow_up: string | null;
    revisit_date: string | null;
    assigned_to: string | null;
    created_at: string | null;
    funnel_statuses?: { name?: string; bucket?: string } | null;
  }>).map((lead) => ({
    id: lead.id,
    lead_id: lead.lead_id,
    name: lead.name,
    company: lead.company,
    phone: lead.phone,
    email: lead.email,
    preferred_channel: lead.preferred_channel || 'Email',
    priority: (lead.priority as LeadPriority) || 'Medium',
    expected_value: canViewFinancials ? Number(lead.expected_value) || 0 : 0,
    next_follow_up: lead.next_follow_up,
    revisit_date: lead.revisit_date,
    assigned_to: lead.assigned_to,
    created_at: lead.created_at,
    assignee_name: (lead.assigned_to && ownerNameById.get(lead.assigned_to)) || 'Unassigned',
    status_name: lead.funnel_statuses?.name || 'New Lead',
    status_bucket: lead.funnel_statuses?.bucket || 'open',
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

  const visibleQueues: QueueKey[] = showUnassignedQueue
    ? (['overdue', 'today', 'upcoming', 'unassigned'] as QueueKey[])
    : (['overdue', 'today', 'upcoming'] as QueueKey[]);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headingBlock}>
          <h1 className={styles.pageTitle}>Follow-ups</h1>
          <p className={styles.pageSubtitle}>
            Stay on top of overdue, today&apos;s, and upcoming client calls.
          </p>
        </div>
        <Link className={styles.leadsLink} href="/admin/leads">
          View all leads
        </Link>
      </header>

      <section className={styles.queueOverview} aria-label="Follow-up queues">
        <nav className={styles.queueTabs} aria-label="Follow-up timing">
          {visibleQueues.map((key) => {
            const count = groupCounts[key];
            const isSelected = queue === key;
            return (
              <Link
                key={key}
                href={pageHref(key, 1)}
                data-queue={key}
                data-active={isSelected ? 'true' : 'false'}
                className={`${styles.queueTab} ${isSelected ? styles.queueTabActive : ''}`}
                aria-current={isSelected ? 'page' : undefined}
              >
                <div className={styles.queueTabBody}>
                  <div className={styles.queueTabLabelRow}>
                    <span className={styles.queueTabTitle}>{QUEUES[key].label}</span>
                    {isSelected && <span className={styles.queueViewingChip}>Viewing</span>}
                  </div>
                  <strong className={styles.queueTabCount}>
                    {count === null ? '--' : count.toLocaleString('en-IN')}
                  </strong>
                  <span className={styles.queueTabHint}>{QUEUES[key].hint}</span>
                </div>
                <span className={styles.queueTabIcon} data-queue-icon={key} aria-hidden="true">
                  <QueueCardIcon queue={key} />
                </span>
              </Link>
            );
          })}
        </nav>

        {countError && (
          <p className={styles.countNotice} role="status">
            Some queue totals are temporarily unavailable. The active records below loaded successfully.
          </p>
        )}
      </section>

      <Suspense fallback={<div className={styles.loadingRows} aria-hidden="true">{[1, 2, 3, 4].map((i) => <div key={i} className={styles.loadingRow} />)}</div>}>
        <section className={styles.workSection} aria-labelledby="work-heading">
          <div className={styles.workSectionHeader}>
            <div className={styles.workSectionTitleBlock}>
              <div className={styles.workSectionTitleRow}>
                <h2 id="work-heading">{QUEUES[queue].label}</h2>
                <span className={styles.workCountPill}>
                  {totalCount === null
                    ? 'Count unavailable'
                    : `${totalCount.toLocaleString('en-IN')} ${totalCount === 1 ? 'lead' : 'leads'}`}
                </span>
              </div>
              <p className={styles.workSectionDesc}>{QUEUES[queue].description}</p>
            </div>
            <div className={styles.workSectionMeta}>
              {canViewFinancials && overdueExposure !== null && (
                <span className={styles.exposurePill}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                  </svg>
                  <span>{formatCrmCurrency(overdueExposure)} overdue value</span>
                </span>
              )}
              <span className={styles.timezoneLabel}>Times in UTC</span>
            </div>
          </div>

          {leads.length === 0 ? (
            <div className={styles.emptyState}>
              <div>
                <h3>{totalCount === 0 ? `No ${QUEUES[queue].label.toLowerCase()} follow-ups` : 'No records on this page'}</h3>
                <p>
                  {queue === 'unassigned' && role === 'sales_executive'
                    ? 'Unassigned leads are managed by Administrators and Sales Managers.'
                    : totalCount === 0
                      ? 'There are no scheduled client calls in this queue.'
                      : 'Return to the first page or switch to another queue.'}
                </p>
              </div>
              {page > 1 && <Link href={pageHref(queue, 1)}>Return to first page</Link>}
            </div>
          ) : (
            <>
              <div className={styles.tableHead} aria-hidden="true">
                <span>Lead & Contact</span>
                <span>Stage</span>
                <span>Owner</span>
                <span>Deal Value</span>
                <span className={styles.tableActionsColHeader}>Actions</span>
              </div>
              <ol className={styles.taskList} aria-label={`${QUEUES[queue].label} client follow-ups`}>
                {leads.map((lead) => (
                  <TaskCard
                    key={lead.id}
                    lead={lead}
                    isUrgent={queue === 'overdue'}
                    allowCompletion={role !== 'viewer'}
                    canViewFinancials={canViewFinancials}
                    canAccessDeals={canAccessDeals}
                    canAssign={canAssign}
                    teamAssignees={teamAssignees}
                    referenceNowMs={referenceNowMs}
                    slaMinutes={slaMinutes}
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
          <h1 className={styles.pageTitle}>Follow-ups</h1>
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
