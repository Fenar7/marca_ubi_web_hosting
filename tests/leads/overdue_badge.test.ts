/**
 * @file overdue_badge.test.ts
 * @description Comprehensive automated test suite for Sprint 9.2 Overdue Escalation Engine:
 *              - Tiered elapsed time calculations (<24h amber, 24-72h orange, >72h red pulse)
 *              - Alert suppression for 'On Hold' deals with future revisit dates
 *              - Terminal bucket suppression (converted and lost)
 *              - Boundary wrapping and human-readable label formatting
 *              - Color theme token definitions
 * @module tests/leads/overdue_badge.test
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOverdueTier,
  getOverdueBadgeTheme,
} from '@/app/admin/components/Badges/badgeUtils';

describe('Sprint 9.2: Overdue Escalation Engine & Badge Math', () => {
  const BASE_TIME = new Date('2026-10-18T12:00:00Z').getTime();

  describe('Block 1: Basic Invariants & Suppression Rules', () => {
    it('returns tier: none when nextFollowUp is absent or null', () => {
      const res1 = calculateOverdueTier(null, { nowMs: BASE_TIME });
      assert.equal(res1.isOverdue, false);
      assert.equal(res1.tier, 'none');

      const res2 = calculateOverdueTier(undefined, { nowMs: BASE_TIME });
      assert.equal(res2.isOverdue, false);
      assert.equal(res2.tier, 'none');
    });

    it('returns tier: none when follow-up date is in the future', () => {
      const futureDate = new Date(BASE_TIME + 2 * 3600 * 1000).toISOString();
      const res = calculateOverdueTier(futureDate, { nowMs: BASE_TIME });
      assert.equal(res.isOverdue, false);
      assert.equal(res.tier, 'none');
    });

    it('suppresses overdue alerts for converted deals', () => {
      const pastDate = new Date(BASE_TIME - 48 * 3600 * 1000).toISOString();
      const res = calculateOverdueTier(pastDate, { bucket: 'converted', nowMs: BASE_TIME });
      assert.equal(res.isOverdue, false);
      assert.equal(res.tier, 'none');
    });

    it('suppresses overdue alerts for lost deals', () => {
      const pastDate = new Date(BASE_TIME - 120 * 3600 * 1000).toISOString();
      const res = calculateOverdueTier(pastDate, { bucket: 'lost', nowMs: BASE_TIME });
      assert.equal(res.isOverdue, false);
      assert.equal(res.tier, 'none');
    });

    it('suppresses overdue alerts for On Hold deals with future revisit_date', () => {
      const pastDate = new Date(BASE_TIME - 24 * 3600 * 1000).toISOString();
      const res = calculateOverdueTier(pastDate, {
        statusName: 'On Hold',
        revisitDate: '2026-10-25', // Future date
        nowMs: BASE_TIME,
      });
      assert.equal(res.isOverdue, false);
      assert.equal(res.tier, 'none');
    });

    it('triggers overdue escalation when On Hold revisit_date has arrived or passed', () => {
      const pastDate = new Date(BASE_TIME - 10 * 3600 * 1000).toISOString();
      const res = calculateOverdueTier(pastDate, {
        statusName: 'On Hold',
        revisitDate: '2026-10-18', // Today
        nowMs: BASE_TIME,
      });
      assert.equal(res.isOverdue, true);
      assert.equal(res.tier, 'amber');
    });
  });

  describe('Block 2: Tiered Overdue Calculations & Boundaries', () => {
    it('assigns amber tier for touchpoints overdue < 24 hours', () => {
      // 3 hours overdue
      const past3h = new Date(BASE_TIME - 3 * 3600 * 1000).toISOString();
      const res = calculateOverdueTier(past3h, { nowMs: BASE_TIME });
      assert.equal(res.isOverdue, true);
      assert.equal(res.tier, 'amber');
      assert.equal(res.label, 'Overdue: Due 3h ago');
      assert.equal(res.shortLabel, 'Due 3h ago');
    });

    it('formats touchpoints overdue by less than 1 hour as Due <1h ago', () => {
      const past20m = new Date(BASE_TIME - 20 * 60 * 1000).toISOString();
      const res = calculateOverdueTier(past20m, { nowMs: BASE_TIME });
      assert.equal(res.isOverdue, true);
      assert.equal(res.tier, 'amber');
      assert.equal(res.label, 'Overdue: Due <1h ago');
    });

    it('assigns vivid orange tier for touchpoints overdue between 24 and 72 hours', () => {
      // Exactly 36 hours overdue (1 day)
      const past36h = new Date(BASE_TIME - 36 * 3600 * 1000).toISOString();
      const res1 = calculateOverdueTier(past36h, { nowMs: BASE_TIME });
      assert.equal(res1.isOverdue, true);
      assert.equal(res1.tier, 'orange');
      assert.equal(res1.label, 'Urgent: Due 1d ago');
      assert.equal(res1.shortLabel, 'Due 1d ago');

      // 60 hours overdue (2 days)
      const past60h = new Date(BASE_TIME - 60 * 3600 * 1000).toISOString();
      const res2 = calculateOverdueTier(past60h, { nowMs: BASE_TIME });
      assert.equal(res2.isOverdue, true);
      assert.equal(res2.tier, 'orange');
      assert.equal(res2.label, 'Urgent: Due 2d ago');
    });

    it('assigns critical red pulse tier for touchpoints overdue > 72 hours', () => {
      // Exactly 75 hours overdue (3 days)
      const past75h = new Date(BASE_TIME - 75 * 3600 * 1000).toISOString();
      const res1 = calculateOverdueTier(past75h, { nowMs: BASE_TIME });
      assert.equal(res1.isOverdue, true);
      assert.equal(res1.tier, 'red_pulse');
      assert.equal(res1.label, 'Critical: 3d Overdue');
      assert.equal(res1.shortLabel, '3d Overdue');

      // 144 hours overdue (6 days)
      const past144h = new Date(BASE_TIME - 144 * 3600 * 1000).toISOString();
      const res2 = calculateOverdueTier(past144h, { nowMs: BASE_TIME });
      assert.equal(res2.isOverdue, true);
      assert.equal(res2.tier, 'red_pulse');
      assert.equal(res2.label, 'Critical: 6d Overdue');
    });
  });

  describe('Block 3: Exact Boundary Transitions', () => {
    it('transitions from amber to orange at exactly 24 hours', () => {
      const rightBefore24h = new Date(BASE_TIME - (24 * 3600 * 1000 - 1000)).toISOString();
      assert.equal(calculateOverdueTier(rightBefore24h, { nowMs: BASE_TIME }).tier, 'amber');

      const exactly24h = new Date(BASE_TIME - 24 * 3600 * 1000).toISOString();
      assert.equal(calculateOverdueTier(exactly24h, { nowMs: BASE_TIME }).tier, 'orange');
    });

    it('transitions from orange to red_pulse at exactly 72 hours', () => {
      const rightBefore72h = new Date(BASE_TIME - (72 * 3600 * 1000 - 1000)).toISOString();
      assert.equal(calculateOverdueTier(rightBefore72h, { nowMs: BASE_TIME }).tier, 'orange');

      const exactly72h = new Date(BASE_TIME - 72 * 3600 * 1000).toISOString();
      assert.equal(calculateOverdueTier(exactly72h, { nowMs: BASE_TIME }).tier, 'red_pulse');
    });
  });

  describe('Block 4: Theme Tokens & Color Fidelity', () => {
    it('returns brand color codes for each tier', () => {
      const amberTheme = getOverdueBadgeTheme('amber');
      assert.equal(amberTheme.colorCode, '#f59e0b');

      const orangeTheme = getOverdueBadgeTheme('orange');
      assert.equal(orangeTheme.colorCode, '#ff6100');

      const redTheme = getOverdueBadgeTheme('red_pulse');
      assert.equal(redTheme.colorCode, '#ef4444');
    });
  });
});
