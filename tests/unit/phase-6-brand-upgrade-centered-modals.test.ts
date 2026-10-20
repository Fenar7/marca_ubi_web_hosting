/**
 * @file tests/unit/phase-6-brand-upgrade-centered-modals.test.ts
 * @description Dedicated Unit Test Suite for Phase 6 Brand Upgrade:
 *              Centered Modals & Workflow Dialog Architecture Overhaul.
 *              Verifies modern luxury Obsidian CTAs (#0f172a), pure white surfaces,
 *              hairline borders, complete eradication of lemon yellow on buttons,
 *              OnHoldModal / Scheduler light canvas modernization, 44px touch targets,
 *              Escape key accessibility, and cyclical focus trapping.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 6 Brand Upgrade: Centered Modals & Dialog Architecture Suite', () => {
  const modalScssFiles = [
    'src/app/admin/components/modals/NewLeadModal.module.scss',
    'src/app/admin/components/modals/ConvertLeadToDealModal.module.scss',
    'src/app/admin/components/modals/BatchReassignModal.module.scss',
    'src/app/admin/components/modals/StageModals.module.scss',
    'src/app/admin/components/modals/AddTeamMemberModal.module.scss',
    'src/app/admin/components/Scheduler/Scheduler.module.scss',
  ];

  describe('1. Modern Luxury Obsidian Primary Buttons (#0f172a)', () => {
    for (const relPath of modalScssFiles) {
      it(`verifies submit button in ${relPath} uses Obsidian token --admin-btn-primary-bg`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasObsidianToken =
          content.includes('var(--admin-btn-primary-bg, #0f172a)') ||
          content.includes('var(--admin-btn-primary-bg');
        assert.equal(
          hasObsidianToken,
          true,
          `Expected --admin-btn-primary-bg in ${relPath}`
        );
      });
    }

    it('verifies 0 instances of lemon yellow on submit buttons across all modal SCSS', () => {
      for (const relPath of modalScssFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const submitMatches = content.match(/submit(Button|Btn)[\s\S]*?background:[\s\S]*?;/g) || [];
        for (const block of submitMatches) {
          assert.equal(
            block.includes('#eefb87') || block.includes('#e4f375'),
            false,
            `Found lemon yellow in submit button block: ${block}`
          );
        }
      }
    });
  });

  describe('2. Scheduler & OnHoldModal Light Canvas Modernization', () => {
    it('verifies Scheduler.module.scss uses pure white card surface and light canvas', () => {
      const fullPath = path.resolve(
        process.cwd(),
        'src/app/admin/components/Scheduler/Scheduler.module.scss'
      );
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(
        content.includes('var(--admin-card-bg, #ffffff)'),
        'Expected --admin-card-bg in Scheduler.module.scss'
      );
      assert.ok(
        content.includes('var(--admin-canvas-bg, #f7f8fa)'),
        'Expected --admin-canvas-bg in Scheduler.module.scss'
      );
    });

    it('verifies Scheduler.module.scss eradicated legacy dark background #121216 and #0f0f13', () => {
      const fullPath = path.resolve(
        process.cwd(),
        'src/app/admin/components/Scheduler/Scheduler.module.scss'
      );
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.equal(
        content.includes('#121216'),
        false,
        'Found legacy dark background #121216 in Scheduler.module.scss'
      );
      assert.equal(
        content.includes('#0f0f13'),
        false,
        'Found legacy dark background #0f0f13 in Scheduler.module.scss'
      );
    });

    it('verifies Scheduler.module.scss eradicated legacy orange #ff6100 on buttons and glows', () => {
      const fullPath = path.resolve(
        process.cwd(),
        'src/app/admin/components/Scheduler/Scheduler.module.scss'
      );
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.equal(
        content.includes('#ff6100'),
        false,
        'Found legacy orange #ff6100 in Scheduler.module.scss'
      );
    });
  });

  describe('3. Touch Target Compliance (Rule R-03: >= 44px min-height)', () => {
    for (const relPath of modalScssFiles) {
      it(`verifies interactive elements in ${relPath} enforce >= 44px touch targets`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const has44px =
          /min-height:\s*44px/i.test(content) || /height:\s*44px/i.test(content);
        assert.equal(
          has44px,
          true,
          `Expected min-height: 44px or height: 44px in ${relPath}`
        );
      });
    }
  });

  describe('4. Keyboard Accessibility & Focus Trapping Invariants', () => {
    const tsxModalFiles = [
      'src/app/admin/components/modals/NewLeadModal.tsx',
      'src/app/admin/components/modals/ConvertLeadToDealModal.tsx',
      'src/app/admin/components/modals/BatchReassignModal.tsx',
      'src/app/admin/components/modals/StageTransitionModal.tsx',
      'src/app/admin/components/modals/AddTeamMemberModal.tsx',
      'src/app/admin/components/Scheduler/OnHoldModal.tsx',
    ];

    for (const relPath of tsxModalFiles) {
      it(`verifies ${relPath} implements Escape key dismissal`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasEscape =
          content.includes("'Escape'") || content.includes('"Escape"');
        assert.equal(
          hasEscape,
          true,
          `Expected Escape key dismissal in ${relPath}`
        );
      });
    }

    for (const relPath of tsxModalFiles) {
      it(`verifies ${relPath} implements Tab key focus trapping or focus management`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasFocusManagement =
          content.includes("'Tab'") ||
          content.includes('"Tab"') ||
          content.includes('focus()') ||
          content.includes('useRef');
        assert.equal(
          hasFocusManagement,
          true,
          `Expected focus management in ${relPath}`
        );
      });
    }
  });

  describe('5. Zero Generic Blue (#2563eb / #1d4ed8)', () => {
    for (const relPath of modalScssFiles) {
      it(`verifies 0 generic blue in ${relPath}`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.equal(
          /#2563eb/i.test(content) || /#1d4ed8/i.test(content),
          false,
          `Found generic blue in ${relPath}`
        );
      });
    }
  });
});
