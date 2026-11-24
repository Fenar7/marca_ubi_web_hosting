'use client';

/**
 * @file SuspendUserModal.tsx
 * @description Marca Ubi Editorial Luxury confirmation dialog for employee offboarding,
 *              session revocation, and account suspension (/admin/team).
 * @module app/admin/team/components/SuspendUserModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useRef } from 'react';
import type { TeamMemberRosterItem, Profile } from '@/types/crm';
import { suspendTeamUser } from '@/app/actions/team';
import { formatDealValuation, getInitials } from '@/app/lib/team-utils';
import styles from '../team.module.scss';

interface SuspendUserModalProps {
  member: TeamMemberRosterItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProfile: Profile, suspendedUserId: string) => void;
}

export function SuspendUserModal({
  member,
  isOpen,
  onClose,
  onSuccess,
}: SuspendUserModalProps): React.ReactElement | null {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setReason('');
      setErrorMessage(null);
      setIsSubmitting(false);
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled])'
        );
        firstFocusable?.focus();
      });
    }

    return () => {
      requestAnimationFrame(() => {
        if (!document.querySelector('[aria-modal="true"]')) {
          document.body.style.overflow = '';
        }
      });
      if (isOpen && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, member?.id]);

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

  if (!isOpen || !member) return null;

  const handleConfirmSuspension = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await suspendTeamUser(member.id, reason.trim() || undefined);

      if (!result.success || !result.data) {
        setErrorMessage(result.error || 'Failed to complete employee suspension.');
        setIsSubmitting(false);
        return;
      }

      onSuccess(result.data, member.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected network error occurred.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  const hasActiveDeals = member.active_deals_count > 0;

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspend-modal-title"
      aria-describedby="suspend-modal-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div ref={modalRef} className={styles.modalCard} style={{ maxWidth: '480px' }}>
        <div className={styles.modalHeaderRow}>
          <h3 id="suspend-modal-title" className={styles.modalHeading}>
            Confirm Account Offboarding & Suspension.
          </h3>
          <button
            type="button"
            className={styles.drawerCloseButton}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close suspension dialog (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {errorMessage && (
          <div className={styles.modalErrorBanner} role="alert">
            {errorMessage}
          </div>
        )}

        <div className={styles.suspendAlertBanner}>
          <svg
            className={styles.suspendAlertIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p id="suspend-modal-desc" className={styles.modalAlertText}>
            Suspending <strong>{member.full_name}</strong> terminates all active sessions immediately and revokes workspace access via Row Level Security.
          </p>
        </div>

        <div className={styles.suspendImpactCard}>
          <div className={styles.suspendImpactRow}>
            <span className={styles.suspendImpactKey}>Target Member</span>
            <span className={styles.suspendImpactVal}>{member.email}</span>
          </div>
          <div className={styles.suspendImpactRow}>
            <span className={styles.suspendImpactKey}>Active Deals Managed</span>
            <span className={styles.suspendImpactVal}>{member.active_deals_count} deals</span>
          </div>
          <div className={styles.suspendImpactRow}>
            <span className={styles.suspendImpactKey}>Pipeline Valuation</span>
            <span className={styles.suspendImpactVal}>
              {member.total_deal_value > 0 ? formatDealValuation(member.total_deal_value) : '₹0'}
            </span>
          </div>

          {hasActiveDeals && (
            <div className={styles.suspendImpactDealsAlert}>
              <strong>Action Required:</strong> This representative manages {member.active_deals_count} active deal{member.active_deals_count > 1 ? 's' : ''}. Reassign active accounts so opportunities are not stranded.
            </div>
          )}
        </div>

        <div className={styles.suspendReasonField}>
          <label htmlFor="suspension-reason" className={styles.suspendReasonLabel}>
            Offboarding Justification (Optional)
          </label>
          <textarea
            id="suspension-reason"
            className={styles.suspendReasonInput}
            placeholder="e.g. Departed agency, role transition, administrative hold..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.copyButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.suspendDestructiveButton}
            onClick={handleConfirmSuspension}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Revoking Sessions...' : 'Suspend & Revoke Access'}
          </button>
        </div>
      </div>
    </div>
  );
}
