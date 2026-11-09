/**
 * @file SignupForm.tsx
 * @description Interactive client-side component for the Marca Ubi CRM Account Registration Desk.
 *              Emulates the Cogie & Pixelcot archetypes: features top icon badge, soft-filled inputs
 *              with leading icons, password eye toggle, terms agreement checkbox, Google OAuth trigger,
 *              and direct link to login.
 *              Integrates React 19 useActionState, brute-force lockout countdowns, and WCAG AA compliance.
 * @module admin/signup/SignupForm
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

'use client';

import React, { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signupAction } from '@/app/actions/auth';
import { sanitizeRedirectUrl } from '@/app/lib/auth-redirect';
import type { SignupActionResult } from '@/types/crm';
import styles from './signup.module.scss';

export function SignupForm(): React.ReactElement {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next') || searchParams.get('callbackUrl');
  const nextParam = sanitizeRedirectUrl(rawNext, '/admin');

  const [state, formAction, isPending] = useActionState<SignupActionResult | null, FormData>(
    signupAction,
    null
  );

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);
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

  const isLocked = lockoutSeconds > 0 || state?.isLocked;

  const handleGoogleSignUp = (): void => {
    window.location.href = `/api/auth/google?next=${encodeURIComponent(nextParam)}`;
  };

  return (
    <div className={styles.cardContainer}>
      {/* Pixelcot Archetype: Floating Icon Badge */}
      <div className={styles.badgeWrapper} aria-hidden="true">
        <div className={styles.iconBadge}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
      </div>

      {/* Cogie Archetype: Header */}
      <header className={styles.brandHeader}>
        <h2 className={styles.brandTitle}>Create Account</h2>
        <p className={styles.brandSubtitle}>
          Enter your details to create your commercial account
        </p>
      </header>

      {/* Social OAuth Button (Google) */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        className={styles.googleBtn}
        aria-label="Sign up with Google"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Sign Up with Google</span>
      </button>

      {/* Clean Divider */}
      <div className={styles.orDivider} aria-hidden="true">
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>or continue with email</span>
        <span className={styles.dividerLine} />
      </div>

      {/* Email verification notice */}
      {state?.requiresEmailConfirmation && (
        <div className={styles.successBox} role="status">
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <strong>Account registered successfully!</strong>
            <p style={{ margin: '4px 0 0' }}>
              Please check your corporate inbox to confirm your email before signing in.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {state?.error && !state.requiresEmailConfirmation && (
        <div id="signup-error" className={styles.alertBox} role="alert" aria-live="assertive">
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
            <span>{state.error}</span>
            {lockoutSeconds > 0 && (
              <span className={styles.lockoutCountdown}>
                {' '}(Cooldown remaining: {lockoutSeconds}s)
              </span>
            )}
          </div>
        </div>
      )}

      <form action={formAction} className={styles.form} aria-describedby={state?.error ? 'signup-error' : undefined} suppressHydrationWarning>
        <input type="hidden" name="next" value={nextParam} />

        {/* Anti-bot Honeypot */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className={styles.honeypot}
          aria-hidden="true"
        />

        {/* Full Name Field with Leading Icon */}
        <div className={styles.fieldGroup}>
          <label htmlFor="fullName" className={styles.label}>
            Full Name
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              disabled={isPending || isLocked}
              placeholder="Enter your full name"
              className={`${styles.input} ${styles.inputWithLeading}`}
              suppressHydrationWarning
            />
          </div>
          {state?.validationErrors?.fullName && (
            <span className={styles.fieldError}>{state.validationErrors.fullName}</span>
          )}
        </div>

        {/* Corporate Email Field with Leading Icon */}
        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.label}>
            Work Email
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
              placeholder="name@company.com"
              className={`${styles.input} ${styles.inputWithLeading}`}
              suppressHydrationWarning
            />
          </div>
          {state?.validationErrors?.email && (
            <span className={styles.fieldError}>{state.validationErrors.email}</span>
          )}
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
              autoComplete="new-password"
              required
              disabled={isPending || isLocked}
              placeholder="Create a strong password (min 8 chars)"
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
          {state?.validationErrors?.password && (
            <span className={styles.fieldError}>{state.validationErrors.password}</span>
          )}
        </div>

        {/* Terms and Conditions Agreement */}
        <div className={styles.termsRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              required
              className={styles.checkbox}
            />
            <span>
              I agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className={styles.termsLink}>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className={styles.termsLink}>
                Privacy Policy
              </a>
            </span>
          </label>
        </div>

        {/* Primary CTA (Solid Black Luxury Button) */}
        <button
          type="submit"
          disabled={isPending || isLocked || !agreedToTerms}
          className={styles.submitBtn}
          aria-live="polite"
        >
          {isPending ? (
            <>
              <span className={styles.btnSpinner} aria-hidden="true" />
              <span>Creating account...</span>
            </>
          ) : isLocked ? (
            <span>Locked ({lockoutSeconds}s)</span>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      {/* Cogie Switcher: Link to Login */}
      <div className={styles.switchRow}>
        <span>Already have an account? </span>
        <Link href="/admin/login" className={styles.switchLink}>
          Sign In
        </Link>
      </div>
    </div>
  );
}
