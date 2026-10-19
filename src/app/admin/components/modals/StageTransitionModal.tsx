'use client';

/**
 * @file StageTransitionModal.tsx
 * @description Master guarded stage advancement modal for the Marca Ubi CRM.
 *              Enforces required inputs for critical pipeline milestones (PRD §15.18):
 *              - Negotiation: Requires positive numerical valuation (> 0) and target close date.
 *              - Lost: Delegates to LostReasonModal enforcing standardized loss attribution.
 *              - Converted: Delegates to ConvertedCelebrationModal with confetti and locking notice.
 * @module app/admin/components/modals/StageTransitionModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import type { FunnelBucket } from '@/types/crm';
import { transitionToNegotiationAction } from '@/app/actions/stageTransitionActions';
import type { GuardedTransitionResultPayload } from '@/app/lib/stage-transition-schemas';
import { useModalAnimation } from './useModalAnimation';
import { LostReasonModal } from './LostReasonModal';
import { ConvertedCelebrationModal } from './ConvertedCelebrationModal';
import { OnHoldModal } from '../Scheduler/OnHoldModal';
import styles from './StageModals.module.scss';

export interface StageTargetDescriptor {
  id: string;
  name: string;
  bucket: FunnelBucket;
}

export interface StageTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  targetStatus: StageTargetDescriptor;
  dealIdCode?: string;
  dealName?: string;
  currentExpectedValue?: number;
  onSuccess?: (payload: GuardedTransitionResultPayload) => void;
}

function formatCurrency(amount: number): string {
  if (!amount || amount <= 0) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function StageTransitionModal({
  isOpen,
  onClose,
  leadId,
  targetStatus,
  dealIdCode,
  dealName,
  currentExpectedValue = 0,
  onSuccess,
}: StageTransitionModalProps): React.ReactElement | null {
  // If target stage is Lost, delegate to LostReasonModal
  if (targetStatus.bucket === 'lost' || targetStatus.name.toLowerCase() === 'lost') {
    return (
      <LostReasonModal
        isOpen={isOpen}
        onClose={onClose}
        leadId={leadId}
        dealIdCode={dealIdCode}
        dealName={dealName}
        onSuccess={onSuccess}
      />
    );
  }

  // If target stage is Converted, delegate to ConvertedCelebrationModal
  if (targetStatus.bucket === 'converted' || targetStatus.name.toLowerCase() === 'converted') {
    return (
      <ConvertedCelebrationModal
        isOpen={isOpen}
        onClose={onClose}
        leadId={leadId}
        dealIdCode={dealIdCode}
        dealName={dealName}
        currentExpectedValue={currentExpectedValue}
        onSuccess={onSuccess}
      />
    );
  }

  // If target stage is On Hold, delegate to OnHoldModal with mandatory future revisit date
  if (targetStatus.name.toLowerCase() === 'on hold') {
    return (
      <OnHoldModal
        leadId={leadId}
        leadName={dealName}
        company={dealIdCode}
        onClose={onClose}
        onSuccess={(revisitDate: string) => {
          onSuccess?.({
            leadId,
            previousStatusId: '',
            previousStatusName: '',
            newStatusId: targetStatus.id,
            newStatusName: targetStatus.name,
            bucket: targetStatus.bucket,
            updatedAt: new Date().toISOString(),
            revisitDate,
            nextFollowUp: `${revisitDate}T09:00:00.000Z`,
          });
        }}
      />
    );
  }

  // Otherwise, render the Negotiation Stage Advancement Modal
  return (
    <NegotiationModalInner
      isOpen={isOpen}
      onClose={onClose}
      leadId={leadId}
      targetStatus={targetStatus}
      dealIdCode={dealIdCode}
      dealName={dealName}
      currentExpectedValue={currentExpectedValue}
      onSuccess={onSuccess}
    />
  );
}

interface NegotiationModalInnerProps extends StageTransitionModalProps {}

function NegotiationModalInner({
  isOpen,
  onClose,
  leadId,
  targetStatus,
  dealIdCode,
  dealName,
  currentExpectedValue = 0,
  onSuccess,
}: NegotiationModalInnerProps): React.ReactElement | null {
  const { shouldRender, isClosing, handleAnimationEnd } = useModalAnimation({
    isOpen,
    exitDurationMs: 160,
  });

  const [isPending, startTransition] = useTransition();
  const [expectedValue, setExpectedValue] = useState<number | ''>(
    currentExpectedValue > 0 ? currentExpectedValue : 500000
  );

  // Default close date to 14 days from today
  const defaultCloseDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const [anticipatedCloseDate, setAnticipatedCloseDate] = useState<string>(defaultCloseDate);
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const valueInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setExpectedValue(currentExpectedValue > 0 ? currentExpectedValue : 500000);
      setAnticipatedCloseDate(defaultCloseDate);
      setNotes('');
      setErrorMessage(null);

      setTimeout(() => {
        valueInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, currentExpectedValue, defaultCloseDate]);

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

      const numVal = typeof expectedValue === 'number' ? expectedValue : parseFloat(expectedValue);
      if (isNaN(numVal) || numVal <= 0) {
        setErrorMessage('Advancing to Negotiation requires a positive deal valuation (> 0).');
        return;
      }

      if (!anticipatedCloseDate) {
        setErrorMessage('Anticipated close date is required.');
        return;
      }

      startTransition(async () => {
        try {
          const result = await transitionToNegotiationAction({
            leadId,
            expectedValue: numVal,
            anticipatedCloseDate,
            notes: notes.trim() || undefined,
          });

          if (!result.success || !result.data) {
            setErrorMessage(result.error || 'Failed to advance stage to Negotiation.');
            return;
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('crm-toast', {
                detail: {
                  type: 'success',
                  message: `Deal advanced to Negotiation (${formatCurrency(numVal)}).`,
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
                    bucket: result.data.bucket,
                  },
                },
              })
            );
          }

          onSuccess?.(result.data);
          onClose();
        } catch (err) {
          setErrorMessage(
            err instanceof Error ? err.message : 'An unexpected exception occurred during stage advancement.'
          );
        }
      });
    },
    [leadId, expectedValue, anticipatedCloseDate, notes, onSuccess, onClose]
  );

  if (!shouldRender) return null;

  const numVal = typeof expectedValue === 'number' ? expectedValue : parseFloat(expectedValue) || 0;

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
      aria-labelledby="negotiation-modal-title"
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
              <span className={`${styles.stageBadge} ${styles.negotiation}`}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>Guarded Milestone</span>
              </span>
            </div>
            <h2 id="negotiation-modal-title" className={styles.modalTitle}>
              Advance to Negotiation
            </h2>
            {dealName && (
              <p className={styles.modalSubtitle}>
                Structuring commercial deal parameters for <strong style={{ color: '#ffffff' }}>{dealName}</strong>.
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
            <div className={`${styles.infoBanner} ${styles.warning}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>
                <strong>Pipeline Quality Policy:</strong> Advancing a deal into active Negotiation requires
                a confirmed positive commercial valuation and a target close horizon.
              </span>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="expected-value-input" className={styles.fieldLabel}>
                  Expected Deal Valuation <span className={styles.required}>*</span>
                </label>
                {numVal > 0 && (
                  <span className={styles.livePreviewPill}>
                    {formatCurrency(numVal)}
                  </span>
                )}
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>₹</span>
                <input
                  id="expected-value-input"
                  ref={valueInputRef}
                  type="number"
                  min="1"
                  step="5000"
                  value={expectedValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExpectedValue(val === '' ? '' : Number(val));
                  }}
                  placeholder="500000"
                  className={`${styles.textInput} ${styles.hasPrefix} ${
                    numVal <= 0 ? styles.hasError : ''
                  }`}
                  disabled={isPending}
                  required
                />
              </div>
              <span className={styles.fieldHint}>
                Weighted into active Studio pipeline forecasts and executive KPI tallies.
              </span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="close-date-input" className={styles.fieldLabel}>
                Anticipated Close Date <span className={styles.required}>*</span>
              </label>
              <input
                id="close-date-input"
                type="date"
                value={anticipatedCloseDate}
                onChange={(e) => setAnticipatedCloseDate(e.target.value)}
                className={styles.textInput}
                disabled={isPending}
                required
              />
              <span className={styles.fieldHint}>
                Target contract signing milestone. Drives overdue follow-up escalations.
              </span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="negotiation-notes-textarea" className={styles.fieldLabel}>
                Commercial Scope & Negotiation Strategy (Optional)
              </label>
              <textarea
                id="negotiation-notes-textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detail key contract stipulations, pricing adjustments, or decision-maker preferences..."
                className={styles.textareaInput}
                disabled={isPending}
              />
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
              className={`${styles.submitBtn} ${styles.brand}`}
              disabled={isPending || numVal <= 0}
            >
              {isPending && <div className={styles.spinner} />}
              <span>{isPending ? 'Advancing Stage...' : 'Confirm Negotiation Stage'}</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
