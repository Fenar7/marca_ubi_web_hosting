/**
 * @file normalization_and_ratelimit.test.ts
 * @description Unit test suite for Sprint 5.1: Contact normalization, IP extraction,
 *              token-bucket rate limiting, honeypot validation, and Zod ingestion schemas.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEmail,
  normalizePhone,
  sanitizeHtml,
} from '@/app/lib/normalization';
import {
  checkRateLimit,
  extractClientIp,
  resetRateLimit,
} from '@/app/lib/rateLimit';
import { ingestLeadSchema } from '@/app/lib/validations/ingest';

describe('Marca Ubi CRM — Lead Ingestion & Normalization Engine (Sprint 5.1)', () => {
  beforeEach(() => {
    resetRateLimit();
  });

  describe('Section 1: Email Normalization & RFC Compliance', () => {
    it('trims leading and trailing whitespace', () => {
      assert.equal(normalizeEmail('   partner@emaar.ae   '), 'partner@emaar.ae');
    });

    it('converts uppercase characters to lowercase', () => {
      assert.equal(normalizeEmail('ZAYD.HADI@EMAAR.AE'), 'zayd.hadi@emaar.ae');
    });

    it('returns null for empty or null input', () => {
      assert.equal(normalizeEmail(''), null);
      assert.equal(normalizeEmail('   '), null);
      assert.equal(normalizeEmail(null), null);
      assert.equal(normalizeEmail(undefined), null);
    });
  });

  describe('Section 2: Phone Normalization to ITU-T E.164 Standard', () => {
    it('normalizes domestic UAE mobile numbers to E.164 (+971)', () => {
      const res1 = normalizePhone('050 123 4567');
      assert.equal(res1.phone, '+971501234567');
      assert.equal(res1.warning, false);

      const res2 = normalizePhone('052-987-6543');
      assert.equal(res2.phone, '+971529876543');
      assert.equal(res2.warning, false);
    });

    it('normalizes domestic UAE landline numbers to E.164 (+971)', () => {
      const res = normalizePhone('04 345 6789');
      assert.equal(res.phone, '+97143456789');
      assert.equal(res.warning, false);
    });

    it('normalizes domestic Indian mobile numbers with leading 0 to E.164 (+91)', () => {
      const res = normalizePhone('098470 12345');
      assert.equal(res.phone, '+919847012345');
      assert.equal(res.warning, false);
    });

    it('normalizes 10-digit Indian mobile numbers starting with 9 to E.164 (+91)', () => {
      const res = normalizePhone('9847012345');
      assert.equal(res.phone, '+919847012345');
      assert.equal(res.warning, false);
    });

    it('normalizes domestic UK mobile numbers starting with 07 to E.164 (+44)', () => {
      const res = normalizePhone('07911 123456');
      assert.equal(res.phone, '+447911123456');
      assert.equal(res.warning, false);
    });

    it('normalizes North American 10-digit numbers to E.164 (+1)', () => {
      const res1 = normalizePhone('(555) 123-4567');
      assert.equal(res1.phone, '+15551234567');
      assert.equal(res1.warning, false);

      const res2 = normalizePhone('1-555-123-4567');
      assert.equal(res2.phone, '+15551234567');
      assert.equal(res2.warning, false);
    });

    it('flags unparseable short numbers with warning: true while preserving cleaned digits', () => {
      const res = normalizePhone('1234');
      assert.equal(res.phone, '1234');
      assert.equal(res.warning, true);
    });

    it('returns null phone and false warning for empty inputs', () => {
      const res = normalizePhone('');
      assert.equal(res.phone, null);
      assert.equal(res.warning, false);
    });
  });

  describe('Section 3: HTML Sanitization & XSS Mitigation', () => {
    it('encodes dangerous script tags into safe HTML entities', () => {
      const sanitized = sanitizeHtml('<script>alert("pwned")</script>');
      assert.equal(sanitized, '&lt;script&gt;alert(&quot;pwned&quot;)&lt;/script&gt;');
    });

    it('encodes ampersands and quotes properly', () => {
      const sanitized = sanitizeHtml("Emaar & Nakheel's \"Luxury\" Living");
      assert.equal(sanitized, 'Emaar &amp; Nakheel&#x27;s &quot;Luxury&quot; Living');
    });

    it('returns null for empty strings', () => {
      assert.equal(sanitizeHtml(null), null);
      assert.equal(sanitizeHtml(''), null);
    });
  });

  describe('Section 4: Token-Bucket Rate Limiter & IP Extraction', () => {
    it('allows up to 10 requests within a 10-minute window for an IP', () => {
      const testIp = '198.51.100.42';

      for (let i = 1; i <= 10; i++) {
        const status = checkRateLimit(testIp);
        assert.equal(status.allowed, true, `Request ${i} should be allowed`);
        assert.equal(status.remaining, 10 - i);
      }

      // 11th request must be blocked
      const blockedStatus = checkRateLimit(testIp);
      assert.equal(blockedStatus.allowed, false);
      assert.equal(blockedStatus.remaining, 0);
      assert.ok(blockedStatus.retryAfterSeconds > 0);
    });

    it('maintains isolated token quotas across distinct client IPs', () => {
      const ipA = '198.51.100.1';
      const ipB = '198.51.100.2';

      // Exhaust IP A
      for (let i = 0; i < 10; i++) {
        checkRateLimit(ipA);
      }
      assert.equal(checkRateLimit(ipA).allowed, false);

      // IP B should still be allowed
      const statusB = checkRateLimit(ipB);
      assert.equal(statusB.allowed, true);
      assert.equal(statusB.remaining, 9);
    });

    it('replenishes capacity after window expiration timestamp', () => {
      const testIp = '198.51.100.55';
      const baseTime = 1700000000000;

      // Exhaust tokens at base time
      for (let i = 0; i < 10; i++) {
        checkRateLimit(testIp, baseTime);
      }
      assert.equal(checkRateLimit(testIp, baseTime).allowed, false);

      // Fast-forward 10 minutes + 1 second
      const expiredTime = baseTime + 10 * 60 * 1000 + 1000;
      const renewedStatus = checkRateLimit(testIp, expiredTime);
      assert.equal(renewedStatus.allowed, true);
      assert.equal(renewedStatus.remaining, 9);
    });

    it('extracts leftmost untrusted IP from x-forwarded-for header', () => {
      const req = new Request('http://localhost:3000/api/sales-funnel/ingest', {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
        },
      });

      const extracted = extractClientIp(req);
      assert.equal(extracted, '203.0.113.195');
    });

    it('strips IPv4-mapped IPv6 prefix (::ffff:) cleanly', () => {
      const req = new Request('http://localhost:3000/api/sales-funnel/ingest', {
        headers: {
          'x-real-ip': '::ffff:192.0.2.1',
        },
      });

      const extracted = extractClientIp(req);
      assert.equal(extracted, '192.0.2.1');
    });
  });

  describe('Section 5: Zod Schema Ingestion Validation (ingestLeadSchema)', () => {
    it('accepts a fully compliant enterprise lead inquiry', () => {
      const payload = {
        name: 'Zayd Al-Hadi',
        email: 'ZAYD@EMAAR.AE',
        phone: '050 123 4567',
        company: 'Emaar Hospitality',
        company_website: 'https://emaar.com',
        industry: 'Luxury Hospitality',
        preferred_channel: 'WhatsApp',
        service_category: 'Web & Digital',
        budget_bracket: '$50,000+',
        notes: 'Interested in bespoke 3D WebGL web platform.',
      };

      const parsed = ingestLeadSchema.safeParse(payload);
      assert.equal(parsed.success, true);
      if (parsed.success) {
        assert.equal(parsed.data.name, 'Zayd Al-Hadi');
        assert.equal(parsed.data.email, 'zayd@emaar.ae');
        assert.equal(parsed.data.preferred_channel, 'WhatsApp');
      }
    });

    it('accepts payload with email only (satisfying contact constraint)', () => {
      const payload = {
        name: 'Anita Nair',
        email: 'anita@studio.design',
      };

      const parsed = ingestLeadSchema.safeParse(payload);
      assert.equal(parsed.success, true);
    });

    it('accepts payload with phone only (satisfying contact constraint)', () => {
      const payload = {
        name: 'Marcus Vance',
        phone: '+971509998877',
      };

      const parsed = ingestLeadSchema.safeParse(payload);
      assert.equal(parsed.success, true);
    });

    it('strictly rejects payload lacking both email and phone', () => {
      const payload = {
        name: 'Anonymous Visitor',
        company: 'Acme Corp',
      };

      const parsed = ingestLeadSchema.safeParse(payload);
      assert.equal(parsed.success, false);
    });

    it('strictly rejects negative expected_value figures', () => {
      const payload = {
        name: 'Test Client',
        email: 'client@test.com',
        expected_value: -5000,
      };

      const parsed = ingestLeadSchema.safeParse(payload);
      assert.equal(parsed.success, false);
    });
  });
});
