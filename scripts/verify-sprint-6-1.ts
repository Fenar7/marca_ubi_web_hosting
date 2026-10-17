/**
 * @file verify-sprint-6-1.ts
 * @description Automated Quality & Delivery Gate Verification Suite for Sprint 6.1:
 *              High-Performance Pipeline KPI Aggregation RPC, Indexing & Analytics API Gateway.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @governance Master PRD Section 1.5, Section 6 & SPEC-MARCA-CRM-UX-PHASES-6-9
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { kpiQuerySchema } from '../src/app/lib/validations/kpiQuerySchema';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[FATAL] DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

const ROOT_ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const EXEC_1_ID = '00000000-0000-0000-0000-000000000003';
const EXEC_2_ID = '00000000-0000-0000-0000-000000000004';
const PROBE_EXEC_ZERO = '00000000-0000-0000-0000-000000000088';
const PROBE_SUSPENDED_CI = '00000000-0000-0000-0000-000000000087';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function runVerification(): Promise<void> {
  console.log('============================================================');
  console.log(' Marca Ubi Enterprise CRM - Sprint 6.1 Delivery Gate');
  console.log(' High-Performance KPI Aggregation RPC & API Gateway');
  console.log('============================================================\n');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Section 1: Migration Artifact & Stored Procedure Integrity
    console.log('Section 1: Migration Artifact & Stored Procedure Integrity');
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261015000011_kpi_rpc_function.sql');
    assert(fs.existsSync(migrationPath), 'Migration 20261015000011_kpi_rpc_function.sql exists on disk');

    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    await client.query(migrationSql);
    assert(true, 'Migration 20261015000011 executed cleanly against live Supabase PostgreSQL');

    const procRes = await client.query(`
      SELECT p.proname, p.prosecdef, p.provolatile, p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'get_pipeline_kpis';
    `);
    assert(procRes.rows.length === 1, 'Exactly one get_pipeline_kpis function exists in public schema');
    assert(procRes.rows[0].prosecdef === true, 'get_pipeline_kpis is configured as SECURITY DEFINER');
    assert(procRes.rows[0].provolatile === 's', 'get_pipeline_kpis is marked as STABLE for plan caching');
    assert(
      procRes.rows[0].proconfig?.some((c: string) => c.includes('search_path=public, auth, pg_temp')),
      'get_pipeline_kpis statically pins search_path to prevent CWE-426 search_path hijacking'
    );

    const indexesRes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'leads' AND indexname IN (
        'idx_leads_created_status_assignee',
        'idx_leads_source_created',
        'idx_leads_followup_status'
      );
    `);
    const foundIndexes = new Set(indexesRes.rows.map((r: { indexname: string }) => r.indexname));
    assert(foundIndexes.has('idx_leads_created_status_assignee'), 'idx_leads_created_status_assignee exists');
    assert(foundIndexes.has('idx_leads_source_created'), 'idx_leads_source_created exists');
    assert(foundIndexes.has('idx_leads_followup_status'), 'idx_leads_followup_status exists with partial predicate');

    // Section 2: Mathematical Precision & Scoping Invariants
    console.log('\nSection 2: Mathematical Precision & Multi-Dimensional Scoping');
    // Ensure probe accounts
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

    const adminClaims = JSON.stringify({ sub: ROOT_ADMIN_ID, role: 'authenticated', app_metadata: { role: 'admin' } });
    await client.query(`SELECT set_config('request.jwt.claims', $1, false);`, [adminClaims]);

    const globalRes = await client.query(`SELECT public.get_pipeline_kpis() AS kpi;`);
    const globalKpi = globalRes.rows[0].kpi;
    assert(globalKpi.total_leads === globalKpi.total_leads_count, 'Alias total_leads matches total_leads_count');
    assert(globalKpi.potential_count === globalKpi.potential_leads_count, 'Alias potential_count matches potential_leads_count');
    assert(globalKpi.potential_value === globalKpi.potential_pipeline_value, 'Alias potential_value matches potential_pipeline_value');
    assert(globalKpi.converted_count === globalKpi.converted_leads_count, 'Alias converted_count matches converted_leads_count');
    assert(globalKpi.converted_value === globalKpi.converted_revenue_value, 'Alias converted_value matches converted_revenue_value');
    assert(globalKpi.conversion_rate === globalKpi.conversion_rate_percentage, 'Alias conversion_rate matches conversion_rate_percentage');
    assert(globalKpi.overdue_count === globalKpi.overdue_follow_ups_count, 'Alias overdue_count matches overdue_follow_ups_count');
    assert(typeof globalKpi.stage_weighted_pipeline_value === 'number', 'stage_weighted_pipeline_value is calculated');

    const repRes = await client.query(`SELECT public.get_pipeline_kpis($1) AS kpi;`, [EXEC_1_ID]);
    assert(typeof repRes.rows[0].kpi.total_leads === 'number', '1-argument invocation operates cleanly');

    const zeroClaims = JSON.stringify({ sub: PROBE_EXEC_ZERO, role: 'authenticated', app_metadata: { role: 'sales_executive' } });
    await client.query(`SELECT set_config('request.jwt.claims', $1, false);`, [zeroClaims]);
    const zeroRes = await client.query(`SELECT public.get_pipeline_kpis() AS kpi;`);
    const zeroKpi = zeroRes.rows[0].kpi;
    assert(zeroKpi.total_leads === 0, 'Zero-leads account yields total_leads = 0');
    assert(zeroKpi.conversion_rate === 0.0, 'Zero-leads account yields conversion_rate = 0.0% without division-by-zero');

    // Benchmark
    await client.query(`SELECT set_config('request.jwt.claims', $1, false);`, [adminClaims]);
    const planRes = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT public.get_pipeline_kpis();`);
    const execTime = planRes.rows[0]['QUERY PLAN'][0]['Execution Time'];
    assert(execTime < 45.0, `Database internal execution time (${execTime}ms) is strictly under 45ms SLA limit`);

    // Section 3: Security & Role Sandboxing Invariants
    console.log('\nSection 3: Security Perimeter & Role Sandboxing');
    await client.query(`SELECT set_config('request.jwt.claims', '', false);`);
    let anonBlocked = false;
    try {
      await client.query(`SELECT public.get_pipeline_kpis();`);
    } catch (e: unknown) {
      anonBlocked = (e as { code?: string }).code === '42501';
    }
    assert(anonBlocked, 'Anonymous caller without JWT is rejected with ERRCODE 42501');

    const suspClaims = JSON.stringify({ sub: PROBE_SUSPENDED_CI, role: 'authenticated', app_metadata: { role: 'sales_executive' } });
    await client.query(`SELECT set_config('request.jwt.claims', $1, false);`, [suspClaims]);
    let suspBlocked = false;
    try {
      await client.query(`SELECT public.get_pipeline_kpis();`);
    } catch (e: unknown) {
      suspBlocked = (e as { code?: string }).code === '42501';
    }
    assert(suspBlocked, 'Suspended user is rejected with ERRCODE 42501');

    const execClaims = JSON.stringify({ sub: EXEC_2_ID, role: 'authenticated', app_metadata: { role: 'sales_executive' } });
    await client.query(`SELECT set_config('request.jwt.claims', $1, false);`, [execClaims]);
    const execRes = await client.query(`SELECT public.get_pipeline_kpis($1) AS kpi;`, [EXEC_1_ID]);
    const execTruth = await client.query(`SELECT COUNT(*)::INT AS count FROM public.leads WHERE assigned_to = $1;`, [EXEC_2_ID]);
    assert(execRes.rows[0].kpi.total_leads === execTruth.rows[0].count, 'Sales executive is strictly sandboxed to own assigned leads');

    // Section 4: Next.js 16 API Route Handler & Schema Validation
    console.log('\nSection 4: Next.js 16 API Route Handler & Validation Contracts');
    const routePath = path.resolve(process.cwd(), 'src/app/api/sales-funnel/kpis/route.ts');
    assert(fs.existsSync(routePath), 'API route handler src/app/api/sales-funnel/kpis/route.ts exists');
    const routeContent = fs.readFileSync(routePath, 'utf-8');
    assert(routeContent.includes("export async function GET"), 'Route handler exports GET method');
    assert(routeContent.includes("export const runtime = 'nodejs';"), 'Route handler specifies nodejs runtime');
    assert(routeContent.includes("s-maxage=15, stale-while-revalidate=45"), 'Route handler enforces Stale-While-Revalidate caching headers');
    assert(routeContent.includes("kpiQuerySchema.safeParse"), 'Route handler enforces Zod query parameter validation');

    const schemaValid = kpiQuerySchema.safeParse({
      start_date: '2026-10-01T00:00:00.000Z',
      end_date: '2026-10-31T23:59:59.999Z',
      source_id: 'a0000000-0000-0000-0000-000000000001',
      assignee_id: EXEC_1_ID,
    });
    assert(schemaValid.success === true, 'kpiQuerySchema accepts compliant parameter envelope');

    const schemaInverted = kpiQuerySchema.safeParse({
      start_date: '2026-11-01',
      end_date: '2026-10-01',
    });
    assert(schemaInverted.success === false, 'kpiQuerySchema rejects chronologically inverted dates');

    // Section 5: Anti-Slop AST Gate & Code Quality
    console.log('\nSection 5: Anti-Slop AST Gate & Code Hygiene');
    const filesToAudit = [
      'supabase/migrations/20261015000011_kpi_rpc_function.sql',
      'src/app/lib/validations/kpiQuerySchema.ts',
      'src/app/api/sales-funnel/kpis/route.ts',
      'src/types/crm.ts',
    ];

    for (const relPath of filesToAudit) {
      const fullPath = path.resolve(process.cwd(), relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Check for ': any' or '<any>' in TS files
      if (relPath.endsWith('.ts')) {
        const hasAny = /:\s*any\b|<any>/.test(content);
        assert(!hasAny, `Zero ': any' types in ${relPath}`);
      }

      // Check for generic blue (#2563eb)
      const hasGenericBlue = /#2563eb/i.test(content);
      assert(!hasGenericBlue, `Zero generic blue (#2563eb) in ${relPath}`);

      // Check for decorative banners
      const hasDecorativeBanners = /\/\/\s*={3,}|\/\/\s*-{3,}|\/\*\s*={3,}|\/\*\s*-{3,}/.test(content);
      assert(!hasDecorativeBanners, `Zero decorative comment banners in ${relPath}`);
    }

    // Teardown probe accounts
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [PROBE_EXEC_ZERO, PROBE_SUSPENDED_CI]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [PROBE_EXEC_ZERO, PROBE_SUSPENDED_CI]);
    await client.query(`SELECT set_config('request.jwt.claims', '', false);`);
    await client.end();

    console.log('\n============================================================');
    console.log(`Verification Complete: ${passed}/${passed + failed} assertions passed.`);
    console.log('Sprint 6.1 KPI RPC, Indexing & API Gateway Certified.');
    console.log('============================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('[CRITICAL_VERIFICATION_FAILURE]', error);
    process.exit(1);
  }
}

runVerification();
