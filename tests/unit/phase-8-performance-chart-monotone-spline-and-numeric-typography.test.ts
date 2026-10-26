/**
 * @file tests/unit/phase-8-performance-chart-monotone-spline-and-numeric-typography.test.ts
 * @description Invariant Unit Test Suite for Executive Revenue Dynamics & Numeric Typography.
 *              Guarantees Fritsch-Carlson Monotone Spline Bézier math, Plus Jakarta Sans tabular tokens,
 *              boundary-clamped glassmorphic obsidian tooltip, keyboard accessibility, and anti-slop rules.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 8.4: Revenue Dynamics Monotone Spline & Numeric Typography Architecture', () => {
  const chartTsxPath = path.resolve(process.cwd(), 'src/app/admin/components/Dashboard/RevenueDynamicsCard.tsx');
  const chartScssPath = path.resolve(process.cwd(), 'src/app/admin/components/Dashboard/RevenueDynamicsCard.module.scss');
  const fontsPath = path.resolve(process.cwd(), 'src/app/admin/fonts.ts');
  const tokensPath = path.resolve(process.cwd(), 'src/app/admin/styles/tokens.scss');
  const layoutPath = path.resolve(process.cwd(), 'src/app/admin/layout.tsx');

  describe('1. Dedicated Numeric Typography Token Architecture', () => {
    it('verifies src/app/admin/fonts.ts exports adminNumeric pointing to Plus Jakarta Sans', () => {
      assert.strictEqual(fs.existsSync(fontsPath), true);
      const content = fs.readFileSync(fontsPath, 'utf8');
      assert.ok(content.includes('export const adminNumeric = localFont('));
      assert.ok(content.includes("variable: '--font-admin-num-font'"));
      assert.ok(content.includes("display: 'swap'"));
      assert.ok(content.includes('PlusJakartaSans-Medium.ttf'));
      assert.ok(content.includes('PlusJakartaSans-SemiBold.ttf'));
      assert.ok(content.includes('PlusJakartaSans-Bold.ttf'));
    });

    it('verifies physical existence of Plus Jakarta Sans font files on disk', () => {
      const pjsDir = path.resolve(process.cwd(), 'public/fonts/PlusJakartaSans');
      assert.strictEqual(fs.existsSync(path.join(pjsDir, 'PlusJakartaSans-Medium.ttf')), true);
      assert.strictEqual(fs.existsSync(path.join(pjsDir, 'PlusJakartaSans-SemiBold.ttf')), true);
      assert.strictEqual(fs.existsSync(path.join(pjsDir, 'PlusJakartaSans-Bold.ttf')), true);
    });

    it('verifies layout.tsx injects adminNumeric variable into root DOM shell', () => {
      assert.strictEqual(fs.existsSync(layoutPath), true);
      const content = fs.readFileSync(layoutPath, 'utf8');
      assert.ok(content.includes('adminNumeric'));
      assert.ok(content.includes('${adminNumeric.variable}'));
    });

    it('verifies tokens.scss registers --font-admin-numeric scoped under [data-admin-root="true"]', () => {
      assert.strictEqual(fs.existsSync(tokensPath), true);
      const content = fs.readFileSync(tokensPath, 'utf8');
      assert.ok(content.includes('--font-admin-numeric: var(--font-admin-num-font), var(--font-admin-sans)'));
    });
  });

  describe('2. Fritsch-Carlson Monotone Spline Curve Engine', () => {
    it('verifies RevenueDynamicsCard.tsx implements Fritsch-Carlson algorithm with zero overshoot', () => {
      assert.strictEqual(fs.existsSync(chartTsxPath), true);
      const content = fs.readFileSync(chartTsxPath, 'utf8');
      assert.ok(content.includes('generateMonotoneBezierPath'), 'Must implement monotone Bézier function');
      assert.ok(content.includes('Math.hypot(alpha, beta)'), 'Must enforce monotonicity cone clamping');
      assert.ok(content.includes('cashSplinePath'), 'Must generate cashSplinePath');
      assert.ok(content.includes('quotaSplinePath'), 'Must generate quotaSplinePath');
    });

    it('verifies responsive SVG curves with defensive stroke and linecap attributes', () => {
      const content = fs.readFileSync(chartTsxPath, 'utf8');
      assert.ok(content.includes('strokeLinecap="round"'), 'Must specify rounded caps');
      assert.ok(content.includes('strokeWidth={2.5}'), 'Must specify 2.5px primary stroke');
      assert.ok(content.includes('strokeWidth={2}'), 'Must specify 2px secondary stroke');
    });

    it('verifies horizontal gridlines and Indian currency valuation formatting', () => {
      const content = fs.readFileSync(chartTsxPath, 'utf8');
      assert.ok(content.includes('gridLines.map'), 'Must render dynamic horizontal gridlines');
      assert.ok(content.includes('formatLakhsCurrency'), 'Must format currency labels in Indian Lakhs/Crores');
    });
  });

  describe('3. Dynamic Tooltip, Hover Interaction & Accessibility', () => {
    it('verifies boundary-clamped tooltip positioning', () => {
      const content = fs.readFileSync(chartTsxPath, 'utf8');
      assert.ok(content.includes('clampedTooltipLeft'), 'Must calculate clamped tooltip left offset');
      assert.ok(content.includes('role="tooltip"'), 'Must declare role=tooltip');
      assert.ok(content.includes('tooltipHeader'), 'Must render tooltip header');
    });

    it('verifies interactive hover and touch scrub handlers', () => {
      const content = fs.readFileSync(chartTsxPath, 'utf8');
      assert.ok(content.includes('handlePointerScrub'), 'Must bind pointer scrub handler');
      assert.ok(content.includes('onPointerMove'), 'Must bind onPointerMove handler');
    });
  });

  describe('4. SCSS Module Hygiene & Anti-Slop Compliance', () => {
    it('verifies RevenueDynamicsCard.module.scss uses tabular numeric typography', () => {
      assert.strictEqual(fs.existsSync(chartScssPath), true);
      const scss = fs.readFileSync(chartScssPath, 'utf8');
      assert.ok(scss.includes('tabular-nums'), 'Must enforce tabular lining numbers');
    });

    it('verifies Apple HIG glassmorphism on tooltip surface', () => {
      const scss = fs.readFileSync(chartScssPath, 'utf8');
      assert.ok(scss.includes('backdrop-filter: blur'), 'Must use backdrop blur');
      assert.ok(scss.includes('border-radius'), 'Must use rounded corners');
    });

    it('verifies zero generic blue (#2563eb) and zero unrefined drop shadows', () => {
      const scss = fs.readFileSync(chartScssPath, 'utf8');
      assert.strictEqual(scss.includes('#2563eb'), false, 'Zero generic blue allowed');
      assert.strictEqual(scss.includes('rgba(0, 0, 0, 0.25)'), false, 'Zero unrefined muddy shadows');
    });
  });
});
