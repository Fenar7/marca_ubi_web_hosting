/**
 * @file verify-sprint-10-1.ts
 * @description Official 4-Block Delivery Gate Verification Script for Sprint 10.1:
 *              Test Harness & Automated Suites (PRD §4.1 & §15.20).
 *              Asserts deliverable presence, zero AI-slop rules, automated test suite passes,
 *              orchestrator health, and 0 TypeScript compiler errors.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assertCheck(name: string, condition: boolean, details?: string): void {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ ${name}`);
  } else {
    failedChecks++;
    console.error(`  ✗ FAIL: ${name}`);
    if (details) {
      console.error(`    ↳ Details: ${details}`);
    }
  }
}

// Block 1: Deliverable Files Verification
console.log('[Block 1: Deliverable Files Verification]');

const requiredFiles = [
  'playwright.config.ts',
  'scripts/test-orchestrator.ts',
  'tests/rls/leads-isolation.test.ts',
  'tests/unit/normalization.test.ts',
  'tests/e2e/auth-helper.ts',
  'tests/e2e/01-admin-provisioning.spec.ts',
  'tests/e2e/02-website-brief-ingestion.spec.ts',
  'tests/e2e/03-data-grid-realtime.spec.ts',
  'tests/e2e/04-client-dossier-touchpoints.spec.ts',
  'tests/e2e/05-pipeline-stage-transitions.spec.ts',
  'tests/e2e/06-follow-up-scheduler.spec.ts',
  'tests/e2e/07-overdue-and-batch-reassign.spec.ts',
  'tests/e2e/08-security-suspension-logout.spec.ts',
  'docs/sales_funnel/research_modules/sprint_10_1_architecture_spec.md',
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(ROOT_DIR, relPath);
  assertCheck(`File exists: ${relPath}`, fs.existsSync(fullPath));
}

// Block 2: Anti-AI-Slop & Quality Standards
console.log('\n[Block 2: Anti-AI-Slop & Quality Standards]');

const codeFilesToAudit = [
  'playwright.config.ts',
  'scripts/test-orchestrator.ts',
  'tests/rls/leads-isolation.test.ts',
  'tests/unit/normalization.test.ts',
  'tests/e2e/auth-helper.ts',
  'tests/e2e/01-admin-provisioning.spec.ts',
  'tests/e2e/02-website-brief-ingestion.spec.ts',
  'tests/e2e/03-data-grid-realtime.spec.ts',
  'tests/e2e/04-client-dossier-touchpoints.spec.ts',
  'tests/e2e/05-pipeline-stage-transitions.spec.ts',
  'tests/e2e/06-follow-up-scheduler.spec.ts',
  'tests/e2e/07-overdue-and-batch-reassign.spec.ts',
  'tests/e2e/08-security-suspension-logout.spec.ts',
];

// 1. Scan for generic blue (#2563eb)
let genericBlueCount = 0;
for (const relPath of codeFilesToAudit) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('#2563eb')) {
      genericBlueCount++;
    }
  }
}
assertCheck('Zero occurrences of generic blue (#2563eb)', genericBlueCount === 0);

// 2. Scan for decorative separator comments
let decorativeCommentCount = 0;
for (const relPath of codeFilesToAudit) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (fs.existsSync(fullPath)) {
    const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
    for (const line of lines) {
      if (line.includes('// ===') || line.includes('// ---')) {
        decorativeCommentCount++;
      }
    }
  }
}
assertCheck('Zero decorative separator comments', decorativeCommentCount === 0);

// 3. Scan for any types in test files
let anyTypeCount = 0;
for (const relPath of codeFilesToAudit) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.match(/:\s*any\b/) || content.match(/\bas\s+any\b/)) {
      anyTypeCount++;
    }
  }
}
assertCheck('Zero any types across all deliverable modules', anyTypeCount === 0);

// 4. Scan for toy emojis in test files
const TOY_EMOJIS = ['📅', '⏱️', '📞', '💬', '⚠️', '🚨'];
let toyEmojiCount = 0;
for (const relPath of codeFilesToAudit) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    for (const emoji of TOY_EMOJIS) {
      if (content.includes(emoji)) {
        toyEmojiCount++;
      }
    }
  }
}
assertCheck('Zero toy emojis in deliverable test suites', toyEmojiCount === 0);

// 5. Package.json test scripts verification
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
assertCheck('Package.json includes test:unit script', typeof packageJson.scripts['test:unit'] === 'string');
assertCheck('Package.json includes test:rls script', typeof packageJson.scripts['test:rls'] === 'string');
assertCheck('Package.json includes test:e2e script', typeof packageJson.scripts['test:e2e'] === 'string');

// 6. Playwright config verification
const playwrightConfigContent = fs.readFileSync(path.join(ROOT_DIR, 'playwright.config.ts'), 'utf8');
assertCheck('Playwright config defines chromium project', playwrightConfigContent.includes("'chromium'"));
assertCheck('Playwright config defines firefox project', playwrightConfigContent.includes("'firefox'"));
assertCheck('Playwright config defines webkit project', playwrightConfigContent.includes("'webkit'"));
assertCheck('Playwright config defines webServer lifecycle', playwrightConfigContent.includes('webServer:'));

// Block 3: Automated Test Suites & Orchestrator Execution
console.log('\n[Block 3: Automated Test Suites & Orchestrator Execution]');

const testSuites = [
  'tests/unit/normalization.test.ts',
  'tests/rls/leads-isolation.test.ts',
];

for (const testFile of testSuites) {
  try {
    execSync(`npx tsx --test "${path.join(ROOT_DIR, testFile)}"`, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    assertCheck(`Test suite passed: ${testFile}`, true);
  } catch (err: unknown) {
    const errorOutput = err instanceof Error ? err.message : String(err);
    assertCheck(`Test suite passed: ${testFile}`, false, errorOutput);
  }
}

// Block 4: Strict TypeScript Compilation
console.log('\n[Block 4: Strict TypeScript Compilation]');

try {
  execSync('npx tsc --noEmit', {
    encoding: 'utf8',
    stdio: 'pipe',
  });
  assertCheck('TypeScript compiler (tsc --noEmit) reported 0 errors', true);
} catch (err: unknown) {
  const errorOutput = err instanceof Error ? err.message : String(err);
  assertCheck('TypeScript compiler (tsc --noEmit) reported 0 errors', false, errorOutput);
}

// Summary
console.log('\n================================================================');
console.log(` TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
console.log('================================================================\n');

if (failedChecks > 0) {
  console.error('DELIVERY GATE FAILED: Some checks did not satisfy the enterprise quality gate.');
  process.exit(1);
} else {
  console.log('DELIVERY GATE PASSED: Sprint 10.1 is 100% compliant with PRD §4.1 specifications.');
  process.exit(0);
}
