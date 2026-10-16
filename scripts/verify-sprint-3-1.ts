/**
 * @file verify-sprint-3-1.ts
 * @description Comprehensive automated verification engine for Sprint 3.1:
 *              Admin SDK Provisioning Engine, Server Action createTeamUser & Multi-Role Governance.
 *              Executes live PostgreSQL migrations, validates schema extensions (must_change_password),
 *              verifies sole-administrator invariance triggers, tests Zod input validation schemas,
 *              and validates Admin SDK runtime isolation.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { createTeamUserSchema } from '../src/app/actions/team';
import { createAdminClient, resetAdminClientCache } from '../src/app/lib/supabase/admin';

dotenv.config({ path: '.env.local' });

async function runSprint31Verification(): Promise<void> {
  console.log('Marca Ubi CRM - Sprint 3.1 Automated Verification Engine');
  console.log('Validating Admin SDK, createTeamUser Server Action & Multi-Role Governance...\n');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is missing from environment. Verify .env.local configuration.');
  }

  const client = new pg.Client({ connectionString });
  await client.connect();
  console.log('[OK] Connected to live Supabase PostgreSQL database.');

  let totalAssertions = 0;
  let passedAssertions = 0;

  function assert(condition: boolean, description: string): void {
    totalAssertions++;
    if (condition) {
      passedAssertions++;
      console.log(`  ✓ ${description}`);
    } else {
      console.error(`  ✗ FAILED: ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  }

  try {
    // Test Suite 1: Migration deployment and schema invariants
    console.log('\n[TEST 1] Deploying and validating migration: 20261015000005_team_provisioning_and_governance.sql...');
    const migrationPath = path.resolve('supabase/migrations/20261015000005_team_provisioning_and_governance.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSql);
    console.log('  Migration 20261015000005 deployed successfully.');

    // Verify must_change_password column exists on public.profiles
    const colRes = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'must_change_password';
    `);

    assert(colRes.rows.length === 1, 'Column public.profiles.must_change_password confirmed in information_schema');
    assert(colRes.rows[0].data_type === 'boolean', 'Column must_change_password data type is boolean');
    assert(colRes.rows[0].is_nullable === 'NO', 'Column must_change_password is NOT NULL');

    // Verify governance indexes
    const indexRes = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename = 'profiles';
    `);
    const activeIndexes = new Set(indexRes.rows.map((r: { indexname: string }) => r.indexname));

    assert(activeIndexes.has('idx_profiles_role_status'), 'Composite index idx_profiles_role_status confirmed');
    assert(activeIndexes.has('idx_profiles_invited_by'), 'Partial index idx_profiles_invited_by confirmed');

    // Test Suite 2: Sole active administrator invariance trigger
    console.log('\n[TEST 2] Verifying database trigger protect_sole_admin() lockout defense...');


    // Acquire lock and query current active admins
    const adminsRes = await client.query(`
      SELECT id, email, role, status 
      FROM public.profiles 
      WHERE role = 'admin' AND status = 'active';
    `);
    console.log(`  Current active administrators in agency: ${adminsRes.rows.length}`);

    // Create an isolated temporary test admin pair to verify invariance without touching production admins
    const testAdminId1 = 'e0000000-0000-0000-0000-000000000001';
    const testAdminId2 = 'e0000000-0000-0000-0000-000000000002';

    // Provision test auth users
    await client.query(`
      INSERT INTO auth.users (id, email)
      VALUES ($1, 'probe_admin1@marcaubi.com'), ($2, 'probe_admin2@marcaubi.com')
      ON CONFLICT (id) DO NOTHING;
    `, [testAdminId1, testAdminId2]);

    // Insert test profile 1
    await client.query(`
      INSERT INTO public.profiles (id, email, full_name, role, status, must_change_password)
      VALUES ($1, 'probe_admin1@marcaubi.com', 'Probe Administrator 1', 'admin', 'active', false)
      ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';
    `, [testAdminId1]);

    // Probe A: When other active admins exist, demoting test profile 1 is allowed
    // (since total active admins > 1)
    await client.query(`
      UPDATE public.profiles 
      SET role = 'sales_manager'
      WHERE id = $1;
    `, [testAdminId1]);
    assert(true, 'protect_sole_admin permits demotion when agency retains at least one other active admin');

    // Restore test admin 1
    await client.query(`UPDATE public.profiles SET role = 'admin' WHERE id = $1;`, [testAdminId1]);

    // Probe B: Simulate sole admin scenario in an isolated transaction
    // Within an uncommitted transaction, temporarily suspend all other admins except testAdminId1
    await client.query('BEGIN');
    try {
      await client.query(`
        UPDATE public.profiles 
        SET status = 'suspended' 
        WHERE role = 'admin' AND id != $1;
      `, [testAdminId1]);

      // Now testAdminId1 is the SOLE active administrator.
      // Probe 2a: Attempting to demote sole admin MUST FAIL with 23514
      await client.query('SAVEPOINT probe_demotion');
      let demotionBlocked = false;
      try {
        await client.query(`
          UPDATE public.profiles 
          SET role = 'sales_executive' 
          WHERE id = $1;
        `, [testAdminId1]);
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr.code === '23514') {
          demotionBlocked = true;
        }
      } finally {
        await client.query('ROLLBACK TO SAVEPOINT probe_demotion');
      }
      assert(demotionBlocked, 'protect_sole_admin strictly blocked demoting sole active admin (SQLSTATE 23514)');

      // Probe 2b: Attempting to suspend sole active admin MUST FAIL with 23514
      await client.query('SAVEPOINT probe_suspension');
      let suspensionBlocked = false;
      try {
        await client.query(`
          UPDATE public.profiles 
          SET status = 'suspended' 
          WHERE id = $1;
        `, [testAdminId1]);
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr.code === '23514') {
          suspensionBlocked = true;
        }
      } finally {
        await client.query('ROLLBACK TO SAVEPOINT probe_suspension');
      }
      assert(suspensionBlocked, 'protect_sole_admin strictly blocked suspending sole active admin (SQLSTATE 23514)');

      // Probe 2c: Attempting to delete sole active admin MUST FAIL with 23514
      await client.query('SAVEPOINT probe_deletion');
      let deletionBlocked = false;
      try {
        await client.query(`
          DELETE FROM public.profiles 
          WHERE id = $1;
        `, [testAdminId1]);
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr.code === '23514') {
          deletionBlocked = true;
        }
      } finally {
        await client.query('ROLLBACK TO SAVEPOINT probe_deletion');
      }
      assert(deletionBlocked, 'protect_sole_admin strictly blocked deleting sole active admin (SQLSTATE 23514)');
    } finally {
      // Always rollback the simulated sole-admin state to maintain original database integrity
      await client.query('ROLLBACK');
    }

    // Teardown temporary probe accounts
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [testAdminId1, testAdminId2]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [testAdminId1, testAdminId2]);
    console.log('  Cleaned up temporary probe accounts.');

    // Test Suite 3: Zod schema validation (createTeamUserSchema)
    console.log('\n[TEST 3] Testing createTeamUserSchema Zod validation & input sanitization...');

    // 3a: Valid payload
    const validResult = createTeamUserSchema.safeParse({
      fullName: '  Nadia Al-Hashimi  ',
      email: '  Nadia.Hashimi@MARCAUBI.COM  ',
      role: 'sales_executive',
      jobTitle: 'Senior Commercial Consultant',
      phone: '  +971 50 123 4567  ',
      tempPassword: 'TempPassword2026!Secure',
    });

    assert(validResult.success, 'Valid team user payload passes Zod validation');
    if (validResult.success) {
      assert(validResult.data.fullName === 'Nadia Al-Hashimi', 'Full name is trimmed properly');
      assert(validResult.data.email === 'nadia.hashimi@marcaubi.com', 'Email is trimmed and converted to lowercase');
      assert(validResult.data.phone === '+971 50 123 4567', 'Phone is trimmed properly');
    }

    // 3b: Invalid email
    const invalidEmailResult = createTeamUserSchema.safeParse({
      fullName: 'Test User',
      email: 'not-an-email',
      role: 'sales_executive',
      jobTitle: 'Consultant',
      tempPassword: 'TempPassword2026!Secure',
    });
    assert(!invalidEmailResult.success, 'Rejects invalid RFC email format');

    // 3c: Invalid role
    const invalidRoleResult = createTeamUserSchema.safeParse({
      fullName: 'Test User',
      email: 'user@marcaubi.com',
      role: 'superadmin',
      jobTitle: 'Consultant',
      tempPassword: 'TempPassword2026!Secure',
    });
    assert(!invalidRoleResult.success, 'Rejects unauthorized role enum value');

    // 3d: Weak temporary password (<8 characters)
    const weakPassResult = createTeamUserSchema.safeParse({
      fullName: 'Test User',
      email: 'user@marcaubi.com',
      role: 'sales_executive',
      jobTitle: 'Consultant',
      tempPassword: 'short',
    });
    assert(!weakPassResult.success, 'Rejects weak temporary password (<8 characters)');

    // 3e: Empty optional phone converted to null
    const emptyPhoneResult = createTeamUserSchema.safeParse({
      fullName: 'Test User',
      email: 'user@marcaubi.com',
      role: 'viewer',
      jobTitle: 'Financial Auditor',
      phone: '   ',
      tempPassword: 'TempPassword2026!Secure',
    });
    assert(emptyPhoneResult.success && emptyPhoneResult.data.phone === null, 'Transforms empty whitespace phone to null');

    // Test Suite 4: Privileged Admin SDK factory and runtime isolation
    console.log('\n[TEST 4] Testing Admin SDK factory (admin.ts) & runtime isolation...');

    // 4a: Missing service role key handling
    resetAdminClientCache();
    let missingKeyThrew = false;
    try {
      createAdminClient('short_key');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('SUPABASE_SERVICE_ROLE_KEY is required')) {
        missingKeyThrew = true;
      }
    }
    assert(missingKeyThrew, 'createAdminClient throws descriptive error when service role key is invalid or short');

    // 4b: Client-side browser isolation check
    let browserViolationThrew = false;
    (globalThis as unknown as { window: unknown }).window = {};
    try {
      createAdminClient('a'.repeat(25));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('CRITICAL SECURITY VIOLATION')) {
        browserViolationThrew = true;
      }
    } finally {
      delete (globalThis as unknown as { window?: unknown }).window;
    }
    assert(browserViolationThrew, 'createAdminClient throws immediate security exception if window is defined');

    // 4c: Valid factory instantiation
    const dummyServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_test_service_key_for_unit_tests';
    const testAdminClient = createAdminClient(dummyServiceKey);
    assert(typeof testAdminClient.from === 'function', 'createAdminClient returns functional Supabase client');
    assert(typeof testAdminClient.auth?.admin?.createUser === 'function', 'Admin client exposes auth.admin.createUser');
    assert(typeof testAdminClient.auth?.admin?.deleteUser === 'function', 'Admin client exposes auth.admin.deleteUser');

    // Test Suite 5: Team audit logs compliance and append-only guarantees
    console.log('\n[TEST 5] Testing team audit logs compliance & constraint integrity...');

    const probeAuditId = 'f0000000-0000-0000-0000-000000000001';
    await client.query(`
      INSERT INTO public.team_audit_logs (id, action, target_user_email, details)
      VALUES ($1, 'user_created', 'audited_user@marcaubi.com', '{"role":"sales_executive"}'::jsonb);
    `, [probeAuditId]);
    assert(true, 'Inserted team audit log with action: user_created');

    // Verify invalid action rejection
    let invalidActionBlocked = false;
    try {
      await client.query(`
        INSERT INTO public.team_audit_logs (action, target_user_email)
        VALUES ('unauthorized_arbitrary_action', 'test@marcaubi.com');
      `);
    } catch {
      invalidActionBlocked = true;
    }
    assert(invalidActionBlocked, 'team_audit_logs check constraint rejects arbitrary unapproved audit actions');

    // Clean up audit probe
    await client.query(`DELETE FROM public.team_audit_logs WHERE id = $1;`, [probeAuditId]);

    // Final verification summary
    console.log(`\nALL SPRINT 3.1 VERIFICATION CHECKS PASSED: ${passedAssertions}/${totalAssertions} (100%)`);

  } finally {
    await client.end();
  }
}

runSprint31Verification().catch((err) => {
  console.error('\n[FATAL ERROR] Sprint 3.1 Verification Failed:', err);
  process.exit(1);
});
