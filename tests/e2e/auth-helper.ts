/**
 * @file auth-helper.ts
 * @description Enterprise E2E Authentication & Session Helper for Playwright test suites.
 *              Provides deterministic authentication routines, session cookie management,
 *              and protected administrative enclave access (PRD §4.1 Work Package 4).
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { Page, test } from '@playwright/test';

/**
 * Ensures an active administrative session before executing user journey assertions.
 * If redirected to the login portal, fills credentials and completes authentication.
 *
 * @param page - Playwright Page fixture
 * @param targetUrl - Destination protected route (e.g. /admin/leads, /admin/team)
 * @param role - Target role identity
 */
export async function ensureAuthenticatedSession(
  page: Page,
  targetUrl: string = '/admin/leads',
  role: 'admin' | 'sales_manager' | 'sales_executive' = 'admin'
): Promise<void> {
  await page.goto(targetUrl);

  // Check if edge middleware intercepted unauthenticated access and redirected to login
  if (page.url().includes('/admin/login') || page.url().includes('/login')) {
    const currentUrl = new URL(page.url());
    const loopbackHosts = new Set(['localhost', '127.0.0.1', '::1']);
    const credentialPrefix = role === 'admin' ? 'ADMIN' : role === 'sales_manager' ? 'MANAGER' : 'EXECUTIVE';
    const credentials = {
      email: process.env[`CRM_E2E_${credentialPrefix}_EMAIL`],
      password: process.env[`CRM_E2E_${credentialPrefix}_PASSWORD`],
    };

    if (
      !loopbackHosts.has(currentUrl.hostname) ||
      process.env.CRM_E2E_DATABASE_ISOLATED !== 'true'
    ) {
      test.skip(true, 'Authenticated CRM E2E requires explicit credentials and an isolated test database on loopback.');
      return;
    }
    if (!credentials.email || !credentials.password) {
      test.skip(true, 'Authenticated CRM E2E requires explicit credentials and an isolated test database on loopback.');
      return;
    }

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill(credentials.email);
      await passwordInput.fill(credentials.password);
      await submitButton.click();

      // Wait for navigation back to target administrative enclave
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 }).catch(() => {});
    }
  }
}
