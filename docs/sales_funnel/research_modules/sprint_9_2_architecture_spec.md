# Sprint 9.2 Architecture Specification: Overdue Escalation Engine, Visual Alert Badges & Rep Workload Oversight

**Feature ID**: `CRM-SPRINT-9.2`  
**Target Integration Branch**: `phase-9/task-management-and-scheduler`  
**Feature Branch**: `sprint-9.2/overdue-engine-and-workload-oversight`  
**Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Governing Standard**: Master PRD §14.3, §15.19 & §4  

---

## 1. Executive Summary & Architectural Scope

Sprint 9.2 delivers the **Overdue Escalation Engine**, **Tiered Visual Alert Badges**, **Sales Representative Workload Oversight Dashboard**, and the **Manager Batch Reassignment Wizard** for the Marca Ubi Enterprise Agency CRM (`/admin` and `/admin/leads`).

### Core Business Invariants:
1. **Tiered Overdue Classification**:
   - `< 24 Hours Overdue`: Muted Amber Badge (`#f59e0b`), pill styling, text `Overdue: Due Xh ago`.
   - `24 to 72 Hours Overdue`: Vivid Orange Badge (`#ff6100` / `$cta-orange`), text `Urgent: Due Xd ago`.
   - `> 72 Hours Overdue`: Flashing Red Pulse Badge (`#ef4444`), CSS `@keyframes pulseGlow` animation, text `Critical: Xd Overdue`.
2. **`On Hold` Alert Suppression Invariant**:
   - Deals in `On Hold` status with `revisit_date > CURRENT_DATE` are strictly excluded from overdue badges, counters, and escalation queues.
3. **Manager Workload Balancing (`ManagerWorkloadCard.tsx`)**:
   - Aggregated operational oversight per commercial sales representative on `/admin`:
     - Representative identity and monogram avatar.
     - Active deal counts and total pipeline valuation.
     - Conversion rate percentage.
     - Overdue tasks count partitioned into `<24h`, `24h-72h`, and `>72h` urgency buckets.
     - Actionable trigger launching the `BatchReassignModal`.
4. **Batch Reassignment Wizard (`BatchReassignModal.tsx`)**:
   - Multi-select interface allowing managers and administrators to select one or more stalled/overdue deals and reassign them to an active team member with a single transactional action.
   - Guarded validation: disables submission when 0 leads are selected; requires destination selection and audit rationale.
5. **Atomic Data & Ledger Integrity**:
   - Batch reassignment writes canonical `'reassignment'` entries to `public.lead_activities`, updates `leads.assigned_to` and `leads.updated_at`, records governance logs in `public.team_audit_logs`, and invalidates Next.js path caches.

---

## 2. Directory Structure & Deliverable Matrix

```
src/app/
├── actions/
│   └── workloadActions.ts                 # Server Actions: getManagerWorkloadData, batchReassignOverdueLeads
├── admin/
│   ├── (workspace)/
│   │   ├── page.tsx                       # Mounts ManagerWorkloadCard on /admin
│   │   └── leads/
│   │       └── LeadsWorkspaceClient.tsx   # Overdue tab filter connection & Batch Reassign launcher
│   └── components/
│       ├── Badges/
│       │   ├── OverdueBadge.tsx           # Dynamic tiered overdue badge component
│       │   ├── OverdueBadge.module.scss   # Dark Luxury badge styling & pulsing keyframes
│       │   ├── badgeUtils.ts              # Pure overdue tier calculation & time elapsed math
│       │   └── index.ts                   # Barrel export
│       ├── Dashboard/
│       │   ├── ManagerWorkloadCard.tsx    # Manager workload balancing console widget
│       │   ├── ManagerWorkloadCard.module.scss # Dark Luxury scorecard & rep rows styling
│       │   └── index.ts                   # Barrel export
│       ├── Modals/
│       │   ├── BatchReassignModal.tsx     # Guarded multi-lead reassignment wizard
│       │   ├── BatchReassignModal.module.scss # Modal frosted overlay & table styling
│       │   └── index.ts                   # Barrel export
│       └── LeadsTable/
│           ├── LeadsDataGrid.tsx          # Integrates OverdueBadge in Touchpoint column
│           └── LeadMobileCard.tsx         # Integrates OverdueBadge in Mobile card
tests/
├── leads/
│   └── overdue_badge.test.ts              # Unit tests: tier boundaries, formatting, suppression
└── actions/
    └── workload_and_reassign.test.ts      # Unit tests: Zod schemas, RBAC, batch mutations
scripts/
└── verify-sprint-9-2.ts                   # Official 4-Block Delivery Gate Verification Script
```

---

## 3. Tiered Overdue Escalation Logic & Mathematical Invariants

```typescript
export type OverdueTier = 'none' | 'amber' | 'orange' | 'red_pulse';

export interface OverdueCalculationResult {
  isOverdue: boolean;
  tier: OverdueTier;
  elapsedMs: number;
  label: string;
  shortLabel: string;
}
```

### Boundary Rules:
- If `now < next_follow_up` -> `tier: 'none'`.
- If `bucket === 'converted' || bucket === 'lost'` -> `tier: 'none'`.
- If `status_name.toLowerCase() === 'on hold' && revisit_date > todayStr` -> `tier: 'none'` (Alert Suppression).
- Elapsed hours $H = \lfloor (now - next\_follow\_up) / (1000 \times 3600) \rfloor$:
  - $0 \le H < 24$: `tier: 'amber'`, label: `"Overdue: Due ${H}h ago"` (or `"Due <1h ago"` if $H = 0$).
  - $24 \le H < 72$: `tier: 'orange'`, label: `"Urgent: Due ${Math.floor(H / 24)}d ago"`.
  - $H \ge 72$: `tier: 'red_pulse'`, label: `"Critical: ${Math.floor(H / 24)}d Overdue"`.

---

## 4. RBAC & Security Invariants

1. **Manager Oversight Access**:
   - `getManagerWorkloadDataAction`: Restricted to `admin` and `sales_manager`. `sales_executive` and `viewer` receive 403 Forbidden.
2. **Batch Reassignment Privilege**:
   - `batchReassignOverdueLeadsAction`:
     - Restricted to `admin` and `sales_manager`.
     - Verifies destination representative status is strictly `active`.
     - Validates destination role is `admin`, `sales_manager`, or `sales_executive`.
     - Enforces post-conversion deal lock: any lead with `converted_at` cannot be reassigned by non-admins.
3. **Database Audit Non-Repudiation**:
   - Inserts row in `public.lead_activities` with `activity_type: 'reassignment'`.
   - Inserts row in `public.team_audit_logs` with action `'bulk_lead_reassignment'`.

---

## 5. Verification & Delivery Gate Criteria

- **Block 1**: Deliverable files exist in specified directories.
- **Block 2**: 0 generic blue (`#2563eb`), 0 decorative comments, 0 `any` types, 0 toy emojis, 44px tap targets.
- **Block 3**: Automated test suites pass 100% (badge math and workload actions).
- **Block 4**: Strict TypeScript compilation (`tsc --noEmit`) clean with 0 errors.
