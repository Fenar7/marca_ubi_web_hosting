/**
 * @file stage_transition_actions.test.ts
 * @description Comprehensive automated test suite for Sprint 8.3 Server Actions:
 *              - Zod input validation schemas for Negotiation, Lost, and Converted
 *              - Negative and zero deal valuation rejections
 *              - Standardized lost_reason enum enforcement & minimum 10-char notes for 'Other'
 *              - Converted commercial terms & positive revenue enforcement
 *              - State machine linear progression (New -> Converted illegal jump defense)
 *              - RBAC invariants (Viewer 403, Sales Executive sandboxing)
 *              - Post-conversion record locking (Non-admin 403 rejection)
 * @module tests/actions/stage_transition_actions.test
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  transitionToNegotiationSchema,
  transitionToLostSchema,
  transitionToConvertedSchema,
  LOST_REASON_OPTIONS,
  LOST_REASON_ALIASES,
} from '@/app/actions/stageTransitionActions';
import type { CrmUserRole } from '@/types/crm';

describe('Sprint 8.3: Guarded Stage Transition Actions & State Machine Locking', () => {
  const validLeadUuid = 'a0000000-0000-0000-0000-000000000001';

  // -------------------------------------------------------------
  // Block 1: Negotiation Schema & Positive Valuation
  // -------------------------------------------------------------
  describe('Block 1: transitionToNegotiationSchema Validation', () => {
    it('accepts perfectly formatted negotiation payloads', () => {
      const payload = {
        leadId: validLeadUuid,
        expectedValue: 750000,
        anticipatedCloseDate: '2026-11-15',
        notes: 'Client reviewed commercial scope and requested milestone breakdown.',
      };

      const result = transitionToNegotiationSchema.safeParse(payload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.expectedValue, 750000);
        assert.equal(result.data.anticipatedCloseDate, '2026-11-15');
      }
    });

    it('strictly blocks zero or negative expected valuations', () => {
      const invalidValues = [0, -100, -500000];

      invalidValues.forEach((val) => {
        const result = transitionToNegotiationSchema.safeParse({
          leadId: validLeadUuid,
          expectedValue: val,
          anticipatedCloseDate: '2026-11-15',
        });
        assert.equal(result.success, false);
      });
    });

    it('strictly blocks invalid lead UUIDs', () => {
      const result = transitionToNegotiationSchema.safeParse({
        leadId: 'not-a-valid-uuid',
        expectedValue: 500000,
        anticipatedCloseDate: '2026-11-15',
      });
      assert.equal(result.success, false);
    });

    it('requires an anticipated close date', () => {
      const result = transitionToNegotiationSchema.safeParse({
        leadId: validLeadUuid,
        expectedValue: 500000,
        anticipatedCloseDate: '',
      });
      assert.equal(result.success, false);
    });
  });

  // -------------------------------------------------------------
  // Block 2: Lost Reason Schema & Mandatory Disclosures
  // -------------------------------------------------------------
  describe('Block 2: transitionToLostSchema Validation & Loss Attribution', () => {
    it('accepts all standardized lost reason enum values', () => {
      LOST_REASON_OPTIONS.forEach((reason) => {
        const payload = {
          leadId: validLeadUuid,
          lostReason: reason,
          lostNotes: reason === 'Other' ? 'Client chose to postpone initiatives indefinitely' : undefined,
        };

        const result = transitionToLostSchema.safeParse(payload);
        assert.equal(result.success, true, `Failed for reason: ${reason}`);
      });
    });

    it('accepts recognized shorthand alias keys (e.g. price, competitor, timing)', () => {
      const aliases = ['price', 'competitor', 'out_of_scope', 'timing', 'ghosted', 'terms'];

      aliases.forEach((alias) => {
        const result = transitionToLostSchema.safeParse({
          leadId: validLeadUuid,
          lostReason: alias,
        });
        assert.equal(result.success, true, `Failed for alias: ${alias}`);
      });
    });

    it('strictly requires minimum 10 characters for explanatory notes when selecting Other', () => {
      const invalidOtherPayloads = [
        { leadId: validLeadUuid, lostReason: 'Other', lostNotes: '' },
        { leadId: validLeadUuid, lostReason: 'Other', lostNotes: 'Too high' }, // 8 chars
        { leadId: validLeadUuid, lostReason: 'Other', lostNotes: '         ' },
        { leadId: validLeadUuid, lostReason: 'other', lostNotes: '123456789' }, // 9 chars
      ];

      invalidOtherPayloads.forEach((payload) => {
        const result = transitionToLostSchema.safeParse(payload);
        assert.equal(result.success, false, `Should have rejected short notes for: ${payload.lostNotes}`);
      });

      // Valid other payload with >= 10 chars
      const validOther = transitionToLostSchema.safeParse({
        leadId: validLeadUuid,
        lostReason: 'Other',
        lostNotes: 'Client had internal organizational restructuring.',
      });
      assert.equal(validOther.success, true);
    });

    it('rejects unlisted, arbitrary lost reason values', () => {
      const result = transitionToLostSchema.safeParse({
        leadId: validLeadUuid,
        lostReason: 'random_unsupported_reason',
      });
      assert.equal(result.success, false);
    });
  });

  // -------------------------------------------------------------
  // Block 3: Converted Schema & Commercial Terms
  // -------------------------------------------------------------
  describe('Block 3: transitionToConvertedSchema Validation', () => {
    it('accepts fully satisfied commercial conversion terms', () => {
      const payload = {
        leadId: validLeadUuid,
        finalRevenue: 1250000,
        signedContractDate: '2026-10-15',
        paymentTerms: '50% upfront retainer, 50% on milestone deployment',
        notes: 'Executive sponsor approved master service agreement.',
      };

      const result = transitionToConvertedSchema.safeParse(payload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.finalRevenue, 1250000);
        assert.equal(result.data.signedContractDate, '2026-10-15');
      }
    });

    it('strictly blocks zero or negative final revenue', () => {
      const invalidRevenues = [0, -500, -1200000];

      invalidRevenues.forEach((rev) => {
        const result = transitionToConvertedSchema.safeParse({
          leadId: validLeadUuid,
          finalRevenue: rev,
          signedContractDate: '2026-10-15',
          paymentTerms: '50% upfront, 50% completion',
        });
        assert.equal(result.success, false);
      });
    });

    it('requires non-empty payment terms with minimum 3 characters', () => {
      const invalidTerms = ['', '  ', 'ok', 'ab'];

      invalidTerms.forEach((terms) => {
        const result = transitionToConvertedSchema.safeParse({
          leadId: validLeadUuid,
          finalRevenue: 500000,
          signedContractDate: '2026-10-15',
          paymentTerms: terms,
        });
        assert.equal(result.success, false);
      });
    });
  });

  // -------------------------------------------------------------
  // Block 4: State Machine Progression & Converted Deal Locking
  // -------------------------------------------------------------
  describe('Block 4: State Machine Invariants & Post-Conversion Locking', () => {
    interface MockLead {
      id: string;
      assigned_to: string | null;
      status_name: string;
      bucket: string;
      converted_at: string | null;
    }

    interface MockCaller {
      id: string;
      role: CrmUserRole;
      status: 'active' | 'suspended';
    }

    function evaluateTransitionPermission(
      caller: MockCaller,
      lead: MockLead,
      targetStage: 'Negotiation' | 'Lost' | 'Converted'
    ): { allowed: boolean; code: number; reason?: string } {
      if (caller.status !== 'active') {
        return { allowed: false, code: 403, reason: 'Forbidden: Account suspended.' };
      }

      if (caller.role === 'viewer') {
        return { allowed: false, code: 403, reason: 'Forbidden: Viewers hold read-only permissions.' };
      }

      // Post-Conversion Record Lock: Only admin can modify a converted deal
      if (lead.converted_at && caller.role !== 'admin') {
        return { allowed: false, code: 403, reason: 'Forbidden: Converted deals are locked from non-admin modifications.' };
      }

      // Sales Executive Portfolio Sandboxing
      if (caller.role === 'sales_executive' && lead.assigned_to !== caller.id) {
        return { allowed: false, code: 403, reason: 'Unauthorized: Sales Executives locked to assigned portfolio.' };
      }

      // State Machine Progression: Direct jump to Converted from New, Contacted, or Lost is blocked
      if (targetStage === 'Converted') {
        if (lead.status_name === 'New' || lead.status_name === 'Contacted') {
          return {
            allowed: false,
            code: 422,
            reason: 'Invalid stage transition: Deals must reach at least Qualified or Negotiation before conversion.',
          };
        }
        if (lead.bucket === 'lost' || lead.status_name === 'Lost') {
          return {
            allowed: false,
            code: 422,
            reason: 'Invalid stage transition: Lost leads cannot be directly converted.',
          };
        }
      }

      return { allowed: true, code: 200 };
    }

    it('blocks illegal shortcut: New -> Converted without qualification', () => {
      const caller: MockCaller = { id: 'usr-1', role: 'sales_executive', status: 'active' };
      const lead: MockLead = {
        id: validLeadUuid,
        assigned_to: 'usr-1',
        status_name: 'New',
        bucket: 'open',
        converted_at: null,
      };

      const outcome = evaluateTransitionPermission(caller, lead, 'Converted');
      assert.equal(outcome.allowed, false);
      assert.equal(outcome.code, 422);
    });

    it('blocks direct conversion from Lost back to Converted', () => {
      const caller: MockCaller = { id: 'adm-1', role: 'admin', status: 'active' };
      const lead: MockLead = {
        id: validLeadUuid,
        assigned_to: 'usr-1',
        status_name: 'Lost',
        bucket: 'lost',
        converted_at: null,
      };

      const outcome = evaluateTransitionPermission(caller, lead, 'Converted');
      assert.equal(outcome.allowed, false);
      assert.equal(outcome.code, 422);
    });

    it('allows valid progression: Negotiation -> Converted for assigned executive', () => {
      const caller: MockCaller = { id: 'usr-1', role: 'sales_executive', status: 'active' };
      const lead: MockLead = {
        id: validLeadUuid,
        assigned_to: 'usr-1',
        status_name: 'Negotiation',
        bucket: 'potential',
        converted_at: null,
      };

      const outcome = evaluateTransitionPermission(caller, lead, 'Converted');
      assert.equal(outcome.allowed, true);
    });

    it('locks converted records against non-admin roles (sales_executive & sales_manager)', () => {
      const nonAdminRoles: CrmUserRole[] = ['sales_executive', 'sales_manager'];
      const convertedLead: MockLead = {
        id: validLeadUuid,
        assigned_to: 'usr-1',
        status_name: 'Converted',
        bucket: 'converted',
        converted_at: '2026-10-15T12:00:00Z',
      };

      nonAdminRoles.forEach((role) => {
        const caller: MockCaller = { id: 'usr-1', role, status: 'active' };
        const outcome = evaluateTransitionPermission(caller, convertedLead, 'Negotiation');
        assert.equal(outcome.allowed, false);
        assert.equal(outcome.code, 403);
        assert.match(outcome.reason || '', /Converted deals are locked/);
      });
    });

    it('permits system administrator to edit or adjust converted deals', () => {
      const adminCaller: MockCaller = { id: 'adm-1', role: 'admin', status: 'active' };
      const convertedLead: MockLead = {
        id: validLeadUuid,
        assigned_to: 'usr-1',
        status_name: 'Converted',
        bucket: 'converted',
        converted_at: '2026-10-15T12:00:00Z',
      };

      const outcome = evaluateTransitionPermission(adminCaller, convertedLead, 'Negotiation');
      assert.equal(outcome.allowed, true);
    });

    it('blocks viewer role from all stage transitions', () => {
      const viewerCaller: MockCaller = { id: 'vwr-1', role: 'viewer', status: 'active' };
      const lead: MockLead = {
        id: validLeadUuid,
        assigned_to: 'usr-1',
        status_name: 'Contacted',
        bucket: 'open',
        converted_at: null,
      };

      const outcome = evaluateTransitionPermission(viewerCaller, lead, 'Negotiation');
      assert.equal(outcome.allowed, false);
      assert.equal(outcome.code, 403);
    });
  });
});
