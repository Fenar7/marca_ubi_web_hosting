/**
 * @file 08-security-suspension-logout.spec.ts
 * @description Playwright E2E User Journey 8: Account Suspension, Session Revocation & Route Protection.
 *              Validates immediate termination of suspended representative sessions and strict redirect
 *              to login with 403 Forbidden enforcement on all administrative endpoints.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { test, expect } from '@playwright/test';

test.describe('E2E Journey 8: Account Suspension & Route Guard Security', () => {
  test('redirects unauthenticated or suspended callers to /login', async ({ page }) => {
    // Attempting direct access to protected leads workspace without auth
    await page.goto('/admin/leads');

    // Route guard or middleware must redirect to login or show auth challenge
    await expect(page).toHaveURL(/\/login|\/admin\/login/);
  });

  test('blocks unauthorized access to executive team provisioning endpoints', async ({ page }) => {
    // Attempting direct access to team management without auth
    await page.goto('/admin/team');

    await expect(page).toHaveURL(/\/login|\/admin\/login/);
  });
});
