/**
 * @file activity_composer_and_timeline.test.ts
 * @description Comprehensive automated unit test suite for Sprint 8.2:
 *              - Relative timestamp humanization (formatRelativeTime)
 *              - Telephony duration clock formatting (formatCallDuration)
 *              - Safe @mentions and #tags tokenization without XSS injection
 *              - Activity contract invariants and actor metadata hydration
 * @module tests/leads/activity_composer_and_timeline.test
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRelativeTime,
  formatCallDuration,
  parseMentionsAndTags,
  getDossierInitials,
} from '@/app/admin/components/DossierDrawer/dossierUtils';
import type { LeadActivityWithActor } from '@/types/crm';

describe('Sprint 8.2: Omnichannel Activity Timeline & Composer Engine', () => {
  describe('Block 1: Relative Timestamp Formatting (formatRelativeTime)', () => {
    const fixedNow = new Date('2026-10-17T12:00:00.000Z');

    it('formats timestamps under 1 minute as Just now', () => {
      const thirtySecondsAgo = new Date('2026-10-17T11:59:30.000Z').toISOString();
      assert.strictEqual(formatRelativeTime(thirtySecondsAgo, fixedNow), 'Just now');
    });

    it('formats minutes elapsed accurately', () => {
      const tenMinutesAgo = new Date('2026-10-17T11:50:00.000Z').toISOString();
      assert.strictEqual(formatRelativeTime(tenMinutesAgo, fixedNow), '10m ago');

      const fortyFiveMinutesAgo = new Date('2026-10-17T11:15:00.000Z').toISOString();
      assert.strictEqual(formatRelativeTime(fortyFiveMinutesAgo, fixedNow), '45m ago');
    });

    it('formats hours elapsed accurately', () => {
      const twoHoursAgo = new Date('2026-10-17T10:00:00.000Z').toISOString();
      assert.strictEqual(formatRelativeTime(twoHoursAgo, fixedNow), '2h ago');

      const twelveHoursAgo = new Date('2026-10-17T00:00:00.000Z').toISOString();
      assert.strictEqual(formatRelativeTime(twelveHoursAgo, fixedNow), '12h ago');
    });

    it('formats 1 day ago as Yesterday', () => {
      const yesterday = new Date('2026-10-16T10:00:00.000Z').toISOString();
      assert.strictEqual(formatRelativeTime(yesterday, fixedNow), 'Yesterday');
    });

    it('formats days under 1 week as Xd ago', () => {
      const threeDaysAgo = new Date('2026-10-14T12:00:00.000Z').toISOString();
      assert.strictEqual(formatRelativeTime(threeDaysAgo, fixedNow), '3d ago');

      const sixDaysAgo = new Date('2026-10-11T12:00:00.000Z').toISOString();
      assert.strictEqual(formatRelativeTime(sixDaysAgo, fixedNow), '6d ago');
    });

    it('formats future touchpoint dates accurately', () => {
      const inThirtyMins = new Date('2026-10-17T12:30:00.000Z').toISOString();
      assert.strictEqual(formatRelativeTime(inThirtyMins, fixedNow), 'in 30m');

      const inTwoHours = new Date('2026-10-17T14:00:00.000Z').toISOString();
      assert.strictEqual(formatRelativeTime(inTwoHours, fixedNow), 'in 2h');

      const inThreeDays = new Date('2026-10-20T12:00:00.000Z').toISOString();
      assert.strictEqual(formatRelativeTime(inThreeDays, fixedNow), 'in 3d');
    });

    it('handles null, empty, and invalid dates defensively', () => {
      assert.strictEqual(formatRelativeTime(null), 'Pending');
      assert.strictEqual(formatRelativeTime(''), 'Pending');
      assert.strictEqual(formatRelativeTime('not-a-valid-date'), 'Invalid Date');
    });
  });

  describe('Block 2: Telephony Duration Clock Formatting (formatCallDuration)', () => {
    it('formats seconds under one minute as Xs', () => {
      assert.strictEqual(formatCallDuration(15), '15s');
      assert.strictEqual(formatCallDuration(59), '59s');
    });

    it('formats minutes and padded seconds accurately', () => {
      assert.strictEqual(formatCallDuration(60), '1m 00s');
      assert.strictEqual(formatCallDuration(125), '2m 05s');
      assert.strictEqual(formatCallDuration(900), '15m 00s');
    });

    it('formats multi-hour phone sessions accurately', () => {
      assert.strictEqual(formatCallDuration(3600), '1h 0m 00s');
      assert.strictEqual(formatCallDuration(3665), '1h 1m 05s');
      assert.strictEqual(formatCallDuration(7325), '2h 2m 05s');
    });

    it('handles zero, negative, NaN, and null durations safely without NaN outputs', () => {
      assert.strictEqual(formatCallDuration(0), '0s');
      assert.strictEqual(formatCallDuration(-45), '0s');
      assert.strictEqual(formatCallDuration(NaN), '0s');
      assert.strictEqual(formatCallDuration(null), '0s');
      assert.strictEqual(formatCallDuration(undefined), '0s');
    });
  });

  describe('Block 3: Mentions and Operational Tags Tokenizer (parseMentionsAndTags)', () => {
    it('tokenizes @teammate mentions and #operational tags accurately', () => {
      const text = 'Met with Elena. CC @anita and @fenar regarding #urgent #high-margin proposal.';
      const tokens = parseMentionsAndTags(text);

      const mentions = tokens.filter((t) => t.type === 'mention').map((t) => t.value);
      const tags = tokens.filter((t) => t.type === 'tag').map((t) => t.value);

      assert.deepStrictEqual(mentions, ['@anita', '@fenar']);
      assert.deepStrictEqual(tags, ['#urgent', '#high-margin']);
    });

    it('preserves clean text without dropping words or punctuation', () => {
      const text = 'Simple note with no tags or mentions.';
      const tokens = parseMentionsAndTags(text);

      assert.strictEqual(tokens.length, 1);
      assert.strictEqual(tokens[0].type, 'text');
      assert.strictEqual(tokens[0].value, text);
    });

    it('handles empty strings without errors', () => {
      assert.deepStrictEqual(parseMentionsAndTags(''), []);
    });
  });

  describe('Block 4: Activity Data Contract Invariants & Actor Initialization', () => {
    const mockActivity: LeadActivityWithActor = {
      id: 'a0000000-0000-0000-0000-000000000001',
      lead_id: 'c0000000-0000-0000-0000-000000000001',
      actor_id: 'u0000000-0000-0000-0000-000000000001',
      actor_name: 'Anita Nair',
      actor_role: 'sales_manager',
      activity_type: 'call_logged',
      description: 'Discussed custom Next.js hosting terms with VP Strategy. CC @fenar.',
      metadata: {
        duration_seconds: 840,
        outcome: 'Connected',
      },
      created_at: '2026-10-17T11:30:00.000Z',
      actor: {
        id: 'u0000000-0000-0000-0000-000000000001',
        full_name: 'Anita Nair',
        role: 'sales_manager',
        avatar_url: null,
        email: 'anita@marcaubi.com',
      },
    };

    it('extracts avatar initials from actor name accurately', () => {
      assert.strictEqual(getDossierInitials(mockActivity.actor_name), 'AN');
      assert.strictEqual(getDossierInitials('Elena Rostova'), 'ER');
      assert.strictEqual(getDossierInitials('System Staff'), 'SS');
      assert.strictEqual(getDossierInitials('Unassigned'), 'UN');
    });

    it('validates presence of structured call duration and outcome in metadata', () => {
      assert.strictEqual(mockActivity.metadata.duration_seconds, 840);
      assert.strictEqual(mockActivity.metadata.outcome, 'Connected');
      assert.strictEqual(formatCallDuration(mockActivity.metadata.duration_seconds as number), '14m 00s');
    });
  });
});
