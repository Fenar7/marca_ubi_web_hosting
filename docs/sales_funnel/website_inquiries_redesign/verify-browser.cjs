const { chromium, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const path = require('node:path');

const base = 'http://127.0.0.1:' + (process.env.INQUIRIES_FIXTURE_PORT || 3027) + '/admin/ingestion';
const dir = path.join(__dirname, 'screenshots');
fs.mkdirSync(dir, { recursive: true });

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const runtimeErrors = [];
  const results = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  async function check(name, test) {
    try {
      await test();
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, detail: error.message });
      console.error(name, error.message);
    }
  }

  async function open(query = '') {
    await page.goto(base + query);
    await page
      .getByRole('heading', { name: 'Inquiries', exact: true })
      .waitFor();
    await page.evaluate(() => document.fonts.ready);
  }
  const row = (name) =>
    page.getByRole('rowheader').getByRole('link', { name: new RegExp(name) });
  const detail = () => page.locator('main');
  const detailId = '10000000-0000-0000-0000-000000000001';
  const openDetail = (query = '') => page.goto(base + '/' + detailId + query);
  const write = () => page.evaluate(() => globalThis.fixtureWrites?.at(-1));
  const shot = (name) =>
    page.screenshot({ path: path.join(dir, name), fullPage: true });
  try {
    await check(
      'Desktop inquiry queue, scoped metrics, and source filters',
      async () => {
        await open();
        await expect(
          page.getByRole('link', { name: /2 Needs review/ }),
        ).toBeVisible();
        await expect(row('Asha Mehta')).toBeVisible();
        await shot('inquiries-desktop.png');
        await page.getByRole('link', { name: 'Manual', exact: true }).click();
        await expect(row('Diego Hale')).toBeVisible();
        await expect(row('Asha Mehta')).toHaveCount(0);
        await page.getByRole('link', { name: 'Website', exact: true }).click();
        await expect(row('Asha Mehta')).toBeVisible();
        await expect(row('Diego Hale')).toHaveCount(0);
      },
    );

    await check(
      'Search submits URL state and clear resets the queue',
      async () => {
        await open();
        await page.getByRole('searchbox', { name: 'Search' }).fill('missing');
        await page.getByRole('button', { name: 'Search', exact: true }).click();
        await expect(
          page.getByRole('heading', { name: 'No matching inquiries' }),
        ).toBeVisible();
        await page.getByRole('link', { name: 'Clear filters' }).first().click();
        await expect(row('Asha Mehta')).toBeVisible();
      },
    );

    await check('Detail opens with structured brief and history', async () => {
      await open();
      await row('Asha Mehta').click();
      await expect(
        detail().getByRole('heading', { name: 'Original inquiry' }),
      ).toBeVisible();
      await expect(
        detail().getByText('Inquiry received', { exact: true }),
      ).toBeVisible();
      await expect(page).toHaveURL(new RegExp('/admin/ingestion/' + detailId));
      await shot('inquiries-detail.png');
      await detail().getByRole('link', { name: /Back to inquiries/ }).click();
      await expect(row('Asha Mehta')).toBeVisible();
    });

    await check(
      'Manual form uses native focus management and stable retry key',
      async () => {
        await open();
        const trigger = page.getByRole('button', { name: 'Add inquiry' });
        await trigger.click();
        const dialog = page.getByRole('dialog', { name: 'Add inquiry' });
        await expect(dialog).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(trigger).toBeFocused();
        await trigger.click();
        await dialog.getByLabel('Name', { exact: true }).fill('Sample contact');
        await dialog
          .getByLabel('Email', { exact: true })
          .fill('sample@example.test');
        await dialog.getByLabel('Received via').selectOption('email');
        await dialog
          .getByLabel('Inquiry summary')
          .fill('A sizing and branding enquiry.');
        await dialog.getByLabel('Lead handling').selectOption('link');
        await dialog
          .getByRole('button', { name: 'Check for matching leads' })
          .click();
        await dialog.getByRole('radio', { name: /Asha Mehta/ }).check();
        await shot('inquiries-add.png');
        await dialog.getByRole('button', { name: 'Save inquiry' }).click();
        await expect(dialog.getByRole('alert')).toHaveText(
          'Fixture write rejected.',
        );
        const first = await write();
        expect(first.data.linkMode).toBe('link');
        await expect(dialog.getByLabel('Name', { exact: true })).toHaveValue(
          'Sample contact',
        );
        await dialog.getByRole('button', { name: 'Save inquiry' }).click();
        await expect(dialog.getByRole('alert')).toHaveText(
          'Fixture write rejected.',
        );
        expect((await write()).data.idempotencyKey).toBe(
          first.data.idempotencyKey,
        );
      },
    );

    await check(
      'Read access and lead-resolution permission are distinct',
      async () => {
        await openDetail('?viewer=1');
        await expect(
          page.getByRole('button', { name: 'Add inquiry' }),
        ).toHaveCount(0);
        await expect(
          detail().getByRole('button', { name: 'Save triage' }),
        ).toHaveCount(0);
        await openDetail('?no_leads=1');
        await expect(
          detail().getByRole('button', { name: 'Create lead' }),
        ).toHaveCount(0);
        await expect(
          detail().getByRole('button', { name: 'Save triage' }),
        ).toBeVisible();
        await open('?no_leads=1');
        await page.getByRole('button', { name: 'Add inquiry' }).click();
        await expect(
          page.getByRole('dialog').getByLabel('Lead handling'),
        ).toHaveCount(0);
      },
    );

    await check(
      'Triage sends the exact snapshot and explicit closure reason',
      async () => {
        await openDetail();
        await detail().getByLabel('Status').selectOption('closed');
        await detail()
          .getByLabel('Reason for closing')
          .fill('Resolved without an opportunity');
        await detail().getByRole('button', { name: 'Save triage' }).click();
        await expect(detail().getByRole('alert')).toHaveText(
          'Fixture write rejected.',
        );
        const result = await write();
        expect(result.data.expectedUpdatedAt).toBe(
          '2026-11-23T13:45:07.123456+00:00',
        );
        expect(result.data.closeReason).toBe('Resolved without an opportunity');
        await expect(
          detail().getByRole('button', { name: 'Reload inquiry' }),
        ).toBeVisible();
      },
    );

    await check(
      'Assignment excludes directory contacts without inquiry access',
      async () => {
        await open(
          '?owner=21000000-0000-0000-0000-000000000099',
        );
        await page.getByText('Filters', { exact: true }).click();
        const filter = page.getByRole('search', { name: 'Filter inquiries' });
        await expect(filter.getByLabel('Owner')).toHaveValue(
          '21000000-0000-0000-0000-000000000099',
        );
        await expect(
          filter.getByRole('option', { name: 'Directory Only' }),
        ).toHaveCount(1);

        await page.getByRole('button', { name: 'Add inquiry' }).click();
        const dialog = page.getByRole('dialog', { name: 'Add inquiry' });
        await expect(
          dialog.getByRole('option', { name: 'Sample Owner' }),
        ).toHaveCount(1);
        await expect(
          dialog.getByRole('option', { name: 'Directory Only' }),
        ).toHaveCount(0);
      },
    );

    await check('Empty and failed reads are distinct', async () => {
      await open('?empty=1');
      await expect(
        page.getByRole('heading', { name: 'No inquiries in this view' }),
      ).toBeVisible();
      await open('?error=1');
      await expect(
        page.getByRole('heading', { name: 'Could not load the inbox' }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /Unavailable Needs review/ }),
      ).toBeVisible();
    });

    await check('Mobile and desktop avoid document overflow', async () => {
      for (const width of [320, 375, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await openDetail();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width);
        if (width === 375) await shot('inquiries-mobile.png');
      }
    });

    await check(
      'No serious or critical accessibility issues or browser errors',
      async () => {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await openDetail();
        const findings = await new AxeBuilder({ page }).analyze();
        expect(
          findings.violations
            .filter(
              ({ impact }) => impact === 'serious' || impact === 'critical',
            )
            .map(({ id }) => id),
        ).toEqual([]);
        expect(runtimeErrors).toEqual([]);
      },
    );
  } finally {
    await browser.close();
    fs.writeFileSync(
      path.join(__dirname, 'browser-results.json'),
      JSON.stringify(
        {
          scope:
            'Actual inquiry components with isolated fixtures and simulated writes',
          results,
        },
        null,
        2,
      ) + '\n',
    );
  }
  process.exitCode = results.some(({ passed }) => !passed) ? 1 : 0;
  console.log(
    results.filter(({ passed }) => passed).length +
      '/' +
      results.length +
      ' inquiry browser checks passed.',
  );
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
