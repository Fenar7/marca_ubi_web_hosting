'use client';

/**
 * @file LeadReassignmentWizardModal.tsx
 * @description Marca Ubi Editorial Luxury Lead Reassignment Wizard modal (/admin/team).
 *              Scans live active deal inventory, validates active destination representatives,
 *              enforces WCAG AA contrast, cyclical focus trapping, and atomic ACID transfers.
 * @module app/admin/team/components/LeadReassignmentWizardModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useRef } from 'react';
import type { TeamMemberRosterItem, RepDealInventory, AtomicReassignmentResult } from '@/types/crm';
import { getRepDealInventory, executeLeadReassignment } from '@/app/actions/reassignment';
import { formatDealValuation, getInitials } from '@/app/lib/team-utils';
import styles from '../team.module.scss';

interface LeadReassignmentWizardModalProps {
  sourceMember: TeamMemberRosterItem | null;
  activeRoster: TeamMemberRosterItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: AtomicReassignmentResult, sourceMemberId: string, destinationMemberId: string) => void;
}

export function LeadReassignmentWizardModal({
  sourceMember,
  activeRoster,
  isOpen,
  onClose,
  onSuccess,
}: LeadReassignmentWizardModalProps): React.ReactElement | null {
  const [destinationUserId, setDestinationUserId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [isLoadingInventory, setIsLoadingInventory] = useState<boolean>(false);
  const [inventory, setInventory] = useState<RepDealInventory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const destinationCandidates = React.useMemo(() => {
    if (!sourceMember) return [];
    return activeRoster.filter(
      (m) =>
        m.id !== sourceMember.id &&
        m.status === 'active' &&
        (m.role === 'admin' || m.role === 'sales_manager' || m.role === 'sales_executive')
    );
  }, [activeRoster, sourceMember]);

  useEffect(() => {
    if (!isOpen || !sourceMember) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    let isMounted = true;
    setIsLoadingInventory(true);
    setErrorMessage(null);
    setDestinationUserId('');
    setTransferReason(`Full commercial pipeline transfer from ${sourceMember.full_name}.`);

    getRepDealInventory(sourceMember.id)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setInventory(res.data);
        } else {
          setErrorMessage(res.error || 'Failed to scan live deal inventory.');
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setErrorMessage(err instanceof Error ? err.message : 'Failed to query representative inventory.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingInventory(false);
      });

    requestAnimationFrame(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>('button:not([disabled])');
      firstFocusable?.focus();
    });

    return () => {
      isMounted = false;
      requestAnimationFrame(() => {
        if (!document.querySelector('[aria-modal="true"]')) {
          document.body.style.overflow = '';
        }
      });
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, sourceMember]);

  useEffect(() => {
    if (destinationCandidates.length > 0 && !destinationUserId) {
      setDestinationUserId(destinationCandidates[0].id);
    }
  }, [destinationCandidates, destinationUserId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !sourceMember) return null;

  const handleExecuteReassignment = async () => {
    if (!destinationUserId) {
      setErrorMessage('Please select an active destination team member to receive deals.');
      return;
    }
    if (!transferReason.trim() || transferReason.trim().length < 5) {
      setErrorMessage('A transfer reason of at least 5 characters is required for audit trails.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await executeLeadReassignment({
        sourceUserId: sourceMember.id,
        destinationUserId,
        transferReason: transferReason.trim(),
      });

      if (!result.success || !result.data) {
        setErrorMessage(result.error || 'Failed to execute atomic lead reassignment.');
        setIsSubmitting(false);
        return;
      }

      onSuccess(result.data, sourceMember.id, destinationUserId);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected network error occurred.');
      setIsSubmitting(false);
    }
  };

  const activeCount = inventory ? inventory.active_deals_count : sourceMember.active_deals_count;
  const pipelineVal = inventory ? inventory.cumulative_pipeline_value : sourceMember.total_deal_value;
  const overdueCount = inventory ? inventory.overdue_follow_ups_count : 0;

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reassign-wizard-title"
      aria-describedby="reassign-wizard-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div ref={modalRef} className={styles.modalCard} style={{ maxWidth: '560px' }}>
        <div className={styles.modalHeaderRow}>
          <h3 id="reassign-wizard-title" className={styles.modalHeading}>
            Pipeline Lead Reassignment Wizard.
          </h3>
          <button
            type="button"
            className={styles.drawerCloseButton}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close reassignment wizard (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p id="reassign-wizard-desc" className={styles.modalSubtitle}>
          Transferring active commercial deals from <strong>{sourceMember.full_name}</strong> ({sourceMember.email}) to an active representative.
        </p>

        {errorMessage && (
          <div className={styles.modalErrorBanner} role="alert">
            {errorMessage}
          </div>
        )}

        <div className={styles.wizardImpactGrid}>
          <div className={styles.wizardStatBox}>
            <span className={styles.wizardStatLabel}>Active Deals</span>
            <span className={styles.wizardStatValue}>
              {isLoadingInventory ? '...' : `${activeCount} deals`}
            </span>
          </div>
          <div className={styles.wizardStatBox}>
            <span className={styles.wizardStatLabel}>Pipeline Value</span>
            <span className={styles.wizardStatValue}>
              {isLoadingInventory ? '...' : (pipelineVal > 0 ? formatDealValuation(pipelineVal) : '₹0')}
            </span>
          </div>
          <div className={styles.wizardStatBox}>
            <span className={styles.wizardStatLabel}>Overdue Touches</span>
            <span
              className={styles.wizardStatValue}
              style={{ color: overdueCount > 0 ? '#9c001e' : '#065f46' }}
            >
              {isLoadingInventory ? '...' : `${overdueCount} leads`}
            </span>
          </div>
        </div>

        {inventory && inventory.stage_breakdown.length > 0 && (
          <div className={styles.wizardBreakdownSection}>
            <h4 className={styles.wizardBreakdownTitle}>Funnel Stage Breakdown</h4>
            <div className={styles.wizardBreakdownList}>
              {inventory.stage_breakdown.map((stage) => (
                <div key={stage.status_id} className={styles.wizardStageRow}>
                  <div className={styles.wizardStageLeft}>
                    <span
                      className={styles.wizardStageDot}
                      style={{ backgroundColor: stage.color_code || '#111111' }}
                    />
                    <span className={styles.wizardStageName}>{stage.status_name}</span>
                  </div>
                  <div className={styles.wizardStageRight}>
                    <span className={styles.wizardStageCount}>
                      {stage.deal_count} deal{stage.deal_count !== 1 ? 's' : ''}
                    </span>
                    <span className={styles.wizardStageVal}>
                      {stage.total_value > 0 ? formatDealValuation(stage.total_value) : '₹0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoadingInventory && activeCount === 0 && (
          <div className={styles.modalAlertBanner}>
            <span>
              <strong>Zero Active Deals:</strong> This representative has no active commercial deals requiring reassignment.
            </span>
          </div>
        )}

        {activeCount > 0 && (
          <>
            <div className={styles.drawerFormGroup}>
              <label htmlFor="destination-member-select" className={styles.drawerLabel}>
                Destination Representative (Active Only)
              </label>
              <select
                id="destination-member-select"
                className={styles.drawerSelect}
                value={destinationUserId}
                onChange={(e) => setDestinationUserId(e.target.value)}
                disabled={isSubmitting || destinationCandidates.length === 0}
              >
                {destinationCandidates.length === 0 ? (
                  <option value="">No active commercial staff available</option>
                ) : (
                  destinationCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.job_title || c.role}) - {c.active_deals_count} active deal(s)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className={styles.suspendReasonField}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="reassignment-reason" className={styles.suspendReasonLabel}>
                  Transfer Reason (Required)
                </label>
                <span style={{ fontSize: '0.72rem', color: '#575753' }}>
                  {transferReason.length}/500
                </span>
              </div>
              <textarea
                id="reassignment-reason"
                className={styles.suspendReasonInput}
                placeholder="e.g. Portfolio rebalance or representative offboarding..."
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                maxLength={500}
                disabled={isSubmitting}
              />
            </div>
          </>
        )}

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.copyButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            {activeCount === 0 ? 'Close' : 'Cancel'}
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              className={styles.doneButton}
              onClick={handleExecuteReassignment}
              disabled={
                isSubmitting ||
                isLoadingInventory ||
                destinationCandidates.length === 0 ||
                !transferReason.trim() ||
                transferReason.trim().length < 5
              }
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Executing Reassignment...' : 'Execute Atomic Reassignment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
