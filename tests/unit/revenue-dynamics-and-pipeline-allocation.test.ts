import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Command Center trend and pipeline stage views', () => {
  const root = process.cwd();
  const chart = fs.readFileSync(path.join(root, 'src/app/admin/components/Dashboard/RevenueDynamicsCard.tsx'), 'utf8');
  const chartStyles = fs.readFileSync(path.join(root, 'src/app/admin/components/Dashboard/RevenueDynamicsCard.module.scss'), 'utf8');
  const pipeline = fs.readFileSync(path.join(root, 'src/app/admin/components/Dashboard/PipelineAllocationCard.tsx'), 'utf8');
  const pipelineStyles = fs.readFileSync(path.join(root, 'src/app/admin/components/Dashboard/PipelineAllocationCard.module.scss'), 'utf8');
  const page = fs.readFileSync(path.join(root, 'src/app/admin/(workspace)/page.tsx'), 'utf8');

  it('charts only persisted converted contract value and provides truthful empty/error states', () => {
    assert.ok(chart.includes('cashSpline'));
    assert.ok(!chart.includes('quotaSpline'));
    assert.ok(chart.includes('conversionCount === 0'));
    assert.ok(chart.includes('className={styles.zeroState}'));
    assert.ok(chart.includes('className={styles.zeroTimeline}'));
    assert.ok(chart.includes('point.fullPeriod'));
    assert.ok(chart.includes('dataStatus === "unavailable"'));
    assert.ok(chart.includes('handleChartKeyDown'));
    assert.ok(chartStyles.includes('.emptyState'));
    assert.ok(chartStyles.includes('.zeroStateMessage {\n  display: grid;'));
    assert.ok(chartStyles.includes('grid-template-columns: minmax(0, 1fr)'));
    assert.ok(chartStyles.includes('border-bottom: 1px solid var(--admin-border-strong'));
    assert.ok(chartStyles.includes('tabular-nums'));
  });

  it('derives stage counts and value from configured status rows and links to the filtered deal view', () => {
    assert.ok(page.includes('stageTotals'));
    assert.ok(page.includes('statusById.get(lead.status_id)'));
    assert.ok(page.includes('stage.value += amount'));
    assert.ok(pipeline.includes('stageLedgerList'));
    assert.ok(pipeline.includes('stage.dealCount'));
    assert.ok(pipeline.includes('stage.amount'));
    assert.ok(pipeline.includes('stage.color'));
    assert.ok(pipeline.includes('encodeURIComponent(stage.id)'));
  });

  it('distinguishes unavailable pipeline data from a genuine empty pipeline', () => {
    assert.ok(pipeline.includes("dataStatus === 'unavailable'"));
    assert.ok(pipeline.includes('No open or potential stages are configured'));
    assert.ok(pipeline.includes('The pipeline has no active deals'));
    assert.ok(pipelineStyles.includes('.emptyState'));
  });

  it('uses continuous valuation proportions and readable stage rows without synthetic benchmark claims', () => {
    assert.ok(pipeline.includes('flexGrow: stage.amount'));
    assert.ok(pipeline.includes('stage.percentage.toFixed(1)'));
    assert.ok(pipelineStyles.includes('.segmentedBarTrack'));
    assert.ok(pipelineStyles.includes('.stageLedgerRow'));
    assert.ok(!pipeline.includes('velocityDays'));
    assert.ok(!pipeline.includes('dropOffRatePct'));
  });
});
