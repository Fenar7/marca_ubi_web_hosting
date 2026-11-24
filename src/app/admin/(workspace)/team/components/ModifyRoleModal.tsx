'use client';

/**
 * @file ModifyRoleModal.tsx
 * @description Focused modal dialog for modifying a team member's governance role.
 *              Enforces self-demotion protection, focus trapping, focus restoration,
 *              and Escape dismissal per WCAG 2.1 AA and DESIGN.md.
 * @module app/admin/team/components/ModifyRoleModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useRef, useTransition } from 'react';
import type { TeamMemberRosterItem, CrmUserRole } from '@/types/crm';
import { updateTeamUserRole } from '@/app/actions/team';
import styles from '../team.module.scss';

export interface ModifyRoleModalProps {
  isOpen: boolean;
  targetMember: TeamMemberRosterItem | null;
  currentUserId: string;
  onClose: () => void;
  onRoleUpdated: (userId: string, newRole: CrmUserRole) => void;
}

export function ModifyRoleModal({
  isOpen,
  targetMember,
  currentUserId,
  onClose,
  onRoleUpdated,
}: ModifyRoleModalProps): React.ReactElement | null {
  const [selectedRole, setSelectedRole] = useState<CrmUserRole>('sales_executive');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen && targetMember) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setSelectedRole(targetMember.role);
      setErrorMessage(null);
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'select:not([disabled]), button:not([disabled])'
        );
        firstFocusable?.focus();
      });
    }

    return () => {
      document.body.style.overflow = '';
      if (isOpen && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, targetMember]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !isPending) {
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
  }, [isOpen, isPending, onClose]);

  if (!isOpen || !targetMember) {
    return null;
  }

  const isSelfRoleEdit = targetMember.id === currentUserId;

  const handleConfirm = (): void => {
    if (isSelfRoleEdit && selectedRole !== 'admin') {
      setErrorMessage(
        'Security Policy Violation: Administrators cannot demote their own account. Another administrator must perform this action.'
      );
      return;
    }
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await updateTeamUserRole(targetMember.id, selectedRole);
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to update governance role.');
          return;
        }
        onRoleUpdated(targetMember.id, selectedRole);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
      }
    });
  };

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div className={`${styles.modalCard} ${styles.compactModalCard}`} ref={modalRef}>
        <div className={styles.modalHeaderRow}>
          <h3 id="role-modal-title" className={styles.modalHeading}>
            Modify Governance Role.
          </h3>
          <button
            type="button"
            className={styles.drawerCloseButton}
            onClick={onClose}
            disabled={isPending}
            aria-label="Close role dialog (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className={styles.modalSubtitle}>
          Update role privileges and database RLS boundaries for{' '}
          <strong>{targetMember.full_name}</strong> ({targetMember.email}).
        </p>

        {errorMessage && (
          <div className={styles.modalErrorBanner} role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        <div className={styles.drawerFormGroup}>
          <label htmlFor="new-role-select" className={styles.drawerLabel}>
            Assigned Role
          </label>
          <select
            id="new-role-select"
            className={styles.drawerSelect}
            value={selectedRole}
            onChange={(e) => {
              const roleVal = e.target.value as CrmUserRole;
              if (isSelfRoleEdit && roleVal !== 'admin') return;
              setSelectedRole(roleVal);
            }}
            disabled={isPending || isSelfRoleEdit}
          >
            <option value="sales_executive" disabled={isSelfRoleEdit}>
              Sales Executive (Own Deals Only)
            </option>
            <option value="sales_manager" disabled={isSelfRoleEdit}>
              Sales Manager (Global Pipeline View)
            </option>
            <option value="admin">Administrator (Full Access & Governance)</option>
            <option value="viewer" disabled={isSelfRoleEdit}>
              Viewer (Read-Only Financials)
            </option>
          </select>

          {isSelfRoleEdit && (
            <div className={styles.modalAlertBanner}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.modalAlertIcon}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className={styles.modalAlertText}>
                Administrators cannot demote their own account. Another administrator must perform this action.
              </p>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.doneButton}
            onClick={handleConfirm}
            disabled={isPending || isSelfRoleEdit || selectedRole === targetMember.role}
          >
            {isPending ? 'Saving...' : 'Save Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
