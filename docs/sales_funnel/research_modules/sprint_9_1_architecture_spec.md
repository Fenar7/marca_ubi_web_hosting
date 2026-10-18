# Sprint 9.1 Architecture Specification: Precision Follow-up Date-Time Scheduler & `On Hold` Revisit Automation

**Feature ID**: `CRM-SPRINT-9.1`  
**Target Integration Branch**: `phase-9/task-management-and-scheduler`  
**Feature Branch**: `sprint-9.1/follow-up-scheduler-and-on-hold`  
**Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Governing Standard**: Master PRD §14, §15.19 & §5  

---

## 1. Executive Summary & Architectural Scope

Sprint 9.1 delivers the precision touchpoint scheduling engine, calendar integration, and automated `On Hold` parking state machine for the Marca Ubi Enterprise Agency CRM (`/admin/leads`).

### Core Business Objectives:
1. **Precision Touchpoint Scheduling**: Enable sales representatives and managers to schedule exact follow-up dates and times with quick-preset shortcuts (`Today +2 Hours`, `Tomorrow 10:00 AM`, `In 3 Days`, `Next Monday 09:00 AM`) and 24-hour time pickers.
2. **Timezone Normalization**: All timestamps entered via the user's local browser timezone must be validated and converted to UTC (`TIMESTAMPTZ`) before storage in PostgreSQL.
3. **`On Hold` Parking Protocol**: Require a mandatory future `revisit_date` and parking rationale when placing deals in `On Hold`.
4. **Alert Suppression Engine**: Suppress overdue alarm badges and escalation counters while `CURRENT_DATE < revisit_date`.
5. **Reactivation Automation**: Automate reactivation of expired `On Hold` deals into the `Overdue Today` bucket once the revisit date arrives.
6. **Calendar Invitation Generation**: Export downloadable RFC 5545 `.ics` iCalendar files for Google Calendar, Apple Calendar, and Microsoft Outlook.

---

## 2. Component Architecture & Dark Luxury UI Layout

### 2.1 File Structure
```text
src/app/admin/components/Scheduler/
├── FollowUpScheduler.tsx       # Master scheduler dialog with quick presets and calendar export
├── DateTimePicker.tsx          # Precision date & 24h time picker with timezone indicator
├── OnHoldModal.tsx             # Guarded On-Hold state transition modal with mandatory revisit date
├── Scheduler.module.scss       # Dark Luxury styling (#0a0a0c, #121216, #ff6100, 44px tap targets)
└── index.ts                    # Barrel exports

src/app/actions/
└── schedulerActions.ts         # Next.js 16 Server Actions with Zod validation, RBAC, and .ics generation

supabase/migrations/
└── 20261015000013_on_hold_revisit_automation.sql # Database validation trigger & reactivation function
```

### 2.2 Dark Luxury Design Tokens
- **Backdrop Scrim**: `background: rgba(0, 0, 0, 0.78); backdrop-filter: blur(12px);`
- **Surface**: Obsidian `#0a0a0c` canvas, `#121216` card container, `#18181f` input backgrounds.
- **Accents**:
  - `#ff6100` (Brand Amber — Active Presets, Scheduler Primary CTA)
  - `#f59e0b` (`On Hold` Status Pill & Amber Preset Highlights)
  - `#10b981` (Success Confirmation & Monospace Date Badges)
  - `#ef4444` (Validation Errors & Past-Date Warnings)
- **Tap Targets**: Strict $\ge 44\text{px}$ across all chips, calendar inputs, time selectors, and buttons.
- **Zero Generic Blue**: Strictly 0 occurrences of `#2563eb`.

---

## 3. Quick Preset Interval Calculations (Mathematical Specifications)

All presets calculate UTC ISO strings relative to `Date.now()`:

1. **`Today +2 Hours`**:
   $$\text{target} = \text{now} + 2 \times 3600 \times 1000$$
2. **`Tomorrow 10:00 AM`**:
   $$\text{tomorrow} = \text{date}(\text{now} + 1 \text{ day}), \quad \text{time} = 10:00:00 \text{ in local timezone} \rightarrow \text{UTC}$$
3. **`In 3 Days (10:00 AM)`**:
   $$\text{targetDate} = \text{date}(\text{now} + 3 \text{ days}), \quad \text{time} = 10:00:00 \text{ in local timezone} \rightarrow \text{UTC}$$
4. **`Next Monday (09:00 AM)`**:
   Calculate days until upcoming Monday:
   $$\text{daysToAdd} = ((1 - \text{dayOfWeek} + 7) \bmod 7) \text{ if } > 0 \text{ else } 7$$
   $$\text{targetDate} = \text{date}(\text{now} + \text{daysToAdd} \text{ days}), \quad \text{time} = 09:00:00 \text{ in local timezone} \rightarrow \text{UTC}$$

---

## 4. Server Actions & Security Invariants

### 4.1 `scheduleFollowUpAction`
- **Zod Schema (`scheduleFollowUpSchema`)**:
  - `leadId`: UUID format (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`).
  - `scheduledFor`: ISO 8601 string, must be valid date (`!isNaN(Date.parse(val))`) and strictly in the future for forward touchpoints.
  - `actionType`: Enum (`call`, `whatsapp`, `email`, `meeting`, `demo`, `proposal_review`).
  - `agenda`: String $\le 1000$ characters, sanitized against script injection.
  - `sendCalendarInvite`: Boolean.
- **RBAC & Authorization**:
  - Authenticates session via `supabase.auth.getUser()`.
  - Rejects inactive or suspended callers with HTTP 403 Forbidden.
  - Rejects `viewer` callers with HTTP 403 Forbidden.
  - Sales executives restricted to assigned leads (`lead.assigned_to === user.id`).
  - Rejects mutations on converted deals (`lead.converted_at IS NOT NULL`) unless caller is `admin`.
- **Database Mutation**:
  - Updates `public.leads.next_follow_up = scheduledFor`.
  - Appends record to `public.lead_activities` (`activity_type: 'task_scheduled'`).
  - Generates RFC 5545 `.ics` payload for client calendar download.

### 4.2 `transitionToOnHoldAction`
- **Zod Schema (`transitionToOnHoldSchema`)**:
  - `leadId`: UUID format.
  - `revisitDate`: `YYYY-MM-DD` string, must be parseable and strictly $> \text{today}$.
  - `reason`: Standardized enum catalog or min 5 chars custom reason.
  - `parkingNotes`: String $\le 2000$ chars, sanitized against script injection.
- **RBAC & Authorization**:
  - Identical 4-tier authorization checks as stage transitions.
- **Database Mutation**:
  - Updates `public.leads.status_id = 'b0000000-0000-0000-0000-000000000003'` (`On Hold`).
  - Updates `public.leads.revisit_date = revisitDate`.
  - Updates `public.leads.next_follow_up = revisitDate + 'T09:00:00Z'`.
  - Appends record to `public.lead_activities` (`activity_type: 'status_change'`).

---

## 5. Database Trigger & Automation (`20261015000013_on_hold_revisit_automation.sql`)

1. **`trg_validate_on_hold_revisit`**:
   - `BEFORE INSERT OR UPDATE ON public.leads`
   - If `status_id = 'b0000000-0000-0000-0000-000000000003'` (`On Hold`):
     - Asserts `revisit_date IS NOT NULL`.
     - Asserts `revisit_date > CURRENT_DATE`.
     - Raises `P0001` exception if invalid: `'On Hold leads require a mandatory future revisit_date.'`.
2. **`reactivate_expired_on_hold_leads()`**:
   - Stored procedure scanning for leads where `status_id = On Hold` and `revisit_date <= CURRENT_DATE`.
   - Transitions `status_id` to `Contacted` (or updates `next_follow_up = clock_timestamp()`), clearing `revisit_date`.
   - Records automated activity ledger event: `'system_reactivation'`.

---

## 6. Verification & Delivery Gate Criteria (24 Checks)
- **Block 1**: 9 deliverable files exist in specified directories.
- **Block 2**: 0 generic blue (`#2563eb`), 0 decorative comment separators, 0 `any` types, 0 toy emojis, 44px tap targets.
- **Block 3**: Test suites for scheduler server actions and UI math pass 100%.
- **Block 4**: Strict TypeScript compilation (`tsc --noEmit`) clean with 0 errors.
