import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('CRM list query resilience and overview hierarchy', () => {
  const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
  const leads = read('src/app/admin/(workspace)/leads/page.tsx');
  const deals = read('src/app/admin/(workspace)/deals/page.tsx');
  const overview = read('src/app/admin/components/Dashboard/OverviewWorkspace.tsx');
  const overviewStyles = read('src/app/admin/components/Dashboard/OverviewWorkspace.module.scss');

  it('keeps primary lead queries independent from owner-directory view relationships', () => {
    assert.ok(leads.includes(".from('crm_team_directory')"));
    assert.ok(leads.includes('ownerNameById.get(l.assigned_to)'));
    assert.ok(!leads.includes('crm_team_directory!leads_assigned_to_fkey'));
    assert.ok(!leads.includes('lead_sources(id, name, color_code)'));
    assert.ok(leads.includes('sourceById.get(l.lead_source_id)'));
    assert.ok(leads.includes('invalidFilter || leadsRes.error || statusesRes.error'));
    assert.ok(leads.includes('Lead records are available'));
  });

  it('keeps deal rows available when optional directory or source lookups fail', () => {
    assert.ok(deals.includes(".from('crm_team_directory')"));
    assert.ok(deals.includes('ownerNameById.get(item.assigned_to as string)'));
    assert.ok(!deals.includes('crm_team_directory!leads_assigned_to_fkey'));
    assert.ok(!deals.includes('lead_sources!leads_lead_source_id_fkey'));
    assert.ok(deals.includes("sourceNameById.get(item.lead_source_id as string)"));
    assert.ok(deals.includes('invalidFilter || dealsRes.error || statusesRes.error'));
    assert.ok(deals.includes('Deal records are available'));
  });

  it('prioritizes actionable work before period outcomes and reflows for narrow screens', () => {
    const work = overview.indexOf('id="today-heading"');
    const outcomes = overview.indexOf('id="outcomes-heading"');
    assert.ok(work >= 0 && outcomes > work);
    assert.ok(overviewStyles.includes('minmax(0, 1fr)'));
    assert.ok(overviewStyles.includes('@media (max-width: 700px)'));
  });
});
