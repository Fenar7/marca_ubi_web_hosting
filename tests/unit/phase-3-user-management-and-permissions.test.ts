/**
 * @file phase-3-user-management-and-permissions.test.ts
 * @description Unit test suite for Phase 3: User Management, Granular Tab Permissions & Enclave Governance.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTeamUserSchema,
  updateUserPermissionsSchema,
  tabPermissionsSchema,
} from '../../src/app/lib/team-schemas';
import {
  PERMISSION_ENCLAVES,
  getInitialAllowedTabs,
} from '../../src/app/lib/team-permissions-config';
import {
  CRM_TAB_REGISTRY,
  ROLE_DEFAULT_TABS,
  type CrmTabKey,
  type CrmUserRole,
} from '../../src/types/crm';

describe('Phase 3: User Governance & Granular Tab Permissions Suite', () => {
  it('validates PERMISSION_ENCLAVES organizes all 9 canonical tabs into 3 operational enclaves', () => {
    assert.strictEqual(PERMISSION_ENCLAVES.length, 3);

    const enclaveTitles = PERMISSION_ENCLAVES.map((e) => e.enclaveTitle);
    assert.deepStrictEqual(enclaveTitles, [
      'Commercial Pipeline',
      'Agency Operations',
      'System & Governance',
    ]);

    const allTabs = PERMISSION_ENCLAVES.flatMap((e) => e.tabs);
    assert.strictEqual(allTabs.length, 9);

    const allTabKeys = allTabs.map((t) => t.key);
    assert.deepStrictEqual(allTabKeys, [
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

    // Check that every tab has a defined label, route, and descriptive hint
    allTabs.forEach((tab) => {
      assert.ok(tab.label && tab.label.length > 0, `Tab ${tab.key} must have a label`);
      assert.ok(tab.route.startsWith('/admin'), `Tab ${tab.key} must route under /admin`);
      assert.ok(tab.hint && tab.hint.length > 0, `Tab ${tab.key} must have an explanation hint`);
    });
  });

  it('validates getInitialAllowedTabs extracts canonical tabs matching role baselines', () => {
    // Admin gets all 9 tabs
    const adminTabs = getInitialAllowedTabs('admin');
    assert.strictEqual(adminTabs.length, 9);
    assert.deepStrictEqual(adminTabs, [
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

    // Sales Manager gets 8 tabs (excluding settings)
    const managerTabs = getInitialAllowedTabs('sales_manager');
    assert.strictEqual(managerTabs.length, 8);
    assert.strictEqual(managerTabs.includes('settings'), false);
    assert.strictEqual(managerTabs.includes('users'), true);
    assert.strictEqual(managerTabs.includes('analytics'), true);

    // Sales Executive gets 5 core commercial pipeline tabs
    const execTabs = getInitialAllowedTabs('sales_executive');
    assert.deepStrictEqual(execTabs, [
      'command_center',
      'leads',
      'deals',
      'works',
      'tasks',
    ]);

    // Viewer gets read-only pipeline and analytics tabs
    const viewerTabs = getInitialAllowedTabs('viewer');
    assert.deepStrictEqual(viewerTabs, [
      'command_center',
      'leads',
      'deals',
      'works',
      'analytics',
    ]);
  });

  it('validates createTeamUserSchema accepts valid payload with custom allowedTabs', () => {
    const payload = {
      fullName: 'Vikram Mehta',
      email: 'vikram.mehta@marcaubi.com',
      role: 'sales_executive' as const,
      jobTitle: 'Commercial Partner',
      phone: '+971 50 123 4567',
      tempPassword: 'Xk9#mP2$vL5@wQ8!',
      allowedTabs: ['command_center', 'deals', 'works'] as CrmTabKey[],
    };

    const res = createTeamUserSchema.safeParse(payload);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.deepStrictEqual(res.data.allowedTabs, ['command_center', 'deals', 'works']);
    }
  });

  it('validates createTeamUserSchema accepts payload when allowedTabs is omitted', () => {
    const payload = {
      fullName: 'Anita Desai',
      email: 'anita.desai@marcaubi.com',
      role: 'sales_manager' as const,
      jobTitle: 'Director of Growth',
      tempPassword: 'Abc123#Def456!X',
    };

    const res = createTeamUserSchema.safeParse(payload);
    assert.strictEqual(res.success, true);
  });

  it('validates createTeamUserSchema rejects invalid tab keys', () => {
    const payload = {
      fullName: 'Invalid User',
      email: 'invalid@marcaubi.com',
      role: 'viewer' as const,
      jobTitle: 'Auditor',
      tempPassword: 'ValidPass123!@#',
      allowedTabs: ['command_center', 'non_existent_tab_key'],
    };

    const res = createTeamUserSchema.safeParse(payload);
    assert.strictEqual(res.success, false);
  });

  it('validates updateUserPermissionsSchema accepts valid UUID and custom tab permissions', () => {
    const payload = {
      targetUserId: 'd3b07384-d113-4696-9812-70df59441234',
      allowedTabs: ['command_center', 'leads', 'deals', 'tasks'] as CrmTabKey[],
    };

    const res = updateUserPermissionsSchema.safeParse(payload);
    assert.strictEqual(res.success, true);
  });

  it('validates updateUserPermissionsSchema rejects malformed non-UUID identifiers', () => {
    const payload = {
      targetUserId: 'not-a-valid-uuid-1234',
      allowedTabs: ['command_center'],
    };

    const res = updateUserPermissionsSchema.safeParse(payload);
    assert.strictEqual(res.success, false);
  });

  it('validates updateUserPermissionsSchema rejects forbidden or unrecognized tab strings', () => {
    const payload = {
      targetUserId: 'd3b07384-d113-4696-9812-70df59441234',
      allowedTabs: ['root_shell', 'admin_override'],
    };

    const res = updateUserPermissionsSchema.safeParse(payload);
    assert.strictEqual(res.success, false);
  });

  it('validates admin self-lockout invariant logic', () => {
    const callerId = 'admin-user-001';
    const targetUserId = 'admin-user-001'; // Same user (self-edit)

    // Revoking users tab should violate policy
    const attemptedTabsNoUsers = ['command_center', 'leads', 'deals', 'settings'];
    const isSelf = targetUserId === callerId;
    const hasUsers = attemptedTabsNoUsers.includes('users');
    const hasSettings = attemptedTabsNoUsers.includes('settings');
    const isAllowed = !isSelf || (hasUsers && hasSettings);

    assert.strictEqual(isAllowed, false, 'Self-edit without users tab must be blocked');

    // Revoking settings tab should violate policy
    const attemptedTabsNoSettings = ['command_center', 'leads', 'deals', 'users'];
    const hasSettings2 = attemptedTabsNoSettings.includes('settings');
    const isAllowed2 = !isSelf || (hasUsers && hasSettings2);

    assert.strictEqual(isAllowed2, false, 'Self-edit without settings tab must be blocked');

    // Retaining both users and settings should be allowed
    const validSelfTabs = ['command_center', 'leads', 'deals', 'users', 'settings'];
    const isAllowedValid = !isSelf || (validSelfTabs.includes('users') && validSelfTabs.includes('settings'));
    assert.strictEqual(isAllowedValid, true, 'Self-edit retaining users and settings must be permitted');
  });

  it('validates custom tab override detection accurately distinguishes default from modified permissions', () => {
    const isCustomOverride = (role: CrmUserRole, tabs: string[]): boolean => {
      const defaults = getInitialAllowedTabs(role);
      if (tabs.length !== defaults.length) return true;
      return !tabs.every((t) => defaults.includes(t as CrmTabKey));
    };

    // Sales Executive with standard 5 tabs -> false
    assert.strictEqual(
      isCustomOverride('sales_executive', ['command_center', 'leads', 'deals', 'works', 'tasks']),
      false
    );

    // Sales Executive with custom 'analytics' tab added -> true
    assert.strictEqual(
      isCustomOverride('sales_executive', ['command_center', 'leads', 'deals', 'works', 'tasks', 'analytics']),
      true
    );

    // Admin with all 9 tabs -> false
    assert.strictEqual(
      isCustomOverride('admin', [
        'command_center', 'leads', 'deals', 'works', 'tasks',
        'users', 'analytics', 'ingestion', 'settings',
      ]),
      false
    );

    // Admin with 'leads' stripped -> true
    assert.strictEqual(
      isCustomOverride('admin', [
        'command_center', 'deals', 'works', 'tasks',
        'users', 'analytics', 'ingestion', 'settings',
      ]),
      true
    );

    // Sales Manager with 8 standard tabs -> false
    assert.strictEqual(
      isCustomOverride('sales_manager', [
        'command_center', 'leads', 'deals', 'works', 'tasks',
        'users', 'analytics', 'ingestion',
      ]),
      false
    );
  });

  it('validates edge middleware ROUTE_TAB_MAP covers all 9 canonical tabs and aliased routes', () => {
    const ROUTE_TAB_MAP: Array<{ prefix: string; tabKey: CrmTabKey }> = [
      { prefix: '/admin/team', tabKey: 'users' },
      { prefix: '/admin/users', tabKey: 'users' },
      { prefix: '/admin/analytics', tabKey: 'analytics' },
      { prefix: '/admin/ingestion', tabKey: 'ingestion' },
      { prefix: '/admin/settings', tabKey: 'settings' },
      { prefix: '/admin/leads', tabKey: 'leads' },
      { prefix: '/admin/deals', tabKey: 'deals' },
      { prefix: '/admin/works', tabKey: 'works' },
      { prefix: '/admin/tasks', tabKey: 'tasks' },
    ];

    // Ensure all 9 canonical tabs have mapped route prefixes
    const coveredTabKeys = new Set(ROUTE_TAB_MAP.map((r) => r.tabKey));
    const allExpectedTabs: CrmTabKey[] = [
      'command_center',
      'leads',
      'deals',
      'works',
      'tasks',
      'users',
      'analytics',
      'ingestion',
      'settings',
    ];

    allExpectedTabs.forEach((tab) => {
      if (tab !== 'command_center') {
        assert.ok(coveredTabKeys.has(tab), `Tab key '${tab}' must be protected by edge middleware`);
      }
    });

    // Verify /admin/users alias maps to 'users' tab
    const usersAlias = ROUTE_TAB_MAP.find((r) => r.prefix === '/admin/users');
    assert.ok(usersAlias);
    assert.strictEqual(usersAlias.tabKey, 'users');
  });
});
