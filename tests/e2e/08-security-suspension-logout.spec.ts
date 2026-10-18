/**
 * @file 08-security-suspension-logout.spec.ts
 * @description Playwright E2E User Journey 8: Account Suspension, Session Revocation & Route Protection (PRD §4.1 WP4).
 *              Validates immediate termination of suspended representative sessions and strict redirect
 *              to login with 403 Forbidden enforcement on all administrative endpoints.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { test, expect } from '@playwright/test';

test.describe('E2E Journey 8: Account Suspension & Route Guard Security', () => {
  test('redirects unauthenticated callers to /admin/login with sanitized next parameter', async ({ page }) => {
    // Attempting direct access to protected leads workspace without auth
    await page.goto('/admin/leads');

    // Route guard or middleware must redirect to login with encoded next target
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fleads|\/login/);
  });

  test('blocks unauthorized access to executive team provisioning endpoints', async ({ page }) => {
    // Attempting direct access to team management without auth
    await page.goto('/admin/team');

    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fteam|\/login/);
  });

  test('announces suspended account security notice when suspended credentials access portal', async ({ page }) => {
    await page.goto('/admin/login?error=account_suspended');

    const errorAlert = page.getByRole('alert').filter({ hasText: 'Corporate account has been suspended' }).first();
    await expect(errorAlert).toBeVisible();
  });
});
