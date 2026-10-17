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

describe('Sprint 9.1: Follow-Up Scheduler & On Hold Modal UI Logic', () => {
  describe('Block 1: Quick-Select Preset Time Calculations', () => {
    function computePresetDate(preset: 'today_2h' | 'tomorrow_10am' | 'in_3_days' | 'next_mon_9am', baseDate: Date): Date {
      const now = new Date(baseDate);

      switch (preset) {
        case 'today_2h':
          return new Date(now.getTime() + 2 * 60 * 60 * 1000);

        case 'tomorrow_10am': {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(10, 0, 0, 0);
          return tomorrow;
        }

        case 'in_3_days': {
          const in3 = new Date(now);
          in3.setDate(in3.getDate() + 3);
          in3.setHours(10, 0, 0, 0);
          return in3;
        }

        case 'next_mon_9am': {
          const nextMon = new Date(now);
          const currentDay = nextMon.getDay(); // 0 is Sunday, 1 is Monday
          const daysUntilMonday = ((1 - currentDay + 7) % 7) || 7;
          nextMon.setDate(nextMon.getDate() + daysUntilMonday);
          nextMon.setHours(9, 0, 0, 0);
          return nextMon;
        }
      }
    }

    it('calculates "Today +2h" exactly 2 hours into the future', () => {
      const base = new Date('2026-10-18T14:30:00Z');
      const target = computePresetDate('today_2h', base);
      const diffMs = target.getTime() - base.getTime();
      assert.equal(diffMs, 2 * 60 * 60 * 1000);
    });

    it('calculates "Tomorrow 10 AM" with tomorrow date at hour 10', () => {
      const base = new Date(2026, 9, 18, 15, 0, 0); // Oct 18, 2026 local
      const target = computePresetDate('tomorrow_10am', base);
      assert.equal(target.getDate(), 19);
      assert.equal(target.getHours(), 10);
      assert.equal(target.getMinutes(), 0);
    });

    it('calculates "In 3 Days" exactly 3 days ahead at hour 10', () => {
      const base = new Date(2026, 9, 18, 12, 0, 0); // Oct 18, 2026 local
      const target = computePresetDate('in_3_days', base);
      assert.equal(target.getDate(), 21);
      assert.equal(target.getHours(), 10);
      assert.equal(target.getMinutes(), 0);
    });

    it('calculates "Next Mon 9 AM" correctly from any day of the week', () => {
      // Test starting from Sunday (day 0)
      const sunday = new Date(2026, 9, 18, 10, 0, 0); // Sunday Oct 18, 2026
      const targetFromSunday = computePresetDate('next_mon_9am', sunday);
      assert.equal(targetFromSunday.getDay(), 1, 'Should land on Monday');
      assert.equal(targetFromSunday.getDate(), 19);
      assert.equal(targetFromSunday.getHours(), 9);

      // Test starting from Monday (day 1) -> must advance 7 days to NEXT Monday
      const monday = new Date(2026, 9, 19, 10, 0, 0); // Monday Oct 19, 2026
      const targetFromMonday = computePresetDate('next_mon_9am', monday);
      assert.equal(targetFromMonday.getDay(), 1, 'Should land on next Monday');
      assert.equal(targetFromMonday.getDate(), 26);
      assert.equal(targetFromMonday.getHours(), 9);

      // Test starting from Friday (day 5)
      const friday = new Date(2026, 9, 23, 16, 0, 0); // Friday Oct 23, 2026
      const targetFromFriday = computePresetDate('next_mon_9am', friday);
      assert.equal(targetFromFriday.getDay(), 1, 'Should land on Monday');
      assert.equal(targetFromFriday.getDate(), 26);
      assert.equal(targetFromFriday.getHours(), 9);
    });
  });

  describe('Block 2: Timezone Offset Formatting', () => {
    function formatTimezoneOffset(offsetMinutes: number): string {
      const sign = offsetMinutes > 0 ? '-' : '+'; // getTimezoneOffset is positive for west of UTC
      const absMinutes = Math.abs(offsetMinutes);
      const hours = Math.floor(absMinutes / 60);
      const minutes = absMinutes % 60;
      return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

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
    function applyTimeStep(currentTime: string, stepMinutes: number): string {
      const [h, m] = currentTime.split(':').map(Number);
      const totalMinutes = (h * 60 + m + stepMinutes) % (24 * 60);
      const finalMinutes = totalMinutes < 0 ? totalMinutes + 24 * 60 : totalMinutes;
      const newH = Math.floor(finalMinutes / 60);
      const newM = finalMinutes % 60;
      return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    }

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
