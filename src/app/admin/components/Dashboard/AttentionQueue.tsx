import React from 'react';
import Link from 'next/link';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import type { LeadPriority } from '@/types/crm';
import styles from './AttentionQueue.module.scss';

export interface AttentionQueueItem {
  id: string;
  leadId: string;
  name: string;
  company: string | null;
  stage: string;
  priority: LeadPriority;
  expectedValue: number;
  nextFollowUp: string;
}

export interface AttentionQueueProps {
  items: AttentionQueueItem[];
  overdueCount: number | null;
  dueTodayCount: number | null;
  dataStatus: 'ready' | 'unavailable';
}

function formatFollowUp(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Invalid schedule';
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date) + ' UTC';
}

/** Shows the next real client actions and keeps query failure distinct from an empty queue. */
export function AttentionQueue({ items, overdueCount, dueTodayCount, dataStatus }: AttentionQueueProps): React.ReactElement {
  return (
    <section className={styles.queue} aria-labelledby="attention-heading">
      <div className={styles.queueHeader}>
        <div className={styles.headingBlock}>
          <p className={styles.eyebrow}>The next move</p>
          <h2 id="attention-heading" className={styles.heading}>Needs attention</h2>
          <p className={styles.description}>Overdue and today’s scheduled client follow-ups.</p>
        </div>
        {dataStatus === 'ready' && (
          <div className={styles.totals} aria-label="Follow-up totals">
            <span><strong>{overdueCount?.toLocaleString('en-IN') ?? '—'}</strong> overdue</span>
            <span><strong>{dueTodayCount?.toLocaleString('en-IN') ?? '—'}</strong> due today</span>
          </div>
        )}
        <Link className={styles.viewAll} href="/admin/tasks">Open follow-ups <span aria-hidden="true">↗</span></Link>
      </div>

      {dataStatus === 'unavailable' ? (
        <p className={styles.state} role="status">Follow-up activity is unavailable. Open Follow-ups to retry the full queue.</p>
      ) : items.length === 0 ? (
        <p className={styles.state} role="status">No overdue or today’s follow-ups are scheduled.</p>
      ) : (
        <ol className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.row}>
              <Link className={styles.clientLink} href={`/admin/leads?id=${encodeURIComponent(item.id)}`}>
                <span className={styles.clientName}>{item.name}</span>
                <span className={styles.clientMeta}>{item.company || item.leadId}</span>
              </Link>
              <span className={styles.stage}>{item.stage}</span>
              <span className={`${styles.priority} ${item.priority === 'High' ? styles.priorityUrgent : ''}`}>
                {item.priority}
              </span>
              <span className={styles.value}>{formatCrmCurrency(item.expectedValue)}</span>
              <span className={styles.followUp}>{formatFollowUp(item.nextFollowUp)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
