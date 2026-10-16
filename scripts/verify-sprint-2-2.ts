/**
 * @file verify-sprint-2-2.ts
 * @description Comprehensive automated verification script for Sprint 2.2:
 *              Next.js 16 Edge Middleware Route Guard, Role Resolution & Luxury Admin Login Hardening.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { NextRequest, NextResponse } from 'next/server';
import { middleware, createRedirectResponse } from '../src/middleware';
import { sanitizeRedirectUrl } from '../src/app/lib/auth-redirect';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  clearAllRateLimits,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  THROTTLE_DELAY_MS,
} from '../src/app/lib/auth-rate-limit';
import nextConfig from '../next.config';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string): void {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✔\x1b[0m [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✘\x1b[0m [FAIL] ${testName}`);
    if (details) {
      console.error(`         \x1b[33mDetails: ${details}\x1b[0m`);
    }
  }
}

async function runSprint22Verification(): Promise<void> {
  console.log('\n\x1b[1m\x1b[36m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[36m  MARCA UBI CRM — SPRINT 2.2 PRODUCTION VERIFICATION HARNESS       \x1b[0m');
  console.log('\x1b[1m\x1b[36m====================================================================\x1b[0m\n');

  // ==========================================================================
  // SECTION 1: Open Redirect Sanitization (CWE-601 Defense)
  // ==========================================================================
  console.log('\x1b[1m[SECTION 1] Open Redirect Defense Sanitization (auth-redirect.ts)\x1b[0m');

  assert(
    sanitizeRedirectUrl('//evil.com') === '/admin',
    'Neutralizes protocol-relative double-slash URL (//evil.com) to /admin'
  );

  assert(
    sanitizeRedirectUrl('/\\evil.com') === '/admin',
    'Neutralizes backslash evasion sequence (/\\evil.com) to /admin'
  );

  assert(
    sanitizeRedirectUrl('\\\\evil.com') === '/admin',
    'Neutralizes Windows network share evasion (\\\\evil.com) to /admin'
  );

  assert(
    sanitizeRedirectUrl('https://evil.attacker.com') === '/admin',
    'Neutralizes external absolute URL (https://evil.attacker.com) to /admin'
  );

  assert(
    sanitizeRedirectUrl('javascript:alert(document.cookie)') === '/admin',
    'Neutralizes javascript: pseudo-protocol scheme to /admin'
  );

  assert(
    sanitizeRedirectUrl('data:text/html;base64,PHNjcmlwdD4=') === '/admin',
    'Neutralizes data: URI scheme to /admin'
  );

  assert(
    sanitizeRedirectUrl('/admin\r\nHeader-Injection: true') === '/admin',
    'Neutralizes CRLF HTTP response splitting payload'
  );

  assert(
    sanitizeRedirectUrl('/admin/leads?tab=won#overview') === '/admin/leads?tab=won#overview',
    'Preserves valid internal administrative relative path, query params, and hash fragments'
  );

  assert(
    sanitizeRedirectUrl(null) === '/admin',
    'Gracefully returns /admin default for null destination'
  );

  assert(
    sanitizeRedirectUrl('') === '/admin',
    'Gracefully returns /admin default for empty destination'
  );

  // ==========================================================================
  // SECTION 2: Cookie Propagation on Redirection (Finding M-02 Compliance)
  // ==========================================================================
  console.log('\n\x1b[1m[SECTION 2] Cookie Propagation on Redirection (Finding M-02 Compliance)\x1b[0m');

  const dummyTargetUrl = new URL('http://localhost:3000/admin/login');
  const dummySourceResponse = NextResponse.next();
  dummySourceResponse.cookies.set('sb-access-token', 'test-access-token-jwt', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  });
  dummySourceResponse.cookies.set('sb-refresh-token', 'test-refresh-token-opaque', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  });

  const redirectedResponse = createRedirectResponse(dummyTargetUrl, dummySourceResponse);

  assert(
    redirectedResponse.status === 307,
    'createRedirectResponse issues HTTP 307 Temporary Redirect'
  );

  assert(
    redirectedResponse.cookies.get('sb-access-token')?.value === 'test-access-token-jwt',
    'Propagates rotated access token cookie onto the redirect response'
  );

  assert(
    redirectedResponse.cookies.get('sb-refresh-token')?.value === 'test-refresh-token-opaque',
    'Propagates rotated refresh token cookie onto the redirect response'
  );

  // ==========================================================================
  // SECTION 3: Edge Middleware Route Interception
  // ==========================================================================
  console.log('\n\x1b[1m[SECTION 3] Edge Middleware Route Guard & Redirect Logic (middleware.ts)\x1b[0m');

  // Test 3.1: Unauthenticated request to /admin
  const unauthAdminReq = new NextRequest('http://localhost:3000/admin');
  const unauthAdminRes = await middleware(unauthAdminReq);

  assert(
    unauthAdminRes.status === 307,
    'Unauthenticated GET /admin returns HTTP 307 Temporary Redirect'
  );

  const adminLocation = unauthAdminRes.headers.get('location');
  assert(
    adminLocation !== null && adminLocation.includes('/admin/login?next=%2Fadmin'),
    'Unauthenticated GET /admin redirects to /admin/login?next=%2Fadmin',
    `Received location: ${adminLocation}`
  );

  // Test 3.2: Unauthenticated request to /admin/team
  const unauthTeamReq = new NextRequest('http://localhost:3000/admin/team');
  const unauthTeamRes = await middleware(unauthTeamReq);

  assert(
    unauthTeamRes.status === 307,
    'Unauthenticated GET /admin/team returns HTTP 307 Temporary Redirect'
  );

  const teamLocation = unauthTeamRes.headers.get('location');
  assert(
    teamLocation !== null && teamLocation.includes('/admin/login?next=%2Fadmin%2Fteam'),
    'Unauthenticated GET /admin/team redirects to /admin/login?next=%2Fadmin%2Fteam',
    `Received location: ${teamLocation}`
  );

  // Test 3.3: Unauthenticated request to /admin/leads with query parameters
  const unauthLeadsReq = new NextRequest('http://localhost:3000/admin/leads?status=open&priority=high');
  const unauthLeadsRes = await middleware(unauthLeadsReq);

  const leadsLocation = unauthLeadsRes.headers.get('location');
  assert(
    leadsLocation !== null &&
      leadsLocation.includes('next=%2Fadmin%2Fleads%3Fstatus%3Dopen%26priority%3Dhigh'),
    'Unauthenticated GET with query parameters encodes complete relative destination in next parameter',
    `Received location: ${leadsLocation}`
  );

  // Test 3.4: Unauthenticated request to /admin/login passes through without redirect
  const unauthLoginReq = new NextRequest('http://localhost:3000/admin/login');
  const unauthLoginRes = await middleware(unauthLoginReq);

  assert(
    unauthLoginRes.status === 200,
    'Unauthenticated GET /admin/login passes through with HTTP 200 (renders login card)'
  );

  // ==========================================================================
  // SECTION 4: Progressive Brute-Force Rate Limiter & Lockout Engine
  // ==========================================================================
  console.log('\n\x1b[1m[SECTION 4] Progressive Rate Limiter & Brute-Force Lockout (auth-rate-limit.ts)\x1b[0m');

  clearAllRateLimits();
  const testClientKey = '192.168.1.100:test_closer@marcaubi.com';

  // Check initial state
  const initialCheck = checkRateLimit(testClientKey);
  assert(
    initialCheck.allowed === true && initialCheck.attempts === 0 && initialCheck.delayMs === 0,
    'Initial rate limit check permits request with 0 delay'
  );

  // Record attempts 1, 2, 3
  for (let i = 1; i <= 3; i++) {
    const rec = recordFailedAttempt(testClientKey);
    assert(
      rec.attempts === i && rec.isLocked === false && rec.delayMs === 0,
      `Attempt ${i} recorded: allowed without delay`
    );
  }

  // Record attempt 4: throttled with 1,500ms delay
  const attempt4 = recordFailedAttempt(testClientKey);
  assert(
    attempt4.attempts === 4 && attempt4.isLocked === false && attempt4.delayMs === THROTTLE_DELAY_MS,
    `Attempt 4 recorded: throttled with ${THROTTLE_DELAY_MS}ms artificial latency`
  );

  // Record attempt 5: throttled with 1,500ms delay
  const attempt5 = recordFailedAttempt(testClientKey);
  assert(
    attempt5.attempts === 5 && attempt5.isLocked === false && attempt5.delayMs === THROTTLE_DELAY_MS,
    `Attempt 5 recorded: throttled with ${THROTTLE_DELAY_MS}ms artificial latency`
  );

  // Record attempt 6: exceeds threshold (MAX_FAILED_ATTEMPTS = 5) -> triggers 15-minute lockout!
  const attempt6 = recordFailedAttempt(testClientKey);
  assert(
    attempt6.attempts === 6 && attempt6.isLocked === true && attempt6.remainingLockoutSeconds > 0,
    `Attempt 6 recorded: triggers temporary account lockout (remaining seconds: ${attempt6.remainingLockoutSeconds}s)`
  );

  // Immediate subsequent check must reject
  const lockedCheck = checkRateLimit(testClientKey);
  assert(
    lockedCheck.allowed === false && lockedCheck.isLocked === true && lockedCheck.remainingLockoutSeconds > 0,
    'Immediate subsequent check rejects request with allowed: false and active cooldown timer'
  );

  // Reset rate limit simulates successful authentication
  resetRateLimit(testClientKey);
  const resetCheck = checkRateLimit(testClientKey);
  assert(
    resetCheck.allowed === true && resetCheck.attempts === 0 && resetCheck.isLocked === false,
    'resetRateLimit restores identifier to pristine unlocked state'
  );

  // ==========================================================================
  // SECTION 5: Enterprise Security Headers Verification (next.config.ts)
  // ==========================================================================
  console.log('\n\x1b[1m[SECTION 5] Enterprise Defense-in-Depth Security Headers (next.config.ts)\x1b[0m');

  assert(typeof nextConfig.headers === 'function', 'nextConfig defines async headers() method');

  if (typeof nextConfig.headers === 'function') {
    const configuredHeaders = await nextConfig.headers();
    const globalRule = configuredHeaders.find((rule) => rule.source === '/:path*');

    assert(globalRule !== undefined, 'Security headers rule matches all routes (/:path*)');

    if (globalRule) {
      const headerMap = new Map(globalRule.headers.map((h) => [h.key, h.value]));

      assert(
        headerMap.get('X-Frame-Options') === 'DENY',
        'X-Frame-Options is strictly set to DENY (clickjacking protection)'
      );

      assert(
        headerMap.get('X-Content-Type-Options') === 'nosniff',
        'X-Content-Type-Options is strictly set to nosniff (MIME sniffing defense)'
      );

      assert(
        headerMap.get('Referrer-Policy') === 'strict-origin-when-cross-origin',
        'Referrer-Policy is strictly set to strict-origin-when-cross-origin'
      );

      assert(
        headerMap.get('Permissions-Policy') === 'camera=(), microphone=(), geolocation=()',
        'Permissions-Policy disables camera, microphone, and geolocation hardware APIs'
      );

      assert(
        headerMap.get('Strict-Transport-Security')?.includes('max-age=63072000') === true,
        'Strict-Transport-Security (HSTS) enforces 2-year TLS transport policy'
      );

      const csp = headerMap.get('Content-Security-Policy');
      assert(
        csp !== undefined &&
          csp.includes("frame-ancestors 'none'") &&
          csp.includes('https://*.supabase.co'),
        'Content-Security-Policy blocks frame embedding and whitelists Supabase backend origins'
      );
    }
  }

  // ==========================================================================
  // FINAL REPORT
  // ==========================================================================
  console.log('\n\x1b[1m\x1b[36m====================================================================\x1b[0m');
  console.log(`\x1b[1mVERIFICATION SUMMARY: \x1b[32m${passed} PASSED\x1b[0m | \x1b[31m${failed} FAILED\x1b[0m`);
  console.log('\x1b[1m\x1b[36m====================================================================\x1b[0m\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSprint22Verification().catch((err) => {
  console.error('\x1b[31m[FATAL] Verification suite crashed:\x1b[0m', err);
  process.exit(1);
});
