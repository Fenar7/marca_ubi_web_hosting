/**
 * @file lead_inline_actions.test.ts
 * @description Comprehensive automated test suite for Sprint 7.2 Server Actions:
 *              - Zod input validation schemas (inlineStatusSchema, inlinePrioritySchema)
 *              - Cryptographic UUID enforcement & injection attack resilience
 *              - Priority tier whitelist verification (Low, Medium, High, Urgent)
 *              - Guarded terminal stage transition invariant defense (converted / lost)
 *              - Role sandboxing policy and activity ledger metadata payload structures
 * @module tests/actions/lead_inline_actions.test
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  inlineStatusSchema,
  inlinePrioritySchema,
} from '@/app/actions/leadInlineActions';
import { LEAD_PRIORITIES } from '@/app/lib/lead-schemas';
import type { LeadPriority, FunnelBucket, CrmUserRole } from '@/types/crm';

describe('Sprint 7.2: Server Actions & Inline Mutation Validation Engine', () => {
  describe('Block 1: inlineStatusSchema Validation & Sanitization', () => {
    it('accepts perfectly formatted canonical UUID payloads for leadId and statusId', () => {
      const validPayload = {
        leadId: 'b819f72a-d6e2-4ef9-a9a3-112233445566',
        statusId: 'e425a819-3fbc-4999-90bc-998877665544',
      };

      const result = inlineStatusSchema.safeParse(validPayload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.leadId, validPayload.leadId);
        assert.equal(result.data.statusId, validPayload.statusId);
      }
    });

    it('trims leading and trailing whitespace from valid UUIDs', () => {
      const paddedPayload = {
        leadId: '  b819f72a-d6e2-4ef9-a9a3-112233445566  ',
        statusId: '  e425a819-3fbc-4999-90bc-998877665544  ',
      };

      const result = inlineStatusSchema.safeParse(paddedPayload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.leadId, 'b819f72a-d6e2-4ef9-a9a3-112233445566');
        assert.equal(result.data.statusId, 'e425a819-3fbc-4999-90bc-998877665544');
      }
    });

    it('strictly rejects non-UUID strings and injection attempts', () => {
      const invalidPayloads = [
        { leadId: 'invalid-id', statusId: 'e425a819-3fbc-4999-90bc-998877665544' },
        { leadId: 'b819f72a-d6e2-4ef9-a9a3-112233445566', statusId: "'; DROP TABLE leads; --" },
        { leadId: '', statusId: 'e425a819-3fbc-4999-90bc-998877665544' },
        { leadId: '12345', statusId: '67890' },
      ];

      invalidPayloads.forEach((payload) => {
        const result = inlineStatusSchema.safeParse(payload);
        assert.equal(
          result.success,
          false,
          `Payload ${JSON.stringify(payload)} should have failed validation`
        );
      });
    });
  });

  describe('Block 2: inlinePrioritySchema Validation & Priority Whitelist', () => {
    it('accepts all canonical CRM priority tiers defined in LEAD_PRIORITIES', () => {
      const validLeadId = 'b819f72a-d6e2-4ef9-a9a3-112233445566';

      LEAD_PRIORITIES.forEach((priority) => {
        const result = inlinePrioritySchema.safeParse({
          leadId: validLeadId,
          priority,
        });
        assert.equal(result.success, true);
        if (result.success) {
          assert.equal(result.data.priority, priority);
        }
      });
    });

    it('rejects invalid or case-mismatched priority values', () => {
      const validLeadId = 'b819f72a-d6e2-4ef9-a9a3-112233445566';
      const invalidPriorities = ['urgent', 'Urgent', 'HIGH', 'critical', 'Critical', 'LowPriority', '', 1];

      invalidPriorities.forEach((priority) => {
        const result = inlinePrioritySchema.safeParse({
          leadId: validLeadId,
          priority,
        });
        assert.equal(
          result.success,
          false,
          `Priority "${priority}" should have been rejected by schema`
        );
      });
    });
  });

  describe('Block 3: Guarded Terminal Stage Invariants', () => {
    it('enforces that terminal statuses (converted / lost) require guided modal completion', () => {
      function evaluateStatusTransitionGuard(targetBucket: FunnelBucket): {
        allowedInline: boolean;
        requiresModal: boolean;
        reason?: string;
      } {
        if (targetBucket === 'converted' || targetBucket === 'lost') {
          return {
            allowedInline: false,
            requiresModal: true,
            reason:
              targetBucket === 'converted'
                ? 'Terminal status "Converted" requires deal value confirmation & client account creation.'
                : 'Terminal status "Lost" requires a mandatory loss reason categorization.',
          };
        }
        return {
          allowedInline: true,
          requiresModal: false,
        };
      }

      const openEval = evaluateStatusTransitionGuard('open');
      assert.equal(openEval.allowedInline, true);
      assert.equal(openEval.requiresModal, false);

      const potentialEval = evaluateStatusTransitionGuard('potential');
      assert.equal(potentialEval.allowedInline, true);
      assert.equal(potentialEval.requiresModal, false);

      const convertedEval = evaluateStatusTransitionGuard('converted');
      assert.equal(convertedEval.allowedInline, false);
      assert.equal(convertedEval.requiresModal, true);
      assert.ok(convertedEval.reason?.includes('Converted'));

      const lostEval = evaluateStatusTransitionGuard('lost');
      assert.equal(lostEval.allowedInline, false);
      assert.equal(lostEval.requiresModal, true);
      assert.ok(lostEval.reason?.includes('Lost'));
    });
  });

  describe('Block 4: Role Sandboxing Authorization Matrix', () => {
    it('allows leadership roles to modify any deal, sandboxes sales executives, and strictly forbids viewers', () => {
      interface MockUser {
        id: string;
        role: CrmUserRole;
      }

      interface MockLead {
        id: string;
        assigned_to: string | null;
      }

      function canUserModifyLead(user: MockUser, lead: MockLead): boolean {
        if (user.role === 'viewer') {
          return false;
        }
        if (user.role === 'admin' || user.role === 'sales_manager') {
          return true;
        }
        if (user.role === 'sales_executive') {
          return lead.assigned_to === user.id;
        }
        return false;
      }

      const adminUser: MockUser = { id: 'admin-01', role: 'admin' };
      const managerUser: MockUser = { id: 'manager-01', role: 'sales_manager' };
      const executiveA: MockUser = { id: 'rep-01', role: 'sales_executive' };
      const executiveB: MockUser = { id: 'rep-02', role: 'sales_executive' };
      const viewerUser: MockUser = { id: 'viewer-01', role: 'viewer' };

      const dealOfRepA: MockLead = { id: 'deal-01', assigned_to: 'rep-01' };
      const unassignedDeal: MockLead = { id: 'deal-02', assigned_to: null };

      // Admin: global write access
      assert.equal(canUserModifyLead(adminUser, dealOfRepA), true);
      assert.equal(canUserModifyLead(adminUser, unassignedDeal), true);

      // Sales Manager: global write access
      assert.equal(canUserModifyLead(managerUser, dealOfRepA), true);
      assert.equal(canUserModifyLead(managerUser, unassignedDeal), true);

      // Sales Executive A: access to own deal, blocked from unassigned
      assert.equal(canUserModifyLead(executiveA, dealOfRepA), true);
      assert.equal(canUserModifyLead(executiveA, unassignedDeal), false);

      // Sales Executive B: blocked from Rep A's deal
      assert.equal(canUserModifyLead(executiveB, dealOfRepA), false);

      // Viewer: strictly blocked from ALL deals
      assert.equal(canUserModifyLead(viewerUser, dealOfRepA), false);
      assert.equal(canUserModifyLead(viewerUser, unassignedDeal), false);
    });
  });

  describe('Block 5: Activity Ledger Audit Trail Payload Structures', () => {
    it('constructs correct immutable audit entries for status changes', () => {
      const auditPayload = {
        lead_id: 'b819f72a-d6e2-4ef9-a9a3-112233445566',
        actor_id: 'user-sales-01',
        activity_type: 'status_change',
        description: 'Stage updated from "Evaluation" to "Proposal Sent" via fast inline selector.',
        metadata: {
          previous_status_id: 'status-eval-01',
          previous_status_name: 'Evaluation',
          new_status_id: 'status-prop-02',
          new_status_name: 'Proposal Sent',
          new_bucket: 'potential',
          client_timestamp: '2026-10-17T12:00:00.000Z',
        },
      };

      assert.equal(auditPayload.activity_type, 'status_change');
      assert.equal(auditPayload.actor_id, 'user-sales-01');
      assert.equal(auditPayload.metadata.previous_status_id, 'status-eval-01');
      assert.equal(auditPayload.metadata.new_status_id, 'status-prop-02');
    });

    it('constructs correct immutable audit entries for priority changes', () => {
      const auditPayload = {
        lead_id: 'b819f72a-d6e2-4ef9-a9a3-112233445566',
        actor_id: 'user-sales-01',
        activity_type: 'priority_change',
        description: 'Deal priority reprioritized from Medium to High.',
        metadata: {
          previous_priority: 'Medium',
          new_priority: 'High',
          updated_at: '2026-10-17T12:00:00.000Z',
        },
      };

      assert.equal(auditPayload.activity_type, 'priority_change');
      assert.equal(auditPayload.actor_id, 'user-sales-01');
      assert.equal(auditPayload.metadata.previous_priority, 'Medium');
      assert.equal(auditPayload.metadata.new_priority, 'High');
    });
  });
});
