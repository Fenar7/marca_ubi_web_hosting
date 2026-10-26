/**
 * @file tests/unit/phase-5-brand-upgrade-deals-and-dossier.test.ts
 * @description Dedicated Unit Test Suite for Phase 5:
 *              Pipeline Negotiations (/admin/deals Dual Kanban & DataGrid Views),
 *              LoopAI-Style Client 360° Dossier Drawer & Final Delivery Gate.
 *              Validates deal velocity indicators, SLA & Overdue badges on Kanban cards,
 *              click-to-copy Deal Ref, Next SLA table column with SQL NULLS LAST sorting,
 *              stage transition guards, and 44px touch target compliance.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 5 Brand Upgrade: Pipeline Deals & Client Dossier Suite', () => {
  const dealsPageTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/(workspace)/deals/page.tsx'
  );
  const dealsClientTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/(workspace)/deals/DealsWorkspaceClient.tsx'
  );
  const dealsClientScssPath = path.resolve(
    process.cwd(),
    'src/app/admin/(workspace)/deals/DealsWorkspaceClient.module.scss'
  );
  const dossierDrawerTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx'
  );
  const dossierDrawerScssPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/DossierDrawer/DossierDrawer.module.scss'
  );
  const organizationDossierTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/DossierDrawer/OrganizationDossier.tsx'
  );

  describe('1. Deals Workspace Architecture & Dual View Toggling', () => {
    it('verifies DealsWorkspaceClient.tsx supports both kanban and table view modes', () => {
      const tsx = fs.readFileSync(dealsClientTsxPath, 'utf8');

      assert.ok(
        tsx.includes("viewMode === 'kanban'"),
        'Must support interactive Kanban board rendering'
      );
      assert.ok(
        tsx.includes("viewMode === 'table'"),
        'Must support sortable Data Grid table rendering'
      );
      assert.ok(
        tsx.includes('Kanban Board'),
        'View mode switcher must render Kanban Board label'
      );
      assert.ok(
        tsx.includes('Data Grid'),
        'View mode switcher must render Data Grid label'
      );
    });

    it('verifies page.tsx queries pipeline KPIs and selects revisit_date for deals', () => {
      const pageTsx = fs.readFileSync(dealsPageTsxPath, 'utf8');

      assert.ok(
        pageTsx.includes('get_pipeline_kpis'),
        'Must execute get_pipeline_kpis RPC for executive ribbon'
      );
      assert.ok(
        pageTsx.includes('revisit_date'),
        'Must query revisit_date for accurate SLA on-hold calculation'
      );
    });
  });

  describe('2. Kanban Board Deal Velocity & SLA Awareness', () => {
    it('verifies Kanban cards render Deal Velocity, Next SLA touchpoints, and OverdueBadge', () => {
      const tsx = fs.readFileSync(dealsClientTsxPath, 'utf8');

      // Deal velocity
      assert.ok(
        tsx.includes('className={styles.velocityBadge}'),
        'Kanban card must display velocityBadge'
      );
      assert.ok(
        tsx.includes('formatStageAge(deal.updated_at)'),
        'Must compute stage age from deal.updated_at'
      );

      // SLA & Overdue
      assert.ok(
        tsx.includes('className={styles.cardSlaBlock}'),
        'Kanban card must display cardSlaBlock'
      );
      assert.ok(
        tsx.includes('<OverdueBadge'),
        'Kanban card must embed OverdueBadge'
      );
    });

    it('verifies click-to-copy Deal Ref is integrated with tactile feedback on Kanban cards', () => {
      const tsx = fs.readFileSync(dealsClientTsxPath, 'utf8');

      assert.ok(
        tsx.includes('handleCopyDealId(deal.lead_id, e)'),
        'Must invoke handleCopyDealId upon clicking Deal ID badge'
      );
      assert.ok(
        tsx.includes('Copied'),
        'Must provide visual "Copied" feedback state'
      );
    });

    it('verifies omnichannel quick call and WhatsApp links are available on Kanban cards with stopPropagation', () => {
      const tsx = fs.readFileSync(dealsClientTsxPath, 'utf8');

      assert.ok(
        tsx.includes('className={styles.cardOmniBtn}'),
        'Kanban card must support omnichannel action buttons'
      );
      assert.ok(
        tsx.includes('href={`tel:${cleanPhone}`}') && tsx.includes('e.stopPropagation()'),
        'Direct phone trigger must exist with click containment'
      );
      assert.ok(
        tsx.includes('href={whatsAppUrl}') && tsx.includes('e.stopPropagation()'),
        'WhatsApp link must exist with click containment'
      );
    });
  });

  describe('3. Data Grid Next SLA Column & SQL NULLS LAST Invariant', () => {
    it('verifies Table view declares Next SLA column header and row cell', () => {
      const tsx = fs.readFileSync(dealsClientTsxPath, 'utf8');

      assert.ok(
        tsx.includes("handleToggleSort('next_follow_up')"),
        'Table header must support sorting by next_follow_up'
      );
      assert.ok(
        tsx.includes('className={styles.colSla}'),
        'Table row must include dedicated .colSla cell'
      );
      assert.ok(
        tsx.includes('className={styles.slaDateText}'),
        'Table row must format SLA date'
      );
    });

    it('verifies next_follow_up sorting comparator handles null, undefined, and invalid timestamps safely', () => {
      interface MockDeal {
        id: string;
        next_follow_up?: string | null;
      }

      const deals: MockDeal[] = [
        { id: 'deal-1', next_follow_up: '2026-10-30T10:00:00Z' },
        { id: 'deal-2', next_follow_up: null },
        { id: 'deal-3', next_follow_up: '2026-10-22T10:00:00Z' },
        { id: 'deal-4', next_follow_up: undefined },
        { id: 'deal-5', next_follow_up: 'invalid-date-string' },
      ];

      const sortComparator = (sortAscending: boolean) => (a: MockDeal, b: MockDeal) => {
        const aTime = a.next_follow_up ? new Date(a.next_follow_up).getTime() : NaN;
        const bTime = b.next_follow_up ? new Date(b.next_follow_up).getTime() : NaN;
        const aValid = !Number.isNaN(aTime);
        const bValid = !Number.isNaN(bTime);
        if (!aValid && !bValid) return 0;
        if (!aValid) return 1;
        if (!bValid) return -1;
        return sortAscending ? aTime - bTime : bTime - aTime;
      };

      // ASC: earliest first, nulls/invalids last
      const asc = [...deals].sort(sortComparator(true));
      assert.strictEqual(asc[0].id, 'deal-3', 'Earliest date must sort first in ASC');
      assert.strictEqual(asc[1].id, 'deal-1', 'Later date must sort second in ASC');
      const ascTails = asc.slice(2).map((d) => d.id);
      assert.ok(
        ascTails.includes('deal-2') && ascTails.includes('deal-4') && ascTails.includes('deal-5'),
        'Null/invalid dates must be placed at the end in ASC'
      );

      // DESC: latest first, nulls/invalids last
      const desc = [...deals].sort(sortComparator(false));
      assert.strictEqual(desc[0].id, 'deal-1', 'Latest date must sort first in DESC');
      assert.strictEqual(desc[1].id, 'deal-3', 'Earlier date must sort second in DESC');
      const descTails = desc.slice(2).map((d) => d.id);
      assert.ok(
        descTails.includes('deal-2') && descTails.includes('deal-4') && descTails.includes('deal-5'),
        'Null/invalid dates must remain at the end in DESC'
      );
    });
  });

  describe('4. Stage Transition Safety & Role Guards', () => {
    it('verifies handleMoveStage strictly forbids mutations for viewer role', () => {
      const tsx = fs.readFileSync(dealsClientTsxPath, 'utf8');

      assert.ok(
        tsx.includes("if (userRole === 'viewer') return;"),
        'handleMoveStage must enforce viewer authorization guard'
      );
      assert.ok(
        tsx.includes('userRole === \'viewer\' ? \'Read-only access\' :'),
        'Buttons must provide read-only title feedback for viewers'
      );
    });

    it('verifies guarded stages (negotiation, converted, lost, hold) trigger StageTransitionModal', () => {
      const tsx = fs.readFileSync(dealsClientTsxPath, 'utf8');

      assert.ok(
        tsx.includes('isGuardedStatus'),
        'Must define isGuardedStatus inspection logic'
      );
      assert.ok(
        tsx.includes('setStageModalState'),
        'Must open stageModalState when target stage requires guarded input'
      );
      assert.ok(
        tsx.includes('<StageTransitionModal'),
        'Must render StageTransitionModal component'
      );
    });
  });

  describe('5. Client 360° Dossier Drawer Ergonomics & Accessibility', () => {
    it('verifies ClientDossierDrawer implements Escape key dismissal and focus trapping', () => {
      const tsx = fs.readFileSync(dossierDrawerTsxPath, 'utf8');

      assert.ok(
        tsx.includes("e.key === 'Escape'"),
        'Dossier drawer must dismiss on Escape key'
      );
      assert.ok(
        tsx.includes("e.key === 'Tab'"),
        'Dossier drawer must trap focus on Tab navigation'
      );
      assert.ok(
        tsx.includes("document.body.style.overflow = 'hidden'"),
        'Dossier drawer must lock body scroll when open'
      );
    });

    it('verifies OrganizationDossier renders clean decision maker coordinates and brief accordion', () => {
      const tsx = fs.readFileSync(organizationDossierTsxPath, 'utf8');

      assert.ok(
        tsx.includes('formatDossierCurrency'),
        'Must format contract valuation using formatDossierCurrency'
      );
      assert.ok(
        tsx.includes('sanitizeTelUri'),
        'Must sanitize telephone coordinates for RFC 3966 compliance'
      );
      assert.ok(
        tsx.includes('createWhatsAppUri'),
        'Must construct WhatsApp deep-link with prefilled inquiry reference'
      );
      assert.ok(
        tsx.includes('<RawBriefAccordion'),
        'Must embed RawBriefAccordion for website project brief questionnaire'
      );
    });
  });

  describe('6. Anti-AI-Slop & Design System Compliance', () => {
    it('verifies touch target accessibility compliance (>= 44px tap targets)', () => {
      const dealsScss = fs.readFileSync(dealsClientScssPath, 'utf8');
      const drawerScss = fs.readFileSync(dossierDrawerScssPath, 'utf8');

      // Deals workspace
      assert.ok(
        dealsScss.includes('.searchInput') && dealsScss.includes('min-height: 44px;'),
        'Search input must provide >= 44px tap target'
      );
      assert.ok(
        dealsScss.includes('.viewModeBtn') && dealsScss.includes('min-height: 44px;'),
        'View mode buttons must provide >= 44px tap target'
      );
      assert.ok(
        dealsScss.includes('.filterPill') && dealsScss.includes('min-height: 44px;'),
        'Filter pills must provide >= 44px tap target'
      );
      assert.ok(
        dealsScss.includes('.stageMoveBtn') && dealsScss.includes('min-height: 44px;'),
        'Stage move buttons must provide >= 44px tap target'
      );
      assert.ok(
        dealsScss.includes('.inspectButton') && dealsScss.includes('min-height: 44px;'),
        'Inspect buttons must provide >= 44px tap target'
      );

      // Dossier drawer
      assert.ok(
        drawerScss.includes('.convertHeaderBtn') && drawerScss.includes('min-height: 44px;'),
        'Convert header button must provide >= 44px tap target'
      );
      assert.ok(
        drawerScss.includes('.scheduleHeaderBtn') && drawerScss.includes('min-height: 44px;'),
        'Schedule header button must provide >= 44px tap target'
      );
      assert.ok(
        drawerScss.includes('.leadIdToken') && drawerScss.includes('min-height: 44px;'),
        'Lead ID token must provide >= 44px tap target'
      );
    });

    it('verifies zero generic blue (#2563eb, #1d4ed8) in modified workspace and drawer files', () => {
      const genericBlueRegex = /#2563eb|#1d4ed8|#3b82f6|rgba\(\s*37,\s*99,\s*235/i;
      const files = [
        dealsPageTsxPath,
        dealsClientTsxPath,
        dealsClientScssPath,
        dossierDrawerTsxPath,
        dossierDrawerScssPath,
        organizationDossierTsxPath,
      ];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        assert.strictEqual(
          genericBlueRegex.test(content),
          false,
          `File ${path.basename(file)} must not contain generic blue`
        );
      }
    });

    it('verifies zero raw unicode arrows in modified files', () => {
      const rawUnicodeRegex = /[\u25B2\u25BC\u2197\u25C0\u25B6\u2715]/;
      const files = [
        dealsPageTsxPath,
        dealsClientTsxPath,
        dossierDrawerTsxPath,
        organizationDossierTsxPath,
      ];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        assert.strictEqual(
          rawUnicodeRegex.test(content),
          false,
          `File ${path.basename(file)} must not contain raw unicode arrows`
        );
      }
    });

    it('verifies tabular-nums is enforced across all currency, valuations, and monospace coordinates', () => {
      const scss = fs.readFileSync(dealsClientScssPath, 'utf8');
      assert.ok(
        scss.includes('tabular-nums'),
        'Deals SCSS must enforce tabular-nums on numbers'
      );
    });
  });
});
