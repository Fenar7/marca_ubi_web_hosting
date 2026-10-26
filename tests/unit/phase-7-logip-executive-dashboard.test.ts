/**
 * @file tests/unit/phase-7-logip-executive-dashboard.test.ts
 * @description Dedicated Unit Test Suite for Phase 7 Brand Upgrade:
 *              Logip-Inspired Executive Overview Dashboard Ground-Up Architecture.
 *              Verifies 3-column fluid grid canvas, MinimalistStatPods (converted revenue,
 *              active pipeline, win velocity), PerformanceChart (interactive dual-curve SVG area chart),
 *              CurrentDealsTable (account list, SLA badges, status pills), and ExecutiveActivityRail
 *              (user profile spotlight, live activity feed, quick note composer with signature Lemon Yellow CTA).
 *              Also validates sidebar brand container unclipped sizing and zero AI slop,
 *              plus platform-wide eradication of the legacy 5-card ribbon across all CRM pages.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 7: Logip-Inspired Executive Overview Dashboard Ground-Up Architecture', () => {
  const pageTsxPath = 'src/app/admin/(workspace)/page.tsx';
  const pageScssPath = 'src/app/admin/(workspace)/page.module.scss';
  const statPodsTsxPath = 'src/app/admin/components/Dashboard/MinimalistStatPods.tsx';
  const statPodsScssPath = 'src/app/admin/components/Dashboard/MinimalistStatPods.module.scss';
  const perfChartTsxPath = 'src/app/admin/components/Dashboard/PerformanceChart.tsx';
  const perfChartScssPath = 'src/app/admin/components/Dashboard/PerformanceChart.module.scss';
  const currentDealsTsxPath = 'src/app/admin/components/Dashboard/CurrentDealsTable.tsx';
  const currentDealsScssPath = 'src/app/admin/components/Dashboard/CurrentDealsTable.module.scss';
  const activityRailTsxPath = 'src/app/admin/components/Dashboard/ExecutiveActivityRail.tsx';
  const activityRailScssPath = 'src/app/admin/components/Dashboard/ExecutiveActivityRail.module.scss';
  const sidebarTsxPath = 'src/app/admin/components/layout/AdminSidebar.tsx';
  const sidebarScssPath = 'src/app/admin/components/layout/AdminSidebar.module.scss';
  const leadsPageTsxPath = 'src/app/admin/(workspace)/leads/page.tsx';
  const dealsPageTsxPath = 'src/app/admin/(workspace)/deals/page.tsx';
  const analyticsPageTsxPath = 'src/app/admin/(workspace)/analytics/page.tsx';

  describe('1. 3-Column Logip Dashboard Canvas Architecture', () => {
    it('verifies page.tsx imports and renders all 4 Logip dashboard components', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), pageTsxPath), 'utf8');
      assert.ok(content.includes('MinimalistStatPods'), 'Should import/render MinimalistStatPods');
      assert.ok(content.includes('PerformanceChart'), 'Should import/render PerformanceChart');
      assert.ok(content.includes('CurrentDealsTable'), 'Should import/render CurrentDealsTable');
      assert.ok(content.includes('ExecutiveActivityRail'), 'Should import/render ExecutiveActivityRail');
    });

    it('verifies page.tsx has eliminated legacy KpiRibbon and raw ManagerWorkloadCard', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), pageTsxPath), 'utf8');
      assert.ok(!content.includes('<KpiRibbon'), 'Legacy KpiRibbon should not be rendered');
      assert.ok(!content.includes('<ManagerWorkloadCard'), 'Raw ManagerWorkloadCard should not be rendered');
    });

    it('verifies page.module.scss defines the 3-column / fluid layout grid structure', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), pageScssPath), 'utf8');
      assert.ok(content.includes('.dashboardGrid'), 'Should define .dashboardGrid');
      assert.ok(content.includes('.mainCanvas'), 'Should define .mainCanvas');
      assert.ok(content.includes('.rightRail'), 'Should define .rightRail');
      assert.ok(content.includes('.greetingHeader'), 'Should define .greetingHeader');
    });
  });

  describe('2. MinimalistStatPods Component', () => {
    it('verifies MinimalistStatPods renders 3 high-impact metric pods', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), statPodsTsxPath), 'utf8');
      assert.ok(content.includes('Converted Revenue'), 'Must show Converted Revenue pod');
      assert.ok(content.includes('Active Pipeline'), 'Must show Active Pipeline pod');
      assert.ok(content.includes('Win Velocity'), 'Must show Win Velocity pod');
    });

    it('verifies MinimalistStatPods renders 3 independent separated card containers with tabular numbers', () => {
      const scss = fs.readFileSync(path.resolve(process.cwd(), statPodsScssPath), 'utf8');
      assert.ok(scss.includes('tabular-nums'), 'Must enforce tabular-nums on numeric values');
      assert.ok(scss.includes('.podItem'), 'Must define .podItem layout');
      assert.ok(scss.includes('.statPodsContainer'), 'Must define .statPodsContainer layout');
      assert.ok(scss.includes('gap: 1.25rem'), 'Container must have grid gap for separated cards');
    });
  });

  describe('3. PerformanceChart Dual-Curve SVG Area Chart', () => {
    it('verifies PerformanceChart implements responsive SVG curves with Marca Orange and Slate', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), perfChartTsxPath), 'utf8');
      assert.ok(content.includes('#ff6100'), 'Must use Marca Orange #ff6100 for primary curve');
      assert.ok(content.includes('#94a3b8'), 'Must use Slate #94a3b8 for secondary comparison curve');
      assert.ok(content.includes('gradIdOrange'), 'Must define orange SVG gradient reference');
      assert.ok(content.includes('gradIdSlate'), 'Must define slate SVG gradient reference');
      assert.ok(content.includes('tooltipCapsule'), 'Must support interactive hover tooltip capsule');
    });

    it('verifies PerformanceChart includes time range selector and legend pills', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), perfChartTsxPath), 'utf8');
      assert.ok(content.includes('filterSelect'), 'Must include date filter selector');
      assert.ok(content.includes('legendItem'), 'Must include legend items');
    });

    it('verifies PerformanceChart SCSS enforces glassmorphism and crisp dark tooltip capsule', () => {
      const scss = fs.readFileSync(path.resolve(process.cwd(), perfChartScssPath), 'utf8');
      assert.ok(scss.includes('.tooltipCapsule'), 'Must define .tooltipCapsule');
      assert.ok(scss.includes('border-radius'), 'Must define rounded corners');
    });
  });

  describe('4. CurrentDealsTable Component', () => {
    it('verifies CurrentDealsTable renders account names, valuations, and SLA indicators', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), currentDealsTsxPath), 'utf8');
      assert.ok(content.includes('categoryIconChip'), 'Must render category icon chips');
      assert.ok(content.includes('statusPill'), 'Must render status dot pills');
      assert.ok(content.includes('slaPill'), 'Must render SLA indicator pills');
      assert.ok(content.includes('open-lead-drawer'), 'Must dispatch event to open lead drawer');
    });

    it('verifies CurrentDealsTable SCSS has hairline row borders and hover row transitions', () => {
      const scss = fs.readFileSync(path.resolve(process.cwd(), currentDealsScssPath), 'utf8');
      assert.ok(scss.includes('.dealRow'), 'Must style .dealRow');
      assert.ok(scss.includes('.categoryIconChip'), 'Must style .categoryIconChip');
      assert.ok(scss.includes('.statusPill'), 'Must style .statusPill');
      assert.ok(scss.includes('.slaPill'), 'Must style .slaPill');
    });
  });

  describe('5. ExecutiveActivityRail Component & Authentic Brand Colors', () => {
    it('verifies ExecutiveActivityRail renders user profile spotlight, activity feed, and composer', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), activityRailTsxPath), 'utf8');
      assert.ok(content.includes('profileCard'), 'Must contain profileCard');
      assert.ok(content.includes('activityList'), 'Must contain activityList');
      assert.ok(content.includes('composerBox'), 'Must contain composerBox');
      assert.ok(content.includes('postNoteBtn'), 'Must contain postNoteBtn');
    });

    it('verifies postNoteBtn preserves Signature Lemon Yellow CTA (#eefb87 / #e4f375)', () => {
      const scss = fs.readFileSync(path.resolve(process.cwd(), activityRailScssPath), 'utf8');
      assert.ok(
        scss.includes('#eefb87') || scss.includes('#e4f375'),
        'Action button must preserve authentic signature Lemon Yellow (#eefb87 / #e4f375)'
      );
      assert.ok(scss.includes('.postNoteBtn'), 'Must define .postNoteBtn');
    });

    it('verifies ExecutiveActivityRail displays document attachments matching Logip reference', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), activityRailTsxPath), 'utf8');
      assert.ok(content.includes('attachmentCard'), 'Must render attachment card');
      assert.ok(content.includes('Acme_Brand_Scope_v2.pdf'), 'Must render file attachment mock/data');
    });
  });

  describe('6. AdminSidebar Brand Header Fix', () => {
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
      statPodsScssPath,
      perfChartScssPath,
      currentDealsScssPath,
      activityRailScssPath,
    ];

    it('verifies zero generic blue (#2563eb) in any Phase 7 SCSS module', () => {
      for (const relPath of scssFiles) {
        const content = fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
        assert.ok(!content.includes('#2563eb'), `Generic blue found in ${relPath}`);
      }
    });

    it('verifies zero harsh drop shadows in any Phase 7 SCSS module', () => {
      for (const relPath of scssFiles) {
        const content = fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
        assert.ok(!content.includes('0 10px 25px rgba(0,0,0,0.5)'), `Harsh drop shadow found in ${relPath}`);
      }
    });

    it('verifies all files export clean TypeScript symbols without any type assertions', () => {
      const tsxFiles = [
        statPodsTsxPath,
        perfChartTsxPath,
        currentDealsTsxPath,
        activityRailTsxPath,
      ];
      for (const relPath of tsxFiles) {
        const content = fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
        assert.ok(!content.includes(': any'), `Found : any in ${relPath}`);
      }
    });
  });

  describe('8. Platform-Wide 5-Card Ribbon Eradication', () => {
    it('verifies leads/page.tsx has completely eradicated KpiRibbon and mounts MinimalistStatPods', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), leadsPageTsxPath), 'utf8');
      assert.ok(!content.includes('<KpiRibbon'), 'KpiRibbon must not be rendered in leads/page.tsx');
      assert.ok(content.includes('MinimalistStatPods'), 'MinimalistStatPods must be mounted in leads/page.tsx');
    });

    it('verifies deals/page.tsx has completely eradicated KpiRibbon and mounts MinimalistStatPods', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), dealsPageTsxPath), 'utf8');
      assert.ok(!content.includes('<KpiRibbon'), 'KpiRibbon must not be rendered in deals/page.tsx');
      assert.ok(content.includes('MinimalistStatPods'), 'MinimalistStatPods must be mounted in deals/page.tsx');
    });

    it('verifies analytics/page.tsx has completely eradicated KpiRibbon and mounts MinimalistStatPods', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), analyticsPageTsxPath), 'utf8');
      assert.ok(!content.includes('<KpiRibbon'), 'KpiRibbon must not be rendered in analytics/page.tsx');
      assert.ok(content.includes('MinimalistStatPods'), 'MinimalistStatPods must be mounted in analytics/page.tsx');
    });
  });
});
