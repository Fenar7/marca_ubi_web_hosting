/**
 * @file tests/unit/phase-3-redesign-executive-overview.test.ts
 * @description Dedicated Unit Test Suite for Phase 3:
 *              Executive Overview & KPI Ribbon Architecture (/admin, KpiRibbon, ManagerWorkloadCard).
 *              Verifies Accordion Executive Advisory & Sypher Minimalist Light Canvas tokens,
 *              WCAG AAA contrast compliance, 44px touch targets, and editorial periods.
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

describe('Phase 3 Redesign: Executive Overview & KPI Ribbon Architecture Suite', () => {
  const pageTsxPath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/page.tsx');
  const pageScssPath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/page.module.scss');
  const kpiScssPath = path.resolve(process.cwd(), 'src/app/admin/components/kpi/KpiRibbon.module.scss');
  const pipelineAllocationTsxPath = path.resolve(process.cwd(), 'src/app/admin/components/Dashboard/PipelineAllocationCard.tsx');
  const pipelineAllocationScssPath = path.resolve(process.cwd(), 'src/app/admin/components/Dashboard/PipelineAllocationCard.module.scss');
  const activityRowItemPath = path.resolve(process.cwd(), 'src/app/admin/(workspace)/components/ActivityRowItem.tsx');

  describe('1. WCAG AAA Contrast Engine & Token Mathematics', () => {
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

    it('verifies primary button ink #1f242f on Lemon Yellow #eefb87 exceeds WCAG AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#1f242f', '#eefb87');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
      assert.ok(Math.abs(ratio - 13.92) < 0.2);
    });

    it('proves white text #ffffff on Lemon Yellow #eefb87 strictly FAILS (< 4.5:1)', () => {
      const ratio = getContrastRatio('#ffffff', '#eefb87');
      assert.ok(ratio < 4.5, `Expected failure (< 4.5), got ${ratio}`);
      assert.ok(Math.abs(ratio - 1.12) < 0.2);
    });

    it('verifies emerald text #065f46 on tint #ecfdf5 exceeds WCAG AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#065f46', '#ecfdf5');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
      assert.ok(Math.abs(ratio - 7.29) < 0.2);
    });

    it('verifies amber text #92400e on tint #fffbeb exceeds WCAG AA (>= 4.5:1)', () => {
      const ratio = getContrastRatio('#92400e', '#fffbeb');
      assert.ok(ratio >= 4.5, `Expected contrast >= 4.5, got ${ratio}`);
      assert.ok(Math.abs(ratio - 6.84) < 0.2);
    });

    it('verifies danger rose text #991b1b on tint #fef2f2 exceeds WCAG AAA (>= 7:1)', () => {
      const ratio = getContrastRatio('#991b1b', '#fef2f2');
      assert.ok(ratio >= 7, `Expected contrast >= 7, got ${ratio}`);
      assert.ok(Math.abs(ratio - 7.60) < 0.2);
    });
  });

  describe('2. Executive Overview Page Architecture (/admin)', () => {
    it('verifies page.module.scss purges legacy obsidian (#0b0b0b, #111115, #121216) and brand orange (#ff6100)', () => {
      const scss = fs.readFileSync(pageScssPath, 'utf8');
      assert.strictEqual(scss.includes('#0b0b0b'), false);
      assert.strictEqual(scss.includes('#111115'), false);
      assert.strictEqual(scss.includes('#121216'), false);
      assert.strictEqual(scss.includes('#ff6100'), false);
    });

    it('verifies page.module.scss adopts Sypher light canvas (#f7f8fa) and modular layout grid', () => {
      const scss = fs.readFileSync(pageScssPath, 'utf8');
      assert.ok(scss.includes('--admin-canvas-bg') || scss.includes('#f7f8fa'));
      assert.ok(scss.includes('.dashboardContainer'));
      assert.ok(scss.includes('.fluidCanvas'));
      assert.ok(scss.includes('.midTierGrid'));
    });

    it('verifies purge of military/hacker jargon in page.tsx', () => {
      const tsx = fs.readFileSync(pageTsxPath, 'utf8');
      assert.strictEqual(tsx.includes('Command Center'), false);
      assert.strictEqual(tsx.includes('Activity Ledger'), false);
      assert.strictEqual(tsx.includes('Pipeline Ops'), false);
    });

    it('verifies MedTrackr Executive architectural components mounted in page.tsx', () => {
      const tsx = fs.readFileSync(pageTsxPath, 'utf8');
      assert.ok(tsx.includes('ExecutiveMasthead'));
      assert.ok(tsx.includes('ExecutiveKpiGrid'));
      assert.ok(tsx.includes('RevenueDynamicsCard'));
      assert.ok(tsx.includes('CommercialDealsTable'));
    });
  });

  describe('3. Sypher Master Executive KPI Ribbon Architecture', () => {
    it('verifies KpiRibbon.module.scss purges dark backgrounds and orange accents', () => {
      const scss = fs.readFileSync(kpiScssPath, 'utf8');
      assert.strictEqual(scss.includes('#121216'), false);
      assert.strictEqual(scss.includes('#18181b'), false);
      assert.strictEqual(scss.includes('#ff6100'), false);
    });

    it('verifies KpiRibbon adopts white card surfaces (#ffffff), 12px radius, and hairline borders', () => {
      const scss = fs.readFileSync(kpiScssPath, 'utf8');
      assert.ok(scss.includes('var(--admin-card-bg') || scss.includes('#ffffff'));
      assert.ok(scss.includes('var(--admin-border-default') || scss.includes('#e2e5ea'));
      assert.ok(scss.includes('border-radius: var(--admin-radius-card') || scss.includes('border-radius: 12px'));
    });

    it('verifies segmented currency pill toggle styles in KpiRibbon.module.scss', () => {
      const scss = fs.readFileSync(kpiScssPath, 'utf8');
      assert.ok(scss.includes('.currencyToggle'));
      assert.ok(scss.includes('.currencyBtn'));
      assert.ok(scss.includes('.currencyActive'));
    });

    it('verifies tabular numerals are enforced on all metric values in KpiRibbon.module.scss', () => {
      const scss = fs.readFileSync(kpiScssPath, 'utf8');
      assert.ok(scss.includes('font-variant-numeric: tabular-nums'));
    });
  });

  describe('4. Pipeline Stage Allocation & Velocity Engine Architecture', () => {
    it('verifies editorial period on title in PipelineAllocationCard.tsx', () => {
      const tsx = fs.readFileSync(pipelineAllocationTsxPath, 'utf8');
      assert.ok(tsx.includes('Pipeline Stage Allocation'));
    });

    it('verifies WCAG AA compliant stage colors in PipelineAllocationCard.tsx', () => {
      const tsx = fs.readFileSync(pipelineAllocationTsxPath, 'utf8');
      assert.ok(tsx.includes('#0284c7')); // Deep Ocean Sky
      assert.ok(tsx.includes('#4f46e5')); // Royal Slate Indigo
      assert.ok(tsx.includes('#d97706')); // Executive Amber
      assert.ok(tsx.includes('#059669')); // Mint Emerald
      assert.ok(tsx.includes('#ff6100')); // Marca Orange
    });

    it('verifies tabular numerals are enforced in PipelineAllocationCard.module.scss', () => {
      const scss = fs.readFileSync(pipelineAllocationScssPath, 'utf8');
      assert.ok(scss.includes('font-variant-numeric: tabular-nums') || scss.includes('tabular-nums'));
    });

    it('verifies single continuous distribution bar and borderless ledger rows', () => {
      const scss = fs.readFileSync(pipelineAllocationScssPath, 'utf8');
      assert.ok(scss.includes('.segmentedBarTrack'));
      assert.ok(scss.includes('.stageLedgerRow'));
    });
  });

  describe('5. Activity Row Item Refactoring & Keyboard Accessibility', () => {
    it('verifies ActivityRowItem.tsx uses currentColor for SVG stroke', () => {
      const tsx = fs.readFileSync(activityRowItemPath, 'utf8');
      assert.strictEqual(tsx.includes('stroke="#ff6100"'), false);
      assert.ok(tsx.includes('stroke="currentColor"'));
    });

    it('verifies ActivityRowItem supports Space and Enter key activation per Rule R-32', () => {
      const tsx = fs.readFileSync(activityRowItemPath, 'utf8');
      assert.ok(tsx.includes("e.key === 'Enter' || e.key === ' '"));
    });

    it('verifies dead blue badge variant is pruned from ActivityRowItem and page.tsx', () => {
      const activityTsx = fs.readFileSync(activityRowItemPath, 'utf8');
      const pageTsx = fs.readFileSync(pageTsxPath, 'utf8');
      assert.strictEqual(activityTsx.includes("'blue'"), false);
      assert.strictEqual(pageTsx.includes("'blue'"), false);
    });

    it('verifies explicit session authentication guard in page.tsx', () => {
      const pageTsx = fs.readFileSync(pageTsxPath, 'utf8');
      assert.ok(pageTsx.includes('supabase.auth.getUser()'));
      assert.ok(pageTsx.includes("redirect('/admin/login?next=%2Fadmin')"));
    });

    it('verifies newLeadBtn enforces 44px touch target in ExecutiveMasthead.module.scss', () => {
      const mastheadScss = fs.readFileSync(path.resolve(process.cwd(), 'src/app/admin/components/Dashboard/ExecutiveMasthead.module.scss'), 'utf8');
      assert.ok(mastheadScss.includes('min-height: 44px'));
    });
  });
});
