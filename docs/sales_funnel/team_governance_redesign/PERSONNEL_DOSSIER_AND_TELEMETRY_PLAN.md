# Personnel Dossier (`/admin/team/[id]`), Login Telemetry & Commercial Matrix Plan

> **Branch:** `redesign/crm-dashboard-interactivity-and-drilldown` (PR #130 — strictly **OPEN**, never auto-merged)  
> **Scope:** Full-page Personnel Intelligence Dossier (`/admin/team/[id]`), direct row-click navigation from `/admin/team`, real database login & session history tracking, complete commercial performance matrix, and multi-color Editorial Light Luxury UI without status-dot AI slop.

---

## 1. Root-Cause Gaps Identified

1. **Row Click Opens Sidebar Instead of Dedicated Page:**
   - In `CommercialDirectoryTable.tsx` and `TeamWorkspaceClient.tsx`, clicking a member row opens `MemberGovernanceDrawer` (right sidebar), requiring an extra click on `Open full dossier` to reach `/admin/team/[id]`.
2. **Login Tracking Is Broken / Unimplemented (`profiles.last_login_at` Always Empty):**
   - `public.profiles.last_login_at` exists in the schema (`src/types/crm.ts`), and `PersonnelSecurityEnclave.tsx` renders it, **but `loginAction()` in `src/app/actions/auth.ts` never updates `profiles.last_login_at`** and never records login events anywhere. Every user shows `"Never logged in"`.
   - `team_audit_logs_action_check` in `supabase/migrations/` does not yet allow `'user_login'` (or `'sessions_revoked'`), and there is no login history timeline showing timestamps, IP, or device/user-agent.
3. **Incomplete Commercial Metrics on `/admin/team/[id]` (`getPersonnelProfile` in `src/app/actions/team.ts`):**
   - Currently returns only `wonRevenue`, `activePipelineValue`, `winRatePercentage`, `closedDealsCount`, `wonDealsCount`, `activeDealsCount`, and `totalDealsAssigned`.
   - Missing real metrics:
     - `lostDealsCount` & `lostPipelineValue`
     - `avgWonDealValue` (Average closed-won deal value)
     - `avgSalesCycleDays` (Average days from `leads.created_at` to `leads.converted_at` for won deals)
     - `overdueFollowUpsCount` (Active non-terminal deals with `next_follow_up < NOW()`)
     - `stageBreakdown` (Funnel stage distribution: counts & INR values per stage)
     - `touchpoints30d` & `totalTouchpoints` (Real logged `lead_activities` by `actor_id = userId`)
     - `clientWorksCount` (Active/delivered engagements in `public.client_works` where `creative_lead_id` or `tech_lead_id = userId`)
4. **Visual & "Dot Stuff" UI Gaps:**
   - Multiple components still render small colored dot spans (`statusDot`, `dotActive`, `dotSuspended`, `dotGranted`, `dotDenied`) in `/admin/team` table, `PersonnelCard`, `MemberGovernanceDrawer`, `/admin/team/[id]` header, `TabPermissionsEnclave`, and `RepresentativeDealLedger`.
   - `/admin/team/[id]` relies mostly on monochrome + single green/red accents instead of a sleek, modern, clean multi-color semantic palette anchored in **Marca Ubi Red (`#ea002a`)**.

---

## 2. Database & Backend Architecture

### A. Supabase Migration (`supabase/migrations/20261125000001_personnel_login_telemetry.sql`)
1. Update `public.team_audit_logs` `team_audit_logs_action_check` constraint to include `'user_login'` and `'sessions_revoked'` (preserving all existing allowed actions).
2. Add index `idx_team_audit_logs_target_action_created` on `(target_user_email, action, created_at DESC)` and `(actor_id, created_at DESC)` for fast personnel login & audit queries.
3. Add index on `leads(assigned_to, status_id)` and `lead_activities(actor_id, created_at DESC)` (if not already present) for sub-50ms dossier aggregation.

### B. Real Login Tracking in `src/app/actions/auth.ts`
- Inside `loginAction()` after `signInWithPassword` succeeds and account suspension check passes:
  - Resolve client IP (`resolveClientIp()`) and `user-agent` header (`headers()`).
  - Non-blocking (try/catch so auth never fails if telemetry write hits a transient issue):
    1. Update `public.profiles.last_login_at = new Date().toISOString()` via `getAdminClient()` (or authenticated client under `profiles` self-update policy if service role key is absent in local dev).
    2. Insert `'user_login'` record into `public.team_audit_logs` with `{ actor_id: data.user.id, action: 'user_login', target_user_email: data.user.email, details: { ip_address: clientIp, user_agent: userAgent, method: 'password' } }`.
- Also in `adminRevokePersonnelSessions()` (`src/app/actions/team.ts`), ensure a `'sessions_revoked'` audit event is logged cleanly.

### C. Expanded Real-Data Dossier Query (`getPersonnelProfile` in `src/app/actions/team.ts` + `src/types/crm.ts`)
- Fetch in parallel (`Promise.all`) after caller auth & authorization check:
  1. `targetProfile` + `inviter` name
  2. `funnel_statuses` (`id, name, bucket, color_code, sort_order`)
  3. `leads` assigned to `userId` (excluding synthetic benchmarks; omitting `expected_value` when `!canViewFinancials`)
  4. `lead_activities` where `actor_id = userId` (total count + last 30 days count + latest activity timestamp)
  5. `client_works` count where `creative_lead_id = userId` OR `tech_lead_id = userId`
  6. `team_audit_logs`:
     - Recent login events (`action = 'user_login'`, last 10 sign-ins + total login count + 30d login count) — visible to `admin` and `isSelf`!
     - Governance audit trail (`action != 'user_login'`, last 20 events) — visible to `admin`.
- Compute and return enriched `PersonnelPerformanceKpis`:
  - `wonRevenue`, `wonDealsCount`, `lostDealsCount`, `lostPipelineValue`, `activePipelineValue`, `activeDealsCount`, `closedDealsCount`, `winRatePercentage`, `avgWonDealValue`, `avgSalesCycleDays`, `overdueFollowUpsCount`, `touchpoints30d`, `totalTouchpoints`, `clientWorksCount`, `capacityLimit`, `capacityUtilizationPercentage`, `isAtCapacity`, `totalDealsAssigned`, and `stageBreakdown` (`StageDealBreakdown[]`).
- Strict `canViewFinancials` enforcement: financial metrics (`wonRevenue`, `activePipelineValue`, `avgWonDealValue`, `lostPipelineValue`, `stageBreakdown[].total_value`) are omitted from DB select and zeroed server-side when unauthorized, rendered as `Restricted` in UI.

---

## 3. Navigation & Multi-Color Editorial Design (`/admin/team` & `/admin/team/[id]`)

### A. Row Navigation Change (`/admin/team`)
- Clicking any member row in `CommercialDirectoryTable.tsx` or card in `PersonnelCard.tsx` navigates directly to `/admin/team/[id]` (dedicated full-page dossier).
- Keep the `Manage` button (opens quick inline `MemberGovernanceDrawer`) and `···` `PersonnelActionMenu` on each row as `e.stopPropagation()` actions for admins who want quick inline permissions/role edits without leaving `/admin/team`.

### B. Multi-Color Semantic Palette (Anchored in Marca Ubi Red `#ea002a`, Zero Status Dots, Zero Generic `#2563eb`)
- **Primary Brand Crimson (`#ea002a` / `#c40023` / `#9c001e`):** Primary action CTAs, lost/overdue/suspended accents, keyboard focus rings.
- **Emerald (`#059669` / `#065f46`):** Won Revenue, Closed Won deals, Active account state.
- **Editorial Indigo (`#4338ca` / `#3730a3`):** Active Pipeline value, Conversion Velocity & Sales Cycle metrics.
- **Teal (`#0f766e` / `#115e59`):** Activity Touchpoints (30d) & Client Works delivered/active.
- **Amber (`#b45309` / `#92400e`):** In-Negotiation stage & Pending Password Rotation.
- **Ink & Editorial Canvas (`#111111`, `#454542`, `#575753`, `#fbfbfa`, `#ffffff`, `#efefed`, `#e7e7e4`):** Crisp typography (`Circular XX`, `Graphik`, `Helvetica Neue` 300 Light `tabular-nums lining-nums`).
- **Zero Status Dots:** Remove all `statusDot`, `dotActive`, `dotSuspended`, `dotGranted`, `dotDenied`, and ledger `statusDot` circles across `/admin/team` and `/admin/team/[id]`. Replace with clean typographic status pills (`ACTIVE` / `SUSPENDED`) and thin 2px top/left semantic accent bars.

### C. Dedicated `/admin/team/[id]` Layout Architecture (Responsive 12-Col Grid)
1. **Top Bar & Executive Masthead:**
   - Back link (`All Personnel` -> `/admin/team`), status pill, and quick admin toolbar (`Manage Permissions`, `Reassign Deals`, `Suspend / Reactivate`).
   - 72px avatar (with upload trigger for admin/self), name (`Circular XX`), role pill, job title, onboarding date, last login summary (`Last sign-in: <relative/formatted IST timestamp>`), and direct Mail / Copy Email / Call / WhatsApp CTAs.
2. **Commercial Performance Matrix (2-Row Editorial Telemetry Strip + Stage Breakdown):**
   - **Row 1 — Revenue & Conversion (4 semantic accent metrics):**
     1. *Revenue Generated (Won)* — Emerald accent, INR total + `X` deals won
     2. *Active Pipeline* — Editorial Indigo accent, INR value + `X` open deals (plus capacity meter)
     3. *Win Rate & Avg Deal Size* — Brand Crimson accent, `X%` win rate + Avg won value
     4. *Activity & Delivery* — Teal accent, `X` touchpoints (30d) + `X` client works + `X` overdue follow-ups
   - **Row 2 — Funnel Stage Distribution Bar & Table:**
     - Sleek segmented multi-color proportional bar across stages (`Open`, `In Negotiation`, `Won`, `Lost`) with tabular deal counts and INR valuations.
3. **Lower Asymmetric 8:4 Split:**
   - **Main Column (8 units):** `RepresentativeDealLedger` (live search, bucket tabs, tabular-nums valuations, updated dates, direct dossier links, mobile stacked cards `< 768px`).
   - **Side Column (4 units):**
     1. **Login & Session Telemetry Panel:** Last authenticated timestamp, 30d sign-in count, total logins, recent sign-in history list (timestamp, IP, browser/OS summary), Password Rotation status pill, and Reset Password / Terminate Sessions controls.
     2. **Workspace Tab Access (`TabPermissionsEnclave`):** Clean granted/restricted pills across the 3 enclaves (zero dots).
     3. **Governance Audit Trail (`PersonnelAuditTimeline`):** Admin-only chronological compliance log (role changes, permissions, suspension, password resets).

---

## 4. Verification & Delivery Plan
1. Apply SQL migration cleanly (and check existing migration conventions for `team_audit_logs`).
2. Implement backend updates (`auth.ts`, `team.ts`, `crm.ts`) + unit tests covering login tracking, financial gating, and commercial matrix calculations.
3. Implement frontend components, SCSS modules (responsive down to 375px, 44px touch targets, `prefers-reduced-motion`), and remove all dot indicators.
4. Run `npx tsc --noEmit` (targeted/heap-safe), `npm run test:boundaries`, `npm run test:unit`, Sass compilation, `graphify update .`, and **Senior CTO PR Auditor Agent** review.
5. Commit strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>` and push to `origin redesign/crm-dashboard-interactivity-and-drilldown` (keeping PR #130 **OPEN**).
