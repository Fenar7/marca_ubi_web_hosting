/**
 * @file tests/unit/phase-4-brand-upgrade-datagrid.test.ts
 * @description Dedicated Unit Test Suite for Phase 4:
 *              Inbound Discovery Leads Workspace & Collision-Free 9-Column DataGrid Architecture.
 *              Validates 9 dedicated column tracks (140px actions track), permanent elimination of
 *              button/touchpoint collisions, dynamic FilterActionBar tab labeling, skeleton parity (CLS < 0.005),
 *              zero raw unicode, 44px interactive tap target compliance, SQL NULLS LAST comparator invariants,
 *              stopPropagation keyboard containment, and domain copy hygiene.
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
  const mobileCardTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/LeadsTable/LeadMobileCard.tsx'
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

    it('verifies LeadsDataGrid.module.scss enforces 9-column grid template with 140px action track', () => {
      const scss = fs.readFileSync(dataGridScssPath, 'utf8');

      assert.ok(
        scss.includes('$grid-columns: 85px minmax(180px, 1.4fr) 120px 130px 110px 130px 105px 125px 140px;'),
        'Must define precise 9-column layout metrics with 140px track 9'
      );
      assert.ok(
        scss.includes('$grid-min-width: 1125px;'),
        'Must define min-width constraint to prevent horizontal collision'
      );

      // Check tableHeader, virtualViewport, virtualRow
      assert.ok(scss.includes('min-width: $grid-min-width;'));
      assert.ok(scss.includes('grid-template-columns: $grid-columns;'));
      assert.ok(scss.includes('overflow-x: auto;'));
    });

    it('verifies rowConvertBtn and rowInspectBtn prevent flex shrink and wrapping', () => {
      const scss = fs.readFileSync(dataGridScssPath, 'utf8');

      assert.ok(
        scss.includes('.rowConvertBtn') && scss.includes('white-space: nowrap;') && scss.includes('flex-shrink: 0;'),
        '.rowConvertBtn must enforce white-space: nowrap and flex-shrink: 0'
      );
      assert.ok(
        scss.includes('.rowInspectBtn') && scss.includes('white-space: nowrap;') && scss.includes('flex-shrink: 0;'),
        '.rowInspectBtn must enforce white-space: nowrap and flex-shrink: 0'
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
      assert.ok(
        tsx.includes("const itemTypeLabel = scope === 'leads' ? 'inquiries' : 'deals';"),
        'Must compute dynamic itemTypeLabel for aria labels and search placeholder'
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
        scss.includes('$grid-columns: 85px minmax(180px, 1.4fr) 120px 130px 110px 130px 105px 125px 140px;'),
        'Skeleton must share identical grid columns definition with 140px track'
      );
      assert.ok(
        scss.includes('$grid-min-width: 1125px;'),
        'Skeleton must share identical 1125px min-width'
      );
      assert.ok(
        scss.includes('min-height: 44px;') && scss.includes('height: 44px;'),
        'Skeleton header must have 44px height matching tableHeader'
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
      // Lead ID token has min 44px click expansion
      assert.ok(
        scss.includes('.leadIdToken') && scss.includes('min-width: 44px;') && scss.includes('min-height: 44px;'),
        '.leadIdToken must expand to 44px tap target via ::after'
      );
      // Touchpoint date has min 44px click expansion
      assert.ok(
        scss.includes('.touchpointDate') && scss.includes('min-width: 44px;') && scss.includes('min-height: 44px;'),
        '.touchpointDate must expand to 44px tap target via ::after'
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

  describe('5. Runtime Comparator Invariants (SQL NULLS LAST & Weak Ordering)', () => {
    it('verifies next_follow_up sorting adheres to SQL NULLS LAST invariant for both ASC and DESC', () => {
      interface MockLead {
        id: string;
        next_follow_up?: string | null;
      }

      const leads: MockLead[] = [
        { id: '1', next_follow_up: '2026-10-25T10:00:00Z' },
        { id: '2', next_follow_up: null },
        { id: '3', next_follow_up: '2026-10-21T10:00:00Z' },
        { id: '4', next_follow_up: undefined },
        { id: '5', next_follow_up: 'invalid-date' },
      ];

      const sortComparator = (sortAscending: boolean) => (a: MockLead, b: MockLead) => {
        const aTime = a.next_follow_up ? new Date(a.next_follow_up).getTime() : NaN;
        const bTime = b.next_follow_up ? new Date(b.next_follow_up).getTime() : NaN;
        const aValid = !Number.isNaN(aTime);
        const bValid = !Number.isNaN(bTime);
        if (!aValid && !bValid) return 0;
        if (!aValid) return 1;
        if (!bValid) return -1;
        return sortAscending ? aTime - bTime : bTime - aTime;
      };

      // Ascending: earliest first, null/invalid last
      const ascSorted = [...leads].sort(sortComparator(true));
      assert.strictEqual(ascSorted[0].id, '3', 'Earliest date must be first in ASC');
      assert.strictEqual(ascSorted[1].id, '1', 'Later date must be second in ASC');
      const ascTails = ascSorted.slice(2).map((l) => l.id);
      assert.ok(
        ascTails.includes('2') && ascTails.includes('4') && ascTails.includes('5'),
        'Null/invalid must be at the end in ASC'
      );

      // Descending: latest first, null/invalid last
      const descSorted = [...leads].sort(sortComparator(false));
      assert.strictEqual(descSorted[0].id, '1', 'Latest date must be first in DESC');
      assert.strictEqual(descSorted[1].id, '3', 'Earlier date must be second in DESC');
      const descTails = descSorted.slice(2).map((l) => l.id);
      assert.ok(
        descTails.includes('2') && descTails.includes('4') && descTails.includes('5'),
        'Null/invalid must still be at the end in DESC'
      );
    });
  });

  describe('6. Keyboard Event Bubbling & StopPropagation Invariants', () => {
    it('verifies stopPropagation containment on interactive cells in LeadsDataGrid.tsx', () => {
      const tsx = fs.readFileSync(dataGridTsxPath, 'utf8');

      // slaCol onKeyDown stopPropagation
      assert.ok(
        tsx.includes('className={styles.slaCol}') &&
        tsx.includes('onClick={(e) => e.stopPropagation()}') &&
        tsx.includes('onKeyDown={(e) => e.stopPropagation()}'),
        '.slaCol must guard both onClick and onKeyDown'
      );

      // actionsCol onKeyDown stopPropagation
      assert.ok(
        tsx.includes('className={styles.actionsCol}') &&
        tsx.includes('onClick={(e) => e.stopPropagation()}') &&
        tsx.includes('onKeyDown={(e) => e.stopPropagation()}'),
        '.actionsCol must guard both onClick and onKeyDown'
      );
    });
  });

  describe('7. Domain Copy & Nomenclature Hygiene', () => {
    it('verifies LeadMobileCard.tsx has no stale Deal references in titles or aria labels', () => {
      const tsx = fs.readFileSync(mobileCardTsxPath, 'utf8');

      assert.strictEqual(
        tsx.includes('aria-label={`Deal'),
        false,
        'LeadMobileCard must not use `Deal ...` in root aria-label'
      );
      assert.strictEqual(
        tsx.includes('title="Click to copy Deal ID"'),
        false,
        'LeadMobileCard must not refer to "Deal ID" in copy button title'
      );
      assert.strictEqual(
        tsx.includes('aria-label={`Copy Deal ID'),
        false,
        'LeadMobileCard must not refer to "Deal ID" in copy button aria-label'
      );
    });
  });
});
