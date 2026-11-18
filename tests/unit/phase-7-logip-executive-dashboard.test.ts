import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Commercial Desk overview contracts', () => {
  const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
  const page = read('src/app/admin/(workspace)/page.tsx');
  const pageStyles = read('src/app/admin/components/Dashboard/OverviewWorkspace.module.scss');
  const overview = read('src/app/admin/components/Dashboard/OverviewWorkspace.tsx');
  const kpis = read('src/app/admin/components/Dashboard/ExecutiveKpiGrid.tsx');
  const kpiStyles = read('src/app/admin/components/Dashboard/ExecutiveKpiGrid.module.scss');
  const chart = read('src/app/admin/components/Dashboard/RevenueDynamicsCard.tsx');
  const chartStyles = read('src/app/admin/components/Dashboard/RevenueDynamicsCard.module.scss');
  const ledger = read('src/app/admin/components/Dashboard/CommercialDealsTable.tsx');
  const ledgerStyles = read('src/app/admin/components/Dashboard/CommercialDealsTable.module.scss');
  const masthead = read('src/app/admin/components/Dashboard/ExecutiveMasthead.tsx');
  const mastheadStyles = read('src/app/admin/components/Dashboard/ExecutiveMasthead.module.scss');

  it('renders the complete overview hierarchy and responsive layout', () => {
    assert.ok(page.includes('<OverviewWorkspace data={data}'));
    for (const landmark of ['today-heading', 'pipeline-heading', 'outcomes-heading']) {
      assert.ok(overview.includes(`id="${landmark}"`));
    }
    assert.ok(pageStyles.includes('.workingGrid'));
    assert.ok(pageStyles.includes('@media (max-width: 700px)'));
  });

  it('keeps KPI labels tied to full digit currency and exact conversion cohort counts', () => {
    assert.ok(kpis.includes('formatCrmCurrency'));
    assert.ok(kpis.includes('conversionWonCount'));
    assert.ok(kpis.includes('conversionEligibleCount'));
    assert.ok(kpis.includes("'Unavailable'"));
    assert.ok(!kpis.includes('Win Conversion Rate'));
    assert.ok(kpiStyles.includes('font-variant-numeric: tabular-nums'));
    assert.ok(kpiStyles.includes(':focus-visible'));
  });

  it('only charts persisted converted values and provides keyboard and empty states', () => {
    assert.ok(chart.includes('generateMonotoneBezierPath'));
    assert.ok(chart.includes('handleChartKeyDown'));
    assert.ok(chart.includes('tabIndex={0}'));
    assert.ok(chart.includes('conversionCount === 0'));
    assert.ok(chart.includes('dataStatus === "unavailable"'));
    assert.ok(!chart.includes('quotaSpline'));
    assert.ok(chartStyles.includes('tabular-nums'));
    assert.ok(chart.includes('role="img"') && chart.includes('tabIndex={0}'));
  });

  it('states the bounded search scope and links each record to its lead', () => {
    assert.ok(ledger.includes('Latest 10 active records'));
    assert.ok(ledger.includes('search applies to this sample'));
    assert.ok(ledger.includes('encodeURIComponent(deal.id)'));
    assert.ok(ledger.includes('Open all deals'));
    assert.ok(ledger.includes('dataStatus === "unavailable"'));
    assert.ok(ledgerStyles.includes('.searchInput:focus-visible'));
  });

  it('keeps timeframe and export controls on the page while leaving global lead creation in the shell', () => {
    assert.ok(masthead.includes('Select dashboard timeframe'));
    assert.ok(masthead.includes('Export Report'));
    assert.ok(!masthead.includes('New Lead'));
    assert.ok(mastheadStyles.includes(':focus-visible'));
  });
});
