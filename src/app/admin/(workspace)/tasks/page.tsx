/**
 * @file page.tsx
 * @description Follow-up Tasks & Prospect Scheduler Workspace (/admin/tasks).
 *              Queries commercial deals with scheduled touchpoints, categorizing them
 *              into Overdue, Due Today, and Upcoming with direct outreach coordinates.
 * @module app/admin/(workspace)/tasks/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import type { CrmUserRole, LeadPriority } from '@/types/crm';
import { TaskCard, type TaskLeadItem } from './components/TaskCard';
import styles from './tasks.module.scss';

export const metadata: Metadata = {
  title: 'Follow-up Scheduler & Tasks | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default async function AdminTasksPage(): Promise<React.ReactElement> {
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

  const role = (profile?.role as CrmUserRole) || 'viewer';
  const allowedTabs = profile?.allowed_tabs as string[] | undefined;

  const hasTasksAccess = Array.isArray(allowedTabs)
    ? allowedTabs.includes('tasks')
    : role !== 'viewer';

  if (!hasTasksAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Query leads with scheduled touchpoints in active pipeline buckets
  const { data: rawLeads } = await supabase
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
      assigned_to,
      profiles!leads_assigned_to_fkey(full_name),
      funnel_statuses!inner(name, bucket)
    `)
    .not('next_follow_up', 'is', null)
    .in('funnel_statuses.bucket', ['open', 'potential'])
    .order('next_follow_up', { ascending: true });

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
    assigned_to: l.assigned_to,
    assignee_name: (l.profiles as { full_name?: string } | null)?.full_name || 'Unassigned',
    status_name: (l.funnel_statuses as { name?: string } | null)?.name || 'Active',
  }));

  const overdue = leads.filter((l) => new Date(l.next_follow_up) < startOfToday);
  const dueToday = leads.filter((l) => {
    const d = new Date(l.next_follow_up);
    return d >= startOfToday && d <= endOfToday;
  });
  const upcoming = leads.filter((l) => new Date(l.next_follow_up) > endOfToday);

  const renderTaskCard = (lead: TaskLeadItem, isUrgent = false): React.ReactElement => {
    return <TaskCard key={lead.id} lead={lead} isUrgent={isUrgent} />;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Client Outreach & Cadence</span>
          <h1 className={styles.pageTitle}>Follow-up Queue & Scheduler</h1>
          <p className={styles.pageSubtitle}>
            Prioritized touchpoints, scheduled calls, and overdue client follow-ups across the agency roster.
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

      <div className={styles.taskSections}>
        {/* Section 1: Overdue Touchpoints */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span style={{ color: '#ef4444' }}>●</span>
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
              <span style={{ color: '#f59e0b' }}>●</span>
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
              <span style={{ color: '#22c55e' }}>●</span>
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
