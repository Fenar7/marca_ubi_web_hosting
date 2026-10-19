'use client';

/**
 * @file LeadReassignmentWizardModal.tsx
 * @description Interactive Lead Reassignment Wizard modal component (/admin/team).
 *              Performs real-time deal inventory scans for departing or offboarded personnel,
 *              presents portfolio impact metrics (Stripe Scorecards & stage breakdown),
 *              validates active destination team members, prompts for mandatory transfer justification,
 *              and executes the atomic batch reassignment Server Action with ACID transaction guarantees.
 * @module app/admin/team/components/LeadReassignmentWizardModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect } from 'react';
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

  // Eligible destination candidates: active accounts holding commercial roles, excluding the source representative
  const destinationCandidates = React.useMemo(() => {
    if (!sourceMember) return [];
    return activeRoster.filter(
      (m) =>
        m.id !== sourceMember.id &&
        m.status === 'active' &&
        (m.role === 'admin' || m.role === 'sales_manager' || m.role === 'sales_executive')
    );
  }, [activeRoster, sourceMember]);

  // Load live deal inventory whenever wizard opens for a representative
  useEffect(() => {
    if (!isOpen || !sourceMember) return;

    let isMounted = true;
    setIsLoadingInventory(true);
    setErrorMessage(null);
    setDestinationUserId('');
    setTransferReason(`Full commercial pipeline transfer due to offboarding of ${sourceMember.full_name}.`);

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
        const msg = err instanceof Error ? err.message : 'Failed to query representative inventory.';
        setErrorMessage(msg);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingInventory(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, sourceMember]);

  // Set default destination rep once candidates are available
  useEffect(() => {
    if (destinationCandidates.length > 0 && !destinationUserId) {
      setDestinationUserId(destinationCandidates[0].id);
    }
  }, [destinationCandidates, destinationUserId]);

  // Handle Escape key to dismiss safely
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
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
      setErrorMessage('A transfer reason of at least 5 characters is required for regulatory audit trails.');
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
      const msg = err instanceof Error ? err.message : 'An unexpected network error occurred.';
      setErrorMessage(msg);
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
    >
      <div className={styles.modalCard} style={{ maxWidth: '560px' }}>
        {/* Error notification banner */}
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              color: '#ef4444',
              fontSize: '0.8rem',
              marginBottom: '1rem',
              lineHeight: 1.4,
            }}
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {/* Wizard Header Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
            padding: '0.85rem 1rem',
            borderRadius: '6px',
            background: 'rgba(255, 97, 0, 0.08)',
            border: '1px solid rgba(255, 97, 0, 0.3)',
            marginBottom: '1.25rem',
          }}
        >
          <svg
            style={{ color: '#ff6100', flexShrink: 0, marginTop: '0.15rem' }}
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          <div>
            <h3
              id="reassign-wizard-title"
              style={{ margin: '0 0 0.25rem 0', fontSize: '0.96rem', fontWeight: 700, color: '#ffffff' }}
            >
              Pipeline Lead Reassignment Wizard
            </h3>
            <p id="reassign-wizard-desc" className={styles.modalAlertText} style={{ color: '#dddddd' }}>
              Transferring active commercial portfolio from <strong>{sourceMember.full_name}</strong> to a designated active representative.
            </p>
          </div>
        </div>

        {/* Source Representative Identity Overview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.75rem 1rem',
            background: '#09090b',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            marginBottom: '1.25rem',
          }}
        >
          <div className={styles.avatar}>
            {getInitials(sourceMember.full_name)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
              {sourceMember.full_name}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#888888' }}>
              {sourceMember.email} · {sourceMember.job_title}
            </span>
          </div>
        </div>

        {/* Portfolio Impact Assessment Scorecards */}
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
              style={{ color: overdueCount > 0 ? '#ef4444' : '#22c55e' }}
            >
              {isLoadingInventory ? '...' : `${overdueCount} leads`}
            </span>
          </div>
        </div>

        {/* Stage Distribution Breakdown (PRD Section 3.2.1) */}
        {inventory && inventory.stage_breakdown.length > 0 && (
          <div className={styles.wizardBreakdownSection}>
            <h4 className={styles.wizardBreakdownTitle}>Funnel Stage Breakdown</h4>
            <div className={styles.wizardBreakdownList}>
              {inventory.stage_breakdown.map((stage) => (
                <div key={stage.status_id} className={styles.wizardStageRow}>
                  <div className={styles.wizardStageLeft}>
                    <span
                      className={styles.wizardStageDot}
                      style={{ backgroundColor: stage.color_code || '#ff6100' }}
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

        {/* Zero Deals Safeguard Notice */}
        {!isLoadingInventory && activeCount === 0 && (
          <div
            style={{
              padding: '1rem',
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: '6px',
              color: '#22c55e',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              lineHeight: 1.5,
            }}
          >
            ✓ <strong>Zero Active Deals:</strong> This representative has no active commercial deals requiring reassignment. Converted and lost accounts remain untouched to preserve historical ownership records.
          </div>
        )}

        {/* Destination Selection & Justification (only if active deals exist) */}
        {activeCount > 0 && (
          <>
            {/* Destination Selection Dropdown */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="destination-member-select"
                className={styles.drawerLabel}
                style={{ marginBottom: '0.4rem', display: 'block' }}
              >
                Select Destination Team Member (Active Only)
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
                      {c.full_name} ({c.job_title || c.role}) - Managing {c.active_deals_count} active deal(s)
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Mandatory Transfer Reason Textarea */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label
                  htmlFor="reassignment-reason"
                  className={styles.drawerLabel}
                  style={{ margin: 0 }}
                >
                  Transfer Reason (Required for Audit Logging)
                </label>
                <span style={{ fontSize: '0.72rem', color: '#666666' }}>
                  {transferReason.length}/500
                </span>
              </div>
              <textarea
                id="reassignment-reason"
                className={styles.suspendReasonInput}
                placeholder="e.g. Full offboarding transfer due to departure on Oct 15, 2026..."
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                maxLength={500}
                disabled={isSubmitting}
                aria-label="Reason for batch lead reassignment"
              />
            </div>
          </>
        )}

        {/* Modal Action Controls */}
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
              {isSubmitting ? (
                <span>Executing Reassignment...</span>
              ) : (
                <span>Execute Atomic Reassignment</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
