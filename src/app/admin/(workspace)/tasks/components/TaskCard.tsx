'use client';

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
  next_follow_up: string | null;
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

function formatFollowUp(iso: string): string {
  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return 'Time unavailable';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(timestamp);
}

function initialsFor(name: string | undefined): string {
  if (!name?.trim()) return '—';
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function TaskCard({ lead, isUrgent = false, allowCompletion }: TaskCardProps): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const safePhone = lead.phone?.replace(/[^\d+*#]/g, '') ?? '';
  const whatsappPhone = lead.phone?.replace(/\D/g, '') ?? '';
  const priorityClass = lead.priority === 'High'
    ? styles.priorityHigh
    : lead.priority === 'Medium'
      ? styles.priorityMedium
      : styles.priorityLow;

  function openLead(): void {
    window.dispatchEvent(new CustomEvent('open-lead-drawer', { detail: { leadId: lead.id } }));
  }

  function completeFollowUp(): void {
    setError(null);
    startTransition(async () => {
      try {
        if (!lead.next_follow_up) {
          setError('Schedule a follow-up before marking this lead complete.');
          return;
        }
        const result = await clearLeadFollowUp(lead.id, lead.next_follow_up);
        if (!result.success) {
          setError(result.error || 'Could not complete this follow-up. Refresh and try again.');
          return;
        }
        setIsDone(true);
        router.refresh();
      } catch (cause: unknown) {
        console.error('[tasks] Follow-up completion failed', { errorType: cause instanceof Error ? cause.name : 'unknown' });
        setError('Could not complete this follow-up. Refresh and try again.');
      }
    });
  }

  return (
    <li className={`${styles.taskItem} ${isUrgent ? styles.taskItemUrgent : ''} ${isDone ? styles.taskItemDone : ''}`}>
      <div className={styles.clientCell}>
        <div className={styles.clientHeading}>
          <button type="button" className={styles.leadOpenButton} onClick={openLead} aria-label={`Open lead ${lead.name}`}>
            {lead.name}
          </button>
          <span className={`${styles.priorityChip} ${priorityClass}`}>{lead.priority} priority</span>
        </div>
        <span className={styles.companyName}>{lead.company || 'Company not provided'}</span>
        <span className={styles.dueLine}>{lead.next_follow_up ? formatFollowUp(lead.next_follow_up) : 'No follow-up scheduled'}</span>
        {(lead.phone || lead.email) && (
          <div className={styles.contactLinks} aria-label="Contact details">
            {lead.phone && <a href={`tel:${safePhone}`}>Call</a>}
            {lead.email && <a href={`mailto:${lead.email}`}>Email</a>}
            {whatsappPhone && <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
          </div>
        )}
      </div>

      <div className={styles.stageCell}>
        <span className={styles.cellLabel}>Stage</span>
        <span>{lead.status_name || 'Stage unavailable'}</span>
      </div>

      <div className={styles.ownerCell}>
        <span className={styles.cellLabel}>Owner</span>
        <span className={styles.ownerValue}>
          <span className={styles.ownerInitials} aria-hidden="true">{initialsFor(lead.assignee_name)}</span>
          {lead.assignee_name || 'Unassigned'}
        </span>
      </div>

      <div className={styles.valueCell}>
        <span className={styles.cellLabel}>Expected value</span>
        <strong>{formatCrmCurrency(lead.expected_value)}</strong>
      </div>

      <div className={styles.actionsCell}>
        <button type="button" className={styles.openButton} onClick={openLead}>Open lead</button>
        {allowCompletion && lead.next_follow_up && (
          <button type="button" className={styles.completeButton} onClick={completeFollowUp} disabled={isPending || isDone}>
            {isPending ? 'Saving…' : isDone ? 'Completed' : 'Complete'}
          </button>
        )}
        {error && <p className={styles.actionError} role="alert">{error}</p>}
      </div>
    </li>
  );
}
