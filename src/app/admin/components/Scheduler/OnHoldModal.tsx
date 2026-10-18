'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import styles from './Scheduler.module.scss';
import {
  transitionToOnHoldAction,
  ON_HOLD_REASONS,
  OnHoldReason,
} from '@/app/actions/schedulerActions';

export interface OnHoldModalProps {
  leadId: string;
  leadName?: string | null;
  company?: string | null;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: (revisitDate: string) => void;
}

/**
 * Guarded modal dialog requiring a future revisit milestone before parking a deal in 'On Hold'.
 */
export const OnHoldModal: React.FC<OnHoldModalProps> = ({
  leadId,
  leadName,
  company,
  isOpen = true,
  onClose,
  onSuccess,
}) => {
  // Tomorrow's date string as minimum allowed revisit date
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  })();

  const [revisitDate, setRevisitDate] = useState<string>(tomorrowStr);
  const [reason, setReason] = useState<OnHoldReason>(ON_HOLD_REASONS[0]);
  const [parkingNotes, setParkingNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dateInputRef.current?.focus();

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

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  const handleSubmit = () => {
    setErrorMessage(null);

    const today = new Date().toISOString().split('T')[0];
    const targetDate = revisitDate ? revisitDate.split('T')[0] : '';
    if (!targetDate || targetDate <= today) {
      setErrorMessage('Revisit milestone date must be strictly in the future.');
      return;
    }

    startTransition(async () => {
      const result = await transitionToOnHoldAction({
        leadId,
        revisitDate,
        reason,
        parkingNotes: parkingNotes.trim() || null,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to place deal on hold.');
        return;
      }

      if (onSuccess && result.data?.revisitDate) {
        onSuccess(result.data.revisitDate);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('crm-toast', {
            detail: {
              type: 'warning',
              title: 'Deal Placed On Hold',
              description: `Overdue alerts suppressed until ${revisitDate}.`,
            },
          })
        );
      }

      onClose();
    });
  };

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onhold-modal-title"
    >
      <div className={styles.modalContainer} ref={containerRef}>
        <header className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <h2 id="onhold-modal-title" className={styles.modalTitle}>
              Place Deal On Hold
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
            aria-label="Close dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className={styles.modalBody}>
          <div className={styles.alertNoticeBanner}>
            <svg
              className={styles.noticeIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className={styles.noticeText}>
              Overdue warning badges and escalation alarms are paused until the revisit date arrives.
              On that date, the lead automatically reactivates into the Overdue Today queue.
            </p>
          </div>

          <div className={styles.sectionGroup}>
            <label htmlFor="onhold-revisit-date" className={styles.sectionLabel}>
              Mandatory Revisit Date (Milestone)
            </label>
            <div className={styles.pickerField}>
              <div className={styles.inputWrapper}>
                <input
                  id="onhold-revisit-date"
                  ref={dateInputRef}
                  type="date"
                  value={revisitDate}
                  min={tomorrowStr}
                  onChange={(e) => setRevisitDate(e.target.value)}
                  disabled={isPending}
                  className={styles.dateInput}
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.sectionGroup}>
            <label htmlFor="onhold-reason-select" className={styles.sectionLabel}>
              Commercial Parking Rationale
            </label>
            <div className={styles.pickerField}>
              <div className={styles.inputWrapper}>
                <select
                  id="onhold-reason-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as OnHoldReason)}
                  disabled={isPending}
                  className={styles.dateInput}
                >
                  {ON_HOLD_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.sectionGroup}>
            <label htmlFor="onhold-notes" className={styles.sectionLabel}>
              Detailed Context / Next Milestone Objective
            </label>
            <textarea
              id="onhold-notes"
              value={parkingNotes}
              onChange={(e) => setParkingNotes(e.target.value)}
              placeholder="e.g. Client requested delay while hiring new Head of Marketing; re-engage in Q1."
              rows={3}
              maxLength={2000}
              disabled={isPending}
              className={styles.agendaTextarea}
            />
          </div>

          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        </div>

        <footer className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className={styles.submitButton}
          >
            {isPending ? 'Updating...' : 'Confirm On Hold Status'}
          </button>
        </footer>
      </div>
    </div>
  );
};
