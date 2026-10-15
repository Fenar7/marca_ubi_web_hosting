/**
 * @file verify-sprint-1-2.ts
 * @description Comprehensive automated verification test suite for Sprint 1.2:
 *              - Migration deployment: 20261015000002_triggers_and_sequences.sql
 *              - Timestamp synchronization trigger (handle_updated_at)
 *              - Sole administrator lockout defense trigger (protect_sole_admin)
 *              - Automated delta-capturing audit trigger (audit_lead_changes_trigger)
 *              - Monotonic sequence concurrency test (50 concurrent inserts: LD-1001 to LD-1050)
 */

import { Client, Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[FATAL] DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

async function runSprint12Verification() {
  console.log('------------------------------------------------------------');
  console.log(' Marca Ubi Enterprise CRM - Sprint 1.2 Verification Engine');
  console.log('------------------------------------------------------------');
  console.log(`Targeting PostgreSQL instance at ${connectionString?.split('@')[1]}...\n`);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('[OK] Connected to live Supabase PostgreSQL database.\n');

    // 1. Deploy Migration 20261015000002_triggers_and_sequences.sql
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20261015000002_triggers_and_sequences.sql'
    );
    console.log(`[EXEC] Deploying migration: ${path.basename(migrationPath)}...`);
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    await client.query(migrationSql);
    console.log('[SUCCESS] Migration 20261015000002 executed successfully.\n');

    // 2. Verify Trigger Functions & Attachments in Information Schema
    console.log('[VERIFY] Inspecting routines and triggers in catalog...');
    const routinesRes = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name IN ('handle_updated_at', 'protect_sole_admin', 'audit_lead_changes_trigger');
    `);
    const foundRoutines = routinesRes.rows.map((r) => r.routine_name);
    console.log(`  ✓ Functions confirmed: ${foundRoutines.join(', ')}`);
    if (foundRoutines.length !== 3) {
      throw new Error(`Expected 3 functions, found ${foundRoutines.length}`);
    }

    const triggersRes = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public';
    `);
    const triggerNames = triggersRes.rows.map((r) => r.trigger_name);
    const expectedTriggers = [
      'trg_leads_updated_at',
      'trg_profiles_updated_at',
      'trg_protect_sole_admin',
      'trg_audit_lead_changes',
    ];
    for (const trg of expectedTriggers) {
      if (triggerNames.includes(trg)) {
        console.log(`  ✓ Trigger ${trg} active`);
      } else {
        throw new Error(`Missing expected trigger: ${trg}`);
      }
    }

    // ------------------------------------------------------------------------
    // TEST 1: Automatic UTC Timestamp Synchronization (handle_updated_at)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 1] Verifying handle_updated_at UTC timestamp synchronization...');
    // Create probe lead with artificial backdated timestamp
    const backdatedTime = '2020-01-01T00:00:00Z';
    const probeLeadRes = await client.query(`
      INSERT INTO public.leads (
        lead_id, name, phone, email, lead_source_id, status_id, updated_at
      ) VALUES (
        'TEST-TRIGGER-PROBE-1', 'Timestamp Probe Lead', '+971501112233', 'probe@marcaubi.com',
        'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
        $1
      ) RETURNING id, updated_at;
    `, [backdatedTime]);

    const probeLeadId = probeLeadRes.rows[0].id;
    console.log(`  Probe lead created with backdated updated_at: ${probeLeadRes.rows[0].updated_at}`);

    // Execute update and verify updated_at was automatically refreshed to current UTC
    await client.query(`
      UPDATE public.leads 
      SET company = 'Synchronized Ventures LLC'
      WHERE id = $1;
    `, [probeLeadId]);

    const updatedLeadRes = await client.query(`
      SELECT updated_at FROM public.leads WHERE id = $1;
    `, [probeLeadId]);

    const newUpdatedAt = new Date(updatedLeadRes.rows[0].updated_at);
    const now = new Date();
    const diffSeconds = Math.abs((now.getTime() - newUpdatedAt.getTime()) / 1000);

    if (diffSeconds > 10) {
      throw new Error(`handle_updated_at failed: updated_at drift is ${diffSeconds}s`);
    }
    console.log(`  ✓ handle_updated_at successfully updated timestamp to current UTC (drift: ${diffSeconds.toFixed(2)}s).`);

    // Clean up probe lead
    await client.query(`DELETE FROM public.leads WHERE id = $1;`, [probeLeadId]);

    // ------------------------------------------------------------------------
    // TEST 2: Agency Sole Administrator Lockout Defense (protect_sole_admin)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 2] Verifying protect_sole_admin lockout defense...');
    const admin1AuthId = 'c0000000-0000-0000-0000-000000000001';
    const admin2AuthId = 'c0000000-0000-0000-0000-000000000002';

    // Provision dummy auth.users entities for testing profile foreign keys
    await client.query(`
      INSERT INTO auth.users (id, email) 
      VALUES ($1, 'admin1@marcaubi.com'), ($2, 'admin2@marcaubi.com')
      ON CONFLICT (id) DO NOTHING;
    `, [admin1AuthId, admin2AuthId]);

    // Ensure clean initial state for test profiles
    await client.query(`ALTER TABLE public.profiles DISABLE TRIGGER trg_protect_sole_admin;`);
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [admin1AuthId, admin2AuthId]);
    await client.query(`ALTER TABLE public.profiles ENABLE TRIGGER trg_protect_sole_admin;`);

    // Create the sole active administrator
    await client.query(`
      INSERT INTO public.profiles (id, email, full_name, role, status)
      VALUES ($1, 'admin1@marcaubi.com', 'Primary Founder', 'admin', 'active');
    `, [admin1AuthId]);
    console.log('  Sole active administrator provisioned.');

    // Probe 2a: Attempt to demote sole admin to sales_manager -> MUST FAIL
    try {
      await client.query(`
        UPDATE public.profiles 
        SET role = 'sales_manager'
        WHERE id = $1;
      `, [admin1AuthId]);
      throw new Error('FAILED: protect_sole_admin permitted demotion of sole active admin!');
    } catch (err: unknown) {
      const error = err as { code?: string; message: string };
      if (error.code === '23514') {
        console.log('  ✓ protect_sole_admin rejected role demotion on sole active admin (SQLSTATE 23514).');
      } else {
        throw err;
      }
    }

    // Probe 2b: Attempt to suspend sole admin -> MUST FAIL
    try {
      await client.query(`
        UPDATE public.profiles 
        SET status = 'suspended'
        WHERE id = $1;
      `, [admin1AuthId]);
      throw new Error('FAILED: protect_sole_admin permitted suspension of sole active admin!');
    } catch (err: unknown) {
      const error = err as { code?: string; message: string };
      if (error.code === '23514') {
        console.log('  ✓ protect_sole_admin rejected account suspension on sole active admin (SQLSTATE 23514).');
      } else {
        throw err;
      }
    }

    // Probe 2c: Attempt to hard-delete sole admin -> MUST FAIL
    try {
      await client.query(`
        DELETE FROM public.profiles WHERE id = $1;
      `, [admin1AuthId]);
      throw new Error('FAILED: protect_sole_admin permitted deletion of sole active admin!');
    } catch (err: unknown) {
      const error = err as { code?: string; message: string };
      if (error.code === '23514') {
        console.log('  ✓ protect_sole_admin rejected hard deletion of sole active admin (SQLSTATE 23514).');
      } else {
        throw err;
      }
    }

    // Probe 2d: Provision a second active admin, now demotion of admin1 MUST SUCCEED
    await client.query(`
      INSERT INTO public.profiles (id, email, full_name, role, status)
      VALUES ($1, 'admin2@marcaubi.com', 'Secondary Director', 'admin', 'active');
    `, [admin2AuthId]);
    console.log('  Second active administrator provisioned.');

    await client.query(`
      UPDATE public.profiles 
      SET role = 'sales_manager'
      WHERE id = $1;
    `, [admin1AuthId]);
    console.log('  ✓ Demotion succeeded when another active administrator exists in the agency.');

    // Clean up test profiles and auth users (temporarily disable trigger strictly for test suite teardown)
    await client.query(`ALTER TABLE public.profiles DISABLE TRIGGER trg_protect_sole_admin;`);
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [admin1AuthId, admin2AuthId]);
    await client.query(`ALTER TABLE public.profiles ENABLE TRIGGER trg_protect_sole_admin;`);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [admin1AuthId, admin2AuthId]);
    console.log('  Test administrator profiles and auth records cleaned up.');

    // ------------------------------------------------------------------------
    // TEST 3: Automated Delta-Capturing Audit Engine (audit_lead_changes_trigger)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 3] Verifying audit_lead_changes_trigger automated event logging...');
    const auditProbeLeadRes = await client.query(`
      INSERT INTO public.leads (
        lead_id, name, phone, email, priority, lead_source_id, status_id, expected_value
      ) VALUES (
        'TEST-AUDIT-PROBE-1', 'Audit Verification Lead', '+971509998877', 'audit@marcaubi.com',
        'Medium', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
        15000.00
      ) RETURNING id;
    `);
    const auditLeadId = auditProbeLeadRes.rows[0].id;

    // Mutation 3a: Priority Escalation
    await client.query(`
      UPDATE public.leads 
      SET priority = 'High'
      WHERE id = $1;
    `, [auditLeadId]);

    const actPriorityRes = await client.query(`
      SELECT activity_type, description, metadata 
      FROM public.lead_activities 
      WHERE lead_id = $1 AND activity_type = 'priority_change'
      ORDER BY created_at DESC LIMIT 1;
    `, [auditLeadId]);

    if (actPriorityRes.rows.length === 0) {
      throw new Error('audit_lead_changes_trigger failed to capture priority_change activity!');
    }
    const priorityMeta = actPriorityRes.rows[0].metadata;
    console.log(`  ✓ priority_change captured: Old='${priorityMeta.changes.priority.old}', New='${priorityMeta.changes.priority.new}'`);

    // Mutation 3b: Funnel Status Advance (New -> Qualified)
    await client.query(`
      UPDATE public.leads 
      SET status_id = 'b0000000-0000-0000-0000-000000000004'
      WHERE id = $1;
    `, [auditLeadId]);

    const actStatusRes = await client.query(`
      SELECT activity_type, description, metadata 
      FROM public.lead_activities 
      WHERE lead_id = $1 AND activity_type = 'status_change'
      ORDER BY created_at DESC LIMIT 1;
    `, [auditLeadId]);

    if (actStatusRes.rows.length === 0) {
      throw new Error('audit_lead_changes_trigger failed to capture status_change activity!');
    }
    console.log(`  ✓ status_change captured: Description='${actStatusRes.rows[0].description}'`);

    // Mutation 3c: Automated System Field Update (budget_bracket without JWT actor)
    await client.query(`
      UPDATE public.leads 
      SET budget_bracket = '$25,000 - $50,000'
      WHERE id = $1;
    `, [auditLeadId]);

    const actFieldRes = await client.query(`
      SELECT activity_type, description, metadata 
      FROM public.lead_activities 
      WHERE lead_id = $1 AND activity_type = 'system_event'
      ORDER BY created_at DESC LIMIT 1;
    `, [auditLeadId]);

    if (actFieldRes.rows.length === 0) {
      throw new Error('audit_lead_changes_trigger failed to classify unauthenticated update as system_event!');
    }
    console.log(`  ✓ system_event captured: '${actFieldRes.rows[0].description}' for budget_bracket = '${actFieldRes.rows[0].metadata.changes.budget_bracket.new}'`);

    // Mutation 3d: Compound Mutation (status transition + reassignment)
    await client.query(`
      UPDATE public.leads 
      SET status_id = 'b0000000-0000-0000-0000-000000000006'
      WHERE id = $1;
    `, [auditLeadId]);

    const actCompoundRes = await client.query(`
      SELECT activity_type, description, metadata 
      FROM public.lead_activities 
      WHERE lead_id = $1 AND activity_type = 'status_change'
      ORDER BY created_at DESC LIMIT 1;
    `, [auditLeadId]);

    console.log(`  ✓ Status transition captured: '${actCompoundRes.rows[0].description}'`);

    // Clean up audit probe lead (verifies cascade to lead_activities)
    await client.query(`DELETE FROM public.leads WHERE id = $1;`, [auditLeadId]);
    const orphanedActivities = await client.query(`SELECT count(*)::int as count FROM public.lead_activities WHERE lead_id = $1;`, [auditLeadId]);
    if (orphanedActivities.rows[0].count !== 0) {
      throw new Error('Cascade cleanup failed on lead_activities!');
    }
    console.log('  ✓ Cascade deletion verified on lead_activities.');

    // ------------------------------------------------------------------------
    // TEST 4: Atomic Monotonic Sequence Concurrency (50 Concurrent Inserts)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 4] Executing 50 concurrent inserts via connection pool to test lead_code_seq monotonic safety...');
    // Reset sequence to 1001 for pristine concurrency assertion
    await client.query(`ALTER SEQUENCE public.lead_code_seq RESTART WITH 1001;`);

    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });

    const insertPromises = [];
    for (let i = 1; i <= 50; i++) {
      insertPromises.push(
        pool.query(`
          INSERT INTO public.leads (
            name, phone, email, lead_source_id, status_id, company
          ) VALUES (
            $1, $2, $3,
            'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
            $4
          ) RETURNING lead_id;
        `, [
          `Concurrent Client ${i}`,
          `+9715000000${i.toString().padStart(2, '0')}`,
          `client${i}@agency.ae`,
          `Enterprise Brand ${i}`
        ])
      );
    }

    const results = await Promise.all(insertPromises);
    await pool.end();
    const generatedIds = results.map((r) => r.rows[0].lead_id);
    const uniqueIds = new Set(generatedIds);

    console.log(`  Dispatched 50 parallel inserts across connection pool.`);
    console.log(`  Total IDs received: ${generatedIds.length}`);
    console.log(`  Distinct unique IDs: ${uniqueIds.size}`);

    if (uniqueIds.size !== 50) {
      throw new Error(`Concurrency collision detected! Only ${uniqueIds.size} unique IDs generated out of 50.`);
    }

    // Verify exact sequential range: LD-1001 through LD-1050
    generatedIds.sort();
    const minId = generatedIds[0];
    const maxId = generatedIds[generatedIds.length - 1];
    console.log(`  Range generated: ${minId} to ${maxId}`);

    if (minId !== 'LD-1001' || maxId !== 'LD-1050') {
      throw new Error(`Unexpected sequence bounds: min=${minId}, max=${maxId} (expected LD-1001 to LD-1050)`);
    }
    console.log('  ✓ Monotonic sequential range verified from LD-1001 to LD-1050 with 0 collisions.');

    // Clean up the 50 test leads
    await client.query(`
      DELETE FROM public.leads 
      WHERE lead_id >= 'LD-1001' AND lead_id <= 'LD-1050';
    `);
    console.log('  50 test concurrency leads cleaned up.');

    // Reset sequence to 1001 to maintain pristine state for production
    await client.query(`ALTER SEQUENCE public.lead_code_seq RESTART WITH 1001;`);
    const finalSeq = await client.query(`SELECT last_value, is_called FROM public.lead_code_seq;`);
    console.log(`  ✓ Sequence restored to pristine state: last_value = ${finalSeq.rows[0].last_value}, is_called = ${finalSeq.rows[0].is_called}`);

    console.log('\n============================================================');
    console.log(' ALL SPRINT 1.2 VERIFICATION TESTS PASSED (100%)');
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n[FATAL ERROR] Verification failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSprint12Verification();
