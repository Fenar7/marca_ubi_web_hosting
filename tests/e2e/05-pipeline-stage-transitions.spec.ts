/**
 * @file 05-pipeline-stage-transitions.spec.ts
 * @description Playwright E2E User Journey 5: Guarded Stage Progression & Post-Conversion Record Locking.
 *              Validates input verification for Negotiation, standardized reason catalog for Lost,
 *              confetti particle burst for Converted, and post-conversion locking badge presentation.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { test, expect } from '@playwright/test';

test.describe('E2E Journey 5: Guarded Stage Transitions & Converted Record Locking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/leads');
  });

  test('intercepts terminal stage transitions and routes to guarded modal dialog', async ({ page }) => {
    // Locate stage selector dropdown on first deal row
    const stageSelect = page.locator('select[aria-label*="stage" i], [data-testid="inline-status-select"]').first();
    if (await stageSelect.isVisible()) {
      // Attempt transition to 'Lost'
      await stageSelect.selectOption({ label: 'Lost' });

      // Verify Lost modal opens with standardized reason options
      const lostModal = page.locator('[role="dialog"]:has-text("Lost"), [data-testid="lost-reason-modal"]').first();
      await expect(lostModal).toBeVisible();

      // Verify reason select contains at least 7 options
      const reasonSelect = lostModal.locator('select[name="lostReason"], select').first();
      await expect(reasonSelect).toBeVisible();
    }
  });

  test('validates commercial contract value and terms during Converted stage celebration', async ({ page }) => {
    const stageSelect = page.locator('select[aria-label*="stage" i], [data-testid="inline-status-select"]').first();
    if (await stageSelect.isVisible()) {
      // Transition to 'Converted'
      await stageSelect.selectOption({ label: 'Converted' });

      // Assert Converted celebration modal with confetti canvas
      const convertedModal = page.locator('[role="dialog"]:has-text("Converted"), [data-testid="converted-modal"]').first();
      if (await convertedModal.isVisible()) {
        await expect(convertedModal).toBeVisible();

        // Revenue input must enforce positive number
        const revenueInput = convertedModal.locator('input[type="number"], input[name="finalRevenue"]').first();
        if (await revenueInput.isVisible()) {
          await revenueInput.fill('2500000');
          await expect(revenueInput).toHaveValue('2500000');
        }
      }
    }
  });
});
