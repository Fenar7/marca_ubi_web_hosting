'use client';

/**
 * @file ResetPasswordForm.tsx
 * @description Interactive Client Component for mandatory first-login password rotation.
 *              Validates password complexity in real-time, displays live status checks,
 *              enforces matching confirmation, and securely submits to resetTemporaryPassword.
 * @module app/admin/reset-password/ResetPasswordForm
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useTransition } from 'react';
import { resetTemporaryPassword } from '@/app/actions/auth';
import styles from './reset-password.module.scss';

interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  passwordsMatch: boolean;
}

export function ResetPasswordForm(): React.ReactElement {
  const [isPending, startTransition] = useTransition();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dynamic evaluation of password security invariants
  const criteria: PasswordCriteria = {
    minLength: newPassword.length >= 12,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSymbol: /[^A-Za-z0-9]/.test(newPassword),
    passwordsMatch: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const isFormValid =
    criteria.minLength &&
    criteria.hasUpper &&
    criteria.hasLower &&
    criteria.hasNumber &&
    criteria.hasSymbol &&
    criteria.passwordsMatch;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!isFormValid) {
      setErrorMessage('Please ensure all password complexity requirements are fulfilled.');
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await resetTemporaryPassword(null, formData);

        if (!result.success) {
          setErrorMessage(result.error || 'Failed to update credentials. Please try again.');
          return;
        }

        setSuccessMessage('Password successfully updated. Initializing workspace session...');

        setTimeout(() => {
          // Hard navigation to force Edge Middleware and Server Components to consume updated credentials
          window.location.href = '/admin';
        }, 1200);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setErrorMessage(msg);
      }
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {errorMessage && (
        <div className={styles.errorMessage} role="alert" aria-live="assertive">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className={styles.successMessage} role="status" aria-live="polite">
          {successMessage}
        </div>
      )}

      {/* New Password Input Field */}
      <div className={styles.fieldGroup}>
        <label htmlFor="newPassword" className={styles.label}>
          New Permanent Password
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="newPassword"
            name="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`${styles.input} ${
              newPassword.length > 0 && !criteria.minLength ? styles.inputError : ''
            }`}
            placeholder="Minimum 12 characters"
            autoComplete="new-password"
            required
            disabled={isPending || Boolean(successMessage)}
            aria-invalid={Boolean(errorMessage || (newPassword.length > 0 && !criteria.minLength))}
          />
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setShowNewPassword((prev) => !prev)}
            aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
            disabled={isPending || Boolean(successMessage)}
            tabIndex={0}
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
              {showNewPassword ? (
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
      </div>

      {/* Password Complexity Matrix */}
      <div className={styles.criteriaList} aria-label="Password complexity requirements">
        <div
          className={`${styles.criteriaItem} ${
            criteria.minLength ? styles.criteriaMet : ''
          }`}
        >
          <span
            className={`${styles.criteriaDot} ${
              criteria.minLength ? styles.criteriaDotMet : ''
            }`}
          />
          <span>
            At least 12 characters
            <span className="sr-only"> ({criteria.minLength ? 'Requirement met' : 'Requirement pending'})</span>
          </span>
        </div>

        <div
          className={`${styles.criteriaItem} ${
            criteria.hasUpper ? styles.criteriaMet : ''
          }`}
        >
          <span
            className={`${styles.criteriaDot} ${
              criteria.hasUpper ? styles.criteriaDotMet : ''
            }`}
          />
          <span>
            Uppercase letter (A-Z)
            <span className="sr-only"> ({criteria.hasUpper ? 'Requirement met' : 'Requirement pending'})</span>
          </span>
        </div>

        <div
          className={`${styles.criteriaItem} ${
            criteria.hasLower ? styles.criteriaMet : ''
          }`}
        >
          <span
            className={`${styles.criteriaDot} ${
              criteria.hasLower ? styles.criteriaDotMet : ''
            }`}
          />
          <span>
            Lowercase letter (a-z)
            <span className="sr-only"> ({criteria.hasLower ? 'Requirement met' : 'Requirement pending'})</span>
          </span>
        </div>

        <div
          className={`${styles.criteriaItem} ${
            criteria.hasNumber ? styles.criteriaMet : ''
          }`}
        >
          <span
            className={`${styles.criteriaDot} ${
              criteria.hasNumber ? styles.criteriaDotMet : ''
            }`}
          />
          <span>
            Numeric digit (0-9)
            <span className="sr-only"> ({criteria.hasNumber ? 'Requirement met' : 'Requirement pending'})</span>
          </span>
        </div>

        <div
          className={`${styles.criteriaItem} ${
            criteria.hasSymbol ? styles.criteriaMet : ''
          }`}
        >
          <span
            className={`${styles.criteriaDot} ${
              criteria.hasSymbol ? styles.criteriaDotMet : ''
            }`}
          />
          <span>
            Special symbol (!@#$)
            <span className="sr-only"> ({criteria.hasSymbol ? 'Requirement met' : 'Requirement pending'})</span>
          </span>
        </div>

        <div
          className={`${styles.criteriaItem} ${
            criteria.passwordsMatch ? styles.criteriaMet : ''
          }`}
        >
          <span
            className={`${styles.criteriaDot} ${
              criteria.passwordsMatch ? styles.criteriaDotMet : ''
            }`}
          />
          <span>
            Passwords match
            <span className="sr-only"> ({criteria.passwordsMatch ? 'Requirement met' : 'Requirement pending'})</span>
          </span>
        </div>
      </div>

      {/* Confirm Password Input Field */}
      <div className={styles.fieldGroup}>
        <label htmlFor="confirmPassword" className={styles.label}>
          Confirm Permanent Password
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`${styles.input} ${
              confirmPassword.length > 0 && !criteria.passwordsMatch
                ? styles.inputError
                : ''
            }`}
            placeholder="Re-enter permanent password"
            autoComplete="new-password"
            required
            disabled={isPending || Boolean(successMessage)}
            aria-invalid={Boolean(errorMessage || (confirmPassword.length > 0 && !criteria.passwordsMatch))}
          />
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            disabled={isPending || Boolean(successMessage)}
            tabIndex={0}
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
              {showConfirmPassword ? (
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
      </div>

      {/* Submit Action Button */}
      <button
        type="submit"
        className={styles.submitButton}
        disabled={!isFormValid || isPending || Boolean(successMessage)}
      >
        {isPending ? (
          <>
            <svg
              width="16"
              height="16"
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
            <span>Updating Credentials...</span>
          </>
        ) : (
          <span>Set New Password</span>
        )}
      </button>
    </form>
  );
}
