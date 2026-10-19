/**
 * @file auth.ts
 * @description Secure Server Actions for administrative authentication and session termination.
 *              Enforces Zod schema parsing, brute-force rate limiting with progressive latency throttling,
 *              account status verification, and Open Redirect defense.
 * @module actions/auth
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/app/lib/supabase/server';
import { sanitizeRedirectUrl } from '@/app/lib/auth-redirect';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '@/app/lib/auth-rate-limit';
import { getAdminClient } from '@/app/lib/supabase/admin';
import { ResetPasswordSchema } from '@/app/lib/team-schemas';
import type { LoginActionResult, ResetPasswordResult } from '@/types/crm';

/**
 * Validation schema for administrative login credentials.
 */
const LoginSchema = z.object({
  email: z
    .string({ error: 'Work email is required' })
    .email('Invalid corporate email address format')
    .max(255, 'Email exceeds maximum allowable length')
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password cannot be empty')
    .max(128, 'Password exceeds maximum allowable length'),
  next: z.string().optional(),
});

/**
 * Resolves the client network identifier (IP address) from Next.js request headers.
 *
 * @returns {Promise<string>} Client IP address or fallback identifier.
 */
async function resolveClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    const realIp = headerList.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }
  } catch {
    // Graceful fallback when headers are inaccessible in testing environments
  }
  return '127.0.0.1';
}

/**
 * Executes administrative authentication against Supabase Auth.
 *
 * Security Lifecycle:
 * 1. Validates input schema via Zod; rejects malformed or oversized payloads.
 * 2. Enforces progressive rate limiting by composite client identity (IP + normalized email).
 * 3. Injects artificial latency (1,500ms) on repeated failures to throttle automated attacks.
 * 4. Validates credentials with Supabase Auth; sets HttpOnly chunked session cookies.
 * 5. Rejects suspended accounts and immediately revokes issued session.
 * 6. Sanitizes target destination path to eliminate Open Redirect vulnerabilities (CWE-601).
 *
 * @param {LoginActionResult | null} _prevState Previous action state from useActionState.
 * @param {FormData} formData Form data containing email, password, and optional next URL.
 * @returns {Promise<LoginActionResult>} Action result object indicating success or failure reason.
 */
export async function loginAction(
  _prevState: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  const rawEmail = formData.get('email');
  const rawPassword = formData.get('password');
  const rawNext = formData.get('next')?.toString();

  const parseResult = LoginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
    next: rawNext,
  });

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0]?.message || 'Invalid corporate credentials';
    return {
      success: false,
      error: firstError,
    };
  }

  const { email, password, next } = parseResult.data;
  const clientIp = await resolveClientIp();
  const rateLimitKey = `${clientIp}:${email}`;

  // Evaluate brute-force rate limit status
  const rateLimitStatus = checkRateLimit(rateLimitKey);
  if (!rateLimitStatus.allowed) {
    return {
      success: false,
      error: `Access temporarily restricted due to consecutive failed attempts. Please retry in ${rateLimitStatus.remainingLockoutSeconds} seconds.`,
      remainingLockoutSeconds: rateLimitStatus.remainingLockoutSeconds,
      isLocked: true,
    };
  }

  // Inject artificial latency if threshold (attempts 4-5) is reached
  if (rateLimitStatus.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, rateLimitStatus.delayMs));
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      const recordResult = recordFailedAttempt(rateLimitKey);

      if (recordResult.isLocked) {
        return {
          success: false,
          error: `Consecutive failed authentication threshold exceeded. System locked for 15 minutes.`,
          remainingLockoutSeconds: recordResult.remainingLockoutSeconds,
          isLocked: true,
        };
      }

      // Generic authentication failure notice defending against user enumeration
      return {
        success: false,
        error: 'Invalid corporate credentials',
      };
    }

    // Inspect account status for perimeter suspension defense
    const accountStatus =
      (data.user.app_metadata?.status as string | undefined) ||
      (data.user.user_metadata?.status as string | undefined);

    if (accountStatus === 'suspended') {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Corporate account is suspended. Contact agency administration.',
      };
    }

    // Reset rate limiter on successful authentication
    resetRateLimit(rateLimitKey);

    // Intercept mandatory first-login password rotation for newly provisioned personnel
    const mustChangePassword =
      data.user.app_metadata?.must_change_password === true ||
      data.user.user_metadata?.must_change_password === true;

    if (mustChangePassword) {
      return {
        success: true,
        redirectTo: '/admin/reset-password',
      };
    }

    // Sanitize destination to guarantee strictly internal navigation
    let safeDestination = sanitizeRedirectUrl(next, '/admin');
    if (safeDestination === '/admin/login' || safeDestination.startsWith('/admin/login')) {
      safeDestination = '/admin';
    }

    return {
      success: true,
      redirectTo: safeDestination,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown internal error';
    console.error('[AUTH_ACTION_FATAL] Unexpected failure during administrative login:', message);
    return {
      success: false,
      error: 'An internal authentication error occurred. Please try again later.',
    };
  }
}

/**
 * Executes a mandatory first-login password reset for provisioned team users.
 *
 * Security Lifecycle:
 * 1. Cryptographically validates active caller session with Supabase Auth.
 * 2. Parses and validates input with strict Zod password complexity rules.
 * 3. Rotates password via Supabase Auth client (supabase.auth.updateUser).
 * 4. Resets must_change_password flag to false in both auth metadata and public.profiles.
 * 5. Records an immutable audit log entry in public.team_audit_logs.
 *
 * @param {ResetPasswordResult | null} _prevState Previous action state.
 * @param {FormData} formData Form data containing newPassword and confirmPassword.
 * @returns {Promise<ResetPasswordResult>} Result envelope indicating success or failure.
 */
export async function resetTemporaryPassword(
  _prevState: ResetPasswordResult | null,
  formData: FormData
): Promise<ResetPasswordResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'Authentication required. Please log in before resetting credentials.',
    };
  }

  const rawNewPassword = formData.get('newPassword');
  const rawConfirmPassword = formData.get('confirmPassword');

  const parseResult = ResetPasswordSchema.safeParse({
    newPassword: rawNewPassword,
    confirmPassword: rawConfirmPassword,
  });

  if (!parseResult.success) {
    const validationErrors: Record<string, string> = {};
    parseResult.error.issues.forEach((issue) => {
      const field = issue.path[0] ? String(issue.path[0]) : 'form';
      validationErrors[field] = issue.message;
    });

    return {
      success: false,
      error: parseResult.error.issues[0]?.message || 'Validation failed. Please correct the highlighted errors.',
      validationErrors,
    };
  }

  const { newPassword } = parseResult.data;

  try {
    // 1. Update Auth identity password and reset user_metadata flag
    const { error: updateAuthError } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        must_change_password: false,
      },
    });

    if (updateAuthError) {
      return {
        success: false,
        error: `Password update failed: ${updateAuthError.message}`,
      };
    }

    const adminClient = getAdminClient();

    // 2. Clear must_change_password flag in Supabase Auth app_metadata (requires service_role admin privileges)
    // Invariant: middleware.ts inspects user.app_metadata.must_change_password to gate /admin routes.
    const { error: appMetaError } = await adminClient.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        must_change_password: false,
      },
    });

    if (appMetaError) {
      console.warn('[PASSWORD_RESET_WARNING] Failed to update app_metadata.must_change_password:', appMetaError.message);
    }

    // 3. Clear must_change_password flag in public.profiles
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        must_change_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.warn('[PASSWORD_RESET_WARNING] Failed to update profiles.must_change_password:', profileError.message);
    }

    // 3. Record immutable compliance entry in public.team_audit_logs
    const { error: auditError } = await adminClient.from('team_audit_logs').insert({
      actor_id: user.id,
      action: 'password_reset_completed',
      target_user_email: user.email ?? 'unknown',
      details: {
        target_user_id: user.id,
        reset_type: 'initial_mandatory_rotation',
        completed_at: new Date().toISOString(),
      },
    });

    if (auditError) {
      console.warn('[AUDIT_WARNING] Password reset audit entry failed to record:', auditError.message);
    }

    return {
      success: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown internal error';
    console.error('[PASSWORD_RESET_FATAL] Unexpected error during password reset:', message);
    return {
      success: false,
      error: 'An internal error occurred during password rotation. Please try again.',
    };
  }
}

/**
 * Terminates the active administrative session across all Supabase cookies and redirects to /admin/login.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
