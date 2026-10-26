## Phase 9 Milestone: Task Management, Follow-up Scheduler & Overdue Escalations

### 1. Executive Summary
This Pull Request delivers **Phase 9: Task Management, Follow-up Scheduler & Overdue Escalations** of the Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform into the base branch `feature/sales-funnel-crm`. Phase 9 establishes proactive SLA management, precision calendar scheduling, automated revisit workflows, and executive rep capacity oversight, eliminating pipeline stagnation and accelerating commercial deal velocity.

The architecture spans a precision custom date-time picker with quick presets, an automated `On Hold` revisit and alert suppression engine with RFC 5545 `.ics` iCalendar calendar synchronization, a tiered mathematical overdue escalation engine (`< 24h`, `24h - 72h`, `> 72h`) with 60fps breathing red pulse animations, executive team capacity oversight telemetry on `/admin`, and a guarded 0-lead protected batch lead reassignment modal.

---

### 2. Comprehensive Phase 9 Scope Breakdown

#### Sprint 9.1: Precision Follow-up Date-Time Scheduler & `On Hold` Revisit Automation
- **Custom Precision DateTimePicker (`DateTimePicker.tsx` & `Scheduler.module.scss`)**:
  - Replaces fragile native browser pickers with a bespoke Dark Luxury date and time selector.
  - One-click preset interval shortcut chips (`Today +2h`, `Tomorrow 10 AM`, `In 3 Days`, `Next Mon 9 AM`).
  - Monospace Raycast timezone pill rendering the rep's active local timezone and UTC offset (e.g., `IST (UTC+05:30)`).
  - 44px+ minimum tap target geometry meeting Apple HIG and WCAG 2.5.5 touch target guidelines.
- **Precision Follow-up Scheduler Modal (`FollowUpScheduler.tsx`)**:
  - Modal wrapper with frosted glassmorphic backdrop (`backdrop-filter: blur(12px)`), WCAG 2.1 AA cyclical keyboard focus trapping, `Escape` key dismissal, and scrollbar-width compensated body scroll lock.
  - Action category selector with semantic inline SVGs: Phone Call, WhatsApp, Video Demo, In-Person Meeting, Client Lunch, Commercial Follow-up.
  - RFC 5545 compliant `.ics` iCalendar export generator with CRLF header injection defenses and character escaping.
- **`On Hold` Revisit Automation Workflow (`OnHoldModal.tsx`)**:
  - Guarded transition dialog requiring a mandatory future revisit date (`revisit_date > CURRENT_DATE`).
  - Automatic overdue alert suppression: While `CURRENT_DATE < revisit_date`, overdue badges and counters remain suppressed to prevent notification fatigue.
  - Direct integration into `InlineStatusSelect.tsx` and `StageTransitionModal.tsx`.
- **Database Engine & Cron Reactivation**:
  - Migration `20261015000013_on_hold_revisit_automation.sql`: Adds `revisit_date` column with index `idx_leads_on_hold_revisit`, PostgreSQL validation trigger `trg_validate_on_hold_revisit`, and stored function `reactivate_expired_on_hold_leads()`.
  - Cron Endpoint `/api/sales-funnel/cron/reactivate-on-hold/route.ts`: Bearer token `CRON_SECRET` authorization, batch transitions expired `On Hold` accounts to `Contacted`, and logs canonical `system_event` activity.
- **Server Actions (`src/app/actions/schedulerActions.ts`)**:
  - `scheduleFollowUpAction`, `transitionToOnHoldAction`, and `reactivateExpiredOnHoldLeadsAction`.
  - Strict caller session verification via `supabase.auth.getUser()`, active profile validation (`status === 'active'`), 4-tier RBAC role guards (`viewer` blocked with 403 Forbidden), and post-conversion record lock protection.

#### Sprint 9.2: Overdue Escalation Engine, Visual Alert Badges & Rep Workload Oversight
- **Tiered Overdue Calculation Engine (`badgeUtils.ts`)**:
  - Pure mathematical evaluator calculating elapsed hours since `next_follow_up`:
    - **< 24 Hours**: Amber warning tier (`#f59e0b`, `rgba(245, 158, 11, 0.12)`).
    - **24 Hours to 72 Hours**: Vivid orange warning tier (`#ff6100`, `rgba(255, 97, 0, 0.12)`).
    - **> 72 Hours**: Critical alert tier (`#ef4444`, `rgba(239, 68, 68, 0.15)`) with breathing pulsing red glow (`@keyframes pulseGlow`).
  - Alert suppression architecture: Automatically suppresses alerts for terminal stages (`converted`, `lost`) and active `On Hold` accounts with future revisit dates.
- **Visual Alert Badges (`OverdueBadge.tsx` & `OverdueBadge.module.scss`)**:
  - Accessible `role="status"` and `aria-label` screen reader announcements.
  - `full` and `short` presentation variants for data grids vs. dense header rails.
  - Integrated into virtualized `LeadsDataGrid.tsx` Touchpoint column and `LeadMobileCard.tsx` header.
- **Representative Workload Oversight Dashboard (`ManagerWorkloadCard.tsx` & `ManagerWorkloadCard.module.scss`)**:
  - Positioned on `/admin` dashboard below Executive KPI Ribbon.
  - Global executive metrics: Active Reps, Managed Pipeline Valuation, Total Overdue, and Critical Overdue count.
  - Rep capacity breakdown with avatar monograms, active deal count, pipeline valuation, win velocity conversion rates, and urgency tiers (`< 24h`, `1-3d`, `> 3d`).
  - Instant reassignment triggers: Global "Batch Reassign Overdue" button and per-rep reassignment shortcuts.
- **Guarded Batch Lead Reassignment Dialog (`BatchReassignModal.tsx`)**:
  - Frictionless portfolio rebalancing in < 3 clicks.
  - **0-Lead Submit Guard**: Submit button strictly disabled until $\ge 1$ lead is checked.
  - Multi-select controls with "Select All" toggle, representative search with role tags, and mandatory rationale input (min 3 chars).
  - Optimistic in-memory state reconciliation and `crm-toast` feedback.
- **Server Actions & Governance (`src/app/actions/workloadActions.ts`)**:
  - `getManagerWorkloadDataAction` and `batchReassignOverdueLeadsAction`.
  - Caller session auth, active status verification, RBAC guard (`admin` and `sales_manager` authorized; `viewer` and `sales_executive` blocked with 403 Forbidden).
  - Post-conversion record lock enforcement (`converted_at` non-admin 403).
  - Atomic database transactions updating `leads.assigned_to`, logging canonical `reassignment` activity in `public.lead_activities`, and emitting governance records in `public.team_audit_logs`.

---

### 3. Automated Verification Matrix
- **Sprint 9.1 Delivery Gate (`scripts/verify-sprint-9-1.ts`)**: **20 / 20 checks passed (100%)**.
- **Sprint 9.2 Delivery Gate (`scripts/verify-sprint-9-2.ts`)**: **34 / 34 checks passed (100%)**.
- **Automated Regression Suite**: **143 / 143 unit and action tests passed cleanly across all CRM test suites**.
- **TypeScript Static Verification (`tsc --noEmit`)**: **0 errors reported**.
- **Anti-AI-Slop AST Gate**: 0 `any` types, 0 generic blue (`#2563eb`), 0 decorative comments, 0 toy emojis, 0 em-dashes.
- **Git Authorship**: Authored strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- **Merge State**: Strict zero-merge policy enforced; PR remains strictly OPEN awaiting manual human review on GitHub.
