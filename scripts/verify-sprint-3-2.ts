/**
 * @file verify-sprint-3-2.ts
 * @description Comprehensive automated verification engine for Sprint 3.2:
 *              Team Management Workspace (/admin/team), Temporary Credential Security & Audit Logging.
 *              Deploys live migration 20261015000006_password_reset_governance.sql, validates check constraints
 *              on public.team_audit_logs, executes cryptographic entropy assertions, tests Zod password
 *              rotation schemas, validates dirty state detection, and asserts currency formatting stability.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import {
  generateHighEntropyPassword,
  formatDealValuation,
  getInitials,
  isDrawerDirty,
} from '../src/app/lib/team-utils';
import { ResetPasswordSchema } from '../src/app/lib/team-schemas';

dotenv.config({ path: '.env.local' });

async function runSprint32Verification(): Promise<void> {
  console.log('Marca Ubi CRM — Sprint 3.2 Automated Verification Engine');
  console.log('Validating Team Management Workspace, Temporary Credential Security & Audit Logging...\n');

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
    // Test Suite 1: Migration deployment and audit log constraint upgrade
    console.log('\n[TEST 1] Deploying and validating migration: 20261015000006_password_reset_governance.sql...');
    const migrationPath = path.resolve('supabase/migrations/20261015000006_password_reset_governance.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSql);
    console.log('  Migration 20261015000006 deployed successfully.');

    // Verify check constraint on public.team_audit_logs
    const constraintRes = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'team_audit_logs' AND c.conname = 'chk_team_audit_actions';
    `);

    assert(constraintRes.rows.length > 0, 'Check constraint chk_team_audit_actions confirmed in database');
    const definition = constraintRes.rows[0].definition;
    assert(definition.includes('password_reset_completed'), 'chk_team_audit_actions includes password_reset_completed');

    // Test inserting an audit record with password_reset_completed
    const testAdmin = await client.query(`SELECT id, email FROM public.profiles WHERE role = 'admin' LIMIT 1;`);
    if (testAdmin.rows.length > 0) {
      const adminId = testAdmin.rows[0].id;
      const adminEmail = testAdmin.rows[0].email;

      const insertRes = await client.query(`
        INSERT INTO public.team_audit_logs (actor_id, action, target_user_email, details)
        VALUES ($1, 'password_reset_completed', $2, '{"reason": "verification_test"}'::jsonb)
        RETURNING id;
      `, [adminId, adminEmail]);

      assert(insertRes.rows.length > 0, 'Successfully inserted team_audit_logs record with action password_reset_completed');

      // Clean up verification probe log
      await client.query(`DELETE FROM public.team_audit_logs WHERE id = $1;`, [insertRes.rows[0].id]);
    }

    // Test Suite 2: Cryptographic High-Entropy Password Generator
    console.log('\n[TEST 2] Testing 16-character high-entropy temporary password generation...');
    const samplePass = generateHighEntropyPassword();
    assert(samplePass.length === 16, 'Generated temporary passphrase is exact 16 characters in length');
    assert(/[A-Z]/.test(samplePass), 'Passphrase contains uppercase character');
    assert(/[a-z]/.test(samplePass), 'Passphrase contains lowercase character');
    assert(/[0-9]/.test(samplePass), 'Passphrase contains numeric digit');
    assert(/[^A-Za-z0-9]/.test(samplePass), 'Passphrase contains special character');

    // Collision assertion over 100 iterations
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) {
      set.add(generateHighEntropyPassword());
    }
    assert(set.size === 100, 'Zero collisions across 100 consecutive passphrase generations');

    // Test Suite 3: Zod Schema Validation for First-Login Password Reset
    console.log('\n[TEST 3] Testing ResetPasswordSchema validation rules...');
    const validPayload = ResetPasswordSchema.safeParse({
      newPassword: 'Enterprise#Secure2026!',
      confirmPassword: 'Enterprise#Secure2026!',
    });
    assert(validPayload.success, 'Valid permanent password payload passes schema validation');

    const shortPayload = ResetPasswordSchema.safeParse({
      newPassword: 'Short123!Aa',
      confirmPassword: 'Short123!Aa',
    });
    assert(!shortPayload.success, 'Rejects password shorter than 12 characters');

    const noUpper = ResetPasswordSchema.safeParse({
      newPassword: 'enterprise#secure2026!',
      confirmPassword: 'enterprise#secure2026!',
    });
    assert(!noUpper.success, 'Rejects password missing uppercase letter');

    const noLower = ResetPasswordSchema.safeParse({
      newPassword: 'ENTERPRISE#SECURE2026!',
      confirmPassword: 'ENTERPRISE#SECURE2026!',
    });
    assert(!noLower.success, 'Rejects password missing lowercase letter');

    const noDigit = ResetPasswordSchema.safeParse({
      newPassword: 'Enterprise#SecurePass!',
      confirmPassword: 'Enterprise#SecurePass!',
    });
    assert(!noDigit.success, 'Rejects password missing numeric digit');

    const noSymbol = ResetPasswordSchema.safeParse({
      newPassword: 'EnterpriseSecure2026',
      confirmPassword: 'EnterpriseSecure2026',
    });
    assert(!noSymbol.success, 'Rejects password missing special symbol');

    const mismatch = ResetPasswordSchema.safeParse({
      newPassword: 'Enterprise#Secure2026!',
      confirmPassword: 'Different#Secure2026!',
    });
    assert(!mismatch.success, 'Rejects mismatched confirm password');

    // Test Suite 4: Form Dirty State Evaluation & Accidental Dismissal Protection
    console.log('\n[TEST 4] Testing Add Team Member drawer dirty state detection...');
    assert(!isDrawerDirty('', '', '', '', 'sales_executive'), 'Untouched initial drawer form is not dirty');
    assert(isDrawerDirty('Anita Nair', '', '', '', 'sales_executive'), 'Form with name input is marked dirty');
    assert(isDrawerDirty('', 'anita@marcaubi.com', '', '', 'sales_executive'), 'Form with email input is marked dirty');
    assert(isDrawerDirty('', '', 'Consultant', '', 'sales_executive'), 'Form with title input is marked dirty');
    assert(isDrawerDirty('', '', '', '+971 50', 'sales_executive'), 'Form with phone input is marked dirty');
    assert(isDrawerDirty('', '', '', '', 'admin'), 'Form with modified role is marked dirty');

    // Test Suite 5: Portfolio Valuation & Tabular Numeral Formatting
    console.log('\n[TEST 5] Testing currency valuation and monogram formatting utilities...');
    assert(formatDealValuation(0) === '₹0', 'Zero deal valuation formats as ₹0');
    assert(formatDealValuation(48500) === '₹48,500', 'Thousands valuation formats with commas');
    assert(formatDealValuation(3850000) === '₹38.5L', 'Lakhs valuation formats with L suffix');
    assert(formatDealValuation(12000000) === '₹1.2Cr', 'Crores valuation formats with Cr suffix');

    assert(getInitials('Anita Nair') === 'AN', 'Initials for two-word name format as AN');
    assert(getInitials('Zayd Al-Hadi') === 'ZA', 'Initials for compound name format as ZA');
    assert(getInitials('Fenar') === 'FE', 'Initials for single word name format as FE');
    assert(getInitials('') === 'MU', 'Empty name defaults to agency monogram MU');

    console.log(`\n============================================================`);
    console.log(`ALL SPRINT 3.2 VERIFICATION CHECKS PASSED: ${passedAssertions}/${totalAssertions} (100%)`);
    console.log(`============================================================\n`);
  } finally {
    await client.end();
  }
}

runSprint32Verification().catch((err) => {
  console.error('\n[FATAL] Sprint 3.2 verification failed:', err);
  process.exit(1);
});
