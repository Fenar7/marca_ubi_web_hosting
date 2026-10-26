/**
 * @file manual_lead_creation.test.ts
 * @description Comprehensive unit test suite for manual lead creation and Zod schema validation.
 *              Validates contact coordinate enforcement (chk_lead_contact_info), currency formatting,
 *              deal valuation bounds, and Server Action boundary compliance.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import {
  createManualLeadSchema,
  SERVICE_CATEGORIES,
  PREFERRED_CHANNELS,
  LEAD_PRIORITIES,
  BUDGET_TIERS,
} from '@/app/lib/lead-schemas';
import { formatDealValuation } from '@/app/lib/team-utils';

describe('Marca Ubi CRM — Manual Lead Creation & Ingestion Validation (Sprint 5.3)', () => {
  describe('Section 1: Contact Coordinate Enforcement (chk_lead_contact_info)', () => {
    it('accepts a valid client when email coordinate is provided', () => {
      const res = createManualLeadSchema.safeParse({
        name: 'Rashid Al-Nuaimi',
        email: 'rashid@nuaimigroup.ae',
      });
      assert.ok(res.success);
      if (res.success) {
        assert.equal(res.data.name, 'Rashid Al-Nuaimi');
        assert.equal(res.data.email, 'rashid@nuaimigroup.ae');
        assert.equal(res.data.preferredChannel, 'Phone');
        assert.equal(res.data.serviceCategory, 'Web & Digital');
        assert.equal(res.data.priority, 'Medium');
        assert.equal(res.data.expectedValue, 0);
      }
    });

    it('accepts a valid client when phone coordinate is provided', () => {
      const res = createManualLeadSchema.safeParse({
        name: 'Fatima Al-Zahra',
        phone: '+971 50 999 8888',
      });
      assert.ok(res.success);
      if (res.success) {
        assert.equal(res.data.name, 'Fatima Al-Zahra');
        assert.equal(res.data.phone, '+971 50 999 8888');
      }
    });

    it('accepts a valid client when both email and phone are provided', () => {
      const res = createManualLeadSchema.safeParse({
        name: 'Vikramaditya Singhania',
        company: 'Singhania Capital',
        email: 'vikram@singhania.in',
        phone: '+91 98200 12345',
        expectedValue: 2500000,
        priority: 'High',
      });
      assert.ok(res.success);
      if (res.success) {
        assert.equal(res.data.expectedValue, 2500000);
        assert.equal(res.data.priority, 'High');
      }
    });

    it('rejects submissions where neither email nor telephone is supplied', () => {
      const res = createManualLeadSchema.safeParse({
        name: 'Ghost Client',
        company: 'Invisible Inc',
      });
      assert.ok(!res.success);
      if (!res.success) {
        const hasContactError = res.error.issues.some((issue) =>
          issue.message.includes('At least one contact coordinate')
        );
        assert.ok(hasContactError, 'Expected contact coordinate validation error');
      }
    });

    it('rejects submissions where email and phone are empty whitespace strings', () => {
      const res = createManualLeadSchema.safeParse({
        name: 'Ghost Client',
        email: '   ',
        phone: '   ',
      });
      assert.ok(!res.success);
    });
  });

  describe('Section 2: Name and Field Boundary Validations', () => {
    it('rejects client names shorter than 2 characters', () => {
      const res = createManualLeadSchema.safeParse({
        name: 'A',
        email: 'a@example.com',
      });
      assert.ok(!res.success);
    });

    it('rejects client names longer than 100 characters', () => {
      const res = createManualLeadSchema.safeParse({
        name: 'X'.repeat(101),
        email: 'valid@example.com',
      });
      assert.ok(!res.success);
    });

    it('rejects negative expected valuation amounts', () => {
      const res = createManualLeadSchema.safeParse({
        name: 'Valid Name',
        email: 'valid@example.com',
        expectedValue: -50000,
      });
      assert.ok(!res.success);
    });

    it('coerces string numbers to numeric expected valuation', () => {
      const res = createManualLeadSchema.safeParse({
        name: 'Valid Name',
        email: 'valid@example.com',
        expectedValue: '750000',
      });
      assert.ok(res.success);
      if (res.success) {
        assert.equal(res.data.expectedValue, 750000);
      }
    });

    it('rejects malformed email formats', () => {
      const res = createManualLeadSchema.safeParse({
        name: 'Valid Name',
        email: 'invalid-email-format-without-at',
      });
      assert.ok(!res.success);
    });
  });

  describe('Section 3: Enum Constraints Verification', () => {
    it('validates all canonical service categories', () => {
      for (const cat of SERVICE_CATEGORIES) {
        const res = createManualLeadSchema.safeParse({
          name: 'Test Client',
          email: 'test@example.com',
          serviceCategory: cat,
        });
        assert.ok(res.success);
      }
    });

    it('validates all canonical communication channels', () => {
      for (const chan of PREFERRED_CHANNELS) {
        const res = createManualLeadSchema.safeParse({
          name: 'Test Client',
          email: 'test@example.com',
          preferredChannel: chan,
        });
        assert.ok(res.success);
      }
    });

    it('validates all canonical lead priorities', () => {
      for (const prio of LEAD_PRIORITIES) {
        const res = createManualLeadSchema.safeParse({
          name: 'Test Client',
          email: 'test@example.com',
          priority: prio,
        });
        assert.ok(res.success);
      }
    });

    it('contains valid budget bracket options', () => {
      assert.ok(BUDGET_TIERS.length >= 4);
    });
  });

  describe('Section 4: Currency Valuation Formatting', () => {
    it('formats values in Indian Lakhs using full en-IN currency grouping', () => {
      assert.equal(formatDealValuation(500000), '₹5,00,000');
      assert.equal(formatDealValuation(1500000), '₹15,00,000');
      assert.equal(formatDealValuation(7500000), '₹75,00,000');
    });

    it('formats values in Indian Crores using full en-IN currency grouping', () => {
      assert.equal(formatDealValuation(10000000), '₹1,00,00,000');
      assert.equal(formatDealValuation(25000000), '₹2,50,00,000');
    });

    it('formats small amounts with localized commas', () => {
      assert.equal(formatDealValuation(45000), '₹45,000');
      assert.equal(formatDealValuation(0), '₹0');
    });
  });

  describe('Section 5: Next.js 16 Server Action Boundary Integrity', () => {
    it('src/app/actions/leads.ts exports only async functions', () => {
      const fullPath = path.join(process.cwd(), 'src/app/actions/leads.ts');
      const content = fs.readFileSync(fullPath, 'utf8');

      assert.ok(content.startsWith("'use server'"));
      assert.ok(content.includes('export async function createManualLead'));
      assert.ok(content.includes('export async function getActiveTeamAssignees'));
      assert.ok(!content.includes('export type'));
      assert.ok(!content.includes('export interface'));
      assert.ok(!content.includes('export const'));
    });
  });
});
