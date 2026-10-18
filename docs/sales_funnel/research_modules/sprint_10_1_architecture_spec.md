# Architectural Specification — Sprint 10.1: Test Harness & Automated Suites

## 1. System Overview & Objectives
Sprint 10.1 initiates **Phase 10: QA Engineering, Performance & Runbook Sprints** for the Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform.
The primary mission of Sprint 10.1 is to establish a unified, production-grade automated testing harness spanning:
1. **Multi-Role Row Level Security (RLS) Isolation Suites**: Verifying the 24 permission combinations across `admin`, `sales_manager`, `sales_executive`, `viewer`, and `suspended` accounts, enforcing post-conversion deal locks and append-only activity ledgers.
2. **Data Normalization & Deduplication Validation**: Comprehensive test vectors validating E.164 phone normalization across UAE, India, UK, US, and Saudi Arabia, RFC 5322 email formatting, IDN Punycode normalization, honeypot defenses, and concurrent deduplication workflows.
3. **Playwright Multi-User E2E Journey Suites**: 8 exhaustive user journeys in Playwright simulating real user interactions across Chromium, Firefox, and WebKit covering the complete lifecycle from web brief ingestion on `/start-project` to deal dossier inspection, guarded stage progression, precision scheduling, and overdue batch reassignment.
4. **Standardized Package.json Scripts & CI Orchestration**: `npm run test:unit`, `npm run test:rls`, `npm run test:e2e`, and `scripts/verify-sprint-10-1.ts`.

---

## 2. Directory Structure & Deliverable Layout

```
marca_ubi_web_hosting/
├── docs/sales_funnel/research_modules/
│   ├── sprint_10_1_architecture_spec.md        # Architectural specification
│   ├── pr_sprint_10_1_body.md                  # PR description & technical work packages
│   └── sprint_10_1_cto_audit_report.md         # Final CTO PR auditor report
├── playwright.config.ts                        # Playwright multi-browser test harness configuration
├── scripts/
│   ├── crm-auditor-watcher.js                  # Background progress monitor
│   ├── verify-sprint-10-1.ts                   # Official 4-Block Delivery Gate auditor script
│   └── test-orchestrator.ts                    # Unified local test environment orchestrator
├── tests/
│   ├── rls/
│   │   └── leads-isolation.test.ts             # Multi-role RLS permission assertion matrix
│   ├── unit/
│   │   └── normalization.test.ts               # International phone, email & dedup unit tests
│   └── e2e/
│       ├── 01-admin-provisioning.spec.ts       # Journey 1: Team member invite & role provisioning
│       ├── 02-website-brief-ingestion.spec.ts  # Journey 2: /start-project inquiry & webhook ingestion
│       ├── 03-data-grid-realtime.spec.ts       # Journey 3: Multi-filter action bar & virtualized data grid
│       ├── 04-client-dossier-touchpoints.spec.ts # Journey 4: Client 360 drawer & omnichannel studio
│       ├── 05-pipeline-stage-transitions.spec.ts # Journey 5: Guarded transitions (Negotiation/Lost/Won)
│       ├── 06-follow-up-scheduler.spec.ts      # Journey 6: Precision date-time picker & On Hold revisit
│       ├── 07-overdue-and-batch-reassign.spec.ts # Journey 7: Tiered overdue badges & workload reassign
│       └── 08-security-suspension-logout.spec.ts # Journey 8: Account suspension & session revocation
```

---

## 3. Technical Work Packages

### 3.1 Work Package 1: Multi-Role RLS Isolation Suite (`tests/rls/leads-isolation.test.ts`)
- **Assertion Coverage**:
  - `admin`: Global SELECT, INSERT, UPDATE on all leads (including locked converted deals with `converted_at IS NOT NULL`), and administrative unlock capabilities.
  - `sales_manager`: Global SELECT across all leads, UPDATE on non-converted leads (`converted_at IS NULL`), blocked from mutating converted leads (HTTP 403 / check constraint).
  - `sales_executive`: Sandboxed SELECT and UPDATE strictly to assigned deals (`assigned_to = auth.uid()`). Attempting to read or mutate unassigned or peer-assigned leads returns 0 rows or throws permission denied.
  - `viewer`: Read-only SELECT on active pipeline; strictly blocked from INSERT, UPDATE, or DELETE across all tables.
  - `suspended`: Zero read/write access. All queries return empty or permission denied.
  - **Append-Only Immutability**:
    - `public.lead_activities`: Users cannot UPDATE or DELETE activity entries once inserted.
    - `public.team_audit_logs`: Append-only compliance ledger; mutation or deletion strictly prohibited.

### 3.2 Work Package 2: Ingestion Normalization & Deduplication Suite (`tests/unit/normalization.test.ts`)
- **Phone Formatting (ITU-T E.164)**:
  - UAE: `050 123 4567` $\rightarrow$ `+971501234567`, landline `04 345 6789` $\rightarrow$ `+97143456789`.
  - India: `98765 43210` $\rightarrow$ `+919876543210`, with trunk prefix `09876543210` $\rightarrow$ `+919876543210`.
  - UK: `07911 123456` $\rightarrow$ `+447911123456`.
  - US/Canada: `(555) 234-5678` $\rightarrow$ `+15552345678`.
  - Saudi Arabia: `051 234 5678` $\rightarrow$ `+966512345678`.
  - Rejection of alphabetic vanity strings, incomplete digit counts, and invalid country codes.
- **Email Sanitization (RFC 5322)**:
  - Case normalization, whitespace trimming, invalid domain detection, IDN Punycode decoding.
- **Deduplication Engine**:
  - Concurrent lead submissions matching identical normalized phone or email.
  - Assert existing lead `updated_at` refreshed, touchpoint activity appended, and 0 duplicate lead rows created.

### 3.3 Work Package 3: Playwright Multi-User E2E Journey Specs (`tests/e2e/*.spec.ts`)
1. **Admin Provisioning**: Navigate to `/admin/team`, invite team member, set role to `sales_executive`, verify invitation link generation and directory row.
2. **Website Brief Ingestion**: Navigate to `/start-project`, fill agency brief questions, submit form, verify confirmation screen and webhook payload structure.
3. **Data Grid & Action Bar**: Navigate to `/admin/leads`, switch bucket tabs (`Open`, `Potential`, `Overdue`), filter by Assignee and Priority, verify 72px row virtualization.
4. **Client 360 Dossier & Touchpoints**: Click lead row to slide open drawer (`min(840px, 100vw)`), start phone call stopwatch, stop stopwatch, log interaction, verify timeline entry.
5. **Guarded Stage Transitions**: Move lead to Negotiation with valuation, move deal to Lost with reason and notes, advance deal to Converted, verify celebration burst and locked record badge.
6. **Follow-Up Scheduler**: Open precision scheduler, click `Tomorrow 10 AM` preset, select Demo action type, download `.ics` file, test `On Hold` transition with future revisit date.
7. **Overdue & Manager Workload**: Inspect `<ManagerWorkloadCard />` on `/admin`, view overdue task segmentation (`< 24h`, `1-3d`, `> 3d`), open `BatchReassignModal`, select leads, transfer to another representative.
8. **Security & Session Termination**: Simulate representative suspension, verify session termination, redirect to `/login`, and rejection of protected route navigation.

---

## 4. 4-Block Delivery Gate Criteria (Sprint 10.1)
- **Block 1: Deliverable Files Verification**: 100% of required files present.
- **Block 2: Anti-AI-Slop & Quality Standards**: 0 generic blue (`#2563eb`), 0 decorative comments, 0 `any` types, 0 toy emojis.
- **Block 3: Test Execution**: 100% pass rate across unit and RLS test suites.
- **Block 4: TypeScript Strict Compilation**: `npx tsc --noEmit` exits with 0 errors.
