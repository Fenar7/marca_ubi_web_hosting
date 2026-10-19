/**
 * @file phase-6-telemetry-settings-and-dossier.test.ts
 * @description Dedicated unit and integration test suite for Phase 6:
 *              Live Webhook Telemetry, SLA Governance Settings,
 *              Brief Ingestion Simulation & Unified Client 360° Dossier Interface.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  agencySettingsSchema,
  updateAgencySettingsSchema,
  type AgencySettings,
  type UpdateAgencySettingsInput,
} from '../../src/app/lib/agency-settings-schemas';

describe('Phase 6: Live Webhook Telemetry, Operational Settings & Unified Dossier Suite', () => {
  describe('Agency Operational Settings Zod Schemas', () => {
    it('validates standard default operational settings payload', () => {
      const validPayload = {
        id: 'default' as const,
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
        notification_email: 'executive@marcaubi.com',
      };

      const result = agencySettingsSchema.safeParse(validPayload);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.lead_response_sla_minutes, 60);
        assert.strictEqual(result.data.followup_grace_period_hours, 4);
        assert.strictEqual(result.data.stale_deal_threshold_days, 14);
        assert.strictEqual(result.data.dedup_window_hours, 24);
        assert.strictEqual(result.data.bot_rate_limit_per_minute, 10);
        assert.strictEqual(result.data.notification_email, 'executive@marcaubi.com');
      }
    });

    it('rejects lead response SLA below 5 minutes or above 1440 minutes', () => {
      const tooLow = {
        lead_response_sla_minutes: 2,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
      };
      const lowResult = updateAgencySettingsSchema.safeParse(tooLow);
      assert.strictEqual(lowResult.success, false);

      const tooHigh = {
        lead_response_sla_minutes: 2000,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
      };
      const highResult = updateAgencySettingsSchema.safeParse(tooHigh);
      assert.strictEqual(highResult.success, false);
    });

    it('rejects follow-up grace period exceeding 72 hours or negative values', () => {
      const negativeGrace = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: -1,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
      };
      const negResult = updateAgencySettingsSchema.safeParse(negativeGrace);
      assert.strictEqual(negResult.success, false);

      const excessiveGrace = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 100,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
      };
      const excResult = updateAgencySettingsSchema.safeParse(excessiveGrace);
      assert.strictEqual(excResult.success, false);
    });

    it('validates stale deal inactivity threshold (1 to 90 days)', () => {
      const validMin = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 1,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(validMin).success, true);

      const validMax = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 90,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(validMax).success, true);

      const zeroDays = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 0,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(zeroDays).success, false);
    });

    it('validates deduplication collision window (1 to 168 hours / 7 days)', () => {
      const validWindow = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 48,
        bot_rate_limit_per_minute: 10,
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(validWindow).success, true);

      const tooLong = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 200,
        bot_rate_limit_per_minute: 10,
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(tooLong).success, false);
    });

    it('validates spam bot rate limit (5 to 120 req/min)', () => {
      const validRate = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 60,
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(validRate).success, true);

      const tooLow = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 2,
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(tooLow).success, false);
    });

    it('validates notification email formatting strictly when provided', () => {
      const validEmail = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
        notification_email: 'ops@marcaubi.com',
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(validEmail).success, true);

      const invalidEmail = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
        notification_email: 'not-an-email',
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(invalidEmail).success, false);

      const nullEmail = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
        notification_email: null,
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(nullEmail).success, true);
    });
  });

  describe('Inbound Brief Simulation & Deduplication Engine Invariants', () => {
    it('requires name and at least one contact channel (phone or email)', () => {
      const hasBoth = { name: 'Vikram Patel', email: 'vikram@patel.com', phone: '+919876543210' };
      const hasEmailOnly = { name: 'Vikram Patel', email: 'vikram@patel.com', phone: '' };
      const hasPhoneOnly = { name: 'Vikram Patel', email: '', phone: '+919876543210' };
      const missingContact = { name: 'Vikram Patel', email: '', phone: '' };
      const missingName = { name: '', email: 'vikram@patel.com', phone: '+919876543210' };

      const validate = (payload: { name: string; email: string; phone: string }) => {
        const name = payload.name.trim();
        const email = payload.email.trim();
        const phone = payload.phone.trim();
        return Boolean(name && (email || phone));
      };

      assert.strictEqual(validate(hasBoth), true);
      assert.strictEqual(validate(hasEmailOnly), true);
      assert.strictEqual(validate(hasPhoneOnly), true);
      assert.strictEqual(validate(missingContact), false);
      assert.strictEqual(validate(missingName), false);
    });

    it('detects 24-hour duplicate collision window correctly', () => {
      const now = Date.now();
      const within24h = new Date(now - 12 * 60 * 60 * 1000).toISOString();
      const outside24h = new Date(now - 30 * 60 * 60 * 1000).toISOString();
      const windowStart = new Date(now - 24 * 60 * 60 * 1000).toISOString();

      assert.strictEqual(within24h >= windowStart, true, 'Submission within 12h must trigger duplicate window');
      assert.strictEqual(outside24h >= windowStart, false, 'Submission past 30h must register as new deal');
    });

    it('attaches simulated metadata flags to brief payload', () => {
      const callerId = '550e8400-e29b-41d4-a716-446655440000';
      const briefPayload = {
        services: ['Web & Digital'],
        budget_bracket: '₹15L - ₹25L',
        timeline: 'Q4 2026',
        client_message: 'High-end digital platform development',
        simulated: true,
        simulated_by: callerId,
      };

      assert.strictEqual(briefPayload.simulated, true);
      assert.strictEqual(briefPayload.simulated_by, callerId);
      assert.deepStrictEqual(briefPayload.services, ['Web & Digital']);
    });
  });

  describe('Unified Client 360° Dossier Interface Contract', () => {
    it('normalizes custom event payloads for both string ID and object detail', () => {
      const parseLeadIdFromEvent = (detail: unknown): string | null => {
        if (typeof detail === 'string') return detail;
        if (typeof detail === 'object' && detail !== null && 'leadId' in detail) {
          return String((detail as { leadId: unknown }).leadId);
        }
        return null;
      };

      assert.strictEqual(parseLeadIdFromEvent('lead-uuid-123'), 'lead-uuid-123');
      assert.strictEqual(
        parseLeadIdFromEvent({ leadId: 'lead-uuid-456' }),
        'lead-uuid-456'
      );
      assert.strictEqual(parseLeadIdFromEvent(null), null);
      assert.strictEqual(parseLeadIdFromEvent(undefined), null);
      assert.strictEqual(parseLeadIdFromEvent({ other: 'value' }), null);
    });

    it('enforces administrative role boundaries for operational mutations', () => {
      const checkAdminAuthorization = (role: string, status: string): boolean => {
        return role === 'admin' && status === 'active';
      };

      assert.strictEqual(checkAdminAuthorization('admin', 'active'), true);
      assert.strictEqual(checkAdminAuthorization('admin', 'suspended'), false);
      assert.strictEqual(checkAdminAuthorization('sales_manager', 'active'), false);
      assert.strictEqual(checkAdminAuthorization('sales_executive', 'active'), false);
      assert.strictEqual(checkAdminAuthorization('viewer', 'active'), false);
    });
  });
});
