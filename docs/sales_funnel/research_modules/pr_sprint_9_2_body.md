## Overview & Architectural Context

This Pull Request delivers **Sprint 9.2: Overdue Escalation Engine, Visual Alert Badges & Rep Workload Oversight** for the Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform, adhering strictly to **PRD §14.3 & §15.19** and the **Marca Ubi Dark Luxury Standard**.

Sprint 9.2 establishes proactive SLA oversight, visualurgency telemetry, and friction-free portfolio rebalancing to eliminate lead stalling and accelerate revenue pipeline conversion.

---

## Key Deliverables & Systems Implemented

### 1. Tiered Overdue Escalation Engine (`badgeUtils.ts` & `OverdueBadge.tsx`)
- **Mathematical Tier Evaluator**: Pure utility calculating overdue elapsed durations and assigning standardized urgency tiers:
  - **< 24 Hours**: Amber warning pill (`#f59e0b`, `rgba(245, 158, 11, 0.12)`), label `Overdue: Due Xh ago` / `Due Xh ago`.
  - **24 Hours to 72 Hours**: Vivid orange warning pill (`#ff6100`, `rgba(255, 97, 0, 0.12)`), label `Urgent: Due Xd ago` / `Due Xd ago`.
  - **> 72 Hours**: Critical alert pill with specular red pulsing glow (`#ef4444`, `@keyframes pulseGlow`), label `Critical: Xd Overdue` / `Xd Overdue`.
- **Alert Suppression Architecture**:
  - Automatically suppresses alerts for terminal stages (`converted`, `lost`).
  - Enforces PRD §14.2 alert suppression for `On Hold` accounts: while `CURRENT_DATE < revisit_date`, overdue alerts remain strictly inactive to prevent notification fatigue.
- **Component Geometry & Accessibility**:
  - Supports `full` and `short` presentation variants for data grids vs. dense header rails.
  - Inline semantic SVG icons (clock, warning triangle, exclamation circle) replace all toy emojis.
  - Accessible `role="status"` and `aria-label` screen reader announcements.

### 2. Commercial Representative Workload Oversight (`ManagerWorkloadCard.tsx`)
- **Dashboard Telemetry**: Positioned on `/admin` dashboard below Executive KPI Ribbon, rendering real-time capacity and SLA health across all commercial staff:
  - Rep identity, avatar monogram, and active role badge.
  - Active deal counts, total pipeline valuation, and conversion rate percentage.
  - Urgency breakdown pills partitioned into `< 24h`, `24-72h`, and `> 72h` tiers.
- **Direct Reassignment Triggers**:
  - Global "Batch Reassign Overdue" button in card header.
  - Per-representative reassign triggers opening the modal pre-filtered to the representative's overdue deals.

### 3. Guarded Batch Lead Reassignment Dialog (`BatchReassignModal.tsx`)
- **Frictionless Portfolio Rebalancing**: Reassigns stalled leads in < 3 clicks.
- **Enterprise Guardrails**:
  - **0-Lead Submit Guard**: Action button remains strictly disabled until at least 1 lead checkbox is selected.
  - Multi-select controls with "Select All" and individual row toggling.
  - Representative search and destination selector with role tags and email coordinates.
  - Required reassignment audit rationale input (3 to 1,000 characters).
- **Accessibility & Focus Trapping**:
  - Cyclic `Tab` / `Shift+Tab` keyboard focus trapping within modal container.
  - `Escape` key dismiss and backdrop scrim click listeners.
  - Body scroll lock during modal visibility preventing background jitter.

### 4. Next.js 16 Server Actions & Audit Ledger (`workloadActions.ts`)
- **`getManagerWorkloadDataAction`**:
  - Enforces caller session auth via `supabase.auth.getUser()`.
  - Checks active profile standing (`status === 'active'`).
  - RBAC role guard: Restricts access to `admin` and `sales_manager` (`viewer` and `sales_executive` return `403 Forbidden`).
  - Aggregates active deals, pipeline valuations, conversion rates, and partitioned overdue lists.
- **`batchReassignOverdueLeadsAction`**:
  - Validates input via Zod `batchReassignSchema` (1 to 100 UUIDs, sanitized text).
  - Validates destination representative exists, is active, and holds an operational sales role.
  - **Post-Conversion Record Locking**: Non-admin callers attempting to reassign converted deals are rejected with `403 Forbidden`.
  - Atomic database updates reassigning leads and logging immutable audit events (`public.lead_activities` with canonical `activity_type: 'reassignment'`).

### 5. Seamless Workspace Integration
- **`LeadsDataGrid.tsx`**: Renders `OverdueBadge` (`variant="short"`) alongside touchpoint buttons in Column 7.
- **`LeadMobileCard.tsx`**: Renders `OverdueBadge` in the mobile card header for immediate mobile SLA visibility.
- **`LeadsWorkspaceClient.tsx`**: Renders an Overdue Notice Banner when viewing the `Overdue Today` bucket tab with direct trigger to launch `BatchReassignModal`.
- **`page.tsx`**: Integrates `ManagerWorkloadCard` directly into the executive command center.

---

## 4-Block Delivery Gate Report

```
================================================================
 MARCA UBI ENTERPRISE CRM: SPRINT 9.2 DELIVERY GATE AUDITOR
================================================================

[Block 1: Deliverable Files Verification]
  ✓ File exists: src/app/admin/components/Badges/badgeUtils.ts
  ✓ File exists: src/app/admin/components/Badges/OverdueBadge.module.scss
  ✓ File exists: src/app/admin/components/Badges/OverdueBadge.tsx
  ✓ File exists: src/app/admin/components/Badges/index.ts
  ✓ File exists: src/app/actions/workloadActions.ts
  ✓ File exists: src/app/admin/components/modals/BatchReassignModal.module.scss
  ✓ File exists: src/app/admin/components/modals/BatchReassignModal.tsx
  ✓ File exists: src/app/admin/components/modals/index.ts
  ✓ File exists: src/app/admin/components/Dashboard/ManagerWorkloadCard.module.scss
  ✓ File exists: src/app/admin/components/Dashboard/ManagerWorkloadCard.tsx
  ✓ File exists: src/app/admin/components/Dashboard/index.ts
  ✓ File exists: docs/sales_funnel/research_modules/sprint_9_2_architecture_spec.md
  ✓ File exists: tests/leads/overdue_badge.test.ts
  ✓ File exists: tests/actions/workload_and_reassign.test.ts

[Block 2: Anti-AI-Slop & Dark Luxury Token Auditing]
  ✓ Zero occurrences of generic blue (#2563eb)
  ✓ Zero decorative separator comments
  ✓ Zero any types across all deliverable modules
  ✓ Zero toy emojis in badges, cards, and modal components
  ✓ Pulsing red alert animation pulseGlow in OverdueBadge.module.scss
  ✓ Alert suppression logic for On Hold revisit date in badgeUtils.ts
  ✓ 3-tier overdue categorization (<24h, 24-72h, >72h) in badgeUtils.ts
  ✓ BatchReassignModal disables submit when 0 leads selected
  ✓ BatchReassignModal enforces 44px tap targets and backdrop blur
  ✓ Server action enforces caller session auth via getUser()
  ✓ Server action enforces RBAC role guard (viewer 403 Forbidden)
  ✓ Server action records canonical reassignment activity type
  ✓ Server action checks post-conversion lock (converted_at)
  ✓ ManagerWorkloadCard rendered on /admin dashboard page
  ✓ OverdueBadge integrated in virtualized LeadsDataGrid
  ✓ OverdueBadge integrated in LeadMobileCard
  ✓ Batch reassignment trigger banner wired in LeadsWorkspaceClient

[Block 3: Automated Test Suites Execution]
  ✓ Test suite passed: tests/leads/overdue_badge.test.ts
  ✓ Test suite passed: tests/actions/workload_and_reassign.test.ts

[Block 4: Strict TypeScript Compilation]
  ✓ TypeScript compiler (tsc --noEmit) reported 0 errors

================================================================
 TOTAL CHECKS: 34 | PASSED: 34 | FAILED: 0
================================================================
DELIVERY GATE PASSED: Sprint 9.2 is 100% compliant with PRD §14.3 & §15.19 specifications.
```

---

## Test Verification Summary
- **Total Test Suites**: 53 suites executed across CRM actions and lead components.
- **Total Tests**: 141 tests passing (0 failures, 0 skipped).
- **TypeScript Compilation**: `npx tsc --noEmit` exits with code 0 (zero errors).
