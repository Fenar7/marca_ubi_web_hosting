/**
 * @file verify-sprint-8-2.ts
 * @description Official 4-Block Delivery Gate Auditor for Sprint 8.2:
 *              Omnichannel Activity Timeline & Quick Action Interaction Composer.
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
console.log(' MARCA UBI ENTERPRISE CRM — SPRINT 8.2 DELIVERY GATE AUDITOR');
console.log('================================================================\n');

// -------------------------------------------------------------
// BLOCK 1: Deliverable Files Verification
// -------------------------------------------------------------
console.log('[Block 1: Deliverable Files Verification]');
const requiredFiles = [
  'src/app/actions/leadActivityActions.ts',
  'src/app/admin/components/DossierDrawer/QuickActionComposer.tsx',
  'src/app/admin/components/DossierDrawer/ActivityTimeline.tsx',
  'src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx',
  'src/app/admin/components/DossierDrawer/dossierUtils.ts',
  'src/app/admin/components/DossierDrawer/index.ts',
  'src/app/admin/components/DossierDrawer/DossierDrawer.module.scss',
  'tests/actions/lead_activity_actions.test.ts',
  'tests/leads/activity_composer_and_timeline.test.ts',
  'docs/sales_funnel/research_modules/sprint_8_2_architecture_spec.md',
];

for (const file of requiredFiles) {
  const fullPath = path.join(ROOT_DIR, file);
  assertCheck(`File exists: ${file}`, fs.existsSync(fullPath));
}

// -------------------------------------------------------------
// BLOCK 2: Anti-AI-Slop & Dark Luxury Token Auditing
// -------------------------------------------------------------
console.log('\n[Block 2: Anti-AI-Slop & Dark Luxury Token Auditing]');

const filesToAudit = [
  'src/app/actions/leadActivityActions.ts',
  'src/app/admin/components/DossierDrawer/QuickActionComposer.tsx',
  'src/app/admin/components/DossierDrawer/ActivityTimeline.tsx',
  'src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx',
  'src/app/admin/components/DossierDrawer/dossierUtils.ts',
  'src/app/admin/components/DossierDrawer/index.ts',
  'src/app/admin/components/DossierDrawer/DossierDrawer.module.scss',
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
assertCheck('Zero toy emojis in composer & timeline components', !hasToyEmojis);

// Component-specific architectural invariants
const scssContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/DossierDrawer/DossierDrawer.module.scss'),
  'utf8'
);
const composerContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/DossierDrawer/QuickActionComposer.tsx'),
  'utf8'
);
const timelineContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/DossierDrawer/ActivityTimeline.tsx'),
  'utf8'
);
const drawerContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx'),
  'utf8'
);
const actionContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/actions/leadActivityActions.ts'),
  'utf8'
);

assertCheck('QuickActionComposer declares min-height 44px for tabs & triggers', scssContent.includes('.composerTab') && scssContent.includes('min-height: 44px;'));
assertCheck('QuickActionComposer enforces minimum 3 characters on interaction notes', composerContent.includes('.trim().length >= 3'));
assertCheck('QuickActionComposer implements instant double-submission prevention lock', composerContent.includes('setIsSubmitting(true)'));
assertCheck('ActivityTimeline implements vertical hairline connector track', scssContent.includes('.timelineTrack') && scssContent.includes('width: 1px;'));
assertCheck('ActivityTimeline implements semantic event glyph badges', timelineContent.includes('renderActivityGlyph') && scssContent.includes('.timelineGlyph'));
assertCheck('ActivityTimeline formats tokenized @mentions and #tags safely', timelineContent.includes('parseMentionsAndTags') && scssContent.includes('.mentionToken'));
assertCheck('ClientDossierDrawer mounts QuickActionComposer and ActivityTimeline in Column 2', drawerContent.includes('<QuickActionComposer') && drawerContent.includes('<ActivityTimeline'));
assertCheck('logLeadActivityAction enforces viewer role rejection (403)', actionContent.includes("profile.role === 'viewer'"));
assertCheck('logLeadActivityAction enforces sales executive deal sandboxing', actionContent.includes("leadRecord.assigned_to !== user.id"));

// -------------------------------------------------------------
// BLOCK 3: Automated Test Execution
// -------------------------------------------------------------
console.log('\n[Block 3: Automated Test Execution]');

const testFiles = [
  'tests/actions/lead_activity_actions.test.ts',
  'tests/leads/activity_composer_and_timeline.test.ts',
  'tests/leads/client_dossier_drawer.test.ts',
  'tests/leads/leads_data_grid.test.ts',
  'tests/actions/lead_inline_actions.test.ts',
  'tests/leads/filter_action_bar.test.ts',
];

for (const testFile of testFiles) {
  try {
    execSync(`npx tsx --test ${testFile}`, { stdio: 'inherit' });
    assertCheck(`${testFile} passed successfully`, true);
  } catch (error) {
    assertCheck(`${testFile} failed execution`, false);
  }
}

// -------------------------------------------------------------
// BLOCK 4: TypeScript Strict Compiler Verification
// -------------------------------------------------------------
console.log('\n[Block 4: TypeScript Strict Compiler Verification]');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  assertCheck('TypeScript compilation clean (0 errors)', true);
} catch (error) {
  const errOutput = (error as { stdout?: Buffer; stderr?: Buffer }).stdout?.toString() || '';
  console.error(errOutput);
  assertCheck('TypeScript compilation failed', false);
}

// Final Summary
console.log('\n================================================================');
if (failedChecks === 0) {
  console.log(' DELIVERY GATE AUDIT RESULT: ALL CHECKS PASSED');
  console.log(` TOTAL CHECKS: ${passedChecks + failedChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
} else {
  console.error(' DELIVERY GATE AUDIT RESULT: CHECKS FAILED');
  console.error(` TOTAL CHECKS: ${passedChecks + failedChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
  process.exit(1);
}
console.log('================================================================\n');
