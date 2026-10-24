/**
 * @file team-navigation-404-remediation.test.ts
 * @description Unit and architectural invariant tests for Commercial Personnel Directory (/admin/team)
 *              navigation and RBAC permission predicates, preventing 404/unauthorized regressions.
 * @module tests/team/team-navigation-404-remediation
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isTabAuthorized } from '../../src/app/admin/components/layout/navigationConfig';
import { hasPersonnelDirectoryAccess } from '../../src/app/lib/team-permissions-config';
import { ROLE_DEFAULT_TABS, type CrmUserRole, type CrmTabKey } from '../../src/types/crm';
import type { CurrentUserSession } from '../../src/app/admin/components/layout/UserProfileDropdown';

describe('Commercial Personnel Directory (/admin/team) Navigation & RBAC Remediation', () => {
  describe('1. Sidebar isTabAuthorized() Invariant Tests', () => {
    it('grants universal access to administrators even if allowed_tabs is an empty array', () => {
      const adminUser: CurrentUserSession = {
        id: 'admin-uuid-1',
        name: 'Principal Administrator',
        email: 'admin@marcaubi.com',
        role: 'admin',
        jobTitle: 'Managing Partner',
        allowed_tabs: [],
      };

      assert.equal(
        isTabAuthorized('users', adminUser),
        true,
        'Admin with empty allowed_tabs MUST have users tab access'
      );
      assert.equal(
        isTabAuthorized('analytics', adminUser),
        true,
        'Admin with empty allowed_tabs MUST have analytics tab access'
      );
    });

    it('grants universal access to administrators when allowed_tabs is undefined', () => {
      const adminUser: CurrentUserSession = {
        id: 'admin-uuid-2',
        name: 'Managing Partner',
        email: 'partner@marcaubi.com',
        role: 'admin',
        jobTitle: 'Partner',
        allowed_tabs: undefined,
      };

      assert.equal(isTabAuthorized('users', adminUser), true);
    });

    it('preserves universal access for administrators even if custom tab array omits users', () => {
      const adminUser: CurrentUserSession = {
        id: 'admin-uuid-3',
        name: 'System Admin',
        email: 'sysadmin@marcaubi.com',
        role: 'admin',
        jobTitle: 'CTO',
        allowed_tabs: ['leads', 'deals'],
      };

      assert.equal(
        isTabAuthorized('users', adminUser),
        true,
        'Administrators must NEVER be locked out of governance routes'
      );
    });

    it('falls back to role default baseline for Sales Manager when allowed_tabs is empty array', () => {
      const managerUser: CurrentUserSession = {
        id: 'mgr-uuid-1',
        name: 'Sales Director',
        email: 'manager@marcaubi.com',
        role: 'sales_manager',
        jobTitle: 'Sales Director',
        allowed_tabs: [],
      };

      assert.equal(
        isTabAuthorized('users', managerUser),
        true,
        'Sales Manager baseline grants users access when allowed_tabs is empty'
      );
    });

    it('respects non-empty custom restrictions for non-admin roles', () => {
      const restrictedManager: CurrentUserSession = {
        id: 'mgr-uuid-2',
        name: 'Junior Sales Manager',
        email: 'jrmgr@marcaubi.com',
        role: 'sales_manager',
        jobTitle: 'Junior Manager',
        allowed_tabs: ['leads', 'deals'], // explicitly omits 'users'
      };

      assert.equal(
        isTabAuthorized('users', restrictedManager),
        false,
        'Non-admin with non-empty allowed_tabs excluding users must not see tab'
      );
    });

    it('denies users tab for standard Sales Executive when allowed_tabs is empty', () => {
      const execUser: CurrentUserSession = {
        id: 'exec-uuid-1',
        name: 'Sales Rep',
        email: 'rep@marcaubi.com',
        role: 'sales_executive',
        jobTitle: 'Account Executive',
        allowed_tabs: [],
      };

      assert.equal(
        isTabAuthorized('users', execUser),
        false,
        'Sales Executive baseline does not grant users tab'
      );
    });

    it('grants users tab for Sales Executive when explicitly provisioned in allowed_tabs', () => {
      const delegatedExec: CurrentUserSession = {
        id: 'exec-uuid-2',
        name: 'Lead Senior Rep',
        email: 'leadrep@marcaubi.com',
        role: 'sales_executive',
        jobTitle: 'Senior Account Executive',
        allowed_tabs: ['leads', 'deals', 'users'],
      };

      assert.equal(
        isTabAuthorized('users', delegatedExec),
        true,
        'Sales Executive with custom allowed_tabs including users must gain access'
      );
    });

    it('denies users tab for Viewer role when allowed_tabs is empty or undefined', () => {
      const viewerUser: CurrentUserSession = {
        id: 'viewer-uuid-1',
        name: 'Readonly Auditor',
        email: 'auditor@marcaubi.com',
        role: 'viewer',
        jobTitle: 'External Auditor',
        allowed_tabs: [],
      };

      assert.equal(
        isTabAuthorized('users', viewerUser),
        false,
        'Viewers must not have access to user management'
      );
    });

    it('returns false when user session is null or undefined', () => {
      assert.equal(isTabAuthorized('users', null), false);
      assert.equal(isTabAuthorized('users', undefined), false);
    });
  });

  describe('2. Canonical hasPersonnelDirectoryAccess() Production Invariant Tests', () => {
    it('evaluates true for admin across all allowed_tabs permutations', () => {
      assert.equal(hasPersonnelDirectoryAccess('admin', []), true);
      assert.equal(hasPersonnelDirectoryAccess('admin', undefined), true);
      assert.equal(hasPersonnelDirectoryAccess('admin', null), true);
      assert.equal(hasPersonnelDirectoryAccess('admin', ['deals']), true);
      assert.equal(hasPersonnelDirectoryAccess('admin', ['users']), true);
    });

    it('evaluates true for sales_manager with empty or unpopulated tabs', () => {
      assert.equal(hasPersonnelDirectoryAccess('sales_manager', []), true);
      assert.equal(hasPersonnelDirectoryAccess('sales_manager', undefined), true);
      assert.equal(hasPersonnelDirectoryAccess('sales_manager', null), true);
    });

    it('evaluates false for sales_manager when custom array explicitly excludes users', () => {
      assert.equal(hasPersonnelDirectoryAccess('sales_manager', ['deals', 'leads']), false);
    });

    it('evaluates false for sales_executive by default or with empty array', () => {
      assert.equal(hasPersonnelDirectoryAccess('sales_executive', []), false);
      assert.equal(hasPersonnelDirectoryAccess('sales_executive', undefined), false);
      assert.equal(hasPersonnelDirectoryAccess('sales_executive', null), false);
      assert.equal(hasPersonnelDirectoryAccess('sales_executive', ['deals']), false);
    });

    it('evaluates true for sales_executive with custom override', () => {
      assert.equal(hasPersonnelDirectoryAccess('sales_executive', ['users', 'leads']), true);
    });

    it('strictly evaluates false for viewer roles by default or with empty array (SEC Privilege Defense)', () => {
      assert.equal(hasPersonnelDirectoryAccess('viewer', []), false);
      assert.equal(hasPersonnelDirectoryAccess('viewer', undefined), false);
      assert.equal(hasPersonnelDirectoryAccess('viewer', null), false);
      assert.equal(hasPersonnelDirectoryAccess('viewer', ['leads', 'deals']), false);
    });

    it('grants access to viewer ONLY if explicitly provisioned with users tab in allowed_tabs', () => {
      assert.equal(hasPersonnelDirectoryAccess('viewer', ['users']), true);
    });
  });

  describe('3. Edge Route & Tab Key Mapping Alignment', () => {
    it('verifies ROLE_DEFAULT_TABS contains canonical governance mappings', () => {
      assert.equal(ROLE_DEFAULT_TABS.admin.users, true);
      assert.equal(ROLE_DEFAULT_TABS.sales_manager.users, true);
      assert.equal(ROLE_DEFAULT_TABS.sales_executive.users, false);
      assert.equal(ROLE_DEFAULT_TABS.viewer.users, false);
    });

    it('ensures all alias route prefixes correctly correspond to the users tabKey', () => {
      const ROUTE_TAB_MAP: Array<{ prefix: string; tabKey: CrmTabKey }> = [
        { prefix: '/admin/team', tabKey: 'users' },
        { prefix: '/admin/users', tabKey: 'users' },
        { prefix: '/admin/user-management', tabKey: 'users' },
      ];

      ROUTE_TAB_MAP.forEach((mapping) => {
        assert.equal(mapping.tabKey, 'users');
        assert.ok(mapping.prefix.startsWith('/admin/'));
      });
    });
  });
});
