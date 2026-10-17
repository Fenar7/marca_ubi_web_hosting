'use client';

/**
 * @file AddTeamMemberModal.tsx
 * @description Centered administrative user provisioning modal component (560px).
 *              Replaces lateral slide-out drawers with a focused command dialog.
 *              Enforces client-side validation, generates 16-character high-entropy temporary passwords,
 *              guards against accidental dismissal with unsaved changes detection,
 *              smooth enter/exit animations, and submits to Server Action createTeamUser.
 * @module app/admin/components/modals/AddTeamMemberModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { createTeamUser } from '@/app/actions/team';
import type { CrmUserRole } from '@/types/crm';
import { generateHighEntropyPassword, isDrawerDirty } from '@/app/lib/team-utils';
import type { ProvisionedCredentialsPayload } from '@/app/admin/(workspace)/team/components/CredentialRevealModal';
import { useModalAnimation } from './useModalAnimation';
import styles from './AddTeamMemberModal.module.scss';

export interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (credentials: ProvisionedCredentialsPayload) => void;
}

export function AddTeamMemberModal({
  isOpen,
  onClose,
  onUserCreated,
}: AddTeamMemberModalProps): React.ReactElement | null {
  const { shouldRender, isClosing, handleAnimationEnd } = useModalAnimation({
    isOpen,
    exitDurationMs: 180,
  });

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

  // Initialize or regenerate temporary password on modal open
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

  if (!shouldRender) {
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

        // Broadcast custom event for optimistic roster synchronization across workspaces
        window.dispatchEvent(
          new CustomEvent('team-member-created', {
            detail: {
              credentials: {
                fullName,
                email,
                role,
                jobTitle,
                tempPassword,
              },
            },
          })
        );

        // Forward credentials to reveal modal and close creation modal
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
    <div
      className={`${styles.modalOverlay} ${isClosing ? styles.overlayClosing : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          requestClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-team-modal-title"
    >
      <div
        className={`${styles.modalDialog} ${isClosing ? styles.dialogClosing : ''}`}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerMeta}>
            <span className={styles.eyebrow}>User Governance</span>
            <h2 id="add-team-modal-title" className={styles.modalTitle}>
              Add Team Member
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={requestClose}
            aria-label="Close add team member modal"
          >
            <span>✕</span>
            <kbd className={styles.escBadge}>Esc</kbd>
          </button>
        </div>

        {/* Modal Body Form */}
        <form id="add-team-user-form" className={styles.modalBody} onSubmit={handleFormSubmit} noValidate>
          {generalError && (
            <div className={styles.generalErrorAlert} role="alert" aria-live="assertive">
              {generalError}
            </div>
          )}

          {/* Full Name Field */}
          <div className={styles.formGroup}>
            <label htmlFor="team-member-name" className={styles.label}>
              Full Name *
            </label>
            <input
              id="team-member-name"
              name="fullName"
              type="text"
              className={`${styles.input} ${formErrors.fullName ? styles.inputError : ''}`}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Anita Nair"
              disabled={isPending}
              required
            />
            {formErrors.fullName && <span className={styles.fieldError}>{formErrors.fullName}</span>}
          </div>

          {/* Email Field */}
          <div className={styles.formGroup}>
            <label htmlFor="team-member-email" className={styles.label}>
              Work Email Address *
            </label>
            <input
              id="team-member-email"
              name="email"
              type="email"
              className={`${styles.input} ${formErrors.email ? styles.inputError : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. anita@marcaubi.com"
              disabled={isPending}
              required
            />
            {formErrors.email && <span className={styles.fieldError}>{formErrors.email}</span>}
          </div>

          {/* Role and Job Title Row */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="team-member-role" className={styles.label}>
                Assigned Role *
              </label>
              <select
                id="team-member-role"
                name="role"
                className={styles.select}
                value={role}
                onChange={(e) => setRole(e.target.value as CrmUserRole)}
                disabled={isPending}
              >
                <option value="sales_executive">Sales Executive</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="admin">Administrator</option>
                <option value="viewer">Viewer (Read Only)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="team-member-title" className={styles.label}>
                Job Title *
              </label>
              <input
                id="team-member-title"
                name="jobTitle"
                type="text"
                className={`${styles.input} ${formErrors.jobTitle ? styles.inputError : ''}`}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Partner"
                disabled={isPending}
                required
              />
              {formErrors.jobTitle && <span className={styles.fieldError}>{formErrors.jobTitle}</span>}
            </div>
          </div>

          {/* Phone Field */}
          <div className={styles.formGroup}>
            <label htmlFor="team-member-phone" className={styles.label}>
              Phone Number (Optional)
            </label>
            <input
              id="team-member-phone"
              name="phone"
              type="tel"
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 50 000 0000"
              disabled={isPending}
            />
          </div>

          {/* Generated Temporary Password Section */}
          <div className={styles.passwordGroup}>
            <label htmlFor="team-member-temp-pwd" className={styles.label}>
              Generated Temporary Passphrase *
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="team-member-temp-pwd"
                name="tempPassword"
                type={showPassword ? 'text' : 'password'}
                className={styles.passwordInput}
                value={tempPassword}
                readOnly
                aria-label="Generated temporary passphrase"
              />
              <button
                type="button"
                className={styles.passwordActionBtn}
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Mask password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Reveal'}
              </button>
              <button
                type="button"
                className={styles.passwordActionBtn}
                onClick={handleRegeneratePassword}
                title="Generate new 16-character high-entropy password"
              >
                Regenerate
              </button>
            </div>
            <p className={styles.passwordHint}>
              16-character high-entropy secret. Automatically copied and revealed in the next step.
            </p>
            {formErrors.tempPassword && (
              <span className={styles.fieldError}>{formErrors.tempPassword}</span>
            )}
          </div>

          {/* Modal Footer */}
          <div className={styles.modalFooter}>
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
              {isPending ? 'Provisioning...' : 'Provision Member'}
            </button>
          </div>
        </form>
      </div>

      {/* Accidental Dismissal Confirmation Dialog */}
      {showDiscardPrompt && (
        <div
          className={styles.promptOverlay}
          onClick={() => setShowDiscardPrompt(false)}
          aria-hidden="true"
        >
          <div
            className={styles.promptModal}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-labelledby="discard-title"
            aria-describedby="discard-message"
          >
            <h3 id="discard-title" className={styles.promptTitle}>
              Discard Unsaved Personnel Record?
            </h3>
            <p id="discard-message" className={styles.promptMessage}>
              You have entered member details that have not been provisioned. Exiting now will permanently discard all entered parameters.
            </p>
            <div className={styles.promptActions}>
              <button
                type="button"
                className={styles.promptKeepBtn}
                onClick={() => setShowDiscardPrompt(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className={styles.promptDiscardBtn}
                onClick={() => {
                  setShowDiscardPrompt(false);
                  onClose();
                }}
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
