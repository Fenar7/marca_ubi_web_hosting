'use client';

/**
 * @file LostReasonModal.tsx
 * @description Guarded modal component enforcing standardized loss attribution
 *              and explanatory notes before marking a deal as Lost (Terminal Inactive).
 *              Enforces PRD Section 15.18 & Section 5 compliance, requiring minimum 10
 *              characters of explanatory notes when selecting 'Other'.
 * @module app/admin/components/modals/LostReasonModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { transitionToLostAction } from '@/app/actions/stageTransitionActions';
import {
  LOST_REASON_OPTIONS,
  type LostReasonEnum,
  type GuardedTransitionResultPayload,
} from '@/app/lib/stage-transition-schemas';
import { useModalAnimation } from './useModalAnimation';
import styles from './StageModals.module.scss';

export interface LostReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  dealIdCode?: string;
  dealName?: string;
  onSuccess?: (payload: GuardedTransitionResultPayload) => void;
}

export function LostReasonModal({
  isOpen,
  onClose,
  leadId,
  dealIdCode,
  dealName,
  onSuccess,
}: LostReasonModalProps): React.ReactElement | null {
  const { shouldRender, isClosing, handleAnimationEnd } = useModalAnimation({
    isOpen,
    exitDurationMs: 160,
  });

  const [isPending, startTransition] = useTransition();
  const [lostReason, setLostReason] = useState<LostReasonEnum>('Budget Incompatible');
  const [lostNotes, setLostNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Reset form upon opening
  useEffect(() => {
    if (isOpen) {
      setLostReason('Budget Incompatible');
      setLostNotes('');
      setErrorMessage(null);
      setTimeout(() => {
        selectRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Trap focus & Escape dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();
      setErrorMessage(null);

      // Client validation for 'Other' reason requiring >= 10 chars
      if (lostReason === 'Other' && lostNotes.trim().length < 10) {
        setErrorMessage('Detailed explanatory notes (minimum 10 characters) are required when selecting "Other".');
        return;
      }

      startTransition(async () => {
        try {
          const result = await transitionToLostAction({
            leadId,
            lostReason,
            lostNotes: lostNotes.trim() || undefined,
          });

          if (!result.success || !result.data) {
            setErrorMessage(result.error || 'Failed to update deal status to Lost.');
            return;
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('crm-toast', {
                detail: {
                  type: 'warning',
                  message: `Deal closed as Lost: ${result.data.lostReason || lostReason}.`,
                },
              })
            );
            window.dispatchEvent(
              new CustomEvent('lead-updated', {
                detail: {
                  leadId,
                  field: 'status',
                  status: {
                    id: result.data.newStatusId,
                    name: result.data.newStatusName,
                    bucket: 'lost',
                  },
                },
              })
            );
          }

          onSuccess?.(result.data);
          onClose();
        } catch (err) {
          setErrorMessage(
            err instanceof Error ? err.message : 'An unexpected exception occurred.'
          );
        }
      });
    },
    [leadId, lostReason, lostNotes, onSuccess, onClose]
  );

  if (!shouldRender) return null;

  const requiresNotes = lostReason === 'Other';

  return (
    <div
      className={`${styles.modalOverlay} ${isClosing ? styles.closing : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lost-modal-title"
    >
      <div
        ref={containerRef}
        className={`${styles.modalContainer} ${isClosing ? styles.closing : ''}`}
        onAnimationEnd={handleAnimationEnd}
        tabIndex={-1}
      >
        <header className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.badgeRow}>
              {dealIdCode && <span className={styles.dealIdPill}>{dealIdCode}</span>}
              <span className={`${styles.stageBadge} ${styles.lost}`}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>Terminal Inactive</span>
              </span>
            </div>
            <h2 id="lost-modal-title" className={styles.modalTitle}>
              Close Deal as Lost.
            </h2>
            {dealName && (
              <p className={styles.modalSubtitle}>
                Attributing commercial loss for <strong style={{ color: 'var(--admin-text-primary, #1f242f)' }}>{dealName}</strong>.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close dialog"
            disabled={isPending}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={`${styles.infoBanner} ${styles.danger}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>
                Closing a deal as Lost archives it from active pipeline metrics and marks it terminal.
                Standardized loss attribution is mandatory for agency intelligence.
              </span>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="lost-reason-select" className={styles.fieldLabel}>
                  Standardized Lost Reason <span className={styles.required}>*</span>
                </label>
              </div>
              <select
                id="lost-reason-select"
                ref={selectRef}
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value as LostReasonEnum)}
                className={styles.selectInput}
                disabled={isPending}
              >
                {LOST_REASON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="lost-notes-textarea" className={styles.fieldLabel}>
                  Explanatory Notes {requiresNotes ? <span className={styles.required}>* (Min 10 characters)</span> : '(Optional)'}
                </label>
                {requiresNotes && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: lostNotes.trim().length >= 10 ? 'var(--admin-status-emerald-text, #065f46)' : 'var(--admin-status-rose-text, #991b1b)',
                      fontFamily: 'var(--font-admin-code, monospace)',
                      fontWeight: 600,
                    }}
                  >
                    {lostNotes.trim().length}/10 chars
                  </span>
                )}
              </div>
              <textarea
                id="lost-notes-textarea"
                rows={3}
                value={lostNotes}
                onChange={(e) => setLostNotes(e.target.value)}
                placeholder={
                  requiresNotes
                    ? 'Specify detailed context explaining why this engagement could not be closed...'
                    : 'Provide additional feedback or commercial rationale for future retrospective...'
                }
                className={`${styles.textareaInput} ${
                  requiresNotes && lostNotes.trim().length > 0 && lostNotes.trim().length < 10
                    ? styles.hasError
                    : ''
                }`}
                disabled={isPending}
              />
              <span className={styles.fieldHint}>
                {requiresNotes
                  ? 'Policy Requirement: Selecting "Other" requires a minimum of 10 characters detailing the rationale.'
                  : 'Recorded to the client timeline and executive deal notes.'}
              </span>
            </div>

            {errorMessage && (
              <div className={styles.fieldError} role="alert">
                {errorMessage}
              </div>
            )}
          </div>

          <footer className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.submitBtn} ${styles.danger}`}
              disabled={isPending || (requiresNotes && lostNotes.trim().length < 10)}
            >
              {isPending && <div className={styles.spinner} />}
              <span>{isPending ? 'Closing Deal...' : 'Confirm Deal Lost'}</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
