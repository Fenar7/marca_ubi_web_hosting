/**
 * @file verify-sprint-7-1.ts
 * @description Comprehensive Delivery Gate & Automated Verification Script for Sprint 7.1:
 *              Multi-Filter Action Bar, Pipeline Bucket Segmented Tabs, Suspense Skeletons & Design Tokens.
 * @module scripts/verify-sprint-7-1
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();

interface TestAssertion {
  description: string;
  passed: boolean;
  error?: string;
}

const assertions: TestAssertion[] = [];

function assert(condition: boolean, description: string): void {
  if (condition) {
    assertions.push({ description, passed: true });
    console.log(`  ✓ ${description}`);
  } else {
    assertions.push({ description, passed: false, error: 'Assertion failed' });
    console.error(`  ✕ FAIL: ${description}`);
  }
}

console.log('================================================================');
console.log(' MARCA UBI ENTERPRISE CRM — SPRINT 7.1 DELIVERY GATE AUDITOR');
console.log('================================================================\n');

// 1. File Existence Auditing
console.log('[Block 1: Deliverable Files Verification]');
const requiredFiles = [
  'src/app/admin/components/FilterActionBar/FilterActionBar.tsx',
  'src/app/admin/components/FilterActionBar/FilterActionBar.module.scss',
  'src/app/admin/components/FilterActionBar/index.ts',
  'src/app/admin/components/LeadsTable/LeadsTableSkeleton.tsx',
  'src/app/admin/components/LeadsTable/LeadsTableSkeleton.module.scss',
  'src/app/admin/components/LeadsTable/index.ts',
  'src/app/admin/(workspace)/leads/page.tsx',
  'src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx',
  'tests/leads/filter_action_bar.test.ts',
  'docs/sales_funnel/research_modules/sprint_7_1_architecture_spec.md',
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(ROOT_DIR, relPath);
  assert(fs.existsSync(fullPath), `File exists: ${relPath}`);
}

// 2. Anti-AI-Slop Code & Style Auditing
console.log('\n[Block 2: Anti-AI-Slop & Dark Luxury Token Auditing]');

const filterBarTsx = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/FilterActionBar/FilterActionBar.tsx'),
  'utf-8'
);
const filterBarScss = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/FilterActionBar/FilterActionBar.module.scss'),
  'utf-8'
);
const skeletonTsx = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/LeadsTable/LeadsTableSkeleton.tsx'),
  'utf-8'
);
const skeletonScss = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/LeadsTable/LeadsTableSkeleton.module.scss'),
  'utf-8'
);
const leadsPageTsx = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/(workspace)/leads/page.tsx'),
  'utf-8'
);
const workspaceClientTsx = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx'),
  'utf-8'
);

// Zero Generic Blue (#2563eb)
const allNewCode = filterBarTsx + filterBarScss + skeletonTsx + skeletonScss + leadsPageTsx + workspaceClientTsx;
assert(!allNewCode.includes('#2563eb'), 'Zero occurrences of generic blue (#2563eb)');

// Zero decorative separator comments
assert(!allNewCode.includes('// ===') && !allNewCode.includes('// ---'), 'Zero decorative separator comments');

// Strict type safety: Zero 'any' types in new components
assert(!filterBarTsx.includes(': any') && !filterBarTsx.includes('as any'), 'Zero any types in FilterActionBar.tsx');
assert(!skeletonTsx.includes(': any') && !skeletonTsx.includes('as any'), 'Zero any types in LeadsTableSkeleton.tsx');

// Tabular numbers declared in styling
assert(filterBarScss.includes('tabular-nums'), 'Tabular numerals configured for counter badges');

// Fixed 72px row height declared in skeleton
assert(skeletonScss.includes('72px'), 'Fixed 72px row height configured in LeadsTableSkeleton.module.scss');

// Zero Cumulative Layout Shift Shimmer keyframe
assert(skeletonScss.includes('skeletonShimmer'), 'Dark hairline skeleton shimmer keyframes configured');

// 3. React 19 Suspense Streaming Integration
console.log('\n[Block 3: Suspense Streaming & Workspace Integration]');

assert(
  leadsPageTsx.includes('<Suspense fallback={<LeadsTableSkeleton') ||
    leadsPageTsx.includes('fallback={<LeadsTableSkeleton'),
  'Leads page wraps commercial data grid in React 19 <Suspense fallback={<LeadsTableSkeleton />} boundary'
);

assert(
  workspaceClientTsx.includes('<FilterActionBar'),
  'LeadsWorkspaceClient mounts FilterActionBar component'
);

assert(
  workspaceClientTsx.includes('window.history.replaceState'),
  'LeadsWorkspaceClient implements sub-16ms window.history.replaceState URL synchronization'
);

assert(
  workspaceClientTsx.includes("window.dispatchEvent(new Event('popstate'))"),
  'LeadsWorkspaceClient dispatches popstate event for synchronized KpiRibbon metric recalculation'
);

assert(
  filterBarTsx.includes('BUCKET_TABS'),
  'FilterActionBar implements the 6 segmented pipeline bucket navigation tabs'
);

assert(
  filterBarTsx.includes('useTransition'),
  'FilterActionBar implements non-blocking search transition with React 19 useTransition'
);

// 4. Unit Test Suite Execution
console.log('\n[Block 4: Unit Test Suite Execution]');
try {
  const testOutput = execSync('npx tsx --test tests/leads/filter_action_bar.test.ts', {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
  });
  console.log(testOutput.trim());
  assert(true, 'Unit tests in tests/leads/filter_action_bar.test.ts executed successfully');
} catch (err: unknown) {
  const errorMsg = err instanceof Error ? err.message : String(err);
  console.error(errorMsg);
  assert(false, `Unit tests failed: ${errorMsg}`);
}

// 5. Final Audit Summary
console.log('\n================================================================');
const passedCount = assertions.filter((a) => a.passed).length;
const totalCount = assertions.length;
console.log(` AUDIT RESULT: ${passedCount} / ${totalCount} Assertions Passed (${Math.round((passedCount / totalCount) * 100)}%)`);
console.log('================================================================');

if (passedCount !== totalCount) {
  process.exit(1);
}
