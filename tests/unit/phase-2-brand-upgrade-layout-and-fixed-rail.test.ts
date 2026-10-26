/**
 * @file tests/unit/phase-2-brand-upgrade-layout-and-fixed-rail.test.ts
 * @description Dedicated Unit Test Suite for Phase 2: Modern Fluid Layout, Collapsible Fixed Left Rail
 *              & Symmetrical Content Container Geometry.
 *              Validates fixed left rail pinning, 72px collapsed geometry, authentic logo colors on desktop & mobile,
 *              pure CSS fluid text transitions (zero React unmounting / zero display: none pops),
 *              symmetrical 1720px content envelope, and header action duplicate-glyph eradication.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 2 Brand Upgrade: Modern Fluid Layout & Fixed Rail Suite', () => {
  const sidebarScssPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/layout/AdminSidebar.module.scss'
  );
  const mobileDrawerScssPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/layout/AdminMobileDrawer.module.scss'
  );
  const sidebarTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/layout/AdminSidebar.tsx'
  );
  const shellScssPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/layout/admin-shell.module.scss'
  );
  const shellTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/layout/AdminWorkspaceShell.tsx'
  );
  const headerTsxPath = path.resolve(
    process.cwd(),
    'src/app/admin/components/layout/AdminHeader.tsx'
  );
  const tokensScssPath = path.resolve(
    process.cwd(),
    'src/app/admin/styles/tokens.scss'
  );

  describe('1. Fixed Left Rail Architecture & Pinning Invariants', () => {
    it('verifies AdminSidebar.module.scss strictly configures position: fixed and pins to viewport edges', () => {
      const content = fs.readFileSync(sidebarScssPath, 'utf8');
      const sidebarBlock = content.match(/\.sidebar\s*\{[\s\S]*?\n\}/)?.[0] || '';

      assert.ok(sidebarBlock.includes('position: fixed;'), 'Sidebar must be position: fixed to prevent scroll detachment');
      assert.ok(sidebarBlock.includes('top: 0;'), 'Sidebar must pin to top: 0');
      assert.ok(sidebarBlock.includes('left: 0;'), 'Sidebar must pin to left: 0');
      assert.ok(sidebarBlock.includes('bottom: 0;'), 'Sidebar must pin to bottom: 0');
      assert.ok(sidebarBlock.includes('z-index: 10000;') || sidebarBlock.includes('z-index: 40;'), 'Sidebar must sit at elevated z-index above scrolling content');
      assert.ok(
        sidebarBlock.includes('height: 100vh;') || sidebarBlock.includes('height: 100dvh;'),
        'Sidebar must span full dynamic viewport height'
      );
      assert.ok(
        sidebarBlock.includes('width: var(--sidebar-width, 260px);'),
        'Sidebar width must dynamically respond to --sidebar-width CSS custom property'
      );
    });

    it('verifies .collapsed modifier sets rail width to 72px with centered icon button geometry', () => {
      const content = fs.readFileSync(sidebarScssPath, 'utf8');
      const collapsedBlock = content.match(/\.collapsed\s*\{[\s\S]*?\n\}/)?.[0] || '';

      assert.ok(collapsedBlock.includes('width: 72px;'), 'Collapsed rail must measure exactly 72px');
      assert.ok(collapsedBlock.includes('min-height: 44px;'), 'New lead button must maintain 44px touch target');
      assert.ok(collapsedBlock.includes('border-radius: 50%;'), 'New lead button collapses into circular icon button');
    });

    it('verifies authentic brand logo coloration is preserved on desktop without filter: brightness(0)', () => {
      const content = fs.readFileSync(sidebarScssPath, 'utf8');
      assert.strictEqual(
        content.includes('filter: brightness(0);'),
        false,
        'Brand logo in sidebar must never be washed out with filter: brightness(0)'
      );
    });

    it('verifies authentic brand logo coloration is preserved on mobile without filter: brightness(0)', () => {
      const content = fs.readFileSync(mobileDrawerScssPath, 'utf8');
      assert.strictEqual(
        content.includes('filter: brightness(0);'),
        false,
        'Brand logo in mobile drawer must never be washed out with filter: brightness(0)'
      );
    });

    it('verifies .brandLogo declares smooth sizing transitions to prevent logo snapping', () => {
      const content = fs.readFileSync(sidebarScssPath, 'utf8');
      const logoBlock = content.match(/\.brandLogo\s*\{[\s\S]*?\n\}/)?.[0] || '';
      assert.ok(
        logoBlock.includes('transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1), height 0.22s cubic-bezier(0.16, 1, 0.3, 1);'),
        'Brand logo must declare smooth cubic-bezier transitions for width and height'
      );
    });

    it('verifies AdminSidebar.tsx preserves all text nodes in the DOM without React conditional unmounting', () => {
      const content = fs.readFileSync(sidebarTsxPath, 'utf8');
      assert.strictEqual(
        content.includes('{!isCollapsed && ('),
        false,
        'Must never conditionally unmount labels in React to prevent layout popping'
      );
      assert.strictEqual(
        content.includes('{!isCollapsed && <span>New Lead</span>}'),
        false,
        'Must not conditionally unmount New Lead label'
      );
    });

    it('verifies AdminSidebar.module.scss eliminates display: none from .collapsed text elements', () => {
      const content = fs.readFileSync(sidebarScssPath, 'utf8');
      const collapsedBlock = content.match(/\.collapsed\s*\{[\s\S]*?\n\}/)?.[0] || '';
      assert.strictEqual(
        collapsedBlock.includes('display: none;'),
        false,
        'Collapsed block must never use display: none on text elements to allow CSS transitions'
      );
      assert.ok(
        collapsedBlock.includes('pointer-events: none;'),
        'Collapsed text elements must disable pointer events'
      );
    });

    it('verifies collapsible text elements declare base CSS transitions for fluid animation', () => {
      const content = fs.readFileSync(sidebarScssPath, 'utf8');
      assert.ok(
        content.includes('.newLeadBtnText {'),
        'Must define base .newLeadBtnText class'
      );
      assert.ok(
        content.includes('transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.22s cubic-bezier(0.16, 1, 0.3, 1);'),
        'Must declare smooth cubic-bezier opacity and max-width transitions'
      );
    });
  });

  describe('2. Symmetrical Viewport Enclave & Fluid Content Container Geometry', () => {
    it('verifies admin-shell.module.scss sizes .mainViewport dynamically with margin and width offset', () => {
      const content = fs.readFileSync(shellScssPath, 'utf8');
      const viewportBlock = content.match(/\.mainViewport\s*\{[\s\S]*?\n\}/)?.[0] || '';

      assert.ok(
        viewportBlock.includes('margin-left: var(--sidebar-width, 260px);'),
        '.mainViewport must offset margin-left by dynamic sidebar width'
      );
      assert.ok(
        viewportBlock.includes('width: calc(100% - var(--sidebar-width, 260px));'),
        '.mainViewport width must dynamically compute 100% minus sidebar width'
      );
      assert.ok(
        viewportBlock.includes('transition: margin-left 0.22s cubic-bezier(0.16, 1, 0.3, 1), width 0.22s cubic-bezier(0.16, 1, 0.3, 1);'),
        '.mainViewport must smoothly transition both margin and width'
      );
    });

    it('verifies .mainViewport resets cleanly to margin-left: 0 and width: 100% on tablet/mobile screens', () => {
      const content = fs.readFileSync(shellScssPath, 'utf8');
      const viewportBlock = content.match(/\.mainViewport\s*\{[\s\S]*?\n\}/)?.[0] || '';

      assert.ok(
        viewportBlock.includes('@media (max-width: 1024px)'),
        'Must provide responsive media query breakpoint'
      );
      assert.ok(
        viewportBlock.includes('margin-left: 0;'),
        'Tablet/mobile must reset margin-left to 0'
      );
      assert.ok(
        viewportBlock.includes('width: 100%;'),
        'Tablet/mobile must expand width to 100%'
      );
    });

    it('verifies .contentContainer implements symmetrical margin auto and 1720px max-width envelope', () => {
      const content = fs.readFileSync(shellScssPath, 'utf8');
      const containerBlock = content.match(/\.contentContainer\s*\{[\s\S]*?\n\}/)?.[0] || '';

      assert.ok(
        containerBlock.includes('max-width: 1720px;'),
        'Content container must have 1720px luxury maximum width'
      );
      assert.ok(
        containerBlock.includes('margin: 0 auto;'),
        'Content container must be symmetrically centered'
      );
      assert.ok(
        containerBlock.includes('box-sizing: border-box;'),
        'Content container must strictly enforce border-box sizing'
      );
      assert.ok(
        containerBlock.includes('width: 100%;'),
        'Content container must take 100% width up to max-width constraint'
      );
    });
  });

  describe('3. Platform Rail Tokens, State Persistence & Contrast Compliance', () => {
    it('verifies tokens.scss registers expanded and collapsed sidebar width tokens', () => {
      const content = fs.readFileSync(tokensScssPath, 'utf8');
      assert.ok(
        content.includes('--admin-sidebar-width-expanded: 260px;'),
        'Must declare --admin-sidebar-width-expanded token'
      );
      assert.ok(
        content.includes('--admin-sidebar-width-collapsed: 72px;'),
        'Must declare --admin-sidebar-width-collapsed token'
      );
    });

    it('verifies tokens.scss declares WCAG AA compliant --admin-text-muted token (#6b7280)', () => {
      const content = fs.readFileSync(tokensScssPath, 'utf8');
      assert.ok(
        content.includes('--admin-text-muted: #6b7280;'),
        'Must use #6b7280 for at least 4.72:1 contrast against white background'
      );
      assert.strictEqual(
        content.includes('--admin-text-muted: #8a92a0;'),
        false,
        'Must not use failing #8a92a0 contrast token'
      );
    });

    it('verifies AdminWorkspaceShell injects dynamic --sidebar-width style', () => {
      const content = fs.readFileSync(shellTsxPath, 'utf8');
      assert.ok(
        content.includes("'--sidebar-width': isCollapsed ? '72px' : '260px'"),
        'AdminWorkspaceShell must inject dynamic --sidebar-width based on collapse state'
      );
    });

    it('verifies AdminWorkspaceShell registers ⌘B shortcut to toggle sidebar collapse', () => {
      const content = fs.readFileSync(shellTsxPath, 'utf8');
      assert.ok(
        content.includes("e.key.toLowerCase() === 'b'"),
        'Must support ⌘B shortcut to toggle rail'
      );
      assert.ok(
        content.includes('toggleSidebar()'),
        '⌘B shortcut must trigger toggleSidebar'
      );
    });

    it('verifies AdminWorkspaceShell persists collapse state in localStorage', () => {
      const content = fs.readFileSync(shellTsxPath, 'utf8');
      assert.ok(
        content.includes("localStorage.getItem('marca_crm_sidebar_collapsed')"),
        'Must read collapse state from localStorage'
      );
      assert.ok(
        content.includes("localStorage.setItem('marca_crm_sidebar_collapsed'"),
        'Must write collapse state to localStorage'
      );
    });
  });

  describe('4. Header Action Typography & Duplicate Plus Bug Eradication', () => {
    it('verifies AdminHeader eliminates duplicate literal plus in New Lead button', () => {
      const content = fs.readFileSync(headerTsxPath, 'utf8');
      assert.ok(
        content.includes('<span>New Lead</span>'),
        'Button text must cleanly render "New Lead"'
      );
      assert.strictEqual(
        content.includes('<span>+ New Lead</span>'),
        false,
        'Button text must not contain literal "+"'
      );
    });

    it('verifies AdminHeader eliminates duplicate literal plus in Add Member button', () => {
      const content = fs.readFileSync(headerTsxPath, 'utf8');
      assert.ok(
        content.includes('<span>Add Member</span>'),
        'Button text must cleanly render "Add Member"'
      );
      assert.strictEqual(
        content.includes('<span>+ Add Member</span>'),
        false,
        'Button text must not contain literal "+"'
      );
    });

    it('verifies AdminHeader quick action buttons retain clean vector SVG icons', () => {
      const content = fs.readFileSync(headerTsxPath, 'utf8');
      assert.ok(
        content.includes('<svg'),
        'Quick action buttons must render clean vector SVGs'
      );
      assert.ok(
        content.includes('<line x1="12" y1="5" x2="12" y2="19" />'),
        'New Lead button must contain SVG plus icon lines'
      );
    });
  });
});
