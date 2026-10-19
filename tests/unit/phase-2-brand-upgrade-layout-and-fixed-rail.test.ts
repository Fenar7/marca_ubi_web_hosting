/**
 * @file tests/unit/phase-2-brand-upgrade-layout-and-fixed-rail.test.ts
 * @description Dedicated Unit Test Suite for Phase 2: Modern Fluid Layout, Collapsible Fixed Left Rail
 *              & Symmetrical Content Container Geometry.
 *              Validates fixed left rail pinning, 72px collapsed geometry, authentic logo colors,
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
      assert.ok(sidebarBlock.includes('z-index: 40;'), 'Sidebar must sit at z-index: 40 above scrolling content');
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

    it('verifies authentic brand logo coloration is preserved without filter: brightness(0)', () => {
      const content = fs.readFileSync(sidebarScssPath, 'utf8');
      assert.strictEqual(
        content.includes('filter: brightness(0);'),
        false,
        'Brand logo in sidebar must never be washed out with filter: brightness(0)'
      );
    });

    it('verifies AdminSidebar.tsx uses CSS-driven text opacity for smooth collapse transitions', () => {
      const content = fs.readFileSync(sidebarTsxPath, 'utf8');
      assert.ok(
        content.includes('newLeadBtnText'),
        'New Lead button label must use CSS class for smooth transition'
      );
      assert.strictEqual(
        content.includes('{!isCollapsed && <span>New Lead</span>}'),
        false,
        'Must not unmount label conditionally to prevent layout pop'
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

  describe('3. Platform Rail Tokens & Shell State Persistence', () => {
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
