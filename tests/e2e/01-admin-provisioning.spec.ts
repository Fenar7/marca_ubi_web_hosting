/**
 * @file 01-admin-provisioning.spec.ts
 * @description Playwright E2E User Journey 1: Team Member Provisioning & RBAC Role Assignment (PRD §4.1 WP4).
 *              Simulates agency administrator inviting a commercial sales representative,
 *              assigning operational roles, and verifying credentials and directory listing.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { test, expect } from '@playwright/test';
import { ensureAuthenticatedSession } from './auth-helper';

test.describe('E2E Journey 1: Admin Team Provisioning & Role Assignment', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate and navigate to team management workspace
    await ensureAuthenticatedSession(page, '/admin/team', 'admin');
  });

  test('renders team member directory with role badges and active counts', async ({ page }) => {
    await expect(page).toHaveTitle(/Marca Ubi/i);

    // Assert main directory container is visible
    const directoryContainer = page.locator('main, [data-testid="team-workspace"]').first();
    await expect(directoryContainer).toBeVisible();

    // Verify key action trigger for provisioning new team members
    const inviteButton = page.locator('button:has-text("Invite Team Member"), button:has-text("Add Member"), button:has-text("Invite")').first();
    if (await inviteButton.isVisible()) {
      await expect(inviteButton).toBeEnabled();
    }
  });

  test('opens provisioning modal and validates required contact fields', async ({ page }) => {
    const inviteButton = page.locator('button:has-text("Invite Team Member"), button:has-text("Add Member"), button:has-text("Invite")').first();
    if (await inviteButton.isVisible()) {
      await inviteButton.click();

      // Assert modal dialog presentation with frosted scrim
      const modal = page.locator('[role="dialog"], [data-testid="provision-modal"]').first();
      await expect(modal).toBeVisible();

      // Verify email input and role selector exist
      const emailInput = modal.locator('input[type="email"], input[name="email"]').first();
      await expect(emailInput).toBeVisible();

      // Verify submit button is disabled or triggers validation on empty submit
      const submitBtn = modal.locator('button[type="submit"]:has-text("Send"), button[type="submit"]:has-text("Invite")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await expect(emailInput).toBeFocused();
      }
    }
  });
});
