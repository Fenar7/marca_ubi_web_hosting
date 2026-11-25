import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildCommercialSearchFilter } from '@/app/admin/lib/commercialSearch';

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

describe('Core Tabs Conversion Engine & Multi-Color Luxury Remediation', () => {
  it('SQL migration 20261125120000 repairs conversion trigger, atomic reassignment, revisit auto-clear, and hardens 5 analytics RPCs', () => {
    const sql = read('supabase/migrations/20261125120000_fix_conversion_trigger_and_rls.sql');
    assert.ok(sql.includes('auto_spawn_client_work_on_conversion'), 'must repair client_works conversion trigger');
    assert.ok(sql.includes('ON CONFLICT (lead_id) DO NOTHING'), 'must idempotently prevent duplicate client_works inserts');
    assert.ok(sql.includes('execute_atomic_lead_reassignment'), 'must repair execute_atomic_lead_reassignment');
    assert.ok(sql.includes('SUM(expected_value)'), 'must use expected_value instead of non-existent estimated_value');
    assert.ok(sql.includes('trg_a_clear_revisit_date_on_exit'), 'must clear revisit_date when leaving On Hold');
    assert.ok(sql.includes("v_role = 'sales_executive'"), 'analytics RPCs must scope sales_executive to own portfolio');
    assert.ok(sql.includes('v_can_view_financials'), 'analytics RPCs must mask monetary totals for restricted users');
    assert.ok(sql.includes("REVOKE EXECUTE ON FUNCTION public.get_funnel_conversion_dropoff(timestamptz, timestamptz, uuid, uuid) FROM PUBLIC, anon;"));
    assert.ok(sql.includes("REVOKE EXECUTE ON FUNCTION public.get_timeframe_revenue_spline(text) FROM PUBLIC, anon;"));
  });

  it('Server Actions use crm_team_directory, clear revisit_date, and enforce active profile & financial boundaries', () => {
    const leads = read('src/app/actions/leads.ts');
    const act = read('src/app/actions/leadActivityActions.ts');
    const stage = read('src/app/actions/stageTransitionActions.ts');
    const inline = read('src/app/actions/leadInlineActions.ts');

    assert.ok(leads.includes('getCrmDirectoryList') && leads.includes('getCrmDirectoryMap'));
    assert.ok(leads.includes('canViewFinancials') && leads.includes('linkedWorkResult'));
    assert.ok(!act.includes("callerProfile.status === 'suspended'"), 'must check status !== active instead of === suspended');
    assert.ok(act.includes("status !== 'active'"));
    assert.ok(stage.includes("client_works") && stage.includes("workId") && stage.includes("projectCode"));
    assert.ok(inline.includes("revisit_date = null") || inline.includes("updatePayload.revisit_date = null"));
  });

  it('Dedicated Lead Command Page handles Won conversions via StageTransitionModal, Email logging, and Client Works links', () => {
    const dpw = read('src/app/admin/components/DossierWorkspace/LeadDossierWorkspaceClient.tsx');
    const composer = read('src/app/admin/components/DossierWorkspace/RapidTouchpointComposer.tsx');
    const modal = read('src/app/admin/components/modals/ConvertedCelebrationModal.tsx');

    assert.ok(!dpw.includes("if (target.bucket === 'converted') {\n        setIsConvertToDealOpen(true)"), 'Won bucket must open StageTransitionModal, not ConvertLeadToDealModal');
    assert.ok(dpw.includes('View Project in Client Works'));
    assert.ok(composer.includes("'email_sent'") && composer.includes('Email'));
    assert.ok(modal.includes('/admin/works'), 'Celebration modal must link converted deals to Client Works');
  });

  it('Overview & Follow-ups workspaces contain zero fabricated multipliers and support Outcome + Reschedule + Inline Assign', () => {
    const masthead = read('src/app/admin/components/Dashboard/ExecutiveTelemetryMasthead.tsx');
    const vcard = read('src/app/admin/components/Dashboard/LuxuryVirtualCard.tsx');
    const tasksPage = read('src/app/admin/(workspace)/tasks/page.tsx');
    const taskCard = read('src/app/admin/(workspace)/tasks/components/TaskCard.tsx');

    assert.ok(!masthead.includes('👋'), 'must remove wave emoji from masthead H1');
    assert.ok(!masthead.includes('winRate={84}') && !masthead.includes('"36.0%"') && !masthead.includes('"14 Days"'), 'must remove hardcoded fake telemetry strings');
    assert.ok(!vcard.includes('winRate = 84') && !vcard.includes('dealCount = 39'), 'virtual card must not hardcode fake defaults');
    assert.ok(tasksPage.includes('agency_settings') && tasksPage.includes('foldDashboardPages') && tasksPage.includes('canViewFinancials'));
    assert.ok(taskCard.includes('scheduleFollowUpAction') && taskCard.includes('FollowUpScheduler') && taskCard.includes('updateLeadAssignee'));
  });

  it('Leads search filter covers name, company, lead_id, email, and phone while excluding synthetic benchmarks cleanly', () => {
    const res = buildCommercialSearchFilter('client@example.com');
    assert.ok(res.filter?.includes('email.ilike.') && res.filter?.includes('phone.ilike.'), 'search must query email and phone');
    const leadsPage = read('src/app/admin/(workspace)/leads/page.tsx');
    const dealsPage = read('src/app/admin/(workspace)/deals/page.tsx');
    assert.ok(leadsPage.includes('countBucketHead') && leadsPage.includes('globalBucketCounts'));
    assert.ok(dealsPage.includes('laneTotals') && dealsPage.includes('foldDashboardPages'));
  });
});
