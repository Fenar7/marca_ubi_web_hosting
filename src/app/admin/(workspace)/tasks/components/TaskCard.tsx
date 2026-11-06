'use client';

/**
 * @file TaskCard.tsx
 * @description Interactive Client Component for follow-up task cards.
 *              Dispatches 'open-lead-drawer' to open the Client 360 Dossier,
 *              provides click-to-call and mailto links, and features a 1-click
 *              touchpoint clearance trigger calling clearLeadFollowUp Server Action.
 * @module app/admin/(workspace)/tasks/components/TaskCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { clearLeadFollowUp } from '@/app/actions/leads';
import type { LeadPriority } from '@/types/crm';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import styles from '../tasks.module.scss';

export interface TaskLeadItem {
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
  revisit_date?: string | null;
  assigned_to: string | null;
  assignee_name?: string;
  status_name?: string;
}

interface TaskCardProps {
  lead: TaskLeadItem;
  isUrgent?: boolean;
  allowCompletion: boolean;
}

function formatCurrency(amount: number): string {
  return formatCrmCurrency(amount);
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    });
  } catch {
    return iso;
  }
}

export function TaskCard({ lead, isUrgent = false, allowCompletion }: TaskCardProps): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';

  const handleCardClick = (): void => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-lead-drawer', { detail: { leadId: lead.id } })
      );
    }
  };

  const handleMarkDone = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setError(null);
    startTransition(async () => {
      try {
        const result = await clearLeadFollowUp(lead.id, lead.next_follow_up);
        if (!result.success) {
          setError(result.error || 'Could not complete this follow-up. Please try again.');
          return;
        }
        setIsDone(true);
        router.refresh();
      } catch (err) {
        console.error('[tasks] Follow-up completion failed:', err);
        setError('Could not complete this follow-up. Please try again.');
      }
    });
  };

  if (isDone) {
    return (
      <article className={styles.taskCard} role="status">
        <p className={styles.completedMessage}>Follow-up completed for {lead.name}.</p>
      </article>
    );
  }

  return (
    <article className={`${styles.taskCard} ${isUrgent ? styles.urgentCard : ''}`}>
      <div className={styles.cardTop}>
        <div className={styles.leadMeta}>
          <h3 className={styles.leadName}>
            <button type="button" className={styles.leadOpenButton} onClick={handleCardClick}>
              {lead.name}
            </button>
          </h3>
          <span className={styles.companyName}>
            {lead.company || 'Direct Client Engagement'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span className={`${styles.priorityChip} ${priorityClass}`}>
            {lead.priority}
          </span>
          {allowCompletion && <button
            type="button"
            className={styles.markDoneButton}
            onClick={handleMarkDone}
            disabled={isPending}
            title="Mark touchpoint completed"
          >
            {isPending ? 'Saving…' : 'Mark done'}
          </button>}
        </div>
      </div>
      {error && <p className={styles.actionError} role="alert">{error}</p>}

      <div className={styles.contactRow}>
        {lead.phone && (
          <div className={styles.contactItem} title={lead.phone}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <a
              href={`tel:${lead.phone}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              {lead.phone}
            </a>
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappLink}
                onClick={(e) => e.stopPropagation()}
                title="Open WhatsApp chat"
              >
                WhatsApp
              </a>
            )}
          </div>
        )}
        {lead.email && (
          <div className={styles.contactItem} title={lead.email}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <a
              href={`mailto:${lead.email}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              {lead.email}
            </a>
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
    </article>
  );
}
