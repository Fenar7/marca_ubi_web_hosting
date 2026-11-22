/** Renders production UI components against labeled local fixtures. */
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const path = require('node:path');
const os = require('node:os');

async function verify() {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, acceptDownloads: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:3017');
    await page.getByRole('heading', { name: 'Commercial overview' }).waitFor({ timeout: 5000 });
    await page.evaluate(() => document.fonts.ready);
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 960 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, 'Horizontal overflow at ' + width);
      if (width === 1440 || width === 390) {
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        assert.deepEqual(result.violations.map(item => [item.id, item.nodes.map(node => node.target)]), []);
        await page.screenshot({ path: path.join(os.tmpdir(), 'marca-overview-' + width + '.png'), fullPage: true });
      }
    }
    await page.setViewportSize({ width: 1440, height: 960 });
    const interval = page.getByRole('button', { name: /12 Oct.*18 Oct/ });
    await interval.focus();
    await page.keyboard.press('Enter');
    assert.equal(await interval.getAttribute('aria-pressed'), 'true');
    await page.getByRole('combobox', { name: 'Reporting period' }).selectOption('7d');
    await page.waitForURL(/timeframe=7d/);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV' }).click();
    assert.equal((await download).suggestedFilename(), 'marca-ubi-commercial-desk-7d.csv');
    await page.getByRole('combobox', { name: 'Stage' }).selectOption('stage-1');
    await page.waitForURL(/stage=stage-1/);
    await page.getByRole('button', { name: /Move to Proposal Sent/ }).first().click();
    const stageDialog = page.getByRole('dialog', { name: 'Move to Proposal Sent?' });
    await stageDialog.getByRole('button', { name: 'Cancel' }).click();
    assert.equal(await stageDialog.count(), 0);
    await page.getByRole('button', { name: /Search workspace/ }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.setViewportSize({ width: 390, height: 960 });
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    await page.getByRole('button', { name: 'Close navigation drawer' }).click();
    await page.goto('http://127.0.0.1:3017/?role=sales_executive');
    assert.equal(await page.getByRole('button', { name: 'Export CSV' }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('Passed responsive layout, axe, chart keyboard selection, period, CSV, stage filter and restricted-role checks.');
  } finally {
    await browser.close();
  }
}

verify().catch(error => { console.error(error); process.exitCode = 1; });
