import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  computeSplinePointsForCadence,
  computeSpendingBreakdownForCadence,
  CARD_TIMEFRAME_OPTIONS,
} from '@/app/admin/lib/timeframeUtils';

describe('Overview Charts & Telemetry Redesign Delivery Gate Tests', () => {
  const root = process.cwd();

  const splineCardPath = path.join(root, 'src/app/admin/components/Dashboard/EarningOverviewSplineCard.tsx');
  const splineCardStylesPath = path.join(root, 'src/app/admin/components/Dashboard/EarningOverviewSplineCard.module.scss');
  const spendingCardPath = path.join(root, 'src/app/admin/components/Dashboard/SpendingOverviewBarCard.tsx');
  const spendingCardStylesPath = path.join(root, 'src/app/admin/components/Dashboard/SpendingOverviewBarCard.module.scss');
  const velocityChartPath = path.join(root, 'src/app/admin/components/Dashboard/CommercialVelocityBarChart.tsx');
  const velocityChartStylesPath = path.join(root, 'src/app/admin/components/Dashboard/CommercialVelocityBarChart.module.scss');

  const splineSource = fs.readFileSync(splineCardPath, 'utf8');
  const splineStyles = fs.readFileSync(splineCardStylesPath, 'utf8');
  const spendingSource = fs.readFileSync(spendingCardPath, 'utf8');
  const spendingStyles = fs.readFileSync(spendingCardStylesPath, 'utf8');
  const velocitySource = fs.readFileSync(velocityChartPath, 'utf8');
  const velocityStyles = fs.readFileSync(velocityChartStylesPath, 'utf8');

  it('Gate 1: EarningOverviewSplineCard - Marca Ubi Vibrant Orange palette and exact coordinate alignment', () => {
    assert.ok(!splineSource.includes('#2563eb'), 'Source must forbid generic blue #2563eb');
    assert.ok(splineSource.includes('#f97316'), 'Source must use Marca Ubi Vibrant Orange #f97316');
    assert.ok(splineStyles.includes('rgba(249, 115, 22'), 'Styles must use rgba(249, 115, 22) tooltip border');

    // Exact coordinate stem alignment (35/500 = 7.0%)
    assert.ok(
      splineStyles.includes('padding: 0 calc(35 / 500 * 100%)'),
      'Must use exact 7.0% horizontal padding matching SVG paddingX'
    );

    // 20px clearance at bottom to prevent clipping
    assert.ok(splineStyles.includes('padding: 24px 26px 20px'), 'Card padding must include 20px bottom clearance');

    // 44px min-touch target
    assert.ok(splineStyles.includes('min-height: 44px'), 'Buttons must include 44px touch envelope');

    // Coordinate clamping
    assert.ok(
      splineSource.includes('Math.min(activeIndex, Math.max(0, points.length - 1))'),
      'Must clamp activeIndex to prevent runtime crashes'
    );
  });

  it('Gate 2: EarningOverviewSplineCard - Interactive accessible dropdown popover', () => {
    assert.ok(splineSource.includes('role="listbox"'));
    assert.ok(splineSource.includes('role="option"'));
    assert.ok(splineSource.includes('aria-selected='));
    assert.ok(splineSource.includes('aria-expanded='));
    assert.ok(splineSource.includes('Escape'));
    assert.ok(splineSource.includes('<polyline points="6 9 12 15 18 9" />'), 'Dropdown must use SVG chevron');
    assert.ok(!splineSource.includes('⌄'), 'Must not use raw unicode chevron character');
    assert.ok(splineStyles.includes('min-width: 116px'), 'Trigger must have invariant 116px min-width');
    assert.ok(splineStyles.includes('.dropdownMenu'));
    assert.ok(splineStyles.includes('width: 12px'), 'Chevron icon must be 12px width');
  });

  it('Gate 3: SpendingOverviewBarCard - Marca Ubi multi-color luxury palette and dynamic gradient bar', () => {
    assert.ok(!spendingSource.includes('#2563eb'), 'Source must forbid generic blue #2563eb');
    assert.ok(spendingSource.includes('#f97316') && spendingSource.includes('#ea002a'), 'Source must use multi-color orange & crimson palette');
    assert.ok(spendingSource.includes('#cbd5e1'), 'Source must include neutral remainder segment #cbd5e1');

    // Accessible dropdown listbox
    assert.ok(spendingSource.includes('role="listbox"'));
    assert.ok(spendingSource.includes('role="option"'));
    assert.ok(spendingSource.includes('aria-selected='));
    assert.ok(spendingSource.includes('aria-expanded='));
    assert.ok(spendingSource.includes('<polyline points="6 9 12 15 18 9" />'), 'Dropdown must use SVG chevron');
    assert.ok(!spendingSource.includes('⌄'), 'Must not use raw unicode chevron character');
    assert.ok(spendingStyles.includes('min-width: 116px'));
    assert.ok(spendingStyles.includes('min-height: 44px'));
    assert.ok(spendingStyles.includes('width: 12px'), 'Chevron icon must be 12px width');

    // Animated continuous bar
    assert.ok(spendingStyles.includes('transition: width 0.35s'));
  });

  it('Gate 4: CommercialVelocityBarChart - Editorial Luxury layout, real period scope, full en-IN formatting & accessibility', () => {
    assert.ok(!velocitySource.includes('Net Delta'), 'Must not include fabricated Net Delta subtraction');
    assert.ok(!velocitySource.includes('toFixed(1)}Cr') && !velocitySource.includes('toFixed(0)}L'), 'Must never abbreviate Crore/Lakh');
    assert.ok(!velocitySource.includes('W1'), 'Must not fabricate W1..W8 placeholder buckets');
    assert.ok(velocitySource.includes('formatCrmCurrency'), 'Must use full en-IN currency formatting');
    assert.ok(velocitySource.includes('aria-pressed'), 'Perspective toggles must expose aria-pressed');
    assert.ok(velocitySource.includes('role="listbox"') && velocitySource.includes('Escape'), 'Dropdown must expose accessible listbox with Escape handling');
    assert.ok(velocitySource.includes('<details'), 'Must provide collapsible interval breakdown table for screen-reader & zoom parity');
    assert.ok(velocityStyles.includes('min-height: 44px'), 'Interactive controls must meet 44px minimum touch height');
    assert.ok(velocityStyles.includes('#9c001e'), 'Focus ring must use accessible #9c001e token');
  });

  it('Gate 5: Timeframe harmonic math models and option catalog', () => {
    assert.equal(CARD_TIMEFRAME_OPTIONS.length, 4);

    const cadences = ['this_week', 'this_month', 'this_quarter', 'this_year'] as const;

    for (const cadence of cadences) {
      const spline = computeSplinePointsForCadence(cadence, 6540000);
      assert.ok(Array.isArray(spline.points) && spline.points.length === 0, `${cadence} must never fabricate fake spline points without database events`);
      assert.ok(spline.totalValue >= 0, `${cadence} totalValue must be >= 0`);
      assert.ok(Number.isFinite(spline.growthPercentage), `${cadence} growthPercentage must be finite`);

      for (const pt of spline.points) {
        assert.ok(pt.month.length > 0, 'Point month must not be empty');
        assert.ok(Number.isFinite(pt.value) && pt.value >= 0, 'Point value must be finite and non-negative');
      }

      const spending = computeSpendingBreakdownForCadence(cadence, 6540000, 39);
      assert.equal(spending.totalValue, 6540000, `${cadence} must never apply synthetic multipliers`);
      assert.equal(spending.dealCount, 39);
      assert.ok(spending.categories.length >= 1);

      const categorySum = spending.categories.reduce((s, c) => s + c.value, 0);
      assert.equal(categorySum, spending.totalValue, `${cadence} categories must sum to totalValue`);
    }
  });
});
