# Deep Feature, Security & AI-Slop Audit Report: Main 4 CRM Tabs & Lead Conversion Engine

**Scope:** Overview (`/admin`), Follow-ups (`/admin/tasks`), Inbound Leads (`/admin/leads`), Pipeline Deals (`/admin/deals`), Lead Sidebar Drawer vs. Dedicated Dossier (`/admin/leads/[id]`), Client Works Conversion (`/admin/works`), Server Actions, and Supabase RLS / RPC Migrations.  
**Date:** 2026-11-25  
**Audited Baseline:** `master` @ `1b49e727b739ada24b5e2417247ebd86a85735e0`

---

## 1. Critical Database & Conversion Blockers (Will Fail or Corrupt Data in Production)

| Severity | Issue & Location | Technical Root Cause | Impact |
|---|---|---|---|
| **CRITICAL** | **Broken `client_works` Auto-Spawn Trigger**<br>`supabase/migrations/20261026000001_harden_reassignment_and_search_paths.sql:230-311` | `20261019000002` created `public.client_works` with columns `(lead_id, client_name, company, service_scope, contract_value, delivery_stage, health_status, creative_lead_id, tech_lead_id, milestones, kickoff_date, target_delivery_date)`. `20261026000001` later overwrote `auto_spawn_client_work_on_conversion()` to insert into **non-existent columns** (`project_name`, `scope_narrative`, `technical_lead_id`, `start_date`, `target_completion_date`, `current_milestones`) and read `NEW.company_name` (`leads` has `company`, not `company_name`), while omitting `NOT NULL client_name`. | Marking **any** lead as `Converted` triggers PostgreSQL runtime error and rolls back conversion! |
| **CRITICAL** | **Broken Atomic Reassignment RPC**<br>`supabase/migrations/20261026000001:108, 122-131` | `execute_atomic_lead_reassignment` references non-existent `leads.estimated_value`, `lead_activities.user_id`/`details`, and invalid enum `'reassigned'`. | Bulk lead reassignment RPC crashes in PostgreSQL when `20261026000001` is applied. |
| **CRITICAL** | **Cannot Mark Lead Won From Dedicated Page (`/admin/leads/[id]`)**<br>`src/app/admin/(workspace)/leads/[id]/DossierWorkspace/LeadDossierWorkspaceClient.tsx:395-398` | Selecting a `converted` stage in `DossierHeaderBar` opens `ConvertLeadToDealModal` instead of `StageTransitionModal` (`ConvertedCelebrationModal`). `convertInboundLeadToDealAction` (`src/app/actions/leads.ts:1012-1017`) rejects terminal stages. | Dead-end when trying to mark a deal Closed Won from `/admin/leads/[id]`. |
| **HIGH** | **`sales_executive` Sees Manager/Admin Actions as `"System Staff"` / `"System Cadence Engine"`**<br>`src/app/actions/leads.ts:351, 362-367` & `src/app/actions/leadActivityActions.ts:274` | `getLeadDetails()` & `getLeadActivitiesAction()` join `public.profiles` directly instead of `public.crm_team_directory`. Under `profiles_select_scoped` (`20261105000001:34-42`), `sales_executive` only sees `id = auth.uid()`. | Other team members' notes/assignments return `profiles = null` and render as `"System Staff"`. Also breaks ID->name delta resolution. |
| **HIGH** | **Duplicate `lead_activities` Audit Rows on Every Edit**<br>`supabase/migrations/20261015000002:113-226` + Actions | `trg_audit_lead_changes` inserts a `field_update` row on every `UPDATE public.leads`, while `complete_lead_follow_up`, `scheduleFollowUpAction`, `updateLeadStatusInlineAction`, `transitionTo*Action`, and `updateLeadDetailsAction` also manually insert a row. | Every status change, reschedule, or follow-up completion clutters Activity History with 2 duplicate rows. |

---

## 2. Hardcoded / Fake / AI-Slop Telemetry & Token Violations

### Tab 1: Overview (`/admin`)
- **`Earning Overview` always shows `+18% ↑` green badge (`EarningOverviewSplineCard.tsx:104-108`)**: Literally returns `growthPercentage: 18` when real points exist (even when Closed Revenue is `₹ 0`), never reads `data.revenueDelta`, and omits `growthPercentage` from props. Empty points fall back to fake `6540000` (`timeframeUtils.ts:212`) + hardcoded `2.8%/1.5%/4.2%/12.4%`.
- **`AVG. SALES CYCLE` hardcodes `"14 Days"` (`ExecutiveTelemetryMasthead.tsx:341-348`)**: Shown whenever `averageCycleDays` is `null` or `<= 0`.
- **`WEIGHTED VALUE` pill hardcodes `"36.0%"` (`ExecutiveTelemetryMasthead.tsx:300-304`)**: Shown whenever `pipelineValue` or `weightedPotential` is `0`/`null` (including `sales_executive` redacted view!).
- **`EXECUTIVE DESK` dark card hardcodes `winRate={84}` (`ExecutiveTelemetryMasthead.tsx:226`) & `dealCount = 39` default (`LuxuryVirtualCard.tsx:30-31`)**.
- **`Practice Allocation` uses fabricated timeframe multipliers (`SpendingOverviewBarCard.tsx:84-128`, `timeframeUtils.ts:280-331`)**: `This Week` / `This Quarter` / `This Year` multiply current pipeline by `0.25x` / `2.4x` / `8.5x` and hardcode `44% Web & Digital`, `31% Full-Suite Advisory`, `25% Others`.
- **`Cash Flow` synthesizes fake sine-wave bars (`CommercialVelocityBarChart.tsx:42-64, 120-143`)** when `intakeVal === 0`, while displaying all-time `₹65,40,000` above periodic bars and masking negative deltas via `Math.abs()`.
- **`Upcoming Milestones & SLA` (`UpcomingSlaCard.tsx:35-76, 121, 139`)**: Hardcodes `"98% On-Time SLA"`, fake fallback rows (`Nexus Enterprise Advisory`, `Aura Health Global`, `Vertex AI Systems`), and `1500000` (`₹15,00,000`) when `expectedValue` is null; `+` dispatches `open-new-lead-modal` instead of scheduling a milestone.
- **`Recent Transaction` (`RecentTransactionsTable.tsx:35-66, 90-112`)** & **`ExecutiveSlaVelocityGauge.tsx:174-187`**: Fabricates `"✔ Success"` statuses, fake fallback rows, `₹15,00,000` amounts, and `98.4%` / `+3.2d` SLA metrics.
- **`Earning Overview` `This Month` dropdown** updates UI label only when real points exist (never changes points).
- **`Overview` `Advance` button (`OverviewWorkspace.tsx:263-309` -> `StageTransitionModal.tsx:115`)**: Jumps *any* non-terminal stage straight to `Negotiation`!
- **`Practice Allocation` drill-down broken (`SpendingOverviewBarCard.tsx:244` -> `commercialSearch.ts:15`)**: Links to `/admin/deals?search=<Category>`, which doesn't search `service_category`!
- **Overview `25-row` truncation**: `records` capped at `.limit(25)` (`page.tsx:431`), causing `CommercialDealsLedger` & `ExecutiveSlaVelocityGauge` to drop 14+ of the 39 active deals.
- **`WELCOME BACK 👋` emoji in H1 (`ExecutiveTelemetryMasthead.tsx:117`) & `#2563eb` generic blue gradients (`EarningOverviewSplineCard.tsx:306-358`, `SpendingOverviewBarCard.tsx:93-99`)**.

### Tab 2: Follow-ups (`/admin/tasks`) & Drawer / Modals
- **Hardcoded `"Sub-24h Target SLA"` (`tasks/page.tsx:340-344`)**: Static JSX text; never queries `agency_settings` or computes SLA compliance.
- **Dead `Convert` button when Drawer opened from `/admin/tasks` (`ClientDossierDrawer.tsx:358-380`)**: Dispatches `'open-convert-lead-modal'`, which only `LeadsWorkspaceClient` listens to—nothing happens on `/admin/tasks`.
- **13 components dispatch `'crm-toast'` with ZERO listeners anywhere in `src/`**.
- **Lemon-Yellow Portal Token Escape (`#eefb87` / `#e4f375`)**: `ClientDossierDrawer.tsx:589` portals to `document.body`, **outside** `[data-admin-root="true"]` (`AdminRootClientProvider.tsx:46`), causing `DossierDrawer.module.scss` (`Convert`, `15m`, `RECORD TOUCHPOINT`) & `EditLeadModal.module.scss` to render `#eefb87`/`#e4f375` lemon yellow. Additional hardcoded `#eefb87`/`#e4f375`/`#ff6100` exist in `LeadDetailModal.module.scss`, `LeadDossierWorkspace.module.scss`, `SettingsWorkspaceClient.module.scss`, `ConvertedCelebrationModal.tsx:136`, and `mixins.scss:13-39`.
- **Trailing periods (`.`) & all-caps buttons**: `ClientDossierDrawer`, `OrganizationDossier`, and 6 governance modals append `.` to headings; `DossierDrawer.module.scss` forces `uppercase` on `RESCHEDULE` / `RECORD TOUCHPOINT`.
- **Fabricated defaults**: `OrganizationDossier.tsx:97, 209` invents `'Commercial / Luxury'` & `'Custom Retainer'` when null; `CommercialKpiRibbon.tsx:154, 183` hardcodes `'1 USD = 83.50 INR'` and `'Guaranteed'`.

---

## 3. Broken Employee & Manager Workflows Across the 4 Tabs

### Tab 2 — Follow-ups (`/admin/tasks`)
1. **`Unassigned Inbound (2)` has zero Assign / Claim controls** on `TaskCard.tsx`, in `ClientDossierDrawer`, or in `EditLeadModal`.
2. **`Mark complete` silently orphans active deals (`TaskCard.tsx:110-132`)**: Clears `next_follow_up = NULL` with zero outcome note/modal and zero prompt to schedule the next follow-up—so the lead immediately disappears from all 4 queues and the sidebar badge (`33`).
3. **Stale UI & Sidebar Badge**: `AdminWorkspaceShell.tsx` never refreshes on `'lead-data-mutated'`, and 9 Server Actions (`scheduleFollowUpAction`, `transitionTo*`, `updateLeadStatusInlineAction`, `logLeadActivityAction`, `updateLeadDetailsAction`) omit `revalidatePath('/admin/tasks')`.
4. **No Inline Stage, Priority, or Reschedule controls on `TaskCard`**, and `ClientDossierDrawer` itself lacks inline Stage transitions, Rep assignment, and an Email logging tab (`email_sent` exists in schema/actions but not in `QuickActionComposer`).
5. **Unlogged `Call` / `WhatsApp` / `Email` clicks**: Raw links in `TaskCard` and `OrganizationDossier` log zero interaction history.
6. **Stale `revisit_date` bug**: Moving a lead out of `On Hold` back into active stages via `updateLeadStatusInlineAction` or `transitionToNegotiationAction` does not clear `revisit_date`, leaving active leads invisible in `/admin/tasks` & sidebar counts.

### Tab 3 — Leads (`/admin/leads`) & Sidebar Drawer -> Dedicated `/admin/leads/[id]`
1. **`10,054` vs `100` Data & Filter Integrity Bug (`leads/page.tsx:58, 100-133, 235-256`)**:
   - Missing `SYNTHETIC_EXCLUSION` filter on `leads/page.tsx` (surfaces 10,000 synthetic benchmark rows in `10,054` global count).
   - Mixes global exact count (`10,054`) with page-1-sliced KPIs (`Active Triage 77`, `Overdue 21`, `All Inquiries 100` in `FilterActionBar`).
   - Selecting `Overdue` still queries the newest 100 rows (`created_at DESC`) and filters overdue **in memory**—hiding overdue records beyond row 100.
   - Selecting any bucket (`Open`, `Potential`, `Won`) collapses other `FilterActionBar` bucket pill counts to `0`.
   - `buildCommercialSearchFilter` searches only `name`, `company`, `lead_id`—**missing `email` & `phone`** despite trigram indexes.
2. **Missing Inline Representative Assignment**: `LeadsDataGrid.tsx:488-498` & `OrganizationDossier` render Representative as read-only text.
3. **Row Click Hijacks Dedicated Page (`ClientDossierDrawer`)**: Clicking a lead opens the slide-over sidebar drawer instead of the dedicated `/admin/leads/[id]` page (whereas clicking `Dossier ->` in `LeadsDataGrid` only works if user doesn't hit drawer triggers, and `TaskCard` / `DealCard` / `Overview` force-open the drawer via `e.preventDefault()`).
4. **Mutations on `/admin/leads` dispatch `popstate` instead of `router.refresh()`**, leaving KPIs and counts stale.
5. **`BatchReassignModal` mislabels non-overdue leads as `"Overdue"`**.

### Tab 4 — Deals (`/admin/deals`)
1. **Kanban Pagination Breaks Stage Totals (`deals/page.tsx:169-192` & `DealsKanbanBoard.tsx:40-58, 216-229`)**: Column counts & INR valuations sum only the newest 100 rows of Page 1 rather than actual pipeline stage totals, and any column containing even one card with `expected_value === null` wipes the whole sum to `"Value unavailable"`.
2. **Missing Revalidation & Works Handoff**: `stageTransitionActions.ts` omits `revalidatePath('/admin/deals')` & `revalidatePath('/admin/works')`; `ConvertedCelebrationModal.tsx` auto-closes in 850ms without linking to the newly created `PRJ-XXXX` project in `/admin/works`.
3. **Inconsistent `BatchStageModal` (`batch_update_lead_status`)**: Allows moving rows to `converted` without final contract revenue, payment terms, or signed contract date.

---

## 4. Security, RBAC & RLS Gaps Across All Tabs

1. **`can_view_financials` Bypassed Across Tasks, Leads, Works & Dossier**:
   - Default `sales_executive` (`can_view_financials: false`) still has `expected_value` / `contract_value` selected and/or rendered in `tasks/page.tsx:92-121, 336`, `leads/page.tsx:100-106, 173-176`, `works/page.tsx:133, 210`, and `getLeadDetails()` (`src/app/actions/leads.ts:308, 428` -> `CommercialKpiRibbon.tsx:24, 124`).
   - Also `EditLeadModal` lets `sales_executive` view/edit `expected_value` (`leads.ts:763, 1166`).
2. **Fail-Open Page Guards on `/admin/leads/[id]` & `/admin/deals/[id]` (`[id]/page.tsx:70-85`)**:
   - Checks `profile?.status === 'suspended'` instead of `profile?.status !== 'active'` (fails to block `'invited'` or missing profiles).
   - Evaluates `Array.isArray(allowedTabs) ? allowedTabs.includes(...) : true` instead of `ROLE_DEFAULT_TABS[role]` (fails open when `allowedTabs` is null).
3. **`Unassigned Inbound` Tab & Dead `"Convert"` CTA Shown to `sales_executive`**:
   - `tasks/page.tsx` shows `Unassigned Inbound` despite `leads_select_policy` hiding `assigned_to IS NULL` from `sales_executive`.
   - `LeadDossierWorkspaceClient.tsx:572` & `ClientDossierDrawer.tsx:358` show `"Convert"` button to `sales_executive` even though `convertInboundLeadToDealAction` (`leads.ts:956`) forbids them.
4. **Unscoped `SECURITY DEFINER` Analytics RPCs (`20261124220000_analytics_and_leads_telemetry_engine.sql:24-472, 677-691`)**:
   - 5 RPCs run `SECURITY DEFINER` without checking `current_user_role()`, without scoping `sales_executive` to `assigned_to = auth.uid()`, and without `can_view_financials` gating; wrong `REVOKE` parameter signatures leave `PUBLIC` execute intact; joins `la.metadata->>'new_stage'` instead of `new_status_name`.
5. **Over-Permissive `profiles_select_authenticated` (`20261015000003:34-37`)**: Later superseded for active scoping by `20261105000001`, though `getLeadDetails` still queries `public.profiles` instead of `public.crm_team_directory`.
