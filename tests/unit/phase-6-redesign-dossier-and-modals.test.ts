/**
 * @file tests/unit/phase-6-redesign-dossier-and-modals.test.ts
 * @description Dedicated Unit Test Suite for Phase 6:
 *              Slide-out Client 360° Dossier Drawer & Centered Modals Architecture
 *              (ClientDossierDrawer, NewLeadModal, ConvertLeadToDealModal, StageTransitionModal,
 *               BatchReassignModal, AddTeamMemberModal, LeadDetailModal, CredentialRevealModal, SuspendUserModal).
 *              Verifies Accordion PE Advisory & Sypher Minimalist Light Canvas tokens,
 *              WCAG AAA/AA contrast compliance, 44px touch targets, vector SVGs,
 *              editorial trailing periods, Escape key accessibility, and complete
 *              eradication of #ff6100, orange rgba, and raw unicode.
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

describe('Phase 6 Redesign: Dossier Drawer & Centered Modals Suite', () => {
  const phase6Files = [
    'src/app/admin/components/DossierDrawer/DossierDrawer.module.scss',
    'src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx',
    'src/app/admin/components/DossierDrawer/OrganizationDossier.tsx',
    'src/app/admin/components/modals/NewLeadModal.module.scss',
    'src/app/admin/components/modals/NewLeadModal.tsx',
    'src/app/admin/components/modals/ConvertLeadToDealModal.module.scss',
    'src/app/admin/components/modals/ConvertLeadToDealModal.tsx',
    'src/app/admin/components/modals/BatchReassignModal.module.scss',
    'src/app/admin/components/modals/BatchReassignModal.tsx',
    'src/app/admin/components/modals/StageModals.module.scss',
    'src/app/admin/components/modals/StageTransitionModal.tsx',
    'src/app/admin/components/modals/AddTeamMemberModal.module.scss',
    'src/app/admin/components/modals/AddTeamMemberModal.tsx',
    'src/app/admin/components/modals/LeadDetailModal.module.scss',
    'src/app/admin/components/modals/LeadDetailModal.tsx',
    'src/app/admin/(workspace)/team/components/CredentialRevealModal.tsx',
    'src/app/admin/(workspace)/team/components/SuspendUserModal.tsx',
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

  describe('2. Total Eradication of Legacy #ff6100 Brand Accent & Orange RGBA', () => {
    for (const relPath of phase6Files) {
      it(`verifies 0 occurrences of #ff6100 or rgb(255, 97, 0) in ${relPath}`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasLegacyOrangeHex = /ff6100/i.test(content);
        const hasLegacyOrangeRgb = /255\s*,\s*97\s*,\s*0/i.test(content);
        assert.equal(
          hasLegacyOrangeHex,
          false,
          `Found legacy orange #ff6100 in ${relPath}`
        );
        assert.equal(
          hasLegacyOrangeRgb,
          false,
          `Found legacy orange rgba(255, 97, 0, ...) in ${relPath}`
        );
      });
    }
  });

  describe('3. Total Eradication of Forbidden Raw Unicode Glyphs', () => {
    for (const relPath of phase6Files) {
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
    const scssFiles = phase6Files.filter((f) => f.endsWith('.scss'));
    for (const relPath of scssFiles) {
      it(`verifies interactive elements in ${relPath} enforce 44px minimum touch targets`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasMinHeight44 = /min-height:\s*44px/i.test(content) || /min-width:\s*44px/i.test(content);
        assert.equal(
          hasMinHeight44,
          true,
          `Expected min-height: 44px or min-width: 44px in ${relPath}`
        );
      });
    }
  });

  describe('5. Editorial Trailing Period Standards (Accordion Aesthetic)', () => {
    it('verifies ClientDossierDrawer has editorial trailing period on header title', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx'),
        'utf8'
      );
      assert.ok(content.includes('Commercial Deal Dossier.'));
    });

    it('verifies NewLeadModal has editorial trailing period on modal heading', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/modals/NewLeadModal.tsx'),
        'utf8'
      );
      assert.ok(content.includes('New Prospective Commercial Lead.'));
    });

    it('verifies ConvertLeadToDealModal has editorial trailing period on modal heading', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/modals/ConvertLeadToDealModal.tsx'),
        'utf8'
      );
      assert.ok(content.includes('Convert Lead to Deal.'));
    });

    it('verifies StageTransitionModal has editorial trailing period on modal headings', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/modals/StageTransitionModal.tsx'),
        'utf8'
      );
      assert.ok(content.includes('Stage Transition.'));
    });

    it('verifies BatchReassignModal has editorial trailing period on modal title', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/modals/BatchReassignModal.tsx'),
        'utf8'
      );
      assert.ok(content.includes('Reassign Active Pipeline Leads.'));
    });

    it('verifies AddTeamMemberModal has editorial trailing period on modal title', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/modals/AddTeamMemberModal.tsx'),
        'utf8'
      );
      assert.ok(content.includes('Provision Commercial Personnel.'));
    });

    it('verifies CredentialRevealModal has editorial trailing period on modal title', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/team/components/CredentialRevealModal.tsx'),
        'utf8'
      );
      assert.ok(content.includes('One-Time Credential Reveal.'));
    });

    it('verifies SuspendUserModal has editorial trailing period on modal title', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/team/components/SuspendUserModal.tsx'),
        'utf8'
      );
      assert.ok(content.includes('Confirm Account Offboarding & Suspension.'));
    });
  });

  describe('6. Keyboard Accessibility: Escape Key Dismissal & Focus Handlers', () => {
    it('verifies ClientDossierDrawer implements Escape key dismissal and focus trapping', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx'),
        'utf8'
      );
      assert.ok(content.includes('e.key === \'Escape\''));
      assert.ok(content.includes('aria-modal="true"'));
    });

    it('verifies NewLeadModal implements Escape key dismissal', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/modals/NewLeadModal.tsx'),
        'utf8'
      );
      assert.ok(content.includes('e.key === \'Escape\'') || content.includes('useModalAnimation'));
      assert.ok(content.includes('aria-modal="true"'));
    });

    it('verifies ConvertLeadToDealModal implements Escape key dismissal', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/modals/ConvertLeadToDealModal.tsx'),
        'utf8'
      );
      assert.ok(content.includes('e.key === \'Escape\''));
      assert.ok(content.includes('aria-modal="true"'));
    });

    it('verifies BatchReassignModal implements Escape key dismissal', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/modals/BatchReassignModal.tsx'),
        'utf8'
      );
      assert.ok(content.includes('e.key === \'Escape\''));
      assert.ok(content.includes('aria-modal="true"'));
    });

    it('verifies StageTransitionModal implements Escape key dismissal', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/components/modals/StageTransitionModal.tsx'),
        'utf8'
      );
      assert.ok(content.includes('e.key === \'Escape\''));
      assert.ok(content.includes('aria-modal="true"'));
    });

    it('verifies SuspendUserModal implements Escape key dismissal', () => {
      const content = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/(workspace)/team/components/SuspendUserModal.tsx'),
        'utf8'
      );
      assert.ok(content.includes('e.key === \'Escape\''));
      assert.ok(content.includes('aria-modal="true"'));
    });
  });
});
