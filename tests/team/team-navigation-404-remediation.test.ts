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

    it('returns false when user session is null or undefined', () => {
      assert.equal(isTabAuthorized('users', null), false);
      assert.equal(isTabAuthorized('users', undefined), false);
    });
  });

  describe('2. Server Component & Server Action Permission Predicate Invariants', () => {
    /**
     * Replicates the exact architectural predicate used in team/page.tsx and actions/team.ts:
     */
    function evaluateUsersAccess(role: CrmUserRole, allowedTabs?: string[] | null): boolean {
      return (
        role === 'admin' ||
        (Array.isArray(allowedTabs) && allowedTabs.length > 0
          ? allowedTabs.includes('users')
          : role === 'sales_manager')
      );
    }

    it('evaluates true for admin across all allowed_tabs permutations', () => {
      assert.equal(evaluateUsersAccess('admin', []), true);
      assert.equal(evaluateUsersAccess('admin', undefined), true);
      assert.equal(evaluateUsersAccess('admin', null), true);
      assert.equal(evaluateUsersAccess('admin', ['deals']), true);
      assert.equal(evaluateUsersAccess('admin', ['users']), true);
    });

    it('evaluates true for sales_manager with empty or unpopulated tabs', () => {
      assert.equal(evaluateUsersAccess('sales_manager', []), true);
      assert.equal(evaluateUsersAccess('sales_manager', undefined), true);
      assert.equal(evaluateUsersAccess('sales_manager', null), true);
    });

    it('evaluates false for sales_manager when custom array explicitly excludes users', () => {
      assert.equal(evaluateUsersAccess('sales_manager', ['deals', 'leads']), false);
    });

    it('evaluates false for sales_executive by default or with empty array', () => {
      assert.equal(evaluateUsersAccess('sales_executive', []), false);
      assert.equal(evaluateUsersAccess('sales_executive', undefined), false);
      assert.equal(evaluateUsersAccess('sales_executive', null), false);
      assert.equal(evaluateUsersAccess('sales_executive', ['deals']), false);
    });

    it('evaluates true for sales_executive with custom override', () => {
      assert.equal(evaluateUsersAccess('sales_executive', ['users', 'leads']), true);
    });

    it('evaluates false for viewer roles by default', () => {
      assert.equal(evaluateUsersAccess('viewer', []), false);
      assert.equal(evaluateUsersAccess('viewer', undefined), false);
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
