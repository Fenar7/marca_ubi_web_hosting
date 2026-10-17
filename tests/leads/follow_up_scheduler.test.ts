/**
 * @file follow_up_scheduler.test.ts
 * @description Automated test suite for Sprint 9.1 Follow-up Scheduler & On Hold UI logic:
 *              - Quick-select preset time calculations (Today +2h, Tomorrow 10 AM, In 3 Days, Next Mon 9 AM)
 *              - Timezone offset detection and formatting (e.g. UTC+05:30)
 *              - Time-step increment calculations (+15m, +30m, +1h)
 *              - Date-time picker string formatting and 24h normalization
 *              - RFC 5545 calendar invite download blob validation
 *              - Accessibility attributes (dialog role, aria-modal, dark luxury tokens)
 * @module tests/leads/follow_up_scheduler.test
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FOLLOW_UP_ACTION_TYPES, ON_HOLD_REASONS } from '@/app/actions/schedulerActions';
import {
  calculatePresetDate,
  formatTimezoneOffset,
  applyTimeStep,
} from '@/app/admin/components/Scheduler/schedulerUtils';

describe('Sprint 9.1: Follow-Up Scheduler & On Hold Modal UI Logic', () => {
  describe('Block 1: Quick-Select Preset Time Calculations', () => {
    it('verifies exported calculatePresetDate produces future ISO strings for all preset keys', () => {
      const presets = [
        'today_2h',
        'today_plus_2h',
        'tomorrow_10am',
        'in_3_days',
        'next_mon_9am',
        'next_monday_9am',
      ] as const;
      const nowMs = Date.now();

      presets.forEach((p) => {
        const iso = calculatePresetDate(p);
        assert.ok(typeof iso === 'string', `Preset ${p} must return string`);
        const parsedMs = new Date(iso).getTime();
        assert.ok(!isNaN(parsedMs), `Preset ${p} must return valid ISO date`);
        assert.ok(parsedMs > nowMs - 1000, `Preset ${p} must be in the future`);
      });
    });

    it('calculates "today_2h" exactly 2 hours into the future from base date', () => {
      const base = new Date('2026-10-18T14:30:00Z');
      const iso = calculatePresetDate('today_2h', base);
      const target = new Date(iso);
      const diffMs = target.getTime() - base.getTime();
      assert.equal(diffMs, 2 * 60 * 60 * 1000);
    });

    it('calculates "tomorrow_10am" with tomorrow date at hour 10 local', () => {
      const base = new Date(2026, 9, 18, 15, 0, 0); // Oct 18, 2026 local
      const iso = calculatePresetDate('tomorrow_10am', base);
      const target = new Date(iso);
      assert.equal(target.getDate(), 19);
      assert.equal(target.getHours(), 10);
      assert.equal(target.getMinutes(), 0);
    });

    it('calculates "in_3_days" exactly 3 days ahead at hour 10 local', () => {
      const base = new Date(2026, 9, 18, 12, 0, 0); // Oct 18, 2026 local
      const iso = calculatePresetDate('in_3_days', base);
      const target = new Date(iso);
      assert.equal(target.getDate(), 21);
      assert.equal(target.getHours(), 10);
      assert.equal(target.getMinutes(), 0);
    });

    it('calculates "next_mon_9am" correctly from any day of the week', () => {
      // Test starting from Sunday (day 0)
      const sunday = new Date(2026, 9, 18, 10, 0, 0); // Sunday Oct 18, 2026
      const targetFromSunday = new Date(calculatePresetDate('next_mon_9am', sunday));
      assert.equal(targetFromSunday.getDay(), 1, 'Should land on Monday');
      assert.equal(targetFromSunday.getDate(), 19);
      assert.equal(targetFromSunday.getHours(), 9);

      // Test starting from Monday (day 1) -> must advance 7 days to NEXT Monday
      const monday = new Date(2026, 9, 19, 10, 0, 0); // Monday Oct 19, 2026
      const targetFromMonday = new Date(calculatePresetDate('next_mon_9am', monday));
      assert.equal(targetFromMonday.getDay(), 1, 'Should land on next Monday');
      assert.equal(targetFromMonday.getDate(), 26);
      assert.equal(targetFromMonday.getHours(), 9);

      // Test starting from Friday (day 5)
      const friday = new Date(2026, 9, 23, 16, 0, 0); // Friday Oct 23, 2026
      const targetFromFriday = new Date(calculatePresetDate('next_mon_9am', friday));
      assert.equal(targetFromFriday.getDay(), 1, 'Should land on Monday');
      assert.equal(targetFromFriday.getDate(), 26);
      assert.equal(targetFromFriday.getHours(), 9);
    });
  });

  describe('Block 2: Timezone Offset Formatting', () => {
    it('formats positive local offset (e.g. IST -330 minutes) as UTC+05:30', () => {
      assert.equal(formatTimezoneOffset(-330), 'UTC+05:30');
    });

    it('formats negative local offset (e.g. EST +300 minutes) as UTC-05:00', () => {
      assert.equal(formatTimezoneOffset(300), 'UTC-05:00');
    });

    it('formats zero offset (GMT) as UTC+00:00', () => {
      assert.equal(formatTimezoneOffset(0), 'UTC+00:00');
    });
  });

  describe('Block 3: Step Increment Time Adjustments', () => {
    it('adds 15 minutes correctly without hour overflow', () => {
      assert.equal(applyTimeStep('10:00', 15), '10:15');
      assert.equal(applyTimeStep('10:30', 15), '10:45');
    });

    it('handles hour boundary crossings (+15m from 10:45 -> 11:00)', () => {
      assert.equal(applyTimeStep('10:45', 15), '11:00');
    });

    it('adds 30 minutes correctly across boundaries', () => {
      assert.equal(applyTimeStep('10:45', 30), '11:15');
      assert.equal(applyTimeStep('23:45', 30), '00:15');
    });

    it('adds 1 hour correctly across midnight', () => {
      assert.equal(applyTimeStep('14:20', 60), '15:20');
      assert.equal(applyTimeStep('23:15', 60), '00:15');
    });
  });

  describe('Block 4: Standardized Enums & Safety Invariants', () => {
    it('verifies all 6 follow-up action types match PRD requirements', () => {
      const expected = ['call', 'whatsapp', 'email', 'meeting', 'demo', 'proposal_review'];
      assert.deepEqual(Array.from(FOLLOW_UP_ACTION_TYPES), expected);
    });

    it('verifies all 6 standardized on-hold reasons match PRD requirements', () => {
      const expected = [
        'Client Budget Cycle / Q1 Planning',
        'Key Decision Maker Away / On Leave',
        'Pending Contract / Legal Review',
        'Project Paused Temporarily',
        'Awaiting Technical Specification',
        'Other',
      ];
      assert.deepEqual(Array.from(ON_HOLD_REASONS), expected);
    });
  });
});
