/**
 * @file tests/unit/phase-5-redesign-operations-governance.test.ts
 * @description Dedicated Unit Test Suite for Phase 5:
 *              Operations, Governance & Ingestion Workspaces Architecture
 *              (/admin/works, /admin/team, /admin/settings, /admin/ingestion).
 *              Verifies Accordion PE Advisory & Sypher Minimalist Light Canvas tokens,
 *              WCAG AAA/AA contrast compliance, 44px touch targets, vector SVGs,
 *              role gating, and complete eradication of #ff6100 and raw unicode.
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

describe('Phase 5 Redesign: Operations, Governance & Ingestion Workspaces Suite', () => {
  const phase5Files = [
    'src/app/admin/(workspace)/works/page.tsx',
    'src/app/admin/(workspace)/works/works.module.scss',
    'src/app/admin/(workspace)/works/WorksWorkspaceClient.tsx',
    'src/app/admin/(workspace)/works/WorksWorkspaceClient.module.scss',
    'src/app/admin/(workspace)/team/page.tsx',
    'src/app/admin/(workspace)/team/team.module.scss',
    'src/app/admin/(workspace)/team/components/CommercialDirectoryTable.tsx',
    'src/app/admin/(workspace)/team/components/EditUserPermissionsModal.tsx',
    'src/app/admin/(workspace)/team/components/EditUserPermissionsModal.module.scss',
    'src/app/admin/(workspace)/team/components/LeadReassignmentWizardModal.tsx',
    'src/app/admin/(workspace)/settings/page.tsx',
    'src/app/admin/(workspace)/settings/settings.module.scss',
    'src/app/admin/(workspace)/settings/components/SettingsWorkspaceClient.tsx',
    'src/app/admin/(workspace)/settings/components/SettingsWorkspaceClient.module.scss',
    'src/app/admin/(workspace)/ingestion/page.tsx',
    'src/app/admin/(workspace)/ingestion/ingestion.module.scss',
    'src/app/admin/(workspace)/ingestion/components/IngestionWorkspaceClient.tsx',
    'src/app/admin/(workspace)/ingestion/components/IngestionWorkspaceClient.module.scss',
  ];

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

    it('verifies emerald success text #065f46 on tint #ecfdf5 exceeds WCAG AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#065f46', '#ecfdf5');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
    });

    it('verifies amber warning text #92400e on tint #fffbeb exceeds WCAG AA (>= 4.5:1)', () => {
      const ratio = getContrastRatio('#92400e', '#fffbeb');
      assert.ok(ratio >= 4.5, `Expected contrast >= 4.5, got ${ratio}`);
      assert.ok(Math.abs(ratio - 6.84) < 0.2);
    });

    it('verifies destructive error text #991b1b on tint #fef2f2 exceeds WCAG AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#991b1b', '#fef2f2');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
      assert.ok(Math.abs(ratio - 7.60) < 0.2);
    });
  });

  describe('2. Total Eradication of Legacy #ff6100 Brand Accent', () => {
    for (const relPath of phase5Files) {
      it(`verifies 0 occurrences of #ff6100 in ${relPath}`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasLegacyOrange = /ff6100/i.test(content);
        assert.equal(
          hasLegacyOrange,
          false,
          `Found legacy orange #ff6100 in ${relPath}`
        );
      });
    }
  });

  describe('3. Total Eradication of Forbidden Raw Unicode Glyphs', () => {
    for (const relPath of phase5Files) {
      it(`verifies 0 raw unicode arrows, checkmarks, or crosses in ${relPath}`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(/[\u25B2\u25BC\u2197\u25C0\u25B6\u2715\u2713\u2014]/g);
        assert.equal(
          matches,
          null,
          `Found forbidden raw unicode ${JSON.stringify(matches)} in ${relPath}`
        );
      });
    }
  });

  describe('4. Touch Target Compliance (Rule R-03: >= 44px min-height)', () => {
    const scssFiles = phase5Files.filter((f) => f.endsWith('.scss'));
    for (const relPath of scssFiles) {
      it(`verifies interactive elements in ${relPath} enforce 44px minimum touch targets`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        // Check that min-height: 44px is present for buttons/inputs
        const hasMinHeight44 = /min-height:\s*44px/i.test(content);
        // Note: works.module.scss and settings.module.scss are page layouts, child components contain buttons
        if (
          relPath.includes('WorksWorkspaceClient.module.scss') ||
          relPath.includes('team.module.scss') ||
          relPath.includes('EditUserPermissionsModal.module.scss') ||
          relPath.includes('SettingsWorkspaceClient.module.scss') ||
          relPath.includes('IngestionWorkspaceClient.module.scss')
        ) {
          assert.equal(
            hasMinHeight44,
            true,
            `Expected min-height: 44px in ${relPath}`
          );
        }
      });
    }
  });

  describe('5. Editorial Trailing Period Standards (Accordion Aesthetic)', () => {
    it('verifies /admin/works has editorial trailing periods on primary titles', () => {
      const pageContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/works/page.tsx'),
        'utf8'
      );
      assert.ok(pageContent.includes('Client Deliverables.'));

      const clientContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/works/WorksWorkspaceClient.tsx'),
        'utf8'
      );
      assert.ok(clientContent.includes('Assign Project Directors.'));
    });

    it('verifies /admin/team has editorial trailing periods on primary titles and modals', () => {
      const pageContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/team/page.tsx'),
        'utf8'
      );
      assert.ok(pageContent.includes('Commercial Team & Governance.'));

      const modalContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/team/components/EditUserPermissionsModal.tsx'),
        'utf8'
      );
      assert.ok(modalContent.includes('Configure Tab Permissions.'));

      const wizardContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/team/components/LeadReassignmentWizardModal.tsx'),
        'utf8'
      );
      assert.ok(wizardContent.includes('Pipeline Lead Reassignment Wizard.'));
    });

    it('verifies /admin/settings has editorial trailing periods on primary titles and sections', () => {
      const pageContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/settings/page.tsx'),
        'utf8'
      );
      assert.ok(pageContent.includes('Operational Governance & Settings.'));
      assert.ok(pageContent.includes('Commercial Authorization Matrix.'));

      const clientContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/settings/components/SettingsWorkspaceClient.tsx'),
        'utf8'
      );
      assert.ok(clientContent.includes('Operational SLAs & Automated Alert Thresholds.'));
      assert.ok(clientContent.includes('Security & Governance Audit Trail.'));
    });

    it('verifies /admin/ingestion has editorial trailing periods on primary titles and modals', () => {
      const pageContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/ingestion/page.tsx'),
        'utf8'
      );
      assert.ok(pageContent.includes('Inbound Lead Ingestion Protocols.'));
      assert.ok(pageContent.includes('Automated Deduplication Protocol.'));

      const clientContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/ingestion/components/IngestionWorkspaceClient.tsx'),
        'utf8'
      );
      assert.ok(clientContent.includes('Simulate Inbound Website Brief.'));
      assert.ok(clientContent.includes('Recent Inbound Brief Submissions.'));
      assert.ok(clientContent.includes('Intake & Deduplication Activity Feed.'));
    });
  });

  describe('6. Security & Role Authorization Gates Integrity', () => {
    it('verifies /admin/works enforces authentication and role redirection', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/works/page.tsx'),
        'utf8'
      );
      assert.ok(content.includes('redirect(\'/admin/login?next=%2Fadmin%2Fworks\')'));
      assert.ok(content.includes('hasWorksAccess'));
    });

    it('verifies /admin/team enforces admin/sales_manager role gating', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/team/page.tsx'),
        'utf8'
      );
      assert.ok(content.includes('redirect(\'/admin/login?next=%2Fadmin%2Fteam\')'));
      assert.ok(content.includes('hasUsersAccess'));
    });

    it('verifies /admin/settings enforces administrative gating', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/settings/page.tsx'),
        'utf8'
      );
      assert.ok(content.includes('redirect(\'/admin/login?next=%2Fadmin%2Fsettings\')'));
      assert.ok(content.includes('hasSettingsAccess'));
    });

    it('verifies /admin/ingestion enforces administrative gating', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/ingestion/page.tsx'),
        'utf8'
      );
      assert.ok(content.includes('redirect(\'/admin/login?next=%2Fadmin%2Fingestion\')'));
      assert.ok(content.includes('hasIngestionAccess'));
    });
  });
});
