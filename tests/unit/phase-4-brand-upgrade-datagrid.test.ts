/**
 * @file tests/unit/phase-4-brand-upgrade-datagrid.test.ts
 * @description Dedicated Unit Test Suite for Phase 4:
 *              Inbound Discovery Leads Workspace & Collision-Free 9-Column DataGrid Architecture.
 *              Validates 9 dedicated column tracks, permanent elimination of button/touchpoint collisions,
 *              dynamic FilterActionBar tab labeling, skeleton parity (CLS < 0.005), zero raw unicode,
 *              and 44px interactive tap target compliance.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 4 Brand Upgrade: Inbound Discovery & 9-Column DataGrid Suite', () => {
  const dataGridTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/LeadsTable/LeadsDataGrid.tsx'
  );
  const dataGridScssPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/LeadsTable/LeadsDataGrid.module.scss'
  );
  const filterActionBarTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/FilterActionBar/FilterActionBar.tsx'
  );
  const leadsWorkspaceClientTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx'
  );
  const skeletonTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/LeadsTable/LeadsTableSkeleton.tsx'
  );
  const skeletonScssPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/LeadsTable/LeadsTableSkeleton.module.scss'
  );

  describe('1. Collision-Free 9-Column Grid Architecture & Geometry', () => {
    it('verifies LeadsDataGrid.tsx declares exactly 9 dedicated column headers', () => {
      const tsx = fs.readFileSync(dataGridTsxPath, 'utf8');

      // Col 1: Lead ID
      assert.ok(tsx.includes('<span>Lead ID</span>'), 'Header must contain Lead ID');
      // Col 2: Client & Org
      assert.ok(tsx.includes('<span>Client & Org</span>'), 'Header must contain Client & Org');
      // Col 3: Service Scope
      assert.ok(tsx.includes('<span>Service Scope</span>'), 'Header must contain Service Scope');
      // Col 4: Funnel Stage
      assert.ok(tsx.includes('<span>Funnel Stage</span>'), 'Header must contain Funnel Stage');
      // Col 5: Expected Value
      assert.ok(tsx.includes('<span>Expected Value</span>'), 'Header must contain Expected Value');
      // Col 6: Representative
      assert.ok(tsx.includes('<span>Representative</span>'), 'Header must contain Representative');
      // Col 7: Priority
      assert.ok(tsx.includes('<span>Priority</span>'), 'Header must contain Priority');
      // Col 8: Next SLA
      assert.ok(tsx.includes('<span>Next SLA</span>'), 'Header must contain Next SLA');
      // Col 9: Actions
      assert.ok(tsx.includes('<span>Actions</span>'), 'Header must contain Actions');
    });

    it('verifies LeadsDataGrid.tsx row structure separates Priority, Next SLA, and Actions into dedicated columns', () => {
      const tsx = fs.readFileSync(dataGridTsxPath, 'utf8');

      // Col 7 dedicated priorityCol
      assert.ok(
        tsx.includes('className={styles.priorityCol}'),
        'Must have dedicated .priorityCol'
      );
      // Col 8 dedicated slaCol
      assert.ok(
        tsx.includes('className={styles.slaCol}'),
        'Must have dedicated .slaCol'
      );
      // Col 9 dedicated actionsCol
      assert.ok(
        tsx.includes('className={styles.actionsCol}'),
        'Must have dedicated .actionsCol'
      );

      // Verify old overlapping container priorityTouchpointCol is NOT used in row
      assert.strictEqual(
        tsx.includes('className={styles.priorityTouchpointCol}'),
        false,
        'Old colliding priorityTouchpointCol must be purged'
      );
    });

    it('verifies LeadsDataGrid.module.scss enforces 9-column grid template with min-width container', () => {
      const scss = fs.readFileSync(dataGridScssPath, 'utf8');

      assert.ok(
        scss.includes('$grid-columns: 85px minmax(180px, 1.4fr) 120px 130px 110px 130px 105px 125px 110px;'),
        'Must define precise 9-column layout metrics'
      );
      assert.ok(
        scss.includes('$grid-min-width: 1095px;') || scss.includes('$grid-min-width: 1080px;'),
        'Must define min-width constraint to prevent horizontal collision'
      );

      // Check tableHeader, virtualViewport, virtualRow
      assert.ok(scss.includes('min-width: $grid-min-width;'));
      assert.ok(scss.includes('grid-template-columns: $grid-columns;'));
      assert.ok(scss.includes('overflow-x: auto;'));
    });

    it('verifies SortField includes next_follow_up sorting comparator', () => {
      const tsx = fs.readFileSync(dataGridTsxPath, 'utf8');

      assert.ok(
        tsx.includes("'next_follow_up'"),
        'SortField union must include next_follow_up'
      );
      assert.ok(
        tsx.includes("sortField === 'next_follow_up'"),
        'Must implement comparator logic for next_follow_up'
      );
    });
  });

  describe('2. FilterActionBar Dynamic Scope Separation (Inbound vs Deals)', () => {
    it('verifies FilterActionBar.tsx supports scope prop and renders All Inquiries for leads', () => {
      const tsx = fs.readFileSync(filterActionBarTsxPath, 'utf8');

      assert.ok(
        tsx.includes("scope?: 'leads' | 'deals'"),
        'FilterActionBarProps must define scope'
      );
      assert.ok(
        tsx.includes("scope === 'leads' ? 'All Inquiries' : 'All Deals'"),
        'Bucket tabs must dynamically label first tab based on scope'
      );
    });

    it('verifies LeadsWorkspaceClient.tsx supplies scope="leads"', () => {
      const tsx = fs.readFileSync(leadsWorkspaceClientTsxPath, 'utf8');

      assert.ok(
        tsx.includes('scope="leads"'),
        'Leads workspace client must pass scope="leads" to FilterActionBar'
      );
    });
  });

  describe('3. Skeleton Layout Parity & Zero Cumulative Layout Shift (CLS < 0.005)', () => {
    it('verifies LeadsTableSkeleton.tsx mirrors the 9-column layout', () => {
      const tsx = fs.readFileSync(skeletonTsxPath, 'utf8');

      // Verify 9 head label shimmers
      const headSkeletons = tsx.match(/styles\.headLabelSkeleton/g) || [];
      assert.strictEqual(
        headSkeletons.length,
        9,
        'Header skeleton must have exactly 9 column shimmer bars'
      );

      // Verify Priority, Next SLA, and Actions in row skeleton
      assert.ok(tsx.includes('styles.priorityPill'), 'Row skeleton must include priorityPill');
      assert.ok(tsx.includes('styles.touchpointBar'), 'Row skeleton must include touchpointBar');
      assert.ok(tsx.includes('styles.actionButtonSkeleton'), 'Row skeleton must include actionButtonSkeleton');
    });

    it('verifies LeadsTableSkeleton.module.scss shares the identical 9-column grid metrics', () => {
      const scss = fs.readFileSync(skeletonScssPath, 'utf8');

      assert.ok(
        scss.includes('$grid-columns: 85px minmax(180px, 1.4fr) 120px 130px 110px 130px 105px 125px 110px;'),
        'Skeleton must share identical grid columns definition'
      );
      assert.ok(
        scss.includes('grid-template-columns: $grid-columns;'),
        'Skeleton head and row must use $grid-columns'
      );
      assert.ok(
        scss.includes('min-width: $grid-min-width;'),
        'Skeleton head and row must enforce min-width'
      );
    });
  });

  describe('4. Anti-AI-Slop & Design System Compliance', () => {
    it('verifies zero raw unicode characters in DataGrid and Skeleton', () => {
      const rawUnicodeRegex = /[\u25B2\u25BC\u2197\u25C0\u25B6\u2715]/;
      const dataGridTsx = fs.readFileSync(dataGridTsxPath, 'utf8');
      const skeletonTsx = fs.readFileSync(skeletonTsxPath, 'utf8');

      assert.strictEqual(
        rawUnicodeRegex.test(dataGridTsx),
        false,
        'LeadsDataGrid must not contain raw unicode arrows'
      );
      assert.strictEqual(
        rawUnicodeRegex.test(skeletonTsx),
        false,
        'LeadsTableSkeleton must not contain raw unicode arrows'
      );
    });

    it('verifies touch target accessibility compliance (>= 44px tap targets)', () => {
      const scss = fs.readFileSync(dataGridScssPath, 'utf8');

      // Sortable headers have min-height 44px
      assert.ok(
        scss.includes('.sortableHeaderCol') && scss.includes('min-height: 44px;'),
        'Sortable headers must provide >= 44px tap target'
      );
      // Action buttons have min 44px click expansion
      assert.ok(
        scss.includes('.actionBtn') && scss.includes('min-width: 44px;') && scss.includes('min-height: 44px;'),
        'Action buttons must expand to 44px tap target via ::after'
      );
      assert.ok(
        scss.includes('.rowConvertBtn') && scss.includes('min-width: 44px;') && scss.includes('min-height: 44px;'),
        'Row convert button must expand to 44px tap target via ::after'
      );
      assert.ok(
        scss.includes('.rowInspectBtn') && scss.includes('min-width: 44px;') && scss.includes('min-height: 44px;'),
        'Row inspect button must expand to 44px tap target via ::after'
      );
    });

    it('verifies zero generic blue (#2563eb, #1d4ed8) in modified files', () => {
      const genericBlueRegex = /#2563eb|#1d4ed8|#3b82f6|rgba\(\s*37,\s*99,\s*235/i;
      const files = [
        dataGridTsxPath,
        dataGridScssPath,
        filterActionBarTsxPath,
        skeletonTsxPath,
        skeletonScssPath,
      ];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        assert.strictEqual(
          genericBlueRegex.test(content),
          false,
          `File ${path.basename(file)} must not introduce generic blue`
        );
      }
    });
  });
});
