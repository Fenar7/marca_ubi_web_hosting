'use client';

/**
 * @file ConvertLeadToDealModal.tsx
 * @description Centered 1-click modal dialog for converting inbound leads into qualified pipeline deals.
 *              Allows setting expected deal valuation, target pipeline stage, designated sales representative,
 *              deal priority tier, and conversion rationale notes.
 *              Integrates with convertInboundLeadToDealAction with focus trap and dirty discard confirmation.
 * @module app/admin/components/modals/ConvertLeadToDealModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { convertInboundLeadToDealAction } from '@/app/actions/leads';
import { useModalAnimation } from './useModalAnimation';
import type { LeadPriority } from '@/types/crm';
import styles from './ConvertLeadToDealModal.module.scss';

export interface LeadForConversion {
  id: string;
  lead_id: string;
  name: string;
  company?: string | null;
  service_category?: string;
  expected_value?: number;
  assigned_to?: string | null;
  priority?: string;
}

export interface ConvertLeadToDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadForConversion | null;
  availableAssignees?: Array<{ id: string; label: string }>;
  availableStatuses?: Array<{ id: string; name: string; bucket: string }>;
  onSuccess?: (leadId: string) => void;
}

function formatCurrencyLive(val: number): string {
  if (!val || val <= 0) return '₹0';
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)}L`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
}

export function ConvertLeadToDealModal({
  isOpen,
  onClose,
  lead,
  availableAssignees = [],
  availableStatuses = [],
  onSuccess,
}: ConvertLeadToDealModalProps): React.ReactElement | null {
  const { shouldRender, isClosing, handleAnimationEnd } = useModalAnimation({
    isOpen,
    exitDurationMs: 180,
  });

  const [isPending, startTransition] = useTransition();
  const valueInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Form state
  const [expectedValue, setExpectedValue] = useState<number>(lead?.expected_value || 500000);
  const [targetStatusId, setTargetStatusId] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>(lead?.assigned_to || '');
  const [priority, setPriority] = useState<LeadPriority>('High');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Track if user has modified input fields
  const isDirty =
    notes.trim().length > 0 ||
    expectedValue !== (lead?.expected_value || 500000) ||
    assignedTo !== (lead?.assigned_to || '') ||
    priority !== ((lead?.priority as LeadPriority) || 'High');

  const handleSafeClose = useCallback((): void => {
    if (isPending) return;
    if (isDirty) {
      const confirmDiscard = window.confirm(
        'You have unsaved deal conversion details. Discard changes and close?'
      );
      if (!confirmDiscard) return;
    }
    onClose();
  }, [isPending, isDirty, onClose]);

  // Auto-focus and pre-populate when opened
  useEffect(() => {
    if (isOpen && lead) {
      setExpectedValue(lead.expected_value || 500000);
      setAssignedTo(lead.assigned_to || '');
      setPriority((lead.priority as LeadPriority) || 'High');
      setNotes('');
      setErrorMsg(null);

      // Default target status to first potential stage
      const firstPotential = availableStatuses.find((s) => s.bucket === 'potential');
      if (firstPotential) {
        setTargetStatusId(firstPotential.id);
      } else if (availableStatuses.length > 0) {
        setTargetStatusId(availableStatuses[0].id);
      }

      setTimeout(() => {
        valueInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, lead, availableStatuses]);

  // Keyboard escape key and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSafeClose();
        return;
      }

      // Accessible Focus Trap within modal dialog
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSafeClose]);

  if (!shouldRender || !lead) return null;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await convertInboundLeadToDealAction({
        leadId: lead.id,
        targetStatusId: targetStatusId || undefined,
        expectedValue,
        assignedTo: assignedTo || null,
        priority,
        notes: notes.trim() || null,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to convert lead to deal.');
      } else {
        if (onSuccess) {
          onSuccess(lead.id);
        }
        onClose();
      }
    });
  };

  return (
    <div
      className={`${styles.backdrop} ${isClosing ? styles.backdropClosing : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          handleSafeClose();
        }
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        ref={modalRef}
        className={`${styles.modalSurface} ${isClosing ? styles.modalSurfaceClosing : ''}`}
        role="dialog"
        aria-labelledby="convert-deal-heading"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleArea}>
            <span className={styles.eyebrow}>Speed-to-Lead Triage</span>
            <h2 id="convert-deal-heading" className={styles.modalHeading}>
              Convert to Pipeline Deal
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleSafeClose}
            disabled={isPending}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {errorMsg && (
              <div className={styles.generalErrorBanner} role="alert">
                {errorMsg}
              </div>
            )}

            {/* Target Account Summary Banner */}
            <div className={styles.leadInfoCard}>
              <div className={styles.leadDetails}>
                <span className={styles.leadCode}>{lead.lead_id}</span>
                <span className={styles.leadClient}>{lead.company || lead.name}</span>
                <span className={styles.leadScope}>
                  Scope: {lead.service_category || 'Commercial Inquiry'}
                </span>
              </div>
              <div className={styles.leadLiveEstimate}>
                <span className={styles.estimateLabel}>Initial Value</span>
                <span className={styles.estimateAmount}>
                  {formatCurrencyLive(expectedValue)}
                </span>
              </div>
            </div>

            {/* Valuation Input */}
            <div className={styles.formGroup}>
              <label htmlFor="deal-expected-value" className={styles.fieldLabel}>
                Contract Expected Valuation (₹ INR) <span className={styles.requiredMark}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.currencyPrefix}>₹</span>
                <input
                  ref={valueInputRef}
                  id="deal-expected-value"
                  type="number"
                  min="0"
                  step="10000"
                  className={styles.currencyInput}
                  value={expectedValue}
                  onChange={(e) => setExpectedValue(Math.max(0, Number(e.target.value) || 0))}
                  disabled={isPending}
                  required
                />
              </div>
              <span className={styles.fieldHelper}>
                Active valuation for pipeline weighting and forecasting. Live: {formatCurrencyLive(expectedValue)}
              </span>
            </div>

            {/* Stage & Assignee Row */}
            <div className={styles.formRowTwoCol}>
              <div className={styles.formGroup}>
                <label htmlFor="deal-target-stage" className={styles.fieldLabel}>
                  Target Pipeline Stage <span className={styles.requiredMark}>*</span>
                </label>
                <select
                  id="deal-target-stage"
                  className={styles.selectInput}
                  value={targetStatusId}
                  onChange={(e) => setTargetStatusId(e.target.value)}
                  disabled={isPending}
                  required
                >
                  {availableStatuses.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.bucket})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="deal-assigned-rep" className={styles.fieldLabel}>
                  Assigned Commercial Lead
                </label>
                <select
                  id="deal-assigned-rep"
                  className={styles.selectInput}
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  disabled={isPending}
                >
                  <option value="">Unassigned</option>
                  {availableAssignees.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority Tier */}
            <div className={styles.formGroup}>
              <label htmlFor="deal-priority" className={styles.fieldLabel}>
                Commercial Priority Tier
              </label>
              <select
                id="deal-priority"
                className={styles.selectInput}
                value={priority}
                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                disabled={isPending}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Conversion Notes */}
            <div className={styles.formGroup}>
              <label htmlFor="deal-notes" className={styles.fieldLabel}>
                Strategic Handover Notes
              </label>
              <textarea
                id="deal-notes"
                className={styles.textareaInput}
                placeholder="Key requirements, client expectations, or proposal timeline..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                rows={3}
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleSafeClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isPending || expectedValue < 0}
            >
              {isPending ? 'Converting...' : 'Convert to Pipeline Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
