/**
 * @file lead_interactions.test.ts
 * @description Comprehensive automated test suite for CRM Interactivity Engine data layer:
 *              - Zod input validation contracts for stage advancement (updateLeadStatusSchema)
 *              - Omnichannel touchpoint logging contracts (addLeadTouchpointSchema)
 *              - Commercial representative reassignment schema (updateLeadAssigneeSchema)
 *              - Deal parameters and valuation schema (updateLeadDealParametersSchema)
 *              - Next.js 16 Server Action boundary integrity & role guard contract assertions
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import {
  updateLeadStatusSchema,
  addLeadTouchpointSchema,
  updateLeadAssigneeSchema,
  updateLeadDealParametersSchema,
  TOUCHPOINT_ACTIVITY_TYPES,
  LEAD_PRIORITIES,
} from '@/app/lib/lead-schemas';
import type {
  LeadDetailPayload,
  LeadActivityWithActor,
  LeadActionResult,
  UpdateLeadStatusPayload,
  AddLeadTouchpointPayload,
  UpdateLeadAssigneePayload,
  UpdateLeadDealParametersPayload,
  AssigneeOption,
} from '@/types/crm';

const VALID_LEAD_ID = 'c0000000-0000-0000-0000-000000000001';
const VALID_STATUS_ID = 'b0000000-0000-0000-0000-000000000002';
const VALID_ASSIGNEE_ID = '00000000-0000-0000-0000-000000000003';

describe('Marca Ubi CRM — Interactivity Data Layer & Server Action Invariants', () => {
  describe('Section 1: Stage Advancement Validation (updateLeadStatusSchema)', () => {
    it('accepts valid stage progression with contextual notes and lost reason', () => {
      const res = updateLeadStatusSchema.safeParse({
        leadId: VALID_LEAD_ID,
        newStatusId: VALID_STATUS_ID,
        lostReason: 'Client decided to defer enterprise redesign to Q4 2027.',
        note: 'Completed executive strategy alignment call.',
      });
      assert.ok(res.success);
      if (res.success) {
        assert.equal(res.data.leadId, VALID_LEAD_ID);
        assert.equal(res.data.newStatusId, VALID_STATUS_ID);
        assert.equal(
          res.data.lostReason,
          'Client decided to defer enterprise redesign to Q4 2027.'
        );
        assert.equal(res.data.note, 'Completed executive strategy alignment call.');
      }
    });

    it('accepts stage progression with omitted optional note and lostReason', () => {
      const res = updateLeadStatusSchema.safeParse({
        leadId: VALID_LEAD_ID,
        newStatusId: VALID_STATUS_ID,
      });
      assert.ok(res.success);
    });

    it('rejects invalid lead UUID identifier format', () => {
      const res = updateLeadStatusSchema.safeParse({
        leadId: 'invalid-non-uuid',
        newStatusId: VALID_STATUS_ID,
      });
      assert.ok(!res.success);
      if (!res.success) {
        assert.ok(res.error.issues.some((i) => i.path.includes('leadId')));
      }
    });

    it('rejects invalid status UUID identifier format', () => {
      const res = updateLeadStatusSchema.safeParse({
        leadId: VALID_LEAD_ID,
        newStatusId: '12345',
      });
      assert.ok(!res.success);
      if (!res.success) {
        assert.ok(res.error.issues.some((i) => i.path.includes('newStatusId')));
      }
    });

    it('rejects lost reason strings exceeding 500 characters', () => {
      const res = updateLeadStatusSchema.safeParse({
        leadId: VALID_LEAD_ID,
        newStatusId: VALID_STATUS_ID,
        lostReason: 'A'.repeat(501),
      });
      assert.ok(!res.success);
      if (!res.success) {
        assert.ok(res.error.issues.some((i) => i.path.includes('lostReason')));
      }
    });

    it('rejects transition notes exceeding 2000 characters', () => {
      const res = updateLeadStatusSchema.safeParse({
        leadId: VALID_LEAD_ID,
        newStatusId: VALID_STATUS_ID,
        note: 'N'.repeat(2001),
      });
      assert.ok(!res.success);
      if (!res.success) {
        assert.ok(res.error.issues.some((i) => i.path.includes('note')));
      }
    });
  });

  describe('Section 2: Omnichannel Touchpoint Logging (addLeadTouchpointSchema)', () => {
    it('accepts all canonical touchpoint activity types', () => {
      for (const activityType of TOUCHPOINT_ACTIVITY_TYPES) {
        const res = addLeadTouchpointSchema.safeParse({
          leadId: VALID_LEAD_ID,
          activityType,
          description: `Logged omnichannel interaction of type ${activityType}.`,
        });
        assert.ok(res.success, `Expected success for activity type ${activityType}`);
      }
    });

    it('accepts a touchpoint with a valid ISO timestamp follow-up date', () => {
      const isoTimestamp = new Date(Date.now() + 86400000 * 3).toISOString();
      const res = addLeadTouchpointSchema.safeParse({
        leadId: VALID_LEAD_ID,
        activityType: 'follow_up_scheduled',
        description: 'Scheduled executive presentation for board members.',
        nextFollowUp: isoTimestamp,
      });
      assert.ok(res.success);
      if (res.success) {
        assert.equal(res.data.nextFollowUp, isoTimestamp);
      }
    });

    it('rejects an invalid date format string for nextFollowUp', () => {
      const res = addLeadTouchpointSchema.safeParse({
        leadId: VALID_LEAD_ID,
        activityType: 'call_logged',
        description: 'Client requested follow-up next Tuesday afternoon.',
        nextFollowUp: 'invalid-not-a-timestamp',
      });
      assert.ok(!res.success);
      if (!res.success) {
        assert.ok(res.error.issues.some((i) => i.path.includes('nextFollowUp')));
      }
    });

    it('rejects empty touchpoint descriptions', () => {
      const res = addLeadTouchpointSchema.safeParse({
        leadId: VALID_LEAD_ID,
        activityType: 'call_logged',
        description: '   ',
      });
      assert.ok(!res.success);
    });

    it('rejects touchpoint descriptions exceeding 3000 characters', () => {
      const res = addLeadTouchpointSchema.safeParse({
        leadId: VALID_LEAD_ID,
        activityType: 'note_added',
        description: 'D'.repeat(3001),
      });
      assert.ok(!res.success);
    });

    it('rejects unsupported touchpoint activity types', () => {
      const res = addLeadTouchpointSchema.safeParse({
        leadId: VALID_LEAD_ID,
        activityType: 'unsupported_telegram_ping',
        description: 'Out of band notification.',
      });
      assert.ok(!res.success);
    });
  });

  describe('Section 3: Commercial Representative Reassignment (updateLeadAssigneeSchema)', () => {
    it('accepts valid reassignment with a context note', () => {
      const res = updateLeadAssigneeSchema.safeParse({
        leadId: VALID_LEAD_ID,
        newAssigneeId: VALID_ASSIGNEE_ID,
        note: 'Reassigned following regional portfolio rebalancing.',
      });
      assert.ok(res.success);
      if (res.success) {
        assert.equal(res.data.leadId, VALID_LEAD_ID);
        assert.equal(res.data.newAssigneeId, VALID_ASSIGNEE_ID);
        assert.equal(res.data.note, 'Reassigned following regional portfolio rebalancing.');
      }
    });

    it('rejects reassignment with non-UUID assignee identifier', () => {
      const res = updateLeadAssigneeSchema.safeParse({
        leadId: VALID_LEAD_ID,
        newAssigneeId: 'not-a-valid-uuid',
      });
      assert.ok(!res.success);
    });

    it('rejects reassignment notes exceeding 2000 characters', () => {
      const res = updateLeadAssigneeSchema.safeParse({
        leadId: VALID_LEAD_ID,
        newAssigneeId: VALID_ASSIGNEE_ID,
        note: 'R'.repeat(2001),
      });
      assert.ok(!res.success);
    });
  });

  describe('Section 4: Deal Parameters & Valuation Mutation (updateLeadDealParametersSchema)', () => {
    it('accepts valid commercial valuation, priority tier, and client notes', () => {
      const res = updateLeadDealParametersSchema.safeParse({
        leadId: VALID_LEAD_ID,
        expectedValue: 7500000,
        priority: 'High',
        notes: 'Enterprise contract negotiation covering multi-region brand strategy.',
      });
      assert.ok(res.success);
      if (res.success) {
        assert.equal(res.data.expectedValue, 7500000);
        assert.equal(res.data.priority, 'High');
      }
    });

    it('coerces string amounts to numeric valuation', () => {
      const res = updateLeadDealParametersSchema.safeParse({
        leadId: VALID_LEAD_ID,
        expectedValue: '1250000',
      });
      assert.ok(res.success);
      if (res.success) {
        assert.equal(res.data.expectedValue, 1250000);
      }
    });

    it('rejects negative expected valuation amounts', () => {
      const res = updateLeadDealParametersSchema.safeParse({
        leadId: VALID_LEAD_ID,
        expectedValue: -100,
      });
      assert.ok(!res.success);
    });

    it('rejects valuation amounts exceeding ₹100 Crore ceiling', () => {
      const res = updateLeadDealParametersSchema.safeParse({
        leadId: VALID_LEAD_ID,
        expectedValue: 1000000001,
      });
      assert.ok(!res.success);
    });

    it('validates canonical priority tiers', () => {
      for (const priority of LEAD_PRIORITIES) {
        const res = updateLeadDealParametersSchema.safeParse({
          leadId: VALID_LEAD_ID,
          priority,
        });
        assert.ok(res.success);
      }
    });

    it('rejects notes exceeding 5000 characters', () => {
      const res = updateLeadDealParametersSchema.safeParse({
        leadId: VALID_LEAD_ID,
        notes: 'X'.repeat(5001),
      });
      assert.ok(!res.success);
    });
  });

  describe('Section 5: Next.js 16 Server Action Boundary Integrity', () => {
    it('verifies src/app/actions/leads.ts strictly exports only async functions', () => {
      const fullPath = path.join(process.cwd(), 'src/app/actions/leads.ts');
      const content = fs.readFileSync(fullPath, 'utf8');

      assert.ok(content.startsWith("'use server'"), 'File must begin with use server directive');
      assert.ok(content.includes('export async function createManualLead'));
      assert.ok(content.includes('export async function getActiveTeamAssignees'));
      assert.ok(content.includes('export async function getLeadDetails'));
      assert.ok(content.includes('export async function updateLeadStatus'));
      assert.ok(content.includes('export async function addLeadTouchpoint'));
      assert.ok(content.includes('export async function updateLeadAssignee'));
      assert.ok(content.includes('export async function updateLeadDealParameters'));
      assert.ok(content.includes('export async function clearLeadFollowUp'));

      assert.ok(!content.includes('export type'), 'Server action boundary must export zero types');
      assert.ok(!content.includes('export interface'), 'Server action boundary must export zero interfaces');
      assert.ok(!content.includes('export const'), 'Server action boundary must export zero constants');
    });
  });

  describe('Section 6: Domain Interface & Type Contracts (src/types/crm.ts)', () => {
    it('verifies static type contracts can be instantiated without compile errors', () => {
      const mockResult: LeadActionResult<LeadDetailPayload> = {
        success: true,
        leadId: VALID_LEAD_ID,
        data: {
          lead: {
            id: VALID_LEAD_ID,
            lead_id: 'LD-1046',
            name: 'Malak Al-Khatib',
            company: 'Alserkal Avenue Cultural Foundation',
            company_website: 'https://alserkal.ae',
            industry: 'Arts & Culture',
            phone: '+971554411846',
            email: 'malak.k@alserkal.ae',
            preferred_channel: 'Phone',
            lead_source_id: 'a0000000-0000-0000-0000-000000000001',
            source_detail: 'Website Brief',
            service_category: 'Web & Digital',
            budget_bracket: '$50k-$100k',
            priority: 'Low',
            status_id: VALID_STATUS_ID,
            assigned_to: VALID_ASSIGNEE_ID,
            expected_value: 65000,
            next_follow_up: null,
            lost_reason: null,
            revisit_date: null,
            notes: 'Interactive virtual art gallery tour.',
            brief_payload: { services: ['WebGL', 'Branding'] },
            inquiry_count: 1,
            created_at: new Date().toISOString(),
            converted_at: null,
            updated_at: new Date().toISOString(),
          },
          activities: [
            {
              id: 'd0000000-0000-0000-0000-000000000001',
              lead_id: VALID_LEAD_ID,
              actor_id: VALID_ASSIGNEE_ID,
              activity_type: 'call_logged',
              description: 'Initial discovery call completed.',
              metadata: { duration: 15 },
              created_at: new Date().toISOString(),
              actor_name: 'Zaid Al-Fassi',
              actor_role: 'sales_executive',
              actor: {
                id: VALID_ASSIGNEE_ID,
                full_name: 'Zaid Al-Fassi',
                role: 'sales_executive',
                email: 'zaid@marcaubi.com',
              },
            },
          ],
          availableStatuses: [
            {
              id: VALID_STATUS_ID,
              name: 'Qualified',
              bucket: 'potential',
              color_code: '#ff6100',
              sort_order: 2,
              is_active: true,
              created_at: new Date().toISOString(),
            },
          ],
          availableAssignees: [
            {
              id: VALID_ASSIGNEE_ID,
              fullName: 'Zaid Al-Fassi',
              email: 'zaid@marcaubi.com',
              role: 'sales_executive',
            },
          ],
        },
      };

      assert.equal(mockResult.success, true);
      assert.equal(mockResult.data?.lead.name, 'Malak Al-Khatib');
      assert.equal(mockResult.data?.activities.length, 1);
      assert.equal(mockResult.data?.availableStatuses.length, 1);
      assert.equal(mockResult.data?.availableAssignees.length, 1);
    });
  });
});
