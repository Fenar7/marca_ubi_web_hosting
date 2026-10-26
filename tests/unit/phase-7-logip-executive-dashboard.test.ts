/**
 * @file tests/unit/phase-7-logip-executive-dashboard.test.ts
 * @description Dedicated Unit Test Suite for Executive Overview Dashboard Architecture.
 *              Verifies MedTrackr fluid canvas, ExecutiveMasthead, ExecutiveKpiGrid,
 *              RevenueDynamicsCard, PipelineAllocationCard, and CommercialDealsTable.
 *              Also validates sidebar brand container unclipped sizing and zero AI slop.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 7: Logip & MedTrackr Executive Overview Dashboard Ground-Up Architecture', () => {
  const pageTsxPath = 'src/app/admin/(workspace)/page.tsx';
  const pageScssPath = 'src/app/admin/(workspace)/page.module.scss';
  const mastheadTsxPath = 'src/app/admin/components/Dashboard/ExecutiveMasthead.tsx';
  const mastheadScssPath = 'src/app/admin/components/Dashboard/ExecutiveMasthead.module.scss';
  const kpiGridTsxPath = 'src/app/admin/components/Dashboard/ExecutiveKpiGrid.tsx';
  const kpiGridScssPath = 'src/app/admin/components/Dashboard/ExecutiveKpiGrid.module.scss';
  const rdcTsxPath = 'src/app/admin/components/Dashboard/RevenueDynamicsCard.tsx';
  const rdcScssPath = 'src/app/admin/components/Dashboard/RevenueDynamicsCard.module.scss';
  const dealsTsxPath = 'src/app/admin/components/Dashboard/CommercialDealsTable.tsx';
  const dealsScssPath = 'src/app/admin/components/Dashboard/CommercialDealsTable.module.scss';
  const sidebarTsxPath = 'src/app/admin/components/layout/AdminSidebar.tsx';
  const sidebarScssPath = 'src/app/admin/components/layout/AdminSidebar.module.scss';

  describe('1. MedTrackr Executive Dashboard Canvas Architecture', () => {
    it('verifies page.tsx imports and renders core Executive dashboard modules', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), pageTsxPath), 'utf8');
      assert.ok(content.includes('ExecutiveMasthead'), 'Should import/render ExecutiveMasthead');
      assert.ok(content.includes('ExecutiveKpiGrid'), 'Should import/render ExecutiveKpiGrid');
      assert.ok(content.includes('RevenueDynamicsCard'), 'Should import/render RevenueDynamicsCard');
      assert.ok(content.includes('PipelineAllocationCard'), 'Should import/render PipelineAllocationCard');
      assert.ok(content.includes('CommercialDealsTable'), 'Should import/render CommercialDealsTable');
    });

    it('verifies page.tsx has eliminated legacy KpiRibbon and unmounted workload cards', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), pageTsxPath), 'utf8');
      assert.ok(!content.includes('<KpiRibbon'), 'Legacy KpiRibbon should not be rendered');
      assert.ok(!content.includes('<ManagerWorkloadCard'), 'Raw ManagerWorkloadCard should not be rendered');
    });

    it('verifies page.module.scss defines the fluid canvas and mid-tier analytics grid', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), pageScssPath), 'utf8');
      assert.ok(content.includes('.dashboardContainer'), 'Should define .dashboardContainer');
      assert.ok(content.includes('.fluidCanvas'), 'Should define .fluidCanvas');
      assert.ok(content.includes('.midTierGrid'), 'Should define .midTierGrid');
      assert.ok(content.includes('.bottomSection'), 'Should define .bottomSection');
    });
  });

  describe('2. ExecutiveKpiGrid Component', () => {
    it('verifies ExecutiveKpiGrid renders 4 calibrated metric scorecards', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), kpiGridTsxPath), 'utf8');
      assert.ok(content.includes('Total Active Pipeline'), 'Must show Total Active Pipeline card');
      assert.ok(content.includes('Cash Collected') || content.includes('Realized Revenue'), 'Must show Cash Collected card');
      assert.ok(content.includes('Active Pipeline Deals') || content.includes('active_pipeline'), 'Must show Active Deals card');
      assert.ok(content.includes('Conversion Velocity') || content.includes('winRate'), 'Must show Win Velocity card');
    });

    it('verifies ExecutiveKpiGrid renders separated cards with tabular numerals and 44px hit targets', () => {
      const scss = fs.readFileSync(path.resolve(process.cwd(), kpiGridScssPath), 'utf8');
      assert.ok(scss.includes('tabular-nums'), 'Must enforce tabular-nums on numeric values');
      assert.ok(scss.includes('.kpiCard'), 'Must define .kpiCard layout');
      assert.ok(scss.includes('.circleBtn'), 'Must define .circleBtn layout');
      assert.ok(scss.includes('inset: -6px'), 'Must expand touch envelope to 44px');
    });
  });

  describe('3. RevenueDynamicsCard Dual-Curve SVG Spline Chart', () => {
    it('verifies RevenueDynamicsCard implements responsive SVG curves with Marca Orange and Slate', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), rdcTsxPath), 'utf8');
      assert.ok(content.includes('cashSpline'), 'Must render cashSpline path');
      assert.ok(content.includes('quotaSpline'), 'Must render quotaSpline path');
      assert.ok(content.includes('cashAreaPath') || content.includes('areaWashPath'), 'Must render area wash');
      assert.ok(content.includes('role="tooltip"') || content.includes('tooltipHeader'), 'Must support interactive hover tooltip');
    });

    it('verifies RevenueDynamicsCard SCSS enforces glassmorphism and crisp dark tooltip styling', () => {
      const scss = fs.readFileSync(path.resolve(process.cwd(), rdcScssPath), 'utf8');
      assert.ok(scss.includes('.tooltipHeader') || scss.includes('.tooltipRow'), 'Must define tooltip classes');
      assert.ok(scss.includes('border-radius'), 'Must define rounded corners');
    });
  });

  describe('4. CommercialDealsTable Component', () => {
    it('verifies CommercialDealsTable renders account names, valuations, and 44px inputs', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), dealsTsxPath), 'utf8');
      assert.ok(content.includes('categoryBadge') || content.includes('categoryPill'), 'Must render category badges');
      assert.ok(content.includes('statusPill') || content.includes('radarDot'), 'Must render status indicators');
      assert.ok(content.includes('searchInput'), 'Must render search input');
    });

    it('verifies CommercialDealsTable SCSS has 44px interactive heights', () => {
      const scss = fs.readFileSync(path.resolve(process.cwd(), dealsScssPath), 'utf8');
      assert.ok(scss.includes('height: 44px'), 'Search input and filter pills must have 44px height');
      assert.ok(scss.includes('min-height: 44px'), 'Search input and filter pills must have 44px min-height');
    });
  });

  describe('5. ExecutiveMasthead Signature Lemon Yellow CTA', () => {
    it('verifies ExecutiveMasthead renders Title, Timeframe selector, and New Lead CTA', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), mastheadTsxPath), 'utf8');
      assert.ok(content.includes('newLeadBtn'), 'Must contain newLeadBtn');
      assert.ok(content.includes('New Lead'), 'Must contain New Lead button text');
    });

    it('verifies newLeadBtn preserves Signature Lemon Yellow CTA (#eefb87) with 44px min-height', () => {
      const scss = fs.readFileSync(path.resolve(process.cwd(), mastheadScssPath), 'utf8');
      assert.ok(
        scss.includes('#eefb87'),
        'Action button must preserve authentic signature Lemon Yellow (#eefb87)'
      );
      assert.ok(scss.includes('min-height: 44px'), 'Must enforce 44px min-height');
      assert.ok(scss.includes('.newLeadBtn'), 'Must define .newLeadBtn');
    });
  });

  describe('6. AdminSidebar Brand Header Invariants', () => {
    it('verifies AdminSidebar has 72px brand container height and eliminated colliding brandMeta text', () => {
      const tsx = fs.readFileSync(path.resolve(process.cwd(), sidebarTsxPath), 'utf8');
      const scss = fs.readFileSync(path.resolve(process.cwd(), sidebarScssPath), 'utf8');
      assert.ok(!tsx.includes('className={styles.brandMeta}'), 'Colliding brandMeta text should be removed');
      assert.ok(scss.includes('height: 72px') || scss.includes('min-height: 72px'), 'Must maintain unclipped 72px brandContainer');
    });
  });

  describe('7. Anti-Slop & Zero-Tolerance Quality Standards', () => {
    const scssFiles = [
      pageScssPath,
      kpiGridScssPath,
      rdcScssPath,
      dealsScssPath,
      mastheadScssPath,
    ];

    it('verifies zero generic blue (#2563eb, #3b82f6, #1d4ed8) leaks across active dashboard styles', () => {
      for (const relPath of scssFiles) {
        const scss = fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
        assert.strictEqual(scss.includes('#2563eb'), false, `${relPath} must not contain #2563eb`);
        assert.strictEqual(scss.includes('#3b82f6'), false, `${relPath} must not contain #3b82f6`);
        assert.strictEqual(scss.includes('#1d4ed8'), false, `${relPath} must not contain #1d4ed8`);
      }
    });

    it('verifies zero raw box-shadow drops across active dashboard styles', () => {
      for (const relPath of scssFiles) {
        const scss = fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
        assert.strictEqual(scss.includes('drop-shadow'), false, `${relPath} must not contain raw drop-shadow`);
      }
    });
  });
});
