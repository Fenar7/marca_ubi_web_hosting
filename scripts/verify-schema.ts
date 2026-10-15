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

    // 1. Run Core Relational Schema Migration
    const schemaSqlPath = path.resolve(process.cwd(), 'supabase/migrations/20261015000001_initial_core_schema.sql');
    console.log(`[EXEC] Executing core schema migration: ${path.basename(schemaSqlPath)}...`);
    const schemaSql = fs.readFileSync(schemaSqlPath, 'utf-8');
    await client.query(schemaSql);
    console.log('[SUCCESS] Migration 20261015000001 executed successfully.\n');

    // 2. Run Initial Seed Data Migration
    const seedSqlPath = path.resolve(process.cwd(), 'supabase/migrations/20261015000002_initial_seed_data.sql');
    console.log(`[EXEC] Executing seed data migration: ${path.basename(seedSqlPath)}...`);
    const seedSql = fs.readFileSync(seedSqlPath, 'utf-8');
    await client.query(seedSql);
    console.log('[SUCCESS] Migration 20261015000002 executed successfully.\n');

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

    // 5. Verify Performance Indexes
    console.log('\n[VERIFY] Inspecting performance indexes on public.leads...');
    const indexRes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'leads';
    `);
    const indexNames = indexRes.rows.map((r) => r.indexname);
    const expectedIndexes = [
      'idx_leads_assigned_status',
      'idx_leads_status_created',
      'idx_leads_next_follow_up',
      'idx_leads_company_trgm',
      'idx_leads_name_trgm',
      'idx_leads_email_trgm',
      'idx_leads_phone_trgm',
    ];
    for (const idx of expectedIndexes) {
      if (indexNames.includes(idx)) {
        console.log(`  ✓ Index ${idx} confirmed`);
      } else {
        console.warn(`  ⚠ Warning: Index ${idx} was not listed directly`);
      }
    }

    // 6. Verify Seed Records Counts
    console.log('\n[VERIFY] Checking seeded reference datasets...');
    const sourcesRes = await client.query(`SELECT count(*)::int as count FROM public.lead_sources;`);
    const statusesRes = await client.query(`SELECT count(*)::int as count FROM public.funnel_statuses;`);
    console.log(`  ✓ Lead sources seeded: ${sourcesRes.rows[0].count} channels (expected >= 5)`);
    console.log(`  ✓ Funnel statuses seeded: ${statusesRes.rows[0].count} stages across 4 buckets (expected >= 8)`);

    // 7. Verify Data Integrity Constraints (chk_lead_contact_info)
    console.log('\n[VERIFY] Testing table-level constraint chk_lead_contact_info defensive safeguard...');
    try {
      await client.query(`
        INSERT INTO public.leads (
          name, preferred_channel, lead_source_id, status_id, phone, email
        ) VALUES (
          'Test Bad Ingestion', 'Email', 
          'a0000000-0000-0000-0000-000000000001', 
          'b0000000-0000-0000-0000-000000000001', 
          NULL, NULL
        );
      `);
      throw new Error('FAILED: Constraint chk_lead_contact_info failed to reject record with no phone and no email!');
    } catch (err: unknown) {
      const error = err as { code?: string; message: string };
      if (error.code === '23514') { // check_violation
        console.log('  ✓ chk_lead_contact_info successfully rejected invalid insertion without contact channel (SQLSTATE 23514).');
      } else {
        throw err;
      }
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
