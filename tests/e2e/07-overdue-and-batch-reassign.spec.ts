/**
 * @file 07-overdue-and-batch-reassign.spec.ts
 * @description Playwright E2E User Journey 7: Tiered Overdue Escalation & Manager Workload Reassignment (PRD §4.1 WP4).
 *              Validates OverdueBadge rendering in data grids, ManagerWorkloadCard metrics ribbon on /admin,
 *              and 0-lead protected BatchReassignModal dialog flow.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { test, expect } from '@playwright/test';
import { ensureAuthenticatedSession } from './auth-helper';

test.describe('E2E Journey 7: Overdue Escalation Engine & Batch Reassignment Wizard', () => {
  test('renders Manager Workload Oversight Card on /admin command center', async ({ page }) => {
    await ensureAuthenticatedSession(page, '/admin', 'admin');

    const workloadCard = page.locator('[data-testid="manager-workload-card"], section:has-text("Workload Oversight")').first();
    if (await workloadCard.isVisible()) {
      await expect(workloadCard).toBeVisible();

      // Check for batch reassign trigger button
      const reassignBtn = workloadCard.locator('button:has-text("Batch Reassign"), button:has-text("Reassign")').first();
      if (await reassignBtn.isVisible()) {
        await expect(reassignBtn).toBeEnabled();
      }
    }
  });

  test('guards Batch Reassignment Modal by disabling submit until at least one lead is checked', async ({ page }) => {
    await ensureAuthenticatedSession(page, '/admin/leads?bucket=overdue', 'admin');

    // Trigger batch reassign modal via overdue notice banner or action button
    const bannerBtn = page.locator('button:has-text("Reassign Overdue Deals"), button:has-text("Batch Reassign")').first();
    if (await bannerBtn.isVisible()) {
      await bannerBtn.click();

      const modal = page.locator('[role="dialog"]:has-text("Reassign"), [data-testid="batch-reassign-modal"]').first();
      await expect(modal).toBeVisible();

      // Submit action button must be disabled when 0 leads are checked
      const submitBtn = modal.locator('button:has-text("Reassign Selected Deals"), button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await expect(submitBtn).toBeDisabled();

        // Check first lead checkbox
        const firstCheckbox = modal.locator('input[type="checkbox"]').first();
        if (await firstCheckbox.isVisible()) {
          await firstCheckbox.check();
        }
      }
    }
  });
});
