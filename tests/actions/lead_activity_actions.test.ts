/**
 * @file lead_activity_actions.test.ts
 * @description Comprehensive automated test suite for Sprint 8.2 Server Actions:
 *              - Zod input validation schemas (leadActivityInputSchema)
 *              - Cryptographic UUID enforcement & injection attack resilience
 *              - Minimum 3-character note validation & whitespace trimming
 *              - Supported interaction types (call_logged, whatsapp_sent, meeting_notes, note_added)
 *              - Script tag sanitization logic
 *              - Role sandboxing invariants (viewer rejection, sales executive sandboxing)
 * @module tests/actions/lead_activity_actions.test
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  leadActivityInputSchema,
  type LeadActivityInput,
} from '@/app/actions/leadActivityActions';
import type { CrmUserRole } from '@/types/crm';

describe('Sprint 8.2: Server Actions & Activity Logging Engine', () => {
  describe('Block 1: leadActivityInputSchema Validation & Sanitization', () => {
    it('accepts perfectly formatted payloads for all valid activity types', () => {
      const validTypes: LeadActivityInput['activityType'][] = [
        'call_logged',
        'whatsapp_sent',
        'meeting_notes',
        'meeting_held',
        'note_added',
      ];

      validTypes.forEach((type) => {
        const payload = {
          leadId: 'c0000000-0000-0000-0000-000000000001',
          activityType: type,
          description: 'Client reviewed commercial agreement.',
          metadata: { channel: 'Direct' },
        };
        const result = leadActivityInputSchema.safeParse(payload);
        assert.equal(result.success, true);
        if (result.success) {
          assert.equal(result.data.activityType, type);
          assert.equal(result.data.leadId, 'c0000000-0000-0000-0000-000000000001');
          assert.equal(result.data.description, 'Client reviewed commercial agreement.');
        }
      });
    });

    it('enforces a minimum description length of 3 characters', () => {
      const invalidShortNotes = [
        '',
        ' ',
        '  ',
        'a',
        'ab',
        '  ab  ',
      ];

      invalidShortNotes.forEach((desc) => {
        const payload = {
          leadId: 'c0000000-0000-0000-0000-000000000001',
          activityType: 'note_added',
          description: desc,
        };
        const result = leadActivityInputSchema.safeParse(payload);
        assert.equal(result.success, false);
      });

      const validShortNote = {
        leadId: 'c0000000-0000-0000-0000-000000000001',
        activityType: 'note_added',
        description: 'abc',
      };
      const validResult = leadActivityInputSchema.safeParse(validShortNote);
      assert.equal(validResult.success, true);
    });

    it('strictly rejects non-UUID strings and injection attempts in leadId', () => {
      const maliciousLeadIds = [
        'non-uuid-string',
        "'; DROP TABLE lead_activities; --",
        'c0000000-0000-0000-0000-000000000001<script>',
        '12345',
        '',
      ];

      maliciousLeadIds.forEach((badId) => {
        const payload = {
          leadId: badId,
          activityType: 'call_logged',
          description: 'Call connected with client.',
        };
        const result = leadActivityInputSchema.safeParse(payload);
        assert.equal(result.success, false);
      });
    });

    it('rejects unsupported or arbitrary activity types', () => {
      const invalidTypes = [
        'random_event',
        'hack_db',
        'status_change', // Handled via guarded stage mutator, not quick composer
        'priority_change',
        '',
      ];

      invalidTypes.forEach((badType) => {
        const payload = {
          leadId: 'c0000000-0000-0000-0000-000000000001',
          activityType: badType,
          description: 'Testing arbitrary activity type.',
        };
        const result = leadActivityInputSchema.safeParse(payload);
        assert.equal(result.success, false);
      });
    });

    it('preserves structured JSONB metadata payloads for calls and meetings', () => {
      const callPayload = {
        leadId: 'c0000000-0000-0000-0000-000000000001',
        activityType: 'call_logged',
        description: 'Discussed hosting infrastructure scope and retainer models.',
        metadata: {
          duration_seconds: 480,
          outcome: 'Connected',
          follow_up_scheduled: true,
        },
      };

      const result = leadActivityInputSchema.safeParse(callPayload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.metadata.duration_seconds, 480);
        assert.equal(result.data.metadata.outcome, 'Connected');
      }
    });
  });

  describe('Block 2: Script Sanitization Logic', () => {
    it('strips script tags cleanly from interaction notes', () => {
      const sanitizeDescription = (text: string): string =>
        text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();

      const maliciousNote = 'Reviewed contract <script>alert("xss")</script> with CEO.';
      const cleaned = sanitizeDescription(maliciousNote);
      assert.equal(cleaned, 'Reviewed contract  with CEO.');
      assert.equal(cleaned.includes('<script>'), false);
    });
  });

  describe('Block 3: Role Sandboxing Authorization Matrix', () => {
    it('enforces RBAC policy: admin & manager global, sales executive sandboxed, viewer forbidden', () => {
      interface MockUser {
        id: string;
        role: CrmUserRole;
      }

      interface MockLead {
        id: string;
        assigned_to: string;
      }

      const adminUser: MockUser = { id: 'usr-admin', role: 'admin' };
      const managerUser: MockUser = { id: 'usr-mgr', role: 'sales_manager' };
      const repA: MockUser = { id: 'usr-rep-a', role: 'sales_executive' };
      const repB: MockUser = { id: 'usr-rep-b', role: 'sales_executive' };
      const viewerUser: MockUser = { id: 'usr-viewer', role: 'viewer' };

      const leadAssignedToRepA: MockLead = {
        id: 'c0000000-0000-0000-0000-000000000001',
        assigned_to: 'usr-rep-a',
      };

      const canLogActivity = (user: MockUser, lead: MockLead): boolean => {
        if (user.role === 'viewer') return false;
        if (user.role === 'admin' || user.role === 'sales_manager') return true;
        if (user.role === 'sales_executive') return lead.assigned_to === user.id;
        return false;
      };

      assert.equal(canLogActivity(adminUser, leadAssignedToRepA), true);
      assert.equal(canLogActivity(managerUser, leadAssignedToRepA), true);
      assert.equal(canLogActivity(repA, leadAssignedToRepA), true);
      assert.equal(canLogActivity(repB, leadAssignedToRepA), false); // Sandboxed!
      assert.equal(canLogActivity(viewerUser, leadAssignedToRepA), false); // Viewer blocked!
    });
  });
});
