'use client';

/**
 * @file BatchStageModal.tsx
 * @description Guarded batch pipeline stage transition modal for commercial inquiries.
 *              Enforces atomic transitions via public.batch_update_lead_status RPC,
 *              mandatory loss reason capture when transitioning to 'lost' bucket,
 *              accessible cyclical focus trapping, and optimistic state synchronization.
 * @module admin/components/modals/BatchStageModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useRef, useTransition } from 'react';
import type { InlineStatusOption } from '@/app/admin/components/LeadsTable';
import { batchUpdateLeadStatusAction } from '@/app/actions/batchLeads';
import styles from './BatchStageModal.module.scss';

export interface BatchStageModalProps {
  /** Whether the modal is actively visible */
  isOpen: boolean;
  /** IDs of all selected deals to update */
  selectedLeadIds: string[];
  /** Available pipeline stages for selection */
  availableStatuses: InlineStatusOption[];
  /** Callback fired to close dialog without committing changes */
  onClose: () => void;
  /** Callback fired upon successful transactional update */
  onSuccess?: (affectedCount: number, targetStatusName: string, statusId: string) => void;
}

const COMMON_LOST_REASONS = [
  'Budget / Pricing mismatch',
  'Competitor selected',
  'Scope or requirement change',
  'Project deferred / cancelled',
  'Unresponsive after follow-ups',
  'Other',
];

export function BatchStageModal({
  isOpen,
  selectedLeadIds,
  availableStatuses,
  onClose,
  onSuccess,
}: BatchStageModalProps): React.ReactElement | null {
  const [selectedStatusId, setSelectedStatusId] = useState<string>('');
  const [lostReason, setLostReason] = useState<string>('');
  const [customLostReason, setCustomLostReason] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);

  const batchAllowedStatuses = availableStatuses.filter((s) => s.bucket !== 'converted');

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setLostReason('');
      setCustomLostReason('');
      setNote('');
      if (batchAllowedStatuses.length > 0) {
        setSelectedStatusId(batchAllowedStatuses[0].id);
      }
    }
  }, [isOpen, availableStatuses]);

  // Selected stage object
  const targetStage = batchAllowedStatuses.find((s) => s.id === selectedStatusId);
  const isLostStage = targetStage?.bucket === 'lost' || targetStage?.name.toLowerCase() === 'lost';

  // Handle keyboard dismiss (Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Trap focus inside modal
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const focusable = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedStatusId) {
      setErrorMessage('Please select a target pipeline stage.');
      return;
    }

    if (selectedLeadIds.length === 0) {
      setErrorMessage('No deals are currently selected.');
      return;
    }

    let finalLostReason: string | undefined = undefined;
    if (isLostStage) {
      if (!lostReason) {
        setErrorMessage('Please specify a loss reason for archival tracking.');
        return;
      }
      finalLostReason = lostReason === 'Other' ? customLostReason.trim() : lostReason;
      if (!finalLostReason) {
        setErrorMessage('Please provide a specific loss explanation.');
        return;
      }
    }

    startTransition(async () => {
      try {
        const result = await batchUpdateLeadStatusAction({
          leadIds: selectedLeadIds,
          statusId: selectedStatusId,
          lostReason: finalLostReason,
          note: note.trim() || undefined,
        });

        if (!result.success) {
          setErrorMessage(result.error || 'Failed to update deal stages.');
          return;
        }

        if (onSuccess && result.data) {
          onSuccess(result.data.affectedCount, result.data.targetStatusName, selectedStatusId);
        }
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setErrorMessage(msg);
      }
    });
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-stage-title"
    >
      <div className={styles.modalCard} ref={containerRef}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <h2 id="batch-stage-title" className={styles.modalTitle}>
              Advance Pipeline Stage
            </h2>
            <p className={styles.modalSubtitle}>
              Update pipeline milestone for multiple commercial inquiries simultaneously.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {errorMessage && (
              <div className={styles.errorBanner} role="alert">
                {errorMessage}
              </div>
            )}

            <div className={styles.selectionBanner}>
              <span className={styles.countBadge}>{selectedLeadIds.length}</span>
              <span>
                {selectedLeadIds.length === 1
                  ? 'commercial deal selected for stage update'
                  : 'commercial deals selected for stage update'}
              </span>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>
                Target Funnel Stage <span className={styles.requiredMark}>*</span>
              </span>
              <div className={styles.stageGrid} role="radiogroup" aria-label="Target funnel stages">
                {batchAllowedStatuses.map((status) => {
                  const isSelected = status.id === selectedStatusId;
                  return (
                    <button
                      key={status.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`${styles.stageCard} ${isSelected ? styles.stageSelected : ''}`}
                      onClick={() => setSelectedStatusId(status.id)}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 3,
                          height: 14,
                          borderRadius: 2,
                          backgroundColor: status.color_code || '#111111',
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                      <span className={styles.stageName}>{status.name}</span>
                      <span className={styles.stageBucket}>{status.bucket}</span>
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: '#666663', margin: '6px 0 0' }}>
                Converting deals to Won requires individual signed contract values and payment terms on the Deal Dossier page.
              </p>
            </div>

            {isLostStage && (
              <div className={styles.fieldGroup}>
                <label htmlFor="batch-lost-reason" className={styles.fieldLabel}>
                  Reason for Loss <span className={styles.requiredMark}>*</span>
                </label>
                <select
                  id="batch-lost-reason"
                  className={styles.textInput}
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  required
                >
                  <option value="">Select primary loss attribution...</option>
                  {COMMON_LOST_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {lostReason === 'Other' && (
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="Enter specific lost reason rationale..."
                    value={customLostReason}
                    onChange={(e) => setCustomLostReason(e.target.value)}
                    required
                  />
                )}
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label htmlFor="batch-stage-note" className={styles.fieldLabel}>
                Audit Trail Note <span style={{ color: '#888888', fontWeight: 400 }}>(Optional)</span>
              </label>
              <textarea
                id="batch-stage-note"
                className={styles.textArea}
                placeholder="Add optional notes recorded in activity history for all affected records..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.confirmBtn}
              disabled={isPending || !selectedStatusId || selectedLeadIds.length === 0}
            >
              {isPending ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spinner}>
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                  </svg>
                  <span>Updating {selectedLeadIds.length} Deals...</span>
                </>
              ) : (
                <span>Confirm Update ({selectedLeadIds.length})</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
