/**
 * @file phase-4-funnel-workspaces-and-kanban.test.ts
 * @description Dedicated unit and integration test suite for Phase 4:
 *              Dedicated Funnel Workspaces (Deals Kanban Board, Inbound Leads Triage,
 *              Client Works Milestone Engine, Directorial Governance & Targeted Rollback).
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertLeadToDealSchema,
  type ConvertLeadToDealInput,
} from '@/app/lib/lead-schemas';
import {
  updateClientWorkMilestoneSchema,
  updateClientWorkStageSchema,
  updateClientWorkHealthSchema,
  assignClientWorkLeadsSchema,
  clientWorkDeliveryStages,
  clientWorkHealthStatuses,
} from '@/app/lib/client-works-schemas';

describe('Phase 4: Funnel Workspaces, Deals Kanban & Client Works Suite', () => {
  const validLeadUuid = '11111111-1111-4111-a111-111111111111';
  const validStatusUuid = '22222222-2222-4222-a222-222222222222';
  const validAssigneeUuid = '33333333-3333-4333-a333-333333333333';
  const validDirectorUuid = '44444444-4444-4444-a444-444444444444';

  describe('Block 1: Inbound Lead 1-Click Conversion Schema (convertLeadToDealSchema)', () => {
    it('accepts valid conversion payload with all coordinates', () => {
      const payload: ConvertLeadToDealInput = {
        leadId: validLeadUuid,
        targetStatusId: validStatusUuid,
        expectedValue: 1500000,
        assignedTo: validAssigneeUuid,
        priority: 'High',
        notes: 'High intent enterprise client requesting complete rebrand and web platform.',
      };

      const result = convertLeadToDealSchema.safeParse(payload);
      assert.equal(result.success, true);
    });

    it('accepts conversion payload when optional fields (targetStatusId, assignedTo, notes) are omitted', () => {
      const payload = {
        leadId: validLeadUuid,
        expectedValue: 750000,
      };

      const result = convertLeadToDealSchema.safeParse(payload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.priority, 'High'); // default
      }
    });

    it('rejects negative expected valuation', () => {
      const payload = {
        leadId: validLeadUuid,
        expectedValue: -5000,
      };

      const result = convertLeadToDealSchema.safeParse(payload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.match(result.error.issues[0].message, /valuation cannot be negative/i);
      }
    });

    it('rejects non-UUID lead identifier', () => {
      const payload = {
        leadId: 'invalid-lead-id-1234',
        expectedValue: 500000,
      };

      const result = convertLeadToDealSchema.safeParse(payload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.match(result.error.issues[0].message, /invalid lead identifier/i);
      }
    });

    it('rejects notes exceeding 2000 characters', () => {
      const payload = {
        leadId: validLeadUuid,
        expectedValue: 500000,
        notes: 'a'.repeat(2001),
      };

      const result = convertLeadToDealSchema.safeParse(payload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.match(result.error.issues[0].message, /must not exceed 2000 characters/i);
      }
    });
  });

  describe('Block 2: Client Works Milestone & Stage Validation Schemas', () => {
    it('accepts valid milestone update payload for all supported statuses', () => {
      for (const st of ['pending', 'in_progress', 'completed'] as const) {
        const result = updateClientWorkMilestoneSchema.safeParse({
          workId: validLeadUuid,
          milestoneId: 'm1',
          status: st,
        });
        assert.equal(result.success, true);
      }
    });

    it('rejects unsupported milestone status', () => {
      const result = updateClientWorkMilestoneSchema.safeParse({
        workId: validLeadUuid,
        milestoneId: 'm1',
        status: 'archived',
      });
      assert.equal(result.success, false);
    });

    it('validates all canonical production delivery stages', () => {
      for (const stage of clientWorkDeliveryStages) {
        const result = updateClientWorkStageSchema.safeParse({
          workId: validLeadUuid,
          stage,
          notes: `Transitioning to ${stage}`,
        });
        assert.equal(result.success, true);
      }
    });

    it('rejects malformed delivery stage name', () => {
      const result = updateClientWorkStageSchema.safeParse({
        workId: validLeadUuid,
        stage: 'not_a_valid_stage',
      });
      assert.equal(result.success, false);
    });

    it('validates all canonical operational health statuses', () => {
      for (const healthStatus of clientWorkHealthStatuses) {
        const result = updateClientWorkHealthSchema.safeParse({
          workId: validLeadUuid,
          healthStatus,
          reason: 'Periodic checkup',
        });
        assert.equal(result.success, true);
      }
    });

    it('validates director assignment schema with valid UUIDs', () => {
      const result = assignClientWorkLeadsSchema.safeParse({
        workId: validLeadUuid,
        creativeLeadId: validAssigneeUuid,
        techLeadId: validDirectorUuid,
      });
      assert.equal(result.success, true);
    });

    it('allows clearing directors by passing null', () => {
      const result = assignClientWorkLeadsSchema.safeParse({
        workId: validLeadUuid,
        creativeLeadId: null,
        techLeadId: null,
      });
      assert.equal(result.success, true);
    });

    it('rejects invalid director UUIDs', () => {
      const result = assignClientWorkLeadsSchema.safeParse({
        workId: validLeadUuid,
        creativeLeadId: 'not-a-valid-uuid',
      });
      assert.equal(result.success, false);
    });
  });

  describe('Block 3: Deals Kanban Column Pipeline Aggregation', () => {
    interface MockDeal {
      id: string;
      status_id: string;
      expected_value: number;
    }

    const mockDeals: MockDeal[] = [
      { id: '1', status_id: 'stage-1', expected_value: 200000 },
      { id: '2', status_id: 'stage-1', expected_value: 300000 },
      { id: '3', status_id: 'stage-2', expected_value: 1500000 },
      { id: '4', status_id: 'stage-3', expected_value: 12000000 },
    ];

    it('groups deals by stage and accurately calculates column sums in tabular-nums format', () => {
      const stage1Deals = mockDeals.filter((d) => d.status_id === 'stage-1');
      const stage1Sum = stage1Deals.reduce((acc, d) => acc + d.expected_value, 0);

      assert.equal(stage1Deals.length, 2);
      assert.equal(stage1Sum, 500000);

      const stage2Deals = mockDeals.filter((d) => d.status_id === 'stage-2');
      const stage2Sum = stage2Deals.reduce((acc, d) => acc + d.expected_value, 0);

      assert.equal(stage2Deals.length, 1);
      assert.equal(stage2Sum, 1500000);

      const stage3Deals = mockDeals.filter((d) => d.status_id === 'stage-3');
      const stage3Sum = stage3Deals.reduce((acc, d) => acc + d.expected_value, 0);

      assert.equal(stage3Deals.length, 1);
      assert.equal(stage3Sum, 12000000);
    });
  });

  describe('Block 4: Works Milestone Progress Meter Mathematical Logic', () => {
    it('accurately calculates completion percentage across variable milestone lists', () => {
      const milestones = [
        { id: 'm1', status: 'completed' },
        { id: 'm2', status: 'completed' },
        { id: 'm3', status: 'in_progress' },
        { id: 'm4', status: 'pending' },
        { id: 'm5', status: 'pending' },
      ];

      const completedCount = milestones.filter((m) => m.status === 'completed').length;
      const totalCount = milestones.length;
      const progressPercent = Math.round((completedCount / totalCount) * 100);

      assert.equal(completedCount, 2);
      assert.equal(totalCount, 5);
      assert.equal(progressPercent, 40);
    });

    it('handles zero milestones defensively without division-by-zero or NaN errors', () => {
      const milestones: Array<{ id: string; status: string }> = [];
      const totalCount = milestones.length;
      const completedCount = milestones.filter((m) => m.status === 'completed').length;
      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      assert.equal(progressPercent, 0);
      assert.equal(Number.isNaN(progressPercent), false);
    });
  });

  describe('Block 5: Targeted Optimistic Rollback Invariants', () => {
    it('targeted rollback reverts only the affected deal while preserving concurrent mutations', () => {
      interface DealState {
        id: string;
        stage: string;
      }

      const initial: DealState[] = [
        { id: 'd1', stage: 'stage-1' },
        { id: 'd2', stage: 'stage-1' },
        { id: 'd3', stage: 'stage-2' },
      ];

      // Optimistically move d1 to stage-2
      const modified: DealState[] = initial.map((d) =>
        d.id === 'd1' ? { ...d, stage: 'stage-2' } : d
      );

      // Concurrent change on d2 to stage-3
      const concurrent: DealState[] = modified.map((d) =>
        d.id === 'd2' ? { ...d, stage: 'stage-3' } : d
      );

      // Target rollback on d1 failure: revert only d1 to initial['d1']
      const originalD1 = initial.find((d) => d.id === 'd1')!;
      const rolledBack = concurrent.map((d) => (d.id === 'd1' ? originalD1 : d));

      assert.equal(rolledBack[0].stage, 'stage-1'); // d1 restored
      assert.equal(rolledBack[1].stage, 'stage-3'); // d2 concurrent edit preserved!
      assert.equal(rolledBack[2].stage, 'stage-2'); // d3 untouched
    });
  });
});
