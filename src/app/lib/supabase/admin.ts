/**
 * @file admin.ts
 * @description Privileged Supabase Admin SDK factory for server-side administrative operations.
 *              Utilizes the Supabase Service Role Key to bypass Row Level Security (RLS) for
 *              user identity provisioning, credential resets, and backend synchronization.
 * @module lib/supabase/admin
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '@/app/lib/env';

/**
 * Creates an unconstrained, privileged Supabase client authenticated via the Service Role Key.
 *
 * Security & Architectural Invariants:
 * 1. Runtime Isolation: Strictly restricted to Node.js server runtimes. If executed in a
 *    browser context, throws an immediate security exception to prevent leaking privileged keys.
 * 2. Session Neutrality: Configures `persistSession: false` and `autoRefreshToken: false`
 *    because the service role identity is stateless and must not bind to user cookie stores.
 * 3. Scope Limitation: Must ONLY be consumed within isolated Server Actions or secure API
 *    routes that enforce explicit caller role authorization prior to privileged execution.
 *
 * @param {string} [overrideKey] Optional service role key override for isolated test suites.
 * @returns {SupabaseClient} The privileged Supabase Admin client.
 */
export function createAdminClient(overrideKey?: string): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY VIOLATION: Supabase Admin Client cannot be initialized in a client-side browser environment.'
    );
  }

  const env = getEnv();
  const serviceRoleKey = overrideKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || serviceRoleKey.trim().length < 20) {
    throw new Error(
      '[CRITICAL CONFIGURATION ERROR] SUPABASE_SERVICE_ROLE_KEY is required to initialize the privileged Supabase Admin SDK. ' +
      'Verify that the service role secret is defined in your environment variables.'
    );
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey.trim(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Cached singleton instance of the privileged Admin SDK client.
 * Because the service role client is stateless and does not maintain user session tokens,
 * sharing a single client across server requests avoids connection overhead and socket churn.
 */
let cachedAdminClient: SupabaseClient | null = null;

/**
 * Returns the cached singleton Supabase Admin client.
 * Lazily instantiates the client on first invocation.
 *
 * @returns {SupabaseClient} The shared privileged Supabase Admin client.
 */
export function getAdminClient(): SupabaseClient {
  if (!cachedAdminClient) {
    cachedAdminClient = createAdminClient();
  }
  return cachedAdminClient;
}

/**
 * Resets the cached singleton instance.
 * Exported primarily for unit test isolation and environment mocking.
 */
export function resetAdminClientCache(): void {
  cachedAdminClient = null;
}
