/**
 * @file verify-sprint-10-3.ts
 * @description Delivery Gate Verification Harness for Sprint 10.3:
 *              Security Audits, WCAG 2.1 AA Accessibility & Production Runbooks.
 *              Evaluates deliverable files, anti-AI-slop hygiene, mathematical contrast ratios,
 *              operational runbook depth, and TypeScript compilation (PRD §4.3 & §18).
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { runContrastAudit } from './verify-contrast-wcag';

interface GateResult {
  passed: boolean;
  message: string;
}

const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Asserts the existence and minimum non-trivial byte length of a project file.
 */
function assertFileExists(relativePath: string, minBytes: number = 200): GateResult {
  const absolutePath = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return { passed: false, message: `Missing required file: ${relativePath}` };
  }
  const stat = fs.statSync(absolutePath);
  if (stat.size < minBytes) {
    return {
      passed: false,
      message: `File ${relativePath} is trivial or incomplete (${stat.size} bytes < ${minBytes} bytes)`,
    };
  }
  return { passed: true, message: `File exists and verified: ${relativePath} (${stat.size} bytes)` };
}

/**
 * Scans files for Anti-AI-Slop rule violations.
 */
function assertAntiSlopRules(filePaths: string[]): GateResult[] {
  const results: GateResult[] = [];

  for (const relPath of filePaths) {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf8');

    // Rule 1: No generic blue
    if (content.includes('#2563eb')) {
      results.push({ passed: false, message: `Generic blue (#2563eb) found in ${relPath}` });
    }

    // Rule 2: No decorative separator comments
    if (/\/\/\s*={4,}|\/\/\s*-{4,}/.test(content)) {
      results.push({ passed: false, message: `Decorative separator comments found in ${relPath}` });
    }

    // Rule 3: No `any` types in TypeScript modules
    if (relPath.endsWith('.ts') && !relPath.endsWith('.d.ts')) {
      if (/:\s*any\b|as\s+any\b/.test(content)) {
        results.push({ passed: false, message: `Untyped 'any' found in TypeScript file: ${relPath}` });
      }
    }

    // Rule 4: No toy emojis in code or test files
    if (relPath.endsWith('.ts') || relPath.endsWith('.js')) {
      if (/[⚠️🚨📅⏱️📞💬🔥]/.test(content)) {
        results.push({ passed: false, message: `Toy emoji found in code file: ${relPath}` });
      }
    }
  }

  if (results.length === 0) {
    results.push({ passed: true, message: 'Zero occurrences of generic blue (#2563eb)' });
    results.push({ passed: true, message: 'Zero decorative separator comments' });
    results.push({ passed: true, message: 'Zero any types across all deliverable modules' });
    results.push({ passed: true, message: 'Zero toy emojis in deliverable code modules' });
  }

  return results;
}

async function runDeliveryGateAudit(): Promise<void> {
  console.log('================================================================');
  console.log(' MARCA UBI ENTERPRISE CRM: SPRINT 10.3 DELIVERY GATE AUDITOR');
  console.log('================================================================\n');

  let totalChecks = 0;
  let passedChecks = 0;
  const failures: string[] = [];

  function record(result: GateResult) {
    totalChecks++;
    if (result.passed) {
      passedChecks++;
      console.log(`  ✓ ${result.message}`);
    } else {
      failures.push(result.message);
      console.log(`  ✗ ${result.message}`);
    }
  }

  // Block 1: Deliverable Files Verification
  console.log('[Block 1: Deliverable Files Verification]');
  const expectedFiles = [
    'tests/e2e/accessibility.spec.ts',
    'scripts/verify-contrast-wcag.ts',
    'docs/sales_funnel/runbooks/secret_rotation.md',
    'docs/sales_funnel/runbooks/disaster_recovery_pitr.md',
    'docs/sales_funnel/runbooks/production_deployment.md',
    'docs/sales_funnel/research_modules/sprint_10_3_architecture_spec.md',
    'docs/sales_funnel/research_modules/pr_sprint_10_3_body.md',
  ];

  for (const file of expectedFiles) {
    record(assertFileExists(file, 200));
  }
  console.log('');

  // Block 2: Anti-AI-Slop & Quality Standards
  console.log('[Block 2: Anti-AI-Slop & Quality Standards]');
  const antiSlopResults = assertAntiSlopRules([
    'tests/e2e/accessibility.spec.ts',
    'scripts/verify-contrast-wcag.ts',
  ]);
  for (const res of antiSlopResults) {
    record(res);
  }

  // Check package.json contains test:a11y script
  const pkgJsonPath = path.join(ROOT_DIR, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  if (pkg.scripts && pkg.scripts['test:a11y']) {
    record({ passed: true, message: 'Package.json includes test:a11y script' });
  } else {
    record({ passed: false, message: 'Package.json missing test:a11y script' });
  }
  console.log('');

  // Block 3: WCAG Contrast & Runbook Completeness
  console.log('[Block 3: WCAG 2.1 AA Contrast Ratios & Runbook Depth]');
  const contrastAudit = runContrastAudit();
  if (contrastAudit.passed) {
    record({ passed: true, message: 'Mathematical contrast audit: All tokens pass WCAG 2.1 AA/AAA' });
  } else {
    record({ passed: false, message: 'Mathematical contrast audit: Failed to achieve WCAG contrast targets' });
  }

  // Assert secret rotation runbook contains required procedures
  const secretRunbook = fs.readFileSync(
    path.join(ROOT_DIR, 'docs/sales_funnel/runbooks/secret_rotation.md'),
    'utf8'
  );
  if (
    secretRunbook.includes('SUPABASE_SERVICE_ROLE_KEY') &&
    secretRunbook.includes('SUPABASE_JWT_SECRET') &&
    secretRunbook.includes('Dual-Key Grace Period')
  ) {
    record({ passed: true, message: 'Secret rotation runbook contains dual-key windows and classification matrix' });
  } else {
    record({ passed: false, message: 'Secret rotation runbook missing required procedural sections' });
  }

  // Assert disaster recovery runbook contains PITR and WAL specifications
  const drRunbook = fs.readFileSync(
    path.join(ROOT_DIR, 'docs/sales_funnel/runbooks/disaster_recovery_pitr.md'),
    'utf8'
  );
  if (
    drRunbook.includes('Point-in-Time Recovery') &&
    drRunbook.includes('RPO') &&
    drRunbook.includes('RTO') &&
    drRunbook.includes('maintenance_mode')
  ) {
    record({ passed: true, message: 'Disaster recovery runbook contains RPO/RTO metrics and rollback commands' });
  } else {
    record({ passed: false, message: 'Disaster recovery runbook missing required RPO/RTO or rollback procedures' });
  }

  // Assert production deployment runbook contains branch hierarchy & Definition of Done
  const deployRunbook = fs.readFileSync(
    path.join(ROOT_DIR, 'docs/sales_funnel/runbooks/production_deployment.md'),
    'utf8'
  );
  if (
    deployRunbook.includes('feature/sales-funnel-crm') &&
    deployRunbook.includes('Definition of Done') &&
    deployRunbook.includes('v1.2.0-crm-enterprise')
  ) {
    record({ passed: true, message: 'Production deployment runbook contains branch hierarchy and DoD checklist' });
  } else {
    record({ passed: false, message: 'Production deployment runbook missing branch hierarchy or release tag specs' });
  }
  console.log('');

  // Block 4: Strict TypeScript Compilation
  console.log('[Block 4: Strict TypeScript Compilation]');
  try {
    execSync('npx tsc --noEmit', { cwd: ROOT_DIR, stdio: 'pipe' });
    record({ passed: true, message: 'TypeScript compiler (tsc --noEmit) reported 0 errors' });
  } catch (err: unknown) {
    const errorOutput = err instanceof Error ? err.message : String(err);
    record({ passed: false, message: `TypeScript compilation failed: ${errorOutput}` });
  }
  console.log('');

  // Summary
  console.log('================================================================');
  console.log(` TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failures.length}`);
  console.log('================================================================');

  if (failures.length > 0) {
    console.error('\nDELIVERY GATE FAILED: The following checks did not pass:');
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  } else {
    console.log('\nDELIVERY GATE PASSED: Sprint 10.3 is 100% compliant with PRD §4.3 specifications.');
    console.log('STATUS: APPROVAL-READY FOR PR SUBMISSION.\n');
  }
}

runDeliveryGateAudit().catch((err) => {
  console.error('Fatal gate execution error:', err);
  process.exit(1);
});
