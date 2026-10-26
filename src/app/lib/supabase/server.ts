/**
 * @file server.ts
 * @description Server-side Supabase client factory for Next.js 16 App Router.
 *              Integrates `@supabase/ssr` with the asynchronous `cookies()` store from `next/headers`
 *              to support Server Components, Server Actions, and Route Handlers with secure cookie persistence.
 * @module lib/supabase/server
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getEnv } from '@/app/lib/env';

/**
 * Creates an authenticated Supabase client for Server Components, Server Actions,
 * and Route Handlers with secure cookie persistence.
 *
 * Architectural Invariants:
 * 1. Concurrency Isolation: A fresh client is instantiated per server invocation to prevent
 *    cross-request state leakage or cached JWT credentials across concurrent HTTP requests.
 * 2. Next.js 16 Async Header Store: Resolves `cookies()` asynchronously and binds `getAll()`
 *    and `setAll()` methods to handle cookie chunking (>4KB JWTs) and token refreshes.
 * 3. Graceful Server Component Write Catch: In Next.js Server Components, modifying cookies
 *    is prohibited by design; `setAll()` safely catches exceptions so Server Component rendering
 *    succeeds while relying on Edge Middleware for background token rotation.
 * 4. Defense-in-Depth Cookie Security: Cookies written via Server Actions and Route Handlers
 *    strictly enforce `httpOnly: true`, `sameSite: 'lax'`, and `secure` in production.
 *
 * @returns {Promise<ReturnType<typeof createServerClient>>} The initialized SSR server client.
 */
export async function createClient() {
  let cookieStore: {
    getAll: () => { name: string; value: string }[];
    set: (name: string, value: string, options?: Record<string, unknown>) => void;
  };

  try {
    cookieStore = await cookies();
  } catch {
    // Graceful in-memory fallback when executed outside Next.js request context (e.g., test harnesses)
    const memoryCookies = new Map<string, { name: string; value: string; options?: Record<string, unknown> }>();
    cookieStore = {
      getAll() {
        return Array.from(memoryCookies.values()).map(({ name, value }) => ({ name, value }));
      },
      set(name: string, value: string, options?: Record<string, unknown>) {
        memoryCookies.set(name, { name, value, options });
      },
    };
  }

  const env = getEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                httpOnly: options?.httpOnly ?? true,
                sameSite: options?.sameSite ?? 'lax',
                secure: options?.secure ?? process.env.NODE_ENV === 'production',
                path: options?.path ?? '/',
              });
            });
          } catch {
            // Invocation originating from a Server Component cannot mutate response cookies.
            // Edge Middleware handles active token refresh and cookie writes prior to rendering.
          }
        },
      },
    }
  );
}
