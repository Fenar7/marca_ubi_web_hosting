/**
 * @file kpi_rpc_and_api.test.ts
 * @description Comprehensive automated test suite for Sprint 6.1:
 *              High-Performance Pipeline KPI Aggregation RPC, Indexing, and Analytics API Gateway.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @governance Master PRD Section 1.5, Section 6 & SPEC-MARCA-CRM-UX-PHASES-6-9
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { kpiQuerySchema } from '../../src/app/lib/validations/kpiQuerySchema';
import type { PipelineRpcMetrics } from '../../src/types/crm';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be defined in .env.local to run analytics database test suites.');
}

const ROOT_ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const SALES_MANAGER_ID = '00000000-0000-0000-0000-000000000002';
const EXEC_1_ID = '00000000-0000-0000-0000-000000000003';
const EXEC_2_ID = '00000000-0000-0000-0000-000000000004';
const PROBE_EXEC_ZERO = '00000000-0000-0000-0000-000000000088';
const PROBE_SUSPENDED_CI = '00000000-0000-0000-0000-000000000087';

describe('Marca Ubi CRM — Sprint 6.1: Pipeline KPI Aggregation RPC & Indexing Engine', () => {
  let client: Client;

  before(async () => {
    client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    // 1. Deploy Migration 20261015000011_kpi_rpc_function.sql to guarantee schema synchronization
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20261015000011_kpi_rpc_function.sql'
    );
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    await client.query(migrationSql);

    // 2. Provision temporary probe accounts for testing role sandboxing and zero-lead states
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
    // Teardown temporary probe accounts
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [PROBE_EXEC_ZERO, PROBE_SUSPENDED_CI]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [PROBE_EXEC_ZERO, PROBE_SUSPENDED_CI]);
    await client.query(`SELECT set_config('request.jwt.claims', '', false);`);
    await client.end();
  });

  describe('Section 1: Zod Query Parameter Schema Validation (kpiQuerySchema)', () => {
    it('accepts completely empty query parameters for global pipeline inspection', () => {
      const result = kpiQuerySchema.safeParse({});
      assert.strictEqual(result.success, true);
    });

    it('accepts ISO 8601 datetimes with timezone offsets', () => {
      const result = kpiQuerySchema.safeParse({
        start_date: '2026-10-01T00:00:00.000Z',
        end_date: '2026-10-31T23:59:59.999Z',
      });
      assert.strictEqual(result.success, true);
    });

    it('accepts YYYY-MM-DD calendar date strings', () => {
      const result = kpiQuerySchema.safeParse({
        start_date: '2026-10-01',
        end_date: '2026-10-31',
      });
      assert.strictEqual(result.success, true);
    });

    it('accepts valid UUIDs for source, assignee, and target_user_id', () => {
      const result = kpiQuerySchema.safeParse({
        source_id: 'a0000000-0000-0000-0000-000000000001',
        assignee_id: EXEC_1_ID,
        target_user_id: EXEC_2_ID,
      });
      assert.strictEqual(result.success, true);
    });

    it('strictly rejects chronologically inverted date ranges (start_date > end_date)', () => {
      const result = kpiQuerySchema.safeParse({
        start_date: '2026-11-01T00:00:00.000Z',
        end_date: '2026-10-01T00:00:00.000Z',
      });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.message.includes('Temporal sequence violation')));
      }
    });

    it('rejects malformed non-UUID identifiers', () => {
      const result = kpiQuerySchema.safeParse({
        source_id: 'invalid-source-uuid',
      });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.path.includes('source_id')));
      }
    });

    it('rejects unparseable non-date strings', () => {
      const result = kpiQuerySchema.safeParse({
        start_date: 'not-a-valid-date',
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe('Section 2: Database Indexes & Stored Function Architecture', () => {
    it('verifies that idx_leads_created_status_assignee exists in pg_indexes', async () => {
      const res = await client.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'leads' AND indexname = 'idx_leads_created_status_assignee';
      `);
      assert.strictEqual(res.rows.length, 1, 'Index idx_leads_created_status_assignee must exist');
    });

    it('verifies that idx_leads_source_created exists in pg_indexes', async () => {
      const res = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'leads' AND indexname = 'idx_leads_source_created';
      `);
      assert.strictEqual(res.rows.length, 1, 'Index idx_leads_source_created must exist');
    });

    it('verifies that idx_leads_followup_status exists with partial filter condition', async () => {
      const res = await client.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'leads' AND indexname = 'idx_leads_followup_status';
      `);
      assert.strictEqual(res.rows.length, 1, 'Index idx_leads_followup_status must exist');
      assert.ok(res.rows[0].indexdef.includes('WHERE (next_follow_up IS NOT NULL)'));
    });

    it('verifies get_pipeline_kpis security definer, stable caching, and pinned search_path', async () => {
      const res = await client.query(`
        SELECT p.proname, p.prosecdef, p.provolatile, p.proconfig
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_pipeline_kpis';
      `);
      assert.strictEqual(res.rows.length, 1, 'Exactly one get_pipeline_kpis unified function must exist');
      const row = res.rows[0];
      assert.strictEqual(row.prosecdef, true, 'Function must be SECURITY DEFINER to prevent search_path poisoning');
      assert.strictEqual(row.provolatile, 's', 'Function must be STABLE to allow query plan optimization');
      assert.ok(
        row.proconfig && row.proconfig.some((c: string) => c.includes('search_path=public, auth, pg_temp')),
        'Function must have statically pinned search_path'
      );
    });
  });

  describe('Section 3: Security Perimeter & Authorization Defense', () => {
    it('strictly blocks anonymous callers without authenticated JWT (ERRCODE 42501)', async () => {
      await client.query(`SELECT set_config('request.jwt.claims', '', false);`);

      let blocked = false;
      try {
        await client.query(`SELECT public.get_pipeline_kpis();`);
      } catch (err: unknown) {
        blocked = true;
        assert.strictEqual((err as { code: string }).code, '42501');
      }
      assert.strictEqual(blocked, true, 'Unauthenticated execution must be blocked with 42501');
    });

    it('strictly blocks suspended employees from accessing analytics (ERRCODE 42501)', async () => {
      const claims = JSON.stringify({ sub: PROBE_SUSPENDED_CI, role: 'authenticated', app_metadata: { role: 'sales_executive' } });
      await client.query(`SELECT set_config('request.jwt.claims', $1, false);`, [claims]);

      let blocked = false;
      try {
        await client.query(`SELECT public.get_pipeline_kpis();`);
      } catch (err: unknown) {
        blocked = true;
        assert.strictEqual((err as { code: string }).code, '42501');
      }
      assert.strictEqual(blocked, true, 'Suspended account must be locked out with 42501');
    });

    it('enforces role sandboxing: Sales Executive cannot inspect other reps by passing arguments', async () => {
      const claims = JSON.stringify({ sub: EXEC_2_ID, role: 'authenticated', app_metadata: { role: 'sales_executive' } });
      await client.query(`SELECT set_config('request.jwt.claims', $1, false);`, [claims]);

      // Exec 2 tries to query Exec 1's portfolio
      const res = await client.query(`SELECT public.get_pipeline_kpis($1) AS kpi;`, [EXEC_1_ID]);
      const kpi: PipelineRpcMetrics = res.rows[0].kpi;

      // Ground truth for Exec 2
      const exec2Truth = await client.query(`
        SELECT COUNT(*)::INT AS total 
        FROM public.leads 
        WHERE assigned_to = $1;
      `, [EXEC_2_ID]);

      assert.strictEqual(
        kpi.total_leads_count,
        exec2Truth.rows[0].total,
        'Sales Executive must only receive their own metrics even if attempting to pass another user ID'
      );
    });
  });

  describe('Section 4: Mathematical Precision & Advanced Pipeline Analytics', () => {
    it('calculates global pipeline metrics accurately with both property alias sets', async () => {
      const claims = JSON.stringify({ sub: ROOT_ADMIN_ID, role: 'authenticated', app_metadata: { role: 'admin' } });
      await client.query(`SELECT set_config('request.jwt.claims', $1, false);`, [claims]);

      const res = await client.query(`SELECT public.get_pipeline_kpis() AS kpi;`);
      const kpi: PipelineRpcMetrics = res.rows[0].kpi;

      // Verify alias parity
      assert.strictEqual(kpi.total_leads, kpi.total_leads_count);
      assert.strictEqual(kpi.potential_count, kpi.potential_leads_count);
      assert.strictEqual(kpi.potential_value, kpi.potential_pipeline_value);
      assert.strictEqual(kpi.converted_count, kpi.converted_leads_count);
      assert.strictEqual(kpi.converted_value, kpi.converted_revenue_value);
      assert.strictEqual(kpi.lost_count, kpi.lost_leads_count);
      assert.strictEqual(kpi.overdue_count, kpi.overdue_follow_ups_count);
      assert.strictEqual(kpi.conversion_rate, kpi.conversion_rate_percentage);

      // Verify non-null / mathematical invariants
      assert.ok(kpi.total_leads_count >= 0);
      assert.ok(Number(kpi.potential_pipeline_value) >= 0);
      assert.ok(Number(kpi.converted_revenue_value) >= 0);
      assert.ok(Number(kpi.conversion_rate_percentage) >= 0);
      assert.ok(Number(kpi.stage_weighted_pipeline_value) >= 0);
    });

    it('supports backward compatibility single UUID argument wrapper', async () => {
      const claims = JSON.stringify({ sub: ROOT_ADMIN_ID, role: 'authenticated', app_metadata: { role: 'admin' } });
      await client.query(`SELECT set_config('request.jwt.claims', $1, false);`, [claims]);

      const res = await client.query(`SELECT public.get_pipeline_kpis($1) AS kpi;`, [EXEC_1_ID]);
      const kpi: PipelineRpcMetrics = res.rows[0].kpi;

      const repTruthRes = await client.query(`
        SELECT COUNT(*)::INT AS total 
        FROM public.leads 
        WHERE assigned_to = $1;
      `, [EXEC_1_ID]);

      assert.strictEqual(kpi.total_leads_count, repTruthRes.rows[0].total);
    });

    it('filters metrics by source_id when provided by leadership', async () => {
      const claims = JSON.stringify({ sub: ROOT_ADMIN_ID, role: 'authenticated', app_metadata: { role: 'admin' } });
      await client.query(`SELECT set_config('request.jwt.claims', $1, false);`, [claims]);

      // Query active lead sources
      const sourcesRes = await client.query(`SELECT id FROM public.lead_sources LIMIT 1;`);
      if (sourcesRes.rows.length > 0) {
        const sourceId = sourcesRes.rows[0].id;
        const res = await client.query(`SELECT public.get_pipeline_kpis(p_source_id => $1) AS kpi;`, [sourceId]);
        const kpi: PipelineRpcMetrics = res.rows[0].kpi;

        const truthRes = await client.query(`
          SELECT COUNT(*)::INT AS total 
          FROM public.leads 
          WHERE lead_source_id = $1;
        `, [sourceId]);

        assert.strictEqual(kpi.total_leads_count, truthRes.rows[0].total);
      }
    });

    it('safely handles zero-lead accounts without division-by-zero or null exceptions', async () => {
      const claims = JSON.stringify({ sub: PROBE_EXEC_ZERO, role: 'authenticated', app_metadata: { role: 'sales_executive' } });
      await client.query(`SELECT set_config('request.jwt.claims', $1, false);`, [claims]);

      const res = await client.query(`SELECT public.get_pipeline_kpis() AS kpi;`);
      const kpi: PipelineRpcMetrics = res.rows[0].kpi;

      assert.strictEqual(kpi.total_leads_count, 0);
      assert.strictEqual(Number(kpi.conversion_rate_percentage), 0.0);
      assert.strictEqual(Number(kpi.potential_pipeline_value), 0.0);
      assert.strictEqual(Number(kpi.converted_revenue_value), 0.0);
      assert.strictEqual(Number(kpi.stage_weighted_pipeline_value), 0.0);
      assert.strictEqual(kpi.overdue_follow_ups_count, 0);
    });

    it('benchmarks get_pipeline_kpis execution latency under 45ms', async () => {
      const claims = JSON.stringify({ sub: ROOT_ADMIN_ID, role: 'authenticated', app_metadata: { role: 'admin' } });
      await client.query(`SELECT set_config('request.jwt.claims', $1, false);`, [claims]);

      const res = await client.query(`
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT public.get_pipeline_kpis();
      `);
      const plan = res.rows[0]['QUERY PLAN'][0];
      const execTime = plan['Execution Time'];

      assert.ok(
        execTime < 45.0,
        `Internal database execution latency (${execTime}ms) exceeded production SLA limit of 45ms`
      );
    });
  });
});
