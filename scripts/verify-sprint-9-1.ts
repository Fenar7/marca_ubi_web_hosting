/**
 * @file verify-sprint-9-1.ts
 * @description Official 4-Block Delivery Gate Auditor for Sprint 9.1:
 *              Precision Follow-up Date-Time Scheduler & On Hold Revisit Automation.
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
console.log(' MARCA UBI ENTERPRISE CRM: SPRINT 9.1 DELIVERY GATE AUDITOR');
console.log('================================================================\n');

console.log('[Block 1: Deliverable Files Verification]');
const requiredFiles = [
  'src/app/actions/schedulerActions.ts',
  'src/app/admin/components/Scheduler/DateTimePicker.tsx',
  'src/app/admin/components/Scheduler/FollowUpScheduler.tsx',
  'src/app/admin/components/Scheduler/OnHoldModal.tsx',
  'src/app/admin/components/Scheduler/Scheduler.module.scss',
  'src/app/admin/components/Scheduler/index.ts',
  'supabase/migrations/20261015000013_on_hold_revisit_automation.sql',
  'tests/actions/scheduler_actions.test.ts',
  'tests/leads/follow_up_scheduler.test.ts',
  'docs/sales_funnel/research_modules/sprint_9_1_architecture_spec.md',
];

for (const file of requiredFiles) {
  const fullPath = path.join(ROOT_DIR, file);
  assertCheck(`File exists: ${file}`, fs.existsSync(fullPath));
}

console.log('\n[Block 2: Anti-AI-Slop & Dark Luxury Token Auditing]');

const filesToAudit = [
  'src/app/actions/schedulerActions.ts',
  'src/app/admin/components/Scheduler/DateTimePicker.tsx',
  'src/app/admin/components/Scheduler/FollowUpScheduler.tsx',
  'src/app/admin/components/Scheduler/OnHoldModal.tsx',
  'src/app/admin/components/Scheduler/Scheduler.module.scss',
  'src/app/admin/components/Scheduler/index.ts',
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
assertCheck('Zero toy emojis in scheduler and modal components', !hasToyEmojis);

// Component-specific architectural invariants
const scssContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/Scheduler/Scheduler.module.scss'),
  'utf8'
);
const schedulerContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/Scheduler/FollowUpScheduler.tsx'),
  'utf8'
);
const onHoldModalContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/Scheduler/OnHoldModal.tsx'),
  'utf8'
);
const actionsContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/actions/schedulerActions.ts'),
  'utf8'
);
const migrationContent = fs.readFileSync(
  path.join(ROOT_DIR, 'supabase/migrations/20261015000013_on_hold_revisit_automation.sql'),
  'utf8'
);

assertCheck('Backdrop blur scrim configured in Scheduler.module.scss', scssContent.includes('backdrop-filter: blur('));
assertCheck('Minimum 44px tap targets enforced in SCSS', scssContent.includes('min-height: 44px') || scssContent.includes('height: 44px'));
assertCheck('RFC 5545 iCalendar (.ics) generator in schedulerActions.ts', actionsContent.includes('generateIcsCalendarInvite') && actionsContent.includes('BEGIN:VCALENDAR'));
assertCheck('Server action checks post-conversion lock (converted_at)', actionsContent.includes('converted_at && role !== \'admin\''));
assertCheck('Server action checks viewer 403 Forbidden', actionsContent.includes('role === \'viewer\''));
assertCheck('Quick-select preset calculations in FollowUpScheduler.tsx', schedulerContent.includes('today_2h') && schedulerContent.includes('next_mon_9am'));
assertCheck('Future revisit date enforced in OnHoldModal.tsx', onHoldModalContent.includes('targetDate <= today'));
assertCheck('SQL trigger trg_validate_on_hold_revisit in migration', migrationContent.includes('trg_validate_on_hold_revisit'));
assertCheck('SQL procedure reactivate_expired_on_hold_leads in migration', migrationContent.includes('reactivate_expired_on_hold_leads'));

console.log('\n[Block 3: Automated Test Suites Execution]');

const testSuites = [
  'tests/actions/scheduler_actions.test.ts',
  'tests/leads/follow_up_scheduler.test.ts',
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
  console.log('DELIVERY GATE PASSED: Sprint 9.1 is 100% compliant with PRD §14 & §15.19 specifications.');
  process.exit(0);
}
