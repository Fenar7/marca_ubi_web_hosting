# Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
## Technical Architecture Audit Report: Commercial Team Management & Provisioning System
**Document ID:** `AUDIT-MARCA-CRM-TEAM-PROVISIONING-01`  
**Classification:** Senior CTO PR Audit & Chief Systems Architecture Deep-Dive  
**Audit Target:** Phase 3 (Sprints 3.1 & 3.2), Phase 4 (Sprints 4.1 & 4.2), and Sprint 5.3 Shell Integration  
**Auditor:** Senior CTO PR Auditor & Chief Systems Architect Subagent  
**Date:** October 17, 2026  
**Status:** Audit Complete — Actionable Resolution Plan Formulated  

---

### Executive Summary

An exhaustive, line-by-line audit of the backend server actions, database migrations, Zod validation schemas, utility libraries, and frontend React components governing Commercial Team Management & Identity Provisioning was conducted. 

The core identity provisioning, database triggers, Row Level Security policies, and offboarding workflows are robustly architected and compile with **0 TypeScript compiler errors** (`tsc --noEmit`). However, an architectural disconnect occurred during **Sprint 5.3 (CRM Workspace Shell)** where global navigation header buttons were introduced without event listeners or global mounting, creating an orphaned UI trigger. In addition, an essential security invariant—**blocking administrator self-demotion**—was omitted from `updateTeamUserRole`, leaving active administrators susceptible to accidental or unilateral lockout.

---

### 1. Exhaustive Component & Action Audit Matrix

| Component / Action | Physical Path | Audit Scope & Invariant Verification | Current Status | Findings / Severity |
| :--- | :--- | :--- | :--- | :--- |
| `createTeamUser` | `src/app/actions/team.ts` | Zod validation, `assertActiveAdmin()`, Auth Admin SDK `createUser(email_confirm: true)`, transactional rollback via `deleteUser()`, `team_audit_logs` record, cache revalidation. | **95% Complete** | `must_change_password: true` is placed in `user_metadata` but omitted from `app_metadata`. Since users can edit `user_metadata` client-side, it must also be set in `app_metadata`. *(Medium)* |
| `getTeamRoster` | `src/app/actions/team.ts` | Role gating (rejects `sales_executive`), queries `public.profiles`, joins active leads and expected deal values, maps `invited_by`. | **90% Complete** | Deal counts include all historical leads rather than filtering out `converted` and `lost` macro-buckets, conflicting with the Reassignment Wizard inventory counts. *(Low)* |
| `updateTeamUserRole` | `src/app/actions/team.ts` | Gated to `admin`, pre-checks sole admin count, advisory lock trigger (`protect_sole_admin`), syncs Auth metadata, writes audit log. | **85% Complete** | **Critical Security Gap**: Does not block **self-demotion**. An administrator can demote their own account to `sales_executive` or `viewer`, losing administrative access permanently. *(High)* |
| `suspendTeamUser` | `src/app/actions/team.ts` | Validates UUID and reason, blocks self-suspension (`callerId === targetId`), pre-checks sole admin, global session signout (`signOut(..., 'global')`), account ban (`876000h`), audit logging. | **100% Complete** | Fully compliant with Master PRD §15.9. |
| `setTeamUserStatus` | `src/app/actions/team.ts` | Blocks self-suspension, manages session revocation / unbanning (`ban_duration: 'none'`), status updates, audit logging. | **100% Complete** | Fully compliant. |
| `createTeamUserSchema` | `src/app/lib/team-schemas.ts` | Name (2-100), RFC email, role enum, job title, nullable phone, temp password (8-128). | **100% Complete** | Sanitized, separated from `'use server'` boundary. |
| `ResetPasswordSchema` | `src/app/lib/team-schemas.ts` | $\ge 12$ chars, uppercase, lowercase, digit, special symbol, confirmation matching. | **100% Complete** | Fully compliant with first-login password rotation rules. |
| `generateHighEntropyPassword` | `src/app/lib/team-utils.ts` | 16-char cryptographically secure passphrase using `crypto.getRandomValues(Uint32Array(16))`, guaranteed category distribution, Fisher-Yates shuffle. | **100% Complete** | 100 consecutive generations confirmed zero collisions and $>80$ bits entropy. |
| `isDrawerDirty` | `src/app/lib/team-utils.ts` | Evaluates modifications across name, email, job title, phone, and role against defaults. | **100% Complete** | Accidental dismissal detection logic verified. |
| `formatDealValuation` | `src/app/lib/team-utils.ts` | Tabular formatting for Indian Lakhs (`₹X.XL`), Crores (`₹X.XCr`), and base INR (`₹X,XXX`). | **100% Complete** | Tabular numbers verified. |
| Database Migrations | `supabase/migrations/20261015000005..08.sql` | `must_change_password` column, governance indexes, audit action whitelist, RLS policies on profiles/activities, atomic stored procedure with row locking (`ORDER BY id ASC FOR UPDATE`). | **100% Complete** | Verified against live PostgreSQL database. |
| `TeamWorkspaceClient` | `src/app/admin/(workspace)/team/components/` | Table state, local drawer state, credential modal reveal, optimistic table insertion. | **80% Complete** | Locally scoped only. Does not listen to the global `open-add-member-drawer` event dispatched by the shell header. *(Medium)* |
| `AdminHeader` Quick Action | `src/app/admin/components/layout/AdminHeader.tsx` | Dispatches `open-add-member-drawer` custom event. | **30% Complete** | **Orphaned UI Action**: Nothing listens to this event in `AdminWorkspaceShell` or `TeamWorkspaceClient`. Button also exposed to `sales_manager` despite backend admin requirement. *(Medium)* |
| `CredentialRevealModal` | `src/app/admin/(workspace)/team/components/` | Raycast Monospace token container, single-click copy, 60-second countdown, clipboard auto-purge via `navigator.clipboard.writeText('')`. | **100% Complete** | Defense-in-depth purge on modal close and unmount verified. |
| `SuspendUserModal` | `src/app/admin/(workspace)/team/components/` | Commercial impact display (deals count & valuation), offboarding reason capture, triggers `suspendTeamUser`, automatically chains to Lead Reassignment Wizard. | **100% Complete** | Fully compliant with Sprint 4.1 specifications. |
| `LeadReassignmentWizardModal`| `src/app/admin/(workspace)/team/components/` | Live inventory scan, stage breakdown, candidate filtering (active commercial only), mandatory transfer rationale, calls atomic stored procedure. | **100% Complete** | ACID transactional integrity verified with zero deadlock risk. |

---

### 2. In-Depth Root Cause Analysis of Gaps

#### Gap 1: Orphaned Event Trigger & Global/Local Scope Disconnect
* **The Root Cause**: During Phase 3, the `AddTeamMemberDrawer` and `CredentialRevealModal` were built as locally scoped components inside `src/app/admin/(workspace)/team/components/TeamWorkspaceClient.tsx`. In Sprint 5.3, the CRM Workspace Shell introduced `AdminHeader.tsx` with a quick action button `+ Add Member` designed to trigger provisioning from anywhere in the CRM by dispatching `window.dispatchEvent(new CustomEvent('open-add-member-drawer'))`.
* **The Disconnect**:
  1. `AdminWorkspaceShell.tsx` was only configured with an event listener for `open-new-lead-drawer`. No listener was registered for `open-add-member-drawer`.
  2. `TeamWorkspaceClient.tsx` was never updated to listen to `open-add-member-drawer`.
  3. Clicking `+ Add Member` in the persistent top header produces zero response across all routes (`/admin`, `/admin/leads`, `/admin/team`, `/admin/tasks`, `/admin/analytics`, `/admin/settings`).
  4. In `AdminHeader.tsx`, `canManageTeam` was defined as `currentUser.role === 'admin' || currentUser.role === 'sales_manager'`. This displays the `+ Add Member` button to Sales Managers even though `assertActiveAdmin()` in `src/app/actions/team.ts` rejects non-administrators with a privilege escalation exception.

#### Gap 2: Sole-Admin Invariance & Self-Demotion Vulnerability
* **The Invariant**: Agency governance mandates that an administrator cannot demote or suspend the sole active administrator. Furthermore, to prevent catastrophic accidental lockout, administrators must not be permitted to demote their own account.
* **The Gap**:
  - `updateTeamUserRole` in `src/app/actions/team.ts` checks if the target user is an active admin and verifies that the remaining admin count is $> 1$.
  - However, it **does not verify whether `targetUserId === caller.callerId`**!
  - If Admin Alice demotes herself while Admin Bob is active, `updateTeamUserRole` executes the demotion. Alice immediately loses administrative access, cannot undo the change, and is locked out of team settings.
  - In `CommercialDirectoryTable.tsx`, the `Role` button remains enabled for the current user (`isSelf`), allowing self-demotion from the UI.
  - *Contrast*: `suspendTeamUser` and `setTeamUserStatus` explicitly enforce `if (sanitizedUserId === caller.callerId)` and disable the button in the UI.

#### Gap 3: Auth Metadata Hardening for Initial Credential Lifecycle
* **The Invariant**: Master PRD §15.8 mandates that provisioned team members must be intercepted by Edge Middleware upon first login and forced to complete password rotation (`must_change_password = true`) before accessing CRM data.
* **The Gap**:
  - In `createTeamUser`, `adminClient.auth.admin.createUser` passes `must_change_password: true` inside `user_metadata`, but omits it from `app_metadata`.
  - In Supabase Auth, authenticated users can mutate their own `user_metadata` via the client library (`supabase.auth.updateUser`), potentially clearing the flag. `app_metadata` can only be updated by the service role.
  - For cryptographic defense-in-depth, `must_change_password: true` must be set in both `app_metadata` and `user_metadata`.

#### Gap 4: Next.js 16 Server Action Boundary Violation in `src/app/actions/auth.ts`
* **The Invariant**: Next.js 16 enforces strict Server Action boundaries. Files marked `'use server'` must only export asynchronous action functions, with zero exported TypeScript interfaces or types.
* **The Gap**:
  - While `src/app/actions/team.ts`, `reassignment.ts`, and `leads.ts` strictly adhere to this rule, `src/app/actions/auth.ts` exports `LoginActionResult` and `ResetPasswordResult`.
  - These interfaces should be extracted to a types module to guarantee zero boundary violations.

#### Gap 5: Deal Inventory Counting Discrepancy
* **The Invariant**: The team directory roster should accurately display active commercial pipeline workload.
* **The Gap**:
  - `getTeamRoster()` counts all rows in `public.leads` assigned to a user.
  - `reassignment.ts` (`getRepDealInventory`) strictly filters for active funnel stages, excluding `converted` and `lost` macro-buckets.
  - If a representative has completed deals but zero in-progress deals, `getTeamRoster` reports an active deal load, creating visual confusion when compared with the Reassignment Wizard.

---

### 3. Step-by-Step Architectural Implementation Plan

#### Step 1: Resolve Global/Local Event Bridge & Role Authorization
1. Update `src/app/admin/components/layout/AdminHeader.tsx`:
   - Restrict `+ Add Member` strictly to administrators:
     ```typescript
     const canProvisionTeam = currentUser.role === 'admin';
     ```
2. Mount `AddTeamMemberDrawer` and `CredentialRevealModal` in `src/app/admin/components/layout/AdminWorkspaceShell.tsx`:
   - Add state: `const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);`
   - Add state: `const [revealedCredentials, setRevealedCredentials] = useState<ProvisionedCredentialsPayload | null>(null);`
   - Register listener for `open-add-member-drawer` gated to `currentUser.role === 'admin'`.
   - On user provisioned: dispatch `team-member-created` event and open `CredentialRevealModal`.
3. Update `src/app/admin/(workspace)/team/components/TeamWorkspaceClient.tsx`:
   - Listen to `open-add-member-drawer` to synchronize drawer state.
   - Listen to `team-member-created` to optimistically append new members to `roster`.

#### Step 2: Implement Self-Demotion Invariant Protection
1. Update `src/app/actions/team.ts` (`updateTeamUserRole`):
   - Add invariant guard:
     ```typescript
     if (targetUserId === caller.callerId && newRole !== 'admin') {
       return {
         success: false,
         error: 'Security Policy Violation: Administrators cannot demote their own account. Another administrator must perform this role modification.',
       };
     }
     ```
2. Update `src/app/admin/(workspace)/team/components/CommercialDirectoryTable.tsx`:
   - In the role modification modal, if `targetMemberForRole.id === currentUserId`, prevent selection of non-admin roles and display a warning banner: *"Administrators cannot demote their own account."*

#### Step 3: Harden Auth Provisioning Metadata
1. Update `src/app/actions/team.ts` (`createTeamUser`):
   - Set `must_change_password: true` in `app_metadata`:
     ```typescript
     app_metadata: {
       role,
       must_change_password: true,
     },
     ```

#### Step 4: Refactor Auth Server Action Types Boundary
1. Extract `LoginActionResult` and `ResetPasswordResult` from `src/app/actions/auth.ts` into `src/types/crm.ts` or `src/app/lib/auth-types.ts`.
2. Ensure `src/app/actions/auth.ts` exports strictly 0 interfaces or types.

#### Step 5: Align Active Deals Calculation in `getTeamRoster`
1. Update `src/app/actions/team.ts` (`getTeamRoster`):
   - Query `public.funnel_statuses` to identify active stages (where `bucket NOT IN ('converted', 'lost')`).
   - Filter lead counts and valuations strictly to active stages to guarantee parity with the Lead Reassignment Wizard.

#### Step 6: Full Verification & Static Analysis
1. Run `npx tsc --noEmit` to verify 0 type errors.
2. Run test suites:
   - `scripts/verify-sprint-3-1.ts` (Admin SDK & sole-admin trigger)
   - `scripts/verify-sprint-3-2.ts` (Password generation & entropy)
   - `scripts/verify-sprint-4-1.ts` (Suspension & session revocation)
   - `scripts/verify-sprint-4-2.ts` (Atomic lead reassignment)
   - `scripts/verify-sprint-5-3.ts` (Workspace shell & route workspaces)
