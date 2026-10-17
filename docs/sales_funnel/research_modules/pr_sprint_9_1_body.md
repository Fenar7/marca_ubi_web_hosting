## 🏛️ Sprint 9.1: Precision Follow-up Date-Time Scheduler & On Hold Revisit Automation

### 1. Executive Milestone Summary
Sprint 9.1 delivers the **Precision Follow-up Date-Time Scheduler** and **`On Hold` Parking Automation with Mandatory Revisit Milestones**, fulfilling PRD §14 and §15.19 for the Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform (`/admin/leads`).

This deliverable equips sales account executives, relationship managers, and commercial directors with precision touchpoint planning tools, downloadable RFC 5545 `.ics` iCalendar export, 24-hour step-adjusted date-time controls with timezone indicators, and strict state-machine guardrails preventing unattended lead abandonment in `On Hold`.

---

### 2. Delivered Engineering Modules

1. **Follow-Up Scheduler Modal (`FollowUpScheduler.tsx`)**:
   - Master scheduling dialog accessible directly from the Client 360° Drawer header and workspace event bus.
   - 4 quick-select preset interval chips:
     - `Today +2h`: Sets target timestamp exactly 2 hours forward.
     - `Tomorrow 10 AM`: Defaults to the next business day at 10:00:00 local time.
     - `In 3 Days`: Jumps 72 hours ahead at 10:00:00 local time.
     - `Next Mon 9 AM`: Calculates upcoming Monday morning at 09:00:00 local time.
   - 6 standardized agency touchpoint action types: `call`, `whatsapp`, `email`, `meeting`, `demo`, `proposal_review`.
   - Agenda and objective input with 1,000 character validation and HTML/script injection sanitization.
   - Downloadable RFC 5545 `.ics` calendar invite export with automatic blob trigger.

2. **Precision DateTime Picker (`DateTimePicker.tsx`)**:
   - Custom date and 24-hour time selector built with Dark Luxury styling tokens.
   - Automatic local timezone offset calculation and badge rendering (`UTC+05:30`, `UTC-05:00`).
   - Quick interval adjustment step buttons (`+15m`, `+30m`, `+1h`) with boundary wrapping.
   - Past-date restriction blocking historical scheduling.

3. **Guarded `On Hold` Parking Modal (`OnHoldModal.tsx`)**:
   - Mandatory future revisit milestone enforcement ($> \text{CURRENT\_DATE}$).
   - Standardized parking reason selector conforming to PRD requirements (`Client Budget Cycle / Q1 Planning`, `Key Decision Maker Away / On Leave`, `Pending Contract / Legal Review`, `Project Paused Temporarily`, `Awaiting Technical Specification`, `Other`).
   - Informational alert suppression disclosure banner informing the agent that overdue notifications are suppressed until the revisit date.

4. **Next.js 16 Server Actions (`src/app/actions/schedulerActions.ts`)**:
   - `scheduleFollowUpAction`: Validates payload via Zod, checks session authentication via `getUser()`, enforces 4-tier RBAC (`viewer` 403 Forbidden, `sales_executive` portfolio sandboxing), verifies post-conversion record locking (non-admin 403), writes `leads.next_follow_up`, records immutable entry in `public.lead_activities`, generates optional RFC 5545 `.ics` payload, and triggers Next.js path cache revalidation.
   - `transitionToOnHoldAction`: Transitions deal to `On Hold` stage (`funnel_statuses` ID `b0000000-0000-0000-0000-000000000003`), persists `revisit_date`, logs parking reason and notes to `lead_activities`, and invalidates caches.
   - `reactivateExpiredOnHoldLeadsAction`: Daily cron/maintenance Server Action executing `public.reactivate_expired_on_hold_leads()`.
   - `generateIcsCalendarInvite`: RFC 5545 compliant `.ics` serializer with parameter sanitization and special character escaping (`\,`, `\;`, `\\`, `\n`).

5. **PostgreSQL Database Engine Migration (`20261015000013_on_hold_revisit_automation.sql`)**:
   - Database trigger `trg_validate_on_hold_revisit` on `public.leads` rejecting status updates to `On Hold` if `revisit_date` is `NULL` or $\le \text{CURRENT\_DATE}$.
   - Stored procedure `public.reactivate_expired_on_hold_leads()` automatically transitioning expired `On Hold` deals back to open status (`Contacted`) when `revisit_date <= CURRENT_DATE`.

6. **Cross-Feature Workspace Integration**:
   - `InlineStatusSelect.tsx`: Intercepts inline stage change to `On Hold` and dispatches `open-stage-modal`.
   - `StageTransitionModal.tsx`: Delegates stage transition to `OnHoldModal` when target stage is `On Hold`.
   - `ClientDossierDrawer.tsx`: Adds "Schedule / Reschedule" touchpoint trigger in the drawer header and mounts `FollowUpScheduler`.
   - `LeadsWorkspaceClient.tsx`: Listens to `open-scheduler-modal` custom events and maintains optimistic `next_follow_up` state.

---

### 3. Automated 4-Block Delivery Gate Verification (`scripts/verify-sprint-9-1.ts`)

| Verification Block | Assertions Run | Result |
| :--- | :---: | :---: |
| **Block 1: Deliverable File Integrity** | 12 / 12 | 🟢 100% PASS |
| **Block 2: Dark Luxury Tokens & Anti-AI-Slop** | 16 / 16 | 🟢 100% PASS |
| **Block 3: Automated Test Suites (2 test files, 27 unit tests)** | 2 / 2 | 🟢 100% PASS |
| **Block 4: Strict TypeScript Compilation (`tsc --noEmit`)** | Full codebase | 🟢 0 ERRORS |
| **Total Automated Gate Assertions** | **31 / 31** | 🟢 **100% PASS** |

---

### 4. Zero AI-Slop & Anti-Pattern Compliance

- **Generic Blue (`#2563eb`)**: 0 occurrences. Obsidian `#0a0a0c`, card `#121216`, Marca Orange `#ff6100`.
- **Decorative Banners**: 0 occurrences of `// ===` or `// ---`.
- **Type Safety**: 0 `: any` or `as any` types across all deliverable modules.
- **Toy Emojis**: 0 toy emojis. 100% replaced with semantic inline SVGs with `aria-hidden="true"`.
- **Tap Targets**: All buttons, chips, and interactive inputs enforce `min-height: 44px`.

---

> ⚠️ **MANDATORY POLICY ENFORCEMENT**: In accordance with enterprise repository rules, this PR remains in an **OPEN** state awaiting manual human review and manual clicking of the "Merge" button on GitHub. Under NO circumstances should any AI agent merge, fast-forward, or close this PR.
