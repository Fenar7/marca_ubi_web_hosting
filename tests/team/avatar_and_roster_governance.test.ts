/**
 * @file avatar_and_roster_governance.test.ts
 * @description Comprehensive automated test suite for PrimeStay People Directory & Avatar Management:
 *              - Avatar Zod schema invariants (UUID validation, payload bounds, MIME types, 2MB size cap)
 *              - Magic byte inspection logic (JPEG, PNG, WebP binary signatures vs spoofed payloads)
 *              - Tab category counts and roster segmentation invariants (All, Leadership, Sales, Suspended)
 *              - Instant client-side fuzzy searching and filter composition
 * @module tests/team/avatar_and_roster_governance
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  targetUserIdSchema,
  updateAvatarPayloadSchema,
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_RAW_BYTES,
} from '../../src/app/lib/avatar-schemas';
import type { TeamMemberRosterItem, CrmUserRole } from '../../src/types/crm';

/**
 * Pure binary header verification mirroring avatarImageProcessor.ts
 */
function verifyMagicBytesBuffer(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return true;
  }

  // WebP: RIFF (bytes 0-3: 52 49 46 46) and WEBP (bytes 8-11: 57 45 42 50)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return true;
  }

  return false;
}

describe('Marca Ubi CRM — PrimeStay People & Avatar Governance Suite', () => {
  describe('Section 1: Avatar Schemas & Security Bounds', () => {
    it('enforces exact 2MB raw file boundary invariant', () => {
      assert.equal(MAX_AVATAR_RAW_BYTES, 2097152);
    });

    it('permits only secure image MIME types (JPEG, PNG, WebP)', () => {
      assert.deepEqual(ALLOWED_AVATAR_MIME_TYPES, [
        'image/jpeg',
        'image/png',
        'image/webp',
      ]);
    });

    it('accepts valid RFC4122 user UUIDs', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = targetUserIdSchema.safeParse(validUuid);
      assert.ok(result.success);
      assert.equal(result.data, validUuid);
    });

    it('rejects invalid or malformed user UUIDs', () => {
      const invalidUuids = ['not-a-uuid', '12345', '', '550e8400-e29b-41d4-a716'];
      for (const id of invalidUuids) {
        const result = targetUserIdSchema.safeParse(id);
        assert.ok(!result.success, `Expected UUID ${id} to fail validation`);
      }
    });

    it('validates updateAvatarPayloadSchema with legitimate CDN URLs', () => {
      const validPayload = {
        targetUserId: '550e8400-e29b-41d4-a716-446655440000',
        avatarUrl: 'https://test-project.supabase.co/storage/v1/object/public/avatars/user/avatar.webp',
      };
      const result = updateAvatarPayloadSchema.safeParse(validPayload);
      assert.ok(result.success);
    });

    it('rejects non-URL avatarUrl strings', () => {
      const invalidPayload = {
        targetUserId: '550e8400-e29b-41d4-a716-446655440000',
        avatarUrl: 'not-a-valid-url',
      };
      const result = updateAvatarPayloadSchema.safeParse(invalidPayload);
      assert.ok(!result.success);
    });
  });

  describe('Section 2: Magic Byte Binary Header Inspection', () => {
    it('authenticates valid JPEG magic numbers (FF D8 FF)', () => {
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      assert.equal(verifyMagicBytesBuffer(jpegBytes), true);
    });

    it('authenticates valid PNG magic numbers (89 50 4E 47)', () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      assert.equal(verifyMagicBytesBuffer(pngBytes), true);
    });

    it('authenticates valid WebP RIFF/WEBP magic numbers', () => {
      const webpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x24, 0x00, 0x00, 0x00, // Size
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      assert.equal(verifyMagicBytesBuffer(webpBytes), true);
    });

    it('rejects spoofed executable files with fake image extensions', () => {
      // Windows PE EXE: 4D 5A (MZ)
      const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);
      assert.equal(verifyMagicBytesBuffer(exeBytes), false);

      // Linux ELF binary: 7F 45 4C 46
      const elfBytes = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]);
      assert.equal(verifyMagicBytesBuffer(elfBytes), false);

      // Plain HTML text: <html...
      const htmlBytes = new Uint8Array([0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45, 0x20, 0x68, 0x74]);
      assert.equal(verifyMagicBytesBuffer(htmlBytes), false);
    });
  });

  describe('Section 3: Roster Segmentation & Category Telemetry', () => {
    const mockRoster: TeamMemberRosterItem[] = [
      {
        id: 'u1',
        full_name: 'Farhan Firoz',
        email: 'farhan@marcaubi.com',
        role: 'admin',
        job_title: 'Chief Technology Officer',
        phone: '+91 9876543210',
        status: 'active',
        avatar_url: 'https://cdn.example.com/farhan.webp',
        invited_by: null,
        last_login_at: '2026-10-23T10:00:00Z',
        must_change_password: false,
        created_at: '2026-10-15T00:00:00Z',
        updated_at: '2026-10-23T10:00:00Z',
        active_deals_count: 5,
        total_deal_value: 45000000,
      },
      {
        id: 'u2',
        full_name: 'Ayesha Khan',
        email: 'ayesha@marcaubi.com',
        role: 'sales_executive',
        job_title: 'Commercial Director (Mumbai)',
        phone: '+91 9876543211',
        status: 'active',
        avatar_url: null,
        invited_by: 'u1',
        last_login_at: '2026-10-23T09:00:00Z',
        must_change_password: false,
        created_at: '2026-10-16T00:00:00Z',
        updated_at: '2026-10-23T09:00:00Z',
        active_deals_count: 8,
        total_deal_value: 28000000,
      },
      {
        id: 'u3',
        full_name: 'Vikram Sethi',
        email: 'vikram@marcaubi.com',
        role: 'sales_executive',
        job_title: 'Commercial Executive (Bengaluru)',
        phone: null,
        status: 'suspended',
        avatar_url: null,
        invited_by: 'u1',
        last_login_at: '2026-10-18T00:00:00Z',
        must_change_password: false,
        created_at: '2026-10-17T00:00:00Z',
        updated_at: '2026-10-20T00:00:00Z',
        active_deals_count: 0,
        total_deal_value: 0,
      },
      {
        id: 'u4',
        full_name: 'Pooja Nair',
        email: 'pooja@marcaubi.com',
        role: 'viewer',
        job_title: 'Market Intelligence Analyst',
        phone: null,
        status: 'active',
        avatar_url: 'https://cdn.example.com/pooja.webp',
        invited_by: 'u1',
        last_login_at: '2026-10-22T14:00:00Z',
        must_change_password: false,
        created_at: '2026-10-18T00:00:00Z',
        updated_at: '2026-10-22T14:00:00Z',
        active_deals_count: 1,
        total_deal_value: 5000000,
      },
    ];

    it('correctly aggregates tab category counts', () => {
      const counts = {
        all: mockRoster.length,
        leadership: mockRoster.filter((m) => m.role === 'admin').length,
        sales: mockRoster.filter((m) => m.role === 'sales_executive').length,
        suspended: mockRoster.filter((m) => m.status === 'suspended').length,
      };

      assert.equal(counts.all, 4);
      assert.equal(counts.leadership, 1);
      assert.equal(counts.sales, 2);
      assert.equal(counts.suspended, 1);
    });

    it('filters roster by Leadership category tab', () => {
      const leadership = mockRoster.filter((m) => m.role === 'admin');
      assert.equal(leadership.length, 1);
      assert.equal(leadership[0].full_name, 'Farhan Firoz');
    });

    it('filters roster by Sales Executives category tab', () => {
      const sales = mockRoster.filter((m) => m.role === 'sales_executive');
      assert.equal(sales.length, 2);
      assert.ok(sales.some((s) => s.full_name === 'Ayesha Khan'));
      assert.ok(sales.some((s) => s.full_name === 'Vikram Sethi'));
    });

    it('filters roster by Suspended category tab', () => {
      const suspended = mockRoster.filter((m) => m.status === 'suspended');
      assert.equal(suspended.length, 1);
      assert.equal(suspended[0].full_name, 'Vikram Sethi');
    });

    it('performs case-insensitive fuzzy search across name, email, and job title', () => {
      const queryName = 'ayesha';
      const nameResults = mockRoster.filter((m) =>
        m.full_name.toLowerCase().includes(queryName) ||
        m.email.toLowerCase().includes(queryName) ||
        (m.job_title || '').toLowerCase().includes(queryName)
      );
      assert.equal(nameResults.length, 1);
      assert.equal(nameResults[0].id, 'u2');

      const queryTitle = 'mumbai';
      const titleResults = mockRoster.filter((m) =>
        (m.job_title || '').toLowerCase().includes(queryTitle)
      );
      assert.equal(titleResults.length, 1);
      assert.equal(titleResults[0].id, 'u2');
    });
  });
});
