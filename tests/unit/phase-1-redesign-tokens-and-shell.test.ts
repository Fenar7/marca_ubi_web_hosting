/**
 * @file tests/unit/phase-1-redesign-tokens-and-shell.test.ts
 * @description Dedicated Unit Test Suite for Phase 1:
 *              Typography Bindings, Master Light Tokens, Anti-Slop Cleansing & Shell Isolation.
 *              Strictly adheres to node:test and node:assert/strict standards.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { NAVIGATION_GROUPS } from '../../src/app/admin/components/layout/navigationConfig';

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

describe('Phase 1 Redesign: Typography, Master Tokens & Workspace Shell Suite', () => {
  describe('1. Next.js Local Font Bindings (Messina Family)', () => {
    const fontsSourcePath = path.resolve(process.cwd(), 'src/app/admin/fonts.ts');

    it('verifies fonts.ts exports adminSans with CSS variable --font-admin-sans', () => {
      assert.strictEqual(fs.existsSync(fontsSourcePath), true);
      const content = fs.readFileSync(fontsSourcePath, 'utf8');
      assert.ok(content.includes('export const adminSans = localFont('));
      assert.ok(content.includes("variable: '--font-admin-sans'"));
      assert.ok(content.includes("display: 'swap'"));
    });

    it('verifies fonts.ts exports adminButtonFont with CSS variable --font-admin-button', () => {
      const content = fs.readFileSync(fontsSourcePath, 'utf8');
      assert.ok(content.includes('export const adminButtonFont = localFont('));
      assert.ok(content.includes("variable: '--font-admin-button'"));
      assert.ok(content.includes("display: 'swap'"));
    });

    it('verifies fonts.ts exports adminMono with CSS variable --font-admin-mono', () => {
      const content = fs.readFileSync(fontsSourcePath, 'utf8');
      assert.ok(content.includes('export const adminMono = localFont('));
      assert.ok(content.includes("variable: '--font-admin-mono'"));
      assert.ok(content.includes("display: 'swap'"));
    });

    it('verifies physical existence of all configured font files on disk', () => {
      const publicFontsDir = path.resolve(process.cwd(), 'public/fonts');
      
      const requiredFiles = [
        'MessinaSans/MessinaSans-Light.ttf',
        'MessinaSans/MessinaSans-Book.ttf',
        'MessinaSans/MessinaSans-Regular.ttf',
        'MessinaSans/MessinaSans-SemiBold.ttf',
        'MessinaSans/MessinaSans-Bold.ttf',
        'MessinaSans/MessinaSans-Black.ttf',
        'MessinaSansBook/MessinaSansMono-Book.ttf',
        'MessinaSansBook/MessinaSansMono-Regular.ttf',
        'MessinaSansBook/MessinaSansMono-SemiBold.ttf',
        'MessinaSansBook/MessinaSansMono-Bold.ttf',
      ];

      for (const relPath of requiredFiles) {
        const fullPath = path.join(publicFontsDir, relPath);
        assert.strictEqual(
          fs.existsSync(fullPath),
          true,
          `Font file missing from repository: ${relPath}`
        );
      }
    });
  });

  describe('2. Master Design Token Scoping & CSS Custom Properties', () => {
    const tokensScssPath = path.resolve(process.cwd(), 'src/app/admin/styles/tokens.scss');

    it('verifies tokens.scss exists and is strictly scoped to [data-admin-root="true"]', () => {
      assert.strictEqual(fs.existsSync(tokensScssPath), true);
      const content = fs.readFileSync(tokensScssPath, 'utf8');
      assert.ok(content.includes('[data-admin-root="true"]'));
      assert.strictEqual(content.includes(':root {'), false);
    });

    it('declares all core palette tokens in tokens.scss', () => {
      const content = fs.readFileSync(tokensScssPath, 'utf8');
      assert.ok(content.includes('--admin-canvas-bg: #f7f8fa'));
      assert.ok(content.includes('--admin-card-bg: #ffffff'));
      assert.ok(content.includes('--admin-text-primary: #1f242f'));
      assert.ok(content.includes('--admin-text-secondary: #525965'));
      assert.ok(content.includes('--admin-accent-lemon: #eefb87'));
      assert.ok(content.includes('--admin-border-strong: #1f242f'));
      assert.ok(content.includes('--admin-radius-pill: 9999px'));
    });

    it('declares the Accordion button mixins in mixins.scss and forwards them in tokens.scss', () => {
      const tokensContent = fs.readFileSync(tokensScssPath, 'utf8');
      assert.ok(tokensContent.includes("@forward './mixins';"));

      const mixinsScssPath = path.resolve(process.cwd(), 'src/app/admin/styles/mixins.scss');
      assert.strictEqual(fs.existsSync(mixinsScssPath), true);
      const mixinsContent = fs.readFileSync(mixinsScssPath, 'utf8');
      assert.ok(mixinsContent.includes('@mixin accordionPillPrimary'));
      assert.ok(mixinsContent.includes('@mixin accordionPillSecondary'));
    });
  });

  describe('3. WCAG AAA Contrast Ratio Engine & Invariants', () => {
    it('verifies #1f242f on #ffffff exceeds WCAG AAA standard (>= 7:1)', () => {
      const ratio = getContrastRatio('#1f242f', '#ffffff');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
      assert.ok(Math.abs(ratio - 15.54) < 0.2);
    });

    it('verifies #525965 on #ffffff exceeds WCAG AA standard (>= 4.5:1) and AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#525965', '#ffffff');
      assert.ok(ratio >= 4.5, `Expected contrast >= 4.5, got ${ratio}`);
      assert.ok(Math.abs(ratio - 7.10) < 0.2);
    });

    it('verifies #1f242f on Lemon Yellow #eefb87 exceeds WCAG AAA standard (>= 7:1)', () => {
      const ratio = getContrastRatio('#1f242f', '#eefb87');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
      assert.ok(Math.abs(ratio - 13.92) < 0.2);
    });

    it('strictly proves that white text #ffffff on Lemon Yellow #eefb87 FAILS (< 4.5:1)', () => {
      const ratio = getContrastRatio('#ffffff', '#eefb87');
      assert.ok(ratio < 4.5, `Expected failure (< 4.5), got ${ratio}`);
      assert.ok(Math.abs(ratio - 1.12) < 0.2);
    });
  });

  describe('4. Navigation Taxonomy & Anti-Slop Cleansing', () => {
    it('confirms "Command Center" is purged and replaced with "Executive Overview"', () => {
      const commercialGroup = NAVIGATION_GROUPS.find((g) => g.groupTitle === 'Commercial Pipeline');
      assert.ok(commercialGroup, 'Commercial Pipeline group must exist');

      const overviewItem = commercialGroup?.items.find((i) => i.key === 'command_center');
      assert.ok(overviewItem, 'command_center item must exist');
      assert.strictEqual(overviewItem?.label, 'Executive Overview');
      assert.strictEqual(overviewItem?.label.includes('Command Center'), false);
    });

    it('verifies all 9 navigation tabs exist across the canonical groups', () => {
      const allKeys = NAVIGATION_GROUPS.flatMap((g) => g.items.map((i) => i.key));
      assert.deepStrictEqual(allKeys, [
        'command_center',
        'leads',
        'deals',
        'works',
        'tasks',
        'users',
        'analytics',
        'ingestion',
        'settings',
      ]);
    });
  });

  describe('5. Public Website Isolation Guarantees', () => {
    it('verifies public fonts.ts only imports Graphik and zero admin fonts', () => {
      const publicFontsPath = path.resolve(process.cwd(), 'src/app/fonts.ts');
      const content = fs.readFileSync(publicFontsPath, 'utf8');
      assert.ok(content.includes('graphik'));
      assert.strictEqual(content.includes('MessinaSans'), false);
      assert.strictEqual(content.includes('--font-admin'), false);
    });

    it('verifies public globals.scss contains zero admin tokens or overrides', () => {
      const globalsScssPath = path.resolve(process.cwd(), 'src/app/globals.scss');
      const content = fs.readFileSync(globalsScssPath, 'utf8');
      assert.strictEqual(content.includes('--admin-canvas-bg'), false);
      assert.strictEqual(content.includes('--admin-accent-lemon'), false);
      assert.strictEqual(content.includes('[data-admin-root="true"]'), false);
    });
  });

  describe('6. Shell Accessibility, Touch Targets & CSS Module Synchronization', () => {
    it('enforces 44px minimum touch targets in mixins.scss (Rule R-03)', () => {
      const mixinsScssPath = path.resolve(process.cwd(), 'src/app/admin/styles/mixins.scss');
      const content = fs.readFileSync(mixinsScssPath, 'utf8');
      assert.ok(content.includes('min-height: 44px;'));
      assert.strictEqual(content.includes('min-height: 42px;'), false);
      assert.strictEqual(content.includes('min-height: 36px;'), false);
      assert.strictEqual(content.includes('// =========================================='), false);
    });

    it('verifies UserProfileDropdown.module.scss contains all required JSX bindings', () => {
      const dropdownScssPath = path.resolve(
        process.cwd(),
        'src/app/admin/components/layout/UserProfileDropdown.module.scss'
      );
      assert.strictEqual(fs.existsSync(dropdownScssPath), true);
      const content = fs.readFileSync(dropdownScssPath, 'utf8');
      assert.ok(content.includes('.userTrigger'));
      assert.ok(content.includes('.triggerAvatar'));
      assert.ok(content.includes('.dropdownMenu'));
      assert.ok(content.includes('.userEmail'));
      assert.ok(content.includes('.workspaceStatusRow'));
      assert.ok(content.includes('.divider'));
      assert.ok(content.includes('.menuItem'));
      assert.ok(content.includes('.signOutButton'));
    });

    it('verifies AdminMobileDrawer.module.scss contains all required drawer classes', () => {
      const drawerScssPath = path.resolve(
        process.cwd(),
        'src/app/admin/components/layout/AdminMobileDrawer.module.scss'
      );
      assert.strictEqual(fs.existsSync(drawerScssPath), true);
      const content = fs.readFileSync(drawerScssPath, 'utf8');
      assert.ok(content.includes('.drawer'));
      assert.ok(content.includes('.drawerOpen'));
      assert.ok(content.includes('.activePill'));
      assert.ok(content.includes('.systemStatusBlock'));
      assert.ok(content.includes('.statusDot'));
      assert.ok(content.includes('.newLeadBtn'));
      assert.ok(content.includes('visibility: hidden;'));
    });
  });
});
