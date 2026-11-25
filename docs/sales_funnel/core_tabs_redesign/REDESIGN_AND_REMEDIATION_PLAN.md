# Master Redesign & Production Remediation Plan: Core 4 CRM Tabs & Dedicated Lead Command Page

**Scope:** Overview (`/admin`), Follow-ups (`/admin/tasks`), Inbound Leads (`/admin/leads`), Pipeline Deals (`/admin/deals`), Dedicated Lead/Deal Command Page (`/admin/leads/[id]` & `/admin/deals/[id]`), Client Works Conversion (`/admin/works`), Server Actions, and Supabase SQL Migrations.  
**Design Authority:** Brand Typography (`Circular XX`, `Graphik`, `Helvetica Neue` `tabular-nums`) + Primary CTA **Marca Ubi Red** (`#ea002a`) + Multi-Color Reference Architecture (`Finlo Flash`, `Fundora`, `Finexy`, `Recover`) in Warm Light Layered Surfaces (`#f7f7f8` canvas, `#ffffff` crisp cards).  
**Strictly Prohibited:** `#e4f375` / `#eefb87` lemon yellow, `#2563eb` generic blue, `#ff6100` legacy orange, decorative pulsing/status dots, emojis in H1 headings, fake/hardcoded metrics.

---

## 1. Unified Visual & Multi-Color Design Architecture

| Role | Hex & Surface Tokens | Where Applied |
|---|---|---|
| **Primary Brand CTA & Critical Alerts** | `#ea002a` (hover `#c40023`), tint `#fff0f2`, text `#9c001e` | Primary CTAs (`+ New lead`, `Convert to Deal`, `Mark Won`, `Record Touchpoint`), Overdue SLA alerts, Loss reasons, Focus rings |
| **Warm Vibrant Orange (Momentum & Velocity)** | `#f97316` / `#ea580c`, tint `#fff7ed`, text `#9a3412` | Spline/Bar velocity charts (`Finlo Flash` style), Open/Potential intake bars, Call-to-action highlights, active stage progression |
| **Emerald Green (Revenue & Positive Growth)** | `#10b981` / `#059669`, tint `#ecfdf5`, text `#065f46` | Closed Won Revenue KPIs & charts (`Finexy` hero highlight card/accent), positive `%` trend badges, Won stage, Active/Healthy indicators |
| **Deep Indigo / Violet (Advisory & Scope)** | `#4f46e5` / `#4338ca`, tint `#eef2ff`, text `#3730a3` | Service Category chips (`Web & Digital`, `Full-Suite Advisory`, `UI/UX Design`), Discovery/Proposal badges, Upcoming Horizon queue |
| **Warm Amber (Negotiation & Follow-up Attention)** | `#d97706`, tint `#fffbeb`, text `#92400e` | Negotiation guarded badges, Due Today queue, On-Hold revisit tags, Slowing SLA diagnostic chips |
| **Light Layered Surfaces & Ink** | Canvas `#f7f7f8`, Card `#ffffff`, Well `#efefed`, Border `#e4e4e0`, Ink `#111111` / `#454542` / `#5c5c57` | Subtle elevation without nested card-in-card clutter; crisp `Circular XX` display headings, `Graphik` UI labels/tables, `Helvetica Neue` 300 Light large tabular numerals |

*Note on Portal CSS Scope:* Set `[data-admin-root="true"]` on `document.body` (in `AdminRootClientProvider` or admin layout root) AND replace all `--admin-accent-lemon` fallback hexes so portals (`<dialog>`, modals, dropdowns) can never revert to `#eefb87` / `#e4f375`.

---

## 2. Phased Implementation & Remediation Roadmap

### Phase 1: Database Migrations, Triggers & RLS Security Hardening (Priority Zero)
1. **New Migration (`supabase/migrations/20261125120000_fix_conversion_trigger_and_rls.sql`):**
   - **Restore `auto_spawn_client_work_on_conversion()`**: Insert strictly into valid `public.client_works` columns (`lead_id`, `client_name`, `company`, `service_scope`, `contract_value`, `delivery_stage = 'kickoff'`, `health_status = 'on_track'`, `creative_lead_id = NULL`, `tech_lead_id = NULL`, `milestones`, `kickoff_date = current_date`, `target_delivery_date`), reading `COALESCE(NEW.name, 'Client Project')` and `NEW.company` (never `NEW.company_name`), triggered whenever stage bucket becomes `'converted'` or `NEW.converted_at` transitions from `NULL` to `NOT NULL`. Backfill any existing `converted` leads missing a `client_works` row (`ON CONFLICT (lead_id) DO NOTHING`).
   - **Fix `execute_atomic_lead_reassignment`**: Correct column references (`expected_value`, `lead_activities` schema with `actor_id` / `description` / `'field_update'`) so bulk transfers never crash.
   - **Audit Deduplication**: Support transaction-local `current_setting('app.skip_audit_trigger', true)` inside `trg_audit_lead_changes` (or omit duplicate manual inserts) + automatically reset `revisit_date = NULL` when a lead's `status_id` moves out of `'On Hold'` (`BEFORE UPDATE` guard).
   - **Harden 5 Analytics RPCs (`20261124220000`)**: Scope by `public.current_user_role()` + `assigned_to = auth.uid()` for `sales_executive`, gate monetary sums by caller `can_view_financials`, fix metadata join (`new_status_name` + `new_stage`), and revoke `PUBLIC` execute using exact function signatures.
2. **Enforce `can_view_financials` & Strict Page Guards Across Actions & SSR Pages:**
   - Centralize `assertCanViewFinancials()` & `crm_team_directory` lookups (replacing direct `public.profiles` joins in `getLeadDetails` & `getLeadActivitiesAction` so `sales_executive` sees real colleague/manager names instead of `"System Staff"`).
   - Enforce `can_view_financials` DB column omission & UI masking across `tasks/page.tsx`, `leads/page.tsx`, `works/page.tsx`, `getLeadDetails()`, `EditLeadModal`, and `CommercialKpiRibbon`.
   - Fix `leads/[id]/page.tsx` & `deals/[id]/page.tsx` guards (`profile?.status !== 'active'`, `ROLE_DEFAULT_TABS[role]` fallback).
3. **Global Feedback Infrastructure:**
   - Mount a clean accessible **CRM Toast Center** listening to `'crm-toast'` inside `AdminWorkspaceShell.tsx` (in Brand Red / Emerald / Amber) so all 13 toast-emitting modals & inline controls provide real feedback.

---

### Phase 2: Dedicated Lead & Deal Command Page (`/admin/leads/[id]`) + Drawer Deprecation
1. **Make Every Lead/Deal Click Open the Dedicated Page (`/admin/leads/[id]`):**
   - Replace `'open-lead-drawer'` interception (`e.preventDefault()`) in `LeadsDataGrid`, `LeadMobileCard`, `TaskCard`, `DealCard`, `DealsTable`, `CommercialDealsLedger`, `UpcomingSlaCard`, and `RecentTransactionsTable` with standard direct navigation to `/admin/leads/[id]` (deprecating the cluttered `ClientDossierDrawer` slide-over).
2. **Fix All Bugs & Redesign `/admin/leads/[id]` (`LeadDossierWorkspaceClient`):**
   - **Won / Stage Transition Routing Fix:** Route selecting any `converted` stage in `DossierHeaderBar` to `StageTransitionModal` (`ConvertedCelebrationModal`) — NEVER `ConvertLeadToDealModal` (`Qualified` only). Gate `"Convert to Deal"` (`open` leads) and `"Convert"` permissions strictly to `admin`/`sales_manager` (or permitted roles matching Server Action rules).
   - **Unassigned / Rollback Fix:** Fix `<option value="">` vs `UUID_REGEX` mismatch in `LeadDossierWorkspaceClient.tsx` & restore `assigned_to_name` cleanly on failed assignment updates.
   - **Works Project Link & Handoff:** In `ConvertedCelebrationModal.tsx` and `/admin/leads/[id]`, query linked `public.client_works` by `lead_id` and render a prominent Emerald `"View Active Project in Client Works (PRJ-XXXX) →"` card/CTA upon conversion (removing the 850ms auto-close trap and adding `revalidatePath('/admin/works')` + `revalidatePath('/admin/deals')`).
   - **Multi-Color Command Layout (Reference Inspired):**
     - Clean Header Rail (Back link, copyable `LD-XXXX` pill, `Circular XX` client/company title without trailing period, semantic icon-paired Stage badge with inline transition menu, Brand Red primary CTA + `Schedule Follow-up` + `Edit Scope`).
     - 3-Metric Semantic Telemetry Strip: Emerald **Expected Valuation**, Amber **SLA Priority & Due Countdown**, Warm Orange **Pipeline Progression Bar**.
     - 7:5 Split Body: Left (`7fr`) Organization & Decision Maker card (`tel:`, `wa.me`, `mailto:` with click-to-log touchpoint prompt + Indigo service chip + Inline Representative Selector) + Notion-style `2px`-accented Ingestion Brief & Notes; Right (`5fr`) Sticky Omnichannel Composer (`Call`, `WhatsApp`, **`Email`**, `Meeting`, `Note`) + clean Icon-Timeline Activity Log (zero dot glyphs, zero duplicate trigger noise, zero lemon yellow).

---

### Phase 3: Tab 1 (`Overview /admin`) & Tab 2 (`Follow-ups /admin/tasks`) Redesign & Real-Data Remediation
1. **Tab 1: Overview (`/admin`) — Real Telemetry Only & Finlo/Finexy-Inspired Visuals:**
   - Purge **100% of hardcoded/fake values** (`+18% ↑`, `"14 Days"`, `"36.0%"`, `winRate={84}`, `"98% On-Time SLA"`, fake multipliers in `SpendingOverviewBarCard`, sine-wave placeholder bars in `CommercialVelocityBarChart`, fake `"Nexus Enterprise Advisory"` & `₹15,00,000` fallbacks, fake `"✔ Success"` rows, `👋` emoji in H1).
   - Fix real computation & interactivity:
     - Pass real `revenueDelta` and period-matched `converted_at` buckets cleanly; make `Earning Overview` local period toggle (`Week` / `Month` / `Quarter`) filter real grouped data smoothly with rich interactive tooltip callouts (Emerald `#10b981` + Warm Orange `#f97316` reference palette).
     - Replace `SpendingOverviewBarCard` (`Practice Allocation`) fake multipliers and `#2563eb` gradient with real timeframe-scoped `service_category` aggregations and multi-color Indigo/Orange/Emerald segmented bars + working `/admin/deals?service_category=...` drilldown!
     - Upgrade `Upcoming Milestones & SLA` (`+` opens `FollowUpScheduler` / Lead task selector, shows real `next_follow_up` items + real % on-time SLA from live follow-ups & `agency_settings`), and remove `.limit(25)` truncation on summary metrics.
     - Fix `Advance` in `OverviewWorkspace.tsx` to advance to the actual next stage (`stages[idx + 1]`) and use guarded transition modals properly. Gate Analytics/Tasks links cleanly by user role.
2. **Tab 2: Follow-ups (`/admin/tasks`) — Complete Employee Action Loop:**
   - Replace static `"Sub-24h Target SLA"` KPI with real metrics from `agency_settings` + live overdue/on-time ratio; align `Total Queue Volume` with clear unscheduled active-deal visibility; paginate `fetchOverdueExposure()` so >1,000 rows aren't truncated.
   - Replace 1-click `Mark complete` orphan bug with a fast **Completion & Next-Step Modal/Popover**: requires brief interaction outcome note + lets rep immediately **"Schedule Next Follow-up"** (`Tomorrow 10am` / custom date) or **"Advance Stage / Close"** (only allowing unscheduled clear explicitly).
   - Add **inline `"Assign"` / `"Claim"` action** on `Unassigned Inbound` rows (hide `Unassigned` tab or add RLS-backed claim action for `sales_executive` if desired; support `admin`/`sales_manager` 1-click assignment right on `TaskCard`).
   - Add **inline `"Reschedule"` button** + post-telephony quick-log prompt (`Call` / `WhatsApp` / `Email`), plus full `revalidatePath('/admin/tasks')` & `router.refresh()` sync across sidebar badge (`33`) and queue tabs.
   - Multi-color queue accent bars: Critical Overdue (Marca Red `#ea002a`), Due Today (Amber `#d97706`), Upcoming (Indigo `#4f46e5`), Unassigned (Warm Slate `#454542`).

---

### Phase 4: Tab 3 (`Leads /admin/leads`) & Tab 4 (`Deals /admin/deals`) Redesign & Scaling Fixes
1. **Tab 3: Inbound Leads (`/admin/leads`):**
   - Fix `10,054` vs `100` mismatch cleanly: exclude `synthetic_benchmark` rows matching Overview/Analytics, fetch true global KPIs + per-bucket counts across active filters from DB, move `Overdue` filter and sorting (`?sort=...&dir=...`) to PostgreSQL (`leads/page.tsx`), and include `email` & `phone` in `buildCommercialSearchFilter`.
   - Add `InlineAssigneeSelect` right inside `LeadsDataGrid` (for `admin`/`sales_manager`), add `Lead Source` & `Industry` fields to `NewLeadModal`, fix `BatchReassignModal` non-overdue copy, replace `popstate` hacks with `router.refresh()`.
   - Multi-color Editorial Light Luxury visual polish: clean hairline KPI strip (no heavy 4-box clutter), colorful semantic bucket tabs & stage badges (Orange `Open`, Indigo `Potential`, Emerald `Won`, Marca Red `Lost` / `Overdue`), row click navigates straight to `/admin/leads/[id]`.
2. **Tab 4: Pipeline Deals (`/admin/deals`):**
   - Add server-side grouped stage count & INR valuation summary query in `deals/page.tsx` so Kanban column headers display **true pipeline totals** regardless of page slice, and render partial valuation counts (`"₹X · N valued"`) instead of suppressing the whole column total when 1 lead lacks `expected_value`.
   - Revalidate `/admin/deals` & `/admin/works` in `stageTransitionActions.ts`; guard `BatchStageModal` so `Won` transitions enforce revenue/contract terms or route cleanly.
   - Sleek multi-color Kanban lanes (`#f7f7f8` lane track, crisp `#ffffff` deal cards, top semantic borders by bucket, Indigo scope tags, Amber/Red overdue chips, click card -> `/admin/leads/[id]`, drag-and-drop preserved for fine pointers + keyboard move modal).

---

## 3. Execution Verification Checklist (After Approval)
1. Apply & verify SQL migration invariants + RLS tests (`npm run test:boundaries`, `tests/database/*`, `tests/rls/*`, `npm run test:unit`).
2. Zero TypeScript errors (`npx tsc --noEmit` exit `0`), zero Sass errors, `graphify update .` clean.
3. Zero banned tokens (`#eefb87`, `#e4f375`, `#ff6100`, `#2563eb`, `.radarDot`, status-dot spans) across `src/app/admin/`.
4. Dedicated **Senior CTO PR Auditor Agent** sign-off on a clean new branch & PR (never auto-merged).
