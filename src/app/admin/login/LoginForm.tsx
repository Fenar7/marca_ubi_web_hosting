/**
 * @file LoginForm.tsx
 * @description Interactive client-side component for the Marca Ubi CRM Authentication Portal.
 *              Integrates React 19 useActionState, brute-force lockout countdowns,
 *              password visibility toggles, and WCAG AA aria-live error announcements.
 *              Strictly conforms to modern luxury SaaS architecture and Marca Ubi design tokens.
 * @module admin/login/LoginForm
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

'use client';

import React, { useActionState, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';
import { sanitizeRedirectUrl } from '@/app/lib/auth-redirect';
import type { LoginActionResult } from '@/types/crm';
import styles from './login.module.scss';

export function LoginForm(): React.ReactElement {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next') || searchParams.get('callbackUrl');
  const nextParam = sanitizeRedirectUrl(rawNext, '/admin');
  const urlError = searchParams.get('error');

  const [state, formAction, isPending] = useActionState<LoginActionResult | null, FormData>(
    loginAction,
    null
  );

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [prevServerLockout, setPrevServerLockout] = useState<number | undefined>(undefined);

  // Synchronize server-provided lockout seconds without cascading effect renders (React 19 pattern)
  if (
    state?.remainingLockoutSeconds &&
    state.remainingLockoutSeconds > 0 &&
    state.remainingLockoutSeconds !== prevServerLockout
  ) {
    setPrevServerLockout(state.remainingLockoutSeconds);
    setLockoutSeconds(state.remainingLockoutSeconds);
  }

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
      window.location.href = state.redirectTo as string;
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
      case 'profile_not_found':
        displayError = 'Corporate profile could not be located. Contact agency administration.';
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
        <div className={styles.brandLogoWrap}>
          <img
            src="/hero/marca-ubi-logo.png"
            alt="Marca Ubi."
            className={styles.brandLogo}
            width={180}
            height={38}
          />
        </div>
        <h1 className={styles.brandTitle}>Sign in to Marca Ubi</h1>
        <p className={styles.brandSubtitle}>
          Enter your agency credentials to access the CRM console
        </p>
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
              aria-invalid={Boolean(displayError)}
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
              aria-invalid={Boolean(displayError)}
              placeholder="••••••••••••••••"
              className={`${styles.input} ${styles.inputWithToggle}`}
            />
            <button
              type="button"
              className={styles.togglePasswordBtn}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isPending || isLocked}
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
              <span>Signing in...</span>
            </>
          ) : isLocked ? (
            <span>Locked ({lockoutSeconds}s)</span>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className={styles.helpRow}>
        <a
          href="mailto:security@marcaubi.com?subject=Administrative%20Portal%20Access%20Inquiry"
          className={styles.helpLink}
          tabIndex={0}
        >
          Need assistance with credentials? Contact Agency Administration
        </a>
      </div>

      <footer className={styles.copyright}>
        &copy; {new Date().getFullYear()} Marca Ubi. All rights reserved.
      </footer>
    </div>
  );
}
