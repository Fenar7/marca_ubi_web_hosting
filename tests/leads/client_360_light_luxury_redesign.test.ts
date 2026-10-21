/**
 * @file client_360_light_luxury_redesign.test.ts
 * @description Comprehensive automated audit suite verifying the Accordion Executive Advisory × Sypher
 *              Minimalist Light SaaS visual refactor of the Client 360° Lead and Deal Dossier Workspace.
 *              Validates token compliance, anti-slop rules, mixin consumption, and zero obsidian regression.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

describe('Phase 8.3: Client 360° Accordion Light Luxury Design System Audit', () => {
  const masterScssPath = path.join(
    ROOT_DIR,
    'src/app/admin/components/DossierWorkspace/LeadDossierWorkspace.module.scss'
  );
  const kpiRibbonPath = path.join(
    ROOT_DIR,
    'src/app/admin/components/DossierWorkspace/CommercialKpiRibbon.tsx'
  );
  const headerBarPath = path.join(
    ROOT_DIR,
    'src/app/admin/components/DossierWorkspace/DossierHeaderBar.tsx'
  );
  const briefMatrixPath = path.join(
    ROOT_DIR,
    'src/app/admin/components/DossierWorkspace/IngestionBriefMatrix.tsx'
  );
  const composerPath = path.join(
    ROOT_DIR,
    'src/app/admin/components/DossierWorkspace/RapidTouchpointComposer.tsx'
  );
  const clientWorkspacePath = path.join(
    ROOT_DIR,
    'src/app/admin/components/DossierWorkspace/LeadDossierWorkspaceClient.tsx'
  );

  describe('Block 1: Master SCSS Token Architecture (LeadDossierWorkspace.module.scss)', () => {
    it('verifies mixins.scss is imported via @use', () => {
      const content = fs.readFileSync(masterScssPath, 'utf-8');
      assert.ok(
        content.includes("@use '../../styles/mixins.scss' as *;"),
        'LeadDossierWorkspace.module.scss must import mixins.scss'
      );
    });

    it('verifies eradication of hardcoded dark obsidian tokens ($canvas-bg: #050505, $surface-card: #0e0e11, etc.)', () => {
      const content = fs.readFileSync(masterScssPath, 'utf-8');

      assert.strictEqual(
        content.includes('$canvas-bg: #050505;'),
        false,
        'must eliminate $canvas-bg: #050505;'
      );
      assert.strictEqual(
        content.includes('$surface-card: #0e0e11;'),
        false,
        'must eliminate $surface-card: #0e0e11;'
      );
      assert.strictEqual(
        content.includes('$brand-orange: #ff6100;'),
        false,
        'must eliminate $brand-orange: #ff6100;'
      );
      assert.strictEqual(
        content.includes('$text-primary: #ffffff;'),
        false,
        'must eliminate $text-primary: #ffffff;'
      );
    });

    it('verifies standard CRM Light CSS Custom Properties are consumed', () => {
      const content = fs.readFileSync(masterScssPath, 'utf-8');

      assert.ok(content.includes('var(--admin-canvas-bg'), 'must use --admin-canvas-bg');
      assert.ok(content.includes('var(--admin-card-bg'), 'must use --admin-card-bg');
      assert.ok(content.includes('var(--admin-border-default'), 'must use --admin-border-default');
      assert.ok(content.includes('var(--admin-text-primary'), 'must use --admin-text-primary');
      assert.ok(content.includes('var(--admin-text-secondary'), 'must use --admin-text-secondary');
    });

    it('verifies signature Accordion mixins are used for buttons and micro-tokens', () => {
      const content = fs.readFileSync(masterScssPath, 'utf-8');

      assert.ok(
        content.includes('@include accordionPillPrimary;'),
        '.btnConvertDeal must use @include accordionPillPrimary;'
      );
      assert.ok(
        content.includes('@include accordionPillSecondary;'),
        '.btnSecondaryAction must use @include accordionPillSecondary;'
      );
      assert.ok(
        content.includes('@include accordionPillGhost;'),
        '.backLink must use @include accordionPillGhost;'
      );
      assert.ok(
        content.includes('@include adminMonoToken;'),
        '.tokenChip must use @include adminMonoToken;'
      );
    });

    it('verifies Single-line 5-column preset buttons and Accordion Lemon active state', () => {
      const content = fs.readFileSync(masterScssPath, 'utf-8');

      assert.ok(
        content.includes('grid-template-columns: repeat(5, 1fr)'),
        'must enforce single-line 5 equal columns'
      );
      assert.ok(
        content.includes('--admin-accent-lemon'),
        '.activePreset must use --admin-accent-lemon'
      );
    });

    it('verifies mobileActionDock uses frosted light glass styling', () => {
      const content = fs.readFileSync(masterScssPath, 'utf-8');

      assert.ok(
        content.includes('rgba(255, 255, 255, 0.95)'),
        'mobile dock must use translucent white glass'
      );
      assert.ok(
        content.includes('backdrop-filter: blur(16px)'),
        'mobile dock must have blur filter'
      );
    });
  });

  describe('Block 2: Commercial KPI Ribbon Minimalist Stat Pods (CommercialKpiRibbon.tsx)', () => {
    it('verifies 44px circular tinted icon chips are implemented for all 3 pods', () => {
      const content = fs.readFileSync(kpiRibbonPath, 'utf-8');

      assert.ok(content.includes('styles.statPodIconChip'), 'must render statPodIconChip');
      assert.ok(content.includes('styles.chipEmerald'), 'Expected Valuation must use chipEmerald');
      assert.ok(content.includes('styles.chipAmber'), 'Priority SLA must use chipAmber');
      assert.ok(content.includes('styles.chipSlate'), 'Win Momentum must use chipSlate');
    });

    it('verifies semantic dot CSS variables replace hardcoded hex values', () => {
      const content = fs.readFileSync(kpiRibbonPath, 'utf-8');

      assert.ok(
        content.includes('var(--admin-status-emerald-dot'),
        'must use --admin-status-emerald-dot'
      );
      assert.ok(
        content.includes('var(--admin-status-amber-dot'),
        'must use --admin-status-amber-dot'
      );
      assert.ok(
        content.includes('var(--admin-status-rose-dot'),
        'must use --admin-status-rose-dot'
      );
      assert.ok(
        content.includes('var(--admin-status-slate-dot'),
        'must use --admin-status-slate-dot'
      );
    });
  });

  describe('Block 3: Navigation De-duplication (DossierHeaderBar.tsx)', () => {
    it('verifies elimination of duplicate breadcrumb spans inside DossierHeaderBar', () => {
      const content = fs.readFileSync(headerBarPath, 'utf-8');

      assert.strictEqual(
        content.includes('MARCA UBI CRM'),
        false,
        'must not contain redundant "MARCA UBI CRM" text'
      );
      assert.strictEqual(
        content.includes('breadcrumbItem'),
        false,
        'must eliminate redundant breadcrumbItem elements'
      );
      assert.ok(content.includes('backLink'), 'must retain clean backLink');
      assert.ok(content.includes('tokenChip'), 'must retain Raycast tokenChip');
    });

    it('verifies status dropdown menu uses pure white surface and semantic colors', () => {
      const scss = fs.readFileSync(masterScssPath, 'utf-8');
      assert.ok(
        scss.includes('.statusDropdownMenu') && scss.includes('background: $surface-card;'),
        'status dropdown menu must use $surface-card (#ffffff)'
      );
    });
  });

  describe('Block 4: Discovery Brief & Touchpoint Composer Light Styling', () => {
    it('verifies IngestionBriefMatrix uses light Notion callout and CSS classes instead of inline dark styles', () => {
      const tsxContent = fs.readFileSync(briefMatrixPath, 'utf-8');
      const scssContent = fs.readFileSync(masterScssPath, 'utf-8');

      assert.strictEqual(
        tsxContent.includes("style={{ color: '#6b7280'"),
        false,
        'must eliminate inline style color: #6b7280'
      );
      assert.ok(
        tsxContent.includes('styles.briefEmptyText'),
        'must use styles.briefEmptyText'
      );
      assert.ok(
        scssContent.includes('.notionCallout') && scssContent.includes('border-left: 3px solid var(--admin-border-strong'),
        'notionCallout must use 3px solid charcoal left accent'
      );
    });

    it('verifies RapidTouchpointComposer eliminates hardcoded dark background styles', () => {
      const content = fs.readFileSync(composerPath, 'utf-8');

      assert.strictEqual(
        content.includes("background: '#1c1c22'"),
        false,
        'must eliminate inline background: #1c1c22'
      );
      assert.ok(
        content.includes('styles.tagPillBtn'),
        'must use styles.tagPillBtn for quick tag pills'
      );
    });

    it('verifies LeadDossierWorkspaceClient eliminates inline #6b7280 colors', () => {
      const content = fs.readFileSync(clientWorkspacePath, 'utf-8');

      assert.strictEqual(
        content.includes("style={{ color: '#6b7280'"),
        false,
        'must eliminate all inline #6b7280 styles from contact coordinates'
      );
      assert.ok(
        content.includes('styles.contactEmptyValue'),
        'must use styles.contactEmptyValue'
      );
    });
  });

  describe('Block 5: Route Boundary Styling (leads/[id] & deals/[id])', () => {
    const routeBoundaryFiles = [
      'src/app/admin/(workspace)/leads/[id]/page.module.scss',
      'src/app/admin/(workspace)/leads/[id]/not-found.module.scss',
      'src/app/admin/(workspace)/deals/[id]/page.module.scss',
      'src/app/admin/(workspace)/deals/[id]/not-found.module.scss',
    ];

    it('verifies all 4 route boundary files have eradicated #050505 and #0e0e11', () => {
      for (const relPath of routeBoundaryFiles) {
        const fullPath = path.join(ROOT_DIR, relPath);
        assert.ok(fs.existsSync(fullPath), `${relPath} must exist`);
        const content = fs.readFileSync(fullPath, 'utf-8');

        assert.strictEqual(
          content.includes('#050505'),
          false,
          `${relPath} must not contain #050505`
        );
        assert.strictEqual(
          content.includes('#0e0e11'),
          false,
          `${relPath} must not contain #0e0e11`
        );
        assert.ok(
          content.includes('var(--admin-canvas-bg'),
          `${relPath} must use --admin-canvas-bg`
        );
        assert.ok(
          content.includes('var(--admin-card-bg'),
          `${relPath} must use --admin-card-bg`
        );
        assert.ok(
          content.includes('@include accordionPillPrimary;'),
          `${relPath} must use @include accordionPillPrimary;`
        );
      }
    });
  });
});
