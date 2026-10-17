/**
 * @file verify-sprint-8-1.ts
 * @description Official 4-Block Delivery Gate Auditor for Sprint 8.1:
 *              Client 360° Sliding Drawer Shell & Organization Dossier.
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
console.log(' MARCA UBI ENTERPRISE CRM — SPRINT 8.1 DELIVERY GATE AUDITOR');
console.log('================================================================\n');

// -------------------------------------------------------------
// BLOCK 1: Deliverable Files Verification
// -------------------------------------------------------------
console.log('[Block 1: Deliverable Files Verification]');
const requiredFiles = [
  'src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx',
  'src/app/admin/components/DossierDrawer/OrganizationDossier.tsx',
  'src/app/admin/components/DossierDrawer/RawBriefAccordion.tsx',
  'src/app/admin/components/DossierDrawer/DossierDrawer.module.scss',
  'src/app/admin/components/DossierDrawer/dossierUtils.ts',
  'src/app/admin/components/DossierDrawer/index.ts',
  'src/app/admin/components/drawers/LeadDetailDrawer.tsx',
  'src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx',
  'tests/leads/client_dossier_drawer.test.ts',
  'docs/sales_funnel/research_modules/sprint_8_1_architecture_spec.md',
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
  'src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx',
  'src/app/admin/components/DossierDrawer/OrganizationDossier.tsx',
  'src/app/admin/components/DossierDrawer/RawBriefAccordion.tsx',
  'src/app/admin/components/DossierDrawer/dossierUtils.ts',
  'src/app/admin/components/DossierDrawer/DossierDrawer.module.scss',
  'src/app/admin/components/DossierDrawer/index.ts',
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
assertCheck('Zero toy emojis in Dossier Drawer components', !hasToyEmojis);

// Component-specific architectural invariants
const scssContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/DossierDrawer/DossierDrawer.module.scss'),
  'utf8'
);
const drawerContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx'),
  'utf8'
);
const orgDossierContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/DossierDrawer/OrganizationDossier.tsx'),
  'utf8'
);

const dossierUtilsContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src/app/admin/components/DossierDrawer/dossierUtils.ts'),
  'utf8'
);

assertCheck('Drawer specifies 840px desktop width geometry', scssContent.includes('min(840px, 100vw)') || scssContent.includes('840px'));
assertCheck('Drawer declares 100vw mobile width breakpoint', scssContent.includes('width: 100vw;'));
assertCheck('Backdrop scrim implements frosted glass blur', scssContent.includes('backdrop-filter: blur(12px)'));
assertCheck('Interactive triggers declare 44px minimum tap targets', scssContent.includes('min-height: 44px') || scssContent.includes('min-width: 44px'));
assertCheck('OrganizationDossier implements Click-to-Call (tel:) trigger', orgDossierContent.includes('sanitizeTelUri') && dossierUtilsContent.includes('tel:'));
assertCheck('OrganizationDossier implements Click-to-WhatsApp (wa.me) trigger', orgDossierContent.includes('createWhatsAppUri') && dossierUtilsContent.includes('wa.me'));
assertCheck('OrganizationDossier renders representative initials badge', orgDossierContent.includes('avatarInitials') && orgDossierContent.includes('getDossierInitials'));
assertCheck('RawBriefAccordion implements bidirectional WAI-ARIA linkage', fs.readFileSync(path.join(ROOT_DIR, 'src/app/admin/components/DossierDrawer/RawBriefAccordion.tsx'), 'utf8').includes('aria-controls="brief-accordion-region"'));
assertCheck('AdminWorkspaceShell routes leadId params to open-lead-drawer', fs.readFileSync(path.join(ROOT_DIR, 'src/app/admin/components/layout/AdminWorkspaceShell.tsx'), 'utf8').includes('open-lead-drawer'));
assertCheck('LeadsWorkspaceClient synchronizes leadId in URL without full reload', fs.readFileSync(path.join(ROOT_DIR, 'src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx'), 'utf8').includes('window.history.replaceState'));
assertCheck('ClientDossierDrawer implements Escape key dismissal', drawerContent.includes("e.key === 'Escape'"));
assertCheck('ClientDossierDrawer implements body scroll lock', drawerContent.includes("document.body.style.overflow = 'hidden'"));

// -------------------------------------------------------------
// BLOCK 3: Automated Test Execution
// -------------------------------------------------------------
console.log('\n[Block 3: Automated Test Execution]');

const testFiles = [
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
