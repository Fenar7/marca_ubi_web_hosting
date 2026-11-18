import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Converted-value chart and numeric display contracts', () => {
  const root = process.cwd();
  const chartPath = path.join(root, 'src/app/admin/components/Dashboard/RevenueDynamicsCard.tsx');
  const chart = fs.readFileSync(chartPath, 'utf8');
  const styles = fs.readFileSync(path.join(root, 'src/app/admin/components/Dashboard/RevenueDynamicsCard.module.scss'), 'utf8');
  const tokens = fs.readFileSync(path.join(root, 'src/app/admin/styles/tokens.scss'), 'utf8');

  it('uses a monotone curve for recorded values without fabricating quota data', () => {
    assert.ok(chart.includes('generateMonotoneBezierPath'));
    assert.ok(chart.includes('Math.hypot(alpha, beta)'));
    assert.ok(chart.includes('cashSpline'));
    assert.ok(!chart.includes('quotaSpline'));
    assert.ok(chart.includes('formatCrmCurrency'));
  });

  it('supports keyboard point inspection and reports query failure separately from no conversions', () => {
    assert.ok(chart.includes('tabIndex={0}'));
    assert.ok(chart.includes('handleChartKeyDown'));
    assert.ok(chart.includes('ArrowRight'));
    assert.ok(chart.includes('role="status"'));
    assert.ok(chart.includes('dataStatus === "unavailable"'));
    assert.ok(chart.includes('conversionCount === 0'));
    assert.ok(chart.includes('no value is available to chart'));
  });

  it('uses tabular figures and the shared Circular-first numeric font token', () => {
    assert.ok(styles.includes('font-variant-numeric: tabular-nums'));
    assert.ok(styles.includes('var(--font-admin-numeric'));
    assert.match(tokens, /--font-admin-numeric:\s*var\(--font-circular\)/);
    assert.ok(styles.includes('@media (max-width: 520px)'));
  });

  it('keeps the chart gradient identifier valid and the tooltip legible', () => {
    assert.ok(chart.includes('.replace(/[^a-zA-Z0-9_-]/g'));
    assert.ok(chart.includes('rdc-area-grad-'));
    assert.ok(chart.includes('Math.max(10, Math.min(90, rawLeftPercent))'));
    assert.ok(styles.includes('.obsidianTooltip'));
    assert.ok(styles.includes('border-radius'));
    assert.ok(!styles.includes('#2563eb'));
  });
});
