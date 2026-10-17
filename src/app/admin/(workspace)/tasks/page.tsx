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
import { createClient } from '@/app/lib/supabase/server';
import type { LeadPriority } from '@/types/crm';
import styles from './tasks.module.scss';

export const metadata: Metadata = {
  title: 'Follow-up Scheduler & Tasks | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

interface TaskLead {
  id: string;
  lead_id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  preferred_channel: string;
  priority: LeadPriority;
  expected_value: number;
  next_follow_up: string;
  assigned_to: string | null;
  assignee_name?: string;
  status_name?: string;
}

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

  const leads: TaskLead[] = (rawLeads || []).map((l) => ({
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

  const renderTaskCard = (lead: TaskLead, isUrgent = false): React.ReactElement => {
    const priorityClass =
      lead.priority === 'High'
        ? styles.priorityHigh
        : lead.priority === 'Medium'
        ? styles.priorityMedium
        : styles.priorityLow;

    const initials = lead.assignee_name
      ? lead.assignee_name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : 'UN';

    return (
      <div
        key={lead.id}
        className={`${styles.taskCard} ${isUrgent ? styles.urgentCard : ''}`}
      >
        <div className={styles.cardTop}>
          <div className={styles.leadMeta}>
            <h3 className={styles.leadName}>{lead.name}</h3>
            <span className={styles.companyName}>
              {lead.company || 'Direct Engagement'}
            </span>
          </div>
          <span className={`${styles.priorityChip} ${priorityClass}`}>
            {lead.priority}
          </span>
        </div>

        <div className={styles.contactRow}>
          {lead.phone && (
            <div className={styles.contactItem} title={lead.phone}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className={styles.contactItem} title={lead.email}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>{lead.email}</span>
            </div>
          )}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.valuationBox}>
            <span className={styles.valLabel}>Expected Deal</span>
            <span className={styles.valAmount}>
              {formatCurrency(lead.expected_value)}
            </span>
          </div>

          <div className={styles.assigneeBadge}>
            <div className={styles.assigneeAvatar}>{initials}</div>
            <div className={styles.leadMeta}>
              <span className={styles.assigneeName}>{lead.assignee_name}</span>
              <span className={styles.timeDueBadge}>
                {formatDate(lead.next_follow_up)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
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
