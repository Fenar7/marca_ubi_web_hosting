import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('CRM list query resilience and overview hierarchy', () => {
  const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
  const leads = read('src/app/admin/(workspace)/leads/page.tsx');
  const deals = read('src/app/admin/(workspace)/deals/page.tsx');
  const overview = read('src/app/admin/(workspace)/page.tsx');
  const overviewStyles = read('src/app/admin/(workspace)/page.module.scss');

  it('keeps primary lead queries independent from owner-directory view relationships', () => {
    assert.ok(leads.includes(".from('crm_team_directory')"));
    assert.ok(leads.includes('ownerNameById.get(l.assigned_to)'));
    assert.ok(!leads.includes('crm_team_directory!leads_assigned_to_fkey'));
    assert.ok(leads.includes('invalidFilter || leadsRes.error || statusesRes.error'));
    assert.ok(leads.includes('Lead records are available'));
  });

  it('keeps deal rows available when optional directory or source lookups fail', () => {
    assert.ok(deals.includes(".from('crm_team_directory')"));
    assert.ok(deals.includes('ownerNameById.get(item.assigned_to as string)'));
    assert.ok(!deals.includes('crm_team_directory!leads_assigned_to_fkey'));
    assert.ok(deals.includes('invalidFilter || dealsRes.error || statusesRes.error'));
    assert.ok(deals.includes('Deal records are available'));
  });

  it('orders performance and stage context before attention work and the recent deals ledger', () => {
    const analysisPosition = overview.indexOf('className={styles.analysisSection}');
    const attentionPosition = overview.indexOf('<AttentionQueue');
    const ledgerPosition = overview.indexOf('<CommercialDealsTable');
    assert.ok(analysisPosition >= 0 && analysisPosition < attentionPosition);
    assert.ok(attentionPosition < ledgerPosition);
    assert.ok(overviewStyles.includes('grid-template-columns: minmax(0, 1.2fr) minmax(400px, 0.8fr)'));
    assert.ok(overviewStyles.includes('@media (max-width: 1100px)'));
  });
});
