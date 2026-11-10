/**
 * @file LoginForm.tsx
 * @description Interactive client-side component for the Marca Ubi CRM Authentication Portal.
 *              Emulates the Cogie & Pixelcot archetypes: features top icon badge, soft-filled inputs
 *              with leading icons, password eye toggle, remember me checkbox, Google OAuth trigger,
 *              and direct link to registration.
 *              Integrates React 19 useActionState, brute-force lockout countdowns, and WCAG AA compliance.
 * @module admin/login/LoginForm
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

'use client';

import React, { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  const [rememberMe, setRememberMe] = useState<boolean>(true);
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
      {/* Clean Brand Lockup matching Cogie reference */}
      <div className={styles.brandLockup}>
        <Link href="/" className={styles.brandLogoLink} aria-label="Marca Ubi agency home">
          <Image
            src="/images/marca-ubi-dark.svg"
            alt="Marca Ubi."
            width={132}
            height={30}
            priority
            className={styles.brandLogo}
          />
        </Link>
      </div>

      {/* Cogie Archetype: Clean Editorial Header */}
      <header className={styles.brandHeader}>
        <h2 className={styles.brandTitle}>Welcome Back</h2>
        <p className={styles.brandSubtitle}>
          Enter your email and password to access your account. Use your agency account to continue.
        </p>
      </header>

      {displayError && (
        <div id="login-error" className={styles.alertBox} role="alert" aria-live="assertive">
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

      <form action={formAction} className={styles.form} aria-describedby={displayError ? 'login-error' : undefined} suppressHydrationWarning>
        <input type="hidden" name="next" value={nextParam} />

        {/* Email Field with Leading Icon */}
        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <div className={styles.inputWrapper}>
            <svg
              className={styles.leadingIcon}
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
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending || isLocked}
              placeholder="Enter your email"
              className={`${styles.input} ${styles.inputWithLeading}`}
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* Password Field with Leading Icon and Toggle */}
        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <div className={styles.inputWrapper}>
            <svg
              className={styles.leadingIcon}
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              disabled={isPending || isLocked}
              placeholder="Enter your password"
              className={`${styles.input} ${styles.inputWithLeading} ${styles.inputWithToggle}`}
              suppressHydrationWarning
            />
            <button
              type="button"
              className={styles.togglePasswordBtn}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isPending || isLocked}
            >
              {showPassword ? (
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
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
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
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Cogie Archetype: Remember Me & Forgot Password Row */}
        <div className={styles.optionsRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className={styles.checkbox}
            />
            <span>Remember me</span>
          </label>

          <Link href="/admin/reset-password" className={styles.forgotLink}>
            Forgot Password?
          </Link>
        </div>

        {/* Primary CTA (Solid Black Luxury Button) */}
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

      {/* Cogie Switcher: Link to Signup */}
      <div className={styles.switchRow}>
        <span>Don’t have an account? </span>
        <Link href="/admin/signup" className={styles.switchLink}>
          Sign Up
        </Link>
      </div>

      {/* Security & Credential Assistance */}
      <div className={styles.helpRow}>
        <a href="mailto:security@marcaubi.com" className={styles.helpLink}>
          Need corporate credential assistance? Contact agency security
        </a>
      </div>
    </div>
  );
}
