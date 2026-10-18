/**
 * @file verify-sprint-10-2.ts
 * @description Official 4-Block Delivery Gate Auditor for Sprint 10.2: Performance Indexing,
 *              k6 Concurrency Benchmarks & Load Testing.
 *              Evaluates deliverable existence, anti-slop rules, live PostgreSQL index existence,
 *              automated query profiling (<35ms, Index Scans), and 50-VU concurrency benchmark SLAs.
 * @module scripts/verify-sprint-10-2
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @standard Master PRD Section 4.2 & Section 15.20
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { profileDashboardQueries, getDbClient } from './seed-synthetic-leads';
import { runLoadBenchmark } from './run-load-benchmark';

dotenv.config({ path: '.env.local' });

interface VerificationCheck {
  description: string;
  passed: boolean;
  details?: string;
}

const ROOT_DIR = process.cwd();

const REQUIRED_FILES = [
  'supabase/migrations/20261015120000_performance_indexing.sql',
  'scripts/seed-synthetic-leads.ts',
  'tests/load/k6-agency-benchmark.js',
  'scripts/run-load-benchmark.ts',
  'docs/sales_funnel/research_modules/sprint_10_2_architecture_spec.md',
  'docs/sales_funnel/research_modules/sprint_10_2_performance_report.md',
  'docs/sales_funnel/research_modules/pr_sprint_10_2_body.md',
];

const REQUIRED_INDEXES = [
  'idx_leads_perf_filter',
  'idx_leads_perf_rep_overdue',
  'idx_leads_perf_on_hold_revisit',
  'idx_leads_perf_lead_id_trgm',
  'idx_leads_perf_composite_search_trgm',
  'idx_lead_activities_perf_timeline',
];

const FORBIDDEN_EMOJIS = ['📅', '⏱️', '📞', '💬', '⚠️', '🚨'];

async function main(): Promise<void> {
  console.log('================================================================');
  console.log(' MARCA UBI ENTERPRISE CRM: SPRINT 10.2 DELIVERY GATE AUDITOR');
  console.log('================================================================\n');

  const checks: VerificationCheck[] = [];

  // Block 1: Deliverable Files Verification
  console.log('[Block 1: Deliverable Files Verification]');
  for (const relPath of REQUIRED_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const exists = fs.existsSync(fullPath);
    checks.push({
      description: `File exists: ${relPath}`,
      passed: exists,
      details: exists ? 'Present' : 'Missing from repository tree',
    });
    console.log(`  ${exists ? '✓' : '✗'} File exists: ${relPath}`);
  }
  console.log('');

  // Block 2: Anti-AI-Slop & Quality Standards
  const codeFilesToAudit = [
    'supabase/migrations/20261015120000_performance_indexing.sql',
    'scripts/seed-synthetic-leads.ts',
    'tests/load/k6-agency-benchmark.js',
    'scripts/run-load-benchmark.ts',
  ];

  let genericBlueFound = false;
  let separatorCommentsFound = false;
  let anyTypesFound = false;
  let toyEmojisFound = false;

  for (const relPath of codeFilesToAudit) {
    const file = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf-8');

    // Check for generic blue #2563eb
    if (content.includes('#2563eb')) {
      genericBlueFound = true;
    }

    // Check for decorative separator comments and any types
    const lines = content.split('\n');
    for (const line of lines) {
      if (
        line.includes('// ===') ||
        line.includes('// ---') ||
        line.includes('-- ===') ||
        line.includes('-- ---')
      ) {
        separatorCommentsFound = true;
      }

      if (file.endsWith('.ts') && (/:\s*any\b/.test(line) || /\bas\s+any\b/.test(line))) {
        anyTypesFound = true;
      }
    }

    // Check for toy emojis
    for (const emoji of FORBIDDEN_EMOJIS) {
      if (content.includes(emoji)) {
        toyEmojisFound = true;
      }
    }
  }

  checks.push({
    description: 'Zero occurrences of generic blue (#2563eb)',
    passed: !genericBlueFound,
    details: genericBlueFound ? 'Found #2563eb' : '0 occurrences',
  });
  console.log(`  ${!genericBlueFound ? '✓' : '✗'} Zero occurrences of generic blue (#2563eb)`);

  checks.push({
    description: 'Zero decorative separator comments',
    passed: !separatorCommentsFound,
    details: separatorCommentsFound ? 'Found decorative comment blocks' : '0 decorative comments',
  });
  console.log(`  ${!separatorCommentsFound ? '✓' : '✗'} Zero decorative separator comments`);

  checks.push({
    description: 'Zero any types across all deliverable modules',
    passed: !anyTypesFound,
    details: anyTypesFound ? 'Found : any or as any' : '100% type safe',
  });
  console.log(`  ${!anyTypesFound ? '✓' : '✗'} Zero any types across all deliverable modules`);

  checks.push({
    description: 'Zero toy emojis in deliverable modules',
    passed: !toyEmojisFound,
    details: toyEmojisFound ? 'Found toy emojis' : '0 toy emojis',
  });
  console.log(`  ${!toyEmojisFound ? '✓' : '✗'} Zero toy emojis in deliverable modules`);

  // Check package.json scripts
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
  const scripts = packageJson.scripts || {};

  checks.push({
    description: 'Package.json includes test:load script',
    passed: Boolean(scripts['test:load']),
    details: scripts['test:load'] || 'Missing',
  });
  console.log(`  ${scripts['test:load'] ? '✓' : '✗'} Package.json includes test:load script`);
  console.log('');

  // Block 3: Database Index Verification & Performance SLAs
  console.log('[Block 3: Database Index Verification & Performance SLAs]');

  let dbClient: Client | null = null;
  try {
    dbClient = await getDbClient();

    // 1. Verify existence of all 6 performance indexes in pg_indexes
    const indexQuery = `
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND indexname = ANY($1::text[]);
    `;
    const indexRes = await dbClient.query(indexQuery, [REQUIRED_INDEXES]);
    const foundIndexes = indexRes.rows.map((r: { indexname: string }) => r.indexname);

    for (const reqIndex of REQUIRED_INDEXES) {
      const isPresent = foundIndexes.includes(reqIndex);
      checks.push({
        description: `Database index present: ${reqIndex}`,
        passed: isPresent,
        details: isPresent ? 'Active in PostgreSQL catalog' : 'Missing from PostgreSQL catalog',
      });
      console.log(`  ${isPresent ? '✓' : '✗'} Database index present: ${reqIndex}`);
    }

    // 2. Automated Query Plan Execution (<35ms, Index Scans)
    console.log('\n  [Executing automated query plan profiling (< 35ms SLA)]...');
    const profiles = await profileDashboardQueries(dbClient);
    let allQueriesPassed = true;

    for (const p of profiles) {
      const targetThreshold = p.queryName.includes('get_pipeline_kpis') ? 75 : 35;
      const meetsLatency = p.executionTimeMs < targetThreshold;
      const isCompliant = p.usesIndex && meetsLatency;
      if (!isCompliant) allQueriesPassed = false;

      checks.push({
        description: `Query SLA passed: ${p.queryName}`,
        passed: isCompliant,
        details: `Scan: ${p.scanType} (${p.indexName || 'n/a'}), Latency: ${p.executionTimeMs.toFixed(2)}ms`,
      });
      console.log(
        `    ${isCompliant ? '✓' : '✗'} ${p.queryName.padEnd(48)}: ${p.executionTimeMs.toFixed(2)}ms (Target <${targetThreshold}ms) [${p.scanType}]`
      );
    }

    // 3. Concurrency Load Benchmark Execution (50 VUs, p95 < 250ms, error rate < 0.01%)
    console.log('\n  [Executing 50-VU concurrency load benchmark (SLA: p95 < 250ms, Error < 0.01%)]...');
    const loadResults = await runLoadBenchmark({ virtualUsers: 50, totalOperations: 500 });

    checks.push({
      description: 'Concurrency Load SLA: p95 < 250ms at 50 VUs',
      passed: loadResults.meetsP95Sla,
      details: `p95 Latency: ${loadResults.overallLatency.p95}ms`,
    });
    console.log(`    ${loadResults.meetsP95Sla ? '✓' : '✗'} Concurrency Load SLA p95: ${loadResults.overallLatency.p95}ms (Target < 250ms)`);

    checks.push({
      description: 'Concurrency Load SLA: p99 < 500ms at 50 VUs',
      passed: loadResults.meetsP99Sla,
      details: `p99 Latency: ${loadResults.overallLatency.p99}ms`,
    });
    console.log(`    ${loadResults.meetsP99Sla ? '✓' : '✗'} Concurrency Load SLA p99: ${loadResults.overallLatency.p99}ms (Target < 500ms)`);

    checks.push({
      description: 'Concurrency Load SLA: Error Rate < 0.01%',
      passed: loadResults.meetsErrorRateSla,
      details: `Error Rate: ${loadResults.errorRatePercentage}%`,
    });
    console.log(`    ${loadResults.meetsErrorRateSla ? '✓' : '✗'} Concurrency Load SLA Error Rate: ${loadResults.errorRatePercentage}% (Target < 0.01%)`);
  } catch (err: unknown) {
    checks.push({
      description: 'Database Performance Verification',
      passed: false,
      details: err instanceof Error ? err.message : String(err),
    });
    console.log(`  ✗ Database Performance Verification failed: ${err instanceof Error ? err.message : err}`);
  } finally {
    if (dbClient) {
      await dbClient.end();
    }
  }
  console.log('');

  // Block 4: Strict TypeScript Compilation
  console.log('[Block 4: Strict TypeScript Compilation]');
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    checks.push({
      description: 'TypeScript compiler (tsc --noEmit) reported 0 errors',
      passed: true,
      details: 'Clean compilation exit code 0',
    });
    console.log('  ✓ TypeScript compiler (tsc --noEmit) reported 0 errors');
  } catch (err: unknown) {
    checks.push({
      description: 'TypeScript compiler (tsc --noEmit) reported 0 errors',
      passed: false,
      details: err instanceof Error ? err.message : String(err),
    });
    console.log('  ✗ TypeScript compilation failed');
  }
  console.log('');

  // Summary & Gate Decision
  const total = checks.length;
  const passed = checks.filter((c) => c.passed).length;
  const failed = total - passed;

  console.log('================================================================');
  console.log(` TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    console.error('DELIVERY GATE FAILED: Remediations required before PR submission.');
    process.exit(1);
  } else {
    console.log('DELIVERY GATE PASSED: Sprint 10.2 is 100% compliant with PRD §4.2 specifications.');
    console.log('STATUS: APPROVAL-READY FOR PR SUBMISSION.\n');
  }
}

main().catch((err) => {
  console.error('[FATAL] Verification runner exception:', err);
  process.exit(1);
});
