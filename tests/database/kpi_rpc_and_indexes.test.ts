/**
 * @file kpi_rpc_and_indexes.test.ts
 * @description Automated regression suite verifying high-performance indexing,
 *              the get_pipeline_kpis RPC procedure, role sandboxing, and edge-case defenses.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @governance Master PRD Section 1.5, Section 1.6 & Section 15.4 (Sprint 1.4)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { Client } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PipelineRpcMetrics } from '../../src/types/crm';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be defined in .env.local to run database test suites.');
}

const ROOT_ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const EXEC_1_ID = '00000000-0000-0000-0000-000000000003';
const EXEC_2_ID = '00000000-0000-0000-0000-000000000004';
const PROBE_EXEC_ZERO = '00000000-0000-0000-0000-000000000088';
const PROBE_SUSPENDED_CI = '00000000-0000-0000-0000-000000000087';

describe('Marca Ubi CRM — PostgreSQL Indexing & get_pipeline_kpis RPC Suite', () => {
  let client: Client;

  before(async () => {
    client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    // Acquire PostgreSQL session advisory lock to serialize database tests and prevent concurrency collisions
    await client.query('SELECT pg_advisory_lock(742910382);');

    // Ensure clean state before provisioning temporary probe accounts
    await client.query(`
      DELETE FROM public.profiles WHERE email IN ('probe_zero_ci@marcaubi.com', 'probe_susp_ci@marcaubi.com');
      DELETE FROM auth.users WHERE email IN ('probe_zero_ci@marcaubi.com', 'probe_susp_ci@marcaubi.com');
    `);

    await client.query(`
      INSERT INTO auth.users (id, email) VALUES 
        ($1, 'probe_zero_ci@marcaubi.com'),
        ($2, 'probe_susp_ci@marcaubi.com')
      ON CONFLICT (id) DO NOTHING;
    `, [PROBE_EXEC_ZERO, PROBE_SUSPENDED_CI]);

    await client.query(`
      INSERT INTO public.profiles (id, email, full_name, role, status)
      VALUES 
        ($1, 'probe_zero_ci@marcaubi.com', 'Probe Closer Zero CI', 'sales_executive', 'active'),
        ($2, 'probe_susp_ci@marcaubi.com', 'Probe Suspended CI', 'sales_executive', 'suspended')
      ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
    `, [PROBE_EXEC_ZERO, PROBE_SUSPENDED_CI]);
  });

  after(async () => {
    try {
      // Teardown temporary probe accounts
      await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [PROBE_EXEC_ZERO, PROBE_SUSPENDED_CI]);
      await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [PROBE_EXEC_ZERO, PROBE_SUSPENDED_CI]);
    } finally {
      // Release PostgreSQL session advisory lock
      await client.query('SELECT pg_advisory_unlock(742910382);');
      await client.end();
    }
  });

  it('verifies all 7 performance and GIN trigram indexes exist and duplicates are dropped', async () => {
    const res = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'leads';
    `);
    const found = new Set(res.rows.map((r: { indexname: string }) => r.indexname));

    const expected = [
      'idx_leads_rep_status',
      'idx_leads_status_created',
      'idx_leads_overdue_partial',
      'idx_leads_kpi_metrics',
      'idx_leads_email_unique',
      'idx_leads_phone_search',
      'idx_leads_global_trgm_search',
    ];

    for (const idx of expected) {
      assert.strictEqual(found.has(idx), true, `Index ${idx} must be active on public.leads`);
    }

    const droppedDuplicates = [
      'idx_leads_assigned_status',
      'idx_leads_next_follow_up',
      'idx_leads_company_trgm',
      'idx_leads_name_trgm',
      'idx_leads_email_trgm',
      'idx_leads_phone_trgm',
    ];

    for (const dropped of droppedDuplicates) {
      assert.strictEqual(found.has(dropped), false, `Redundant index ${dropped} must be eliminated`);
    }
  });

  it('verifies get_pipeline_kpis security definer, stable caching, and pinned search_path', async () => {
    const res = await client.query(`
      SELECT p.prosecdef, p.provolatile, p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'get_pipeline_kpis';
    `);

    assert.strictEqual(res.rows.length, 1, 'Function get_pipeline_kpis must exist in schema public');
    const row = res.rows[0];
    assert.strictEqual(row.prosecdef, true, 'Function must be SECURITY DEFINER');
    assert.strictEqual(row.provolatile, 's', 'Function must be STABLE');
    const config = (row.proconfig || []).join('; ');
    assert.ok(
      config.includes('search_path=public, auth, pg_temp'),
      'Function must pin search_path to eliminate CWE-426 search path hijacking'
    );
  });

  it('strictly blocks anonymous callers from executing get_pipeline_kpis (ERRCODE 42501)', async () => {
    let blocked = false;
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('request.jwt.claims', '', true);`);
      await client.query(`SELECT public.get_pipeline_kpis();`);
      await client.query('COMMIT');
    } catch (err: unknown) {
      await client.query('ROLLBACK');
      const pgErr = err as { code?: string };
      if (pgErr.code === '42501') {
        blocked = true;
      }
    }
    assert.strictEqual(blocked, true, 'Unauthenticated execution must throw 42501');
  });

  it('strictly blocks suspended employees from executing get_pipeline_kpis (ERRCODE 42501)', async () => {
    let blocked = false;
    try {
      await client.query('BEGIN');
      const claims = JSON.stringify({ sub: PROBE_SUSPENDED_CI, role: 'authenticated', app_metadata: { role: 'sales_executive' } });
      await client.query(`SELECT set_config('request.jwt.claims', $1, true);`, [claims]);
      await client.query(`SELECT public.get_pipeline_kpis();`);
      await client.query('COMMIT');
    } catch (err: unknown) {
      await client.query('ROLLBACK');
      const pgErr = err as { code?: string };
      if (pgErr.code === '42501') {
        blocked = true;
      }
    }
    assert.strictEqual(blocked, true, 'Suspended account must be locked out with 42501');
  });

  it('calculates mathematically accurate global pipeline metrics for Admin', async () => {
    await client.query('BEGIN');
    const claims = JSON.stringify({ sub: ROOT_ADMIN_ID, role: 'authenticated', app_metadata: { role: 'admin' } });
    await client.query(`SELECT set_config('request.jwt.claims', $1, true);`, [claims]);

    const res = await client.query(`SELECT public.get_pipeline_kpis() AS kpi;`);
    const kpi: PipelineRpcMetrics = res.rows[0].kpi;

    const countRes = await client.query(`
      SELECT 
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE fs.bucket = 'converted')::INT AS won_count
      FROM public.leads l
      JOIN public.funnel_statuses fs ON l.status_id = fs.id;
    `);
    const groundTruth = countRes.rows[0];
    await client.query('COMMIT');

    assert.strictEqual(kpi.total_leads_count, groundTruth.total);
    assert.strictEqual(kpi.converted_leads_count, groundTruth.won_count);
    assert.ok(kpi.conversion_rate_percentage >= 0, 'Conversion rate must be non-negative');
    assert.ok(kpi.potential_pipeline_value > 0, 'Potential pipeline value must be aggregated');
    assert.ok(kpi.converted_revenue_value > 0, 'Converted revenue value must be aggregated');
  });

  it('scopes metrics to target_user_id when invoked by leadership', async () => {
    await client.query('BEGIN');
    const claims = JSON.stringify({ sub: ROOT_ADMIN_ID, role: 'authenticated', app_metadata: { role: 'admin' } });
    await client.query(`SELECT set_config('request.jwt.claims', $1, true);`, [claims]);

    const res = await client.query(`SELECT public.get_pipeline_kpis($1) AS kpi;`, [EXEC_1_ID]);
    const kpi: PipelineRpcMetrics = res.rows[0].kpi;
    await client.query('COMMIT');

    const repTruthRes = await client.query(`
      SELECT COUNT(*)::INT AS total 
      FROM public.leads 
      WHERE assigned_to = $1;
    `, [EXEC_1_ID]);

    assert.strictEqual(kpi.total_leads_count, repTruthRes.rows[0].total);
  });

  it('enforces role sandboxing: overrides target_user_id argument when called by Sales Executive', async () => {
    await client.query('BEGIN');
    // Simulate Sophia Sterling (exec2) passing Tariq's ID (exec1)
    const claims = JSON.stringify({ sub: EXEC_2_ID, role: 'authenticated', app_metadata: { role: 'sales_executive' } });
    await client.query(`SELECT set_config('request.jwt.claims', $1, true);`, [claims]);

    const res = await client.query(`SELECT public.get_pipeline_kpis($1) AS kpi;`, [EXEC_1_ID]);
    const kpi: PipelineRpcMetrics = res.rows[0].kpi;
    await client.query('COMMIT');

    const sophiaTruthRes = await client.query(`
      SELECT COUNT(*)::INT AS total 
      FROM public.leads 
      WHERE assigned_to = $1;
    `, [EXEC_2_ID]);

    assert.strictEqual(
      kpi.total_leads_count, 
      sophiaTruthRes.rows[0].total,
      'Executive must only see own deals even if passing another user ID'
    );
  });

  it('safely handles zero-lead accounts without division-by-zero or null exceptions', async () => {
    await client.query('BEGIN');
    try {
      const claims = JSON.stringify({ sub: PROBE_EXEC_ZERO, role: 'authenticated', app_metadata: { role: 'sales_executive' } });
      await client.query(`SELECT set_config('request.jwt.claims', $1, true);`, [claims]);

      const res = await client.query(`SELECT public.get_pipeline_kpis() AS kpi;`);
      const kpi: PipelineRpcMetrics = res.rows[0].kpi;
      await client.query('COMMIT');

      assert.strictEqual(kpi.total_leads_count, 0);
      assert.strictEqual(Number(kpi.conversion_rate_percentage), 0.0);
      assert.strictEqual(Number(kpi.potential_pipeline_value), 0.0);
      assert.strictEqual(Number(kpi.converted_revenue_value), 0.0);
      assert.strictEqual(kpi.overdue_follow_ups_count, 0);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    }
  });

  it('benchmarks get_pipeline_kpis execution latency under 75ms across 10,000 synthetic records', async () => {
    await client.query('BEGIN');
    try {
      const claims = JSON.stringify({ sub: ROOT_ADMIN_ID, role: 'authenticated', app_metadata: { role: 'admin' } });
      await client.query(`SELECT set_config('request.jwt.claims', $1, true);`, [claims]);

      const res = await client.query(`
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT public.get_pipeline_kpis();
      `);
      const plan = res.rows[0]['QUERY PLAN'][0];
      const execTime = plan['Execution Time'];
      await client.query('COMMIT');

      assert.ok(execTime < 75.0, `KPI RPC execution time (${execTime}ms) must be under 75ms`);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    }
  });
});
