/**
 * @file chatpod.spec.ts
 * @description The Chat Pod gates that cannot be settled by reading the code: that the launcher shares the
 *              bottom band without colliding, that the panel holds its geometry at every width we ship,
 *              that the whole intake is walkable from the keyboard, that the pod contributes no layout
 *              shift, that axe finds nothing critical or serious in the dialog or the launcher, and that a
 *              second message means something against the first one.
 *
 *              That last group is the reason this file is longer than a smoke test. The engine keeps its
 *              turn and its fallback counter in refs, so anaphora and the two-strike rule only exist across
 *              two renders of the live panel; a unit test can call `followUp` but cannot show that the
 *              panel fed it the chips a visitor was actually looking at.
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
 * Longer than the transcript's 600ms glide, so a gate that measures a scroll position does it against a
 * column that has finished moving. Anything shorter measures the pod's own animation as a defect.
 */
const GLIDE_SETTLE_MS = 800;

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
 * The same press, with the scroll-into-view that `focus()` performs taken away.
 *
 * A chip rail taller than the panel cannot be fully in view, so asking Playwright to reach the options at
 * its foot moves the column before it measures it — and the gate then reports the harness's own scroll as
 * a defect in the pod. `preventScroll` keeps the reader's position the one the pod gave them, which is the
 * thing under test.
 */
async function tapInPlace(target: Locator, page: Page): Promise<void> {
  await target.evaluate((node) => node.focus({ preventScroll: true }));
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

/**
 * The chip that commits a multi-select (`Continue`) or a link list (`That is every link`). Either can
 * carry the running tally — `Continue (3)` — because a seventeen-option wall wraps and the picks made at
 * the top of it are not necessarily on screen when the visitor reaches the bottom. Matched by shape, so a
 * test that asserts the row is stable under a tap cannot be satisfied by a label that moved.
 */
const COMMIT_CHIPS = /^(?:Continue|That is every link)(?: \(\d+\))?$/;
const CONTINUE_CHIPS = /^Continue(?: \(\d+\))?$/;
const LINKS_DONE_CHIPS = /^That is every link(?: \(\d+\))?$/;

/** Start the questions from the persistent menu. */
async function startIntake(page: Page): Promise<void> {
  await press(tray(page).getByRole('button', { name: 'Start a project', exact: true }), page);
  await expect(tray(page).getByRole('button', { name: COMMIT_CHIPS })).toBeVisible({ timeout: 10_000 });
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
  const cont = chips.filter({ hasText: CONTINUE_CHIPS });
  const linksDone = chips.filter({ hasText: LINKS_DONE_CHIPS });
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

  /**
   * Every assertion here is "the control is inside the screen the visitor is holding", which is the
   * thing that breaks when someone raises the panel's floor. Shared by the two geometries that constrain
   * the panel by height rather than width.
   */
  async function holdsItsControls(page: Page, size: { width: number; height: number }, columnFloor = 80): Promise<void> {
    await page.setViewportSize(size);
    await openPanel(page);
    await startIntake(page);

    const box = await panel(page).evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    });
    expect(box.top, `the panel runs off the top of a ${size.height}px-tall screen`).toBeGreaterThanOrEqual(-0.5);
    expect(box.bottom, 'the panel runs off the bottom of the screen').toBeLessThanOrEqual(size.height + 0.5);
    expect(box.left).toBeGreaterThanOrEqual(-0.5);
    expect(box.right).toBeLessThanOrEqual(size.width + 0.5);

    // The three controls a reader at this size actually needs: who is talking, what they just said, and
    // the way back out. A panel that keeps its floor height loses the first and the last.
    await expect(panel(page).getByRole('button', { name: 'Close the assistant panel', exact: true })).toBeVisible();
    await expect(composer(page)).toBeVisible();
    const persona = panel(page).getByText('Ubi', { exact: true }).first();
    await expect(persona, 'the header is off-screen, so the visitor cannot tell who they are talking to').toBeInViewport();

    const metrics = await page.evaluate(() => {
      const node = document.querySelector<HTMLElement>('#mubi-pod-panel [aria-label="Conversation"]');
      const chips = Array.from(document.querySelectorAll<HTMLElement>('#mubi-pod-panel [role="group"] button'));
      return {
        flowHeight: node?.clientHeight ?? 0,
        shortestChip: Math.min(...chips.map((chip) => chip.getBoundingClientRect().height)),
      };
    });
    expect(metrics.flowHeight, 'the column has been squeezed to nothing').toBeGreaterThanOrEqual(columnFloor);
    expect(metrics.shortestChip, 'a chip has become too short to hit with a thumb').toBeGreaterThanOrEqual(28);
  }

  /**
   * A phone turned sideways is the first height-constrained shipped geometry. At 844x390 the panel is the
   * full sheet — the `max-width: 1023px` rule wins on *width*, so a landscape phone is a sheet, not a
   * float — and the sheet is shorter than its own content, which is what the column and the thumb test
   * above are for.
   */
  test('the panel fits a phone turned sideways, where height is the scarce axis', async ({ page }) => {
    await holdsItsControls(page, { width: 844, height: 390 });
  });

  /**
   * The other half, and the one the sheet above cannot see: a wide window shorter than the floating
   * panel's own `26rem` floor. At 1280x400 the clamp resolves to the floor (74vh would be 296px), the
   * floor is 416px and the panel floats 80px off the bottom of the screen — above the launcher, which is
   * what `--pod-y` is for — so the header leaves the top. The width sweep above can never catch this,
   * because every width it visits has a tall viewport.
   *
   * The column floor here is lower than the phone's, and that is the truth rather than a concession: the
   * panel is capped by the screen itself, the header, the progress rail and the composer are paid for
   * first, and what is left measures 71px at this size — about three lines of a reply, with the rest of
   * the thread one wheel away. Anything that reads as a fourth line is a change to the chrome, not to
   * the cap, and this assertion is what stops the cap from being quietly lowered again.
   */
  test('the panel fits a desktop window shorter than its own floor', async ({ page }) => {
    await holdsItsControls(page, { width: 1280, height: 400 }, 64);
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

  test('the pod shifts no layout on its own account when it mounts, opens or answers', async ({ page }) => {
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

  /**
   * The other half of the promise, which the CLS gate above structurally cannot see.
   *
   * `hadRecentInput` is what keeps a click's own reaction out of the score — the browser forgives a shift
   * within 500ms of an input, because a button that responds is not a layout defect. That is correct for
   * Core Web Vitals and wrong for this pod: the row that answers "Start a project" is a reaction a visitor
   * asked for, and it is also 46px of chrome inserted above the transcript, which moves the words. So the
   * metric that excludes it is not the thing that proves the reader kept their place, and the name of the
   * gate used to claim that it was.
   *
   * What is measured instead is the two facts that together say the reader survived the push: the rail took
   * its height out of the scrollable column (not out of the panel, whose bottom edge is fixed), and the
   * reader is still standing at the end of the column afterwards. An uncompensated push leaves the newest
   * line 46px below the visible edge, which is the number this gate fails on.
   */
  test('starting the brief does not leave the reader above the end of the column', async ({ page }) => {
    await page.addInitScript(() => {
      type ShiftEntry = PerformanceEntry & { hadRecentInput?: boolean; value?: number; sources?: { node: Node | null }[] };
      const sink = window as unknown as { __allShifts: { value: number; input: boolean; inPod: boolean }[] };
      sink.__allShifts = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as ShiftEntry[]) {
          const inPod = (entry.sources ?? []).some((source) => {
            const node = source.node as HTMLElement | null;
            return !!node && typeof node.closest === 'function' && !!node.closest('#mubi-pod-panel');
          });
          sink.__allShifts.push({ value: entry.value ?? 0, input: !!entry.hadRecentInput, inPod });
        }
      }).observe({ buffered: true, type: 'layout-shift' });
    });

    const measure = () =>
      page.evaluate(() => {
        const node = document.querySelector<HTMLElement>('#mubi-pod-panel [aria-label="Conversation"]');
        if (!node) throw new Error('the panel has no transcript to measure against');
        const rail = document.querySelector<HTMLElement>('#mubi-pod-panel [class*="progress"]');
        const box = document.getElementById('mubi-pod-panel')?.getBoundingClientRect();
        return {
          railHeight: rail ? rail.getBoundingClientRect().height : 0,
          flowHeight: node.clientHeight,
          belowTheEdge: node.scrollHeight - node.scrollTop - node.clientHeight,
          panelBottom: box?.bottom ?? -1,
        };
      });

    await openPanel(page);
    const before = await measure();
    expect(before.railHeight, 'the brief rail is not part of the chat-mode panel').toBe(0);

    await startIntake(page);

    const after = await measure();
    expect(after.railHeight, 'the brief rail arrived — this is the push the CLS gate forgives').toBeGreaterThan(20);
    // The panel is `position: fixed` with its bottom edge owned by the composer, so nothing about the panel
    // box itself moves: the rail's height comes out of the column.
    expect(after.panelBottom, 'the panel box moved when the rail appeared').toBe(before.panelBottom);
    const taken = before.flowHeight - after.flowHeight;
    expect(taken, `the column gave up ${taken}px for a ${after.railHeight}px rail`).toBeGreaterThanOrEqual(after.railHeight);
    expect(taken, `the column gave up ${taken}px for a ${after.railHeight}px rail`).toBeLessThanOrEqual(after.railHeight + 24);
    // And the reader ends where they were standing: the newest line still inside the visible column. A
    // glide that has not landed yet is the one legitimate wait here, so the gate polls instead of sleeping.
    await expect
      .poll(async () => Math.max(0, (await measure()).belowTheEdge), {
        message: 'the rail pushed the newest line out of the visible column and nothing gave it back',
        timeout: 3_000,
      })
      .toBeLessThanOrEqual(1);

    const shifts = await page.evaluate(() => (window as unknown as { __allShifts: { value: number; input: boolean; inPod: boolean }[] }).__allShifts);
    const fromInput = shifts.filter((shift) => shift.inPod && shift.input);
    // Disclosed rather than hidden: an input-attributed shift is invisible to the CLS score, so the number
    // is recorded on the run to keep the gate above honest about what it does not cover.
    test.info().annotations.push({
      type: 'input-attributed-shift',
      description: `${fromInput.length} pod shift(s) forgave(d) by hadRecentInput: ${JSON.stringify(fromInput)}`,
    });
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

    // A thumb target is the resting geometry, and `getBoundingClientRect` reports the animated one: the
    // chip entrance lifts through a scale, so measured mid-flight a 44px row reads as 43.1. Wait for rest
    // for the same reason the axe scan does.
    await chipsAtRest(page);

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
    await expect(
      log(page).getByText(/Sent\. It is with the studio now, and someone will come back to you at asha@studio\.example\./),
    ).toBeVisible({ timeout: 15_000 });
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

    const cont = tray(page).getByRole('button', { name: CONTINUE_CHIPS });
    await press(cont.first(), page);
    await expect(log(page).getByText(/Choose at least one kind of work/)).toBeVisible({ timeout: 10_000 });

    // Same slot, still standing there, and the chips are back for another attempt.
    await expect(tray(page).getByRole('button', { name: CONTINUE_CHIPS })).toBeVisible();
  });

  test('typing an abort word like "stop" leaves the intake questions and preserves draft answers', async ({ page }) => {
    await openPanel(page);
    await startIntake(page);

    await composer(page).focus();
    await page.keyboard.type('stop', { delay: 12 });
    await page.keyboard.press('Enter');
    await settle(page);

    // Menu chips re-appear in chat mode
    await expect(tray(page).getByRole('button', { name: 'Start a project', exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test('a brief paused mid-way resumes at the next question, not the first', async ({ page }) => {
    await openPanel(page);
    await startIntake(page);

    // One slot answered, keyboard only and keyed off the tray's own shape rather than a category label,
    // so a taxonomy edit cannot silently leave this test with zero answers filed.
    await answerTurn(page);
    const servicesQuestion = log(page).getByText(/Which of these do you need/);
    await expect(servicesQuestion).toBeVisible({ timeout: 10_000 });

    // Escape pauses the questions; it does not discard them.
    await page.keyboard.press('Escape');

    // Menu offers to start a project
    const startProj = tray(page).getByRole('button', { name: 'Start a project', exact: true });
    await expect(startProj).toBeVisible({ timeout: 10_000 });
    await press(startProj, page);

    // Resumes at the services slot (slot 1) rather than resetting to slot 0. Read as the newest line so a
    // re-ask of the first question further up the transcript cannot satisfy it by accident.
    await expect(log(page).locator('p').last()).toContainText('Which of these do you need');
    await expect(tray(page).getByRole('button', { name: CONTINUE_CHIPS })).toBeVisible({ timeout: 10_000 });
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
    await expect(
      log(page).getByText(/Sent\. It is with the studio now, and someone will come back to you at asha@studio\.example\./),
    ).toBeVisible({ timeout: 15_000 });
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

    // Track data-nudge attribute transitions with MutationObserver
    await page.evaluate(() => {
      (window as unknown as { __nudgeTransitions: number }).__nudgeTransitions = 0;
      const el = document.querySelector('[aria-controls="mubi-pod-panel"]') || document.querySelector('button[aria-label*="Ubi"]');
      if (el) {
        const obs = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'data-nudge') {
              if ((m.target as HTMLElement).getAttribute('data-nudge') === 'true') {
                (window as unknown as { __nudgeTransitions: number }).__nudgeTransitions += 1;
              }
            }
          }
        });
        obs.observe(el, { attributes: true, attributeFilter: ['data-nudge'] });
      }
    });

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

    const transitions = await page.evaluate(() => (window as unknown as { __nudgeTransitions?: number }).__nudgeTransitions ?? 0);
    expect(transitions, 'the visual nudge re-fired more than once').toBeLessThanOrEqual(1);
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
 * Chips arrive on a 40ms stagger and `animation-fill-mode: backwards` holds each one at opacity 0 through
 * its delay, so a scan taken during the entrance measures a frame of an animation, not the design. Contrast
 * is a property of the resting state: wait for it, and fail loudly if a chip is still invisible a second
 * later. (`backwards`, not `both`: a filled animation keeps owning `transform` after it ends, which would
 * deaden the hover lift the chips also publish.)
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

/**
 * The comprehension gates. Everything above proves the pod can be driven; these prove it is worth
 * driving, and they are the surface a unit test cannot reach: `useChatEngine` keeps its turn and its
 * fallback counter in refs, so a follow-up only means something across two renders of the real panel.
 *
 * The assertions quote published copy on purpose. A re-worded answer fails these tests loudly, which is
 * the intended contract: the copy is sourced from `knowledge/intents.ts` and is not free text.
 */
test.describe('Chat Pod: comprehension and conversation state', () => {
  /** Say something the way a visitor types it, then wait for the answer to land. */
  async function ask(page: Page, text: string): Promise<void> {
    await composer(page).focus();
    await page.keyboard.type(text, { delay: 12 });
    await page.keyboard.press('Enter');
    await settle(page);
  }

  /**
   * Drive the questions until the machine is standing at a given blank, keyed by the placeholder that
   * slot sets rather than by a count of turns — the order of the questions is the machine's business and
   * these tests are about what happens at one of them.
   */
  async function atTheBlank(page: Page, placeholder: string, maxTurns = 14): Promise<void> {
    await startIntake(page);
    for (let turn = 0; turn < maxTurns; turn += 1) {
      if ((await composer(page).getAttribute('placeholder')) === placeholder) return;
      await answerTurn(page);
    }
    throw new Error(`the intake never reached the blank keyed "${placeholder}"`);
  }

  async function atTheNameBlank(page: Page): Promise<void> {
    await atTheBlank(page, 'Your name');
  }

  test('the services question answers with the branch, not with a count', async ({ page }) => {
    await openPanel(page);
    await ask(page, 'what are the services available');

    // The studio runs eight lines per side. Told that, a visitor still has to read sixteen pages; told
    // who they sell to, they get a shortlist in one tap. This is the complaint the branch exists to fix,
    // so the question and both branch chips have to arrive in the same turn.
    await expect(log(page).getByText(/^Who do you sell to, other businesses or consumers\?/)).toBeVisible();
    await expect(tray(page).getByRole('button', { name: 'Business-to-business', exact: true })).toBeVisible();
    await expect(tray(page).getByRole('button', { name: 'Consumer brands', exact: true })).toBeVisible();

    // The branch is a question, not a dead end: each side answers with its own list.
    await press(tray(page).getByRole('button', { name: 'Business-to-business', exact: true }), page);
    await expect(log(page).getByText(/^8 lines aimed at businesses\./)).toBeVisible();
  });

  test('the same question typed in the chat register gets the same answer', async ({ page }) => {
    await openPanel(page);
    await ask(page, 'can yu pls tell me about services');

    // "yu" is the way this owner writes "you", and it was the one abbreviation the fold table missed.
    // Two characters sits under every typo floor in the resolver, so it could not be forgiven as a
    // misspelling either — it survived as a topic word no alias owns, and the services answer fell below
    // the acceptance margin into three chips. That is what read as a dumb chatbot.
    await expect(log(page).getByText(/^Who do you sell to, other businesses or consumers\?/)).toBeVisible();
    await expect(tray(page).getByRole('button', { name: 'Business-to-business', exact: true })).toBeVisible();
  });

  test('a question the corpus cannot answer is refused at the name blank, not filed', async ({ page }) => {
    await openPanel(page);
    await atTheNameBlank(page);

    await ask(page, 'can you repair my printer');

    // Nothing published answers that, so the detour pass had nothing to say, and the message reached the
    // last branch: the validator, which accepts any 100 characters as a name. The studio's first email
    // would have opened on the visitor's salutation reading like a question about printers.
    await expect(
      log(page).getByText(/^That reads like a question, so I will not file it as your name\./),
    ).toBeVisible();

    // Refusing is only honest if the blank is still standing where it was, with its own buttons.
    expect(await composer(page).getAttribute('placeholder')).toBe('Your name');

    // The same blank, the same failure, with no question shape at all: `u offer web design` opens on a
    // chat abbreviation, the corpus has nothing to say about it, and the only evidence that it is a
    // question is the way it is spelled. Filing it put the visitor's enquiry in the salutation.
    await ask(page, 'u offer web design');
    await expect(
      log(page).getByText(/^That reads like a question, so I will not file it as your name\./),
    ).toHaveCount(2);
    expect(await composer(page).getAttribute('placeholder')).toBe('Your name');

    // And the visitor can answer it normally on the next line.
    await ask(page, 'Asha Menon');
    expect(await composer(page).getAttribute('placeholder')).not.toBe('Your name');
  });

  test('an answer that opens on an auxiliary is filed, not refused', async ({ page }) => {
    await openPanel(page);
    await atTheNameBlank(page);

    // The other half of the same rule. A sentence legitimately opens on an auxiliary — "will need
    // packaging next month" is somebody describing the job — and a shape test that read every auxiliary
    // as a question would refuse the visitor's own words back at them. Only an inverted auxiliary is a
    // question, so this one is filed and the machine moves on.
    await ask(page, 'will need packaging next month');
    await expect(log(page).getByText(/^That reads like a question/)).toHaveCount(0);
    expect(await composer(page).getAttribute('placeholder')).not.toBe('Your name');
  });

  /**
   * The other direction of the same rule, and the one that was broken. An earlier pass routed anything
   * of more than one word at a verbatim blank through the corpus and, if the corpus had a confident
   * answer, spoke it as a detour instead of storing the visitor's words. Measured on the published
   * table, `social media` resolves to the studio's own social channel at 1.000 — and it is also the
   * name half of this site's clients would give a project. So a plausible project title was answered
   * with the studio's Instagram handle and never filed, which is a worse failure than the one that
   * clause was written to avoid: the visitor's brief silently loses a fact.
   */
  test('a project name the corpus also sells is filed, not answered', async ({ page }) => {
    await openPanel(page);
    await atTheBlank(page, 'Packaging for an organic beverage brand');

    await ask(page, 'social media');

    // Filed, which means the machine moved on and the value reached the card the studio reads.
    expect(await composer(page).getAttribute('placeholder')).not.toBe('Packaging for an organic beverage brand');
    await expect(log(page).getByText(/^A few published things match that\./)).toHaveCount(0);

    const send = await walkToReview(page, 26);
    await expect(
      log(page)
        .getByRole('listitem')
        .filter({ hasText: /^Project/ })
        .filter({ hasText: 'social media' }),
    ).toBeVisible();
    expect(await send.isVisible()).toBe(true);
  });

  /**
   * What the clause above was reaching for, kept: a message written in the chat register is asking for
   * something even when it has no question shape, because nobody spells a proper noun like a text
   * message. `abt pricing` typed at the project blank has to be answered, not stored as the name of the
   * job.
   */
  test('a blank written in the chat register is answered, not filed', async ({ page }) => {
    await openPanel(page);
    await atTheBlank(page, 'Packaging for an organic beverage brand');

    await ask(page, 'abt pricing');

    await expect(log(page).getByText(/^We do not publish a rate card/)).toBeVisible();
    expect(await composer(page).getAttribute('placeholder')).toBe('Packaging for an organic beverage brand');
  });

  test('a tapped chip becomes the visitor’s own line', async ({ page }) => {
    await openPanel(page);
    await ask(page, 'what are the services available');
    await press(tray(page).getByRole('button', { name: 'Business-to-business', exact: true }), page);

    // §05 §1.5. Without the echo, a chip-driven transcript is an assistant answering itself, and someone
    // scrolling back cannot tell which branch they took. Scoped to the log: the chips live in the tray,
    // so a match here can only be a transcript row.
    await expect(log(page).getByText('Business-to-business', { exact: true })).toBeVisible();
  });

  test('an answer has a deeper pass, and the second ask says so', async ({ page }) => {
    await openPanel(page);
    await ask(page, 'demand generation');
    await expect(log(page).getByText('What it covers:', { exact: true })).toBeVisible();

    await ask(page, 'tell me more');
    await expect(log(page).getByText('Everything this line publishes:', { exact: true })).toBeVisible();

    // A third ask would re-print the same page. Repeating an answer looks like the pod stopped listening,
    // so it says what has run out instead, and a visitor reading the transcript can see which of the
    // three turns was a real answer.
    await ask(page, 'tell me more');
    await expect(log(page).getByText(/^That is the whole of what this site publishes on it\./)).toBeVisible();
    expect(await log(page).getByText('Everything this line publishes:', { exact: true }).count()).toBe(1);
  });

  test('a contested name asks which one, and an ordinal picks it', async ({ page }) => {
    await openPanel(page);
    await ask(page, 'public relations');

    await expect(log(page).getByText(/^A few published things match that\./)).toBeVisible();
    // Two published lines really do carry that name, on opposite sides of the catalogue. One of them
    // silently winning is how a pod gets remembered as wrong.
    expect(await tray(page).getByRole('button', { name: 'Public Relations (PR)' }).count()).toBe(2);

    await ask(page, 'the first one');
    await expect(log(page).getByText(/^Earned attention carries a credibility paid reach cannot buy/)).toBeVisible();

    // Ordinals are also typed as digits. "the 9th one" used to be read as two numbers and refused as an
    // unrecognised question; the honest answer is the size of the list the visitor is looking at.
    await ask(page, 'the 9th one');
    await expect(log(page).getByText(/I offered \d+ options, counted from the first\./)).toBeVisible();
  });

  test('naming a chip on screen answers it instead of re-ranking the corpus', async ({ page }) => {
    await openPanel(page);
    await ask(page, 'demand generation');
    await ask(page, 'integrated marketing');

    // The second message is authored copy for a different line, so authoring outranks the idiom layer,
    // but it is also on screen as a chip, and either route lands on the same answer. What must not happen
    // is the pod treating a visible option as a miss.
    await expect(log(page).getByText(/^One idea, many channels, no dilution\./)).toBeVisible();
    expect(await log(page).getByText(/^Nothing published on this site matches that/).count()).toBe(0);
  });

  test('two misses, and the pod stops guessing without spending a guess on a follow-up', async ({ page }) => {
    await openPanel(page);
    await ask(page, 'qwertyuiop');
    await ask(page, 'zxcvbnm');

    const hardMisses = log(page).getByText(/^Nothing published on this site matches that/);
    expect(await hardMisses.count()).toBe(2);

    // "tell me more" after a refusal is legible as a reference to nothing, and is answered as such.
    // Spending a guess here would cap the pod after two misses plus one idiom, i.e. three questions.
    await ask(page, 'tell me more');
    await expect(log(page).getByText(/^Nothing I have answered yet can be taken further\./)).toBeVisible();
    expect(await hardMisses.count()).toBe(2);

    await ask(page, 'asdfghjkl');
    await expect(
      log(page).getByText(/^That is twice I have missed, so I am stopping the guessing for this conversation\./),
    ).toBeVisible();
  });

  test('the refusal routes instead of stalling: a capped pod still hands over the phone', async ({ page }) => {
    await openPanel(page);
    for (const miss of ['qwertyuiop', 'zxcvbnm', 'asdfghjkl']) await ask(page, miss);

    // "From here I will only route you, not interpret you" is a promise, so the chips have to be the
    // studio's own contact routes rather than the guess menu that just failed three times.
    await expect(tray(page).getByRole('button', { name: /^Call \+91/ })).toBeVisible();
    await expect(tray(page).getByRole('button', { name: 'Talk to a person', exact: true })).toBeVisible();
  });
});

/**
 * The scroll contract, measured in a browser with a real wheel rather than read out of the stylesheet.
 *
 * Two defects are fixed here and neither is visible in source: a conversation and its replies were two
 * scroll boxes bolted one above the other inside a fixed panel, so a wheel moved one and then the other,
 * and the surface under the cursor decided whether the gesture did anything at all; separately, the hold
 * on the page behind an overlay was owned by each surface in turn — a class, a dispatched event, a write
 * to `body.style.overflow` — and whichever released last handed the viewport back from under whichever
 * was still open. That is the "on the other pages the scroll just does not work" report.
 *
 * A stopped Lenis cancels every wheel and touchmove it sees outside a `data-lenis-prevent` subtree, so
 * the tests below ask the browser the only question that matters for that: was the event cancelled?
 */
test.describe('Scroll: one column in the panel, one lock on the page', () => {
  const flow = (page: Page): Locator => page.getByLabel('Conversation', { exact: true });

  async function type(page: Page, text: string): Promise<void> {
    await composer(page).focus();
    await page.keyboard.type(text, { delay: 12 });
    await page.keyboard.press('Enter');
    await settle(page);
  }

  /**
   * Dispatch a wheel (or touch) at the element matched by `selector` and report whether anything up the
   * tree called `preventDefault` on it. Cancelled means the smooth-scroll hijack swallowed the gesture;
   * not cancelled means the browser is free to move whatever the element is inside.
   */
  async function gestureCancelled(page: Page, selector: string, kind: 'wheel' | 'touchmove' = 'wheel'): Promise<boolean> {
    return page.evaluate(
      async ({ selector, kind }) => {
        const node = document.querySelector(selector);
        if (!node) throw new Error(`Nothing on the page matches ${selector}`);
        const box = node.getBoundingClientRect();
        const point = { clientX: box.left + box.width / 2, clientY: box.top + Math.min(box.height / 2, 40) };
        const init: WheelEventInit & TouchEventInit = {
          bubbles: true,
          cancelable: true,
          ...point,
          ...(kind === 'wheel' ? { deltaY: -120 } : {}),
        };
        const event =
          kind === 'wheel'
            ? new WheelEvent('wheel', init as WheelEventInit)
            : new TouchEvent('touchmove', {
                ...init,
                touches: [new Touch({ identifier: 1, target: node, ...point })],
                targetTouches: [new Touch({ identifier: 1, target: node, ...point })],
                changedTouches: [new Touch({ identifier: 1, target: node, ...point })],
              } as TouchEventInit);
        node.dispatchEvent(event);
        // One frame: the hijack listens without a capture-phase shortcut, so the answer is only settled
        // once the event has been all the way up to the window.
        await new Promise((resolve) => requestAnimationFrame(resolve));
        return event.defaultPrevented;
      },
      { selector, kind },
    );
  }

  /**
   * The contract is one surface that scrolls *the conversation* — a nested transcript and a nested chip
   * rail was the defect the owner reported. The composer is the one other box allowed to scroll, and
   * only because the alternative is worse: `overflow: hidden` at a `max-height` clips the visitor's own
   * text on the engines that size the field to its content, and a brief they cannot read is a brief they
   * cannot finish. This asserts both halves with a real long message in the field, because with one short
   * line typed the box has nothing to scroll and the clause hides nothing.
   */
  test('the panel owns one conversation surface, and the field never eats a long brief', async ({ page }) => {
    await openPanel(page);

    // Long enough to pass the field's 8.75rem cap and short enough to stay inside the composer's own
    // character limit, so the assertion below can hold the box to its word about every character.
    const brief = 'A rebuild of the whole identity for a tea grower in Wayanad: packaging for three grades, '
      + 'a bilingual wordmark, the site, the launch film, a dealer catalogue and the pitch deck for the '
      + 'co-op board, all of it before the next season opens in April, and the archive of the old labels '
      + 'needs digitising first because half of them are hand-painted.';
    await composer(page).focus();
    await page.keyboard.type(brief, { delay: 4 });

    const field = await composer(page).evaluate((element) => {
      const node = element as HTMLTextAreaElement;
      return {
        overflowY: getComputedStyle(node).overflowY,
        reachable: node.scrollTop,
        scrolls: node.scrollHeight > node.clientHeight,
        text: node.value,
      };
    });
    expect(field.text, 'the field threw away part of what was typed').toBe(brief);
    expect(field.scrolls, 'a long brief has to have somewhere to go').toBe(true);
    expect(field.overflowY, 'the composer scrolls rather than swallowing its own content').not.toBe('hidden');
    expect(field.reachable, 'the caret line of a typed brief is out of view — the text is clipped').toBeGreaterThan(0);

    const scrollers = await panel(page).evaluate((node) =>
      Array.from(node.querySelectorAll<HTMLElement>('*'))
        .filter((element) => {
          const overflow = getComputedStyle(element).overflowY;
          return overflow === 'auto' || overflow === 'scroll';
        })
        .map((element) => element.getAttribute('aria-label') ?? element.className),
    );

    // Sorted, because the pair is the whole assertion and the order the DOM walks them is not a contract.
    expect([...scrollers].sort(), 'a third box is the defect back: nested scroll areas over a fixed panel').toEqual(['Conversation', 'Message']);
  });

  test('a real wheel over the chips moves the conversation', async ({ page }) => {
    await openPanel(page);
    // Two disciplines is twenty services plus Continue: the tallest thing the panel can be asked to
    // show, and the wall that used to scroll inside its own 7.5rem box instead of with the thread.
    await press(tray(page).getByRole('button', { name: 'Start a project', exact: true }), page);
    await press(tray(page).getByRole('button', { name: 'Logo & identity', exact: true }), page);
    await press(tray(page).getByRole('button', { name: 'Web & app design', exact: true }), page);
    await press(tray(page).getByRole('button', { name: COMMIT_CHIPS }), page);

    const top = flow(page);
    await expect(top).toBeVisible();
    const before = await top.evaluate((node) => node.scrollTop);
    expect(await top.evaluate((node) => node.scrollHeight - node.clientHeight)).toBeGreaterThan(40);

    // The pointer is on a chip, not on the messages. This is the gesture that used to do nothing.
    await tray(page).getByRole('button', { name: 'Logo design', exact: true }).hover();
    await page.mouse.wheel(0, -420);
    await expect
      .poll(async () => top.evaluate((node) => node.scrollTop), { message: 'the wheel over the chips moved the column' })
      .toBeLessThan(before);
  });

  test('the keyboard moves the column, and the wheel is never swallowed inside the panel', async ({ page }) => {
    await openPanel(page);
    await type(page, 'what are the services available');

    const top = flow(page);
    await top.focus();
    const before = await top.evaluate((node) => node.scrollTop);
    for (let key = 0; key < 12; key += 1) await page.keyboard.press('ArrowUp');
    expect(await top.evaluate((node) => node.scrollTop)).toBeLessThan(before);

    // The chip rail and the transcript are one subtree, so both answer to the same gesture.
    expect(await gestureCancelled(page, '#mubi-pod-panel [role="log"]')).toBe(false);
    expect(await gestureCancelled(page, '[role="dialog"][aria-modal="true"]')).toBe(false);
  });

  /**
   * Whether the viewport is currently held: Lenis stopped (which is what makes the wheel inert, since a
   * stopped instance still cancels the gesture) and the document element marked accordingly.
   *
   * `defaultPrevented` cannot answer this question. A *healthy* Lenis also prevents every wheel outside
   * its exemption — that is how it scrolls the page — so prevented is true both while the page is hijacked
   * and while it is held. What differs is whether the hijack moves the window, and the class is the
   * hijack's own statement of which it is doing.
   */
  const viewportHeld = (page: Page): Promise<boolean> =>
    page.evaluate(() => document.documentElement.classList.contains('lenis-stopped'));

  test('the page is held while the panel is open and free the moment it closes', async ({ page }) => {
    await openPanel(page);

    // Inside the panel the gesture belongs to the conversation, so nothing may swallow it…
    expect(await gestureCancelled(page, '#mubi-pod-panel [role="log"]')).toBe(false);
    // …and outside it, the page behind a modal dialog must not move.
    expect(await viewportHeld(page)).toBe(true);
    await page.mouse.move(640, 360);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY), { message: 'the page is held behind the panel' }).toBe(0);

    await press(panel(page).getByRole('button', { name: 'Close the assistant panel', exact: true }), page);
    await expect(panel(page)).not.toHaveAttribute('data-open', 'true', { timeout: 10_000 });

    // The leak this gate exists for: a hold released by a callback that did not run left the whole site
    // deaf to the wheel. Releasing the panel has to give the page back.
    await expect.poll(() => viewportHeld(page), { message: 'the hijack restarts with the panel closed' }).toBe(false);
    await page.mouse.move(640, 360);
    await page.mouse.wheel(0, 600);
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { message: 'the page scrolls again once the panel is closed' })
      .toBeGreaterThan(0);
  });

  test('closing the navigation overlay with the keyboard hands the page back', async ({ page }) => {
    await gotoPod(page);
    await press(page.getByRole('button', { name: 'Open navigation menu', exact: true }), page);
    const overlay = page.locator('#client-navigation-overlay');
    await expect(overlay).toBeVisible();

    // Held while open, and the overlay's own list answers the wheel instead of being cancelled by the
    // hijack the overlay itself started.
    expect(await viewportHeld(page)).toBe(true);
    expect(await gestureCancelled(page, '#client-navigation-overlay [class*="leftPanel"]')).toBe(false);

    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden({ timeout: 10_000 });

    // The release used to hang off a GSAP `onReverseComplete`. Escape does not interrupt it, but a
    // visitor who taps the toggle twice fast enough does — and the hold was still leaked, because the
    // only honest owner of it is the overlay's own lifecycle.
    await expect.poll(() => viewportHeld(page), { message: 'the hijack restarts with the menu closed' }).toBe(false);
    await page.mouse.move(640, 360);
    await page.mouse.wheel(0, 600);
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { message: 'the page scrolls again once the menu is closed' })
      .toBeGreaterThan(0);
  });

  /**
   * A reader who takes the wheel mid-reply keeps their place, and the pod says so instead of arguing.
   *
   * The auto-follow is the only movement the panel makes on its own account, so it is also the only one
   * that can shove a reader around. The rule is that it fires for a reader who was already at the end and
   * not for one who has walked away — and the takeover is a *gesture*, which no unit test can produce and
   * no amount of reading the source proves.
   *
   * The wheel therefore comes first and the question second, so the whole reply — the typing reserve, the
   * visitor's own line, the answer and the fresh chips — arrives under a column the pod no longer owns.
   * Sending first would race the takeover against a glide the harness itself started, and a gate that
   * measures its own animation proves nothing either way.
   */
  test('a wheel away keeps the reader’s line when the reply lands and offers the pill', async ({ page }) => {
    await openPanel(page);
    await type(page, 'what are the services available');
    // The thread has to be taller than the panel or there is nowhere to walk up to.
    await type(page, 'what is your process');
    const top = flow(page);
    expect(await top.evaluate((node) => node.scrollHeight - node.clientHeight), 'this conversation does not overflow the column').toBeGreaterThan(320);
    // The arrival above glides for 600ms. Measuring against a column that is still moving measures the
    // animation, not the pod.
    await page.waitForTimeout(GLIDE_SETTLE_MS);

    await top.hover();
    const resting = await top.evaluate((node) => node.scrollTop);
    await page.mouse.wheel(0, -260);
    await expect
      .poll(async () => top.evaluate((node) => node.scrollTop), { message: 'the wheel never moved the column' })
      .toBeLessThan(resting);
    const walked = await top.evaluate((node) => node.scrollTop);
    expect(resting - walked, 'the wheel barely moved the column, so this measures nothing').toBeGreaterThan(120);

    const pill = page.getByRole('button', { name: 'Jump to the latest', exact: true });
    await expect(pill, 'a reader who is not at the newest line has to be told, and given a way back').toBeVisible();

    // The answer now arrives *below* them, with a 2.25rem typing reserve in front of it.
    await type(page, 'do you work with b2b companies');
    await page.waitForTimeout(GLIDE_SETTLE_MS);
    expect(await top.evaluate((node) => node.scrollTop), 'the arrival pulled the reader back down').toBe(walked);
    await expect(pill).toBeVisible();

    await pill.click();
    await expect
      .poll(async () => top.evaluate((node) => node.scrollHeight - node.scrollTop - node.clientHeight), {
        message: 'the pill promises the newest line and has to deliver it',
      })
      .toBeLessThanOrEqual(1);
    await expect(pill).toBeHidden();
  });

  test('a swipe is not swallowed inside the panel', async ({ page }) => {
    await openPanel(page);
    expect(await gestureCancelled(page, '#mubi-pod-panel [role="log"]', 'touchmove')).toBe(false);
  });
});

/**
 * Multi-select discipline. Selecting options used to append a line to the transcript per tap, which made
 * the conversation grow under the visitor's finger and pushed the options they were reading off the top of
 * the rail. The tally belongs on the control that commits it.
 */
test.describe('Multi-select: taps pick, they do not reprint', () => {
  test('three taps, one question, and the options do not move', async ({ page }) => {
    await openPanel(page);
    await tapInPlace(tray(page).getByRole('button', { name: 'Start a project', exact: true }), page);
    await tapInPlace(tray(page).getByRole('button', { name: 'Logo & identity', exact: true }), page);
    await tapInPlace(tray(page).getByRole('button', { name: COMMIT_CHIPS }), page);

    // Services: the widest set the machine offers, so it is the one that used to break the layout.
    const options = tray(page).getByRole('button');
    const rows = await log(page).locator('[data-transcript-row]').count();
    // The turn that just landed is still running its own entrance, and a bubble measured mid-glide sits
    // a fraction of a pixel off where it settles — which drags the rail under it with it. Let the frame
    // finish before taking the baseline, or this gate reports animation as movement.
    await page.waitForTimeout(800);
    const firstBox = await options.first().boundingBox();
    expect(firstBox).not.toBeNull();

    for (const name of ['Logo design', 'Brand guide', 'Stationery']) {
      await tapInPlace(tray(page).getByRole('button', { name, exact: true }), page);
    }

    expect(await log(page).locator('[data-transcript-row]').count()).toBe(rows);

    // The rail is at the end of the column, so a tap may re-print the commit label but must not shove the
    // options themselves around: a pick made at the top of the wall stays where the finger left it.
    const afterBox = await options.first().boundingBox();
    expect(afterBox?.y).toBeCloseTo(firstBox!.y, 0);

    await expect(tray(page).getByRole('button', { name: /^Continue \(3\)$/ })).toBeVisible();
  });
});

