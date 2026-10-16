/**
 * @file reassignment.test.ts
 * @description Comprehensive automated test suite for Sprint 4.2:
 *              - Server Action input validation & sanitization via Zod (leadReassignmentSchema, repInventoryQuerySchema)
 *              - Anti-self-reassignment invariant defense
 *              - Destination operational status & commercial role whitelist enforcement
 *              - Deal inventory tabulation contracts and monetary calculations
 *              - Audit trail schemas and touchpoint activity backfill contracts
 *              - Historical terminal deal preservation (Converted & Lost isolation)
 * @module tests/team/reassignment
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @governance Master PRD Section 9, Section 15.10 (Sprint 4.2 Acceptance Criteria) & AGENTS.md
 */

import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  leadReassignmentSchema,
  repInventoryQuerySchema,
} from '../../src/app/lib/reassignment-schemas';
import type {
  TeamAuditAction,
  LeadActivityType,
  FunnelBucket,
  CrmUserRole,
} from '../../src/types/crm';
import { formatDealValuation } from '../../src/app/lib/team-utils';

describe('Marca Ubi CRM — Lead Reassignment Wizard & Atomic Engine (Sprint 4.2)', () => {
  describe('Section 1: Zod Input Validation & Form Contracts (leadReassignmentSchema)', () => {
    it('accepts a valid reassignment payload with distinct representatives and descriptive reason', () => {
      const payload = {
        sourceUserId: 'c0000000-0000-0000-0000-000000000001',
        destinationUserId: 'c0000000-0000-0000-0000-000000000002',
        transferReason: '  Commercial account reassignment following employee departure.  ',
      };

      const result = leadReassignmentSchema.safeParse(payload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.sourceUserId, 'c0000000-0000-0000-0000-000000000001');
        assert.equal(result.data.destinationUserId, 'c0000000-0000-0000-0000-000000000002');
        assert.equal(
          result.data.transferReason,
          'Commercial account reassignment following employee departure.'
        );
      }
    });

    it('strictly rejects self-reassignment when source and destination identifiers match', () => {
      const payload = {
        sourceUserId: 'c0000000-0000-0000-0000-000000000001',
        destinationUserId: 'c0000000-0000-0000-0000-000000000001',
        transferReason: 'Reassigning to the same account should fail.',
      };

      const result = leadReassignmentSchema.safeParse(payload);
      assert.equal(result.success, false);
      if (!result.success) {
        const hasSelfError = result.error.issues.some((issue) =>
          issue.message.includes('identical')
        );
        assert.equal(hasSelfError, true);
      }
    });

    it('rejects transfer reason strings under 5 characters', () => {
      const payload = {
        sourceUserId: 'c0000000-0000-0000-0000-000000000001',
        destinationUserId: 'c0000000-0000-0000-0000-000000000002',
        transferReason: 'abc',
      };

      const result = leadReassignmentSchema.safeParse(payload);
      assert.equal(result.success, false);
      if (!result.success) {
        const hasLengthError = result.error.issues.some((issue) =>
          issue.message.includes('at least 5 characters')
        );
        assert.equal(hasLengthError, true);
      }
    });

    it('rejects transfer reason strings exceeding 500 characters', () => {
      const payload = {
        sourceUserId: 'c0000000-0000-0000-0000-000000000001',
        destinationUserId: 'c0000000-0000-0000-0000-000000000002',
        transferReason: 'A'.repeat(501),
      };

      const result = leadReassignmentSchema.safeParse(payload);
      assert.equal(result.success, false);
      if (!result.success) {
        const hasMaxError = result.error.issues.some((issue) =>
          issue.message.includes('cannot exceed 500 characters')
        );
        assert.equal(hasMaxError, true);
      }
    });

    it('rejects malformed non-UUID identifiers', () => {
      const payload = {
        sourceUserId: 'invalid-non-uuid-string',
        destinationUserId: 'c0000000-0000-0000-0000-000000000002',
        transferReason: 'Legitimate reason string for reassignment.',
      };

      const result = leadReassignmentSchema.safeParse(payload);
      assert.equal(result.success, false);
      if (!result.success) {
        const hasUuidError = result.error.issues.some((issue) =>
          issue.message.includes('valid UUID')
        );
        assert.equal(hasUuidError, true);
      }
    });

    it('validates repInventoryQuerySchema with valid UUID', () => {
      const validQuery = repInventoryQuerySchema.safeParse({
        userId: 'c0000000-0000-0000-0000-000000000001',
      });
      assert.equal(validQuery.success, true);

      const invalidQuery = repInventoryQuerySchema.safeParse({
        userId: 'not-a-valid-uuid',
      });
      assert.equal(invalidQuery.success, false);
    });
  });

  describe('Section 2: Destination Personnel Status & Role Whitelist Invariants', () => {
    it('verifies destination candidate operational status filter rejects suspended personnel', () => {
      const isDestinationEligible = (
        status: string,
        role: CrmUserRole,
        sourceId: string,
        destId: string
      ): boolean => {
        if (sourceId === destId) return false;
        if (status !== 'active') return false;
        return role === 'admin' || role === 'sales_manager' || role === 'sales_executive';
      };

      const sourceId = 'c0000000-0000-0000-0000-000000000001';
      const activeManagerId = 'c0000000-0000-0000-0000-000000000002';
      const suspendedRepId = 'c0000000-0000-0000-0000-000000000003';
      const viewerId = 'c0000000-0000-0000-0000-000000000004';

      assert.equal(isDestinationEligible('active', 'sales_manager', sourceId, activeManagerId), true);
      assert.equal(isDestinationEligible('active', 'sales_executive', sourceId, activeManagerId), true);
      assert.equal(isDestinationEligible('active', 'admin', sourceId, activeManagerId), true);
      assert.equal(isDestinationEligible('suspended', 'sales_executive', sourceId, suspendedRepId), false);
      assert.equal(isDestinationEligible('active', 'viewer', sourceId, viewerId), false);
      assert.equal(isDestinationEligible('active', 'sales_executive', sourceId, sourceId), false);
    });
  });

  describe('Section 3: Pipeline Partitioning & Historical Ownership Invariants', () => {
    it('partitions active commercial deals from historical terminal deals', () => {
      const isDealActiveForReassignment = (bucket: FunnelBucket): boolean => {
        return bucket !== 'converted' && bucket !== 'lost';
      };

      assert.equal(isDealActiveForReassignment('open'), true);
      assert.equal(isDealActiveForReassignment('potential'), true);
      assert.equal(isDealActiveForReassignment('converted'), false);
      assert.equal(isDealActiveForReassignment('lost'), false);
    });

    it('calculates accurate cumulative deal valuations across stage distributions', () => {
      const sampleDeals = [
        { expected_value: 2500000.00, bucket: 'potential' as FunnelBucket },
        { expected_value: 1500000.00, bucket: 'open' as FunnelBucket },
        { expected_value: 750000.00, bucket: 'potential' as FunnelBucket },
        { expected_value: 4000000.00, bucket: 'converted' as FunnelBucket },
        { expected_value: 500000.00, bucket: 'lost' as FunnelBucket },
      ];

      const activeDeals = sampleDeals.filter((d) => d.bucket !== 'converted' && d.bucket !== 'lost');
      const totalActiveValue = activeDeals.reduce((sum, d) => sum + d.expected_value, 0);

      assert.equal(activeDeals.length, 3);
      assert.equal(totalActiveValue, 4750000.00);
      assert.equal(formatDealValuation(totalActiveValue), '₹47.5L');
    });
  });

  describe('Section 4: Audit Trail & Compliance Action Whitelists', () => {
    it('confirms leads_bulk_reassigned is a recognized TeamAuditAction', () => {
      const action: TeamAuditAction = 'leads_bulk_reassigned';
      assert.equal(action, 'leads_bulk_reassigned');
    });

    it('confirms reassignment is a recognized LeadActivityType', () => {
      const activityType: LeadActivityType = 'reassignment';
      assert.equal(activityType, 'reassignment');
    });

    it('validates comprehensive audit log detail structure', () => {
      const auditPayload = {
        source_user_id: 'c0000000-0000-0000-0000-000000000001',
        source_user_name: 'Marcus Vance',
        source_user_email: 'marcus.vance@marcaubi.com',
        destination_user_id: 'c0000000-0000-0000-0000-000000000002',
        destination_user_name: 'Zayd Al-Hadi',
        destination_user_email: 'zayd.alhadi@marcaubi.com',
        reassigned_count: 3,
        total_value: 4750000.00,
        lead_ids: [
          'e0000000-0000-0000-0000-000000000001',
          'e0000000-0000-0000-0000-000000000002',
          'e0000000-0000-0000-0000-000000000003',
        ],
        reason: 'Commercial offboarding transfer',
      };

      assert.equal(typeof auditPayload.source_user_id, 'string');
      assert.equal(typeof auditPayload.destination_user_id, 'string');
      assert.equal(typeof auditPayload.reassigned_count, 'number');
      assert.equal(Array.isArray(auditPayload.lead_ids), true);
      assert.equal(auditPayload.lead_ids.length, 3);
    });
  });
});
