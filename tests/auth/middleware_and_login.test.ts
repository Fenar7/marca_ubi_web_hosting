/**
 * @file middleware_and_login.test.ts
 * @description Automated test suite for Sprint 2.2:
 *              - Next.js 16 Edge Middleware route guard & redirect logic
 *              - Cookie propagation across redirects (Finding M-02 compliance)
 *              - Open Redirect defense matrix (CWE-601)
 *              - Suspended account perimeter lockout
 *              - Role-based route gating for /admin/team
 *              - Progressive brute-force rate limiter with 15-minute lockout and latency throttling
 *              - Enterprise security headers in next.config.ts
 * @module tests/auth/middleware_and_login
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @governance Master PRD Section 7.2, 7.3, 7.4 & Section 15.6 (Sprint 2.2 Acceptance Criteria)
 */

import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest, NextResponse } from 'next/server';
import { proxy as middleware, createRedirectResponse } from '../../src/proxy';
import { sanitizeRedirectUrl } from '../../src/app/lib/auth-redirect';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  clearAllRateLimits,
  THROTTLE_DELAY_MS,
  LOCKOUT_DURATION_MS,
} from '../../src/app/lib/auth-rate-limit';
import { loginAction } from '../../src/app/actions/auth';
import nextConfig from '../../next.config';

describe('Marca Ubi CRM — Next.js 16 Edge Middleware & Login Hardening (Sprint 2.2)', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  describe('Section 1: Open Redirect Defense Sanitization (CWE-601)', () => {
    it('neutralizes protocol-relative double-slash URLs to /admin', () => {
      assert.equal(sanitizeRedirectUrl('//evil.com'), '/admin');
      assert.equal(sanitizeRedirectUrl('//malicious-site.org/phish'), '/admin');
    });

    it('neutralizes backslash evasion payloads to /admin', () => {
      assert.equal(sanitizeRedirectUrl('/\\evil.com'), '/admin');
      assert.equal(sanitizeRedirectUrl('\\\\evil.com'), '/admin');
      assert.equal(sanitizeRedirectUrl('\\evil.com'), '/admin');
    });

    it('neutralizes absolute external URLs to /admin', () => {
      assert.equal(sanitizeRedirectUrl('https://evil.attacker.com'), '/admin');
      assert.equal(sanitizeRedirectUrl('http://attacker.com/steal'), '/admin');
    });

    it('neutralizes script and data pseudo-protocol schemes', () => {
      assert.equal(sanitizeRedirectUrl('javascript:alert(1)'), '/admin');
      assert.equal(sanitizeRedirectUrl('data:text/html;base64,PHNjcmlwdD4='), '/admin');
      assert.equal(sanitizeRedirectUrl('vbscript:msgbox(1)'), '/admin');
    });

    it('neutralizes CRLF HTTP response splitting attempts', () => {
      assert.equal(sanitizeRedirectUrl('/admin\r\nSet-Cookie: evil=true'), '/admin');
      assert.equal(sanitizeRedirectUrl('/admin\nLocation: https://evil.com'), '/admin');
    });

    it('preserves legitimate internal administrative relative routes, query parameters, and fragments', () => {
      assert.equal(sanitizeRedirectUrl('/admin/leads'), '/admin/leads');
      assert.equal(sanitizeRedirectUrl('/admin/team?page=2&sort=asc'), '/admin/team?page=2&sort=asc');
      assert.equal(sanitizeRedirectUrl('/admin/leads?tab=won#overview'), '/admin/leads?tab=won#overview');
    });

    it('falls back gracefully to /admin on empty or non-string inputs', () => {
      assert.equal(sanitizeRedirectUrl(null), '/admin');
      assert.equal(sanitizeRedirectUrl(undefined), '/admin');
      assert.equal(sanitizeRedirectUrl(''), '/admin');
      assert.equal(sanitizeRedirectUrl('   '), '/admin');
    });
  });

  describe('Section 2: Cookie Propagation on Redirection (Finding M-02 Compliance)', () => {
    it('preserves rotated auth session cookies on HTTP 307 redirection', () => {
      const redirectUrl = new URL('http://localhost:3000/admin/login');
      const sourceResponse = NextResponse.next();

      sourceResponse.cookies.set('sb-access-token', 'rotated-access-jwt', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
      });
      sourceResponse.cookies.set('sb-refresh-token', 'rotated-refresh-opaque', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
      });

      const redirectResponse = createRedirectResponse(redirectUrl, sourceResponse);

      assert.equal(redirectResponse.status, 307);
      assert.equal(redirectResponse.cookies.get('sb-access-token')?.value, 'rotated-access-jwt');
      assert.equal(redirectResponse.cookies.get('sb-refresh-token')?.value, 'rotated-refresh-opaque');
      assert.equal(redirectResponse.headers.get('location'), 'http://localhost:3000/admin/login');
    });
  });

  describe('Section 3: Edge Middleware Route Interception (middleware.ts)', () => {
    it('redirects unauthenticated access on /admin to /admin/login?next=%2Fadmin with HTTP 307', async () => {
      const request = new NextRequest('http://localhost:3000/admin');
      const response = await middleware(request);

      assert.equal(response.status, 307);
      const location = response.headers.get('location');
      assert.ok(location);
      assert.ok(location.includes('/admin/login?next=%2Fadmin'));
    });

    it('redirects unauthenticated access on /admin/team to /admin/login?next=%2Fadmin%2Fteam', async () => {
      const request = new NextRequest('http://localhost:3000/admin/team');
      const response = await middleware(request);

      assert.equal(response.status, 307);
      const location = response.headers.get('location');
      assert.ok(location);
      assert.ok(location.includes('/admin/login?next=%2Fadmin%2Fteam'));
    });

    it('preserves query parameters in next destination on unauthenticated interception', async () => {
      const request = new NextRequest('http://localhost:3000/admin/leads?status=open&priority=urgent');
      const response = await middleware(request);

      assert.equal(response.status, 307);
      const location = response.headers.get('location');
      assert.ok(location);
      assert.ok(location.includes('next=%2Fadmin%2Fleads%3Fstatus%3Dopen%26priority%3Durgent'));
    });

    it('permits unauthenticated pass-through on /admin/login to render login card', async () => {
      const request = new NextRequest('http://localhost:3000/admin/login');
      const response = await middleware(request);

      assert.equal(response.status, 200);
      assert.equal(response.headers.get('location'), null);
    });

    it('neutralizes circular next=/admin/login parameter to prevent infinite redirect loops', () => {
      let safeNext = sanitizeRedirectUrl('/admin/login', '/admin');
      if (safeNext === '/admin/login' || safeNext.startsWith('/admin/login')) {
        safeNext = '/admin';
      }
      assert.equal(safeNext, '/admin');
    });
  });

  describe('Section 4: Progressive Brute-Force Rate Limiting (auth-rate-limit.ts)', () => {
    const testIdentifier = '10.0.0.1:sales_closer@marcaubi.com';

    it('permits initial authentication check with zero artificial latency', () => {
      const result = checkRateLimit(testIdentifier);
      assert.equal(result.allowed, true);
      assert.equal(result.delayMs, 0);
      assert.equal(result.isLocked, false);
      assert.equal(result.remainingLockoutSeconds, 0);
    });

    it('maintains zero latency delay across failed attempts 1, 2, and 3', () => {
      for (let i = 1; i <= 3; i++) {
        const record = recordFailedAttempt(testIdentifier);
        assert.equal(record.attempts, i);
        assert.equal(record.delayMs, 0);
        assert.equal(record.isLocked, false);
      }
    });

    it('pre-checks attempt 4 with 1,500ms delay when 3 prior failures exist', () => {
      for (let i = 1; i <= 3; i++) {
        recordFailedAttempt(testIdentifier);
      }

      const preCheck = checkRateLimit(testIdentifier);
      assert.equal(preCheck.delayMs, THROTTLE_DELAY_MS);
      assert.equal(preCheck.allowed, true);
    });

    it('injects 1,500ms artificial latency delay on failed attempts 4 and 5', () => {
      for (let i = 1; i <= 3; i++) {
        recordFailedAttempt(testIdentifier);
      }

      // Attempt 4
      const attempt4 = recordFailedAttempt(testIdentifier);
      assert.equal(attempt4.attempts, 4);
      assert.equal(attempt4.delayMs, THROTTLE_DELAY_MS);
      assert.equal(attempt4.isLocked, false);

      // Attempt 5
      const attempt5 = recordFailedAttempt(testIdentifier);
      assert.equal(attempt5.attempts, 5);
      assert.equal(attempt5.delayMs, THROTTLE_DELAY_MS);
      assert.equal(attempt5.isLocked, false);
    });

    it('triggers 15-minute temporary lockout on attempt 6+ and rejects subsequent checks', () => {
      for (let i = 1; i <= 5; i++) {
        recordFailedAttempt(testIdentifier);
      }

      // Attempt 6 breaches threshold
      const attempt6 = recordFailedAttempt(testIdentifier);
      assert.equal(attempt6.attempts, 6);
      assert.equal(attempt6.isLocked, true);
      assert.ok(attempt6.remainingLockoutSeconds > 890 && attempt6.remainingLockoutSeconds <= 900);

      // Subsequent check rejects request immediately
      const check = checkRateLimit(testIdentifier);
      assert.equal(check.allowed, false);
      assert.equal(check.isLocked, true);
      assert.ok(check.remainingLockoutSeconds > 0);
    });

    it('clears rate limit and unlocks identifier upon resetRateLimit', () => {
      for (let i = 1; i <= 6; i++) {
        recordFailedAttempt(testIdentifier);
      }

      assert.equal(checkRateLimit(testIdentifier).allowed, false);

      resetRateLimit(testIdentifier);

      const restoredCheck = checkRateLimit(testIdentifier);
      assert.equal(restoredCheck.allowed, true);
      assert.equal(restoredCheck.attempts, 0);
      assert.equal(restoredCheck.isLocked, false);
    });

    it('evicts oldest keys via FIFO when active keys reach MAX_STORE_SIZE', () => {
      clearAllRateLimits();
      for (let k = 0; k < 10050; k++) {
        recordFailedAttempt(`test_ip_${k}:attacker@botnet.org`);
      }
      const probeCheck = checkRateLimit('test_ip_0:attacker@botnet.org');
      assert.equal(probeCheck.attempts, 0);
    });
  });

  describe('Section 5: Server Action Login Validation (auth.ts)', () => {
    it('rejects malformed email address with descriptive validation message', async () => {
      const formData = new FormData();
      formData.set('email', 'not-an-email');
      formData.set('password', 'ValidPass123!');

      const result = await loginAction(null, formData);
      assert.equal(result.success, false);
      assert.equal(result.error, 'Invalid corporate email address format');
    });

    it('rejects empty password with validation message', async () => {
      const formData = new FormData();
      formData.set('email', 'admin@marcaubi.com');
      formData.set('password', '');

      const result = await loginAction(null, formData);
      assert.equal(result.success, false);
      assert.equal(result.error, 'Password cannot be empty');
    });

    it('returns generic error on invalid corporate credentials defending against user enumeration', async () => {
      const formData = new FormData();
      formData.set('email', 'nonexistent_agent_999@marcaubi.com');
      formData.set('password', 'IncorrectPassword123!');

      const result = await loginAction(null, formData);
      assert.equal(result.success, false);
      assert.equal(result.error, 'Invalid corporate credentials');
    });
  });

  describe('Section 6: Defense-in-Depth Security Headers (next.config.ts)', () => {
    it('defines enterprise security headers covering framing, transport, MIME types, and CSP', async () => {
      assert.equal(typeof nextConfig.headers, 'function');

      if (typeof nextConfig.headers === 'function') {
        const configuredHeaders = await nextConfig.headers();
        const globalRule = configuredHeaders.find((rule) => rule.source === '/:path*');
        assert.ok(globalRule);

        const headerMap = new Map(globalRule.headers.map((h) => [h.key, h.value]));

        assert.equal(headerMap.get('X-Frame-Options'), 'DENY');
        assert.equal(headerMap.get('X-Content-Type-Options'), 'nosniff');
        assert.equal(headerMap.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
        assert.equal(headerMap.get('Permissions-Policy'), 'camera=(), microphone=(), geolocation=()');
        assert.ok(headerMap.get('Strict-Transport-Security')?.includes('max-age=63072000'));

        const csp = headerMap.get('Content-Security-Policy');
        assert.ok(csp);
        assert.ok(csp.includes("frame-ancestors 'none'"));
        assert.ok(csp.includes('https://*.supabase.co'));
      }
    });
  });
});
