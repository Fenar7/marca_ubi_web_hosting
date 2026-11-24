import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Command Center KPI contracts', () => {
  const root = process.cwd();
  const component = fs.readFileSync(path.join(root, 'src/app/admin/components/Dashboard/ExecutiveKpiGrid.tsx'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'src/app/admin/components/Dashboard/ExecutiveKpiGrid.module.scss'), 'utf8');

  it('presents full INR values and names each metric by its persisted meaning', () => {
    assert.ok(component.includes('formatCrmCurrency'));
    assert.ok(component.includes('Active pipeline'));
    assert.ok(component.includes('Converted contract value'));
    assert.ok(component.includes('Lead conversion rate'));
    assert.ok(component.includes('eligible leads created in'));
    assert.ok(!component.includes('₹') && !component.includes(' Cr'));
  });

  it('keeps missing data distinct from zero and omits unsupported cohort comparisons', () => {
    assert.ok(component.includes("'Unavailable'"));
    assert.ok(component.includes('comparison(kpis.revenueDeltaPercentage'));
    assert.ok(!component.includes('winRateDeltaPercentage'));
    assert.ok(component.includes('conversionEligibleCount'));
  });

  it('uses tabular numerals and responsive keyboard-visible link states', () => {
    assert.ok(styles.includes('font-variant-numeric: tabular-nums'));
    assert.ok(styles.includes('grid-template-columns: repeat(2'));
    assert.ok(styles.includes(':focus-visible'));
  });
});
