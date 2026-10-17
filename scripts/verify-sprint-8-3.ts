/**
 * @file verify-sprint-8-3.ts
 * @description Official 4-Block Delivery Gate Auditor for Sprint 8.3:
 *              Guarded Stage Transition Modals, Input Validation & State Machine Locking.
 *              Validates deliverable file existence, anti-slop rules, dark luxury tokens,
 *              automated test suites, and strict TypeScript compilation.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();

let passedChecks = 0;
let failedChecks = 0;

function assertCheck(name: string, condition: boolean, details?: string): void {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passedChecks++;
  } else {
    console.error(`  ✗ FAIL: ${name}${details ? ` -> ${details}` : ''}`);
    failedChecks++;
  }
}

console.log('================================================================');
console.log(' MARCA UBI ENTERPRISE CRM: SPRINT 8.3 DELIVERY GATE AUDITOR');
console.log('================================================================\n');

console.log('[Block 1: Deliverable Files Verification]');
const requiredFiles = [
  'src/app/actions/stageTransitionActions.ts',
  'src/app/admin/components/modals/StageTransitionModal.tsx',
  'src/app/admin/components/modals/LostReasonModal.tsx',
  'src/app/admin/components/modals/ConvertedCelebrationModal.tsx',
  'src/app/admin/components/modals/StageModals.module.scss',
  'src/app/admin/components/modals/index.ts',
  'supabase/migrations/20261015000012_converted_lead_locking_policy.sql',
  'tests/actions/stage_transition_actions.test.ts',
  'tests/leads/stage_transition_modals.test.ts',
  'docs/sales_funnel/research_modules/sprint_8_3_architecture_spec.md',
];

for (const file of requiredFiles) {
  const fullPath = path.join(ROOT_DIR, file);
  assertCheck(`File exists: ${file}`, fs.existsSync(fullPath));
}

console.log('\n[Block 2: Anti-AI-Slop & Dark Luxury Token Auditing]');

const filesToAudit = [
  'src/app/actions/stageTransitionActions.ts',
  'src/app/admin/components/modals/StageTransitionModal.tsx',
  'src/app/admin/components/modals/LostReasonModal.tsx',
  'src/app/admin/components/modals/ConvertedCelebrationModal.tsx',
  'src/app/admin/components/modals/StageModals.module.scss',
  'src/app/admin/components/modals/index.ts',
];

let hasGenericBlue = false;
let hasDecorativeComments = false;
let hasAnyType = false;
let hasToyEmojis = false;

const decorativeCommentRegex = /\/\/\s*={3,}|\/\/\s*-{3,}/;
const genericBlueRegex = /#2563eb/i;
const anyTypeRegex = /:\s*any\b|\bas\s+any\b/;
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

for (const relPath of filesToAudit) {
  const content = fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8');

  if (genericBlueRegex.test(content)) hasGenericBlue = true;
  if (decorativeCommentRegex.test(content)) hasDecorativeComments = true;
  if (!relPath.endsWith('.scss') && anyTypeRegex.test(content)) hasAnyType = true;
  if (!relPath.endsWith('.scss') && emojiRegex.test(content)) hasToyEmojis = true;
}

assertCheck('Zero occurrences of generic blue (#2563eb)', !hasGenericBlue);
assertCheck('Zero decorative separator comments', !hasDecorativeComments);
assertCheck('Zero any types across all deliverable modules', !hasAnyType);
assertCheck('Zero toy emojis in guarded transition modals', !hasToyEmojis);

// Component-specific architectural invariants
const scssContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/modals/StageModals.module.scss'),
  'utf8'
);
const convertedModalContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/modals/ConvertedCelebrationModal.tsx'),
  'utf8'
);
const lostModalContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/modals/LostReasonModal.tsx'),
  'utf8'
);
const actionsContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/actions/stageTransitionActions.ts'),
  'utf8'
);

assertCheck('Backdrop blur scrim configured in StageModals.module.scss', scssContent.includes('backdrop-filter: blur('));
assertCheck('Minimum 44px tap targets enforced in SCSS', scssContent.includes('min-height: 44px') || scssContent.includes('height: 44px'));
assertCheck('Converted celebration includes canvas confetti engine', convertedModalContent.includes('canvas') && convertedModalContent.includes('requestAnimationFrame'));
assertCheck('Converted modal enforces post-conversion lock notice', convertedModalContent.includes('State Machine Record Locking'));
assertCheck('Lost modal enforces >= 10 characters for Other reason', lostModalContent.includes('lostNotes.trim().length < 10'));
assertCheck('Server action checks post-conversion lock (lead.converted_at)', actionsContent.includes('lead.converted_at && profile.role !== \'admin\''));
assertCheck('Server action checks viewer 403 Forbidden', actionsContent.includes('profile.role === \'viewer\''));

console.log('\n[Block 3: Automated Test Suites Execution]');

const testSuites = [
  'tests/actions/stage_transition_actions.test.ts',
  'tests/leads/stage_transition_modals.test.ts',
];

for (const testFile of testSuites) {
  try {
    const output = execSync(`npx tsx --test "${path.join(ROOT_DIR, testFile)}"`, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    assertCheck(`Test suite passed: ${testFile}`, true);
  } catch (err: unknown) {
    const errorOutput = err instanceof Error ? err.message : String(err);
    assertCheck(`Test suite passed: ${testFile}`, false, errorOutput);
  }
}

console.log('\n[Block 4: Strict TypeScript Compilation]');

try {
  execSync('npx tsc --noEmit', {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  assertCheck('TypeScript compiler (tsc --noEmit) reported 0 errors', true);
} catch (err: unknown) {
  const tscError = err instanceof Error ? err.message : String(err);
  assertCheck('TypeScript compiler (tsc --noEmit) reported 0 errors', false, tscError);
}

console.log('\n================================================================');
console.log(` TOTAL CHECKS: ${passedChecks + failedChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
console.log('================================================================\n');

if (failedChecks > 0) {
  console.error('DELIVERY GATE FAILED: Some checks did not satisfy the enterprise quality gate.');
  process.exit(1);
} else {
  console.log('DELIVERY GATE PASSED: Sprint 8.3 is 100% compliant with PRD §15.18 specifications.');
  process.exit(0);
}
