/**
 * @file ssr_session.test.ts
 * @description Automated regression suite verifying Supabase Auth SSR foundation,
 *              Zod runtime environment validation, client factories, Edge Middleware session adapter,
 *              and Open Redirect CWE-601 security defenses.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @governance Master PRD Section 15.5 (Sprint 2.1) & OWASP Top 10 A01:2021
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { NextRequest } from 'next/server';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { validateEnv, getEnv } from '../../src/app/lib/env';
import { createClient as createBrowserClient } from '../../src/app/lib/supabase/client';
import { updateSession } from '../../src/app/lib/supabase/middleware';
import { sanitizeRedirectUrl, GET as handleAuthCallback } from '../../src/app/api/auth/callback/route';

describe('Marca Ubi CRM — Supabase SSR Authentication & Session Engine (Sprint 2.1)', () => {
  it('verifies live runtime environment schema validation passes', () => {
    const env = getEnv();
    assert.strictEqual(typeof env.NEXT_PUBLIC_SUPABASE_URL, 'string');
    assert.ok(env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://'));
    assert.strictEqual(typeof env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'string');
    assert.ok(env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length >= 20);
  });

  it('strictly rejects missing or non-RFC Supabase URLs with descriptive Zod error', () => {
    assert.throws(
      () => {
        validateEnv({
          NEXT_PUBLIC_SUPABASE_URL: undefined,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-valid-key-with-sufficient-length',
        });
      },
      (err: Error) => err.message.includes('NEXT_PUBLIC_SUPABASE_URL')
    );

    assert.throws(
      () => {
        validateEnv({
          NEXT_PUBLIC_SUPABASE_URL: 'invalid-url',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-valid-key-with-sufficient-length',
        });
      },
      (err: Error) => err.message.includes('must be a valid RFC-compliant URL')
    );
  });

  it('strictly rejects truncated anonymous API keys (<20 characters)', () => {
    assert.throws(
      () => {
        validateEnv({
          NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'short-key',
        });
      },
      (err: Error) => err.message.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    );
  });

  it('verifies browser client instantiation and query engine binding', () => {
    const browserClient = createBrowserClient();
    assert.ok(browserClient);
    assert.ok(browserClient.auth);
    assert.strictEqual(typeof browserClient.auth.getUser, 'function');
    assert.strictEqual(typeof browserClient.from, 'function');
  });

  it('verifies Edge middleware session adapter structure and unauthenticated user handling', async () => {
    const dummyReq = new NextRequest(new URL('https://marcaubi.com/admin/team'), {
      headers: new Headers({
        cookie: 'sb-access-token=invalid-expired-jwt; sb-refresh-token=invalid-refresh;',
      }),
    });

    const result = await updateSession(dummyReq);
    assert.ok(result.supabaseResponse);
    assert.strictEqual(result.user, null);
    assert.ok(result.supabase);
    assert.strictEqual(typeof result.supabase.auth.getUser, 'function');
  });

  it('strictly neutralizes malicious external open redirect attempts (CWE-601)', () => {
    const maliciousVectors = [
      'https://evil.com',
      'http://attacker.com/steal-token',
      '//evil.com',
      '///evil.com',
      '//evil.com/admin',
      '/\\evil.com',
      '\\evil.com',
      '\\\\evil.com',
      'javascript:alert(document.cookie)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      '',
      '   ',
    ];

    for (const vector of maliciousVectors) {
      const sanitized = sanitizeRedirectUrl(vector, '/admin');
      assert.strictEqual(
        sanitized,
        '/admin',
        `Malicious vector "${vector}" must be neutralized to safe fallback "/admin"`
      );
    }
  });

  it('preserves legitimate internal application routes, queries, and fragments', () => {
    const legitimatePaths = [
      { input: '/admin', expected: '/admin' },
      { input: '/admin/leads', expected: '/admin/leads' },
      { input: '/admin/leads?status=qualified&source=google', expected: '/admin/leads?status=qualified&source=google' },
      { input: '/admin/team#invite-member', expected: '/admin/team#invite-member' },
      { input: '/admin/settings/profile', expected: '/admin/settings/profile' },
    ];

    for (const { input, expected } of legitimatePaths) {
      const sanitized = sanitizeRedirectUrl(input, '/admin');
      assert.strictEqual(sanitized, expected, `Legitimate path "${input}" must be preserved`);
    }
  });

  it('redirects to error view when auth callback route receives no code', async () => {
    const req = new NextRequest(new URL('https://marcaubi.com/api/auth/callback?next=/admin/leads'));
    const response = await handleAuthCallback(req);

    assert.strictEqual(response.status, 307);
    const location = response.headers.get('location');
    assert.ok(location);
    assert.ok(location.includes('/admin/login?error=missing_auth_code'));
  });
});
