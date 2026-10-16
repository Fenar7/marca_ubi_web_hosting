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

export interface LoginActionResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
  remainingLockoutSeconds?: number;
  isLocked?: boolean;
}

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
 * Terminates the active administrative session across all Supabase cookies and redirects to /admin/login.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
