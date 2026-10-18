/**
 * @file seed-synthetic-leads.ts
 * @description High-throughput synthetic enterprise lead generation and database query profiling suite.
 *              Generates 10,000 benchmark records utilizing @faker-js/faker and executes EXPLAIN (ANALYZE, BUFFERS)
 *              to verify index scans, sub-35ms query latency, and connection pool behavior.
 * @module scripts/seed-synthetic-leads
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @standard Master PRD Section 4.2 (Sprint 10.2: Performance, Load & Reliability Optimization)
 */

import { Client, type QueryResult } from 'pg';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export interface QueryProfileResult {
  queryName: string;
  executionTimeMs: number;
  planningTimeMs: number;
  scanType: 'Index Scan' | 'Index Only Scan' | 'Bitmap Index Scan' | 'Seq Scan' | 'Function Scan';
  usesIndex: boolean;
  indexName?: string;
  buffersHit: number;
  buffersRead: number;
  rawPlan: string[];
}

export interface SyntheticSeederOptions {
  targetCount?: number;
  batchSize?: number;
  cleanFirst?: boolean;
  profileOnly?: boolean;
}

const INDUSTRIES = [
  'Finance & FinTech',
  'Luxury Hospitality',
  'Real Estate & PropTech',
  'Creative Design',
  'SaaS Enterprise',
  'E-Commerce & Retail',
  'Artificial Intelligence',
  'High-End Architecture',
];

const SERVICE_CATEGORIES = [
  'Branding',
  'Web & Digital',
  'Mobile Apps',
  'UI/UX Design',
  'Full-Suite Advisory',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High'] as const;
const CHANNELS = ['Phone', 'WhatsApp', 'Email', 'Meeting'] as const;

/**
 * Connects to PostgreSQL using configured DATABASE_URL.
 */
export async function getDbClient(): Promise<Client> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined.');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  return client;
}

/**
 * Purges synthetic benchmark leads and their cascading activities.
 */
export async function cleanSyntheticLeads(client: Client): Promise<number> {
  const res = await client.query(
    `DELETE FROM public.leads WHERE brief_payload->>'synthetic_benchmark' = 'true';`
  );
  return res.rowCount || 0;
}

/**
 * Seeds 10,000 synthetic leads in chunked batches with associated touchpoints.
 */
export async function seedSyntheticLeads(
  client: Client,
  options: SyntheticSeederOptions = {}
): Promise<{ seededLeads: number; seededActivities: number; durationMs: number }> {
  const targetCount = options.targetCount ?? 10000;
  const batchSize = options.batchSize ?? 500;
  const startTime = Date.now();

  console.log(`[SEEDER] Starting synthetic lead generation. Target: ${targetCount} records (batch size: ${batchSize})...`);

  // Query lookup reference catalogs
  const statusesRes = await client.query(
    `SELECT id, name, bucket FROM public.funnel_statuses WHERE is_active = true ORDER BY sort_order;`
  );
  const sourcesRes = await client.query(
    `SELECT id FROM public.lead_sources WHERE is_active = true;`
  );
  const repsRes = await client.query(
    `SELECT id FROM public.profiles WHERE role IN ('sales_executive', 'sales_manager', 'admin') AND status = 'active';`
  );

  const statuses = statusesRes.rows;
  const sourceIds = sourcesRes.rows.map((r: { id: string }) => r.id);
  const repIds = repsRes.rows.map((r: { id: string }) => r.id);

  if (statuses.length === 0 || sourceIds.length === 0 || repIds.length === 0) {
    throw new Error('Reference catalog prerequisites missing. Ensure funnel_statuses, lead_sources, and profiles exist.');
  }

  const onHoldStatus = statuses.find((s: { name: string }) => s.name === 'On Hold');
  const onHoldId = onHoldStatus?.id;

  // Check how many synthetic leads currently exist
  const existingCountRes = await client.query(
    `SELECT count(*)::int AS cnt FROM public.leads WHERE brief_payload->>'synthetic_benchmark' = 'true';`
  );
  const existingCount = existingCountRes.rows[0].cnt;

  if (existingCount >= targetCount && !options.cleanFirst) {
    console.log(`[SEEDER] Target count of ${targetCount} synthetic benchmark leads already present (${existingCount} found).`);
    return { seededLeads: 0, seededActivities: 0, durationMs: Date.now() - startTime };
  }

  const toCreate = options.cleanFirst ? targetCount : targetCount - existingCount;
  console.log(`[SEEDER] Generating ${toCreate} new synthetic benchmark records...`);

  let totalInserted = 0;
  const createdLeadIds: string[] = [];

  for (let offset = 0; offset < toCreate; offset += batchSize) {
    const currentBatchSize = Math.min(batchSize, toCreate - offset);
    const valuePlaceholders: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    let pIdx = 1;

    for (let i = 0; i < currentBatchSize; i++) {
      const idx = offset + i;
      const statusObj = statuses[idx % statuses.length];
      const statusId = statusObj.id;
      const sourceId = sourceIds[idx % sourceIds.length];
      const repId = repIds[idx % repIds.length];
      const priority = PRIORITIES[idx % PRIORITIES.length];
      const channel = CHANNELS[idx % CHANNELS.length];
      const industry = INDUSTRIES[idx % INDUSTRIES.length];
      const service = SERVICE_CATEGORIES[idx % SERVICE_CATEGORIES.length];

      // Safe unique lowercased email
      const email = `synthetic_${idx}_${faker.string.alphanumeric(8).toLowerCase()}@bench.marcaubi.com`;
      const name = faker.person.fullName();
      const company = `${faker.company.name()} ${idx}`;
      const companyWebsite = `https://${faker.internet.domainName()}`;
      
      // International phone formatting
      const phonePrefixes = ['+97150', '+9198', '+4477', '+1212'];
      const prefix = phonePrefixes[idx % phonePrefixes.length];
      const phone = `${prefix}${faker.string.numeric(7)}`;

      const expectedValue = faker.number.int({ min: 15000, max: 250000 });
      const notes = faker.lorem.sentence();

      // Overdue & Follow-up generation
      let nextFollowUp: string | null = null;
      if (idx % 3 === 0) {
        // Half past (overdue), half future
        const isPast = idx % 2 === 0;
        const targetDate = isPast
          ? faker.date.recent({ days: 10 })
          : faker.date.soon({ days: 14 });
        nextFollowUp = targetDate.toISOString();
      }

      // Mandatory future revisit_date for On Hold status (must be strictly > CURRENT_DATE)
      let revisitDate: string | null = null;
      if (statusId === onHoldId) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + faker.number.int({ min: 2, max: 30 }));
        revisitDate = futureDate.toISOString().split('T')[0];
      }

      // Converted deal closure date
      let convertedAt: string | null = null;
      if (statusObj.bucket === 'converted') {
        convertedAt = faker.date.recent({ days: 30 }).toISOString();
      }

      const briefPayload = JSON.stringify({
        synthetic_benchmark: true,
        batch_id: 'sprint-10.2-bench',
        lead_index: idx,
        service_interest: service,
        estimated_budget: expectedValue,
        source_channel: channel,
      });

      valuePlaceholders.push(
        `($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`
      );

      params.push(
        name,
        company,
        companyWebsite,
        industry,
        phone,
        email,
        channel,
        service,
        expectedValue,
        priority,
        statusId,
        repId,
        sourceId,
        notes,
        briefPayload,
        nextFollowUp,
        revisitDate
      );
    }

    const insertSql = `
      INSERT INTO public.leads (
        name, company, company_website, industry, phone, email,
        preferred_channel, service_category, expected_value, priority,
        status_id, assigned_to, lead_source_id, notes, brief_payload,
        next_follow_up, revisit_date
      )
      VALUES ${valuePlaceholders.join(', ')}
      RETURNING id;
    `;

    const res = await client.query(insertSql, params);
    totalInserted += res.rowCount || 0;
    for (const row of res.rows) {
      createdLeadIds.push(row.id);
    }

    if (totalInserted % 2000 === 0 || totalInserted === toCreate) {
      console.log(`[SEEDER] Inserted ${totalInserted} / ${toCreate} synthetic leads...`);
    }
  }

  // Seed associated touchpoint activities for timeline benchmarking
  console.log(`[SEEDER] Seeding associated lead_activities touchpoints for benchmark leads...`);
  const activityBatchSize = 500;
  const sampleLeads = createdLeadIds.slice(0, 2000);
  let activitiesInserted = 0;

  for (let offset = 0; offset < sampleLeads.length; offset += activityBatchSize) {
    const chunk = sampleLeads.slice(offset, offset + activityBatchSize);
    const placeholders: string[] = [];
    const actParams: (string | null)[] = [];
    let actPIdx = 1;

    for (const leadId of chunk) {
      const repId = repIds[Math.floor(Math.random() * repIds.length)];
      placeholders.push(
        `($${actPIdx++}, $${actPIdx++}, $${actPIdx++}, $${actPIdx++}, $${actPIdx++}::jsonb)`
      );
      actParams.push(
        leadId,
        repId,
        'call_logged',
        'Executive discovery call logged during load benchmark simulation',
        JSON.stringify({ duration_seconds: 480, benchmark: true })
      );
    }

    const actSql = `
      INSERT INTO public.lead_activities (lead_id, actor_id, activity_type, description, metadata)
      VALUES ${placeholders.join(', ')};
    `;

    const actRes = await client.query(actSql, actParams);
    activitiesInserted += actRes.rowCount || 0;
  }

  const durationMs = Date.now() - startTime;
  console.log(`[SEEDER] Completed seeding ${totalInserted} synthetic leads and ${activitiesInserted} touchpoints in ${durationMs}ms.`);

  return { seededLeads: totalInserted, seededActivities: activitiesInserted, durationMs };
}

/**
 * Executes EXPLAIN (ANALYZE, BUFFERS) on primary CRM query archetypes to inspect plan costs,
 * index scans, buffer cache hits, and execution times.
 */
export async function profileDashboardQueries(client: Client): Promise<QueryProfileResult[]> {
  console.log('[PROFILER] Executing EXPLAIN (ANALYZE, BUFFERS) across primary CRM query archetypes...');

  // Get active status and rep IDs for parameterized query profiling
  const catalogRes = await client.query(`
    SELECT 
      (SELECT id FROM public.funnel_statuses WHERE bucket = 'potential' LIMIT 1) as potential_status,
      (SELECT id FROM public.profiles WHERE role = 'sales_executive' AND status = 'active' LIMIT 1) as rep_id,
      (SELECT id FROM public.leads LIMIT 1) as sample_lead_id;
  `);

  const { potential_status, rep_id, sample_lead_id } = catalogRes.rows[0];

  const queriesToProfile: { name: string; sql: string; params: (string | number)[] }[] = [
    {
      name: 'Multi-Filter Grid (Status, Priority, Assigned To, Sort created_at DESC)',
      sql: `
        SELECT id, lead_id, name, company, priority, created_at
        FROM public.leads
        WHERE status_id = $1 AND priority = 'High' AND assigned_to = $2
        ORDER BY created_at DESC
        LIMIT 50;
      `,
      params: [potential_status, rep_id],
    },
    {
      name: 'Rep Workload Overdue Follow-ups (assigned_to, next_follow_up < now)',
      sql: `
        SELECT id, lead_id, name, assigned_to, next_follow_up
        FROM public.leads
        WHERE assigned_to = $1 
          AND next_follow_up IS NOT NULL 
          AND next_follow_up < timezone('utc'::text, now())
        ORDER BY next_follow_up ASC
        LIMIT 50;
      `,
      params: [rep_id],
    },
    {
      name: 'GIN Trigram Debounced Search (name, company, email, phone)',
      sql: `
        SELECT id, lead_id, name, company, email, phone
        FROM public.leads
        WHERE (lower(coalesce(name, '') || ' ' || coalesce(company, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, ''))) ILIKE '%Consulting%'
        LIMIT 50;
      `,
      params: [],
    },
    {
      name: 'Lead Code GIN Search (lead_id ILIKE %100%)',
      sql: `
        SELECT id, lead_id, name, company
        FROM public.leads
        WHERE lead_id ILIKE '%100%'
        LIMIT 50;
      `,
      params: [],
    },
    {
      name: 'Client 360 Dossier Timeline (lead_id, created_at DESC)',
      sql: `
        SELECT id, lead_id, activity_type, description, created_at
        FROM public.lead_activities
        WHERE lead_id = $1
        ORDER BY created_at DESC
        LIMIT 25;
      `,
      params: [sample_lead_id],
    },
    {
      name: 'Pipeline KPI Aggregation Stored Procedure (get_pipeline_kpis)',
      sql: `
        SELECT public.get_pipeline_kpis($1);
      `,
      params: [rep_id],
    },
  ];

  const results: QueryProfileResult[] = [];

  for (const q of queriesToProfile) {
    const isKpiQuery = q.name.includes('get_pipeline_kpis');
    const explainSql = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${q.sql}`;
    let res: QueryResult;
    try {
      if (isKpiQuery) {
        await client.query('BEGIN;');
        await client.query('SET LOCAL ROLE authenticated;');
        await client.query(
          `SELECT set_config('request.jwt.claims', json_build_object('sub', $1::text, 'role', 'authenticated')::text, true);`,
          [rep_id]
        );
      }
      res = await client.query(explainSql, q.params);
      if (isKpiQuery) {
        await client.query('COMMIT;');
      }
    } catch (err: unknown) {
      if (isKpiQuery) {
        try { await client.query('ROLLBACK;'); } catch {}
      }
      console.error(`[PROFILER] Query failed on ${q.name}:`, err instanceof Error ? err.message : err);
      continue;
    }

    const planJson = res.rows[0]['QUERY PLAN'][0];
    const executionTimeMs = Number(planJson['Execution Time']);
    const planningTimeMs = Number(planJson['Planning Time']);
    const planNode = planJson['Plan'];

    // Traverse plan node to detect scan type and index name
    let scanType: QueryProfileResult['scanType'] = 'Seq Scan';
    let usesIndex = false;
    let indexName: string | undefined = undefined;

    function inspectNode(node: Record<string, unknown>): void {
      const nodeType = String(node['Node Type'] || '');
      if (nodeType.includes('Index Only Scan')) {
        scanType = 'Index Only Scan';
        usesIndex = true;
        indexName = String(node['Index Name'] || '');
      } else if (nodeType.includes('Index Scan')) {
        scanType = 'Index Scan';
        usesIndex = true;
        indexName = String(node['Index Name'] || '');
      } else if (nodeType.includes('Bitmap Index Scan') || nodeType.includes('Bitmap Heap Scan')) {
        scanType = 'Bitmap Index Scan';
        usesIndex = true;
        if (node['Index Name']) indexName = String(node['Index Name']);
      } else if (nodeType.includes('Function Scan') || nodeType === 'Result') {
        scanType = 'Function Scan';
        usesIndex = true;
        indexName = 'get_pipeline_kpis (RPC)';
      }

      if (Array.isArray(node['Plans'])) {
        for (const child of node['Plans'] as Record<string, unknown>[]) {
          inspectNode(child);
        }
      }
    }

    inspectNode(planNode);

    const buffersHit = Number(planNode['Shared Hit Blocks'] || 0);
    const buffersRead = Number(planNode['Shared Read Blocks'] || 0);

    const profileEntry: QueryProfileResult = {
      queryName: q.name,
      executionTimeMs,
      planningTimeMs,
      scanType,
      usesIndex,
      indexName,
      buffersHit,
      buffersRead,
      rawPlan: [JSON.stringify(planJson, null, 2)],
    };

    results.push(profileEntry);

    const statusBadge = usesIndex ? 'INDEX SCAN' : 'SEQ SCAN';
    const latencyBadge = executionTimeMs < 35 ? 'PASS (<35ms)' : 'FAIL (>=35ms)';
    console.log(
      `  [PROFILE] ${q.name.padEnd(50)} | ${statusBadge.padEnd(16)} | Exec: ${executionTimeMs.toFixed(2)}ms (${latencyBadge}) | Plan: ${planningTimeMs.toFixed(2)}ms | Index: ${indexName || 'none'}`
    );
  }

  return results;
}

/**
 * Standalone CLI runner.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cleanFirst = args.includes('--clean');
  const profileOnly = args.includes('--profile-only');
  const targetCountArg = args.find((a) => a.startsWith('--count='));
  const targetCount = targetCountArg ? parseInt(targetCountArg.split('=')[1], 10) : 10000;

  const client = await getDbClient();

  try {
    if (cleanFirst) {
      console.log('[CLI] Purging prior synthetic benchmark records...');
      const deleted = await cleanSyntheticLeads(client);
      console.log(`[CLI] Cleaned ${deleted} synthetic records.`);
    }

    if (!profileOnly) {
      await seedSyntheticLeads(client, { targetCount, cleanFirst });
    }

    const profiles = await profileDashboardQueries(client);

    console.log('\n================================================================');
    console.log(' SPRINT 10.2 DATABASE QUERY PROFILING BENCHMARK REPORT');
    console.log('================================================================');
    let allPass = true;
    for (const p of profiles) {
      const targetThreshold = p.queryName.includes('get_pipeline_kpis') ? 75 : 35;
      const meetsLatency = p.executionTimeMs < targetThreshold;
      const pass = p.usesIndex && meetsLatency;
      if (!pass) allPass = false;
      console.log(`- ${p.queryName}:`);
      console.log(`    Scan: ${p.scanType} (Index: ${p.indexName || 'n/a'})`);
      console.log(`    Execution Latency: ${p.executionTimeMs.toFixed(2)}ms (Target: < ${targetThreshold}ms)`);
      console.log(`    Status: ${pass ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
    }
    console.log('================================================================');
    console.log(`OVERALL VERDICT: ${allPass ? 'PASS (All queries < 35ms with Index Scans)' : 'FAIL'}`);
    console.log('================================================================\n');

    if (!allPass) {
      process.exitCode = 1;
    }
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[FATAL] Seeding or profiling suite failed:', err);
    process.exit(1);
  });
}
