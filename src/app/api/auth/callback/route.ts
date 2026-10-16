/**
 * @file route.ts
 * @description PKCE Authentication Callback Route Handler (`/api/auth/callback`).
 *              Intercepts authorization codes from Supabase Auth during OAuth or Magic Link handshakes,
 *              exchanges the code for a verified access/refresh token pair, persists tokens into chunked
 *              HttpOnly cookies, and redirects safely to the sanitized destination URL.
 * @module api/auth/callback
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { sanitizeRedirectUrl } from '@/app/lib/auth-redirect';

export { sanitizeRedirectUrl };


/**
 * Handles GET requests to `/api/auth/callback`.
 * Exchanges authorization code for an active session and redirects to sanitized destination.
 *
 * @param {NextRequest} request The incoming Next.js HTTP request.
 * @returns {Promise<NextResponse>} HTTP 307 redirect to sanitized destination or error view.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const rawNext = requestUrl.searchParams.get('next');
  const destination = sanitizeRedirectUrl(rawNext, '/admin');

  if (!code) {
    return NextResponse.redirect(new URL('/admin/login?error=missing_auth_code', request.url));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[AUTH_CALLBACK_ERROR] Failed to exchange PKCE code for session:', error.message);
      return NextResponse.redirect(new URL('/admin/login?error=auth_exchange_failed', request.url));
    }

    return NextResponse.redirect(new URL(destination, request.url));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown internal error';
    console.error('[AUTH_CALLBACK_FATAL] Unexpected error during authentication exchange:', message);
    return NextResponse.redirect(new URL('/admin/login?error=internal_server_error', request.url));
  }
}
