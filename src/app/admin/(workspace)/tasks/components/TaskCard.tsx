/**
 * @file TaskCard.tsx
 * @description Follow-up row component for `/admin/tasks`.
 *              Supports direct contact actions (tel:, WhatsApp, mailto:), inline owner assignment,
 *              follow-up completion with mandatory next-step choice, and rescheduling via FollowUpScheduler.
 * @module admin/tasks/components/TaskCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clearLeadFollowUp, updateLeadAssignee } from '@/app/actions/leads';
import { logLeadActivityAction } from '@/app/actions/leadActivityActions';
import { scheduleFollowUpAction } from '@/app/actions/schedulerActions';
import { FollowUpScheduler } from '@/app/admin/components/Scheduler';
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
  created_at?: string | null;
  assignee_name?: string;
  status_name?: string;
  status_bucket?: string;
}

interface TaskCardProps {
  lead: TaskLeadItem;
  isUrgent?: boolean;
  allowCompletion: boolean;
  canViewFinancials?: boolean;
  canAccessDeals?: boolean;
  canAssign?: boolean;
  teamAssignees?: Array<{ id: string; full_name: string }>;
  referenceNowMs?: number | null;
  slaMinutes?: number;
}

/** Formats ISO follow-up timestamps in UTC for consistent scheduling across time zones. */
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
function getUrgencyBadgeText(iso: string | null, referenceNowMs: number | null): string | null {
  if (!iso || referenceNowMs === null || !Number.isFinite(referenceNowMs)) return null;
  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return null;

  const diffMs = referenceNowMs - timestamp;
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

/** Computes an SLA breach badge for unassigned leads waiting longer than the configured response SLA. */
function getSlaBreachBadgeText(
  createdAt: string | null | undefined,
  referenceNowMs: number | null,
  slaMinutes: number | undefined
): string | null {
  if (!createdAt || referenceNowMs === null || !Number.isFinite(referenceNowMs) || !slaMinutes || slaMinutes <= 0) {
    return null;
  }
  const createdMs = Date.parse(createdAt);
  if (!Number.isFinite(createdMs)) return null;

  const diffMs = referenceNowMs - createdMs;
  if (diffMs <= slaMinutes * 60 * 1000) return null;

  const totalMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMins / 60);
  const days = Math.floor(hours / 24);

  if (days >= 1) return `Unclaimed ${days}d`;
  if (hours >= 1) return `Unclaimed ${hours}h`;
  return `Unclaimed ${totalMins}m`;
}

/** Maps lead stage bucket/name to a semantic soft-tinted badge tone. */
function getStageTone(statusName?: string, statusBucket?: string): 'positive' | 'progress' | 'neutral' {
  const normalized = (statusName || '').toLowerCase();
  if (
    statusBucket === 'potential' ||
    statusBucket === 'converted' ||
    normalized.includes('won') ||
    normalized.includes('qualified') ||
    normalized.includes('hot')
  ) {
    return 'positive';
  }
  if (
    normalized.includes('proposal') ||
    normalized.includes('negotiat') ||
    normalized.includes('contact') ||
    normalized.includes('meeting') ||
    normalized.includes('discovery') ||
    normalized.includes('follow')
  ) {
    return 'progress';
  }
  return 'neutral';
}

/** Extracts uppercase initials for owner avatar. */
function initialsFor(name: string | undefined): string {
  if (!name?.trim()) return '--';
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function toLocalDateTimeInput(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function defaultNextFollowUpInput(referenceNowMs?: number | null): string {
  const anchor = referenceNowMs ?? Date.UTC(2026, 0, 1, 11, 0, 0);
  const dt = new Date(anchor + 3 * 24 * 60 * 60 * 1000);
  dt.setHours(11, 0, 0, 0);
  return toLocalDateTimeInput(dt);
}

function tomorrowTenAmInput(): string {
  const dt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  dt.setHours(10, 0, 0, 0);
  return toLocalDateTimeInput(dt);
}

export function TaskCard({
  lead,
  isUrgent = false,
  allowCompletion,
  canViewFinancials = true,
  canAccessDeals = true,
  canAssign = false,
  teamAssignees = [],
  referenceNowMs = null,
  slaMinutes,
}: TaskCardProps): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isOutcomeOpen, setIsOutcomeOpen] = useState(false);
  const [outcomeNote, setOutcomeNote] = useState('');
  const [nextStepMode, setNextStepMode] = useState<'schedule' | 'clear'>('schedule');
  const [nextFollowUpValue, setNextFollowUpValue] = useState<string>(() =>
    defaultNextFollowUpInput(referenceNowMs)
  );
  const [assignedOwnerId, setAssignedOwnerId] = useState<string>(lead.assigned_to || '');

  const safePhone = lead.phone?.replace(/[^\d+*#]/g, '') ?? '';
  const whatsappPhone = lead.phone?.replace(/\D/g, '') ?? '';
  const overdueBadge = isUrgent ? getUrgencyBadgeText(lead.next_follow_up, referenceNowMs) : null;
  const slaBreachBadge = !lead.assigned_to && !lead.next_follow_up
    ? getSlaBreachBadgeText(lead.created_at, referenceNowMs, slaMinutes)
    : null;
  const statusBadgeText = overdueBadge || slaBreachBadge;
  const stageTone = getStageTone(lead.status_name, lead.status_bucket);

  const priorityClass = lead.priority === 'High'
    ? styles.priorityHigh
    : lead.priority === 'Medium'
      ? styles.priorityMedium
      : styles.priorityLow;

  function dispatchToast(type: 'success' | 'info' | 'error', message: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: { type, message } }));
    }
  }

  function submitOutcomeCompletion(e: React.FormEvent): void {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (!lead.next_follow_up) {
          setError('Schedule a follow-up before marking this lead complete.');
          return;
        }
        const trimmedNote = outcomeNote.trim() || undefined;

        if (nextStepMode === 'schedule') {
          if (!nextFollowUpValue) {
            setError('Choose a future date and time for the next follow-up.');
            return;
          }
          const scheduledMs = new Date(nextFollowUpValue).getTime();
          if (!Number.isFinite(scheduledMs) || scheduledMs <= Date.now()) {
            setError('Next follow-up time must be in the future.');
            return;
          }

          // Schedule the successor touchpoint first so failures never leave the lead orphaned without a date
          const parsedIso = new Date(scheduledMs).toISOString();
          const schedRes = await scheduleFollowUpAction({
            leadId: lead.id,
            scheduledFor: parsedIso,
            actionType: 'call',
            agenda: trimmedNote || 'Next follow-up milestone scheduled on completion.',
            sendCalendarInvite: false,
          });
          if (!schedRes.success) {
            setError(schedRes.error || 'Could not schedule next follow-up step.');
            return;
          }

          if (trimmedNote && trimmedNote.length >= 3) {
            await logLeadActivityAction({
              leadId: lead.id,
              activityType: 'call_logged',
              description: trimmedNote,
              metadata: {
                source: 'follow_up_queue_completion',
                completed_follow_up: lead.next_follow_up,
                next_follow_up: parsedIso,
              },
            });
          }
          dispatchToast('success', `Follow-up completed and next step scheduled for ${lead.name}.`);
        } else {
          const result = await clearLeadFollowUp(lead.id, lead.next_follow_up, trimmedNote);
          if (!result.success) {
            setError(result.error || 'Could not complete this follow-up. Refresh and try again.');
            return;
          }
          dispatchToast('success', `Follow-up completed for ${lead.name}.`);
        }

        setIsOutcomeOpen(false);
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

  function handleInlineAssign(targetUserId: string): void {
    if (!targetUserId || !canAssign) return;
    setError(null);
    const prevOwner = assignedOwnerId;
    setAssignedOwnerId(targetUserId);
    startTransition(async () => {
      const res = await updateLeadAssignee(lead.id, targetUserId);
      if (!res.success) {
        setAssignedOwnerId(prevOwner);
        setError(res.error || 'Failed to assign account.');
        dispatchToast('error', res.error || 'Failed to assign account.');
        return;
      }
      const matchedName = teamAssignees.find((m) => m.id === targetUserId)?.full_name || 'representative';
      dispatchToast('success', `Assigned ${lead.name} to ${matchedName}.`);
      router.refresh();
    });
  }

  return (
    <li className={`${styles.taskItem} ${isDone ? styles.taskItemDone : ''}`}>
      <div className={styles.clientCell}>
        <div className={styles.clientHeading}>
          <Link
            href={`/admin/leads/${lead.id}`}
            className={styles.leadOpenButton}
            aria-label={`View lead ${lead.name}`}
          >
            {lead.name}
          </Link>
          <span className={`${styles.priorityChip} ${priorityClass}`}>
            {lead.priority}
          </span>
          {statusBadgeText && (
            <span className={styles.urgencyBadge} role="status">
              {statusBadgeText}
            </span>
          )}
        </div>

        <span className={styles.companyName}>
          {lead.company || 'No company listed'}
        </span>

        <span className={styles.dueLine}>
          <svg className={styles.scheduleIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {lead.next_follow_up ? formatFollowUp(lead.next_follow_up) : 'No follow-up scheduled'}
        </span>

        {(lead.phone || lead.email) && (
          <div className={styles.telephonyDock} aria-label={`Contact options for ${lead.name}`}>
            {safePhone && (
              <a
                href={`tel:${safePhone}`}
                className={styles.telephonyAction}
                onClick={() => dispatchToast('info', `Dialing ${lead.name}. Log your call outcome once finished.`)}
                aria-label={`Call ${lead.name} at ${safePhone}`}
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
                onClick={() => dispatchToast('info', `Opened WhatsApp for ${lead.name}. Log your outcome once finished.`)}
                aria-label={`Message ${lead.name} on WhatsApp`}
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
                onClick={() => dispatchToast('info', `Opened email composer for ${lead.name}. Log your outcome once sent.`)}
                aria-label={`Email ${lead.email}`}
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

      <div className={styles.stageCell}>
        <span className={styles.cellLabel}>Stage</span>
        <span className={styles.stagePill} data-stage-tone={stageTone}>
          {lead.status_name || 'New Lead'}
        </span>
      </div>

      <div className={styles.ownerCell}>
        <span className={styles.cellLabel}>Owner</span>
        {!lead.assigned_to && canAssign && teamAssignees.length > 0 ? (
          <select
            aria-label={`Assign owner for ${lead.name}`}
            value={assignedOwnerId}
            disabled={isPending}
            onChange={(e) => handleInlineAssign(e.target.value)}
            className={styles.inlineAssignSelect}
          >
            <option value="" disabled>Assign Rep…</option>
            {teamAssignees.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </select>
        ) : (
          <div className={styles.ownerValue}>
            <span className={styles.ownerInitials} aria-hidden="true">
              {initialsFor(lead.assignee_name)}
            </span>
            <span className={styles.ownerNameText}>{lead.assignee_name || 'Unassigned'}</span>
          </div>
        )}
      </div>

      <div className={styles.valueCell}>
        <span className={styles.cellLabel}>Deal Value</span>
        <strong className={styles.monetaryValuation}>
          {canViewFinancials ? formatCrmCurrency(lead.expected_value) : 'Restricted'}
        </strong>
      </div>

      <div className={styles.actionsCell}>
        {allowCompletion && lead.next_follow_up && (
          <button
            type="button"
            className={`${styles.completeButton} ${isDone ? styles.completeButtonDone : ''}`}
            onClick={() => setIsOutcomeOpen((prev) => !prev)}
            disabled={isPending || isDone}
            aria-expanded={isOutcomeOpen}
            aria-label={isDone ? `Follow-up completed for ${lead.name}` : `Complete follow-up for ${lead.name}`}
          >
            {isPending ? (
              'Saving…'
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{isDone ? 'Completed' : 'Complete'}</span>
              </>
            )}
          </button>
        )}

        {allowCompletion && (
          <button
            type="button"
            className={styles.rescheduleButton}
            onClick={() => setIsSchedulerOpen(true)}
            disabled={isPending}
            aria-label={`Schedule or reschedule follow-up for ${lead.name}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="18" height="18" x="3" y="4" rx="2" />
              <path d="M16 2v4" />
              <path d="M8 2v4" />
              <path d="M3 10h18" />
            </svg>
            <span>{lead.next_follow_up ? 'Reschedule' : 'Schedule'}</span>
          </button>
        )}

        {allowCompletion && canAccessDeals && (
          <Link
            href={`/admin/deals/${lead.id}`}
            className={styles.dealLink}
            aria-label={`View deal for ${lead.name}`}
          >
            Deal →
          </Link>
        )}
      </div>

      {error && (
        <p className={styles.actionError} role="alert">
          {error}
        </p>
      )}

      {isOutcomeOpen && allowCompletion && lead.next_follow_up && (
        <form onSubmit={submitOutcomeCompletion} className={styles.outcomePanel}>
          <div className={styles.outcomeFieldRow}>
            <input
              type="text"
              value={outcomeNote}
              onChange={(e) => setOutcomeNote(e.target.value)}
              placeholder="Log call or conversation outcome (optional)…"
              className={styles.outcomeInput}
              aria-label="Follow-up outcome note"
            />
            <select
              value={nextStepMode}
              onChange={(e) => setNextStepMode(e.target.value as 'schedule' | 'clear')}
              className={styles.outcomeSelect}
              aria-label="Next action after completion"
            >
              <option value="schedule">Schedule next follow-up</option>
              <option value="clear">Complete without scheduling next</option>
            </select>
            {nextStepMode === 'schedule' && (
              <>
                <input
                  type="datetime-local"
                  value={nextFollowUpValue}
                  min={toLocalDateTimeInput(new Date())}
                  onChange={(e) => setNextFollowUpValue(e.target.value)}
                  required
                  className={styles.outcomeDateInput}
                  aria-label="Next follow-up date and time"
                />
                <button
                  type="button"
                  className={styles.quickPresetChip}
                  onClick={() => setNextFollowUpValue(tomorrowTenAmInput())}
                  disabled={isPending}
                >
                  Tomorrow 10am
                </button>
              </>
            )}
          </div>
          <div className={styles.outcomeActions}>
            <button type="button" className={styles.outcomeCancelBtn} onClick={() => setIsOutcomeOpen(false)} disabled={isPending}>
              Cancel
            </button>
            <button type="submit" className={styles.outcomeConfirmBtn} disabled={isPending}>
              {isPending ? 'Saving…' : 'Confirm Completion'}
            </button>
          </div>
        </form>
      )}

      {isSchedulerOpen && (
        <FollowUpScheduler
          isOpen={isSchedulerOpen}
          leadId={lead.id}
          leadName={lead.name}
          company={lead.company}
          currentFollowUpDate={lead.next_follow_up}
          onClose={() => setIsSchedulerOpen(false)}
          onSuccess={() => {
            setIsSchedulerOpen(false);
            dispatchToast('success', `Follow-up scheduled for ${lead.name}.`);
            router.refresh();
          }}
        />
      )}
    </li>
  );
}
