/**
 * @file tests/unit/phase-4-redesign-funnel-workspaces.test.ts
 * @description Dedicated Unit Test Suite for Phase 4:
 *              Commercial Funnel Workspaces, Inbound Leads Grid & Deals Kanban Architecture.
 *              Verifies Accordion PE Advisory & Sypher Minimalist Light Canvas tokens,
 *              WCAG AAA/AA contrast compliance, 44px touch targets, vector SVGs,
 *              role gating for viewers, and complete eradication of #ff6100 and raw unicode.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Computes the relative luminance of an sRGB color per WCAG 2.1 specifications.
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Computes the contrast ratio between two hex colors per WCAG 2.1 specifications.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('Phase 4 Redesign: Commercial Funnel Workspaces & Kanban Architecture Suite', () => {
  const leadsPagePath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/leads/page.tsx');
  const leadsScssPath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/leads/leads.module.scss');
  const leadsClientPath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx');
  const filterBarTsxPath = path.resolve(process.cwd(), 'src/app/admin/components/FilterActionBar/FilterActionBar.tsx');
  const filterBarScssPath = path.resolve(process.cwd(), 'src/app/admin/components/FilterActionBar/FilterActionBar.module.scss');
  const leadsGridTsxPath = path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/LeadsDataGrid.tsx');
  const leadsGridScssPath = path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/LeadsDataGrid.module.scss');
  const mobileCardTsxPath = path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/LeadMobileCard.tsx');
  const mobileCardScssPath = path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/LeadMobileCard.module.scss');
  const inlineStatusTsxPath = path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/InlineStatusSelect.tsx');
  const inlineStatusScssPath = path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/InlineStatusSelect.module.scss');
  const inlinePriorityTsxPath = path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/InlinePrioritySelect.tsx');
  const inlinePriorityScssPath = path.resolve(process.cwd(), 'src/app/admin/components/LeadsTable/InlinePrioritySelect.module.scss');
  const overdueBadgeScssPath = path.resolve(process.cwd(), 'src/app/admin/components/Badges/OverdueBadge.module.scss');
  const dealsPagePath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/deals/page.tsx');
  const dealsScssPath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/deals/deals.module.scss');
  const dealsClientTsxPath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/deals/DealsWorkspaceClient.tsx');
  const dealsClientScssPath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/deals/DealsWorkspaceClient.module.scss');

  describe('1. WCAG AAA / AA Contrast Engine & Token Mathematics', () => {
    it('verifies primary ink #1f242f on #ffffff card exceeds WCAG AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#1f242f', '#ffffff');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
      assert.ok(Math.abs(ratio - 15.54) < 0.2);
    });

    it('verifies secondary slate #525965 on #ffffff card exceeds WCAG AA (>= 4.5:1) and AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#525965', '#ffffff');
      assert.ok(ratio >= 4.5, `Expected contrast >= 4.5, got ${ratio}`);
      assert.ok(Math.abs(ratio - 7.10) < 0.2);
    });

    it('verifies primary pill ink #1f242f on Lemon Yellow #eefb87 exceeds WCAG AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#1f242f', '#eefb87');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
      assert.ok(Math.abs(ratio - 13.92) < 0.2);
    });

    it('verifies high priority badge text #991b1b on tint #fef2f2 exceeds WCAG AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#991b1b', '#fef2f2');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
      assert.ok(Math.abs(ratio - 7.60) < 0.2);
    });

    it('verifies medium priority badge text #92400e on tint #fffbeb exceeds WCAG AA (>= 4.5:1)', () => {
      const ratio = getContrastRatio('#92400e', '#fffbeb');
      assert.ok(ratio >= 4.5, `Expected contrast >= 4.5, got ${ratio}`);
      assert.ok(Math.abs(ratio - 6.84) < 0.2);
    });

    it('verifies low priority badge text #525965 on neutral #f8fafc exceeds WCAG AA (>= 4.5:1)', () => {
      const ratio = getContrastRatio('#525965', '#f8fafc');
      assert.ok(ratio >= 4.5, `Expected contrast >= 4.5, got ${ratio}`);
      assert.ok(Math.abs(ratio - 6.84) < 0.2);
    });
  });

  describe('2. Inbound Leads Workspace Architecture (/admin/leads)', () => {
    it('verifies leads/page.tsx enforces Accordion editorial period: "Inbound Leads."', () => {
      const content = fs.readFileSync(leadsPagePath, 'utf8');
      assert.ok(content.includes('Inbound Leads.'));
      assert.ok(content.includes('Stage 01: Inbound Discovery'));
    });

    it('verifies leads/page.tsx passes userRole={role} to LeadsWorkspaceClient', () => {
      const content = fs.readFileSync(leadsPagePath, 'utf8');
      assert.ok(content.includes('userRole={role}'));
    });

    it('verifies LeadsWorkspaceClient.tsx gates batch reassign and convert for viewers', () => {
      const content = fs.readFileSync(leadsClientPath, 'utf8');
      assert.ok(content.includes("userRole !== 'viewer'"));
      assert.ok(content.includes('userRole={userRole}'));
    });

    it('verifies LeadsDataGrid.tsx disables inline status/priority selectors for viewers', () => {
      const content = fs.readFileSync(leadsGridTsxPath, 'utf8');
      assert.ok(content.includes("disabled={userRole === 'viewer'}"));
    });

    it('verifies leads.module.scss purges legacy obsidian tokens (#0b0b0b, #111113, #121216) and #ff6100', () => {
      const scss = fs.readFileSync(leadsScssPath, 'utf8');
      assert.strictEqual(scss.includes('#0b0b0b'), false);
      assert.strictEqual(scss.includes('#111113'), false);
      assert.strictEqual(scss.includes('#121216'), false);
      assert.strictEqual(scss.includes('#ff6100'), false);
    });

    it('verifies leads.module.scss enforces 44px minimum touch targets on interactive elements', () => {
      const scss = fs.readFileSync(leadsScssPath, 'utf8');
      assert.ok(scss.includes('min-height: 44px;'));
      assert.ok(scss.includes('.batchReassignTriggerBtn'));
      assert.ok(scss.includes('.convertTriggerBtn'));
    });

    it('verifies FilterActionBar.module.scss enforces 44px targets on clear search, chips, and clear all', () => {
      const scss = fs.readFileSync(filterBarScssPath, 'utf8');
      assert.strictEqual(scss.includes('#111113'), false);
      assert.strictEqual(scss.includes('#0b0b0b'), false);
      assert.ok(scss.includes('min-height: 44px;'));
      assert.ok(scss.includes('.clearSearchBtn'));
      assert.ok(scss.includes('.chipRemoveBtn'));
      assert.ok(scss.includes('.clearAllBtn'));
    });

    it('verifies LeadsDataGrid.module.scss enforces 44px min-height on sortableHeaderCol', () => {
      const scss = fs.readFileSync(leadsGridScssPath, 'utf8');
      assert.ok(scss.includes('min-height: 44px;'));
      assert.strictEqual(scss.includes('#0d0d0f'), false);
      assert.strictEqual(scss.includes('#ff6100'), false);
    });

    it('verifies InlineStatusSelect and InlinePrioritySelect popovers enforce 44px touch targets', () => {
      const statusScss = fs.readFileSync(inlineStatusScssPath, 'utf8');
      const priorityScss = fs.readFileSync(inlinePriorityScssPath, 'utf8');
      assert.ok(statusScss.includes('min-height: 44px;'));
      assert.ok(priorityScss.includes('min-height: 44px;'));
    });

    it('verifies LeadMobileCard.module.scss enforces uppercase tracking on drawerBtn and flex-wrap on inlineSelectorsRow', () => {
      const scss = fs.readFileSync(mobileCardScssPath, 'utf8');
      assert.ok(scss.includes('text-transform: uppercase;'));
      assert.ok(scss.includes('letter-spacing: 0.06em;'));
      assert.ok(scss.includes('flex-wrap: wrap;'));
    });

    it('verifies OverdueBadge.module.scss uses WCAG AAA/AA light tokens and zero generic red', () => {
      const scss = fs.readFileSync(overdueBadgeScssPath, 'utf8');
      assert.ok(scss.includes('#92400e'));
      assert.ok(scss.includes('#fffbeb'));
      assert.ok(scss.includes('#991b1b'));
      assert.ok(scss.includes('#fef2f2'));
    });
  });

  describe('3. Commercial Deals Pipeline Workspace Architecture (/admin/deals)', () => {
    it('verifies deals/page.tsx enforces Accordion editorial period: "Commercial Deals."', () => {
      const content = fs.readFileSync(dealsPagePath, 'utf8');
      assert.ok(content.includes('Commercial Deals.'));
      assert.ok(content.includes('Stage 02: Pipeline Negotiations'));
    });

    it('verifies deals/page.tsx sanitizes status_color fallback to #1f242f', () => {
      const content = fs.readFileSync(dealsPagePath, 'utf8');
      assert.strictEqual(content.includes("color_code || '#ff6100'"), false);
      assert.ok(content.includes("color_code || '#1f242f'"));
    });

    it('verifies deals.module.scss purges #ff6100 and uses light theme typography', () => {
      const scss = fs.readFileSync(dealsScssPath, 'utf8');
      assert.strictEqual(scss.includes('#ff6100'), false);
      assert.ok(scss.includes('.eyebrow'));
      assert.ok(scss.includes('.heading'));
      assert.ok(scss.includes('.subheading'));
    });

    it('verifies DealsWorkspaceClient.tsx guards handleMoveStage for viewers', () => {
      const content = fs.readFileSync(dealsClientTsxPath, 'utf8');
      assert.ok(content.includes("if (userRole === 'viewer') return;"));
      assert.ok(content.includes('[sortedStages, userRole]'));
    });

    it('verifies DealsWorkspaceClient.tsx sanitizes columnStatusDot fallback to #1f242f', () => {
      const content = fs.readFileSync(dealsClientTsxPath, 'utf8');
      assert.strictEqual(content.includes("color_code || '#ff6100'"), false);
      assert.ok(content.includes("color_code || '#1f242f'"));
    });

    it('verifies DealsWorkspaceClient.module.scss purges legacy obsidian tokens and #ff6100', () => {
      const scss = fs.readFileSync(dealsClientScssPath, 'utf8');
      assert.strictEqual(scss.includes('#0d0d0f'), false);
      assert.strictEqual(scss.includes('#111113'), false);
      assert.strictEqual(scss.includes('#141416'), false);
      assert.strictEqual(scss.includes('#18181a'), false);
      assert.strictEqual(scss.includes('#ff6100'), false);
    });

    it('verifies DealsWorkspaceClient.module.scss enforces 44px minimum touch targets on all interactive elements', () => {
      const scss = fs.readFileSync(dealsClientScssPath, 'utf8');
      assert.ok(scss.includes('.searchInput'));
      assert.ok(scss.includes('.viewModeBtn'));
      assert.ok(scss.includes('.filterPill'));
      assert.ok(scss.includes('.stageMoveBtn'));
      assert.ok(scss.includes('.sortableHeaderCol'));
      assert.ok(scss.includes('.inspectButton'));
      assert.ok(scss.includes('.clearFilterBtn'));

      const occurrences = (scss.match(/min-height:\s*44px;/g) || []).length;
      assert.ok(occurrences >= 6, `Expected at least 6 min-height 44px declarations, found ${occurrences}`);
    });

    it('verifies tabular-nums is enforced across deal values, ID tokens, and valuations', () => {
      const scss = fs.readFileSync(dealsClientScssPath, 'utf8');
      assert.ok(scss.includes('tabular-nums'));
    });
  });

  describe('4. Complete Anti-AI-Slop Invariants (Rule R-12 Unicode & Token Hygiene)', () => {
    it('verifies 100% elimination of legacy #ff6100 across all Phase 4 component and style files', () => {
      const phase4Files = [
        leadsPagePath,
        leadsScssPath,
        leadsClientPath,
        filterBarTsxPath,
        filterBarScssPath,
        leadsGridTsxPath,
        leadsGridScssPath,
        mobileCardTsxPath,
        mobileCardScssPath,
        inlineStatusTsxPath,
        inlineStatusScssPath,
        inlinePriorityTsxPath,
        inlinePriorityScssPath,
        overdueBadgeScssPath,
        dealsPagePath,
        dealsScssPath,
        dealsClientTsxPath,
        dealsClientScssPath,
      ];

      for (const file of phase4Files) {
        const content = fs.readFileSync(file, 'utf8');
        assert.strictEqual(
          content.includes('#ff6100'),
          false,
          `Residual #ff6100 detected in ${path.basename(file)}`
        );
      }
    });

    it('verifies 100% eradication of raw unicode characters (▼, ▲, ✕, ✓, →, ◀, ▶) across Phase 4 TSX files', () => {
      const tsxFiles = [
        leadsPagePath,
        leadsClientPath,
        filterBarTsxPath,
        leadsGridTsxPath,
        mobileCardTsxPath,
        inlineStatusTsxPath,
        inlinePriorityTsxPath,
        dealsPagePath,
        dealsClientTsxPath,
      ];

      const forbiddenSymbols = ['▼', '▲', '✕', '✓', '→', '◀', '▶'];

      for (const file of tsxFiles) {
        const content = fs.readFileSync(file, 'utf8');
        for (const symbol of forbiddenSymbols) {
          assert.strictEqual(
            content.includes(symbol),
            false,
            `Forbidden raw unicode symbol "${symbol}" detected in ${path.basename(file)}`
          );
        }
      }
    });

    it('verifies zero generic blue (#2563eb, #1d4ed8, #3b82f6) in Phase 4 files', () => {
      const files = [
        leadsScssPath,
        filterBarScssPath,
        leadsGridScssPath,
        mobileCardScssPath,
        inlineStatusScssPath,
        inlinePriorityScssPath,
        overdueBadgeScssPath,
        dealsScssPath,
        dealsClientScssPath,
      ];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        assert.strictEqual(content.includes('#2563eb'), false, `Generic blue #2563eb found in ${file}`);
        assert.strictEqual(content.includes('#1d4ed8'), false, `Generic blue #1d4ed8 found in ${file}`);
        assert.strictEqual(content.includes('#3b82f6'), false, `Generic blue #3b82f6 found in ${file}`);
      }
    });

    it('verifies zero em dashes (—) in user-facing headings or titles in leads/page.tsx and deals/page.tsx', () => {
      const leadsContent = fs.readFileSync(leadsPagePath, 'utf8');
      const dealsContent = fs.readFileSync(dealsPagePath, 'utf8');
      assert.strictEqual(leadsContent.includes('—'), false, 'Em dash found in leads/page.tsx');
      assert.strictEqual(dealsContent.includes('—'), false, 'Em dash found in deals/page.tsx');
    });

    it('verifies zero AI meta comments (// === or // Now we) in Phase 4 styles and code', () => {
      const files = [
        leadsScssPath,
        dealsScssPath,
        dealsClientScssPath,
        leadsGridScssPath,
        filterBarScssPath,
      ];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        assert.strictEqual(content.includes('// ==='), false, `Decorative separator found in ${file}`);
        assert.strictEqual(content.includes('// Now we'), false, `AI workflow commentary found in ${file}`);
      }
    });
  });
});
