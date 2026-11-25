import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';
import { buildCommercialSearchFilter } from '@/app/admin/lib/commercialSearch';
import { dashboardFeature, dashboardTab } from '@/app/admin/lib/dashboardContracts';
import { formatAuditDeltaNarrative } from '@/app/admin/components/DossierDrawer/dossierUtils';

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

  it('Round 1 audit hardening eliminates any types, alert/50% dot violations, and enforces atomic completion + auth guards', () => {
    const leadsPage = read('src/app/admin/(workspace)/leads/page.tsx');
    const dealsPage = read('src/app/admin/(workspace)/deals/page.tsx');
    const leadsClient = read('src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx');
    const taskCard = read('src/app/admin/(workspace)/tasks/components/TaskCard.tsx');
    const leadsAction = read('src/app/actions/leads.ts');
    const dpwClient = read('src/app/admin/components/DossierWorkspace/LeadDossierWorkspaceClient.tsx');

    assert.ok(!/\bany\b/.test(leadsPage), 'leads/page.tsx must contain zero any types');
    assert.ok(!/\bany\b/.test(dealsPage), 'deals/page.tsx must contain zero any types');
    assert.ok(!leadsClient.includes('alert('), 'LeadsWorkspaceClient must dispatch crm-toast instead of alert()');
    assert.ok(taskCard.includes('tomorrowTenAmInput') && taskCard.includes('logLeadActivityAction'), 'TaskCard must schedule successor before clearing/logging');
    assert.ok(leadsAction.includes('canViewFinancials') && leadsAction.includes("'[Restricted]'"), 'leads actions enforce server-side financial gating');
    assert.ok(!dpwClient.includes('lucide-react'), 'Dossier workspace must use inline SVG rather than uninstalled lucide-react');
  });

  it('Redacted audit deltas preserve [Restricted] / non-numeric labels instead of rendering ₹0', () => {
    const restrictedRecord = formatAuditDeltaNarrative('Deal valuation adjusted', {
      changes: { expected_value: { old: '[Restricted]', new: '[Restricted]' } },
    });
    const combinedRestricted = `${restrictedRecord.narrative} ${restrictedRecord.deltaPills.join(' ')}`;
    assert.ok(!combinedRestricted.includes('₹0'), 'redacted valuation must never format as ₹0');
    assert.ok(combinedRestricted.includes('Restricted'), 'redacted valuation must surface Restricted state');

    const nonNumericRecord = formatAuditDeltaNarrative('Budget updated', {
      changes: { expected_value: { old: 'N/A', new: 'Pending' } },
    });
    const combinedNonNumeric = `${nonNumericRecord.narrative} ${nonNumericRecord.deltaPills.join(' ')}`;
    assert.ok(!combinedNonNumeric.includes('₹0') && !combinedNonNumeric.includes('NaN'));
  });

  it('Dashboard contract enforces fail-closed financials and allowed_tabs overrides across roles', () => {
    assert.equal(dashboardTab('sales_manager', ['overview', 'leads'], 'analytics'), false);
    assert.equal(dashboardTab('sales_manager', ['overview', 'analytics'], 'analytics'), true);
    assert.equal(dashboardFeature('sales_manager', {}, 'can_view_financials'), false);
    assert.equal(dashboardFeature('sales_manager', 'malformed', 'can_view_financials'), false);
    assert.equal(
      dashboardFeature('sales_manager', { can_view_financials: false }, 'can_view_financials'),
      false
    );
    assert.equal(
      dashboardFeature('sales_manager', { can_view_financials: true }, 'can_view_financials'),
      true
    );
  });
});

interface StageMockState {
  canViewFinancials: boolean;
  leadBucket: 'open' | 'potential' | 'converted' | 'lost';
  convertedAt: string | null;
  selectedColumns: string[];
}

const LEAD_UUID = '00000000-0000-4000-8000-000000000010';
const STATUS_UUID = '00000000-0000-4000-8000-000000000020';

describe('Round 2 Server Action Financial & Converted Lock Guards', { concurrency: false }, () => {
  let tempDir = '';
  const mockState: StageMockState = {
    canViewFinancials: false,
    leadBucket: 'potential',
    convertedAt: null,
    selectedColumns: [],
  };
  let actions: {
    transitionToNegotiationAction: (
      input: {
        leadId: string;
        expectedValue: number;
        anticipatedCloseDate: string;
        notes?: string;
      },
      targetStatusId: string
    ) => Promise<{ success: boolean; error?: string }>;
    transitionToConvertedAction: (
      input: {
        leadId: string;
        finalRevenue: number;
        signedContractDate: string;
        paymentTerms: string;
        notes?: string;
      },
      targetStatusId: string
    ) => Promise<{ success: boolean; error?: string }>;
  };

  class MockStageQuery {
    constructor(private readonly table: string) {}
    select(columns: string): this {
      if (this.table === 'leads') mockState.selectedColumns.push(columns);
      return this;
    }
    eq(): this {
      return this;
    }
    maybeSingle(): this {
      return this;
    }
    single(): this {
      return this;
    }
    then(resolve: (value: unknown) => unknown) {
      if (this.table === 'profiles') {
        return Promise.resolve({
          data: {
            role: 'sales_manager',
            status: 'active',
            feature_permissions: { can_view_financials: mockState.canViewFinancials },
          },
          error: null,
        }).then(resolve);
      }
      if (this.table === 'leads') {
        return Promise.resolve({
          data: {
            id: LEAD_UUID,
            lead_id: 'LD-900',
            name: 'Enterprise Client',
            assigned_to: '00000000-0000-4000-8000-000000000001',
            status_id: STATUS_UUID,
            ...(mockState.canViewFinancials ? { expected_value: 250000 } : {}),
            converted_at: mockState.convertedAt,
            revisit_date: null,
            funnel_statuses: { name: 'Negotiation', bucket: mockState.leadBucket },
          },
          error: null,
        }).then(resolve);
      }
      return Promise.resolve({ data: null, error: null }).then(resolve);
    }
  }

  const globals = globalThis as typeof globalThis & { __stageTestClient?: unknown };

  before(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'stage-guards-'));
    const outfile = path.join(tempDir, 'stage-actions.cjs');
    await build({
      entryPoints: ['src/app/actions/stageTransitionActions.ts'],
      outfile,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      plugins: [
        {
          name: 'mock-next-and-supabase',
          setup(builder) {
            builder.onResolve({ filter: /^@\/app\/lib\/supabase\/server$/ }, () => ({
              path: 'supabase-server',
              namespace: 'stub',
            }));
            builder.onResolve({ filter: /^next\/cache$/ }, () => ({
              path: 'next-cache',
              namespace: 'stub',
            }));
            builder.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({
              contents:
                args.path === 'supabase-server'
                  ? 'export const createClient = async () => globalThis.__stageTestClient;'
                  : 'export const revalidatePath = () => {};',
            }));
          },
        },
      ],
    });
    globals.__stageTestClient = {
      auth: {
        getUser: async () => ({
          data: { user: { id: '00000000-0000-4000-8000-000000000001' } },
          error: null,
        }),
      },
      from: (table: string) => new MockStageQuery(table),
    };
    actions = createRequire(path.join(process.cwd(), 'package.json'))(outfile);
  });

  after(async () => {
    delete globals.__stageTestClient;
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  it('rejects financially restricted callers and never selects expected_value on guarded transitions', async () => {
    mockState.canViewFinancials = false;
    mockState.leadBucket = 'potential';
    mockState.convertedAt = null;
    mockState.selectedColumns.length = 0;

    const negResult = await actions.transitionToNegotiationAction(
      {
        leadId: LEAD_UUID,
        expectedValue: 500000,
        anticipatedCloseDate: '2026-12-31',
      },
      STATUS_UUID
    );
    assert.equal(negResult.success, false);
    assert.match(negResult.error || '', /restricted|financial/i);

    const convResult = await actions.transitionToConvertedAction(
      {
        leadId: LEAD_UUID,
        finalRevenue: 500000,
        signedContractDate: '2026-12-01',
        paymentTerms: 'Net 30 retainer milestone schedule',
      },
      STATUS_UUID
    );
    assert.equal(convResult.success, false);
    assert.match(convResult.error || '', /restricted|financial/i);
    assert.equal(
      mockState.selectedColumns.some((cols) => cols.includes('expected_value')),
      false,
      'must omit expected_value from lead SELECT for restricted callers'
    );
  });

  it('blocks converted deals from re-entering negotiation or re-converting without unlock', async () => {
    mockState.canViewFinancials = true;
    mockState.leadBucket = 'converted';
    mockState.convertedAt = '2026-11-24T10:00:00Z';

    const negLocked = await actions.transitionToNegotiationAction(
      {
        leadId: LEAD_UUID,
        expectedValue: 300000,
        anticipatedCloseDate: '2026-12-31',
      },
      STATUS_UUID
    );
    assert.equal(negLocked.success, false);
    assert.match(negLocked.error || '', /converted|unlock/i);

    const convLocked = await actions.transitionToConvertedAction(
      {
        leadId: LEAD_UUID,
        finalRevenue: 300000,
        signedContractDate: '2026-12-01',
        paymentTerms: 'Net 30 retainer milestone schedule',
      },
      STATUS_UUID
    );
    assert.equal(convLocked.success, false);
    assert.match(convLocked.error || '', /converted|unlock/i);
  });
});
