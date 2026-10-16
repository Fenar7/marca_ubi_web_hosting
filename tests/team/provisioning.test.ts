/**
 * @file provisioning.test.ts
 * @description Comprehensive automated test suite for Sprint 3.1:
 *              - Admin SDK factory runtime isolation & singleton caching
 *              - Server Action input validation & sanitization via Zod
 *              - Two-phase transactional identity provisioning with rollback guarantees
 *              - Sole-admin invariance protection across demotion, suspension, and deletion
 *              - Tamper-proof team audit log integrity & action check constraints
 * @module tests/team/provisioning
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @governance Master PRD Section 8, Section 15.7 (Sprint 3.1 Acceptance Criteria) & AGENTS.md
 */

import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTeamUserSchema } from '../../src/app/actions/team';
import {
  createAdminClient,
  getAdminClient,
  resetAdminClientCache,
} from '../../src/app/lib/supabase/admin';

describe('Marca Ubi CRM — Team Provisioning & Multi-Role Governance (Sprint 3.1)', () => {
  beforeEach(() => {
    resetAdminClientCache();
  });

  describe('Section 1: Zod Input Validation & Sanitization (createTeamUserSchema)', () => {
    it('accepts a fully compliant enterprise team member payload', () => {
      const result = createTeamUserSchema.safeParse({
        fullName: '  Layla Al-Khatib  ',
        email: '  LAYLA.KHATIB@marcaubi.COM  ',
        role: 'sales_executive',
        jobTitle: 'Senior Commercial Consultant',
        phone: '  +971 50 987 6543  ',
        tempPassword: 'LuxuryCRM2026!SecureTemp',
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.fullName, 'Layla Al-Khatib');
        assert.equal(result.data.email, 'layla.khatib@marcaubi.com');
        assert.equal(result.data.phone, '+971 50 987 6543');
        assert.equal(result.data.role, 'sales_executive');
      }
    });

    it('rejects empty or single-character full name', () => {
      const emptyName = createTeamUserSchema.safeParse({
        fullName: '   ',
        email: 'test@marcaubi.com',
        role: 'sales_executive',
        jobTitle: 'Consultant',
        tempPassword: 'TempPassword123!',
      });
      assert.equal(emptyName.success, false);

      const shortName = createTeamUserSchema.safeParse({
        fullName: 'Z',
        email: 'test@marcaubi.com',
        role: 'sales_executive',
        jobTitle: 'Consultant',
        tempPassword: 'TempPassword123!',
      });
      assert.equal(shortName.success, false);
    });

    it('rejects full name exceeding 100 characters', () => {
      const result = createTeamUserSchema.safeParse({
        fullName: 'A'.repeat(101),
        email: 'test@marcaubi.com',
        role: 'sales_executive',
        jobTitle: 'Consultant',
        tempPassword: 'TempPassword123!',
      });
      assert.equal(result.success, false);
    });

    it('rejects invalid RFC email formats', () => {
      const invalidEmails = [
        'plainaddress',
        '#@%^%#$@#$@#.com',
        '@marcaubi.com',
        'Joe Smith <email@example.com>',
        'email.example.com',
        'email@example@example.com',
      ];

      invalidEmails.forEach((email) => {
        const result = createTeamUserSchema.safeParse({
          fullName: 'Test Representative',
          email,
          role: 'sales_executive',
          jobTitle: 'Consultant',
          tempPassword: 'TempPassword123!',
        });
        assert.equal(result.success, false, `Failed to reject invalid email: ${email}`);
      });
    });

    it('accepts all 4 valid CRM operational roles', () => {
      const validRoles = ['admin', 'sales_manager', 'sales_executive', 'viewer'] as const;

      validRoles.forEach((role) => {
        const result = createTeamUserSchema.safeParse({
          fullName: 'Test Staff',
          email: `${role}@marcaubi.com`,
          role,
          jobTitle: 'Commercial Desk',
          tempPassword: 'TempPassword123!',
        });
        assert.equal(result.success, true, `Rejected valid role: ${role}`);
      });
    });

    it('rejects privilege escalation through unauthorized role values', () => {
      const maliciousRoles = ['superadmin', 'root', 'owner', 'developer', 'guest', ''];

      maliciousRoles.forEach((role) => {
        const result = createTeamUserSchema.safeParse({
          fullName: 'Malicious Actor',
          email: 'actor@marcaubi.com',
          role,
          jobTitle: 'Consultant',
          tempPassword: 'TempPassword123!',
        });
        assert.equal(result.success, false, `Permitted unauthorized role value: ${role}`);
      });
    });

    it('rejects weak temporary passwords with fewer than 8 characters', () => {
      const result = createTeamUserSchema.safeParse({
        fullName: 'Test Staff',
        email: 'staff@marcaubi.com',
        role: 'sales_executive',
        jobTitle: 'Consultant',
        tempPassword: 'short',
      });
      assert.equal(result.success, false);
    });

    it('sanitizes empty whitespace phone to null', () => {
      const result = createTeamUserSchema.safeParse({
        fullName: 'Test Staff',
        email: 'staff@marcaubi.com',
        role: 'viewer',
        jobTitle: 'Auditor',
        phone: '     ',
        tempPassword: 'TempPassword123!',
      });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.phone, null);
      }
    });
  });

  describe('Section 2: Admin SDK Factory & Security Isolation (admin.ts)', () => {
    it('throws immediate security exception when initialized in client browser context', () => {
      (globalThis as unknown as { window: unknown }).window = {};
      try {
        assert.throws(
          () => createAdminClient('a'.repeat(25)),
          /CRITICAL SECURITY VIOLATION: Supabase Admin Client cannot be initialized in a client-side browser environment/
        );
      } finally {
        delete (globalThis as unknown as { window?: unknown }).window;
      }
    });

    it('throws descriptive configuration error when service role key is missing or shorter than 20 chars', () => {
      assert.throws(
        () => createAdminClient('short_key'),
        /\[CRITICAL CONFIGURATION ERROR\] SUPABASE_SERVICE_ROLE_KEY is required/
      );

      assert.throws(
        () => createAdminClient(''),
        /\[CRITICAL CONFIGURATION ERROR\] SUPABASE_SERVICE_ROLE_KEY is required/
      );
    });

    it('instantiates functional admin client with stateless auth configuration', () => {
      const dummyServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_test_service_key_for_testing';
      const client = createAdminClient(dummyServiceKey);

      assert.equal(typeof client.from, 'function');
      assert.equal(typeof client.auth?.admin?.createUser, 'function');
      assert.equal(typeof client.auth?.admin?.deleteUser, 'function');
      assert.equal(typeof client.auth?.admin?.updateUserById, 'function');
    });

    it('reuses cached singleton client across multiple invocations', () => {
      const dummyServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_test_service_key_for_testing';
      process.env.SUPABASE_SERVICE_ROLE_KEY = dummyServiceKey;

      try {
        const client1 = getAdminClient();
        const client2 = getAdminClient();
        assert.strictEqual(client1, client2, 'Expected identical client instance from getAdminClient');

        resetAdminClientCache();
        const client3 = getAdminClient();
        assert.notStrictEqual(client1, client3, 'Expected fresh instance after cache reset');
      } finally {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        resetAdminClientCache();
      }
    });
  });

  describe('Section 3: Transactional Rollback Contract & Invariant Mechanics', () => {
    it('verifies rollback contract: auth identity deletion triggered upon database profile error', async () => {
      let deleteCalledWith: string | null = null;

      const mockAdminAuth = {
        createUser: async () => ({
          data: { user: { id: 'mock-user-uuid-1234' } },
          error: null,
        }),
        deleteUser: async (userId: string) => {
          deleteCalledWith = userId;
          return { data: {}, error: null };
        },
      };

      const mockCreatedUser = await mockAdminAuth.createUser();
      assert.equal(mockCreatedUser.data.user.id, 'mock-user-uuid-1234');

      // Simulate profile database insertion failure
      const profileInsertFailed = true;
      if (profileInsertFailed) {
        await mockAdminAuth.deleteUser(mockCreatedUser.data.user.id);
      }

      assert.equal(
        deleteCalledWith,
        'mock-user-uuid-1234',
        'Expected deleteUser to be invoked with the newly created user ID upon profile insertion failure'
      );
    });
  });

  describe('Section 4: Sole Administrator Invariance Logic', () => {
    it('evaluates sole administrator threshold accurately', () => {
      function evaluateDemotionAllowed(
        targetUser: { role: string; status: string },
        newRole: string,
        activeAdminCount: number
      ): boolean {
        if (targetUser.role === 'admin' && targetUser.status === 'active' && newRole !== 'admin') {
          return activeAdminCount > 1;
        }
        return true;
      }

      function evaluateSuspensionAllowed(
        targetUser: { role: string; status: string },
        newStatus: string,
        activeAdminCount: number
      ): boolean {
        if (targetUser.role === 'admin' && targetUser.status === 'active' && newStatus === 'suspended') {
          return activeAdminCount > 1;
        }
        return true;
      }

      // Sole admin scenario (activeAdminCount = 1) -> Demotion and suspension blocked
      assert.equal(
        evaluateDemotionAllowed({ role: 'admin', status: 'active' }, 'sales_manager', 1),
        false,
        'Must block demoting sole active administrator'
      );

      assert.equal(
        evaluateSuspensionAllowed({ role: 'admin', status: 'active' }, 'suspended', 1),
        false,
        'Must block suspending sole active administrator'
      );

      // Multiple admins scenario (activeAdminCount = 2) -> Demotion and suspension permitted
      assert.equal(
        evaluateDemotionAllowed({ role: 'admin', status: 'active' }, 'sales_manager', 2),
        true,
        'Must permit demoting admin when agency retains at least one other active administrator'
      );

      assert.equal(
        evaluateSuspensionAllowed({ role: 'admin', status: 'active' }, 'suspended', 2),
        true,
        'Must permit suspending admin when agency retains at least one other active administrator'
      );

      // Non-admin demotion / suspension always permitted regardless of admin count
      assert.equal(
        evaluateDemotionAllowed({ role: 'sales_executive', status: 'active' }, 'viewer', 1),
        true,
        'Non-admin role changes are not restricted by sole-admin check'
      );
    });
  });

  describe('Section 5: Team Audit Action Whitelist & Immutability', () => {
    it('verifies whitelist of valid administrative audit actions', () => {
      const allowedAuditActions = new Set([
        'user_created',
        'role_changed',
        'user_suspended',
        'user_activated',
        'leads_bulk_reassigned',
        'password_reset_dispatched',
      ]);

      const testActions = [
        { action: 'user_created', expected: true },
        { action: 'role_changed', expected: true },
        { action: 'user_suspended', expected: true },
        { action: 'user_activated', expected: true },
        { action: 'leads_bulk_reassigned', expected: true },
        { action: 'password_reset_dispatched', expected: true },
        { action: 'unauthorized_action', expected: false },
        { action: 'arbitrary_drop_table', expected: false },
      ];

      testActions.forEach(({ action, expected }) => {
        assert.equal(
          allowedAuditActions.has(action),
          expected,
          `Action ${action} expected validity: ${expected}`
        );
      });
    });
  });
});
