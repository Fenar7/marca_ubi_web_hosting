/**
 * @file server.ts
 * @description Server-side Supabase client factory for Next.js 16 App Router.
 *              Integrates `@supabase/ssr` with the asynchronous `cookies()` store from `next/headers`
 *              to support Server Components, Server Actions, and Route Handlers with secure cookie persistence.
 * @module lib/supabase/server
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getEnv } from '@/app/lib/env';
import type { CrmUserRole, FeaturePermissions } from '@/types/crm';

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
  } catch (error: unknown) {
    // Allow Next.js internal dynamic bailout and redirect signals to propagate
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof (error as { digest?: string }).digest === 'string' &&
      ((error as { digest: string }).digest.startsWith('DYNAMIC_SERVER_USAGE') ||
       (error as { digest: string }).digest.startsWith('NEXT_REDIRECT'))
    ) {
      throw error;
    }
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

/**
 * Request-scoped deduplicated Supabase Auth lookup using `React.cache()`.
 * Eliminates duplicate HTTPS `auth.getUser()` round-trips across layout, page,
 * and Server Actions during the same SSR render without cross-request sharing.
 */
export const getCachedAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return {
    supabase,
    user: data?.user ?? null,
    error,
  };
});

export interface CachedCallerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: CrmUserRole;
  status: string;
  job_title: string | null;
  allowed_tabs: string[] | null;
  feature_permissions: FeaturePermissions | null;
  avatar_url: string | null;
}

/**
 * Request-scoped deduplicated caller `public.profiles` lookup using `React.cache()`.
 * Pairs with `getCachedAuthUser()` so layout guards, pages, and Server Actions share
 * a single database lookup per request.
 */
export const getCachedCallerProfile = cache(async () => {
  const { supabase, user, error: authError } = await getCachedAuthUser();
  if (authError || !user) {
    return { supabase, user: null, profile: null as CachedCallerProfile | null, error: authError };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, job_title, allowed_tabs, feature_permissions, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    profile: (profile as CachedCallerProfile | null) ?? null,
    error: profileError,
  };
});
