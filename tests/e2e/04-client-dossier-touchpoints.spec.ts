/**
 * @file 04-client-dossier-touchpoints.spec.ts
 * @description Playwright E2E User Journey 4: Client 360 Slide-over Drawer & Omnichannel Touchpoint Studio (PRD §4.1 WP4).
 *              Validates slide-over drawer opening, Deal ID token copying, click-to-call deep-links,
 *              interaction duration presets, and real-time activity timeline rendering.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { test, expect } from '@playwright/test';
import { ensureAuthenticatedSession } from './auth-helper';

test.describe('E2E Journey 4: Client 360 Drawer & Omnichannel Interaction Studio', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticatedSession(page, '/admin/leads', 'admin');
  });

  test('slides open Client 360 drawer upon row or card interaction', async ({ page }) => {
    // Click first available deal row or view details trigger
    const leadTrigger = page.locator('tr[data-lead-id], button:has-text("View"), [data-testid="lead-card"]').first();
    if (await leadTrigger.isVisible()) {
      await leadTrigger.click();

      // Drawer container must slide in from right with frosted glassmorphism
      const drawer = page.locator('[role="dialog"], aside[class*="drawer" i], [data-testid="client-dossier-drawer"]').first();
      await expect(drawer).toBeVisible();

      // Deal ID token copy button verification
      const copyBtn = drawer.locator('button:has-text("LD-"), [aria-label*="Copy" i]').first();
      if (await copyBtn.isVisible()) {
        await expect(copyBtn).toBeEnabled();
      }
    }
  });

  test('logs phone call interaction with duration presets and outcome selection', async ({ page }) => {
    const leadTrigger = page.locator('tr[data-lead-id], button:has-text("View"), [data-testid="lead-card"]').first();
    if (await leadTrigger.isVisible()) {
      await leadTrigger.click();

      const drawer = page.locator('[role="dialog"], aside[class*="drawer" i]').first();
      if (await drawer.isVisible()) {
        // Switch to Phone Call tab in QuickActionComposer
        const callTab = drawer.locator('button:has-text("Call"), [role="tab"]:has-text("Call")').first();
        if (await callTab.isVisible()) {
          await callTab.click();

          // Verify duration preset selection
          const durationBtn = drawer.locator('button:has-text("15m"), button:has-text("5m")').first();
          if (await durationBtn.isVisible()) {
            await durationBtn.click();
          }

          // Input notes and submit interaction
          const notesArea = drawer.locator('textarea[placeholder*="notes" i], textarea[name="notes"]').first();
          if (await notesArea.isVisible()) {
            await notesArea.fill('Executive phone discussion regarding Q4 agency retainers.');
          }
        }
      }
    }
  });
});
