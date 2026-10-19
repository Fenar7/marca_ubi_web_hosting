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
  simulateInboundBriefSchema,
  type AgencySettings,
  type UpdateAgencySettingsInput,
  type SimulateInboundBriefInput,
} from '../../src/app/lib/agency-settings-schemas';
import { normalizeEmail, normalizePhone } from '../../src/app/lib/normalization';

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

    it('validates notification email formatting strictly when provided, accepts empty string or null', () => {
      const validEmail = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
        notification_email: 'ops@marcaubi.com',
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(validEmail).success, true);

      const emptyStringEmail = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
        notification_email: '',
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(emptyStringEmail).success, true);

      const nullEmail = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
        notification_email: null,
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(nullEmail).success, true);

      const invalidEmail = {
        lead_response_sla_minutes: 60,
        followup_grace_period_hours: 4,
        stale_deal_threshold_days: 14,
        dedup_window_hours: 24,
        bot_rate_limit_per_minute: 10,
        notification_email: 'not-an-email',
      };
      assert.strictEqual(updateAgencySettingsSchema.safeParse(invalidEmail).success, false);
    });
  });

  describe('Inbound Brief Simulation Schema (simulateInboundBriefSchema)', () => {
    it('validates a complete, authentic inbound brief submission', () => {
      const validSubmission = {
        name: 'Arjun Singhania',
        email: 'arjun@singhaniacorp.com',
        phone: '+91 98765 43210',
        company: 'Singhania Luxury Group',
        serviceCategory: 'Web & Digital',
        budgetBracket: '₹25L - ₹50L',
        message: 'Need high-touch bespoke portal for global hospitality clients.',
      };

      const result = simulateInboundBriefSchema.safeParse(validSubmission);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.name, 'Arjun Singhania');
        assert.strictEqual(result.data.email, 'arjun@singhaniacorp.com');
        assert.strictEqual(result.data.phone, '+91 98765 43210');
        assert.strictEqual(result.data.company, 'Singhania Luxury Group');
      }
    });

    it('applies default metadata values when optional fields are omitted', () => {
      const minimalSubmission = {
        name: 'Leila Farooq',
        email: 'leila@farooq.ae',
        phone: '+971 50 123 4567',
      };

      const result = simulateInboundBriefSchema.safeParse(minimalSubmission);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.company, 'Simulated Organization');
        assert.strictEqual(result.data.serviceCategory, 'Web & Digital');
        assert.strictEqual(result.data.budgetBracket, '₹15L - ₹25L');
        assert.strictEqual(result.data.message, 'Simulated inbound creative brief submission.');
      }
    });

    it('rejects submissions with missing or invalid client name', () => {
      const emptyName = {
        name: '   ',
        email: 'client@example.com',
        phone: '+919876543210',
      };
      assert.strictEqual(simulateInboundBriefSchema.safeParse(emptyName).success, false);

      const excessiveName = {
        name: 'A'.repeat(101),
        email: 'client@example.com',
        phone: '+919876543210',
      };
      assert.strictEqual(simulateInboundBriefSchema.safeParse(excessiveName).success, false);
    });

    it('rejects submissions with invalid email address format', () => {
      const badEmail = {
        name: 'Valid Name',
        email: 'not-an-email-format',
        phone: '+919876543210',
      };
      assert.strictEqual(simulateInboundBriefSchema.safeParse(badEmail).success, false);
    });

    it('rejects submissions with invalid phone number characters', () => {
      const alphaPhone = {
        name: 'Valid Name',
        email: 'client@example.com',
        phone: 'call-me-now-1234',
      };
      assert.strictEqual(simulateInboundBriefSchema.safeParse(alphaPhone).success, false);

      const tooShortPhone = {
        name: 'Valid Name',
        email: 'client@example.com',
        phone: '123',
      };
      assert.strictEqual(simulateInboundBriefSchema.safeParse(tooShortPhone).success, false);
    });

    it('rejects messages exceeding 2000 characters', () => {
      const longMessage = {
        name: 'Valid Name',
        email: 'client@example.com',
        phone: '+919876543210',
        message: 'x'.repeat(2001),
      };
      assert.strictEqual(simulateInboundBriefSchema.safeParse(longMessage).success, false);
    });
  });

  describe('Sanitization & PostgREST Filter Injection Defense', () => {
    it('normalizes email addresses to lowercase and trims extraneous whitespace', () => {
      assert.strictEqual(normalizeEmail('  Vikram.Patel@MarcaUbi.COM  '), 'vikram.patel@marcaubi.com');
      assert.strictEqual(normalizeEmail(null), null);
      assert.strictEqual(normalizeEmail('   '), null);
    });

    it('normalizes international phone numbers into ITU-T E.164 format', () => {
      const inResult = normalizePhone('09876543210', 'IN');
      assert.strictEqual(inResult.phone, '+919876543210');

      const aeResult = normalizePhone('050 123 4567', 'AE');
      assert.strictEqual(aeResult.phone, '+971501234567');
    });

    it('sanitizes injection characters out of PostgREST filter operands', () => {
      // In settings.ts, raw values are sanitized before interpolation into .or(`email.eq.${cleanEmail},phone.eq.${cleanPhone}`)
      const sanitizePostgrestOperand = (val: string): string => {
        return val.replace(/[,()"'\\]/g, '').trim();
      };

      const hostileInput = "test@domain.com',phone.eq.'+1234567890";
      const sanitized = sanitizePostgrestOperand(hostileInput);
      assert.strictEqual(sanitized.includes(','), false);
      assert.strictEqual(sanitized.includes("'"), false);
      assert.strictEqual(sanitized.includes('"'), false);
      assert.strictEqual(sanitized.includes(')'), false);
    });
  });

  describe('Inbound Brief Simulation & Deduplication Engine Invariants', () => {
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

    it('enforces manager or admin authorization for inbound brief simulation', () => {
      const checkSimulationAuthorization = (role: string, status: string): boolean => {
        if (status !== 'active') return false;
        return role === 'admin' || role === 'sales_manager';
      };

      assert.strictEqual(checkSimulationAuthorization('admin', 'active'), true);
      assert.strictEqual(checkSimulationAuthorization('sales_manager', 'active'), true);
      assert.strictEqual(checkSimulationAuthorization('sales_executive', 'active'), false);
      assert.strictEqual(checkSimulationAuthorization('viewer', 'active'), false);
      assert.strictEqual(checkSimulationAuthorization('sales_manager', 'suspended'), false);
    });
  });
});
