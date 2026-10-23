'use client';

/**
 * @file EditUserPermissionsModal.tsx
 * @description Granular Tab Permissions Governance Modal dialog (620px).
 *              Allows administrators to fine-tune each staff member's accessible tabs
 *              across the 3 canonical functional enclaves.
 *              Enforces defensive admin self-lockout invariants, accessible touch targets,
 *              avatar photography support, and Marca Ubi Brand Action button standards.
 * @module app/admin/team/components/EditUserPermissionsModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import Image from 'next/image';
import type { TeamMemberRosterItem, CrmTabKey } from '@/types/crm';
import { ROLE_DEFAULT_TABS } from '@/types/crm';
import { updateUserPermissions } from '@/app/actions/team';
import { getInitials } from '@/app/lib/team-utils';
import { useModalAnimation } from '@/app/admin/components/modals/useModalAnimation';
import { PERMISSION_ENCLAVES } from '@/app/lib/team-permissions-config';
import styles from './EditUserPermissionsModal.module.scss';

export interface EditUserPermissionsModalProps {
  isOpen: boolean;
  targetMember: TeamMemberRosterItem | null;
  currentUserId: string;
  onClose: () => void;
  onPermissionsUpdated: (userId: string, newTabs: string[]) => void;
}

export function EditUserPermissionsModal({
  isOpen,
  targetMember,
  currentUserId,
  onClose,
  onPermissionsUpdated,
}: EditUserPermissionsModalProps): React.ReactElement | null {
  const { shouldRender, isClosing, handleAnimationEnd } = useModalAnimation({
    isOpen,
    exitDurationMs: 180,
  });

  const [isPending, startTransition] = useTransition();
  const [allowedTabs, setAllowedTabs] = useState<CrmTabKey[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<boolean>(false);

  const isSelf = targetMember?.id === currentUserId;

  // Initialize allowedTabs and avatar error state when modal opens
  useEffect(() => {
    if (isOpen && targetMember) {
      if (Array.isArray(targetMember.allowed_tabs)) {
        setAllowedTabs([...(targetMember.allowed_tabs as CrmTabKey[])]);
      } else {
        const defaults = ROLE_DEFAULT_TABS[targetMember.role];
        if (defaults) {
          const keys = (Object.keys(defaults) as CrmTabKey[]).filter((k) => defaults[k]);
          setAllowedTabs(keys);
        } else {
          setAllowedTabs(['command_center', 'leads', 'deals', 'works', 'tasks']);
        }
      }
      setErrorMessage(null);
      setAvatarError(false);
    }
  }, [isOpen, targetMember]);

  const requestClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        requestClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, requestClose]);

  if (!shouldRender || !targetMember) {
    return null;
  }

  const handleToggleTab = (tabKey: CrmTabKey) => {
    // Admin self-lockout defense: prevent revoking users or settings on own account or any administrator
    const isTargetAdmin = targetMember.role === 'admin';
    if ((isSelf || isTargetAdmin) && (tabKey === 'users' || tabKey === 'settings')) {
      return;
    }

    setAllowedTabs((prev) =>
      prev.includes(tabKey) ? prev.filter((k) => k !== tabKey) : [...prev, tabKey]
    );
  };

  const handleSelectAll = () => {
    setAllowedTabs([
      'command_center',
      'leads',
      'deals',
      'works',
      'tasks',
      'users',
      'analytics',
      'ingestion',
      'settings',
    ]);
  };

  const handleResetToDefaults = () => {
    const defaults = ROLE_DEFAULT_TABS[targetMember.role];
    if (defaults) {
      const keys = (Object.keys(defaults) as CrmTabKey[]).filter((k) => defaults[k]);
      setAllowedTabs(keys);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    // Defensive check before initiating network mutation
    if (isSelf && (!allowedTabs.includes('users') || !allowedTabs.includes('settings'))) {
      setErrorMessage(
        'Self-Lockout Violation: Administrators cannot revoke their own access to the Users or Settings workspace tabs.'
      );
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateUserPermissions({
          targetUserId: targetMember.id,
          allowedTabs,
        });

        if (!result.success) {
          setErrorMessage(result.error || 'Failed to update user tab permissions.');
          return;
        }

        onPermissionsUpdated(targetMember.id, allowedTabs);
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setErrorMessage(msg);
      }
    });
  };

  return (
    <div
      className={`${styles.modalOverlay} ${isClosing ? styles.overlayClosing : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          requestClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-permissions-modal-title"
    >
      <div
        className={`${styles.modalDialog} ${isClosing ? styles.dialogClosing : ''}`}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* Modal Header with 36px Circular Close Action */}
        <div className={styles.modalHeader}>
          <div className={styles.headerMeta}>
            <span className={styles.eyebrow}>Governance & RBAC</span>
            <h2 id="edit-permissions-modal-title" className={styles.modalTitle}>
              Configure Tab Permissions.
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={requestClose}
            aria-label="Close permissions modal (Esc)"
            title="Close modal (Esc)"
          >
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {errorMessage && (
            <div className={styles.errorAlert} role="alert" aria-live="assertive">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* User Identity Dossier Strip with Photography Support */}
          <div className={styles.userDossierStrip}>
            <div className={styles.avatarWrapper}>
              {targetMember.avatar_url && !avatarError ? (
                <Image
                  src={targetMember.avatar_url}
                  alt={`${targetMember.full_name}'s avatar`}
                  width={46}
                  height={46}
                  className={styles.avatarImage}
                  onError={() => setAvatarError(true)}
                  unoptimized
                />
              ) : (
                <div className={styles.avatarFallback} aria-hidden="true">
                  {getInitials(targetMember.full_name)}
                </div>
              )}
            </div>
            <div className={styles.userDetails}>
              <div className={styles.userNameRow}>
                <span className={styles.userName}>{targetMember.full_name}</span>
                <span className={styles.roleBadge}>{targetMember.role.replace('_', ' ')}</span>
              </div>
              <span className={styles.userEmail}>{targetMember.email} · {targetMember.job_title}</span>
            </div>
          </div>

          {/* Self-Lockout Advisory */}
          {isSelf && (
            <div className={styles.selfLockoutAlert} role="note">
              <div className={styles.alertIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <strong>Administrator Self-Protection Active</strong>: To prevent permanent lockout, your administrative access to the <em>User Governance</em> and <em>Security & Settings</em> tabs is locked and cannot be revoked.
              </div>
            </div>
          )}

          {/* 3 Enclaves & 9 Tabs Checkbox Grid */}
          <div className={styles.enclavesContainer}>
            {PERMISSION_ENCLAVES.map((enclave) => {
              const authorizedCount = enclave.tabs.filter((t) => allowedTabs.includes(t.key)).length;
              return (
                <div key={enclave.enclaveTitle} className={styles.enclaveSection}>
                  <div className={styles.enclaveHeader}>
                    <span className={styles.enclaveName}>{enclave.enclaveTitle}</span>
                    <span className={styles.enclaveBadge}>
                      {authorizedCount}/{enclave.tabs.length} Authorized
                    </span>
                  </div>

                  <div className={styles.tabsGrid}>
                    {enclave.tabs.map((tab) => {
                      const isChecked = allowedTabs.includes(tab.key);
                      const isLocked =
                        (isSelf || targetMember.role === 'admin') &&
                        (tab.key === 'users' || tab.key === 'settings');

                      return (
                        <div
                          key={tab.key}
                          className={`${styles.tabCard} ${isChecked ? styles.tabCardActive : ''} ${
                            isLocked ? styles.tabCardLocked : ''
                          }`}
                          onClick={() => !isPending && !isLocked && handleToggleTab(tab.key)}
                          onKeyDown={(e) => {
                            if ((e.key === ' ' || e.key === 'Enter') && !isPending && !isLocked) {
                              e.preventDefault();
                              handleToggleTab(tab.key);
                            }
                          }}
                          role="checkbox"
                          aria-checked={isChecked}
                          aria-disabled={isLocked}
                          tabIndex={isLocked ? -1 : 0}
                          aria-label={`${tab.label} (${tab.route}) ${
                            isLocked ? (isSelf ? 'Locked for self-protection' : 'Locked administrator invariant') : ''
                          }`}
                        >
                          <div className={styles.customCheckbox} aria-hidden="true">
                            {isChecked && (
                              <svg
                                className={styles.checkIcon}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <div className={styles.tabMeta}>
                            <div className={styles.tabTitleRow}>
                              <span className={styles.tabLabel}>{tab.label}</span>
                              {isLocked && (
                                <span className={styles.lockedPill}>Locked</span>
                              )}
                            </div>
                            <span className={styles.tabHint}>{tab.hint}</span>
                            <div className={styles.tabRouteTag}>
                              <span className={styles.tabRoute}>{tab.route}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Footer with Standardized 38px Buttons */}
          <div className={styles.modalFooter}>
            <div className={styles.footerLeft}>
              <button
                type="button"
                className={styles.quickActionBtn}
                onClick={handleSelectAll}
                disabled={isPending}
                title="Grant access to all 9 tabs"
              >
                Select All
              </button>
              <button
                type="button"
                className={styles.quickActionBtn}
                onClick={handleResetToDefaults}
                disabled={isPending}
                title="Reset to default tabs for this role"
              >
                Role Defaults
              </button>
            </div>
            <div className={styles.footerRight}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={requestClose}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isPending}
              >
                {isPending && <span className={styles.btnSpinner} aria-hidden="true" />}
                <span>{isPending ? 'Updating...' : 'Save Permissions'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
