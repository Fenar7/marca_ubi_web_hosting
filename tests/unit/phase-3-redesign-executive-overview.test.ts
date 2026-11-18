import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Overview server boundary and work hierarchy', () => {
  const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8').replace(/"/g, "'");
  const page = read('src/app/admin/(workspace)/page.tsx');
  const view = read('src/app/admin/components/Dashboard/OverviewWorkspace.tsx');
  it('checks session and tab before reading pipeline records', () => {
    assert.ok(page.includes('supabase.auth.getUser()'));
    const guard = page.indexOf("'command_center'");
    assert.ok(guard > 0 && guard < page.indexOf(".from('funnel_statuses')"));
    assert.ok(page.includes('notFound()'));
  });
  it('uses bounded aggregates and permission-specific selects', () => {
    assert.ok(page.includes('foldDashboardPages'));
    assert.ok(page.includes('dashboardSelect'));
    assert.ok(page.includes('SYNTHETIC_EXCLUSION'));
  });
  it('prioritizes work and retains independent failure states', () => {
    const work = view.indexOf("id='today-heading'");
    assert.ok(work >= 0 && work < view.indexOf("id='outcomes-heading'"));
    for (const flag of ['recordsReady', 'pipelineReady', 'outcomesReady']) assert.ok(view.includes(flag));
    assert.ok(!page.includes('<ExecutiveKpiGrid'));
  });
});
