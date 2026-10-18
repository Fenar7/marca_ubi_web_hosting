/**
 * @file normalization.test.ts
 * @description Master unit test suite for Sprint 10.1: Contact coordinate normalization,
 *              RFC 5322 email formatting, ITU-T E.164 international phone formatting,
 *              XSS HTML sanitization, and deduplication state machine decision matrix.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEmail,
  normalizePhone,
  sanitizeHtml,
} from '@/app/lib/normalization';
import {
  evaluateLeadDeduplication,
  type ExistingLeadRecord,
  type IncomingInquiryPayload,
} from '@/app/lib/deduplication';

describe('Sprint 10.1 Unit Suite: Normalization & Deduplication Validation', () => {
  describe('Block 1: Email Normalization & RFC Compliance', () => {
    it('normalizes uppercase characters to lowercase', () => {
      assert.equal(normalizeEmail('FOUNDER@MARCAUBI.COM'), 'founder@marcaubi.com');
      assert.equal(normalizeEmail('Zayd.Hadi@Emaar.ae'), 'zayd.hadi@emaar.ae');
    });

    it('trims leading, trailing, and embedded tabs/spaces safely', () => {
      assert.equal(normalizeEmail('   hello@domain.com   '), 'hello@domain.com');
      assert.equal(normalizeEmail('\tclient@agency.ae\n'), 'client@agency.ae');
    });

    it('returns null for empty, undefined, or whitespace-only strings', () => {
      assert.equal(normalizeEmail(''), null);
      assert.equal(normalizeEmail('   '), null);
      assert.equal(normalizeEmail(null), null);
      assert.equal(normalizeEmail(undefined), null);
    });

    it('preserves valid RFC 5322 sub-addresses and plus-addressing', () => {
      assert.equal(normalizeEmail('user+crm@domain.co.uk'), 'user+crm@domain.co.uk');
      assert.equal(normalizeEmail('finance.ops+q3@enterprise.com'), 'finance.ops+q3@enterprise.com');
    });

    it('normalizes international domain names to IDN ASCII Punycode', () => {
      assert.equal(normalizeEmail('info@münchen-agency.de'), 'info@xn--mnchen-agency-wob.de');
      assert.equal(normalizeEmail('contact@zürich-partner.ch'), 'contact@xn--zrich-partner-wob.ch');
    });
  });

  describe('Block 2: International Phone Normalization (ITU-T E.164)', () => {
    describe('United Arab Emirates (+971)', () => {
      it('formats domestic mobile numbers (05x) to E.164', () => {
        const res = normalizePhone('050 123 4567');
        assert.equal(res.phone, '+971501234567');
        assert.equal(res.warning, false);
      });

      it('formats domestic Dubai and Abu Dhabi landlines (04, 02) to E.164', () => {
        const dubai = normalizePhone('04 345 6789');
        assert.equal(dubai.phone, '+97143456789');
        assert.equal(dubai.warning, false);

        const abuDhabi = normalizePhone('02-678-9012');
        assert.equal(abuDhabi.phone, '+97126789012');
        assert.equal(abuDhabi.warning, false);
      });

      it('formats international UAE numbers with or without leading plus', () => {
        const withPlus = normalizePhone('+971 50 999 8888');
        assert.equal(withPlus.phone, '+971509998888');
        assert.equal(withPlus.warning, false);

        const withoutPlus = normalizePhone('971509998888');
        assert.equal(withoutPlus.phone, '+971509998888');
        assert.equal(withoutPlus.warning, false);
      });

      it('formats 9-digit numbers starting with 5 directly to UAE E.164', () => {
        const res = normalizePhone('529876543');
        assert.equal(res.phone, '+971529876543');
        assert.equal(res.warning, false);
      });
    });

    describe('India (+91)', () => {
      it('formats 10-digit mobile numbers starting with 6, 7, 8, or 9', () => {
        const res1 = normalizePhone('98765 43210');
        assert.equal(res1.phone, '+919876543210');
        assert.equal(res1.warning, false);

        const res2 = normalizePhone('8123456789');
        assert.equal(res2.phone, '+918123456789');
        assert.equal(res2.warning, false);
      });

      it('strips domestic trunk prefix 0 from Indian mobile numbers', () => {
        const res = normalizePhone('09876543210');
        assert.equal(res.phone, '+919876543210');
        assert.equal(res.warning, false);
      });

      it('formats international 12-digit numbers starting with 91', () => {
        const res = normalizePhone('+91 98765 43210');
        assert.equal(res.phone, '+919876543210');
        assert.equal(res.warning, false);

        const noPlus = normalizePhone('919876543210');
        assert.equal(noPlus.phone, '+919876543210');
        assert.equal(noPlus.warning, false);
      });
    });

    describe('United Kingdom (+44)', () => {
      it('formats domestic mobile numbers (07xxx) to E.164', () => {
        const res = normalizePhone('07911 123456');
        assert.equal(res.phone, '+447911123456');
        assert.equal(res.warning, false);
      });

      it('formats international UK numbers', () => {
        const res = normalizePhone('+44 7911 123456');
        assert.equal(res.phone, '+447911123456');
        assert.equal(res.warning, false);
      });
    });

    describe('Saudi Arabia (+966)', () => {
      it('formats domestic mobile numbers with Saudi-exclusive prefix (051, 057, 059) to E.164', () => {
        const res = normalizePhone('051 234 5678');
        assert.equal(res.phone, '+966512345678');
        assert.equal(res.warning, false);

        const zain = normalizePhone('059 876 5432');
        assert.equal(zain.phone, '+966598765432');
        assert.equal(zain.warning, false);
      });

      it('formats Saudi mobile numbers using countryHint', () => {
        const res = normalizePhone('050 123 4567', 'SA');
        assert.equal(res.phone, '+966501234567');
        assert.equal(res.warning, false);
      });

      it('formats international Saudi numbers starting with 966', () => {
        const res = normalizePhone('+966 51 234 5678');
        assert.equal(res.phone, '+966512345678');
        assert.equal(res.warning, false);
      });
    });

    describe('North America (+1)', () => {
      it('formats standard 10-digit US/Canada phone numbers', () => {
        const res = normalizePhone('(555) 234-5678');
        assert.equal(res.phone, '+15552345678');
        assert.equal(res.warning, false);
      });

      it('formats 11-digit US numbers with country code 1', () => {
        const res = normalizePhone('1-800-555-0199');
        assert.equal(res.phone, '+18005550199');
        assert.equal(res.warning, false);
      });

      it('disambiguates US 10-digit numbers starting with 6, 7, 8, or 9 from Indian numbers', () => {
        // Boston area code 617
        const boston = normalizePhone('(617) 555-0199');
        assert.equal(boston.phone, '+16175550199');
        assert.equal(boston.warning, false);

        // New York area code 917
        const nyc = normalizePhone('(917) 555-0199');
        assert.equal(nyc.phone, '+19175550199');
        assert.equal(nyc.warning, false);

        // Los Angeles area code 818 with dashes
        const la = normalizePhone('818-555-0199');
        assert.equal(la.phone, '+18185550199');
        assert.equal(la.warning, false);
      });
    });

    describe('Edge Cases, Vanity Strings & Anomaly Flags', () => {
      it('handles double zero international dialing prefixes (00971...)', () => {
        const res = normalizePhone('00971501234567');
        assert.equal(res.phone, '+971501234567');
        assert.equal(res.warning, false);
      });

      it('flags anomaly warning for non-parseable vanity strings', () => {
        const res = normalizePhone('1-800-MARCA-UBI');
        assert.equal(res.warning, true);
        assert.ok(res.phone !== null);
      });

      it('returns null phone and raw string for empty inputs', () => {
        const res = normalizePhone('');
        assert.equal(res.phone, null);
        assert.equal(res.warning, false);
      });
    });
  });

  describe('Block 3: Text & Script Sanitization (XSS Defense)', () => {
    it('escapes dangerous HTML script tags', () => {
      const sanitized = sanitizeHtml('<script>alert("xss")</script>');
      assert.equal(sanitized, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('escapes single and double quotes to prevent attribute breakout', () => {
      const sanitized = sanitizeHtml('Test "deal" & \'client\'');
      assert.equal(sanitized, 'Test &quot;deal&quot; &amp; &#x27;client&#x27;');
    });

    it('returns null for empty strings or null inputs', () => {
      assert.equal(sanitizeHtml(null), null);
      assert.equal(sanitizeHtml(''), null);
    });
  });

  describe('Block 4: Smart Deduplication State Machine Invariants', () => {
    const mockActiveLead: ExistingLeadRecord = {
      id: 'd0000000-0000-0000-0000-000000000001',
      lead_id: 'LD-1001',
      name: 'Tariq Al-Mansoor',
      email: 'client@luxuryagency.ae',
      phone: '+971501234567',
      status_id: 's0000000-0000-0000-0000-000000000001',
      status_name: 'Contacted',
      status_bucket: 'open',
      priority: 'Medium',
      inquiry_count: 1,
      assigned_to: 'u0000000-0000-0000-0000-000000000001',
      notes: null,
      brief_payload: {},
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const mockIncoming: IncomingInquiryPayload = {
      name: 'Tariq Al-Mansoor',
      email: 'client@luxuryagency.ae',
      phone: '+971501234567',
      company: 'Emaar Properties',
      source_code: 'website_brief',
    };

    it('merges subsequent inquiries into active open leads without creating duplicate records', () => {
      const decision = evaluateLeadDeduplication(mockActiveLead, mockIncoming);
      assert.equal(decision.action, 'MERGE_INQUIRY');
      assert.equal(decision.targetLeadId, 'LD-1001');
      assert.equal(decision.targetLeadUuid, mockActiveLead.id);
      assert.equal(decision.elevatePriority, true);
      assert.equal(decision.newPriority, 'High');
      assert.equal(decision.inquiryCountIncrement, 1);
      assert.equal(decision.triggerOverdue, true);
    });

    it('creates new re-engagement deal when submitted for an already Converted customer', () => {
      const convertedLead: ExistingLeadRecord = {
        ...mockActiveLead,
        status_name: 'Converted',
        status_bucket: 'converted',
        converted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const decision = evaluateLeadDeduplication(convertedLead, mockIncoming);
      assert.equal(decision.action, 'CREATE_NEW_REENGAGEMENT');
      assert.equal(decision.previousLeadId, 'LD-1001');
      assert.equal(decision.targetLeadUuid, convertedLead.id);
    });

    it('creates new re-engagement deal for Lost accounts if new inquiry arrives after 90 days', () => {
      const oldLostLead: ExistingLeadRecord = {
        ...mockActiveLead,
        status_name: 'Lost',
        status_bucket: 'lost',
        updated_at: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const decision = evaluateLeadDeduplication(oldLostLead, mockIncoming);
      assert.equal(decision.action, 'CREATE_NEW_REENGAGEMENT');
      assert.equal(decision.previousLeadId, 'LD-1001');
      assert.equal(decision.targetLeadUuid, oldLostLead.id);
    });

    it('reactivates Lost accounts if new inquiry arrives within the 90-day cooldown window', () => {
      const recentLostLead: ExistingLeadRecord = {
        ...mockActiveLead,
        status_name: 'Lost',
        status_bucket: 'lost',
        updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const decision = evaluateLeadDeduplication(recentLostLead, mockIncoming);
      assert.equal(decision.action, 'REACTIVATE_LEAD');
      assert.equal(decision.targetLeadId, 'LD-1001');
      assert.equal(decision.targetLeadUuid, recentLostLead.id);
      assert.equal(decision.newPriority, 'High');
    });
  });
});
