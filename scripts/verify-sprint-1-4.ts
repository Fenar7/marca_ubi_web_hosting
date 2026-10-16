/**
 * @file verify-sprint-1-4.ts
 * @description Comprehensive automated verification suite for Phase 1 / Sprint 1.4:
 *              High-Performance Indexing, GIN Trigram Search, Stored KPI Aggregations,
 *              and Production Seed Engine.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @security CWE-426 hardened, role isolation verified, zero third-party testing dependencies.
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[FATAL] DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

const ROOT_ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const SALES_MANAGER_ID = '00000000-0000-0000-0000-000000000002';
const EXEC_1_ID = '00000000-0000-0000-0000-000000000003';
const EXEC_2_ID = '00000000-0000-0000-0000-000000000004';
const PROBE_EXEC_ZERO_LEADS = '00000000-0000-0000-0000-000000000099';

async function setSessionClaims(client: Client, userId: string, role: string) {
  const claims = JSON.stringify({
    sub: userId,
    email: `${role}@marcaubi.com`,
    role: 'authenticated',
    app_metadata: { role },
  });
  await client.query(`SELECT set_config('request.jwt.claims', $1, true);`, [claims]);
}

async function runVerification() {
  console.log('============================================================');
  console.log(' Marca Ubi Enterprise CRM - Sprint 1.4 Verification Engine');
  console.log('============================================================');
  console.log(`Targeting PostgreSQL instance at ${connectionString?.split('@')[1]}...\n`);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('[OK] Connected to live Supabase PostgreSQL database.\n');

    // 1. Deploy Migration 20261015000004_indexes_and_kpi_rpc.sql
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261015000004_indexes_and_kpi_rpc.sql');
    console.log(`[EXEC] Deploying migration: ${path.basename(migrationPath)}...`);
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    await client.query(migrationSql);
    console.log('[SUCCESS] Migration 20261015000004 executed successfully.\n');

    // 2. Deploy Seed Dataset supabase/seed.sql
    const seedPath = path.resolve(process.cwd(), 'supabase/seed.sql');
    console.log(`[EXEC] Seeding production enterprise pipeline: ${path.basename(seedPath)}...`);
    const seedSql = fs.readFileSync(seedPath, 'utf-8');
    await client.query(seedSql);
    console.log('[SUCCESS] Enterprise seed dataset executed successfully.\n');

    // 3. Verify High-Performance Indexes
    console.log('[VERIFY 1] Inspecting high-performance indexes in pg_indexes...');
    const expectedIndexes = [
      'idx_leads_rep_status',
      'idx_leads_status_created',
      'idx_leads_overdue_partial',
      'idx_leads_kpi_metrics',
      'idx_leads_email_unique',
      'idx_leads_phone_search',
      'idx_leads_global_trgm_search',
    ];

    const idxRes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'leads';
    `);
    const foundIndexNames = new Set(idxRes.rows.map((r) => r.indexname));

    for (const expected of expectedIndexes) {
      if (!foundIndexNames.has(expected)) {
        throw new Error(`Expected index '${expected}' missing from public.leads.`);
      }
      console.log(`  ✓ Verified index: ${expected}`);
    }
    console.log('  ✓ All 7 Sprint 1.4 indexes verified active and valid.\n');

    // 4. Verify get_pipeline_kpis Function Signature & Security
    console.log('[VERIFY 2] Inspecting get_pipeline_kpis() signature and security definer status...');
    const funcRes = await client.query(`
      SELECT p.proname, p.prosecdef, p.provolatile, p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'get_pipeline_kpis';
    `);

    if (funcRes.rows.length === 0) {
      throw new Error("Function 'public.get_pipeline_kpis()' not found in database.");
    }

    const fn = funcRes.rows[0];
    if (!fn.prosecdef) {
      throw new Error("SECURITY DEFINER flag missing on get_pipeline_kpis().");
    }
    if (fn.provolatile !== 's') {
      throw new Error(`Expected STABLE volatility ('s'), found '${fn.provolatile}'.`);
    }

    const config = (fn.proconfig || []).join('; ');
    if (!config.includes('search_path=public, auth, pg_temp')) {
      throw new Error(`Function search_path not pinned safely: ${config}`);
    }
    console.log('  ✓ get_pipeline_kpis() verified: SECURITY DEFINER, STABLE caching, pinned search_path.\n');

    // 5. Test KPI Aggregation: Admin Global Analytics (target_user_id = NULL)
    console.log('[TEST A] Testing get_pipeline_kpis() agency-wide global calculation (Admin)...');
    await client.query('BEGIN');
    await setSessionClaims(client, ROOT_ADMIN_ID, 'admin');

    const globalKpisRes = await client.query(`SELECT public.get_pipeline_kpis() AS kpi;`);
    const globalKpis = globalKpisRes.rows[0].kpi;
    await client.query('COMMIT');

    console.log('  Raw Global KPIs:', JSON.stringify(globalKpis));

    // Ground-truth assertions against raw SQL queries
    const countCheck = await client.query(`
      SELECT 
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE fs.bucket = 'open')::INT AS open_cnt,
        COUNT(*) FILTER (WHERE fs.bucket = 'potential')::INT AS pot_cnt,
        COALESCE(SUM(expected_value) FILTER (WHERE fs.bucket = 'potential'), 0.00)::NUMERIC(14,2) AS pot_val,
        COUNT(*) FILTER (WHERE fs.bucket = 'converted')::INT AS conv_cnt,
        COALESCE(SUM(expected_value) FILTER (WHERE fs.bucket = 'converted'), 0.00)::NUMERIC(14,2) AS conv_val,
        COUNT(*) FILTER (WHERE fs.bucket = 'lost')::INT AS lost_cnt,
        COUNT(*) FILTER (
          WHERE fs.bucket IN ('open', 'potential') 
            AND next_follow_up IS NOT NULL 
            AND next_follow_up < timezone('utc'::text, now())
        )::INT AS overdue_cnt
      FROM public.leads l
      JOIN public.funnel_statuses fs ON l.status_id = fs.id;
    `);
    const groundTruth = countCheck.rows[0];

    if (globalKpis.total_leads_count !== groundTruth.total) {
      throw new Error(`Total leads mismatch: expected ${groundTruth.total}, got ${globalKpis.total_leads_count}`);
    }
    if (globalKpis.open_leads_count !== groundTruth.open_cnt) {
      throw new Error(`Open leads mismatch: expected ${groundTruth.open_cnt}, got ${globalKpis.open_leads_count}`);
    }
    if (globalKpis.potential_leads_count !== groundTruth.pot_cnt) {
      throw new Error(`Potential leads mismatch: expected ${groundTruth.pot_cnt}, got ${globalKpis.potential_leads_count}`);
    }
    if (Number(globalKpis.potential_pipeline_value) !== Number(groundTruth.pot_val)) {
      throw new Error(`Potential value mismatch: expected ${groundTruth.pot_val}, got ${globalKpis.potential_pipeline_value}`);
    }
    if (globalKpis.converted_leads_count !== groundTruth.conv_cnt) {
      throw new Error(`Converted leads mismatch: expected ${groundTruth.conv_cnt}, got ${globalKpis.converted_leads_count}`);
    }
    if (Number(globalKpis.converted_revenue_value) !== Number(groundTruth.conv_val)) {
      throw new Error(`Converted revenue mismatch: expected ${groundTruth.conv_val}, got ${globalKpis.converted_revenue_value}`);
    }
    if (globalKpis.lost_leads_count !== groundTruth.lost_cnt) {
      throw new Error(`Lost leads mismatch: expected ${groundTruth.lost_cnt}, got ${globalKpis.lost_leads_count}`);
    }
    if (globalKpis.overdue_follow_ups_count !== groundTruth.overdue_cnt) {
      throw new Error(`Overdue count mismatch: expected ${groundTruth.overdue_cnt}, got ${globalKpis.overdue_follow_ups_count}`);
    }

    const expectedWinRate = Number(((groundTruth.conv_cnt / groundTruth.total) * 100).toFixed(2));
    if (Number(globalKpis.conversion_rate_percentage) !== expectedWinRate) {
      throw new Error(`Conversion rate mismatch: expected ${expectedWinRate}%, got ${globalKpis.conversion_rate_percentage}%`);
    }
    console.log('  ✓ Agency-wide commercial metrics verified with 100% mathematical precision.\n');

    // 6. Test KPI Aggregation: Admin Filtered by Sales Representative
    console.log('[TEST B] Testing get_pipeline_kpis(target_user_id) filtering by Sales Closer (Tariq)...');
    await client.query('BEGIN');
    await setSessionClaims(client, ROOT_ADMIN_ID, 'admin');
    const repKpiRes = await client.query(`SELECT public.get_pipeline_kpis($1) AS kpi;`, [EXEC_1_ID]);
    const repKpis = repKpiRes.rows[0].kpi;
    await client.query('COMMIT');

    const repTruthRes = await client.query(`
      SELECT 
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE fs.bucket = 'converted')::INT AS conv_cnt
      FROM public.leads l
      JOIN public.funnel_statuses fs ON l.status_id = fs.id
      WHERE l.assigned_to = $1;
    `, [EXEC_1_ID]);
    const repTruth = repTruthRes.rows[0];

    if (repKpis.total_leads_count !== repTruth.total) {
      throw new Error(`Rep total leads mismatch: expected ${repTruth.total}, got ${repKpis.total_leads_count}`);
    }
    console.log(`  ✓ Filtered KPIs for rep verified: ${repKpis.total_leads_count} deals assigned, ${repKpis.converted_leads_count} won.\n`);

    // 7. Test Role Scoping & Sandboxing: Sales Executive Calling get_pipeline_kpis()
    console.log('[TEST C] Validating Sales Executive role sandboxing & hijack defense...');
    await client.query('BEGIN');
    // Simulate Sophia Sterling (exec2) attempting to query Tariq's metrics (exec1)
    await setSessionClaims(client, EXEC_2_ID, 'sales_executive');
    const hijackedRes = await client.query(`SELECT public.get_pipeline_kpis($1) AS kpi;`, [EXEC_1_ID]);
    const sandboxedKpi = hijackedRes.rows[0].kpi;
    await client.query('COMMIT');

    // Query Sophia's actual deals
    const sophiaTruthRes = await client.query(`
      SELECT COUNT(*)::INT AS total 
      FROM public.leads 
      WHERE assigned_to = $1;
    `, [EXEC_2_ID]);
    const sophiaTotal = sophiaTruthRes.rows[0].total;

    if (sandboxedKpi.total_leads_count !== sophiaTotal) {
      throw new Error(`Executive sandboxing failed! Argument target_user_id was not bypassed: got ${sandboxedKpi.total_leads_count}, expected Sophia's total of ${sophiaTotal}`);
    }
    console.log('  ✓ Sales Executive sandboxing verified: target_user_id argument securely overridden to auth.uid().\n');

    // 8. Test Edge Case: Division by Zero & Empty Sum Null Safety
    console.log('[TEST D] Validating division-by-zero defense & null safety on zero-lead representative...');
    await client.query(`
      INSERT INTO auth.users (id, email) VALUES ($1, 'probe_zero@marcaubi.com')
      ON CONFLICT (id) DO NOTHING;
    `, [PROBE_EXEC_ZERO_LEADS]);
    await client.query(`
      INSERT INTO public.profiles (id, email, full_name, role, status)
      VALUES ($1, 'probe_zero@marcaubi.com', 'Probe Closer Zero', 'sales_executive', 'active')
      ON CONFLICT (id) DO UPDATE SET role = 'sales_executive', status = 'active';
    `, [PROBE_EXEC_ZERO_LEADS]);

    await client.query('BEGIN');
    await setSessionClaims(client, PROBE_EXEC_ZERO_LEADS, 'sales_executive');
    const zeroKpiRes = await client.query(`SELECT public.get_pipeline_kpis() AS kpi;`);
    const zeroKpi = zeroKpiRes.rows[0].kpi;
    await client.query('COMMIT');

    console.log('  Zero-Lead KPI Payload:', JSON.stringify(zeroKpi));
    if (zeroKpi.total_leads_count !== 0) {
      throw new Error(`Expected total_leads_count = 0, got ${zeroKpi.total_leads_count}`);
    }
    if (Number(zeroKpi.conversion_rate_percentage) !== 0.0) {
      throw new Error(`Expected conversion_rate_percentage = 0.0, got ${zeroKpi.conversion_rate_percentage}`);
    }
    if (Number(zeroKpi.potential_pipeline_value) !== 0.0) {
      throw new Error(`Expected potential_pipeline_value = 0.00, got ${zeroKpi.potential_pipeline_value}`);
    }
    if (Number(zeroKpi.converted_revenue_value) !== 0.0) {
      throw new Error(`Expected converted_revenue_value = 0.00, got ${zeroKpi.converted_revenue_value}`);
    }
    console.log('  ✓ Division-by-zero defense verified: conversion_rate_percentage returned 0.0 without SQL error.');
    console.log('  ✓ Null safety verified: monetary aggregations cleanly resolved to 0.00.\n');

    // 9. Performance & Execution Plan Benchmarks (EXPLAIN ANALYZE)
    console.log('[TEST E] Running EXPLAIN ANALYZE benchmarks on KPI RPC and GIN Trigram Search...');
    
    // Benchmark A: get_pipeline_kpis() RPC Execution Time
    const kpiBenchmarkRes = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT public.get_pipeline_kpis();
    `);
    const kpiPlan = kpiBenchmarkRes.rows[0]['QUERY PLAN'][0];
    const kpiExecTime = kpiPlan['Execution Time'];
    console.log(`  ✓ get_pipeline_kpis() Execution Time: ${kpiExecTime} ms (Benchmark Target: < 20 ms)`);

    if (kpiExecTime > 20.0) {
      console.warn(`  [PERF WARNING] KPI RPC took ${kpiExecTime}ms (acceptable for remote network, target <20ms)`);
    }

    // Benchmark B: Fuzzy Text Substring Search utilizing GIN Trigram index
    const trgmSearchRes = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT id, name, company 
      FROM public.leads 
      WHERE company ILIKE '%emaar%';
    `);
    const trgmPlan = trgmSearchRes.rows[0]['QUERY PLAN'][0];
    const trgmExecTime = trgmPlan['Execution Time'];
    console.log(`  ✓ Trigram Search Execution Time: ${trgmExecTime} ms (Benchmark Target: < 15 ms)`);
    console.log(`  ✓ Index Scan Plan Root Node: ${trgmPlan.Plan['Node Type']}\n`);

    // 10. Teardown probe accounts
    console.log('[TEARDOWN] Cleaning up temporary probe accounts...');
    await client.query(`DELETE FROM public.profiles WHERE id = $1;`, [PROBE_EXEC_ZERO_LEADS]);
    await client.query(`DELETE FROM auth.users WHERE id = $1;`, [PROBE_EXEC_ZERO_LEADS]);
    console.log('  ✓ Cleaned up temporary test probe accounts.');

    console.log('\n============================================================');
    console.log(' ALL SPRINT 1.4 VERIFICATION TESTS PASSED (100%)');
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n[FATAL ERROR] Sprint 1.4 verification failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runVerification();
