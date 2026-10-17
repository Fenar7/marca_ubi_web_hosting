/**
 * @file verify-sprint-7-2.ts
 * @description Official 4-Block Delivery Gate Auditor for Sprint 7.2:
 *              Virtualized Data Grid, Inline Dropdowns with React 19 useOptimistic & Responsive Breakpoints.
 * @module scripts/verify-sprint-7-2
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
console.log(' MARCA UBI ENTERPRISE CRM — SPRINT 7.2 DELIVERY GATE AUDITOR');
console.log('================================================================\n');

// 1. File Existence Auditing
console.log('[Block 1: Deliverable Files Verification]');
const requiredFiles = [
  'src/app/actions/leadInlineActions.ts',
  'src/app/admin/components/LeadsTable/InlineStatusSelect.tsx',
  'src/app/admin/components/LeadsTable/InlineStatusSelect.module.scss',
  'src/app/admin/components/LeadsTable/InlinePrioritySelect.tsx',
  'src/app/admin/components/LeadsTable/InlinePrioritySelect.module.scss',
  'src/app/admin/components/LeadsTable/LeadMobileCard.tsx',
  'src/app/admin/components/LeadsTable/LeadMobileCard.module.scss',
  'src/app/admin/components/LeadsTable/LeadsDataGrid.tsx',
  'src/app/admin/components/LeadsTable/LeadsDataGrid.module.scss',
  'src/app/admin/components/LeadsTable/index.ts',
  'src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx',
  'tests/leads/leads_data_grid.test.ts',
  'tests/actions/lead_inline_actions.test.ts',
  'docs/sales_funnel/research_modules/sprint_7_2_architecture_spec.md',
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(ROOT_DIR, relPath);
  assert(fs.existsSync(fullPath), `File exists: ${relPath}`);
}

// 2. Anti-AI-Slop Code & Style Auditing
console.log('\n[Block 2: Anti-AI-Slop & Dark Luxury Token Auditing]');

const inlineActionsTs = fs.readFileSync(path.join(ROOT_DIR, 'src/app/actions/leadInlineActions.ts'), 'utf-8');
const inlineStatusTsx = fs.readFileSync(path.join(ROOT_DIR, 'src/app/admin/components/LeadsTable/InlineStatusSelect.tsx'), 'utf-8');
const inlineStatusScss = fs.readFileSync(path.join(ROOT_DIR, 'src/app/admin/components/LeadsTable/InlineStatusSelect.module.scss'), 'utf-8');
const inlinePriorityTsx = fs.readFileSync(path.join(ROOT_DIR, 'src/app/admin/components/LeadsTable/InlinePrioritySelect.tsx'), 'utf-8');
const inlinePriorityScss = fs.readFileSync(path.join(ROOT_DIR, 'src/app/admin/components/LeadsTable/InlinePrioritySelect.module.scss'), 'utf-8');
const mobileCardTsx = fs.readFileSync(path.join(ROOT_DIR, 'src/app/admin/components/LeadsTable/LeadMobileCard.tsx'), 'utf-8');
const mobileCardScss = fs.readFileSync(path.join(ROOT_DIR, 'src/app/admin/components/LeadsTable/LeadMobileCard.module.scss'), 'utf-8');
const dataGridTsx = fs.readFileSync(path.join(ROOT_DIR, 'src/app/admin/components/LeadsTable/LeadsDataGrid.tsx'), 'utf-8');
const dataGridScss = fs.readFileSync(path.join(ROOT_DIR, 'src/app/admin/components/LeadsTable/LeadsDataGrid.module.scss'), 'utf-8');
const workspaceClientTsx = fs.readFileSync(path.join(ROOT_DIR, 'src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx'), 'utf-8');

const allSprintCode = [
  inlineActionsTs,
  inlineStatusTsx,
  inlineStatusScss,
  inlinePriorityTsx,
  inlinePriorityScss,
  mobileCardTsx,
  mobileCardScss,
  dataGridTsx,
  dataGridScss,
  workspaceClientTsx,
].join('\n');

// Zero Generic Blue (#2563eb)
assert(!allSprintCode.includes('#2563eb'), 'Zero occurrences of generic blue (#2563eb)');

// Zero decorative separator comments
assert(!allSprintCode.includes('// ===') && !allSprintCode.includes('// ---'), 'Zero decorative separator comments');

// Strict type safety: Zero 'any' types in newly authored components and action files
assert(!inlineActionsTs.includes(': any') && !inlineActionsTs.includes('as any'), 'Zero any types in leadInlineActions.ts');
assert(!inlineStatusTsx.includes(': any') && !inlineStatusTsx.includes('as any'), 'Zero any types in InlineStatusSelect.tsx');
assert(!inlinePriorityTsx.includes(': any') && !inlinePriorityTsx.includes('as any'), 'Zero any types in InlinePrioritySelect.tsx');
assert(!mobileCardTsx.includes(': any') && !mobileCardTsx.includes('as any'), 'Zero any types in LeadMobileCard.tsx');
assert(!dataGridTsx.includes(': any') && !dataGridTsx.includes('as any'), 'Zero any types in LeadsDataGrid.tsx');

// Virtualization Rhythm & Overscan
assert(dataGridTsx.includes('estimateSize: () => 72'), 'Virtualized 72px fixed row height estimate configured');
assert(dataGridTsx.includes('overscan: 6'), 'Dynamic overscan buffer configured to 6 rows');
assert(dataGridScss.includes('height: 72px'), 'SCSS row container enforces 72px height rhythm');

// React 19 useOptimistic implementation
assert(inlineStatusTsx.includes('useOptimistic'), 'InlineStatusSelect implements React 19 useOptimistic');
assert(inlinePriorityTsx.includes('useOptimistic'), 'InlinePrioritySelect implements React 19 useOptimistic');

// Mobile Responsive Breakpoint & CTAs
assert(mobileCardTsx.includes('tel:'), 'LeadMobileCard implements Click-to-Call (tel:) trigger');
assert(mobileCardTsx.includes('wa.me'), 'LeadMobileCard implements Click-to-WhatsApp (wa.me) trigger');
assert(dataGridScss.includes('@media (max-width: 768px)'), 'LeadsDataGrid declares responsive breakpoint reflow at 768px');

// 3. Automated Test Suite Execution
console.log('\n[Block 3: Automated Test Execution]');
try {
  const testOutput1 = execSync('npx tsx --test tests/leads/leads_data_grid.test.ts', {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
  });
  console.log(testOutput1.trim());
  assert(true, 'tests/leads/leads_data_grid.test.ts passed successfully');
} catch (err: unknown) {
  assert(false, `tests/leads/leads_data_grid.test.ts failed: ${(err as Error).message}`);
}

try {
  const testOutput2 = execSync('npx tsx --test tests/actions/lead_inline_actions.test.ts', {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
  });
  console.log(testOutput2.trim());
  assert(true, 'tests/actions/lead_inline_actions.test.ts passed successfully');
} catch (err: unknown) {
  assert(false, `tests/actions/lead_inline_actions.test.ts failed: ${(err as Error).message}`);
}

try {
  const testOutput3 = execSync('npx tsx --test tests/leads/filter_action_bar.test.ts', {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
  });
  console.log(testOutput3.trim());
  assert(true, 'tests/leads/filter_action_bar.test.ts passed successfully');
} catch (err: unknown) {
  assert(false, `tests/leads/filter_action_bar.test.ts failed: ${(err as Error).message}`);
}

// 4. TypeScript Strict Compilation
console.log('\n[Block 4: TypeScript Strict Compiler Verification]');
try {
  execSync('npx tsc --noEmit', { cwd: ROOT_DIR, encoding: 'utf-8' });
  assert(true, 'TypeScript compilation clean (0 errors)');
} catch (err: unknown) {
  assert(false, `TypeScript compilation failed: ${(err as Error).message}`);
}

// Summary Report
console.log('\n================================================================');
const total = assertions.length;
const passed = assertions.filter((a) => a.passed).length;
const failed = total - passed;

console.log(` DELIVERY GATE AUDIT RESULT: ${failed === 0 ? 'ALL CHECKS PASSED' : 'FAILURES DETECTED'}`);
console.log(` TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
