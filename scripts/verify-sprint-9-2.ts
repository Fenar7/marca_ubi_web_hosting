/**
 * @file verify-sprint-9-2.ts
 * @description Official 4-Block Delivery Gate Auditor for Sprint 9.2:
 *              Overdue Escalation Engine, Visual Alert Badges & Rep Workload Oversight.
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
console.log(' MARCA UBI ENTERPRISE CRM: SPRINT 9.2 DELIVERY GATE AUDITOR');
console.log('================================================================\n');

console.log('[Block 1: Deliverable Files Verification]');
const requiredFiles = [
  'src/app/admin/components/Badges/badgeUtils.ts',
  'src/app/admin/components/Badges/OverdueBadge.module.scss',
  'src/app/admin/components/Badges/OverdueBadge.tsx',
  'src/app/admin/components/Badges/index.ts',
  'src/app/actions/workloadActions.ts',
  'src/app/admin/components/modals/BatchReassignModal.module.scss',
  'src/app/admin/components/modals/BatchReassignModal.tsx',
  'src/app/admin/components/modals/index.ts',
  'src/app/admin/components/Dashboard/ManagerWorkloadCard.module.scss',
  'src/app/admin/components/Dashboard/ManagerWorkloadCard.tsx',
  'src/app/admin/components/Dashboard/index.ts',
  'docs/sales_funnel/research_modules/sprint_9_2_architecture_spec.md',
  'tests/leads/overdue_badge.test.ts',
  'tests/actions/workload_and_reassign.test.ts',
];

for (const file of requiredFiles) {
  const fullPath = path.join(ROOT_DIR, file);
  assertCheck(`File exists: ${file}`, fs.existsSync(fullPath));
}

console.log('\n[Block 2: Anti-AI-Slop & Dark Luxury Token Auditing]');

const filesToAudit = [
  'src/app/admin/components/Badges/badgeUtils.ts',
  'src/app/admin/components/Badges/OverdueBadge.tsx',
  'src/app/admin/components/Badges/OverdueBadge.module.scss',
  'src/app/admin/components/Badges/index.ts',
  'src/app/actions/workloadActions.ts',
  'src/app/admin/components/modals/BatchReassignModal.tsx',
  'src/app/admin/components/modals/BatchReassignModal.module.scss',
  'src/app/admin/components/modals/index.ts',
  'src/app/admin/components/Dashboard/ManagerWorkloadCard.tsx',
  'src/app/admin/components/Dashboard/ManagerWorkloadCard.module.scss',
  'src/app/admin/components/Dashboard/index.ts',
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
assertCheck('Zero toy emojis in badges, cards, and modal components', !hasToyEmojis);

// Component-specific architectural invariants
const badgeScss = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/Badges/OverdueBadge.module.scss'),
  'utf8'
);
const badgeUtilsContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/Badges/badgeUtils.ts'),
  'utf8'
);
const modalContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/modals/BatchReassignModal.tsx'),
  'utf8'
);
const modalScss = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/modals/BatchReassignModal.module.scss'),
  'utf8'
);
const workloadActionsContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/actions/workloadActions.ts'),
  'utf8'
);
const pageContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/(workspace)/page.tsx'),
  'utf8'
);
const dataGridContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/LeadsTable/LeadsDataGrid.tsx'),
  'utf8'
);
const mobileCardContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/LeadsTable/LeadMobileCard.tsx'),
  'utf8'
);
const workspaceContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx'),
  'utf8'
);

assertCheck('Pulsing red alert animation pulseGlow in OverdueBadge.module.scss', badgeScss.includes('@keyframes pulseGlow'));
assertCheck('Alert suppression logic for On Hold revisit date in badgeUtils.ts', badgeUtilsContent.includes("statusName.toLowerCase() === 'on hold'") && badgeUtilsContent.includes('revisitDate > todayStr'));
assertCheck('3-tier overdue categorization (<24h, 24-72h, >72h) in badgeUtils.ts', badgeUtilsContent.includes("tier: 'amber'") && badgeUtilsContent.includes("tier: 'orange'") && badgeUtilsContent.includes("tier: 'red_pulse'"));
assertCheck('BatchReassignModal disables submit when 0 leads selected', modalContent.includes('isSubmitDisabled') || modalContent.includes('selectedLeadIds.length === 0'));
assertCheck('BatchReassignModal enforces 44px tap targets and backdrop blur', modalScss.includes('backdrop-filter: blur(') && modalScss.includes('min-height: 44px'));
assertCheck('Server action enforces caller session auth via getUser()', workloadActionsContent.includes('auth.getUser()'));
assertCheck('Server action enforces RBAC role guard (viewer 403 Forbidden)', workloadActionsContent.includes("profile.role !== 'admin' && profile.role !== 'sales_manager'"));
assertCheck('Server action records canonical reassignment activity type', workloadActionsContent.includes("activity_type: 'reassignment'"));
assertCheck('Server action checks post-conversion lock (converted_at)', workloadActionsContent.includes("callerRole !== 'admin'") && workloadActionsContent.includes("targetLeads.find((l) => l.converted_at)"));
assertCheck('ManagerWorkloadCard rendered on /admin dashboard page', pageContent.includes('<ManagerWorkloadCard />'));
assertCheck('OverdueBadge integrated in virtualized LeadsDataGrid', dataGridContent.includes('<OverdueBadge'));
assertCheck('OverdueBadge integrated in LeadMobileCard', mobileCardContent.includes('<OverdueBadge'));
assertCheck('Batch reassignment trigger banner wired in LeadsWorkspaceClient', workspaceContent.includes('overdueNoticeBanner') && workspaceContent.includes('BatchReassignModal'));

console.log('\n[Block 3: Automated Test Suites Execution]');

const testSuites = [
  'tests/leads/overdue_badge.test.ts',
  'tests/actions/workload_and_reassign.test.ts',
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
  console.log('DELIVERY GATE PASSED: Sprint 9.2 is 100% compliant with PRD §14.3 & §15.19 specifications.');
  process.exit(0);
}
