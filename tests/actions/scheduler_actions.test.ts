/**
 * @file scheduler_actions.test.ts
 * @description Comprehensive automated test suite for Sprint 9.1 Server Actions:
 *              - Zod input validation schemas for Follow-up Scheduling & On Hold Parking
 *              - Strict rejection of past follow-up datetimes and non-future revisit dates
 *              - RFC 5545 compliant iCalendar (.ics) format and escape sequence validation
 *              - Standardized action types and parking reason enum checks
 *              - Input sanitization and bounds enforcement
 * @module tests/actions/scheduler_actions.test
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  scheduleFollowUpSchema,
  transitionToOnHoldSchema,
  generateIcsCalendarInvite,
  FOLLOW_UP_ACTION_TYPES,
  ON_HOLD_REASONS,
} from '@/app/actions/schedulerActions';

describe('Sprint 9.1: Scheduler Actions & RFC 5545 iCalendar Validation', () => {
  const validLeadUuid = 'a0000000-0000-0000-0000-000000000001';

  describe('Block 1: scheduleFollowUpSchema Validation', () => {
    it('accepts valid future follow-up schedule payloads', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const payload = {
        leadId: validLeadUuid,
        scheduledFor: futureDate,
        actionType: 'call',
        agenda: 'Review commercial contract terms and project roadmap milestone deliverables.',
        sendCalendarInvite: true,
      };

      const result = scheduleFollowUpSchema.safeParse(payload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.leadId, validLeadUuid);
        assert.equal(result.data.actionType, 'call');
        assert.equal(result.data.sendCalendarInvite, true);
      }
    });

    it('accepts all 6 standardized action types', () => {
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      FOLLOW_UP_ACTION_TYPES.forEach((actionType) => {
        const result = scheduleFollowUpSchema.safeParse({
          leadId: validLeadUuid,
          scheduledFor: futureDate,
          actionType,
        });
        assert.equal(result.success, true, `Action type "${actionType}" should be valid`);
      });
    });

    it('rejects invalid action types', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const invalidTypes = ['sms', 'pigeon', 'fax', 'random_channel'];

      invalidTypes.forEach((actionType) => {
        const result = scheduleFollowUpSchema.safeParse({
          leadId: validLeadUuid,
          scheduledFor: futureDate,
          actionType,
        });
        assert.equal(result.success, false);
      });
    });

    it('strictly blocks follow-up dates set in the past', () => {
      const pastDates = [
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        '2020-01-01T10:00:00Z',
      ];

      pastDates.forEach((pastDate) => {
        const result = scheduleFollowUpSchema.safeParse({
          leadId: validLeadUuid,
          scheduledFor: pastDate,
          actionType: 'email',
        });
        assert.equal(result.success, false, `Past date "${pastDate}" must be rejected`);
      });
    });

    it('strictly blocks invalid lead UUIDs', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const invalidUuids = ['not-a-uuid', '12345', ''];

      invalidUuids.forEach((leadId) => {
        const result = scheduleFollowUpSchema.safeParse({
          leadId,
          scheduledFor: futureDate,
          actionType: 'call',
        });
        assert.equal(result.success, false);
      });
    });

    it('enforces agenda character bound limits (max 1000 chars)', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const oversizedAgenda = 'A'.repeat(1001);

      const result = scheduleFollowUpSchema.safeParse({
        leadId: validLeadUuid,
        scheduledFor: futureDate,
        actionType: 'meeting',
        agenda: oversizedAgenda,
      });
      assert.equal(result.success, false);
    });
  });

  describe('Block 2: transitionToOnHoldSchema Validation', () => {
    it('accepts valid future revisit date and parking reason', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      const revisitDate = tomorrow.toISOString().split('T')[0];

      const payload = {
        leadId: validLeadUuid,
        revisitDate,
        reason: 'Client Budget Cycle / Q1 Planning',
        parkingNotes: 'Client will finalize marketing capital expenditure at executive retreat.',
      };

      const result = transitionToOnHoldSchema.safeParse(payload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.revisitDate, revisitDate);
        assert.equal(result.data.reason, 'Client Budget Cycle / Q1 Planning');
      }
    });

    it('accepts all standardized on-hold reasons', () => {
      const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      ON_HOLD_REASONS.forEach((reason) => {
        const result = transitionToOnHoldSchema.safeParse({
          leadId: validLeadUuid,
          revisitDate: futureDate,
          reason,
        });
        assert.equal(result.success, true, `Reason "${reason}" should be accepted`);
      });
    });

    it('strictly rejects today or past dates for revisit_date', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const ancientDate = '2024-01-01';

      [today, yesterday, ancientDate].forEach((date) => {
        const result = transitionToOnHoldSchema.safeParse({
          leadId: validLeadUuid,
          revisitDate: date,
          reason: 'Project Paused Temporarily',
        });
        assert.equal(result.success, false, `Date "${date}" must be rejected as not strictly future`);
      });
    });

    it('rejects parking reasons that are too short (< 3 characters)', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const result = transitionToOnHoldSchema.safeParse({
        leadId: validLeadUuid,
        revisitDate: futureDate,
        reason: 'ab',
      });
      assert.equal(result.success, false);
    });

    it('enforces parking notes character bound limits (max 2000 chars)', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const oversizedNotes = 'N'.repeat(2001);

      const result = transitionToOnHoldSchema.safeParse({
        leadId: validLeadUuid,
        revisitDate: futureDate,
        reason: 'Other',
        parkingNotes: oversizedNotes,
      });
      assert.equal(result.success, false);
    });
  });

  describe('Block 3: RFC 5545 iCalendar (.ics) Generation', () => {
    it('generates fully compliant RFC 5545 iCalendar payload', () => {
      const startTime = new Date('2026-11-20T10:00:00Z');
      const ics = generateIcsCalendarInvite({
        title: 'Commercial Strategy Call: Luxe Ventures',
        description: 'Deep-dive review of agency commercial deliverables and brand positioning.',
        startTime,
        durationMinutes: 45,
        location: 'Google Meet / Teleconference',
      });

      assert.ok(ics.includes('BEGIN:VCALENDAR'));
      assert.ok(ics.includes('VERSION:2.0'));
      assert.ok(ics.includes('PRODID:-//Marca Ubi//CRM Follow-up Scheduler//EN'));
      assert.ok(ics.includes('CALSCALE:GREGORIAN'));
      assert.ok(ics.includes('BEGIN:VEVENT'));
      assert.ok(ics.includes('SUMMARY:Commercial Strategy Call: Luxe Ventures'));
      assert.ok(ics.includes('DTSTART:20261120T100000Z'));
      assert.ok(ics.includes('DTEND:20261120T104500Z'));
      assert.ok(ics.includes('LOCATION:Google Meet / Teleconference'));
      assert.ok(ics.includes('STATUS:CONFIRMED'));
      assert.ok(ics.includes('END:VEVENT'));
      assert.ok(ics.includes('END:VCALENDAR'));
    });

    it('properly escapes special characters in RFC 5545 summary and description', () => {
      const startTime = new Date('2026-12-01T15:30:00Z');
      const ics = generateIcsCalendarInvite({
        title: 'Review: Phase 1, Phase 2; Finalize \\ Next Steps',
        description: 'First line\nSecond line, with commas; and semicolons\\slashes',
        startTime,
      });

      // Commas and semicolons and backslashes should be backslash-escaped
      assert.ok(ics.includes('Review: Phase 1\\, Phase 2\\; Finalize \\\\ Next Steps'));
      assert.ok(ics.includes('First line\\nSecond line\\, with commas\\; and semicolons\\\\slashes'));
    });

    it('defaults duration to 30 minutes when durationMinutes is omitted', () => {
      const startTime = new Date('2026-11-15T09:00:00Z');
      const ics = generateIcsCalendarInvite({
        title: 'Touchpoint Call',
        description: 'Weekly status checkpoint',
        startTime,
      });

      assert.ok(ics.includes('DTSTART:20261115T090000Z'));
      assert.ok(ics.includes('DTEND:20261115T093000Z'));
    });
  });
});
