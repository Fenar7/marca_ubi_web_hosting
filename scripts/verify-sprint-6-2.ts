/**
 * @file verify-sprint-6-2.ts
 * @description Automated Quality & Delivery Gate Verification Suite for Sprint 6.2:
 *              Dark Luxury Executive KPI Ribbon & Real-time Recalculation Engine.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 * @governance Master PRD Section 6, SPEC-MARCA-CRM-UX-PHASES-6-9, DESIGN.md & AGENTS.md
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  USD_TO_INR_RATE,
  extractKpiMetrics,
  formatKpiCurrency,
  formatFullCurrency,
  formatSyncTimestamp,
} from '../src/app/admin/components/kpi/kpiFormatters';
import type { PipelineRpcMetrics } from '../src/types/crm';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function runVerification(): Promise<void> {
  console.log('============================================================');
  console.log(' Marca Ubi Enterprise CRM - Sprint 6.2 Delivery Gate');
  console.log(' Dark Luxury Executive KPI Ribbon & Real-Time Engine');
  console.log('============================================================\n');

  // Section 1: Component Artifacts & Directory Structure on Disk
  console.log('Section 1: Component Artifacts & Directory Structure on Disk');
  const kpiDir = path.resolve(process.cwd(), 'src/app/admin/components/kpi');
  assert(fs.existsSync(kpiDir), 'Component directory src/app/admin/components/kpi exists');

  const filesToCheck = [
    'src/app/admin/components/kpi/KpiRibbon.tsx',
    'src/app/admin/components/kpi/KpiCard.tsx',
    'src/app/admin/components/kpi/KpiSkeleton.tsx',
    'src/app/admin/components/kpi/KpiRibbon.module.scss',
    'src/app/admin/components/kpi/kpiFormatters.ts',
    'src/app/admin/components/kpi/index.ts',
    'src/app/admin/components/KpiRibbon/index.ts',
  ];

  for (const filePath of filesToCheck) {
    const fullPath = path.resolve(process.cwd(), filePath);
    assert(fs.existsSync(fullPath), `Artifact ${filePath} exists on disk`);
  }

  // Section 2: Component Architecture, Design Tokens & SCSS Invariants
  console.log('\nSection 2: Component Architecture, Design Tokens & SCSS Invariants');
  const scssContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/app/admin/components/kpi/KpiRibbon.module.scss'),
    'utf-8'
  );

  assert(
    scssContent.includes('font-variant-numeric: tabular-nums') ||
      scssContent.includes("font-feature-settings: 'tnum' 1"),
    'Tabular numerals enforced in SCSS module (zero layout shift)'
  );
  assert(
    scssContent.includes('rgba(255, 255, 255, 0.08)'),
    'Hairline grid border token rgba(255, 255, 255, 0.08) present'
  );
  assert(
    scssContent.includes('clamp(1.75rem'),
    'Fluid typography clamp(1.75rem, ...) present for responsive metric scaling'
  );
  assert(
    scssContent.includes('#ff6100'),
    'Signature Marca Orange (#ff6100) present in SCSS module'
  );
  assert(
    scssContent.includes('repeat(5, minmax(0, 1fr))'),
    '5-column desktop grid structure specified for canonical scorecards'
  );
  assert(
    scssContent.includes('alertPulse'),
    'Radar alertPulse keyframes animation defined for overdue indicator'
  );
  assert(
    scssContent.includes('min-height: 130px'),
    'Exact 130px min-height geometry declared for Zero CLS'
  );

  // Section 3: Dual-Currency Mathematical Calculations & Abbreviation Invariants
  console.log('\nSection 3: Dual-Currency Mathematical Calculations & Abbreviation Invariants');
  assert(USD_TO_INR_RATE === 83.5, 'Institutional exchange rate strictly pegged at 1 USD = ₹83.50');
  assert(formatKpiCurrency(0, 'INR') === '₹ 0', 'Zero amount formatted as ₹ 0');
  assert(formatKpiCurrency(0, 'USD') === '$ 0', 'Zero amount formatted as $ 0');
  assert(formatKpiCurrency(4850000, 'INR') === '₹ 48.5 L', '48.5 Lakhs formatted correctly (₹ 48.5 L)');
  assert(formatKpiCurrency(12500000, 'INR') === '₹ 1.25 Cr', '1.25 Crores formatted correctly (₹ 1.25 Cr)');
  assert(formatKpiCurrency(35000 * 83.5, 'USD') === '$ 35K', '35K USD formatted correctly ($ 35K)');
  assert(formatKpiCurrency(1400000 * 83.5, 'USD') === '$ 1.4M', '1.4M USD formatted correctly ($ 1.4M)');
  assert(
    formatFullCurrency(4850000, 'INR') === '₹ 48,50,000',
    'Full precision INR tooltip formatted with locale commas'
  );
  assert(
    formatSyncTimestamp(null) === 'Sync pending',
    'Sync timestamp correctly humanizes null state'
  );

  const mockPayload: PipelineRpcMetrics = {
    total_leads_count: 142,
    open_leads_count: 20,
    potential_leads_count: 38,
    potential_pipeline_value: 4850000,
    stage_weighted_pipeline_value: 2910000,
    converted_leads_count: 19,
    converted_revenue_value: 3200000,
    lost_leads_count: 12,
    disqualified_leads_count: 3,
    overdue_follow_ups_count: 4,
    conversion_rate_percentage: 13.4,
  };

  const normalized = extractKpiMetrics(mockPayload);
  assert(normalized.totalLeads === 142, 'Normalized totalLeads matches payload');
  assert(normalized.activeLeads === 58, 'Normalized activeLeads sums open and potential deals');
  assert(normalized.stageWeightedValue === 2910000, 'Normalized stageWeightedValue preserved');
  assert(normalized.overdueCount === 4, 'Normalized overdueCount matches payload');

  // Section 4: Workspace Surfaces Integration Verification
  console.log('\nSection 4: Workspace Surfaces Integration Verification');
  const dashboardContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/app/admin/(workspace)/page.tsx'),
    'utf-8'
  );
  assert(
    dashboardContent.includes('<KpiRibbon initialData={rpcMetrics} />') ||
      dashboardContent.includes('<KpiRibbon'),
    'Executive Command Center (/admin) mounts <KpiRibbon />'
  );

  const analyticsContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/app/admin/(workspace)/analytics/page.tsx'),
    'utf-8'
  );
  assert(
    analyticsContent.includes('<KpiRibbon initialData={rpcMetrics} />') ||
      analyticsContent.includes('<KpiRibbon'),
    'Revenue & Pipeline Analytics (/admin/analytics) mounts <KpiRibbon />'
  );

  const leadsContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/app/admin/(workspace)/leads/page.tsx'),
    'utf-8'
  );
  assert(
    leadsContent.includes('<KpiRibbon') && leadsContent.includes('syncWithUrlParams={true}'),
    'Deals & Inquiries Workspace (/admin/leads) mounts <KpiRibbon syncWithUrlParams={true} />'
  );

  // Section 5: Anti-Slop AST Gate & Code Hygiene
  console.log('\nSection 5: Anti-Slop AST Gate & Code Hygiene');
  const filesForAntiSlop = [
    'src/app/admin/components/kpi/KpiRibbon.tsx',
    'src/app/admin/components/kpi/KpiCard.tsx',
    'src/app/admin/components/kpi/KpiSkeleton.tsx',
    'src/app/admin/components/kpi/kpiFormatters.ts',
    'src/app/admin/components/kpi/index.ts',
    'src/app/admin/(workspace)/page.tsx',
    'src/app/admin/(workspace)/analytics/page.tsx',
    'src/app/admin/(workspace)/leads/page.tsx',
  ];

  for (const relPath of filesForAntiSlop) {
    const full = path.resolve(process.cwd(), relPath);
    const content = fs.readFileSync(full, 'utf-8');

    // Rule 1: Zero generic blue (#2563eb)
    assert(!content.includes('#2563eb'), `Zero generic blue (#2563eb) in ${relPath}`);

    // Rule 2: Zero decorative comment banners
    const hasDecorativeBanner = /\/\/\s*={4,}|\/\/\s*-{4,}/.test(content);
    assert(!hasDecorativeBanner, `Zero decorative comment banners in ${relPath}`);

    // Rule 3: Zero ': any' types in TypeScript files
    if (relPath.endsWith('.ts') || relPath.endsWith('.tsx')) {
      const hasAny = /:\s*any\b/.test(content);
      assert(!hasAny, `Zero ': any' types in ${relPath}`);
    }
  }

  // Section 6: AbortController Pattern Verification
  console.log('\nSection 6: AbortController Race-Condition Defense');
  const kpiRibbonCode = fs.readFileSync(
    path.resolve(process.cwd(), 'src/app/admin/components/kpi/KpiRibbon.tsx'),
    'utf-8'
  );
  assert(
    kpiRibbonCode.includes('new AbortController()') && kpiRibbonCode.includes('.abort()'),
    'AbortController request cancellation pattern implemented in KpiRibbon.tsx'
  );
  assert(
    kpiRibbonCode.includes('AbortError'),
    'AbortError handled gracefully without unhandled promise rejections'
  );

  console.log('\n============================================================');
  console.log(`Verification Complete: ${passed}/${passed + failed} assertions passed.`);
  if (failed > 0) {
    console.error(`Verification Failed with ${failed} failure(s).`);
    console.log('============================================================');
    process.exit(1);
  } else {
    console.log('Sprint 6.2 Executive KPI Ribbon & Recalculation Engine Certified.');
    console.log('============================================================\n');
  }
}

runVerification().catch((err) => {
  console.error('[FATAL] Verification suite crashed:', err);
  process.exit(1);
});
