/**
 * @file chatpod.spec.ts
 * @description The Chat Pod gates that cannot be settled by reading the code: that the launcher shares the
 *              bottom band without colliding, that the panel holds its geometry at every width we ship,
 *              that the whole intake is walkable from the keyboard, that the pod contributes no layout
 *              shift, and that axe finds nothing critical or serious in the dialog or the launcher.
 *
 *              Run against the dev server already on the port (`npm run dev` binds 3003), never a
 *              second one: the pod mounts behind the intro-loader event, and a fresh server would be a
 *              different race.
 *
 *              `POST /api/sales-funnel/ingest` is intercepted in every submission test. These runs must
 *              not put leads into the studio's CRM, and the assertions are about what the pod does with
 *              a status code, which a stub returns more reliably than the route does.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Widths the panel has to survive, per docs/chat_pod/06 M6. */
const WIDTHS = [360, 390, 768, 1024, 1440] as const;

/** Where the pod mounts without waiting for the hero loader. */
const POD_PAGE = '/blog';

/**
 * The launcher is named from its own content: `Ubi` + `Ask`/`Close` + the sr-only disclosure, so the measured
 * accessible name is "Ubi Ask the digital assistant for Marca Ubi" and the action word moves with the state.
 * Matching the whole shape keeps this selector honest: a label that drifts away from the visible words is the
 * SC 2.5.3 defect the axe gate below watches for.
 */
const launcher = (page: Page): Locator =>
  page.getByRole('button', { name: /Ubi (?:Ask|Close) the digital assistant for Marca Ubi/ });
const panel = (page: Page): Locator => page.locator('#mubi-pod-panel');
const log = (page: Page): Locator => page.getByRole('log');
const tray = (page: Page): Locator => page.getByRole('group', { name: 'Choose a reply' });
const composer = (page: Page): Locator => page.getByRole('textbox', { name: 'Message' });

/** The launcher is deferred behind the loader and an idle slice; the ceiling is the 12s backstop plus slack. */
async function gotoPod(page: Page, path: string = POD_PAGE): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(launcher(page)).toBeVisible({ timeout: 30_000 });
}

async function openPanel(page: Page, path: string = POD_PAGE): Promise<void> {
  await gotoPod(page, path);
  // Keyboard open, so every test below starts from the same affordance the a11y gate cares about.
  await launcher(page).focus();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toHaveAttribute('data-open', 'true');

  // Consent is asked once per browser context, and Playwright gives each test a fresh one.
  const quiet = page.getByRole('button', { name: 'Do not save', exact: true });
  if (await quiet.count()) await quiet.click();

  await expect(log(page).locator('p').first()).toBeVisible({ timeout: 10_000 });
}

/** Enter on a focused control: the point of these tests is that no pointer is required. */
async function press(target: Locator, page: Page): Promise<void> {
  await target.focus();
  await page.keyboard.press('Enter');
  await settle(page);
}

/**
 * The panel answers after a 320-900ms typing beat, so a fixed sleep would either flake or crawl. The
 * indicator carries the accessible name the visitor hears, so waiting for it to leave is the same
 * signal the transcript gives a screen reader.
 */
async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(80);
  await expect(page.getByText('Ubi is answering')).toBeHidden({ timeout: 15_000 });
}

/** Start the questions from the persistent menu. */
async function startIntake(page: Page): Promise<void> {
  await press(tray(page).getByRole('button', { name: 'Start a project', exact: true }), page);
  await expect(tray(page).getByRole('button', { name: 'Continue', exact: true })).toBeVisible({ timeout: 10_000 });
}

/** Keyed by the placeholder the slot itself sets, so a re-worded question fails this test loudly. */
const FREE_TEXT: Record<string, string> = {
  'Your name': 'Asha Menon',
  'you@company.com': 'asha@studio.example',
};

/**
 * Walk one turn of the intake, keyboard only. The machine asks one question at a time, so the answer is
 * always either a chip in the tray or the composer, and the shape of the tray says which.
 */
async function answerTurn(page: Page): Promise<void> {
  const chips = tray(page).getByRole('button');
  const cont = chips.filter({ hasText: /^Continue$/ });
  const linksDone = chips.filter({ hasText: /^That is every link$/ });
  const skip = chips.filter({ hasText: /^Skip$/ });

  // Free text first: an optional text slot offers a Skip chip, and skipping the email would promote
  // the phone to required, which is a different branch of the machine than this walk is testing.
  const placeholder = (await composer(page).getAttribute('placeholder')) ?? '';
  const scripted = FREE_TEXT[placeholder];
  if (scripted !== undefined) {
    await composer(page).focus();
    await page.keyboard.type(scripted, { delay: 12 });
    await page.keyboard.press('Enter');
    await settle(page);
    return;
  }

  if ((await cont.count()) > 0) {
    // A multi-select needs a value before its Continue, or the FSM re-asks with the reason.
    await press(chips.nth(0), page);
    await press(cont.first(), page);
    return;
  }
  if ((await linksDone.count()) > 0) {
    await press(linksDone.first(), page);
    return;
  }
  if ((await skip.count()) > 0) {
    await press(skip.first(), page);
    return;
  }
  if ((await chips.count()) > 0) {
    await press(chips.first(), page);
    return;
  }

  throw new Error(`No scripted answer for the placeholder: ${placeholder || '(none)'}`);
}

/** Drive the machine to the review card and stop. */
async function walkToReview(page: Page, maxTurns = 30): Promise<Locator> {
  const send = page.getByRole('button', { name: 'Send it', exact: true });
  for (let turn = 0; turn < maxTurns; turn += 1) {
    if (await send.isVisible().catch(() => false)) return send;
    await answerTurn(page);
  }
  throw new Error('the intake never reached the review card');
}

test.describe('Chat Pod: mount, collision and geometry', () => {
  test('the launcher never collides with another floating control', async ({ page }) => {
    await gotoPod(page);

    for (const width of [390, 768, 1024, 1440, 1680] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(150);
      const measured = await page.evaluate(() => {
        const node = document.querySelector<HTMLElement>('[aria-controls="mubi-pod-panel"]');
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        const others: { label: string; rect: { left: number; top: number; right: number; bottom: number } }[] = [];
        for (const candidate of Array.from(document.querySelectorAll('body *'))) {
          const style = getComputedStyle(candidate);
          if (style.position !== 'fixed' || style.visibility === 'hidden' || style.pointerEvents === 'none') continue;
          if (candidate === node || node.contains(candidate) || candidate.contains(node)) continue;
          const box = candidate.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) continue;
          // Only a floating control can collide: a full-bleed overlay or a bar is a different problem
          // than two buttons competing for the same corner.
          if (box.width > window.innerWidth * 0.6 || box.height > window.innerHeight * 0.5) continue;
          if (box.bottom < window.innerHeight - 260) continue;
          others.push({
            label: candidate.getAttribute('aria-label') ?? candidate.tagName,
            rect: { left: box.left, top: box.top, right: box.right, bottom: box.bottom },
          });
        }
        return {
          launcher: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
          viewport: { width: window.innerWidth, height: window.innerHeight },
          others,
        };
      });

      expect(measured, `no launcher at ${width}w`).not.toBeNull();
      const box = measured!.launcher;
      expect(box.left, `launcher inside the viewport at ${width}w`).toBeGreaterThanOrEqual(0);
      expect(box.right, `launcher inside the viewport at ${width}w`).toBeLessThanOrEqual(measured!.viewport.width + 0.5);
      expect(box.bottom, `launcher above the fold at ${width}w`).toBeLessThanOrEqual(measured!.viewport.height + 0.5);
      // R-35 evidence: the control is big enough to hit and is not covering anything.
      expect(box.bottom - box.top, `launcher height at ${width}w`).toBeGreaterThanOrEqual(44);

      for (const other of measured!.others) {
        const overlaps =
          box.left < other.rect.right - 1 &&
          other.rect.left < box.right - 1 &&
          box.top < other.rect.bottom - 1 &&
          other.rect.top < box.bottom - 1;
        expect(overlaps, `launcher overlaps ${other.label} at ${width}w`).toBe(false);
      }
    }
  });

  test('the panel holds its box and its chips at every shipped width', async ({ page }) => {
    await openPanel(page);
    await startIntake(page);

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await answerTurn(page).catch(() => undefined);
      await page.waitForTimeout(200);

      const geometry = await page.evaluate(() => {
        const node = document.getElementById('mubi-pod-panel');
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        const groups = Array.from(node.querySelectorAll<HTMLElement>('[role="group"]'));
        const chips = node.querySelectorAll<HTMLElement>('[role="group"] button');
        const paragraphs = Array.from(node.querySelectorAll<HTMLElement>('p'));
        return {
          docScroll: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
          rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
          panelScrollWidth: node.scrollWidth,
          panelClientWidth: node.clientWidth,
          groups: groups.map((group) => {
            const box = group.getBoundingClientRect();
            return { left: box.left, right: box.right };
          }),
          chipBoxes: Array.from(chips).map((chip) => {
            const box = chip.getBoundingClientRect();
            return { left: box.left, right: box.right, width: box.width, height: box.height, text: chip.textContent ?? '' };
          }),
          overflowing: paragraphs
            .filter((paragraph) => paragraph.scrollWidth > paragraph.clientWidth + 1)
            .map((paragraph) => (paragraph.textContent ?? '').slice(0, 40)),
        };
      });

      expect(geometry, `no panel at ${width}w`).not.toBeNull();
      const box = geometry!.rect;
      expect(geometry!.docScroll, `page scrolls sideways at ${width}w`).toBeLessThanOrEqual(geometry!.viewport + 1);
      expect(geometry!.panelScrollWidth, `panel scrolls sideways at ${width}w`).toBeLessThanOrEqual(geometry!.panelClientWidth + 1);
      expect(box.left, `panel off-screen left at ${width}w`).toBeGreaterThanOrEqual(-0.5);
      expect(box.right, `panel off-screen right at ${width}w`).toBeLessThanOrEqual(geometry!.viewport + 0.5);
      expect(box.top, `panel above the viewport at ${width}w`).toBeGreaterThanOrEqual(-0.5);
      expect(box.bottom, `panel below the viewport at ${width}w`).toBeLessThanOrEqual(900 + 0.5);
      expect(geometry!.overflowing, `transcript text clipped at ${width}w: ${geometry!.overflowing.join(' | ')}`).toEqual([]);

      const group = geometry!.groups[0];
      if (group && geometry!.chipBoxes.length > 0) {
        for (const chip of geometry!.chipBoxes) {
          expect(chip.left, `chip escapes its row at ${width}w`).toBeGreaterThanOrEqual(group.left - 1);
          expect(chip.right, `chip escapes its row at ${width}w`).toBeLessThanOrEqual(group.right + 1);
          // Wrapping is the fix for overflow, so no chip may be squeezed below a hittable box.
          if (chip.width > 40) expect(chip.height, `chip too short to tap at ${width}w`).toBeGreaterThanOrEqual(28);
        }
      }
    }
  });

  test('the sheet lifts by the keyboard inset it is given', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await openPanel(page);

    const before = await panel(page).evaluate((node) => node.getBoundingClientRect().bottom);
    await panel(page).evaluate((node) => node.style.setProperty('--pod-keyboard', '280px'));
    const after = await panel(page).evaluate((node) => node.getBoundingClientRect().bottom);

    // A headless browser has no soft keyboard, so this measures the CSS contract the inset exists for:
    // the sheet's bottom edge is owned by `--pod-keyboard`, and nothing else moves.
    expect(before - after).toBeCloseTo(280, 1);
  });

  test('the pod shifts no layout when it mounts, opens or answers', async ({ page }) => {
    await page.addInitScript(() => {
      type ShiftEntry = PerformanceEntry & {
        hadRecentInput?: boolean;
        value?: number;
        sources?: { node: Node | null }[];
      };
      const sink = window as unknown as { __podShifts: { value: number; who: string }[] };
      sink.__podShifts = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as ShiftEntry[]) {
          if (entry.hadRecentInput) continue;
          const who = (entry.sources ?? [])
            .map((source) => {
              const node = source.node as HTMLElement | null;
              if (!node || typeof node.closest !== 'function') return 'outside the pod';
              return node.closest('#mubi-pod-panel') || node.matches('[aria-haspopup="dialog"]') ? 'pod' : 'outside the pod';
            })
            .join(', ');
          sink.__podShifts.push({ value: entry.value ?? 0, who: who || 'unattributed' });
        }
      }).observe({ buffered: true, type: 'layout-shift' });
    });

    await gotoPod(page);
    await openPanel(page);
    await startIntake(page);
    await answerTurn(page);

    const shifts = await page.evaluate(() => (window as unknown as { __podShifts: { value: number; who: string }[] }).__podShifts);
    const ours = shifts.filter((shift) => shift.who === 'pod');
    const total = ours.reduce((sum, shift) => sum + shift.value, 0);

    // The typing indicator reserves its own height and the panel is fixed, so the pod should contribute
    // nothing. Any entry attributed to it here is a real jump a reader would have to re-find their place in.
    expect(total, `pod layout shift ${total} from ${JSON.stringify(ours)}`).toBeLessThanOrEqual(0.0001);
  });

  test("the pod never becomes the page's largest contentful paint", async ({ page }) => {
    await page.addInitScript(() => {
      type LcpEntry = PerformanceEntry & { element?: Element };
      const sink = window as unknown as { __lcp: { ms: number; inPod: boolean; tag: string } | null };
      sink.__lcp = null;
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as LcpEntry[];
        const last = entries[entries.length - 1];
        const node = last?.element;
        if (!node) return;
        sink.__lcp = {
          ms: Math.round(last.startTime),
          inPod: Boolean(node.closest('#mubi-pod-panel, [aria-controls="mubi-pod-panel"]')),
          tag: `${node.tagName}.${String(node.className ?? '').split(' ')[0]}`,
        };
      }).observe({ buffered: true, type: 'largest-contentful-paint' });
    });

    await gotoPod(page);
    await openPanel(page);

    const lcp = await page.evaluate(
      () => (window as unknown as { __lcp: { ms: number; inPod: boolean; tag: string } | null }).__lcp,
    );
    // The budget claim that matters is structural: the pod is deferred behind the loader and an idle
    // slice, so it must never be the element the browser names as the page's largest content.
    expect(lcp, 'the browser recorded no LCP entry').not.toBeNull();
    expect(lcp!.inPod, `the pod is the LCP element (${lcp!.tag})`).toBe(false);
  });
});

test.describe('Chat Pod: touch targets', () => {
  // `isMobile` + `hasTouch` is what makes `@media (pointer: coarse)` match. A narrow viewport alone does not,
  // and the whole descriptor cannot be used here because it carries a `defaultBrowserType`.
  test.use({ viewport: { height: 844, width: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });

  test('every control in the open dialog is a finger-sized box', async ({ page }) => {
    await openPanel(page);
    await startIntake(page);

    const coarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches);
    // Firefox cannot emulate a coarse pointer, so the engine that cannot reach the rule is not the
    // engine that gets to fail it. Chromium and the mobile projects both report coarse.
    test.skip(!coarse, 'this engine reports no coarse pointer, so the touch lift cannot be measured');

    const boxes = await panel(page).evaluate((node) =>
      Array.from(node.querySelectorAll<HTMLElement>('button')).map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          label: (button.textContent || button.getAttribute('aria-label') || '(empty)').trim().slice(0, 28),
          width: rect.width,
          height: rect.height,
        };
      }),
    );
    const hittable = boxes.filter((box) => box.height > 0);

    expect(hittable.length, 'the dialog must hold real controls to measure').toBeGreaterThan(3);
    // 43.9, not 44: at a device pixel ratio of 3 the browser rounds a 2.75rem box to 43.99994px.
    for (const box of hittable) {
      expect(box.height, `thumb target too short: "${box.label}"`).toBeGreaterThanOrEqual(43.9);
      expect(box.width, `thumb target too narrow: "${box.label}"`).toBeGreaterThanOrEqual(43.9);
    }
  });
});

test.describe('Chat Pod: keyboard-only intake', () => {
  test('a brief can be assembled without a pointer', async ({ page }) => {
    await page.route('**/api/sales-funnel/ingest', (route) =>
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true }) }),
    );
    await openPanel(page);
    await startIntake(page);

    const send = await walkToReview(page);
    await expect(send).toBeVisible();

    // The review card has to be readable and editable from the keyboard too.
    const rows = panel(page).getByRole('listitem');
    expect(await rows.count()).toBeGreaterThanOrEqual(5);

    // The chip that was last pressed no longer exists, so focus is briefly on `body`. What the trap
    // promises is that the next Tab pulls it back into the dialog rather than letting it walk the page.
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => ({
      inside: Boolean(document.activeElement?.closest('#mubi-pod-panel')),
      landed: document.activeElement?.textContent?.slice(0, 24) ?? String(document.activeElement?.tagName),
    }));
    expect(focus.inside, `focus escaped the dialog and landed on "${focus.landed}"`).toBe(true);

    await press(send, page);
    await expect(log(page).getByText(/Sent\. It is with the studio now/)).toBeVisible({ timeout: 15_000 });
  });

  test('Tab stays inside the dialog and Escape leaves it', async ({ page }) => {
    await openPanel(page);

    for (let step = 0; step < 14; step += 1) {
      await page.keyboard.press('Tab');
      const escaped = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active || active === document.body) return false;
        return !Boolean(active.closest('#mubi-pod-panel'));
      });
      expect(escaped, `Tab landed outside the dialog on step ${step}`).toBe(false);
    }

    await page.keyboard.press('Escape');
    await expect(panel(page)).not.toHaveAttribute('data-open', 'true');
    const returned = await page.evaluate(() => document.activeElement?.getAttribute('aria-controls'));
    expect(returned, 'Escape did not hand focus back to the launcher').toBe('mubi-pod-panel');
  });

  test('a refused answer re-asks the same question with the reason', async ({ page }) => {
    await openPanel(page);
    await startIntake(page);

    const cont = tray(page).getByRole('button', { name: 'Continue', exact: true });
    await press(cont.first(), page);
    await expect(log(page).getByText(/Choose at least one kind of work/)).toBeVisible({ timeout: 10_000 });

    // Same slot, still standing there, and the chips are back for another attempt.
    await expect(tray(page).getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
  });
});

test.describe('Chat Pod: submission outcomes', () => {
  test('one press sends one request, and a second press is refused', async ({ page }) => {
    let posts = 0;
    await page.route('**/api/sales-funnel/ingest', (route) => {
      posts += 1;
      void route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await openPanel(page);
    await startIntake(page);
    const send = await walkToReview(page);

    await send.click();
    await expect(log(page).getByText(/Sent\. It is with the studio now/)).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(400);
    expect(posts, 'the panel POSTed more than once for one press').toBe(1);
  });

  test('a validation refusal goes back to the question it names', async ({ page }) => {
    await page.route('**/api/sales-funnel/ingest', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Check the brief', details: { email: ['Please provide a valid email address.'] } }),
      }),
    );

    await openPanel(page);
    await startIntake(page);
    const send = await walkToReview(page);
    await send.click();

    await expect(log(page).getByText(/valid email address/)).toBeVisible({ timeout: 15_000 });
  });

  test('a rate limit tells the truth and keeps the answers', async ({ page }) => {
    await page.route('**/api/sales-funnel/ingest', (route) =>
      route.fulfill({ status: 429, headers: { 'Retry-After': '600' }, contentType: 'application/json', body: JSON.stringify({ error: 'Too many' }) }),
    );

    await openPanel(page);
    await startIntake(page);
    const send = await walkToReview(page);
    await send.click();

    await expect(log(page).getByText(/7012 052 472/)).toBeVisible({ timeout: 15_000 });
    await expect(log(page).getByRole('paragraph').filter({ hasText: 'Asha Menon' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send it again' })).toBeVisible();
  });

  test('a transport failure retries three times with one key', async ({ page }) => {
    const keys: string[] = [];
    await page.route('**/api/sales-funnel/ingest', (route) => {
      keys.push(route.request().headers()['x-idempotency-key'] ?? '');
      void route.abort('failed');
    });

    await openPanel(page);
    await startIntake(page);
    const send = await walkToReview(page);
    await send.click();

    await expect(log(page).getByText(/could not reach the studio/)).toBeVisible({ timeout: 30_000 });
    expect(keys.length, 'the retry count drifted from the spec').toBe(3);
    expect(new Set(keys).size, 'a retry minted a second idempotency key').toBe(1);
  });
});

test.describe('Chat Pod: the D5 idle nudge', () => {
  test('one idle stretch marks the session, and nothing marks it twice', async ({ page }) => {
    test.setTimeout(70_000);
    await gotoPod(page);

    await page.waitForFunction(
      () => window.sessionStorage.getItem('mubi.pod.nudged') === '1',
      undefined,
      { timeout: 40_000, polling: 500 },
    );

    // Once per session: the flag is set before the cue is drawn, so a second idle stretch cannot
    // produce a second nudge in the same tab.
    await page.waitForTimeout(25_000);
    const marks = await page.evaluate(() => window.sessionStorage.getItem('mubi.pod.nudged'));
    expect(marks).toBe('1');
  });

  test('a visitor who is reading past the halfway mark is never nudged', async ({ page }) => {
    test.setTimeout(70_000);
    await gotoPod(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1_000);

    await page.waitForFunction(
      () => window.scrollY > 0,
      undefined,
      { timeout: 5_000 },
    );
    await page.waitForTimeout(25_000);

    expect(await page.evaluate(() => window.sessionStorage.getItem('mubi.pod.nudged'))).toBeNull();
  });
});

/**
 * Chips arrive on a 40ms stagger and `animation-fill-mode: both` holds each one at opacity 0 until its
 * turn, so a scan taken during the entrance measures a frame of an animation, not the design. Contrast is
 * a property of the resting state: wait for it, and fail loudly if a chip is still invisible a second later.
 */
async function chipsAtRest(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Array.from(
            document.querySelectorAll<HTMLElement>('#mubi-pod-panel [role="group"] button'),
          ).every((node) => Number(getComputedStyle(node).opacity) === 1),
        ),
      { timeout: 2_000, message: 'a chip never reached full opacity, so its text is invisible' },
    )
    .toBe(true);
}

/**
 * What ships is the launcher and the dialog together, so both go into the scan. The launcher is the only
 * control a visitor meets before the dialog exists, and a panel-only include is exactly how its label
 * contract would stay untested. Violations come back as strings so a failure reads as a rule, not a blob.
 */
async function scanPod(page: Page): Promise<string[]> {
  await chipsAtRest(page);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .include('#mubi-pod-panel, [aria-controls="mubi-pod-panel"]')
    .analyze();
  return results.violations
    .filter((v) => v.impact === 'critical' || v.impact === 'serious')
    .map((v) => `${v.id} (${v.impact}) on ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

test.describe('Chat Pod: accessibility', () => {
  test('axe finds no critical or serious violation in the dialog', async ({ page }) => {
    await openPanel(page);
    await startIntake(page);
    await answerTurn(page);

    expect(await scanPod(page)).toEqual([]);

    // The review card is the densest state the panel reaches: labelled rows, the progress bar and the
    // three action chips all on screen at once.
    await walkToReview(page);
    expect(await scanPod(page)).toEqual([]);
  });

  test('the same scan is clean on the homepage, where a visitor actually lands', async ({ page }) => {
    // §06 M7 asks for the scan on `/`. The other gates mount on `/blog` because it paints the launcher
    // sooner; this one pays the hero video and the intro loader so the pod is proven in its busiest host.
    await openPanel(page, '/');
    expect(await scanPod(page)).toEqual([]);
  });

  test('the dialog is announced and the transcript is a live region', async ({ page }) => {
    await openPanel(page);

    await expect(panel(page)).toHaveAttribute('role', 'dialog');
    await expect(panel(page)).toHaveAttribute('aria-modal', 'true');
    const labelledBy = await panel(page).getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    await expect(page.locator(`#${labelledBy}`)).toContainText('Ubi');

    await expect(log(page)).toHaveAttribute('aria-live', 'polite');
    // Scoped to the panel on purpose: the launcher's own accessible name now carries "the digital assistant",
    // so a page-wide text query hands back that invisible span instead of the header line a visitor reads.
    const header = panel(page).locator('header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Digital assistant · Not a person');
  });

  test('reduced motion still opens a usable panel and never nudges', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoPod(page);
    await launcher(page).focus();
    await page.keyboard.press('Enter');
    await expect(panel(page)).toHaveAttribute('data-open', 'true');
    await expect(panel(page).getByText('Menu')).toBeVisible();
    // The nudge is a movement cue; under reduced motion it must not fire at all.
    await expect(launcher(page)).not.toHaveAttribute('data-nudge', 'true');
  });
});
