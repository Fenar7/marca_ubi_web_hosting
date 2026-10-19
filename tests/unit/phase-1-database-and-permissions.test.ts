/**
 * @file phase-1-database-and-permissions.test.ts
 * @description Unit test suite for Phase 1: Granular Tab Permissions & Client Works Zod Schemas.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  tabPermissionsSchema,
  featurePermissionsSchema,
  createTeamUserSchema,
  updateUserPermissionsSchema,
} from '../../src/app/lib/team-schemas';
import {
  updateClientWorkStageSchema,
  updateClientWorkHealthSchema,
  updateClientWorkMilestoneSchema,
  assignClientWorkLeadsSchema,
} from '../../src/app/lib/client-works-schemas';
import {
  CRM_TAB_REGISTRY,
  ROLE_DEFAULT_TABS,
  ROLE_DEFAULT_FEATURES,
} from '../../src/types/crm';

describe('Phase 1: Granular Tab & Capability Permissions Schema Suite', () => {
  it('verifies CRM_TAB_REGISTRY contains exactly 9 canonical tabs', () => {
    assert.strictEqual(CRM_TAB_REGISTRY.length, 9);
    const tabKeys = CRM_TAB_REGISTRY.map((t) => t.key);
    assert.deepStrictEqual(tabKeys, [
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
  });

  it('validates ROLE_DEFAULT_TABS assigns all 9 tabs to Admin', () => {
    const adminTabs = ROLE_DEFAULT_TABS.admin;
    assert.strictEqual(Object.values(adminTabs).every(Boolean), true);
  });

  it('validates ROLE_DEFAULT_TABS sandboxes Sales Executive away from Users, Analytics, Ingestion, and Settings', () => {
    const execTabs = ROLE_DEFAULT_TABS.sales_executive;
    assert.strictEqual(execTabs.command_center, true);
    assert.strictEqual(execTabs.leads, true);
    assert.strictEqual(execTabs.deals, true);
    assert.strictEqual(execTabs.works, true);
    assert.strictEqual(execTabs.tasks, true);
    assert.strictEqual(execTabs.users, false);
    assert.strictEqual(execTabs.analytics, false);
    assert.strictEqual(execTabs.ingestion, false);
    assert.strictEqual(execTabs.settings, false);
  });

  it('validates ROLE_DEFAULT_FEATURES grants full capabilities to Admin only', () => {
    const adminFeatures = ROLE_DEFAULT_FEATURES.admin;
    assert.strictEqual(adminFeatures.can_view_financials, true);
    assert.strictEqual(adminFeatures.can_export_data, true);
    assert.strictEqual(adminFeatures.can_reassign_leads, true);
    assert.strictEqual(adminFeatures.can_delete_records, true);
    assert.strictEqual(adminFeatures.can_manage_team, true);

    const execFeatures = ROLE_DEFAULT_FEATURES.sales_executive;
    assert.strictEqual(execFeatures.can_view_financials, false);
    assert.strictEqual(execFeatures.can_manage_team, false);
  });

  it('validates tabPermissionsSchema rejects payloads missing mandatory tabs', () => {
    const incompletePayload = {
      command_center: true,
      leads: true,
    };
    const res = tabPermissionsSchema.safeParse(incompletePayload);
    assert.strictEqual(res.success, false);
  });

  it('validates updateUserPermissionsSchema enforces valid UUID and tab array', () => {
    const valid = {
      targetUserId: 'c1111111-1111-1111-1111-111111111111',
      allowedTabs: ['command_center', 'leads', 'deals', 'works', 'tasks'],
    };
    const res = updateUserPermissionsSchema.safeParse(valid);
    assert.strictEqual(res.success, true);

    const invalidUuid = {
      targetUserId: 'not-a-uuid',
      allowedTabs: ['command_center'],
    };
    const invalidRes = updateUserPermissionsSchema.safeParse(invalidUuid);
    assert.strictEqual(invalidRes.success, false);
  });
});

describe('Phase 1: Client Works Zod Validation Suite', () => {
  it('validates updateClientWorkStageSchema accepts valid stages and rejects invalid strings', () => {
    const valid = {
      workId: 'c1111111-1111-1111-1111-111111111111',
      stage: 'strategy',
      notes: 'Creative brief confirmed with client.',
    };
    assert.strictEqual(updateClientWorkStageSchema.safeParse(valid).success, true);

    const invalid = {
      workId: 'c1111111-1111-1111-1111-111111111111',
      stage: 'unknown_stage',
    };
    assert.strictEqual(updateClientWorkStageSchema.safeParse(invalid).success, false);
  });

  it('validates updateClientWorkHealthSchema accepts valid health statuses', () => {
    const valid = {
      workId: 'c1111111-1111-1111-1111-111111111111',
      healthStatus: 'at_risk',
      reason: 'Awaiting client feedback on high-fidelity prototypes.',
    };
    assert.strictEqual(updateClientWorkHealthSchema.safeParse(valid).success, true);

    const invalid = {
      workId: 'c1111111-1111-1111-1111-111111111111',
      healthStatus: 'critical_emergency',
    };
    assert.strictEqual(updateClientWorkHealthSchema.safeParse(invalid).success, false);
  });

  it('validates updateClientWorkMilestoneSchema accepts valid completion status', () => {
    const valid = {
      workId: 'c1111111-1111-1111-1111-111111111111',
      milestoneId: 'm1',
      status: 'completed',
    };
    assert.strictEqual(updateClientWorkMilestoneSchema.safeParse(valid).success, true);
  });

  it('validates assignClientWorkLeadsSchema verifies UUIDs for creative and tech directors', () => {
    const valid = {
      workId: 'c1111111-1111-1111-1111-111111111111',
      creativeLeadId: 'c2222222-2222-2222-2222-222222222222',
      techLeadId: 'c3333333-3333-3333-3333-333333333333',
    };
    assert.strictEqual(assignClientWorkLeadsSchema.safeParse(valid).success, true);
  });
});
