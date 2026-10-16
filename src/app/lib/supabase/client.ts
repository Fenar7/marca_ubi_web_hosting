/**
 * @file client.ts
 * @description Browser-side Supabase client factory for interactive client component islands.
 *              Integrates `@supabase/ssr` `createBrowserClient` to manage real-time subscriptions,
 *              PKCE authentication handshakes, and client-side session states.
 * @module lib/supabase/client
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { createBrowserClient } from '@supabase/ssr';
import { getEnv } from '@/app/lib/env';

/**
 * Creates an authenticated browser Supabase client for client-side React components.
 * Automatically synchronizes session tokens from document cookies while respecting
 * HttpOnly chunked storage managed by the SSR layer.
 *
 * @returns {ReturnType<typeof createBrowserClient>} The initialized browser Supabase client.
 */
export function createClient() {
  const env = getEnv();

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
