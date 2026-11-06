/**
 * @file page.tsx
 * @description Follow-up Tasks & Prospect Scheduler Workspace (/admin/tasks).
 *              Queries commercial deals with scheduled touchpoints, categorizing them
 *              into Overdue, Due Today, and Upcoming with direct outreach coordinates.
 * @module app/admin/(workspace)/tasks/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { ROLE_DEFAULT_TABS, type CrmUserRole, type LeadPriority } from '@/types/crm';
import { TaskCard, type TaskLeadItem } from './components/TaskCard';
import { ResultPagination } from '@/app/admin/components/LeadsTable/ResultPagination';
import styles from './tasks.module.scss';

export const metadata: Metadata = {
  title: 'Follow-up Scheduler & Tasks | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminTasksPage(props: { searchParams?: Promise<{ page?: string }> }): Promise<React.ReactElement> {
  const resolvedSearchParams = props.searchParams ? await props.searchParams : undefined;
  const requestedPage = Number(resolvedSearchParams?.page ?? '1');
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  const pageSize = 100;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login?next=%2Fadmin%2Ftasks');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, allowed_tabs')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.status !== 'active') {
    redirect('/admin/login?error=account_suspended');
  }

  const role = (profile?.role as CrmUserRole) || 'viewer';
  const allowedTabs = profile?.allowed_tabs as string[] | undefined;

  const hasTasksAccess = role === 'admin' || (Array.isArray(allowedTabs) && allowedTabs.length > 0
    ? allowedTabs.includes('tasks')
    : Boolean(ROLE_DEFAULT_TABS[role]?.tasks));

  if (!hasTasksAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endOfToday = new Date(startOfToday.getTime() + 86_400_000 - 1);

  // Query leads with scheduled touchpoints in active pipeline buckets
  const { data: rawLeads, error: leadsError, count } = await supabase
    .from('leads')
    .select(`
      id,
      lead_id,
      name,
      company,
      phone,
      email,
      preferred_channel,
      priority,
      expected_value,
      next_follow_up,
      revisit_date,
      assigned_to,
      profiles:crm_team_directory!leads_assigned_to_fkey(full_name),
      funnel_statuses!inner(name, bucket)
    `, { count: 'exact' })
    .not('next_follow_up', 'is', null)
    .in('funnel_statuses.bucket', ['open', 'potential'])
    .order('next_follow_up', { ascending: true })
    .order('id', { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (leadsError || count === null) {
    console.error('[tasks] Failed to load follow-ups:', leadsError?.message ?? 'Exact count was unavailable.');
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.eyebrow}>Client relationships</span>
            <h1 className={styles.pageTitle}>Follow-ups</h1>
          </div>
        </header>
        <p className={styles.dataError} role="alert">Follow-ups could not be loaded. Refresh the page to try again.</p>
      </div>
    );
  }

  const leads: TaskLeadItem[] = (rawLeads || []).map((l) => ({
    id: l.id,
    lead_id: l.lead_id,
    name: l.name,
    company: l.company,
    phone: l.phone,
    email: l.email,
    preferred_channel: l.preferred_channel || 'Email',
    priority: (l.priority as LeadPriority) || 'Medium',
    expected_value: Number(l.expected_value) || 0,
    next_follow_up: l.next_follow_up,
    revisit_date: l.revisit_date,
    assigned_to: l.assigned_to,
    assignee_name: (l.profiles as { full_name?: string } | null)?.full_name || 'Unassigned',
    status_name: (l.funnel_statuses as { name?: string } | null)?.name || 'Active',
  }));

  const todayUtc = startOfToday.toISOString().slice(0, 10);
  const visibleLeads = leads.filter((lead) => !(lead.status_name?.toLowerCase() === 'on hold' && lead.revisit_date && lead.revisit_date > todayUtc));
  const overdue = visibleLeads.filter((l) => new Date(l.next_follow_up) < startOfToday);
  const dueToday = visibleLeads.filter((l) => {
    const d = new Date(l.next_follow_up);
    return d >= startOfToday && d <= endOfToday;
  });
  const upcoming = visibleLeads.filter((l) => new Date(l.next_follow_up) > endOfToday);

  const renderTaskCard = (lead: TaskLeadItem, isUrgent = false): React.ReactElement => {
    return <TaskCard key={lead.id} lead={lead} isUrgent={isUrgent} allowCompletion={role !== 'viewer'} />;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Client relationships</span>
          <h1 className={styles.pageTitle}>Follow-ups</h1>
          <p className={styles.pageSubtitle}>
            Keep track of the conversations that need your attention.
          </p>
        </div>

        <div className={styles.summaryRibbon}>
          <div className={`${styles.summaryPill} ${styles.pillRed}`}>
            <span>Overdue:</span>
            <strong>{overdue.length}</strong>
          </div>
          <div className={`${styles.summaryPill} ${styles.pillAmber}`}>
            <span>Due Today:</span>
            <strong>{dueToday.length}</strong>
          </div>
          <div className={`${styles.summaryPill} ${styles.pillEmerald}`}>
            <span>Upcoming:</span>
            <strong>{upcoming.length}</strong>
          </div>
        </div>
      </header>

      <Suspense fallback={null}><ResultPagination page={page} pageSize={pageSize} loadedCount={leads.length} totalCount={count} scopeDescription="Due date groups and counts apply to this page. Times are shown in UTC; on-hold leads with a future revisit date are hidden." /></Suspense>

      <div className={styles.taskSections}>
        {/* Section 1: Overdue Touchpoints */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>Overdue Follow-ups</span>
              <span className={`${styles.taskCountBadge} ${styles.pillRed}`}>
                {overdue.length}
              </span>
            </h2>
          </div>
          {overdue.length === 0 ? (
            <div className={styles.emptyBlock}>
              <span>Zero overdue follow-ups. All past touchpoints are cleared.</span>
            </div>
          ) : (
            <div className={styles.tasksGrid}>
              {overdue.map((lead) => renderTaskCard(lead, true))}
            </div>
          )}
        </section>

        {/* Section 2: Due Today */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>Scheduled For Today</span>
              <span className={`${styles.taskCountBadge} ${styles.pillAmber}`}>
                {dueToday.length}
              </span>
            </h2>
          </div>
          {dueToday.length === 0 ? (
            <div className={styles.emptyBlock}>
              <span>No additional client touchpoints scheduled for today.</span>
            </div>
          ) : (
            <div className={styles.tasksGrid}>
              {dueToday.map((lead) => renderTaskCard(lead, false))}
            </div>
          )}
        </section>

        {/* Section 3: Upcoming Schedule */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>Upcoming Cadence</span>
              <span className={`${styles.taskCountBadge} ${styles.pillEmerald}`}>
                {upcoming.length}
              </span>
            </h2>
          </div>
          {upcoming.length === 0 ? (
            <div className={styles.emptyBlock}>
              <span>No upcoming scheduled follow-ups logged in the system.</span>
            </div>
          ) : (
            <div className={styles.tasksGrid}>
              {upcoming.map((lead) => renderTaskCard(lead, false))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
