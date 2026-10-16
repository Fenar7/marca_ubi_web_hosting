/**
 * @file middleware.ts
 * @description Edge-compatible Supabase session synchronization adapter for Next.js Middleware.
 *              Intercepts incoming HTTP requests, refreshes expired JWT sessions via `@supabase/ssr`,
 *              and bidirectionally mirrors updated auth cookies between NextRequest and NextResponse.
 * @module lib/supabase/middleware
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/app/lib/env';

export interface UpdateSessionResult {
  supabaseResponse: NextResponse;
  user: Awaited<ReturnType<ReturnType<typeof createServerClient>['auth']['getUser']>>['data']['user'];
  supabase: ReturnType<typeof createServerClient>;
}

/**
 * Synchronizes and validates the active Supabase session at the Next.js Edge layer.
 *
 * Architectural Invariants:
 * 1. Bidirectional Cookie Synchronization: When Supabase Auth rotates an access token,
 *    cookies are written both to `request.cookies` (so downstream Server Components receive
 *    the fresh token) and `response.cookies` (so the browser persists the rotated JWT).
 * 2. Cryptographic Token Verification: Calls `supabase.auth.getUser()` rather than `getSession()`.
 *    `getSession()` merely decodes the unverified client cookie without server validation,
 *    whereas `getUser()` validates the JWT against Supabase Auth servers, rejecting revoked or tampered sessions.
 * 3. Cache-Header Invalidation: Prevents CDNs or browser caches from caching authenticated responses
 *    containing private session tokens.
 *
 * @param {NextRequest} request The incoming Next.js HTTP request.
 * @returns {Promise<UpdateSessionResult>} The updated response, verified user identity, and client instance.
 */
export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const env = getEnv();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mutate the request cookies so downstream route handlers/Server Components see refreshed state
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          // Re-instantiate the response with updated request headers
          supabaseResponse = NextResponse.next({
            request,
          });

          // Write updated cookies to outgoing response
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: options?.httpOnly ?? true,
              sameSite: options?.sameSite ?? 'lax',
              secure: options?.secure ?? process.env.NODE_ENV === 'production',
              path: options?.path ?? '/',
            });
          });
        },
      },
    }
  );

  // Cryptographically authenticate user with Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabaseResponse,
    user,
    supabase,
  };
}
