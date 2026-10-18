## Executive Summary & Architectural Deliverables

This Pull Request delivers **Phase 2: Navigation Rail, Dynamic Tab Permissions & Route Restructure** under the umbrella CRM remediation architecture (`remediation/crm-ux-and-architecture`).

It solves critical enterprise navigation and layout gaps identified during the live UI/UX audit:
1. **Dynamic Tab RBAC Navigation Rail**: Restructures the administrative sidebar and mobile drawer into 3 logical enclaves (**Commercial Pipeline**, **Agency Operations**, and **System & Governance**) housing all 9 canonical tabs. Evaluates each staff member's granular `allowed_tabs` profile permissions at runtime, hiding unauthorized tabs from the UI.
2. **Dedicated Workspace Routes**:
   - `/admin/deals`: Dedicated pipeline deals workspace with valuation cards, bucket filters, stage status pill indicators, and deal drawer dispatch.
   - `/admin/works`: Dedicated post-conversion client works and deliverables tracker querying `public.client_works` with delivery stage badges, project code monospaced tokens, and milestone progress bars.
   - Restructures all 9 canonical tabs into dedicated Next.js App Router workspace sub-routes.
3. **Edge & Page-Level Defense-in-Depth**:
   - Implements tab-level RBAC route guards at the Next.js edge in `src/middleware.ts`, redirecting unauthorized users back to `/admin?error=unauthorized_role_access`.
   - Adds server-side authorization checks across all 8 sub-workspace pages (`team`, `settings`, `analytics`, `ingestion`, `tasks`, `works`, `deals`, `leads`).
4. **Authentic Telemetry & Real Data Badges**:
   - Purged fake status radar indicators (`Supabase Cloud / Production Node`) and hardcoded `'4 Due'` task badges.
   - Real-time `dueTasksCount` queried dynamically from `public.leads` where `next_follow_up <= now()` and forwarded directly to the navigation badge engine.
   - Clean Apple HIG Vibrancy frosted glass user popover displaying authenticated credentials, uppercase monogram initials, and secure session invalidation.

---

## Detailed Deliverable Breakdown

### 1. Navigation Taxonomy & RBAC Configuration
- `src/app/admin/components/layout/navigationConfig.tsx`:
  - Canonical 9-tab registry categorized into 3 functional enclaves:
    - **Commercial Pipeline**: Command Center (`/admin`), Inbound Leads (`/admin/leads`), Pipeline Deals (`/admin/deals`), Client Works (`/admin/works`), Follow-up Tasks (`/admin/tasks`).
    - **Agency Operations**: User Management (`/admin/team`), Executive Analytics (`/admin/analytics`), Website Inquiries (`/admin/ingestion`).
    - **System & Governance**: Security & Settings (`/admin/settings`).
  - Dynamic `isTabAuthorized(tabKey, user)` evaluation prioritizing persisted `allowed_tabs` with graceful fallback to `ROLE_DEFAULT_TABS[user.role]`.
  - Calibrated, high-contrast SVG icons following the Marca Ubi Dark Luxury design system (`#ff6100` active glow, `#ffffff` contrast text).

### 2. Layout Shell & Authentic Session Telemetry
- `src/app/admin/components/layout/AdminSidebar.tsx`:
  - Dynamic enclave and navigation rendering with `isTabAuthorized` filtering.
  - Active route highlighting using Next.js `usePathname()`.
  - Dynamic `dueTasksCount` indicator badge with zero hardcoded badges.
  - Displays authenticated user role with live connection indicator.
- `src/app/admin/components/layout/AdminMobileDrawer.tsx`:
  - Responsive mobile drawer mirroring desktop sidebar navigation rules, ensuring 100% parity across mobile viewports with 44px minimum tap targets.
- `src/app/admin/(workspace)/layout.tsx`:
  - Fetches authenticated user's `allowed_tabs` and `feature_permissions` from `public.profiles`.
  - Queries live overdue follow-up count from `public.leads` (`next_follow_up <= now()` in active buckets) and forwards to `AdminWorkspaceShell`.
- `src/app/admin/components/layout/UserProfileDropdown.tsx`:
  - Monogram avatar capsule with Apple HIG Vibrancy popover.
  - Clean logout integration via `logoutAction`.

### 3. Dedicated Workspace Routes & Edge Route Guards
- `src/middleware.ts`:
  - Edge route protection mapping path prefixes (`/admin/team`, `/admin/analytics`, `/admin/ingestion`, `/admin/settings`, `/admin/leads`, `/admin/deals`, `/admin/works`, `/admin/tasks`) to canonical tab keys.
  - Verifies session `allowed_tabs` or role default matrix before routing, blocking unauthorized access at the network boundary.
- `src/app/admin/(workspace)/deals/`:
  - `page.tsx`, `deals.module.scss`, `DealsWorkspaceClient.tsx`, `DealsWorkspaceClient.module.scss`.
  - Server-side data fetching for 100 deals with relational joins on `funnel_statuses`, `lead_sources`, and `profiles`.
  - Client component supporting search, bucket filtering, and centralized dossier drawer inspection.
- `src/app/admin/(workspace)/works/`:
  - `page.tsx`, `works.module.scss`, `WorksWorkspaceClient.tsx`, `WorksWorkspaceClient.module.scss`.
  - Server-side data query on `public.client_works` with delivery stage badges (kickoff to delivered) and health badges.
  - Strictly adheres to Rule R-01 (Zero generic blue; emerald `#22c55e` and Marca Ubi orange `#ff6100`).
- Workspace page guards added to `team/page.tsx`, `settings/page.tsx`, `analytics/page.tsx`, `ingestion/page.tsx`, and `tasks/page.tsx`.

---

## 4-Block Delivery Gate Report

### Block 1: Type Safety & Boundary Gate
- `npm run test:boundaries`: **33 / 33 async Server Actions passed (0 non-async exports)**.
- `npx tsc --noEmit`: **0 TypeScript compilation errors**.

### Block 2: Automated Unit & Taxonomy Validation
- `npm run test:unit`: **397 / 397 assertions passed (100%)**.
- Phase 2 Navigation Taxonomy & RBAC tests: **9 / 9 passed (100%)**:
  - Enclave organization and all 9 canonical tab keys.
  - App Router route mapping parity.
  - Admin full access evaluation.
  - Granular `allowed_tabs` override evaluation.
  - Zero-trust explicit empty array `allowed_tabs = []` rejection.
  - Role default sandboxing for Sales Executive, Viewer, and Sales Manager.
  - Defensive handling for unauthenticated / null user session states.

### Block 3: PostgreSQL Row Level Security (RLS) & DB Verification
- `npm run test:rls`: **25 / 25 assertions passed (100%)**.
- Multi-role isolation, append-only immutability, and `client_works` RLS policies verified.

### Block 4: Production Build Gate
- `npm run build`: **Next.js 16.1.6 (Turbopack) compiled in 81s**.
- **27 / 27 static, dynamic, and SSG routes generated with zero errors**.
- All workspace sub-routes (`/admin/deals`, `/admin/works`, `/admin/tasks`, `/admin/team`, `/admin/settings`, `/admin/analytics`, `/admin/ingestion`, `/admin/leads`, `/admin`) verified.

---

## Independent CTO PR Audit & Remediation Log

An independent adversarial review was executed across three specialized subagent domains (Systems Architecture, CISO / AppSec, and Staff Frontend / Anti-Slop). All identified findings were systematically resolved:

1. **Schema Correction (`/admin/deals`)**:
   - *Finding*: `funnel_statuses` query selected non-existent `stage_order` and `color`.
   - *Fix*: Aligned with PostgreSQL schema to query `sort_order` and `color_code` in `deals/page.tsx` and `DealsWorkspaceClient.tsx`.
2. **Missing Page Guard (`/admin/leads`)**:
   - *Finding*: `/admin/leads/page.tsx` had no server-side auth or role verification.
   - *Fix*: Added server-side authentication (`supabase.auth.getUser()`), active account verification, and `hasLeadsAccess` RBAC validation.
3. **Insecure Ingestion Fallback (`/admin/ingestion`)**:
   - *Finding*: Allowed Viewers or unassigned staff when `allowedTabs` was null.
   - *Fix*: Restricted fallback to `role === 'admin' || role === 'sales_manager'`.
4. **Zero-Trust Empty Array Override (`allowed_tabs = []`)**:
   - *Finding*: Checking `allowed_tabs.length > 0` allowed an explicit empty array to fall back to default role tabs.
   - *Fix*: Updated `navigationConfig.tsx` and all 8 workspace page guards to inspect `Array.isArray(allowedTabs)` so explicit empty arrays deny all tabs. Added test case.
5. **Mobile Drawer DOM & UX Synchronizations**:
   - *Finding*: Class selector mismatches (`.overlay` vs `.backdrop`, `.logoLink` vs `.brandLink`) in `AdminMobileDrawer.module.scss`.
   - *Fix*: Re-synchronized SCSS module class names, added 44px close button, min-height touch targets, focus-visible outlines, and route change dismissal listener.
6. **Purged Residual Radar Slop**:
   - *Finding*: Residual `.statusRadarDot` and `radarPulse` CSS keyframes.
   - *Fix*: Completely removed unused keyframes and replaced fake enclave text with authenticated user email and static status indicator.
7. **Breadcrumb Mappings & Stage Filter**:
   - *Finding*: Missing breadcrumbs for `deals` and `works`; works stage filter UI was non-interactive.
   - *Fix*: Added breadcrumb mappings and interactive stage filter pills to `WorksWorkspaceClient.tsx`.
8. **WCAG AA Contrast Elevation**:
   - *Finding*: `#71717a` text contrast was below optimal AA standard.
   - *Fix*: Elevated muted typography to `#a1a1aa` (8.19:1 contrast ratio).

