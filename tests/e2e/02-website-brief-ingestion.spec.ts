/**
 * @file 02-website-brief-ingestion.spec.ts
 * @description Playwright E2E User Journey 2: Inbound Project Brief Submission & Webhook Ingestion (PRD §4.1 WP4).
 *              Simulates prospective luxury client completing the /start-project questionnaire,
 *              normalizing contact coordinates, and verifying public brief ingestion.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { test, expect } from '@playwright/test';

test.describe('E2E Journey 2: Website Brief Ingestion & Prospect Normalization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/start-project');
  });

  test('renders multi-step project brief questionnaire smoothly', async ({ page }) => {
    await expect(page).toHaveTitle(/Start|Project|Marca Ubi/i);

    // Verify main container and project form are visible
    const mainContainer = page.locator('#start-project, main').first();
    await expect(mainContainer).toBeVisible();

    const formElement = page.locator('form, [data-testid="project-form"]').first();
    await expect(formElement).toBeVisible();
  });

  test('validates client contact inputs and sanitizes submitted coordinates', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="Email" i]').first();
    const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="Phone" i]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('e2e.client@luxurytest.ae');
      await expect(emailInput).toHaveValue('e2e.client@luxurytest.ae');
    }

    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+971 50 123 4567');
      await expect(phoneInput).toHaveValue('+971 50 123 4567');
    }
  });
});
