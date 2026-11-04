/**
 * @file playwright.chatpod.config.ts
 * @description Runner for the Chat Pod gates. It exists separately from the root `playwright.config.ts`
 *              for three reasons that cannot be expressed in one shared config:
 *
 *              1. Port. `npm run dev` binds 3003 and the root config's `webServer` health-checks 3000,
 *                 so the root config cannot bring this site up. Here the server is an input, never a
 *                 child: bring `npm run dev` up first, and this config attaches to it.
 *              2. Time. The idle-nudge gates have to sit through a 20s idle timer, which is longer than
 *                 the root config's 30s per-test ceiling and its 5s expect default.
 *              3. Matrix. The root config fans out over five projects including Firefox, which does not
 *                 emulate a coarse pointer, and the touch-target gate is a pointer-media assertion.
 *
 *              Single worker on purpose: the submission gates count intercepted POSTs, and two workers
 *              compiling the same route at once is how a measurement stops being one.
 *
 *              Usage: `npx playwright test --config=tests/playwright.chatpod.config.ts`
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // This runner is for the pod gates only; the other specs in `e2e/` belong to the root config.
  testMatch: /chatpod\.spec\.ts/,
  timeout: 120 * 1000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    // An isolated worktree can test its own server without rebinding the owner's development port.
    baseURL: process.env.CHAT_POD_BASE_URL ?? 'http://127.0.0.1:3003',
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
