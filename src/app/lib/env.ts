/**
 * @file env.ts
 * @description Centralized runtime environment variable validation and typed configuration access.
 *              Validates Supabase public endpoints, anonymous API keys, and optional privileged service keys
 *              at application boot time using Zod to eliminate silent failures and misconfiguration crashes.
 * @module lib/env
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';

/**
 * Zod schema defining the required and optional environment variables for the Marca Ubi CRM.
 * Enforces RFC-compliant URL formatting on the Supabase project endpoint and non-empty string guarantees
 * for cryptographic keys.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({
      message: 'NEXT_PUBLIC_SUPABASE_URL is required to initialize Supabase client connections.',
    })
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid RFC-compliant URL (e.g., https://your-project.supabase.co)'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({
      message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required to authenticate public client operations.',
    })
    .min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be a valid non-empty JWT key string'),

  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, 'SUPABASE_SERVICE_ROLE_KEY must be a valid high-entropy key string')
    .optional(),

  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates process environment variables against the defined Zod schema.
 * Throws an explicit, descriptive configuration error if critical variables are absent or invalid,
 * preventing downstream silent failures or undefined pointer exceptions during SSR or Edge execution.
 *
 * @returns {EnvConfig} The validated and strictly-typed environment configuration object.
 */
export function validateEnv(customEnv?: Record<string, string | undefined>): EnvConfig {
  const envToValidate = customEnv || {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };

  const parsed = envSchema.safeParse(envToValidate);

  if (!parsed.success) {
    const errorMessages = parsed.error.issues
      .map((issue) => `  - [${issue.path.join('.')}]: ${issue.message}`)
      .join('\n');

    throw new Error(
      `[CRITICAL CONFIGURATION ERROR] Runtime environment validation failed:\n${errorMessages}\nVerify your .env.local or production deployment environment secrets.`
    );
  }

  return parsed.data;
}

/**
 * Cached singleton environment configuration accessor.
 * Lazily evaluates environment variables on first invocation and caches the result for sub-millisecond lookups.
 */
let cachedEnv: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}
