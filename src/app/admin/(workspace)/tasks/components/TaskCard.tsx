/**
 * @file TaskCard.tsx
 * @description Executive workstation row component for follow-up queue tasks.
 *              Enforces Marca Ubi editorial design standards:
 *              - Dignified outline action controls (zero screaming flat-red button spam).
 *              - Accessible 44px minimum touch targets for direct telephony actions (tel:, WhatsApp, mailto:).
 *              - Typographic urgency micro-badges replacing legacy inset colored stripes.
 *              - RFC 3966 telephone coordinate sanitization and WhatsApp deep linking.
 * @module admin/tasks/components/TaskCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

/** Formats ISO follow-up timestamps in UTC canonical representation for commercial auditing. */
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

/** Computes human-readable overdue duration badge (e.g. "Overdue by 18d" or "Due <1h ago"). */
function getUrgencyBadgeText(iso: string | null): string | null {
  if (!iso) return null;
  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return null;

  const now = Date.now();
  const diffMs = now - timestamp;
  if (diffMs <= 0) return null;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days >= 1) {
    return `Overdue by ${days}d`;
  }
  if (hours >= 1) {
    return `Overdue by ${hours}h`;
  }
  return 'Due <1h ago';
}

/** Extracts uppercase initials for representative coin avatar. */
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
  const overdueBadge = isUrgent ? getUrgencyBadgeText(lead.next_follow_up) : null;

  const priorityClass = lead.priority === 'High'
    ? styles.priorityHigh
    : lead.priority === 'Medium'
      ? styles.priorityMedium
      : styles.priorityLow;

  function handleOpenDrawer(e: React.MouseEvent): void {
    e.preventDefault();
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
        console.error('[tasks] Follow-up completion failed', {
          errorType: cause instanceof Error ? cause.name : 'unknown',
        });
        setError('Could not complete this follow-up. Refresh and try again.');
      }
    });
  }

  return (
    <li className={`${styles.taskItem} ${isDone ? styles.taskItemDone : ''}`}>
      {/* Primary Client Entity Coordinates */}
      <div className={styles.clientCell}>
        <div className={styles.clientHeading}>
          <Link
            href={`/admin/leads/${lead.id}`}
            onClick={handleOpenDrawer}
            className={styles.leadOpenButton}
            aria-label={`Open dossier for ${lead.name}`}
          >
            {lead.name}
          </Link>
          <span className={`${styles.priorityChip} ${priorityClass}`}>
            {lead.priority} priority
          </span>
          {overdueBadge && (
            <span className={styles.urgencyBadge} role="status">
              {overdueBadge}
            </span>
          )}
        </div>

        <span className={styles.companyName}>
          {lead.company || 'Enterprise entity not provided'}
        </span>

        <span className={styles.dueLine}>
          <span className={styles.scheduleIcon} aria-hidden="true">⏱</span>
          {lead.next_follow_up ? formatFollowUp(lead.next_follow_up) : 'No follow-up scheduled'}
        </span>

        {/* 44px Minimum Accessible Telephony & Omnichannel Dock */}
        {(lead.phone || lead.email) && (
          <div className={styles.telephonyDock} aria-label={`Contact coordinates for ${lead.name}`}>
            {safePhone && (
              <a
                href={`tel:${safePhone}`}
                className={styles.telephonyAction}
                aria-label={`Direct telephone call to ${lead.name} at ${safePhone}`}
                title={`Call ${safePhone}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>Call</span>
              </a>
            )}

            {whatsappPhone && (
              <a
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello ${lead.name}, reaching out from Marca Ubi regarding your project inquiries.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.telephonyAction}
                aria-label={`Direct WhatsApp conversation with ${lead.name}`}
                title="Open WhatsApp chat"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                <span>WhatsApp</span>
              </a>
            )}

            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className={styles.telephonyAction}
                aria-label={`Dispatch email correspondence to ${lead.email}`}
                title={`Email ${lead.email}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>Email</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Commercial Stage */}
      <div className={styles.stageCell}>
        <span className={styles.cellLabel}>Stage</span>
        <span className={styles.stagePill}>{lead.status_name || 'Active Ingestion'}</span>
      </div>

      {/* Designated Rep / Account Owner */}
      <div className={styles.ownerCell}>
        <span className={styles.cellLabel}>Account Executive</span>
        <div className={styles.ownerValue}>
          <span className={styles.ownerInitials} aria-hidden="true">
            {initialsFor(lead.assignee_name)}
          </span>
          <span className={styles.ownerNameText}>{lead.assignee_name || 'Unassigned'}</span>
        </div>
      </div>

      {/* Institutional Valuation */}
      <div className={styles.valueCell}>
        <span className={styles.cellLabel}>Expected Scope</span>
        <strong className={styles.monetaryValuation}>
          {formatCrmCurrency(lead.expected_value)}
        </strong>
      </div>

      {/* Workstation Actions: Editorial Ghost / Outline Controls */}
      <div className={styles.actionsCell}>
        <Link
          href={`/admin/leads/${lead.id}`}
          onClick={handleOpenDrawer}
          className={styles.openButton}
          aria-label={`View 360 dossier for ${lead.name}`}
        >
          View dossier
        </Link>

        {allowCompletion && lead.next_follow_up && (
          <button
            type="button"
            className={`${styles.completeButton} ${isDone ? styles.completeButtonDone : ''}`}
            onClick={completeFollowUp}
            disabled={isPending || isDone}
            aria-label={isDone ? `Follow-up completed for ${lead.name}` : `Mark follow-up complete for ${lead.name}`}
          >
            {isPending ? 'Saving…' : isDone ? 'Completed ✓' : 'Mark complete'}
          </button>
        )}

        {error && (
          <p className={styles.actionError} role="alert">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}
