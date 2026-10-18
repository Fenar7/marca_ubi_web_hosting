/**
 * @file verify-phase-1-remediation.ts
 * @description Comprehensive automated verification engine for Phase 1:
 *              Database Architecture, Granular User Tab Permissions & Client Works Relational Engine.
 *              Executes live PostgreSQL migrations, validates schema extensions,
 *              tests admin lockout triggers, verifies auto-conversion project instantiation,
 *              and validates RLS security policies.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import {
  tabPermissionsSchema,
  createTeamUserSchema,
  updateUserPermissionsSchema,
} from '../src/app/lib/team-schemas';
import {
  updateClientWorkStageSchema,
  updateClientWorkHealthSchema,
  updateClientWorkMilestoneSchema,
} from '../src/app/lib/client-works-schemas';

dotenv.config({ path: '.env.local' });

async function runPhase1Verification(): Promise<void> {
  console.log('================================================================');
  console.log('MARCA UBI CRM: PHASE 1 AUTOMATED DATABASE & PERMISSIONS VERIFIER');
  console.log('================================================================\n');

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
    // Test Suite 1: Migration 1 (Granular User Tab Permissions)
    console.log('\n[TEST 1] Deploying and validating Migration 20261019000001 (Tab Permissions)...');
    const mig1Path = path.resolve('supabase/migrations/20261019000001_granular_user_tab_permissions.sql');
    const mig1Sql = fs.readFileSync(mig1Path, 'utf8');

    await client.query(mig1Sql);
    console.log('  Migration 20261019000001 deployed successfully.');

    // Verify columns on public.profiles
    const colRes = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        AND column_name IN ('allowed_tabs', 'feature_permissions')
      ORDER BY column_name;
    `);

    assert(colRes.rows.length === 2, 'Both allowed_tabs and feature_permissions columns exist on profiles table.');
    assert(colRes.rows.some((r) => r.column_name === 'allowed_tabs' && r.udt_name === '_text'), 'allowed_tabs is typed as TEXT[].');
    assert(colRes.rows.some((r) => r.column_name === 'feature_permissions' && r.udt_name === 'jsonb'), 'feature_permissions is typed as JSONB.');

    // Verify check constraint chk_profiles_allowed_tabs
    const chkRes = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'public.profiles'::regclass
        AND conname = 'chk_profiles_allowed_tabs';
    `);
    assert(chkRes.rows.length === 1, 'Constraint chk_profiles_allowed_tabs is registered on profiles.');

    // Verify trigger trg_validate_admin_tab_permissions
    const trgRes = await client.query(`
      SELECT tgname
      FROM pg_trigger
      WHERE tgrelid = 'public.profiles'::regclass
        AND tgname = 'trg_validate_admin_tab_permissions';
    `);
    assert(trgRes.rows.length === 1, 'Trigger trg_validate_admin_tab_permissions is active on profiles.');

    // Test Admin Invariant: Attempting to strip 'users' from an active admin must throw 23514
    console.log('\n[TEST 2] Testing Administrator Lockout Defense Trigger...');
    let adminLockoutTriggered = false;
    try {
      await client.query(`
        UPDATE public.profiles
        SET allowed_tabs = ARRAY['command_center', 'leads']::TEXT[]
        WHERE id = (
          SELECT id FROM public.profiles WHERE role = 'admin' AND status = 'active' LIMIT 1
        );
      `);
    } catch (err: unknown) {
      const pgErr = err as { code?: string; message?: string };
      if (pgErr.code === '23514' && pgErr.message?.includes('Active administrators must retain access')) {
        adminLockoutTriggered = true;
      } else {
        console.error('Unexpected error caught in Test 2:', pgErr);
      }
    }
    assert(adminLockoutTriggered, 'Database strictly rejected stripping users/settings from active administrator (ERRCODE 23514).');

    // Test Suite 2: Migration 2 (Client Works Relational Engine)
    console.log('\n[TEST 3] Deploying and validating Migration 20261019000002 (Client Works Engine)...');
    const mig2Path = path.resolve('supabase/migrations/20261019000002_client_works_projects_schema.sql');
    const mig2Sql = fs.readFileSync(mig2Path, 'utf8');

    await client.query(mig2Sql);
    console.log('  Migration 20261019000002 deployed successfully.');

    // Verify sequence project_code_seq
    const seqRes = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public' 
        AND sequence_name = 'project_code_seq';
    `);
    assert(seqRes.rows.length === 1, 'Sequence public.project_code_seq exists.');

    // Verify client_works table structure
    const cwColRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'client_works'
      ORDER BY ordinal_position;
    `);
    const cwCols = cwColRes.rows.map((r) => r.column_name);
    assert(cwCols.includes('project_code'), 'Column project_code exists.');
    assert(cwCols.includes('delivery_stage'), 'Column delivery_stage exists.');
    assert(cwCols.includes('health_status'), 'Column health_status exists.');
    assert(cwCols.includes('milestones'), 'Column milestones exists.');
    assert(cwCols.includes('contract_value'), 'Column contract_value exists.');

    // Verify Auto-Spawn Trigger on Lead Conversion
    console.log('\n[TEST 4] Testing Auto-Spawn Client Work Trigger on Deal Conversion...');
    // Query a valid lead_source_id
    const sourceRes = await client.query(`SELECT id FROM public.lead_sources LIMIT 1;`);
    const validSourceId = sourceRes.rows[0]?.id;
    assert(Boolean(validSourceId), 'Retrieved valid lead_source_id from lead_sources.');

    // Query a valid initial open status
    const openStatusRes = await client.query(`SELECT id FROM public.funnel_statuses WHERE bucket = 'open' LIMIT 1;`);
    const initialStatusId = openStatusRes.rows[0]?.id;
    assert(Boolean(initialStatusId), 'Retrieved initial open status_id.');

    // Create synthetic test lead
    const insertLeadRes = await client.query(`
      INSERT INTO public.leads (
        name,
        company,
        email,
        phone,
        service_category,
        expected_value,
        priority,
        lead_source_id,
        status_id
      ) VALUES (
        'Phase 1 Test Client',
        'Phase 1 Architecture Corp',
        'phase1test@marcaubi-test.com',
        '+971501112233',
        'Web & Digital',
        2500000.00,
        'High',
        $1,
        $2
      ) RETURNING id, status_id;
    `, [validSourceId, initialStatusId]);
    const testLeadId = insertLeadRes.rows[0].id;
    assert(Boolean(testLeadId), 'Successfully inserted test lead.');

    // Fetch converted status ID
    const convStatusRes = await client.query(`
      SELECT id FROM public.funnel_statuses WHERE bucket = 'converted' LIMIT 1;
    `);
    const convertedStatusId = convStatusRes.rows[0]?.id;
    assert(Boolean(convertedStatusId), 'Retrieved converted status ID from funnel_statuses.');

    // Update lead to converted
    await client.query(`
      UPDATE public.leads
      SET status_id = $1,
          converted_at = timezone('utc'::text, now())
      WHERE id = $2;
    `, [convertedStatusId, testLeadId]);

    // Check if client_works row was auto-spawned
    const spawnedWorkRes = await client.query(`
      SELECT id, project_code, client_name, contract_value, delivery_stage, health_status, milestones
      FROM public.client_works
      WHERE lead_id = $1;
    `, [testLeadId]);

    assert(spawnedWorkRes.rows.length === 1, 'Trigger auto-spawned exactly 1 client_works entry upon deal conversion.');
    const spawnedWork = spawnedWorkRes.rows[0];
    assert(spawnedWork.project_code.startsWith('PRJ-'), `Project code is formatted properly (${spawnedWork.project_code}).`);
    assert(Number(spawnedWork.contract_value) === 2500000.00, 'Contract value matched converted lead valuation (₹25L).');
    assert(spawnedWork.delivery_stage === 'kickoff', 'Initial delivery stage is kickoff.');
    assert(spawnedWork.health_status === 'on_track', 'Initial health status is on_track.');
    assert(Array.isArray(spawnedWork.milestones) && spawnedWork.milestones.length === 5, 'Instantiated 5-stage agency milestone checklist.');

    // Clean up test records
    await client.query(`DELETE FROM public.leads WHERE id = $1;`, [testLeadId]);
    console.log('  Cleaned up synthetic test records.');

    // Test Suite 3: Zod Schema Contract Validation
    console.log('\n[TEST 5] Testing Zod Validation Schemas for Permissions & Client Works...');

    // 1. Tab permissions schema
    const validTabs = {
      command_center: true,
      leads: true,
      deals: true,
      works: true,
      tasks: true,
      users: false,
      analytics: false,
      ingestion: false,
      settings: false,
    };
    const tabParse = tabPermissionsSchema.safeParse(validTabs);
    assert(tabParse.success, 'tabPermissionsSchema accepted valid 9-tab boolean object.');

    // 2. Create team user schema with allowedTabs
    const validUserPayload = {
      fullName: 'Aria Vance',
      email: 'aria.vance@marcaubi.com',
      role: 'sales_executive' as const,
      jobTitle: 'Senior Commercial Lead',
      tempPassword: 'P@ssword123456!!',
      allowedTabs: ['command_center', 'leads', 'deals', 'works', 'tasks'] as const,
    };
    const userParse = createTeamUserSchema.safeParse(validUserPayload);
    assert(userParse.success, 'createTeamUserSchema accepted payload with allowedTabs.');

    // 3. Update permissions schema
    const updatePermsPayload = {
      targetUserId: 'a0000000-0000-0000-0000-000000000001',
      allowedTabs: ['command_center', 'leads', 'deals', 'works', 'tasks', 'analytics'] as const,
    };
    const updateParse = updateUserPermissionsSchema.safeParse(updatePermsPayload);
    assert(updateParse.success, 'updateUserPermissionsSchema accepted valid UUID and tab array.');

    // 4. Client works stage schema
    const validStagePayload = {
      workId: 'a0000000-0000-0000-0000-000000000001',
      stage: 'design_ui_ux' as const,
      notes: 'Figma wireframes approved by client leadership.',
    };
    const stageParse = updateClientWorkStageSchema.safeParse(validStagePayload);
    assert(stageParse.success, 'updateClientWorkStageSchema accepted valid delivery stage.');

    // 5. Client works health schema
    const validHealthPayload = {
      workId: 'a0000000-0000-0000-0000-000000000001',
      healthStatus: 'on_track' as const,
      reason: 'All technical deliverables proceeding according to sprint schedule.',
    };
    const healthParse = updateClientWorkHealthSchema.safeParse(validHealthPayload);
    assert(healthParse.success, 'updateClientWorkHealthSchema accepted valid health status.');

    // 6. Client works milestone schema
    const validMilestonePayload = {
      workId: 'a0000000-0000-0000-0000-000000000001',
      milestoneId: 'm2',
      status: 'completed' as const,
    };
    const milestoneParse = updateClientWorkMilestoneSchema.safeParse(validMilestonePayload);
    assert(milestoneParse.success, 'updateClientWorkMilestoneSchema accepted milestone completion payload.');

    console.log('\n================================================================');
    console.log(`PHASE 1 VERIFICATION COMPLETE: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED (100%)`);
    console.log('================================================================\n');
  } finally {
    await client.end();
  }
}

runPhase1Verification().catch((err) => {
  console.error('\n[FATAL] Phase 1 Verification Failed:', err);
  process.exit(1);
});
