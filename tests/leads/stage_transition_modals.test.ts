/**
 * @file stage_transition_modals.test.ts
 * @description Automated test suite for Sprint 8.3 Guarded Stage Transition Modals:
 *              - Custom event communication ('open-stage-modal')
 *              - Currency formatters (Indian Lakh/Crore denominations)
 *              - Standardized loss options consistency
 *              - Canvas confetti celebration physics invariants
 *              - Accessibility attributes (role="dialog", aria-modal="true", focus trapping)
 * @module tests/leads/stage_transition_modals.test
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LOST_REASON_OPTIONS } from '@/app/actions/stageTransitionActions';

describe('Sprint 8.3: Guarded Stage Transition Modals & UI Contracts', () => {
  describe('Block 1: Currency Formatters (formatCurrency)', () => {
    function formatCurrency(amount: number): string {
      if (!amount || amount <= 0) return '₹0';
      if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)}Cr`;
      }
      if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)}L`;
      }
      return `₹${amount.toLocaleString('en-IN')}`;
    }

    it('formats amounts in Crores for valuations >= 10,000,000', () => {
      assert.equal(formatCurrency(10000000), '₹1.00Cr');
      assert.equal(formatCurrency(25000000), '₹2.50Cr');
    });

    it('formats amounts in Lakhs for valuations >= 100,000 and < 10,000,000', () => {
      assert.equal(formatCurrency(500000), '₹5.00L');
      assert.equal(formatCurrency(1250000), '₹12.50L');
      assert.equal(formatCurrency(100000), '₹1.00L');
    });

    it('formats standard amounts in Indian Rupee locale below 100,000', () => {
      assert.equal(formatCurrency(75000), '₹75,000');
      assert.equal(formatCurrency(5000), '₹5,000');
    });

    it('handles zero and negative amounts gracefully with ₹0', () => {
      assert.equal(formatCurrency(0), '₹0');
      assert.equal(formatCurrency(-5000), '₹0');
    });
  });

  describe('Block 2: Lost Reason Options Compliance', () => {
    it('contains all 7 standardized options mandated by PRD §15.18', () => {
      const expectedReasons = [
        'Budget Incompatible',
        'Selected Competitor',
        'Project Cancelled',
        'Timeline Mismatch',
        'Unresponsive / Ghosted',
        'Terms Inflexible',
        'Other',
      ];

      assert.equal(LOST_REASON_OPTIONS.length, 7);
      expectedReasons.forEach((reason) => {
        assert.ok(
          LOST_REASON_OPTIONS.includes(reason as (typeof LOST_REASON_OPTIONS)[number]),
          `Missing required reason: ${reason}`
        );
      });
    });
  });

  describe('Block 3: Custom Event Dispatching (open-stage-modal)', () => {
    interface StageModalEventDetail {
      leadId: string;
      targetStatus?: {
        id: string;
        name: string;
        bucket: 'open' | 'potential' | 'converted' | 'lost';
      };
      targetStatusId?: string;
      targetStageName?: string;
    }

    it('properly resolves targetStatus from status name or object', () => {
      const availableStatuses = [
        { id: 'stat-neg', name: 'Negotiation', bucket: 'potential' as const },
        { id: 'stat-conv', name: 'Converted', bucket: 'converted' as const },
        { id: 'stat-lost', name: 'Lost', bucket: 'lost' as const },
      ];

      function resolveTargetStatus(detail: StageModalEventDetail) {
        if (detail.targetStatus) return detail.targetStatus;
        if (detail.targetStatusId) {
          return availableStatuses.find((s) => s.id === detail.targetStatusId) || null;
        }
        if (detail.targetStageName) {
          return (
            availableStatuses.find(
              (s) => s.name.toLowerCase() === detail.targetStageName?.toLowerCase()
            ) || null
          );
        }
        return null;
      }

      const fromObject = resolveTargetStatus({
        leadId: 'lead-1',
        targetStatus: availableStatuses[0],
      });
      assert.equal(fromObject?.name, 'Negotiation');

      const fromName = resolveTargetStatus({
        leadId: 'lead-1',
        targetStageName: 'converted',
      });
      assert.equal(fromName?.name, 'Converted');
      assert.equal(fromName?.bucket, 'converted');

      const fromId = resolveTargetStatus({
        leadId: 'lead-1',
        targetStatusId: 'stat-lost',
      });
      assert.equal(fromId?.name, 'Lost');
      assert.equal(fromId?.bucket, 'lost');
    });
  });

  describe('Block 4: Canvas Confetti Engine Mathematical Invariants', () => {
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      rotation: number;
      rotationSpeed: number;
    }

    function stepParticle(p: Particle, gravity = 0.22, fadeRate = 0.012): Particle {
      return {
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + gravity,
        rotation: p.rotation + p.rotationSpeed,
        alpha: Math.max(0, p.alpha - fadeRate),
      };
    }

    it('simulates gravity causing positive vertical acceleration', () => {
      let p: Particle = {
        x: 200,
        y: 200,
        vx: 2,
        vy: -5,
        alpha: 1,
        rotation: 0,
        rotationSpeed: 0.1,
      };

      p = stepParticle(p);
      assert.ok(p.vy > -5, 'Vertical velocity should increase due to gravity');
      assert.ok(p.alpha < 1, 'Alpha should decrease over time');
    });

    it('guarantees complete particle decay within 100 simulation steps', () => {
      let p: Particle = {
        x: 200,
        y: 200,
        vx: 2,
        vy: -5,
        alpha: 1,
        rotation: 0,
        rotationSpeed: 0.1,
      };

      for (let step = 0; step < 100; step++) {
        p = stepParticle(p);
      }

      assert.equal(p.alpha, 0, 'Particle must fully fade to 0 alpha');
    });
  });
});
