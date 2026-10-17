'use client';

/**
 * @file BatchReassignModal.tsx
 * @description Guarded batch lead reassignment wizard for sales managers and administrators.
 *              Allows selecting one or more overdue accounts and transferring them to an active team member.
 *              Enforces PRD §14.3 & §15.19 requirements:
 *              - Disables action button when 0 leads are selected
 *              - Renders tiered overdue badges for context
 *              - Fully accessible with cyclical focus trapping, Escape dismiss, and body scroll locking
 * @module admin/components/Modals/BatchReassignModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useRef, useId, useTransition } from 'react';
import { OverdueBadge } from '@/app/admin/components/Badges';
import {
  batchReassignOverdueLeadsAction,
  type OverdueLeadSummary,
} from '@/app/actions/workloadActions';
import styles from './BatchReassignModal.module.scss';

export interface BatchReassignModalProps {
  /** Visibility controller */
  isOpen: boolean;
  /** Candidate overdue leads for reassignment */
  overdueLeads: OverdueLeadSummary[];
  /** Available active commercial personnel */
  availableReps: Array<{ id: string; fullName: string; role: string; email: string }>;
  /** Optional preselected source rep to filter displayed leads */
  preselectedSourceRepId?: string | null;
  /** Modal close callback */
  onClose: () => void;
  /** Success callback */
  onSuccess?: (reassignedCount: number, destinationName: string) => void;
}

function formatCurrency(amount: number): string {
  if (!amount || amount <= 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BatchReassignModal({
  isOpen,
  overdueLeads,
  availableReps,
  preselectedSourceRepId,
  onClose,
  onSuccess,
}: BatchReassignModalProps): React.ReactElement | null {
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [destinationUserId, setDestinationUserId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('Portfolio rebalancing due to overdue touchpoints');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const repSelectId = useId();
  const reasonInputId = useId();

  // Filter leads by preselected source rep if provided
  const candidateLeads = preselectedSourceRepId
    ? overdueLeads.filter((l) => l.currentAssigneeId === preselectedSourceRepId)
    : overdueLeads;

  // Initialize selected leads to all candidate leads by default
  useEffect(() => {
    if (isOpen) {
      setSelectedLeadIds(candidateLeads.map((l) => l.id));
      setErrorMessage(null);
    }
  }, [isOpen, candidateLeads.length, preselectedSourceRepId]);

  // Body scroll lock on mount
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Focus trap and Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!containerRef.current) return;
        const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleToggleLead = (id: string): void => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (): void => {
    if (selectedLeadIds.length === candidateLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(candidateLeads.map((l) => l.id));
    }
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedLeadIds.length === 0) {
      setErrorMessage('Please select at least one overdue deal to reassign.');
      return;
    }

    if (!destinationUserId) {
      setErrorMessage('Please select a destination sales representative.');
      return;
    }

    startTransition(async () => {
      const result = await batchReassignOverdueLeadsAction({
        leadIds: selectedLeadIds,
        destinationUserId,
        reason: reassignReason.trim(),
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to reassign deals.');
        return;
      }

      const count = result.data?.reassignedCount || selectedLeadIds.length;
      const destName = result.data?.destinationName || 'Representative';

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('crm-toast', {
            detail: {
              title: 'Deals Reassigned',
              message: `Successfully transferred ${count} overdue account(s) to ${destName}.`,
              type: 'success',
            },
          })
        );
        window.dispatchEvent(new Event('popstate'));
      }

      onSuccess?.(count, destName);
      onClose();
    });
  };

  const isAllSelected = candidateLeads.length > 0 && selectedLeadIds.length === candidateLeads.length;
  const isSubmitDisabled = isPending || selectedLeadIds.length === 0 || !destinationUserId;

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={containerRef}
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-reassign-modal-title"
      >
        {/* Header */}
        <header className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.eyebrow}>Workload Rebalancing</span>
            <h2 id="batch-reassign-modal-title" className={styles.modalTitle}>
              Batch Reassign Overdue Deals
            </h2>
            <p className={styles.modalSubtitle}>
              Transfer stalled prospect accounts to active representatives to prevent deal stagnation.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close reassignment wizard"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {errorMessage && (
            <div className={styles.errorBanner} role="alert">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Overdue Deals Selection Checklist */}
          <div>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>
                Select Accounts ({selectedLeadIds.length} of {candidateLeads.length})
              </span>
              <button
                type="button"
                className={styles.selectAllButton}
                onClick={handleToggleSelectAll}
              >
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div
              className={styles.leadsListContainer}
              role="group"
              aria-label="Overdue candidate leads"
            >
              {candidateLeads.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#a1a1aa', fontSize: '13px' }}>
                  No overdue accounts match the current filter criteria.
                </div>
              ) : (
                candidateLeads.map((lead) => {
                  const isChecked = selectedLeadIds.includes(lead.id);
                  return (
                    <div
                      key={lead.id}
                      className={`${styles.leadRow} ${isChecked ? styles.selected : ''}`.trim()}
                      onClick={() => handleToggleLead(lead.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleLead(lead.id)}
                        className={styles.checkbox}
                        aria-label={`Select ${lead.leadId} ${lead.name}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className={styles.leadDetails}>
                        <div className={styles.leadHeadline}>
                          <span className={styles.leadIdToken}>{lead.leadId}</span>
                          <span className={styles.leadName}>{lead.name}</span>
                          <span className={styles.leadCompany}>• {lead.company}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>
                          Current Owner: {lead.currentAssigneeName}
                        </div>
                      </div>
                      <div className={styles.leadTrailing}>
                        <span className={styles.dealValue}>{formatCurrency(lead.expectedValue)}</span>
                        <OverdueBadge
                          nextFollowUp={lead.nextFollowUp}
                          variant="short"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Destination Representative Selector */}
          <div className={styles.formGroup}>
            <label htmlFor={repSelectId} className={styles.label}>
              Destination Representative <span style={{ color: '#ff6100' }}>*</span>
            </label>
            <select
              id={repSelectId}
              value={destinationUserId}
              onChange={(e) => setDestinationUserId(e.target.value)}
              className={styles.selectInput}
              required
            >
              <option value="">-- Choose Active Sales Representative --</option>
              {availableReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.fullName} ({rep.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Rationale Input */}
          <div className={styles.formGroup}>
            <label htmlFor={reasonInputId} className={styles.label}>
              Transfer Rationale / Audit Notes <span style={{ color: '#ff6100' }}>*</span>
            </label>
            <textarea
              id={reasonInputId}
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              className={styles.textarea}
              placeholder="Detail the operational reason for reallocating these accounts..."
              maxLength={1000}
              required
            />
          </div>

          {/* Footer */}
          <footer className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitDisabled}
            >
              {isPending && <span className={styles.spinner} aria-hidden="true" />}
              <span>
                {isPending
                  ? 'Reassigning Accounts...'
                  : `Reassign ${selectedLeadIds.length} Account${selectedLeadIds.length === 1 ? '' : 's'}`}
              </span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
