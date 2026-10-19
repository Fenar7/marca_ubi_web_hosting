'use client';

/**
 * @file SuspendUserModal.tsx
 * @description Dedicated dark luxury confirmation dialog for employee offboarding,
 *              session revocation, and account suspension (/admin/team).
 *              Displays commercial impact metrics (active deals count & pipeline valuation),
 *              prompts for administrative offboarding rationale, and executes
 *              the suspendTeamUser Server Action with instant token revocation.
 * @module app/admin/team/components/SuspendUserModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect } from 'react';
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

  // Reset state when modal opens for a new member
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, member?.id]);

  // Handle Escape key to dismiss dialog safely
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
    >
      <div className={styles.modalCard} style={{ maxWidth: '480px' }}>
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

        {/* Warning Alert Banner */}
        <div className={styles.suspendAlertBanner}>
          <svg
            className={styles.suspendAlertIcon}
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
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <h3 id="suspend-modal-title" style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
              Confirm Account Offboarding & Suspension
            </h3>
            <p id="suspend-modal-desc" className={styles.modalAlertText}>
              Suspending <strong>{member.full_name}</strong> will terminate all active authentication sessions immediately across all devices and block database permissions via Row Level Security.
            </p>
          </div>
        </div>

        {/* Target Identity Overview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.75rem 1rem',
            background: '#0b0b0d',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}
        >
          <div className={styles.avatar}>
            {getInitials(member.full_name)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
              {member.full_name}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#888888' }}>
              {member.email} · {member.job_title}
            </span>
          </div>
        </div>

        {/* Deal Impact Breakdown Card */}
        <div className={styles.suspendImpactCard}>
          <div className={styles.suspendImpactRow}>
            <span className={styles.suspendImpactKey}>Active Deals Managed</span>
            <span className={styles.suspendImpactVal}>{member.active_deals_count} deals</span>
          </div>
          <div className={styles.suspendImpactRow}>
            <span className={styles.suspendImpactKey}>Cumulative Pipeline Value</span>
            <span className={styles.suspendImpactVal}>
              {member.total_deal_value > 0 ? formatDealValuation(member.total_deal_value) : '₹0'}
            </span>
          </div>

          {hasActiveDeals && (
            <div className={styles.suspendImpactDealsAlert}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <strong>Action Required:</strong> This representative currently manages {member.active_deals_count} active deal{member.active_deals_count > 1 ? 's' : ''}. Suspending this account will flag these deals for reassignment to prevent orphaned pipeline accounts.
            </div>
          )}
        </div>

        {/* Administrative Offboarding Reason Input */}
        <div className={styles.suspendReasonField}>
          <label htmlFor="suspension-reason" className={styles.suspendReasonLabel}>
            Offboarding Justification (Optional)
          </label>
          <textarea
            id="suspension-reason"
            className={styles.suspendReasonInput}
            placeholder="e.g. Departed agency, restructuring, temporary administrative leave..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            disabled={isSubmitting}
            aria-label="Reason for account suspension"
          />
        </div>

        {/* Modal Action Controls */}
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
            {isSubmitting ? (
              <span>Revoking Sessions...</span>
            ) : (
              <span>Suspend & Revoke Access</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
