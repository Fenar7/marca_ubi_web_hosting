import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('CRM list query resilience and overview hierarchy', () => {
  const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
  const leads = read('src/app/admin/(workspace)/leads/page.tsx');
  const deals = read('src/app/admin/(workspace)/deals/page.tsx');
  const tasks = read('src/app/admin/(workspace)/tasks/page.tsx');
  const works = read('src/app/admin/(workspace)/works/page.tsx');
  const crmDirectory = read('src/app/admin/lib/crmDirectory.ts');
  const overview = read('src/app/admin/components/Dashboard/OverviewWorkspace.tsx');
  const overviewStyles = read('src/app/admin/components/Dashboard/OverviewWorkspace.module.scss');

  it('keeps primary lead queries independent from owner-directory view relationships', () => {
    assert.ok(leads.includes(".from('crm_team_directory')"));
    assert.ok(leads.includes('ownerNameById.get(l.assigned_to)'));
    assert.ok(!leads.includes('crm_team_directory!leads_assigned_to_fkey'));
    assert.ok(!leads.includes('lead_sources(id, name, color_code)'));
    assert.ok(leads.includes('sourceById.get(l.lead_source_id)'));
    assert.ok(leads.includes('invalidFilter || leadsRes.error || statusesRes.error'));
    assert.match(leads, /profilesRes\.error\s*\? await supabase\.from\('profiles'\)[^\n]*\.eq\('status', 'active'\)/);
    assert.ok(leads.includes('lookupNotice={lookupNotice}'));
  });

  it('keeps deal rows available when optional directory or source lookups fail', () => {
    assert.ok(deals.includes(".from('crm_team_directory')"));
    assert.ok(deals.includes('ownerNameById.get(item.assigned_to as string)'));
    assert.ok(!deals.includes('crm_team_directory!leads_assigned_to_fkey'));
    assert.ok(!deals.includes('lead_sources!leads_lead_source_id_fkey'));
    assert.ok(deals.includes("sourceNameById.get(item.lead_source_id as string)"));
    assert.ok(deals.includes('invalidFilter || dealsRes.error || statusesRes.error'));
    assert.match(deals, /from\('profiles'\)\.select\('id, full_name'\)\.eq\('status', 'active'\)/);
    assert.ok(deals.includes('lookupNotice={lookupNotice}'));
  });

  it('prioritizes executive telemetry and commercial action queue with responsive layout', () => {
    const masthead = overview.indexOf('ExecutiveTelemetryMasthead');
    const cockpit = overview.indexOf('visualCockpitGrid');
    const ledger = overview.indexOf('ledgerSection');
    assert.ok(masthead >= 0 && cockpit > masthead && ledger > cockpit);
  });

  it('keeps follow-up queue tasks queries independent from view joins and uses resilient directory resolution', () => {
    assert.ok(!tasks.includes('crm_team_directory!leads_assigned_to_fkey'));
    assert.ok(tasks.includes('getCrmDirectoryMap'));
    assert.ok(tasks.includes('ownerNameById.get(lead.assigned_to)'));
  });

  it('keeps client works delivery workspace decoupled from view relationship hints', () => {
    assert.ok(!works.includes('crm_team_directory!client_works_creative_lead_id_fkey'));
    assert.ok(!works.includes('crm_team_directory!client_works_tech_lead_id_fkey'));
    assert.ok(works.includes('getCrmDirectoryMap'));
    assert.ok(works.includes('getCrmDirectoryList'));
  });

  it('provides multi-tier fallback with profiles in shared directory helper', () => {
    assert.ok(crmDirectory.includes("from('crm_team_directory')"));
    assert.ok(crmDirectory.includes("from('profiles')"));
    assert.ok(crmDirectory.includes("getCrmDirectoryMap"));
    assert.ok(crmDirectory.includes("getCrmDirectoryList"));
  });
});
