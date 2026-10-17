'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import styles from './Scheduler.module.scss';
import { DateTimePicker } from './DateTimePicker';
import {
  scheduleFollowUpAction,
  FollowUpActionType,
  FOLLOW_UP_ACTION_TYPES,
} from '@/app/actions/schedulerActions';

export interface FollowUpSchedulerProps {
  leadId: string;
  leadName?: string | null;
  company?: string | null;
  currentFollowUpDate?: string | null;
  initialFollowUp?: string | null;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: (newFollowUpIso: string) => void;
  onScheduled?: (newFollowUpIso: string) => void;
}

type QuickPreset =
  | 'today_2h'
  | 'today_plus_2h'
  | 'tomorrow_10am'
  | 'in_3_days'
  | 'next_mon_9am'
  | 'next_monday_9am';

/**
 * Calculates ISO string for quick-schedule interval presets relative to local time.
 */
export function calculatePresetDate(preset: QuickPreset): string {
  const now = new Date();

  switch (preset) {
    case 'today_2h':
    case 'today_plus_2h': {
      const target = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return target.toISOString();
    }
    case 'tomorrow_10am': {
      const target = new Date(now);
      target.setDate(target.getDate() + 1);
      target.setHours(10, 0, 0, 0);
      return target.toISOString();
    }
    case 'in_3_days': {
      const target = new Date(now);
      target.setDate(target.getDate() + 3);
      target.setHours(10, 0, 0, 0);
      return target.toISOString();
    }
    case 'next_mon_9am':
    case 'next_monday_9am': {
      const target = new Date(now);
      const dayOfWeek = target.getDay(); // 0 is Sun, 1 is Mon
      const daysUntilNextMon = dayOfWeek === 1 ? 7 : (1 - dayOfWeek + 7) % 7;
      target.setDate(target.getDate() + daysUntilNextMon);
      target.setHours(9, 0, 0, 0);
      return target.toISOString();
    }
  }
}

/**
 * Master modal for scheduling precision touchpoints with quick interval chips and calendar download.
 */
export const FollowUpScheduler: React.FC<FollowUpSchedulerProps> = ({
  leadId,
  leadName,
  company,
  currentFollowUpDate,
  initialFollowUp,
  isOpen = true,
  onClose,
  onSuccess,
  onScheduled,
}) => {
  const effectiveInitial = currentFollowUpDate || initialFollowUp;
  const [scheduledFor, setScheduledFor] = useState<string>(() => {
    if (effectiveInitial && new Date(effectiveInitial).getTime() > Date.now()) {
      return effectiveInitial;
    }
    return calculatePresetDate('tomorrow_10am');
  });

  const [activePreset, setActivePreset] = useState<QuickPreset | null>('tomorrow_10am');
  const [actionType, setActionType] = useState<FollowUpActionType>('call');
  const [agenda, setAgenda] = useState<string>('');
  const [sendCalendarInvite, setSendCalendarInvite] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus trap and Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Scroll lock
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  const handleApplyPreset = (preset: QuickPreset) => {
    const computedIso = calculatePresetDate(preset);
    setScheduledFor(computedIso);
    setActivePreset(preset);
  };

  const handleCustomDateChange = (iso: string) => {
    setScheduledFor(iso);
    setActivePreset(null);
  };

  const handleConfirmSchedule = () => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await scheduleFollowUpAction({
        leadId,
        scheduledFor,
        actionType,
        agenda: agenda.trim() || null,
        sendCalendarInvite,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to schedule follow-up.');
        return;
      }

      // If calendar invitation was generated and requested, trigger local file download
      if (result.calendarIcs && typeof window !== 'undefined') {
        const blob = new Blob([result.calendarIcs], { type: 'text/calendar;charset=utf-8' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `touchpoint-${leadName || 'deal'}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }

      if (onSuccess && result.data?.nextFollowUp) {
        onSuccess(result.data.nextFollowUp);
      }

      if (onScheduled && result.data?.nextFollowUp) {
        onScheduled(result.data.nextFollowUp);
      }

      // Dispatch crm-toast event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('crm-toast', {
            detail: {
              type: 'success',
              title: 'Touchpoint Scheduled',
              description: `Next follow-up set for ${new Date(scheduledFor).toLocaleDateString(
                'en-IN',
                {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )}.`,
            },
          })
        );
      }

      onClose();
    });
  };

  if (!isOpen) return null;

  const actionLabels: Record<FollowUpActionType, { label: string; icon: string }> = {
    call: { label: 'Follow-up Call', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    whatsapp: { label: 'WhatsApp Check-in', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    email: { label: 'Send Email / Pitch', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    meeting: { label: 'Client Meeting', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    demo: { label: 'Platform Demo', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    proposal_review: { label: 'Proposal Review', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="scheduler-title">
      <div className={styles.modalContainer} ref={containerRef}>
        <header className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <h2 id="scheduler-title" className={styles.modalTitle}>
              Schedule Next Touchpoint
            </h2>
            <p className={styles.modalSubtitle}>
              {leadName ? `${leadName} • ` : ''}
              {company || 'Prospective Account'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close scheduler"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className={styles.modalBody}>
          <div className={styles.sectionGroup}>
            <h3 className={styles.sectionLabel}>Quick Interval Presets</h3>
            <div className={styles.presetsGrid}>
              <button
                type="button"
                onClick={() => handleApplyPreset('today_plus_2h')}
                className={`${styles.presetChip} ${activePreset === 'today_plus_2h' ? styles.activePreset : ''}`}
              >
                Today +2h
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('tomorrow_10am')}
                className={`${styles.presetChip} ${activePreset === 'tomorrow_10am' ? styles.activePreset : ''}`}
              >
                Tomorrow 10 AM
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('in_3_days')}
                className={`${styles.presetChip} ${activePreset === 'in_3_days' ? styles.activePreset : ''}`}
              >
                In 3 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('next_monday_9am')}
                className={`${styles.presetChip} ${activePreset === 'next_monday_9am' ? styles.activePreset : ''}`}
              >
                Next Mon 9 AM
              </button>
            </div>
          </div>

          <div className={styles.sectionGroup}>
            <h3 className={styles.sectionLabel}>Precision Date & Time</h3>
            <DateTimePicker
              value={scheduledFor}
              minDate={todayStr}
              onChange={handleCustomDateChange}
              disabled={isPending}
            />
          </div>

          <div className={styles.sectionGroup}>
            <h3 className={styles.sectionLabel}>Touchpoint Action Type</h3>
            <div className={styles.actionTypeGrid}>
              {FOLLOW_UP_ACTION_TYPES.map((type) => {
                const config = actionLabels[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActionType(type)}
                    className={`${styles.actionTypeOption} ${actionType === type ? styles.selectedOption : ''}`}
                  >
                    <svg
                      className={styles.actionIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                    </svg>
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.sectionGroup}>
            <h3 className={styles.sectionLabel}>Touchpoint Objective / Agenda</h3>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="e.g. Review retainer quote, verify custom DNS requirements..."
              rows={3}
              maxLength={1000}
              disabled={isPending}
              className={styles.agendaTextarea}
            />
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={sendCalendarInvite}
              onChange={(e) => setSendCalendarInvite(e.target.checked)}
              disabled={isPending}
            />
            <span className={styles.checkboxLabel}>
              Download RFC 5545 (.ics) Calendar File for Outlook / Google Calendar
            </span>
          </label>

          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        </div>

        <footer className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={styles.cancelButton}
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleConfirmSchedule}
            disabled={isPending}
            className={styles.submitButton}
          >
            {isPending ? 'Scheduling...' : 'Confirm Schedule'}
          </button>
        </footer>
      </div>
    </div>
  );
};
