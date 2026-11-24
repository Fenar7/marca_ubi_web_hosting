'use client';

/**
 * @file PersonnelSecurityEnclave.tsx
 * @description Administrative security enclave providing temporary password provisioning,
 *              mandatory first-login password rotation, and accessible global session revocation.
 */

import React, { useState, useTransition, useRef, useEffect } from 'react';
import type { Profile } from '@/types/crm';
import { adminResetPersonnelPassword, adminRevokePersonnelSessions } from '@/app/actions/team';
import styles from './PersonnelSecurityEnclave.module.scss';

interface PersonnelSecurityEnclaveProps {
  profile: Profile;
  canEdit: boolean;
  isSelf: boolean;
}

export function PersonnelSecurityEnclave({
  profile,
  canEdit,
  isSelf,
}: PersonnelSecurityEnclaveProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const isAnyDialogOpen = (showPasswordModal && Boolean(generatedPassword)) || showRevokeConfirm;

  useEffect(() => {
    if (isAnyDialogOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        const firstBtn = modalRef.current?.querySelector<HTMLElement>('button:not([disabled])');
        firstBtn?.focus();
      }, 30);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }

    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
    return undefined;
  }, [isAnyDialogOpen]);

  useEffect(() => {
    if (!isAnyDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (showRevokeConfirm && !isPending) {
          setShowRevokeConfirm(false);
        } else if (showPasswordModal) {
          setShowPasswordModal(false);
        }
        return;
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnyDialogOpen, showRevokeConfirm, showPasswordModal, isPending]);

  const handleResetPassword = (): void => {
    setAlert(null);
    startTransition(async () => {
      const res = await adminResetPersonnelPassword(profile.id, undefined, true);
      if (res.success && res.data) {
        setGeneratedPassword(res.data.tempPassword);
        setShowPasswordModal(true);
        setAlert({
          type: 'success',
          message: 'Temporary password generated. Forward this credential securely to the user.',
        });
      } else {
        setAlert({
          type: 'error',
          message: res.error || 'Failed to generate temporary password.',
        });
      }
    });
  };

  const handleConfirmRevokeSessions = (): void => {
    setAlert(null);
    startTransition(async () => {
      const res = await adminRevokePersonnelSessions(profile.id);
      setShowRevokeConfirm(false);
      if (res.success && res.data) {
        setAlert({
          type: 'success',
          message: res.data.message,
        });
      } else {
        setAlert({
          type: 'error',
          message: res.error || 'Failed to revoke user sessions.',
        });
      }
    });
  };

  const handleCopyPassword = async (): Promise<void> => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored cleanly when insecure context rejects
    }
  };

  return (
    <div className={styles.enclaveCard}>
      <div className={styles.headerRow}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <h3 className={styles.title}>Security &amp; Authentication</h3>
      </div>

      <div className={styles.securityList}>
        <div className={styles.securityItem}>
          <span className={styles.itemLabel}>Password Rotation</span>
          <span
            className={`${styles.itemValue} ${
              profile.must_change_password ? styles.flagPending : styles.flagCleared
            }`}
          >
            {profile.must_change_password ? 'Rotation Pending' : 'Compliant'}
          </span>
        </div>

        <div className={styles.securityItem}>
          <span className={styles.itemLabel}>Last Authenticated</span>
          <span className={styles.itemValue}>
            {profile.last_login_at
              ? new Date(profile.last_login_at).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Never logged in'}
          </span>
        </div>

        <div className={styles.securityItem}>
          <span className={styles.itemLabel}>Account State</span>
          <span className={`${styles.itemValue} ${styles.statusText}`}>
            {profile.status}
          </span>
        </div>
      </div>

      {alert && (
        <div className={`${styles.alertBox} ${styles[alert.type]}`} role="alert">
          {alert.message}
        </div>
      )}

      {canEdit && (
        <div className={styles.actionSection}>
          <button
            type="button"
            className={styles.primaryActionBtn}
            onClick={handleResetPassword}
            disabled={isPending}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            <span>{isPending ? 'Generating...' : 'Reset Temporary Password'}</span>
          </button>

          <button
            type="button"
            className={styles.secondaryActionBtn}
            onClick={() => setShowRevokeConfirm(true)}
            disabled={isPending || isSelf}
            title={isSelf ? 'Cannot revoke your own active session' : 'Sign out across all devices'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            <span>Terminate All Active Sessions</span>
          </button>
        </div>
      )}

      {showPasswordModal && generatedPassword && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowPasswordModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="temp-credential-modal-title"
        >
          <div ref={modalRef} className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h4 id="temp-credential-modal-title" className={styles.modalTitle}>
              Temporary Credential Issued
            </h4>
            <p className={styles.modalText}>
              A secure 16-character temporary password has been provisioned for <strong>{profile.full_name}</strong>.
              The account is flagged with <code>must_change_password = true</code>. Provide this to the team member:
            </p>

            <div className={styles.tempPasswordBox}>
              <span>{generatedPassword}</span>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={handleCopyPassword}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <span className={styles.srOnly} aria-live="polite">
              {copied ? 'Temporary credential copied to clipboard.' : ''}
            </span>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowPasswordModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showRevokeConfirm && (
        <div
          className={styles.modalOverlay}
          onClick={() => !isPending && setShowRevokeConfirm(false)}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="revoke-sessions-title"
          aria-describedby="revoke-sessions-desc"
        >
          <div ref={modalRef} className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h4 id="revoke-sessions-title" className={styles.modalTitle}>
              Terminate All Active Sessions?
            </h4>
            <p id="revoke-sessions-desc" className={styles.modalText}>
              All active workspace tokens for <strong>{profile.full_name}</strong> will be immediately invalidated, logging the user out across every device.
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setShowRevokeConfirm(false)}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={handleConfirmRevokeSessions}
                disabled={isPending}
              >
                {isPending ? 'Terminating...' : 'Confirm Termination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
