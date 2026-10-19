# Marca Ubi Enterprise CRM: UI/UX Gap Audit & Master Elevation Plan

**Document ID**: `PLAN-CRM-ELEVATION-2026-V1`  
**Date**: October 18, 2026  
**Auditors**: UI/UX & Luxury Design Architect, Granular RBAC Architect, Senior Fullstack CRM Feature Gap Auditor  
**Standard**: `DESIGN.md`, `master-ui-ux-design-system`, Anti-Slop Rules (R-01 to R-38)  
**Status**: DRAFT PLAN (Awaiting User Explicit Approval to Execute)  

---

## 1. Executive Summary & Validation of User Critique

A line-by-line investigation across the entire `src/app/admin/` frontend confirms that the user's critique is **100% accurate, justified, and validated**:

1. **The Disguised "Leads" Tab & Missing "Client Works"**:
   - The sidebar has no tab named "Leads". The route `/admin/leads` is titled *"Pipeline Deals"*, causing raw inbound inquiries, qualified proposals, and converted contracts to be conflated into a single tabular view.
   - Converted accounts vanish into a locked database state with **zero operational tracking for client deliverables, active works, or milestone statuses** ("the works which we have taken the status regarding that").
2. **Missing User Management & Tab Permission Checkboxes**:
   - User administration is obscured as *"Commercial Team"* (`/admin/team`) and built like a sales quota table rather than an administrative identity governance hub.
   - When provisioning users (`AddTeamMemberModal.tsx`), there is only a static role dropdown (`admin`, `sales_manager`, `sales_executive`, `viewer`). There are **zero checkboxes** allowing administrators to define which tabs each user can see and access.
   - The database table `public.profiles` lacks an `allowed_tabs` column.
   - There is no modal to inspect or edit permissions for existing personnel.
3. **Dead Clicks & AI Slop Inventory**:
   - **Hardcoded Sidebar Badge**: `badge: '4 Due'` is literally hardcoded in `AdminSidebar.tsx` line 93.
   - **Fake System Status**: `Supabase Cloud / Production Node` with an animated pulsing radar dot in `AdminSidebar.tsx` line 358 is decorative filler.
   - **Redundant Bento Cards**: The Command Center (`/admin`) features 4 large "Commercial Workspaces" cards that merely duplicate the sidebar links located 200px to the left.
   - **Dead Interactions**: Clicking on sales representative rows or overdue badges in `ManagerWorkloadCard.tsx` does nothing. Column headers in the deals table cannot be sorted.
   - **KPI Routing Bug**: Clicking the "Overdue Follow-ups" KPI card links to `/admin/leads?bucket=open` instead of filtering for overdue deals.
   - **Hardcoded Ingestion Telemetry**: In `/admin/ingestion`, the telemetry cards (`200 OK — Active`, `24-Hour Smart Merge`, `10 req/min burst protection`) are static JSX strings.
   - **Static Security Matrix**: In `/admin/settings`, the authorization matrix is a static HTML table with no configurable settings.
   - **Component Duplication**: `LeadDetailModal.tsx` (951 lines) and `ClientDossierDrawer.tsx` (484 lines) duplicate functionality without shared state.

---

## 2. Core Architectural Pillars to Introduce

### Pillar 1: The Funnel Trinity (Leads vs Deals vs Client Works)
```
[ Inbound Leads ]         [ Pipeline Deals ]          [ Client Works & Projects ]
Raw Inquiries             Active Proposals            Converted Deliverables
Speed-to-lead triage  --> Interactive Kanban Board --> Milestone progress & health
(WhatsApp, Form, Call)    (Valuations, Stages)        (Branding, Web, UI/UX)
```

1. **Inbound Leads (`/admin/leads`)**: Fast triage of raw inbound brief submissions and inquiries. Actions: *Qualify & Convert to Deal*, *Schedule Discovery*, or *Disqualify*.
2. **Pipeline Deals (`/admin/deals`)**: Active commercial proposals and contract negotiations. Features a switchable **Interactive Kanban Board** (with drag-and-drop / 1-click stage advancement and column revenue sums) and a **Sortable Data Grid**.
3. **Client Works & Projects (`/admin/works`)**: Automatically spawned when a deal reaches "Closed Won". Tracks active client creative deliverables, milestones, creative director assignments, and delivery health (`On Track`, `At Risk`, `In Review`).

### Pillar 2: User Management & Granular Tab-Level Permissions
1. **Schema Extension (`public.profiles`)**: Add `allowed_tabs TEXT[] NOT NULL DEFAULT ARRAY['command_center', 'leads', 'deals', 'works', 'tasks']`.
2. **Interactive Tab Checkbox Grid**: Integrated directly into `AddTeamMemberModal.tsx` and a new `EditUserPermissionsModal.tsx`. Selecting a role pre-checks default tabs, while the admin can check/uncheck any tab individually.
3. **Dynamic Sidebar & Edge Middleware**: `AdminSidebar.tsx` renders only the tabs listed in `currentUser.allowed_tabs`. Edge Middleware validates `allowed_tabs` from the session claims, blocking unauthorized URL access.

### Pillar 3: High-Tactile Interactivity & Slop Purge
1. **Click-to-Filter Everywhere**: Clicking a rep in the Command Center opens their assigned deals. Clicking overdue badges filters the view to those exact stalled touchpoints.
2. **Quick-Action Row Strips**: Hovering any deal row reveals instant actions: *Call*, *WhatsApp*, *Email*, *Inline Reschedule*.
3. **Dynamic Live Badges**: Compute sidebar task and lead counts from live PostgreSQL queries instead of hardcoded strings.
4. **Real Telemetry**: Replace static ingestion cards with live event counts and a Raw Webhook Payload Inspector.

---

## 3. Six-Phase Implementation Master Plan

### Phase 1: Database Architecture & Relational Schema
- Migration `20261019000001_granular_user_tab_permissions.sql`:
  - Add `allowed_tabs TEXT[]` and `feature_permissions JSONB` to `public.profiles`.
  - Add check constraint validating tab keys: `'command_center', 'leads', 'deals', 'works', 'tasks', 'users', 'analytics', 'ingestion', 'settings'`.
  - Add trigger `trg_validate_admin_tab_permissions` to prevent administrator self-lockout.
- Migration `20261019000002_client_works_projects_schema.sql`:
  - Create `public.client_works` table (`id`, `project_id`, `lead_id`, `client_name`, `company`, `service_scope`, `contract_value`, `creative_lead_id`, `tech_lead_id`, `status`, `milestones`, `target_delivery_date`).
  - Add trigger on `public.leads` to auto-spawn a `client_works` entry when a deal transitions to "Converted".

### Phase 2: Navigation Rail & Route Restructure
- Update `src/app/admin/components/layout/AdminSidebar.tsx`:
  - Group 1: **Commercial Pipeline** (`Command Center`, `Inbound Leads`, `Pipeline Deals`, `Client Works`, `Follow-up Tasks`).
  - Group 2: **Agency Management** (`User Management & Access`, `Commercial Analytics`, `Intake & Webhooks`).
  - Group 3: **System** (`Security & Settings`).
  - Purge hardcoded `badge: '4 Due'` and replace with live database count.
  - Purge decorative `Supabase Cloud / Production Node` radar dot.
  - Dynamically filter items against `currentUser.allowed_tabs`.
- Update `src/middleware.ts` to enforce tab-level route protection.

### Phase 3: Dedicated User Management & Tab Permission Center
- Update `src/app/admin/(workspace)/team` to become the **User Management & Access Control Center** (`/admin/users`).
- Update `src/app/admin/components/modals/AddTeamMemberModal.tsx` to include the interactive 3x3 Tab Permission Checkbox Matrix.
- Create `src/app/admin/(workspace)/team/components/EditUserPermissionsModal.tsx` to inspect and fine-tune existing personnel permissions.
- Update `src/app/actions/team.ts`: Persist `allowed_tabs` in `public.profiles` and sync to Supabase Auth `app_metadata`.

### Phase 4: Dedicated Funnel Workspaces (Leads, Deals Kanban, Client Works)
- Create `/admin/leads` (Inbound Leads Triage workspace with 1-click "Convert to Deal").
- Create `/admin/deals` (Pipeline Deals with Interactive Kanban Board + Sortable Data Grid).
- Create `/admin/works` (Client Works & Deliverables Tracker with milestone progress).

### Phase 5: Command Center Overhaul & Dead Click Remediation
- Rebuild `src/app/admin/(workspace)/page.tsx`:
  - Eliminate the 4 duplicate "Commercial Workspaces" quick-launch cards.
  - Convert `ManagerWorkloadCard.tsx` into a high-density, interactive rep management component with clickable rep rows and overdue badges.
  - Fix `KpiRibbon.tsx` overdue follow-ups link to point to `/admin/leads?bucket=overdue`.
  - Add sortable column headers to all data grids.
  - Add quick hover action strips to deal rows.

### Phase 6: Slop Purge & Real Telemetry
- Update `/admin/ingestion`: Replace static strings with live Supabase query counts, a Raw Webhook Payload Inspector, and a "Simulate Inbound Brief" tester.
- Update `/admin/settings`: Replace static HTML table with functional SLA and alert threshold configuration.
- Consolidate `LeadDetailModal.tsx` and `ClientDossierDrawer.tsx` into a single unified detail interface.
