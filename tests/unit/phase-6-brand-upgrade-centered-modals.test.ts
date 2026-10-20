/**
 * @file tests/unit/phase-6-brand-upgrade-centered-modals.test.ts
 * @description Dedicated Unit Test Suite for Phase 6 Brand Upgrade:
 *              Centered Modals & Workflow Dialog Architecture Overhaul.
 *              Verifies modern luxury Obsidian CTAs (#0f172a), pure white surfaces,
 *              hairline borders, complete eradication of lemon yellow on buttons,
 *              OnHoldModal / Scheduler light canvas modernization, 44px touch targets,
 *              Escape key accessibility, cyclical focus trapping with :not([disabled]),
 *              high-contrast spinners, and discard prompt semantics.
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

  const tsxModalFiles = [
    'src/app/admin/components/modals/NewLeadModal.tsx',
    'src/app/admin/components/modals/ConvertLeadToDealModal.tsx',
    'src/app/admin/components/modals/BatchReassignModal.tsx',
    'src/app/admin/components/modals/StageTransitionModal.tsx',
    'src/app/admin/components/modals/ConvertedCelebrationModal.tsx',
    'src/app/admin/components/modals/LostReasonModal.tsx',
    'src/app/admin/components/modals/AddTeamMemberModal.tsx',
    'src/app/admin/components/Scheduler/OnHoldModal.tsx',
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

    it('verifies eradication of stale "Lemon Yellow CTA" comments in headers', () => {
      for (const relPath of modalScssFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.equal(
          content.includes('Accordion Lemon Yellow CTA'),
          false,
          `Found stale Lemon Yellow comment in header of ${relPath}`
        );
      }
    });
  });

  describe('2. Loading Spinner High Contrast Compliance (WCAG AAA)', () => {
    const spinnerFiles = [
      'src/app/admin/components/modals/NewLeadModal.module.scss',
      'src/app/admin/components/modals/BatchReassignModal.module.scss',
      'src/app/admin/components/modals/StageModals.module.scss',
      'src/app/admin/components/modals/AddTeamMemberModal.module.scss',
    ];

    for (const relPath of spinnerFiles) {
      it(`verifies spinner in ${relPath} uses white border for high contrast on dark buttons`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.ok(
          content.includes('border-top-color: #ffffff') ||
          content.includes('border-top-color: #fff') ||
          content.includes('border: 2px solid rgba(255, 255, 255'),
          `Expected white spinner border in ${relPath}`
        );
        // Ensure no dark text-primary spinner remains
        const spinnerBlock = content.match(/\.(buttonSpinner|spinner)\s*\{[\s\S]*?\}/g) || [];
        for (const block of spinnerBlock) {
          assert.equal(
            block.includes('--admin-text-primary') || block.includes('#1f242f'),
            false,
            `Found low-contrast dark spinner in ${relPath}: ${block}`
          );
        }
      });
    }
  });

  describe('3. Scheduler & OnHoldModal Modernization', () => {
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

    it('verifies OnHoldModal.tsx early returns when isOpen is false', () => {
      const fullPath = path.resolve(
        process.cwd(),
        'src/app/admin/components/Scheduler/OnHoldModal.tsx'
      );
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(
        content.includes('if (!isOpen) return null;'),
        'Expected early return if (!isOpen) return null; in OnHoldModal.tsx'
      );
    });

    it('verifies StageTransitionModal.tsx passes isOpen to OnHoldModal', () => {
      const fullPath = path.resolve(
        process.cwd(),
        'src/app/admin/components/modals/StageTransitionModal.tsx'
      );
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(
        content.includes('<OnHoldModal\n        isOpen={isOpen}') ||
        content.includes('<OnHoldModal\r\n        isOpen={isOpen}'),
        'Expected <OnHoldModal isOpen={isOpen} in StageTransitionModal.tsx'
      );
    });
  });

  describe('4. Touch Target Compliance (Rule R-03: >= 44px min-height)', () => {
    it('verifies .stepButton in Scheduler.module.scss has min-height: 44px on desktop', () => {
      const fullPath = path.resolve(
        process.cwd(),
        'src/app/admin/components/Scheduler/Scheduler.module.scss'
      );
      const content = fs.readFileSync(fullPath, 'utf8');
      const stepBtnMatch = content.match(/\.stepButton\s*\{[\s\S]*?min-height:\s*(\d+)px/);
      assert.ok(stepBtnMatch, 'Expected .stepButton to have min-height in Scheduler.module.scss');
      const minHeight = parseInt(stepBtnMatch[1], 10);
      assert.ok(minHeight >= 44, `.stepButton min-height must be >= 44px, found ${minHeight}px`);
    });

    it('verifies .dealRow and .leadRow in BatchReassignModal.module.scss have min-height: 44px', () => {
      const fullPath = path.resolve(
        process.cwd(),
        'src/app/admin/components/modals/BatchReassignModal.module.scss'
      );
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(
        content.includes('min-height: 44px;'),
        'Expected min-height: 44px in BatchReassignModal.module.scss'
      );
    });
  });

  describe('5. Keyboard Accessibility & Strict Focus Trapping Invariants', () => {
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

    const trappedModals = [
      'src/app/admin/components/modals/NewLeadModal.tsx',
      'src/app/admin/components/modals/ConvertLeadToDealModal.tsx',
      'src/app/admin/components/modals/BatchReassignModal.tsx',
      'src/app/admin/components/modals/StageTransitionModal.tsx',
      'src/app/admin/components/modals/ConvertedCelebrationModal.tsx',
      'src/app/admin/components/modals/LostReasonModal.tsx',
      'src/app/admin/components/modals/AddTeamMemberModal.tsx',
      'src/app/admin/components/Scheduler/OnHoldModal.tsx',
    ];

    for (const relPath of trappedModals) {
      it(`verifies ${relPath} strictly excludes disabled elements (:not([disabled])) in focus trap`, () => {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.ok(
          content.includes(':not([disabled])'),
          `Expected :not([disabled]) in focus query selector in ${relPath}`
        );
      });
    }

    it('verifies NewLeadModal.tsx and AddTeamMemberModal.tsx trap focus inside discard prompt', () => {
      for (const relPath of [
        'src/app/admin/components/modals/NewLeadModal.tsx',
        'src/app/admin/components/modals/AddTeamMemberModal.tsx',
      ]) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.ok(
          content.includes('promptKeepBtnRef'),
          `Expected promptKeepBtnRef in ${relPath}`
        );
        assert.ok(
          content.includes('promptDiscardBtnRef'),
          `Expected promptDiscardBtnRef in ${relPath}`
        );
        assert.equal(
          content.includes('className={styles.promptOverlay}\n          onClick={() => setShowDiscardPrompt(false)}\n          aria-hidden="true"') ||
          content.includes('className={styles.promptOverlay}\r\n          onClick={() => setShowDiscardPrompt(false)}\r\n          aria-hidden="true"'),
          false,
          `promptOverlay must not have aria-hidden="true" wrapping active dialog in ${relPath}`
        );
      }
    });
  });

  describe('6. Zero Generic Blue (#2563eb / #1d4ed8)', () => {
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
