import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Shared workspace rail regression contracts', () => {
  const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
  const sidebar = read('src/app/admin/components/layout/AdminSidebar.module.scss');
  const shellStyles = read('src/app/admin/components/layout/admin-shell.module.scss');
  const shell = read('src/app/admin/components/layout/AdminWorkspaceShell.tsx');
  const header = read('src/app/admin/components/layout/AdminHeader.tsx');
  const tokens = read('src/app/admin/styles/tokens.scss');

  it('pins navigation and offsets content using the same expanded-width contract', () => {
    assert.match(sidebar, /position:\s*fixed/);
    assert.match(sidebar, /inset:\s*0 auto 0 0/);
    assert.match(sidebar, /width:\s*var\(--sidebar-width, 240px\)/);
    assert.match(shellStyles, /margin-left:\s*var\(--sidebar-width, 240px\)/);
    assert.match(shellStyles, /width:\s*calc\(100% - var\(--sidebar-width, 240px\)\)/);
    assert.match(tokens, /--admin-sidebar-width-expanded:\s*240px/);
  });

  it('preserves intrinsic brand proportions and disables motion on request', () => {
    assert.match(sidebar, /height:\s*auto/);
    assert.ok(!sidebar.includes('filter: brightness(0)'));
    assert.ok(sidebar.includes('prefers-reduced-motion'));
    assert.ok(sidebar.includes('transition: none'));
    assert.ok(sidebar.includes(':focus-visible'));
  });

  it('switches to mobile navigation without retaining desktop offsets', () => {
    assert.match(sidebar, /@media \(max-width: 1024px\)/);
    assert.match(shellStyles, /margin-left:\s*0/);
    assert.match(shellStyles, /width:\s*100%/);
    assert.ok(shell.includes('<AdminMobileDrawer'));
  });

  it('persists compact navigation and preserves its keyboard shortcut', () => {
    assert.match(shell, /localStorage\.getItem\(["']marca_crm_sidebar_collapsed["']\)/);
    assert.match(shell, /localStorage\.setItem\([\s\S]*?["']marca_crm_sidebar_collapsed["']/);
    assert.match(shell, /e\.key\.toLowerCase\(\) === ["']b["']/);
    assert.match(shell, /["']--sidebar-width["']:\s*isCollapsed\s*\?\s*["']72px["']\s*:\s*["']240px["']/);
  });

  it('keeps header contextual rather than duplicating page-level creation actions', () => {
    assert.ok(header.includes('<AdminBreadcrumbs'));
    assert.ok(!header.includes('open-new-lead-modal'));
    assert.ok(!header.includes('open-add-member-modal'));
    assert.ok(header.includes('onOpenMobileNav'));
  });
});
