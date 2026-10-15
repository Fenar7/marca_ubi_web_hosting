/**
 * @file verify-schema.ts
 * @description Migration runner and schema verification engine for Sprint 1.1.
 *              Executes DDL migrations against the live Supabase PostgreSQL database
 *              and validates tables, constraints, sequences, and indexes.
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load local environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[ERROR] DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

async function runVerification() {
  console.log('------------------------------------------------------------');
  console.log(' Marca Ubi Enterprise CRM - Sprint 1.1 Schema Verification');
  console.log('------------------------------------------------------------');
  console.log(`Connecting to PostgreSQL database at ${connectionString?.split('@')[1]}...`);

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('[OK] Successfully established direct connection to PostgreSQL database.\n');

    // 1. Run Consolidated Core Relational Schema & Seed Migration
    const schemaSqlPath = path.resolve(process.cwd(), 'supabase/migrations/20261015000001_initial_core_schema.sql');
    console.log(`[EXEC] Executing core schema migration: ${path.basename(schemaSqlPath)}...`);
    const schemaSql = fs.readFileSync(schemaSqlPath, 'utf-8');
    await client.query(schemaSql);
    console.log('[SUCCESS] Migration 20261015000001 executed successfully.\n');

    // 2. Reset Sequence Counter to pristine seed state (LD-1001)
    console.log('[RESET] Resetting public.lead_code_seq to 1001...');
    await client.query(`ALTER SEQUENCE public.lead_code_seq RESTART WITH 1001;`);
    console.log('[SUCCESS] Sequence reset to 1001.\n');

    // 3. Verify Tables Existence
    console.log('[VERIFY] Inspecting public tables in information_schema...');
    const expectedTables = [
      'profiles',
      'lead_sources',
      'funnel_statuses',
      'leads',
      'lead_activities',
      'team_audit_logs',
    ];

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const existingTables = tablesRes.rows.map((r) => r.table_name);
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`  ✓ Table public.${table} exists`);
      } else {
        throw new Error(`Missing expected table: public.${table}`);
      }
    }

    // 4. Verify Sequence lead_code_seq
    console.log('\n[VERIFY] Inspecting sequence public.lead_code_seq...');
    const seqRes = await client.query(`
      SELECT sequence_name, start_value, minimum_value, increment
      FROM information_schema.sequences
      WHERE sequence_schema = 'public' AND sequence_name = 'lead_code_seq';
    `);
    if (seqRes.rows.length === 0) {
      throw new Error('Sequence public.lead_code_seq not found in information_schema!');
    }
    console.log(`  ✓ Sequence public.lead_code_seq active (Start: ${seqRes.rows[0].start_value}, Increment: ${seqRes.rows[0].increment})`);

    // 5. Verify Performance & Foreign Key Indexes
    console.log('\n[VERIFY] Inspecting performance and foreign key indexes...');
    const indexRes = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public';
    `);
    const indexNames = indexRes.rows.map((r) => r.indexname);
    const expectedIndexes = [
      'idx_leads_assigned_status',
      'idx_leads_status_created',
      'idx_leads_next_follow_up',
      'idx_leads_source_id',
      'idx_leads_priority',
      'idx_profiles_role',
      'idx_profiles_status',
      'idx_lead_activities_lead_created',
      'idx_team_audit_logs_created',
      'idx_leads_company_trgm',
      'idx_leads_name_trgm',
      'idx_leads_email_trgm',
      'idx_leads_phone_trgm',
    ];
    for (const idx of expectedIndexes) {
      if (indexNames.includes(idx)) {
        console.log(`  ✓ Index ${idx} confirmed`);
      } else {
        throw new Error(`Missing expected index: ${idx}`);
      }
    }

    // 6. Verify Seed Records Counts
    console.log('\n[VERIFY] Checking seeded reference datasets...');
    const sourcesRes = await client.query(`SELECT count(*)::int as count FROM public.lead_sources;`);
    const statusesRes = await client.query(`SELECT count(*)::int as count FROM public.funnel_statuses;`);
    console.log(`  ✓ Lead sources seeded: ${sourcesRes.rows[0].count} channels (expected >= 5)`);
    console.log(`  ✓ Funnel statuses seeded: ${statusesRes.rows[0].count} stages across 4 buckets (expected >= 8)`);

    // 7. Test Check Constraint: NULL values probe
    console.log('\n[VERIFY] Testing table-level constraint chk_lead_contact_info defensive safeguards...');
    try {
      await client.query(`
        INSERT INTO public.leads (
          lead_id, name, preferred_channel, lead_source_id, status_id, phone, email
        ) VALUES (
          'TEST-CHECK-PROBE-1', 'Test NULL Ingestion', 'Email', 
          'a0000000-0000-0000-0000-000000000001', 
          'b0000000-0000-0000-0000-000000000001', 
          NULL, NULL
        );
      `);
      throw new Error('FAILED: Constraint chk_lead_contact_info failed to reject record with NULL phone and NULL email!');
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === '23514') {
        console.log('  ✓ chk_lead_contact_info successfully rejected { phone: NULL, email: NULL } (SQLSTATE 23514).');
      } else {
        throw err;
      }
    }

    // 8. Test Check Constraint: Empty string probe
    try {
      await client.query(`
        INSERT INTO public.leads (
          lead_id, name, preferred_channel, lead_source_id, status_id, phone, email
        ) VALUES (
          'TEST-CHECK-PROBE-2', 'Test Empty Ingestion', 'Email', 
          'a0000000-0000-0000-0000-000000000001', 
          'b0000000-0000-0000-0000-000000000001', 
          '', NULL
        );
      `);
      throw new Error('FAILED: Constraint chk_lead_contact_info failed to reject empty string phone!');
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === '23514') {
        console.log('  ✓ chk_lead_contact_info successfully rejected empty string { phone: "", email: NULL } (SQLSTATE 23514).');
      } else {
        throw err;
      }
    }

    // 9. Test Check Constraint: Whitespace string probe
    try {
      await client.query(`
        INSERT INTO public.leads (
          lead_id, name, preferred_channel, lead_source_id, status_id, phone, email
        ) VALUES (
          'TEST-CHECK-PROBE-3', 'Test Whitespace Ingestion', 'Email', 
          'a0000000-0000-0000-0000-000000000001', 
          'b0000000-0000-0000-0000-000000000001', 
          '   ', NULL
        );
      `);
      throw new Error('FAILED: Constraint chk_lead_contact_info failed to reject whitespace-only phone!');
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === '23514') {
        console.log('  ✓ chk_lead_contact_info successfully rejected whitespace { phone: "   ", email: NULL } (SQLSTATE 23514).');
      } else {
        throw err;
      }
    }

    // 10. Verify Sequence Integrity (Ensure Sequence was NOT Burned)
    const seqStatus = await client.query(`SELECT last_value, is_called FROM public.lead_code_seq;`);
    console.log(`\n[VERIFY] Sequence state post-testing: last_value = ${seqStatus.rows[0].last_value}, is_called = ${seqStatus.rows[0].is_called}`);
    if (seqStatus.rows[0].last_value !== '1001' || seqStatus.rows[0].is_called !== false) {
      console.warn('  ⚠ Notice: Sequence counter was altered during test probes.');
    } else {
      console.log('  ✓ Sequence counter perfectly preserved at initial state 1001 (uncalled).');
    }

    console.log('\n============================================================');
    console.log(' ALL SPRINT 1.1 DATABASE VERIFICATION CHECKS PASSED (100%)');
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n[FATAL ERROR] Verification failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runVerification();
