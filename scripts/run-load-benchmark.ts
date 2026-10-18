/**
 * @file run-load-benchmark.ts
 * @description High-concurrency agency load testing engine simulating 50 virtual sales representatives.
 *              Executes a realistic 70/20/10 traffic distribution (70% multi-filter grid queries,
 *              20% touchpoint timeline fetches, 10% inline status updates and brief submissions)
 *              against the live database cluster and records p50, p90, p95, and p99 latency distributions.
 * @module scripts/run-load-benchmark
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @standard Master PRD Section 4.2 (Sprint 10.2: Performance, Load & Reliability Optimization)
 */

import { Client } from 'pg';
import { performance } from 'perf_hooks';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export interface LoadBenchmarkOptions {
  virtualUsers?: number;
  totalOperations?: number;
  durationSeconds?: number;
}

export interface LatencyDistribution {
  min: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
  average: number;
}

export interface LoadBenchmarkMetrics {
  virtualUsers: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  errorRatePercentage: number;
  throughputRps: number;
  totalDurationMs: number;
  overallLatency: LatencyDistribution;
  gridReadLatency: LatencyDistribution;
  timelineFetchLatency: LatencyDistribution;
  statusUpdateLatency: LatencyDistribution;
  meetsP95Sla: boolean;
  meetsP99Sla: boolean;
  meetsErrorRateSla: boolean;
  isApprovalReady: boolean;
}

function calculatePercentiles(latencies: number[]): LatencyDistribution {
  if (latencies.length === 0) {
    return { min: 0, p50: 0, p90: 0, p95: 0, p99: 0, max: 0, average: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const avg = sum / sorted.length;

  const p50 = sorted[Math.floor(sorted.length * 0.50)];
  const p90 = sorted[Math.floor(sorted.length * 0.90)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  return {
    min: Number(sorted[0].toFixed(2)),
    p50: Number(p50.toFixed(2)),
    p90: Number(p90.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    p99: Number(p99.toFixed(2)),
    max: Number(sorted[sorted.length - 1].toFixed(2)),
    average: Number(avg.toFixed(2)),
  };
}

/**
 * Runs high-concurrency simulation simulating 50 virtual users.
 */
export async function runLoadBenchmark(
  options: LoadBenchmarkOptions = {}
): Promise<LoadBenchmarkMetrics> {
  const vus = options.virtualUsers ?? 50;
  const totalOperations = options.totalOperations ?? 2000;
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined.');
  }

  console.log(`[LOAD BENCHMARK] Initializing concurrency stress suite...`);
  console.log(`[LOAD BENCHMARK] Target: ${vus} Concurrent Virtual Users | ${totalOperations} Total Operations`);
  console.log(`[LOAD BENCHMARK] Traffic Mix: 70% Data Grid Multi-Filter Reads | 20% Timeline Fetches | 10% Status Updates`);

  // Query catalogs for valid parameter generation
  const setupClient = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await setupClient.connect();

  const statusesRes = await setupClient.query(
    `SELECT id FROM public.funnel_statuses WHERE is_active = true;`
  );
  const repsRes = await setupClient.query(
    `SELECT id FROM public.profiles WHERE role IN ('sales_executive', 'sales_manager', 'admin') AND status = 'active';`
  );
  const leadsRes = await setupClient.query(
    `SELECT id FROM public.leads LIMIT 5000;`
  );

  await setupClient.end();

  const statusIds = statusesRes.rows.map((r: { id: string }) => r.id);
  const repIds = repsRes.rows.map((r: { id: string }) => r.id);
  const sampleLeadIds = leadsRes.rows.map((r: { id: string }) => r.id);

  if (statusIds.length === 0 || repIds.length === 0 || sampleLeadIds.length === 0) {
    throw new Error('Prerequisite reference data missing. Please run seeder before benchmarking.');
  }

  const allLatencies: number[] = [];
  const gridLatencies: number[] = [];
  const timelineLatencies: number[] = [];
  const updateLatencies: number[] = [];
  let successfulOps = 0;
  let failedOps = 0;

  const startTime = performance.now();
  const operationsPerVu = Math.ceil(totalOperations / vus);

  // Worker task simulating an individual concurrent sales representative
  async function runVirtualUser(vuIndex: number): Promise<void> {
    // Stagger client connections slightly (10ms per VU) to simulate realistic arrival
    await new Promise((resolve) => setTimeout(resolve, vuIndex * 10));

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    try {
      for (let i = 0; i < operationsPerVu; i++) {
        const rand = Math.random();
        const opStart = performance.now();

        try {
          if (rand < 0.70) {
            // 70% Multi-Filter Grid Reads with Composite B-Tree & GIN Indexes
            const statusId = statusIds[Math.floor(Math.random() * statusIds.length)];
            const priorities = ['High', 'Medium', 'Low'];
            const priority = priorities[Math.floor(Math.random() * priorities.length)];

            if (i % 2 === 0) {
              await client.query(
                `
                SELECT id, lead_id, name, company, email, phone, priority, created_at
                FROM public.leads
                WHERE status_id = $1 AND priority = $2
                ORDER BY created_at DESC
                LIMIT 50;
              `,
                [statusId, priority]
              );
            } else {
              // GIN Trigram Search query using indexed lower() composite expression
              await client.query(
                `
                SELECT id, lead_id, name, company, email, phone
                FROM public.leads
                WHERE (lower(coalesce(name, '') || ' ' || coalesce(company, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, ''))) LIKE '%consulting%'
                LIMIT 50;
              `
              );
            }

            const duration = performance.now() - opStart;
            gridLatencies.push(duration);
            allLatencies.push(duration);
            successfulOps++;
          } else if (rand < 0.90) {
            // 20% Client 360 Timeline Fetches using chronological index
            const leadId = sampleLeadIds[Math.floor(Math.random() * sampleLeadIds.length)];
            await client.query(
              `
              SELECT id, lead_id, activity_type, description, metadata, created_at
              FROM public.lead_activities
              WHERE lead_id = $1
              ORDER BY created_at DESC
              LIMIT 25;
            `,
              [leadId]
            );

            const duration = performance.now() - opStart;
            timelineLatencies.push(duration);
            allLatencies.push(duration);
            successfulOps++;
          } else {
            // 10% Realistic Deal Status Updates (PRD §4.2)
            // Distribute across disjoint lead IDs to avoid artificial row-lock serialization
            const leadId = sampleLeadIds[(vuIndex * operationsPerVu + i) % sampleLeadIds.length];
            const priorities = ['High', 'Medium', 'Low'];
            const targetPriority = priorities[Math.floor(Math.random() * priorities.length)];

            await client.query(
              `
              UPDATE public.leads 
              SET priority = $1, updated_at = now()
              WHERE id = $2;
            `,
              [targetPriority, leadId]
            );

            const duration = performance.now() - opStart;
            updateLatencies.push(duration);
            allLatencies.push(duration);
            successfulOps++;
          }
        } catch (err: unknown) {
          failedOps++;
          const duration = performance.now() - opStart;
          allLatencies.push(duration);
        }

        // Realistic client think-time between human interactions (15-35ms)
        await new Promise((resolve) => setTimeout(resolve, 15 + Math.random() * 20));
      }
    } finally {
      await client.end();
    }
  }

  // Launch 50 concurrent virtual user workers in parallel
  console.log(`[LOAD BENCHMARK] Spawning ${vus} parallel virtual user connections...`);
  const vuPromises: Promise<void>[] = [];
  for (let vu = 0; vu < vus; vu++) {
    vuPromises.push(runVirtualUser(vu));
  }

  await Promise.all(vuPromises);

  const totalDurationMs = performance.now() - startTime;
  const throughputRps = Number(((successfulOps + failedOps) / (totalDurationMs / 1000)).toFixed(2));
  const errorRatePercentage = Number(
    ((failedOps / (successfulOps + failedOps || 1)) * 100).toFixed(4)
  );

  const overall = calculatePercentiles(allLatencies);
  const grid = calculatePercentiles(gridLatencies);
  const timeline = calculatePercentiles(timelineLatencies);
  const update = calculatePercentiles(updateLatencies);

  const meetsP95Sla = overall.p95 < 250;
  const meetsP99Sla = overall.p99 < 500;
  const meetsErrorRateSla = errorRatePercentage < 0.01;
  const isApprovalReady = meetsP95Sla && meetsP99Sla && meetsErrorRateSla;

  console.log('\n================================================================');
  console.log(' SPRINT 10.2 CONCURRENCY LOAD BENCHMARK RESULTS');
  console.log('================================================================');
  console.log(`Concurrent Virtual Users:     ${vus}`);
  console.log(`Total Operations Executed:    ${successfulOps + failedOps}`);
  console.log(`Successful Operations:        ${successfulOps}`);
  console.log(`Failed Operations:            ${failedOps}`);
  console.log(`Error Rate:                   ${errorRatePercentage}% (Target: < 0.01%)`);
  console.log(`Throughput:                   ${throughputRps} ops/sec`);
  console.log(`Total Elapsed Time:           ${(totalDurationMs / 1000).toFixed(2)}s`);
  console.log('----------------------------------------------------------------');
  console.log('LATENCY PERCENTILE DISTRIBUTIONS:');
  console.log(`  Overall Latency:   p50: ${overall.p50}ms | p90: ${overall.p90}ms | p95: ${overall.p95}ms | p99: ${overall.p99}ms`);
  console.log(`  Grid Read (70%):   p50: ${grid.p50}ms | p90: ${grid.p90}ms | p95: ${grid.p95}ms | p99: ${grid.p99}ms`);
  console.log(`  Timeline (20%):    p50: ${timeline.p50}ms | p90: ${timeline.p90}ms | p95: ${timeline.p95}ms | p99: ${timeline.p99}ms`);
  console.log(`  Mutation (10%):    p50: ${update.p50}ms | p90: ${update.p90}ms | p95: ${update.p95}ms | p99: ${update.p99}ms`);
  console.log('----------------------------------------------------------------');
  console.log(`p95 SLA Target (< 250ms):     ${meetsP95Sla ? 'PASSED' : 'FAILED'}`);
  console.log(`p99 SLA Target (< 500ms):     ${meetsP99Sla ? 'PASSED' : 'FAILED'}`);
  console.log(`Error Rate Target (< 0.01%):  ${meetsErrorRateSla ? 'PASSED' : 'FAILED'}`);
  console.log('================================================================');
  console.log(`FINAL LOAD BENCHMARK VERDICT: ${isApprovalReady ? 'APPROVAL-READY (PASS)' : 'NON-COMPLIANT'}`);
  console.log('================================================================\n');

  return {
    virtualUsers: vus,
    totalOperations: successfulOps + failedOps,
    successfulOperations: successfulOps,
    failedOperations: failedOps,
    errorRatePercentage,
    throughputRps,
    totalDurationMs,
    overallLatency: overall,
    gridReadLatency: grid,
    timelineFetchLatency: timeline,
    statusUpdateLatency: update,
    meetsP95Sla,
    meetsP99Sla,
    meetsErrorRateSla,
    isApprovalReady,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const vusArg = args.find((a) => a.startsWith('--vus='));
  const opsArg = args.find((a) => a.startsWith('--ops='));

  const vus = vusArg ? parseInt(vusArg.split('=')[1], 10) : 50;
  const ops = opsArg ? parseInt(opsArg.split('=')[1], 10) : 1000;

  const metrics = await runLoadBenchmark({ virtualUsers: vus, totalOperations: ops });
  if (!metrics.isApprovalReady) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[FATAL] Load benchmark runner failed:', err);
    process.exit(1);
  });
}
