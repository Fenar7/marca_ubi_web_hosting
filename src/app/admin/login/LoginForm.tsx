/**
 * @file LoginForm.tsx
 * @description Interactive client-side component for the Marca Ubi Luxury Admin Login Portal.
 *              Integrates React 19 useActionState, brute-force lockout countdowns,
 *              password visibility toggles, and WCAG AA aria-live error announcements.
 * @module admin/login/LoginForm
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

'use client';

import React, { useActionState, useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';
import type { LoginActionResult } from '@/types/crm';
import styles from './login.module.scss';

export function LoginForm(): React.ReactElement {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || '/admin';
  const urlError = searchParams.get('error');

  const [state, formAction, isPending] = useActionState<LoginActionResult | null, FormData>(
    loginAction,
    null
  );

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [, startTransition] = useTransition();

  // Initialize and tick lockout countdown when returned from server action
  useEffect(() => {
    if (state?.remainingLockoutSeconds && state.remainingLockoutSeconds > 0) {
      setLockoutSeconds(state.remainingLockoutSeconds);
    }
  }, [state?.remainingLockoutSeconds]);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Execute full navigation upon successful authentication to persist cookie session
  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      startTransition(() => {
        window.location.href = state.redirectTo as string;
      });
    }
  }, [state?.success, state?.redirectTo]);

  // Determine error message precedence: active action state overrides initial URL error query
  let displayError: string | null = null;
  if (state?.error) {
    displayError = state.error;
  } else if (urlError) {
    switch (urlError) {
      case 'account_suspended':
        displayError = 'Corporate account has been suspended. Contact agency administration.';
        break;
      case 'unauthorized_role_access':
        displayError = 'Your account does not possess the required privileges for that resource.';
        break;
      case 'session_expired':
        displayError = 'Administrative session has expired. Please re-authenticate.';
        break;
      case 'missing_auth_code':
        displayError = 'Authentication handshake failed: missing authorization code.';
        break;
      case 'auth_exchange_failed':
        displayError = 'Authentication exchange failed. Please sign in again.';
        break;
      default:
        displayError = 'Authentication failed. Please verify your corporate credentials.';
        break;
    }
  }

  const isLocked = lockoutSeconds > 0 || state?.isLocked;

  return (
    <div className={styles.cardContainer}>
      <header className={styles.brandHeader}>
        <div className={styles.brandBadge}>
          <span className={styles.brandBadgeDot} aria-hidden="true" />
          <span>Internal Access</span>
        </div>
        <div className={styles.brandLogoWrap}>
          <img
            src="/hero/marca-ubi-logo.png"
            alt="Marca Ubi."
            className={styles.brandLogo}
            width={190}
            height={40}
          />
        </div>
        <p className={styles.brandSubtitle}>Enterprise Sales Intelligence</p>

        <div className={styles.portalNotice}>
          <p className={styles.portalNoticeTitle}>Restricted Agency Portal</p>
          <p className={styles.portalNoticeText}>Authorized personnel only. Access monitored and logged.</p>
        </div>
      </header>

      {displayError && (
        <div className={styles.alertBox} role="alert" aria-live="assertive">
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
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <span>{displayError}</span>
            {lockoutSeconds > 0 && (
              <span className={styles.lockoutCountdown}>
                {' '}(Cooldown remaining: {lockoutSeconds}s)
              </span>
            )}
          </div>
        </div>
      )}

      <form action={formAction} className={styles.form}>
        <input type="hidden" name="next" value={nextParam} />

        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.label}>
            Work Email
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending || isLocked}
              placeholder="name@marcaubi.com"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              disabled={isPending || isLocked}
              placeholder="••••••••••••••••"
              className={`${styles.input} ${styles.inputWithToggle}`}
            />
            <button
              type="button"
              className={styles.togglePasswordBtn}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {showPassword ? (
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
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
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
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || isLocked}
          className={styles.submitBtn}
          aria-live="polite"
        >
          {isPending ? (
            <>
              <span className={styles.btnSpinner} aria-hidden="true" />
              <span>Authenticating...</span>
            </>
          ) : isLocked ? (
            <span>Locked ({lockoutSeconds}s)</span>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Authenticate into Workspace</span>
            </>
          )}
        </button>
      </form>

      <div className={styles.helpRow}>
        <a
          href="mailto:security@marcaubi.com?subject=Administrative%20Portal%20Access%20Inquiry"
          className={styles.helpLink}
          tabIndex={0}
        >
          Need assistance with credentials? Contact Agency Directorate
        </a>
      </div>

      <div className={styles.securityFooter}>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Protected by Hardware TLS 1.3 & Encrypted Session JWT</span>
      </div>

      <footer className={styles.copyright}>
        &copy; {new Date().getFullYear()} Marca Ubi. All rights reserved.
      </footer>
    </div>
  );
}
