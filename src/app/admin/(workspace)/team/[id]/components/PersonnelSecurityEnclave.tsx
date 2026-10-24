'use client';

/**
 * @file PersonnelSecurityEnclave.tsx
 * @description Administrative security enclave providing temporary password provisioning,
 *              mandatory first-login password rotation, and global session revocation.
 * @module app/admin/team/[id]/components/PersonnelSecurityEnclave
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useTransition } from 'react';
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
  const [copied, setCopied] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleRevokeSessions = (): void => {
    if (!window.confirm(`Are you sure you want to terminate all active sessions for ${profile.full_name}? The user will be immediately logged out across all devices.`)) {
      return;
    }

    setAlert(null);
    startTransition(async () => {
      const res = await adminRevokePersonnelSessions(profile.id);
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
      // Fallback
    }
  };

  return (
    <div className={styles.enclaveCard}>
      <div className={styles.headerRow}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <h3 className={styles.title}>Security & Authentication</h3>
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
          <span className={styles.itemValue} style={{ textTransform: 'capitalize' }}>
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            <span>{isPending ? 'Generating...' : 'Reset Temporary Password'}</span>
          </button>

          <button
            type="button"
            className={styles.secondaryActionBtn}
            onClick={handleRevokeSessions}
            disabled={isPending || isSelf}
            title={isSelf ? 'Cannot revoke your own active session' : 'Sign out across all devices'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            <span>Terminate All Active Sessions</span>
          </button>
        </div>
      )}

      {/* Temporary Password Reveal Modal */}
      {showPasswordModal && generatedPassword && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Temporary Credentials">
          <div className={styles.modalCard}>
            <h4 className={styles.modalTitle}>Temporary Credential Issued</h4>
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

            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setShowPasswordModal(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
