'use client';

/**
 * @file AddTeamMemberDrawer.tsx
 * @description Slide-out administrative user provisioning drawer component.
 *              Enforces instant Zod validation, generates 16-character high-entropy temporary passwords,
 *              guards against accidental drawer dismissal with unsaved changes detection,
 *              and submits to Server Action createTeamUser.
 * @module app/admin/team/components/AddTeamMemberDrawer
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { createTeamUser } from '@/app/actions/team';
import type { CrmUserRole } from '@/types/crm';
import { generateHighEntropyPassword, isDrawerDirty } from '@/app/lib/team-utils';
import type { ProvisionedCredentialsPayload } from './CredentialRevealModal';
import styles from '../team.module.scss';

export { generateHighEntropyPassword };

interface AddTeamMemberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (credentials: ProvisionedCredentialsPayload) => void;
}

export function AddTeamMemberDrawer({
  isOpen,
  onClose,
  onUserCreated,
}: AddTeamMemberDrawerProps): React.ReactElement | null {
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CrmUserRole>('sales_executive');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Unsaved changes confirmation modal state
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);

  // Initialize or regenerate temporary password on drawer open
  useEffect(() => {
    if (isOpen) {
      setFullName('');
      setEmail('');
      setRole('sales_executive');
      setJobTitle('');
      setPhone('');
      setTempPassword(generateHighEntropyPassword());
      setShowPassword(false);
      setFormErrors({});
      setGeneralError(null);
      setShowDiscardPrompt(false);
    }
  }, [isOpen]);

  // Determine whether the form contains unsaved modifications
  const isDirty = isDrawerDirty(fullName, email, jobTitle, phone, role);

  const requestClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardPrompt(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Close on Escape key press with dirty check
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        if (showDiscardPrompt) {
          setShowDiscardPrompt(false);
        } else {
          requestClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showDiscardPrompt, requestClose]);

  if (!isOpen) {
    return null;
  }

  const handleRegeneratePassword = () => {
    setTempPassword(generateHighEntropyPassword());
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormErrors({});
    setGeneralError(null);

    // Client-side pre-validation
    const errors: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'Full name must contain at least 2 characters.';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'A valid business email address is required.';
    }
    if (!jobTitle.trim() || jobTitle.trim().length < 2) {
      errors.jobTitle = 'Job title must contain at least 2 characters.';
    }
    if (!tempPassword || tempPassword.length < 8) {
      errors.tempPassword = 'Temporary password is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          role,
          jobTitle: jobTitle.trim(),
          phone: phone.trim() || null,
          tempPassword,
        };

        const result = await createTeamUser(payload);

        if (!result.success) {
          if (result.validationErrors) {
            setFormErrors(result.validationErrors);
          }
          setGeneralError(result.error || 'Failed to provision team member account.');
          return;
        }

        // Forward credentials to reveal modal and close drawer
        onUserCreated({
          fullName: payload.fullName,
          email: payload.email,
          role: payload.role,
          jobTitle: payload.jobTitle,
          tempPassword: payload.tempPassword,
        });

        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setGeneralError(msg);
      }
    });
  };

  return (
    <>
      <div
        className={styles.drawerOverlay}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            requestClose();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className={styles.drawer}>
          {/* Drawer Header */}
          <div className={styles.drawerHeader}>
            <div>
              <span className={styles.eyebrow}>User Governance</span>
              <h2 id="drawer-title" className={styles.drawerTitle}>
                Add Team Member
              </h2>
            </div>
            <button
              type="button"
              className={styles.drawerCloseButton}
              onClick={requestClose}
              aria-label="Close add team member drawer"
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

          {/* Drawer Body Form */}
          <form id="add-team-user-form" className={styles.drawerBody} onSubmit={handleFormSubmit} noValidate>
            {generalError && (
              <div className={styles.errorMessage} role="alert" aria-live="assertive">
                {generalError}
              </div>
            )}

            {/* Full Name Field */}
            <div className={styles.drawerFormGroup}>
              <label htmlFor="team-member-name" className={styles.drawerLabel}>
                Full Name *
              </label>
              <input
                id="team-member-name"
                name="fullName"
                type="text"
                className={styles.drawerInput}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Anita Nair"
                disabled={isPending}
                required
              />
              {formErrors.fullName && <span className={styles.fieldError}>{formErrors.fullName}</span>}
            </div>

            {/* Email Field */}
            <div className={styles.drawerFormGroup}>
              <label htmlFor="team-member-email" className={styles.drawerLabel}>
                Work Email Address *
              </label>
              <input
                id="team-member-email"
                name="email"
                type="email"
                className={styles.drawerInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anita@marcaubi.com"
                disabled={isPending}
                required
              />
              {formErrors.email && <span className={styles.fieldError}>{formErrors.email}</span>}
            </div>

            {/* Role Field */}
            <div className={styles.drawerFormGroup}>
              <label htmlFor="team-member-role" className={styles.drawerLabel}>
                Commercial Role *
              </label>
              <select
                id="team-member-role"
                name="role"
                className={styles.drawerSelect}
                value={role}
                onChange={(e) => setRole(e.target.value as CrmUserRole)}
                disabled={isPending}
              >
                <option value="sales_executive">Sales Executive (Own Leads Only)</option>
                <option value="sales_manager">Sales Manager (Team & Pipeline View)</option>
                <option value="admin">Administrator (Full Access & Governance)</option>
                <option value="viewer">Viewer (Read-Only Financials)</option>
              </select>
              {formErrors.role && <span className={styles.fieldError}>{formErrors.role}</span>}
            </div>

            {/* Job Title Field */}
            <div className={styles.drawerFormGroup}>
              <label htmlFor="team-member-title" className={styles.drawerLabel}>
                Job Title *
              </label>
              <input
                id="team-member-title"
                name="jobTitle"
                type="text"
                className={styles.drawerInput}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Commercial Representative"
                disabled={isPending}
                required
              />
              {formErrors.jobTitle && <span className={styles.fieldError}>{formErrors.jobTitle}</span>}
            </div>

            {/* Phone Field */}
            <div className={styles.drawerFormGroup}>
              <label htmlFor="team-member-phone" className={styles.drawerLabel}>
                Contact Phone Number
              </label>
              <input
                id="team-member-phone"
                name="phone"
                type="tel"
                className={styles.drawerInput}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+971 50 123 4567"
                disabled={isPending}
              />
              {formErrors.phone && <span className={styles.fieldError}>{formErrors.phone}</span>}
            </div>

            {/* Temporary Passphrase Generator */}
            <div className={styles.drawerFormGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="team-member-temp-pass" className={styles.drawerLabel}>
                  Generated Temporary Passcode *
                </label>
                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ff6100',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  disabled={isPending}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  <span>Regenerate</span>
                </button>
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="team-member-temp-pass"
                  name="tempPassword"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.drawerInput}
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  style={{
                    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                    paddingRight: '2.5rem',
                  }}
                  disabled={isPending}
                  required
                />
                <button
                  type="button"
                  className={styles.toggleButton}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide temporary password' : 'Show temporary password'}
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
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {formErrors.tempPassword && <span className={styles.fieldError}>{formErrors.tempPassword}</span>}
              <span style={{ fontSize: '0.72rem', color: '#777777', marginTop: '0.2rem' }}>
                16-character high-entropy passphrase automatically generated.
              </span>
            </div>
          </form>

          {/* Drawer Footer Controls */}
          <div className={styles.drawerFooter}>
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
              form="add-team-user-form"
              className={styles.submitDrawerButton}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ animation: 'spin 1s linear infinite' }}
                    aria-hidden="true"
                  >
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                  </svg>
                  <span>Provisioning Identity...</span>
                </>
              ) : (
                <span>Provision Team Member</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Accidental Dismissal Confirmation Dialog */}
      {showDiscardPrompt && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="discard-title"
        >
          <div className={styles.modalCard} style={{ maxWidth: '420px' }}>
            <div className={styles.modalAlertBanner}>
              <svg
                className={styles.modalAlertIcon}
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
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <h3 id="discard-title" style={{ margin: '0 0 0.25rem 0', fontSize: '0.88rem', fontWeight: 700 }}>
                  Discard Entered Information?
                </h3>
                <p className={styles.modalAlertText}>
                  You have unsaved changes in the team member form. If you close the drawer now, entered data
                  will be discarded.
                </p>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.copyButton}
                onClick={() => setShowDiscardPrompt(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className={styles.doneButton}
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={() => {
                  setShowDiscardPrompt(false);
                  onClose();
                }}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
