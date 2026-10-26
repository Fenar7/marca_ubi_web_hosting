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
import { clearLeadFollowUp } from '@/app/actions/leads';
import type { LeadPriority } from '@/types/crm';
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
  assigned_to: string | null;
  assignee_name?: string;
  status_name?: string;
}

interface TaskCardProps {
  lead: TaskLeadItem;
  isUrgent?: boolean;
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

export function TaskCard({ lead, isUrgent = false }: TaskCardProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState<boolean>(false);

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
    startTransition(async () => {
      const result = await clearLeadFollowUp(lead.id);
      if (result.success) {
        setIsDone(true);
      }
    });
  };

  if (isDone) {
    return (
      <div
        className={styles.taskCard}
        style={{
          opacity: 0.6,
          background: 'rgba(34, 197, 94, 0.05)',
          borderColor: 'rgba(34, 197, 94, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontSize: '0.85rem', fontWeight: 600 }}>
          <span>✓</span>
          <span>Follow-up completed for {lead.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.taskCard} ${isUrgent ? styles.urgentCard : ''}`}
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleCardClick();
      }}
      aria-label={`Open client dossier for ${lead.name}`}
      title="Click to inspect Client 360 dossier"
    >
      <div className={styles.cardTop}>
        <div className={styles.leadMeta}>
          <h3 className={styles.leadName}>{lead.name}</h3>
          <span className={styles.companyName}>
            {lead.company || 'Direct Client Engagement'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span className={`${styles.priorityChip} ${priorityClass}`}>
            {lead.priority}
          </span>
          <button
            type="button"
            className={styles.markDoneButton}
            onClick={handleMarkDone}
            disabled={isPending}
            title="Mark touchpoint completed"
          >
            {isPending ? '...' : '✓ Done'}
          </button>
        </div>
      </div>

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
                style={{
                  color: '#22c55e',
                  textDecoration: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  marginLeft: '0.35rem',
                }}
                onClick={(e) => e.stopPropagation()}
                title="Open WhatsApp chat"
              >
                (WA)
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
    </div>
  );
}
