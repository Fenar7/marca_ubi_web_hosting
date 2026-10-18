# Operational Runbook: Production Deployment & Release Gate Protocol

**Document ID**: `RUNBOOK-REL-03`  
**Milestone**: Phase 10: QA Engineering, Performance & Release Runbooks  
**Sprint**: Sprint 10.3: Security, Accessibility & Production Runbooks  
**Target Release**: Release `v1.2.0-crm-enterprise`  
**Target Branches**: `feature/sales-funnel-crm` → `master`  
**Classification**: Enterprise Operational Standard  
**Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Last Verified**: October 18, 2026  

---

## 1. Executive Summary & Release Scope

This runbook specifies the formal release engineering procedure and quality gating criteria for promoting the complete **Marca Ubi Enterprise Sales Intelligence Platform** into production.

The release incorporates all deliverables from Phase 1 through Phase 10:
- **Phases 1–4**: Database Relational Architecture, SSR PKCE Authentication, RBAC Role Sandboxing, Team Provisioning & Offboarding Protocols.
- **Phase 5**: Public Lead Ingestion Engine, ITU-T E.164 Contact Normalization & Smart Deduplication State Machine.
- **Phase 6**: Executive KPI Ribbon & Real-time Aggregation Stored Logic.
- **Phase 7**: Multi-Filter Action Bar & 72px High-Density Virtualized Data Grid.
- **Phase 8**: Client 360° Sliding Dossier Drawer, Omnichannel Timeline, Interaction Composer & Converted Deal Locking.
- **Phase 9**: Precision Follow-up Scheduler, Automated On Hold Revisit Cron & Overdue Escalation Engine.
- **Phase 10**: Automated Test Harness, 10,000-Lead Database Indexing, 50-VU k6 Benchmark, WCAG 2.1 AA Accessibility & Operational Runbooks.

---

## 2. Branch Hierarchy & Promotion Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ENTERPRISE GIT MERGE HIERARCHY                       │
├────────────────────────────────────────────────────────────────────────┤
│ Granular Sprint Branches (sprint-10.1, sprint-10.2, sprint-10.3)       │
│                                  │                                     │
│                                  ▼ Manual Human Review & Merge         │
│ Phase Milestone Trunk (phase-10/qa-performance-and-runbooks)           │
│                                  │                                     │
│                                  ▼ Comprehensive Milestone Review      │
│ Feature Trunk Branch (feature/sales-funnel-crm)                        │
│                                  │                                     │
│                                  ▼ 48-Hour Staging Soak Period         │
│ Production Base Branch (master) [Tag: v1.2.0-crm-enterprise]           │
└────────────────────────────────────────────────────────────────────────┘
```

> **MANDATORY GOVERNANCE RULE**: Under no circumstances does an automated agent merge Pull Requests into base branches. All PR promotions must be manually approved and clicked by repository administrators on GitHub.

---

## 3. Production Definition of Done (DoD) Checklist

Before promoting code to `master`, every check on the Release Engineering Gate scorecard must be certified:

### Block 1: Code Rigor & Type Safety
- [x] **0 TypeScript Compilation Errors**: `npx tsc --noEmit` exits with code 0 across all Server Components, Client Components, Server Actions, and scripts.
- [x] **0 Next.js Build Warnings**: `npm run build` completes with optimized Turbopack bundles and zero hydration mismatches.
- [x] **Zero `any` Types**: Strict static typing throughout with complete Zod schemas and TypeScript interfaces.

### Block 2: Automated Testing Pyramid
- [x] **Vitest Unit Suite**: 100% pass rate (378/378 assertions across phone normalization, deduplication state machine, and scheduler utilities).
- [x] **RLS Multi-Role Isolation Suite**: 100% pass rate (21/21 assertions verifying sales executive sandboxing, converted deal locking, and append-only immutability).
- [x] **Playwright E2E Multi-User Journeys**: 8/8 full lifecycle user journeys passing across Chromium, Firefox, and WebKit.
- [x] **Automated Accessibility Scan**: 0 critical and 0 serious violations verified via `@axe-core/playwright` and mathematical contrast verification.

### Block 3: Performance & Scalability Gates
- [x] **Database Scan Topology**: Zero sequential scans on primary table queries; composite B-trees and partial indexes active.
- [x] **Query Latency SLAs**: Read queries execute in < 1.5ms; KPI RPC procedure aggregates 10,000 records in < 10ms (SLA: < 35ms).
- [x] **50-VU Concurrency Benchmark**: Sustained 50 concurrent virtual users with overall p95 < 80ms (SLA: < 250ms) and error rate 0.00% (SLA: < 0.01%).

### Block 4: Luxury Design System & Anti-Slop Hygiene
- [x] **Zero Generic Blue**: Zero occurrences of `#2563eb` across all stylesheets and components.
- [x] **Zero Drop Shadows**: Clean 1px solid border geometries (`rgba(255, 255, 255, 0.08)`) with zero fuzzy drop shadows.
- [x] **Zero Decorative Comments**: Purposeful high-value engineering comments only; zero `// ===` or AI meta-narration.
- [x] **Zero Toy Emojis**: Clean inline SVGs and typography throughout.
- [x] **WCAG 2.1 AA Contrast**: Body text 19.8:1 (AAA), label text 7.3:1 (AAA), brand orange 6.6:1 (AA).

---

## 4. Step-by-Step Production Release Procedure

### Phase 1: Staging Soak & Smoke Verification (48-Hour Window)
1. Deploy `feature/sales-funnel-crm` to Vercel Staging environment.
2. Direct 10% of internal test traffic through staging.
3. Monitor error tracking (Sentry / Datadog) for 48 consecutive hours; ensure zero unhandled exceptions.

### Phase 2: Database Schema & Index Migration Execution
1. Verify Supavisor pooler configuration:
   - Application connections routed to **Port 6543** (Transaction Mode).
   - Migration runner connected to **Port 5432** (Direct Session Mode).
2. Execute production database migration:
   ```bash
   supabase db push --include-all --project-ref $SUPABASE_PROD_REF
   ```
3. Verify index creation in PostgreSQL system catalog:
   ```sql
   SELECT indexname, tablename FROM pg_indexes 
   WHERE schemaname = 'public' 
     AND indexname LIKE 'idx_%perf%';
   ```

### Phase 3: Zero-Downtime Application Deployment
1. Trigger Vercel production deployment:
   ```bash
   vercel --prod --token=$VERCEL_TOKEN
   ```
2. Warm edge cache instances across global regions.

### Phase 4: Post-Deployment Smoke Test
1. Access `/admin/leads` and verify real-time data grid loading.
2. Ingest test brief on `/start-project` and confirm immediate WebSocket propagation to admin grid within < 1 second.
3. Verify KPI Ribbon metrics update accurately.
4. Execute test follow-up scheduling and verify calendar sync pill.

### Phase 5: Production Tagging
Create signed immutable release tag on `master`:
```bash
git tag -a v1.2.0-crm-enterprise -m "Release v1.2.0-crm-enterprise: Marca Ubi Enterprise Sales Intelligence Platform"
git push origin v1.2.0-crm-enterprise
```
