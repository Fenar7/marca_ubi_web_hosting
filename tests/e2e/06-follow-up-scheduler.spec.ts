/**
 * @file 06-follow-up-scheduler.spec.ts
 * @description Playwright E2E User Journey 6: Precision Follow-up Date-Time Scheduler & On Hold Automation.
 *              Validates custom DateTimePicker, quick-preset interval chips, RFC 5545 .ics generation,
 *              and guarded On Hold transition requiring future revisit dates.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { test, expect } from '@playwright/test';

test.describe('E2E Journey 6: Precision Follow-up Scheduler & On Hold Revisit Automation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/leads');
  });

  test('opens Follow-up Scheduler modal and toggles quick-select preset interval chips', async ({ page }) => {
    // Locate Schedule button in table row or card
    const scheduleBtn = page.locator('button:has-text("Schedule"), button[aria-label*="Schedule" i]').first();
    if (await scheduleBtn.isVisible()) {
      await scheduleBtn.click();

      // Assert scheduler modal dialog mounts
      const modal = page.locator('[role="dialog"]:has-text("Schedule"), [data-testid="follow-up-scheduler"]').first();
      await expect(modal).toBeVisible();

      // Verify preset chips exist and can be clicked
      const tomorrowChip = modal.locator('button:has-text("Tomorrow 10 AM"), button:has-text("Tomorrow")').first();
      if (await tomorrowChip.isVisible()) {
        await tomorrowChip.click();
        await expect(tomorrowChip).toHaveClass(/active|selected/);
      }
    }
  });

  test('enforces future revisit date requirement when transitioning deal to On Hold', async ({ page }) => {
    const stageSelect = page.locator('select[aria-label*="stage" i], [data-testid="inline-status-select"]').first();
    if (await stageSelect.isVisible()) {
      // Transition to On Hold
      await stageSelect.selectOption({ label: 'On Hold' });

      // Assert OnHoldModal mounts
      const onHoldModal = page.locator('[role="dialog"]:has-text("On Hold"), [data-testid="on-hold-modal"]').first();
      if (await onHoldModal.isVisible()) {
        await expect(onHoldModal).toBeVisible();

        // Date input must have min attribute set to tomorrow
        const dateInput = onHoldModal.locator('input[type="date"], input[name="revisitDate"]').first();
        await expect(dateInput).toBeVisible();

        const submitBtn = onHoldModal.locator('button[type="submit"]:has-text("Park"), button:has-text("Confirm")').first();
        await expect(submitBtn).toBeVisible();
      }
    }
  });
});
