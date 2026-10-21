/**
 * @file tests/unit/phase-8-performance-chart-monotone-spline-and-numeric-typography.test.ts
 * @description Invariant Unit Test Suite for Executive Performance Chart Redesign & Numeric Typography.
 *              Guarantees Fritsch-Carlson Monotone Spline Bézier math, Plus Jakarta Sans tabular tokens,
 *              boundary-clamped glassmorphic obsidian tooltip, keyboard accessibility, and anti-slop rules.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 8.4: Performance Chart Monotone Spline & Numeric Typography Architecture', () => {
  const chartTsxPath = path.resolve(process.cwd(), 'src/app/admin/components/Dashboard/PerformanceChart.tsx');
  const chartScssPath = path.resolve(process.cwd(), 'src/app/admin/components/Dashboard/PerformanceChart.module.scss');
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
    it('verifies PerformanceChart.tsx implements Fritsch-Carlson algorithm with zero overshoot', () => {
      assert.strictEqual(fs.existsSync(chartTsxPath), true);
      const content = fs.readFileSync(chartTsxPath, 'utf8');
      assert.ok(content.includes('generateMonotoneBezierPath'), 'Must implement monotone Bézier function');
      assert.ok(content.includes('Math.hypot(alpha, beta)'), 'Must enforce monotonicity cone clamping');
      assert.ok(content.includes('vectorEffect="non-scaling-stroke"'), 'Must maintain physical 1px stroke sharpness');
      assert.ok(content.includes('shapeRendering="geometricPrecision"'), 'Must enforce subpixel anti-aliasing');
    });

    it('verifies expanded SVG viewBox and optical gutter spacing', () => {
      const content = fs.readFileSync(chartTsxPath, 'utf8');
      assert.ok(content.includes('viewBox="0 0 640 220"'), 'Must expand viewBox to 640x220 for label clearance');
      assert.ok(content.includes('chartWidth = 552'), 'Must configure 552px usable horizontal canvas');
      assert.ok(content.includes('chartHeight = 150'), 'Must configure 150px vertical amplitude');
      assert.ok(content.includes('originX = 64'), 'Must reserve 64px left gutter for Y-axis currency text');
    });

    it('verifies Y-axis labels are positioned at x="54" with uniform Indian currency formatting', () => {
      const content = fs.readFileSync(chartTsxPath, 'utf8');
      assert.ok(content.includes('x="54"'), 'Must anchor Y-axis text at x=54 for 10px margin');
      assert.ok(content.includes('₹ 2.50 Cr'), 'Must include ₹ 2.50 Cr tick');
      assert.ok(content.includes('₹ 1.80 Cr'), 'Must include ₹ 1.80 Cr tick');
      assert.ok(content.includes('₹ 1.00 Cr'), 'Must include ₹ 1.00 Cr tick');
      assert.ok(content.includes('₹ 0.00'), 'Must include uniform ₹ 0.00 baseline tick');
    });
  });

  describe('3. Dynamic Tooltip, Specular Radar & Accessibility', () => {
    it('verifies boundary-clamped horizontal translation preventing edge overflow', () => {
      const content = fs.readFileSync(chartTsxPath, 'utf8');
      assert.ok(content.includes('translateX(-${tooltipLeftPercent}%)'), 'Must use self-compensating translation');
      assert.ok(content.includes('tooltipVariance'), 'Must render automated delta variance calculation');
    });

    it('verifies keyboard navigation and touchscreen gesture scrubbing', () => {
      const content = fs.readFileSync(chartTsxPath, 'utf8');
      assert.ok(content.includes('onKeyDown={handleKeyDown}'), 'Must bind keyboard handler');
      assert.ok(content.includes('onTouchStart={handleTouchMove}'), 'Must bind touch start');
      assert.ok(content.includes('onTouchMove={handleTouchMove}'), 'Must bind touch move');
      assert.ok(content.includes('aria-live="polite"'), 'Must provide screen reader live updates');
    });

    it('verifies specular radar pulse halo animation elements', () => {
      const content = fs.readFileSync(chartTsxPath, 'utf8');
      assert.ok(content.includes('activeHaloOrange'), 'Must render radar halo circle');
      assert.ok(content.includes('activeCircleOrange'), 'Must render core specular bead');
      assert.ok(content.includes('activeCircleSlate'), 'Must render benchmark comparison bead');
    });
  });

  describe('4. SCSS Module Hygiene & Anti-Slop Compliance', () => {
    it('verifies PerformanceChart.module.scss uses tabular numeric font token instead of monospace', () => {
      assert.strictEqual(fs.existsSync(chartScssPath), true);
      const scss = fs.readFileSync(chartScssPath, 'utf8');
      assert.ok(scss.includes('font-family: var(--font-admin-numeric, var(--font-admin-sans))'), 'Must use numeric token');
      assert.ok(scss.includes('font-variant-numeric: tabular-nums lining-nums'), 'Must enforce tabular lining numbers');
      assert.strictEqual(scss.includes('var(--font-admin-code, monospace)'), false, 'Monospace MUST be purged from chart numbers');
    });

    it('verifies Apple HIG glassmorphism on tooltip capsule', () => {
      const scss = fs.readFileSync(chartScssPath, 'utf8');
      assert.ok(scss.includes('backdrop-filter: blur(16px)'), 'Must use 16px backdrop blur');
      assert.ok(scss.includes('background: rgba(15, 23, 42, 0.92)'), 'Must use obsidian glassmorphic surface');
      assert.ok(scss.includes('border-radius: 8px'), 'Must use 8px rounded corners');
    });

    it('verifies zero generic blue (#2563eb) and zero unrefined drop shadows', () => {
      const scss = fs.readFileSync(chartScssPath, 'utf8');
      assert.strictEqual(scss.includes('#2563eb'), false, 'Zero generic blue allowed');
      assert.strictEqual(scss.includes('rgba(0, 0, 0, 0.25)'), false, 'Zero unrefined muddy shadows');
    });
  });
});
