import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Executive overview reporting and responsive layout', () => {
  const root = process.cwd();
  const page = fs.readFileSync(path.join(root, 'src/app/admin/(workspace)/page.tsx'), 'utf8');
  const layout = fs.readFileSync(path.join(root, 'src/app/admin/(workspace)/page.module.scss'), 'utf8');
  const pipeline = fs.readFileSync(path.join(root, 'src/app/admin/components/Dashboard/PipelineAllocationCard.tsx'), 'utf8');
  const attention = fs.readFileSync(path.join(root, 'src/app/admin/components/Dashboard/AttentionQueue.tsx'), 'utf8');

  it('retains session and workspace authorization guards before reading dashboard records', () => {
    assert.ok(page.includes('supabase.auth.getUser()'));
    assert.ok(page.includes("redirect('/admin/login?next=%2Fadmin')"));
    assert.ok(page.includes('hasCommandCenterAccess'));
    assert.ok(page.includes("if (!hasCommandCenterAccess) notFound()"));
  });

  it('reduces bounded pages and excludes synthetic records from live totals', () => {
    assert.ok(page.includes('MAX_DASHBOARD_ROWS = 50000'));
    assert.ok(page.includes('reduceAllPages'));
    assert.ok(page.includes('consume(summary, data)'));
    assert.ok(page.includes('SYNTHETIC_EXCLUSION'));
    assert.ok(page.includes('safe aggregation limit'));
  });

  it('derives pipeline stages from configured funnel statuses and labels unavailable data', () => {
    assert.ok(page.includes("status.bucket === 'open' || status.bucket === 'potential'"));
    assert.ok(page.includes('statusById.get(lead.status_id)'));
    assert.ok(pipeline.includes('stage.color'));
    assert.ok(pipeline.includes("dataStatus === 'unavailable'"));
    assert.ok(pipeline.includes('stage.amount'));
  });

  it('places active opportunities and stage distribution in 2-column showcase before triage queue and revenue pacing', () => {
    const mainGridPosition = page.indexOf('className={styles.mainGridSection}');
    const ledgerPosition = page.indexOf('<CommercialDealsTable');
    const allocationPosition = page.indexOf('<PipelineAllocationCard');
    const attentionPosition = page.indexOf('<AttentionQueue');
    const analysisPosition = page.indexOf('className={styles.analysisSection}');
    assert.ok(mainGridPosition >= 0 && mainGridPosition < attentionPosition);
    assert.ok(ledgerPosition >= 0 && ledgerPosition < attentionPosition);
    assert.ok(allocationPosition >= 0 && allocationPosition < attentionPosition);
    assert.ok(attentionPosition < analysisPosition);
    assert.ok(page.includes('<PipelineAllocationCard'));
    assert.ok(page.includes('<RevenueDynamicsCard'));
    assert.ok(layout.includes('.fluidCanvas'));
    assert.ok(layout.includes('.mainGridSection'));
    assert.ok(layout.includes('.analysisSection'));
    assert.ok(layout.includes('.operationsSection'));
    assert.ok(layout.includes('@media (max-width: 1250px)'));
    assert.ok(attention.includes('role="status"'));
  });
});
