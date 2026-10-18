/**
 * @file phase-2-navigation-and-routes.test.ts
 * @description Unit test suite for Phase 2: Dynamic Tab Navigation Rail, Role Sandboxing & Route Restructure.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NAVIGATION_GROUPS,
  isTabAuthorized,
} from '../../src/app/admin/components/layout/navigationConfig';
import {
  CRM_TAB_REGISTRY,
  type CurrentUserSession,
} from '../../src/types/crm';

describe('Phase 2: Navigation Taxonomy, RBAC Evaluation & Route Architecture', () => {
  it('verifies NAVIGATION_GROUPS organizes all 9 canonical tabs into 3 enclaves', () => {
    assert.strictEqual(NAVIGATION_GROUPS.length, 3);

    const groupTitles = NAVIGATION_GROUPS.map((g) => g.groupTitle);
    assert.deepStrictEqual(groupTitles, [
      'Commercial Pipeline',
      'Agency Operations',
      'System & Governance',
    ]);

    const allKeys = NAVIGATION_GROUPS.flatMap((g) => g.items.map((i) => i.key));
    assert.strictEqual(allKeys.length, 9);
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

    // Check that every registered CRM tab is accounted for
    CRM_TAB_REGISTRY.forEach((tab) => {
      assert.ok(
        allKeys.includes(tab.key),
        `Canonical tab '${tab.key}' must be present in NAVIGATION_GROUPS`
      );
    });
  });

  it('validates navigation route paths map correctly to Next.js App Router workspace routes', () => {
    const flatItems = NAVIGATION_GROUPS.flatMap((g) => g.items);
    const pathMap = Object.fromEntries(flatItems.map((i) => [i.key, i.href]));

    assert.strictEqual(pathMap.command_center, '/admin');
    assert.strictEqual(pathMap.leads, '/admin/leads');
    assert.strictEqual(pathMap.deals, '/admin/deals');
    assert.strictEqual(pathMap.tasks, '/admin/tasks');
    assert.strictEqual(pathMap.works, '/admin/works');
    assert.strictEqual(pathMap.analytics, '/admin/analytics');
    assert.strictEqual(pathMap.ingestion, '/admin/ingestion');
    assert.strictEqual(pathMap.users, '/admin/team');
    assert.strictEqual(pathMap.settings, '/admin/settings');
  });

  it('evaluates isTabAuthorized for an Admin user with undefined allowed_tabs', () => {
    const adminUser: CurrentUserSession = {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'admin@marcaubi.com',
      name: 'Super Admin',
      fullName: 'Super Admin',
      role: 'admin',
    };

    // Admin without explicit override should have access to all 9 tabs via ROLE_DEFAULT_TABS
    CRM_TAB_REGISTRY.forEach((tab) => {
      assert.strictEqual(
        isTabAuthorized(tab.key, adminUser),
        true,
        `Admin must have access to ${tab.key}`
      );
    });
  });

  it('evaluates isTabAuthorized honoring granular allowed_tabs overrides', () => {
    const restrictedAdmin: CurrentUserSession = {
      id: 'a0000000-0000-0000-0000-000000000002',
      email: 'restricted@marcaubi.com',
      name: 'Restricted User',
      fullName: 'Restricted User',
      role: 'admin',
      allowed_tabs: ['command_center', 'deals', 'works'],
    };

    assert.strictEqual(isTabAuthorized('command_center', restrictedAdmin), true);
    assert.strictEqual(isTabAuthorized('deals', restrictedAdmin), true);
    assert.strictEqual(isTabAuthorized('works', restrictedAdmin), true);
    assert.strictEqual(isTabAuthorized('leads', restrictedAdmin), false);
    assert.strictEqual(isTabAuthorized('analytics', restrictedAdmin), false);
    assert.strictEqual(isTabAuthorized('users', restrictedAdmin), false);
    assert.strictEqual(isTabAuthorized('settings', restrictedAdmin), false);
  });

  it('evaluates isTabAuthorized for Sales Executive using default role matrix', () => {
    const execUser: CurrentUserSession = {
      id: 'e0000000-0000-0000-0000-000000000001',
      email: 'exec@marcaubi.com',
      name: 'Sales Exec',
      fullName: 'Sales Exec',
      role: 'sales_executive',
    };

    assert.strictEqual(isTabAuthorized('command_center', execUser), true);
    assert.strictEqual(isTabAuthorized('leads', execUser), true);
    assert.strictEqual(isTabAuthorized('deals', execUser), true);
    assert.strictEqual(isTabAuthorized('works', execUser), true);
    assert.strictEqual(isTabAuthorized('tasks', execUser), true);

    // Forbidden for sales executive by default
    assert.strictEqual(isTabAuthorized('users', execUser), false);
    assert.strictEqual(isTabAuthorized('analytics', execUser), false);
    assert.strictEqual(isTabAuthorized('ingestion', execUser), false);
    assert.strictEqual(isTabAuthorized('settings', execUser), false);
  });

  it('evaluates isTabAuthorized for Viewer role using default role matrix', () => {
    const viewerUser: CurrentUserSession = {
      id: 'v0000000-0000-0000-0000-000000000001',
      email: 'viewer@marcaubi.com',
      name: 'Finance Auditor',
      fullName: 'Finance Auditor',
      role: 'viewer',
    };

    assert.strictEqual(isTabAuthorized('command_center', viewerUser), true);
    assert.strictEqual(isTabAuthorized('leads', viewerUser), true);
    assert.strictEqual(isTabAuthorized('deals', viewerUser), true);
    assert.strictEqual(isTabAuthorized('works', viewerUser), true);
    assert.strictEqual(isTabAuthorized('analytics', viewerUser), true);

    // Forbidden for viewer by default
    assert.strictEqual(isTabAuthorized('tasks', viewerUser), false);
    assert.strictEqual(isTabAuthorized('users', viewerUser), false);
    assert.strictEqual(isTabAuthorized('ingestion', viewerUser), false);
    assert.strictEqual(isTabAuthorized('settings', viewerUser), false);
  });

  it('evaluates isTabAuthorized for Sales Manager role using default role matrix', () => {
    const managerUser: CurrentUserSession = {
      id: 'm0000000-0000-0000-0000-000000000001',
      email: 'manager@marcaubi.com',
      name: 'Sales Director',
      fullName: 'Sales Director',
      role: 'sales_manager',
    };

    assert.strictEqual(isTabAuthorized('command_center', managerUser), true);
    assert.strictEqual(isTabAuthorized('leads', managerUser), true);
    assert.strictEqual(isTabAuthorized('deals', managerUser), true);
    assert.strictEqual(isTabAuthorized('works', managerUser), true);
    assert.strictEqual(isTabAuthorized('tasks', managerUser), true);
    assert.strictEqual(isTabAuthorized('users', managerUser), true);
    assert.strictEqual(isTabAuthorized('analytics', managerUser), true);
    assert.strictEqual(isTabAuthorized('ingestion', managerUser), true);

    // Only settings forbidden for sales manager
    assert.strictEqual(isTabAuthorized('settings', managerUser), false);
  });

  it('handles null or unauthenticated user defensively without throwing', () => {
    assert.strictEqual(isTabAuthorized('command_center', null), false);
    assert.strictEqual(isTabAuthorized('leads', undefined), false);
  });
});
