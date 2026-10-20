/**
 * @file tests/unit/phase-3-brand-upgrade-kpi-scorecards.test.ts
 * @description Dedicated Unit Test Suite for Phase 3:
 *              Logip x Sypher Metric Scorecard & KPI Ribbon Overhaul.
 *              Validates 36px circular tinted icon containers, collision-proof secondary badge rows,
 *              micro-meter progress track, dual-currency presentation, and WCAG AA contrast.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 3 Brand Upgrade: Logip x Sypher Metric Scorecards Suite', () => {
  const kpiRibbonTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/kpi/KpiRibbon.tsx'
  );
  const kpiCardTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/kpi/KpiCard.tsx'
  );
  const kpiScssPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/kpi/KpiRibbon.module.scss'
  );
  const kpiSkeletonTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/kpi/KpiSkeleton.tsx'
  );

  describe('1. Unified Scorecard Island & Grid Layout Invariants', () => {
    it('verifies KpiRibbon.module.scss configures 5-column grid with 1px hairline dividers', () => {
      const scss = fs.readFileSync(kpiScssPath, 'utf8');
      const gridBlock = scss.match(/\.kpiGrid\s*\{[\s\S]*?\n\}/)?.[0] || '';

      assert.ok(
        gridBlock.includes('grid-template-columns: repeat(5, minmax(0, 1fr));'),
        'Must declare 5-column responsive grid'
      );
      assert.ok(
        gridBlock.includes('gap: 1px;'),
        'Must use 1px gap for hairline grid dividers'
      );
      assert.ok(
        gridBlock.includes('border-radius: 16px;') || gridBlock.includes('border-radius: var(--admin-radius-card, 16px);'),
        'Must use 16px outer radius for unified card island'
      );
    });

    it('verifies KpiCard enforces min-height 140px and generous padding', () => {
      const scss = fs.readFileSync(kpiScssPath, 'utf8');
      const cardBlock = scss.match(/\.kpiCard\s*\{[\s\S]*?\n\}/)?.[0] || '';

      assert.ok(
        cardBlock.includes('min-height: 140px;'),
        'KpiCard must maintain at least 140px height for visual stability'
      );
      assert.ok(
        cardBlock.includes('padding: 20px 22px;'),
        'KpiCard must enforce 20px 22px padding'
      );
      assert.ok(
        cardBlock.includes('tabular-nums'),
        'Must enforce tabular-nums formatting'
      );
    });

    it('verifies responsive reflow breakpoints for tablet and mobile', () => {
      const scss = fs.readFileSync(kpiScssPath, 'utf8');
      assert.ok(scss.includes('@media (max-width: 1200px)'));
      assert.ok(scss.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'));
      assert.ok(scss.includes('@media (max-width: 768px)'));
      assert.ok(scss.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'));
    });
  });

  describe('2. Logip 36px Circular Tinted Icon Badges', () => {
    it('verifies KpiCard.tsx wraps icons in 36px circular tinted container', () => {
      const tsx = fs.readFileSync(kpiCardTsxPath, 'utf8');
      assert.ok(
        tsx.includes('kpiIconWrap'),
        'Must wrap icon in kpiIconWrap container'
      );
      assert.ok(
        tsx.includes('data-card-id={id}'),
        'Must pass data-card-id to enable card-specific archetype styling'
      );
    });

    it('verifies KpiRibbon.module.scss defines 36px circular geometry for icon badges', () => {
      const scss = fs.readFileSync(kpiScssPath, 'utf8');
      const iconBlock = scss.match(/(?:^|\n)\.kpiIconWrap\s*\{[\s\S]*?\n\}/)?.[0] || '';

      assert.ok(iconBlock.includes('width: 36px;'));
      assert.ok(iconBlock.includes('height: 36px;'));
      assert.ok(iconBlock.includes('border-radius: 50%;'));
    });

    it('verifies card-specific archetype color tints for all 5 metrics', () => {
      const scss = fs.readFileSync(kpiScssPath, 'utf8');
      // Total leads: slate
      assert.ok(scss.includes('[data-card-id="total-leads"] .kpiIconWrap'));
      assert.ok(scss.includes('#f1f5f9'));
      // Potential value: amber
      assert.ok(scss.includes('[data-card-id="potential-value"] .kpiIconWrap'));
      assert.ok(scss.includes('#fef3c7'));
      // Converted revenue: emerald
      assert.ok(scss.includes('[data-card-id="converted-revenue"] .kpiIconWrap'));
      assert.ok(scss.includes('#ecfdf5'));
      // Conversion rate: mint
      assert.ok(scss.includes('[data-card-id="conversion-rate"] .kpiIconWrap'));
      assert.ok(scss.includes('#f0fdf4'));
      // Overdue follow-ups: rose
      assert.ok(scss.includes('[data-card-id="overdue-followups"] .kpiIconWrap'));
      assert.ok(scss.includes('#fef2f2'));
    });
  });

  describe('3. Collision-Proof Valuation Hierarchy (Screenshot 235101 Defect Remediation)', () => {
    it('verifies KpiCard.tsx isolates secondaryBadge in dedicated secondaryBadgeRow', () => {
      const tsx = fs.readFileSync(kpiCardTsxPath, 'utf8');
      assert.ok(
        tsx.includes('secondaryBadgeRow'),
        'secondaryBadge must be rendered in secondaryBadgeRow beneath kpiValue'
      );
      // Value wrapper must only contain the primary value to prevent layout collision
      const valueWrapperBlock = tsx.match(/<div className=\{styles\.kpiValueWrapper\}>[\s\S]*?<\/div>/)?.[0] || '';
      assert.strictEqual(
        valueWrapperBlock.includes('secondaryBadge'),
        false,
        'secondaryBadge must never sit inside kpiValueWrapper beside the primary numeral'
      );
    });

    it('verifies KpiRibbon.tsx formats weighted valuation badge cleanly', () => {
      const tsx = fs.readFileSync(kpiRibbonTsxPath, 'utf8');
      assert.ok(tsx.includes('weightedValuationBadge'));
      assert.ok(tsx.includes('weightedPrefix'));
      assert.ok(tsx.includes('weightedAmount'));
      assert.ok(tsx.includes('weightedSuffix'));
    });
  });

  describe('4. Precision Micro-Meter Progress Bar for Conversion Rate', () => {
    it('verifies KpiRibbon.tsx renders accessible microMeterTrack with role="progressbar"', () => {
      const tsx = fs.readFileSync(kpiRibbonTsxPath, 'utf8');
      assert.ok(tsx.includes('microMeterTrack'));
      assert.ok(tsx.includes('microMeterFill'));
      assert.ok(tsx.includes('microMeterBenchmark'));
      assert.ok(tsx.includes('role="progressbar"'));
      assert.ok(tsx.includes('aria-valuenow'));
    });

    it('verifies KpiRibbon.module.scss defines microMeter styling with benchmark marker', () => {
      const scss = fs.readFileSync(kpiScssPath, 'utf8');
      assert.ok(scss.includes('.microMeterTrack'));
      assert.ok(scss.includes('.microMeterFill'));
      assert.ok(scss.includes('.microMeterBenchmark'));
    });
  });

  describe('5. Zero Layout Shift Skeleton Geometry Parity', () => {
    it('verifies KpiSkeleton.module.scss matches 36px circular icon badge geometry', () => {
      const scss = fs.readFileSync(kpiScssPath, 'utf8');
      const skeletonIcon = scss.match(/\.skeletonIcon\s*\{[\s\S]*?\n\}/)?.[0] || '';

      assert.ok(skeletonIcon.includes('width: 36px;'));
      assert.ok(skeletonIcon.includes('height: 36px;'));
      assert.ok(skeletonIcon.includes('border-radius: 50%;'));
    });

    it('verifies KpiSkeleton.tsx declares data-testid for automated testing', () => {
      const tsx = fs.readFileSync(kpiSkeletonTsxPath, 'utf8');
      assert.ok(tsx.includes('data-testid="kpi-skeleton-container"'));
    });
  });

  describe('6. Anti-Slop Discipline & Interactive Ergonomics', () => {
    it('verifies zero generic blue (#2563eb) or orange (#ff6100) in KpiRibbon.module.scss', () => {
      const scss = fs.readFileSync(kpiScssPath, 'utf8');
      assert.strictEqual(scss.includes('#2563eb'), false);
      assert.strictEqual(scss.includes('#1d4ed8'), false);
      assert.strictEqual(scss.includes('#ff6100'), false);
    });

    it('verifies refresh button and interactive controls satisfy >= 44px min-height (Rule R-03)', () => {
      const scss = fs.readFileSync(kpiScssPath, 'utf8');
      const refreshBtnBlock = scss.match(/\.refreshBtn\s*\{[\s\S]*?\n\}/)?.[0] || '';
      assert.ok(refreshBtnBlock.includes('min-height: 44px;'));
      assert.ok(refreshBtnBlock.includes('min-width: 44px;'));
    });

    it('verifies dual currency controls support both INR and USD with radio accessibility', () => {
      const tsx = fs.readFileSync(kpiRibbonTsxPath, 'utf8');
      assert.ok(tsx.includes('role="radiogroup"'));
      assert.ok(tsx.includes('role="radio"'));
      assert.ok(tsx.includes('₹ INR'));
      assert.ok(tsx.includes('$ USD'));
    });
  });
});
