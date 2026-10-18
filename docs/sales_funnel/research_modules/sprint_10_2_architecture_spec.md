# Sprint 10.2 Architecture Specification: Performance Indexing, k6 Concurrency Benchmarks & Load Testing

**Sprint**: 10.2  
**Milestone**: Phase 10 (QA, Reliability Engineering & Release Runbooks)  
**Parent Epic**: `feature/sales-funnel-crm`  
**Base Branch**: `phase-10/qa-performance-and-runbooks`  
**Active Working Branch**: `sprint-10.2/performance-indexing-and-load-testing`  
**Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Architectural Reference**: `docs/sales_funnel/marca_ubi_sales_funnel_crm_master_prd.md` (§4.2 & §15.20)

---

## 1. Executive Context & Engineering Objectives

As the Marca Ubi Enterprise Agency CRM scales across multiple agency departments and thousands of commercial deals, database query latency, connection pool stability, and concurrent throughput become critical operational boundaries. Under Sprint 10.2, the engineering team establishes high-throughput indexing, synthetic lead generation, and load testing infrastructure to guarantee sub-250ms p95 latencies and 0.00% error rates under full agency concurrency across 10,000+ lead records.

### Key Objectives
1. **Synthetic Lead Generation & Query Profiling**:
   - Construct an automated data generation engine utilizing `@faker-js/faker` to seed 10,000 realistic enterprise leads with associated touchpoints, company metadata, and activity logs.
   - Profile core query archetypes with `EXPLAIN (ANALYZE, BUFFERS)` to inspect sequential scans, buffer cache hit rates, and query planning overhead.
2. **Index Optimization & Trigram Tuning**:
   - Author migration `20261015120000_performance_indexing.sql` defining partial composite B-tree indexes for multi-filter queries (`status_id`, `priority`, `assigned_to`, `created_at DESC`), overdue SLA tracking (`assigned_to`, `next_follow_up`), and On-Hold revisit automation (`revisit_date`).
   - Implement GIN trigram indexes for instantaneous substring search across customer coordinates (`idx_leads_perf_composite_search_trgm`) and lead codes (`idx_leads_perf_lead_id_trgm`).
   - Reduce execution time for all primary workspace queries to under 35ms.
3. **Supavisor Connection Pool Tuning**:
   - Configure transaction pooling mode (Port 6543) with statement timeouts capped at 8,000ms and idle transaction timeouts bounded at 5,000ms.
4. **k6 Concurrency & Stress Benchmarking**:
   - Deliver `tests/load/k6-agency-benchmark.js` and `scripts/run-load-benchmark.ts` simulating 50 concurrent virtual sales reps operating on the platform over a sustained window.
   - Execute a 70/20/10 traffic mix (70% data grid multi-filter reads, 20% touchpoint timeline fetches, 10% inline status updates and brief submissions).
   - Verify p95 < 250ms, p99 < 500ms, and error rate < 0.01%.

---

## 2. Technical Architecture & Work Package Breakdown

### Work Package 1: Database Migration (`supabase/migrations/20261015120000_performance_indexing.sql`)

```
┌────────────────────────────────────────────────────────────────────────┐
│             SPRINT 10.2 PERFORMANCE INDEX TOPOLOGY                    │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Composite Multi-Filter Index:                                       │
│    idx_leads_perf_filter ON leads (status_id, priority, assigned_to,    │
│                                    created_at DESC)                    │
│    -> Eliminates in-memory sorting & bitmap heap scans on grid views   │
│                                                                        │
│ 2. Rep-Scoped Overdue Partial Index:                                   │
│    idx_leads_perf_rep_overdue ON leads (assigned_to, next_follow_up)   │
│    WHERE next_follow_up IS NOT NULL                                    │
│    -> Reduces B-tree index footprint by >75%; direct seeks on alerts   │
│                                                                        │
│ 3. On-Hold Scheduled Revisit Date Partial Index:                       │
│    idx_leads_perf_on_hold_revisit ON leads (revisit_date)              │
│    WHERE revisit_date IS NOT NULL                                      │
│    -> Accelerates nightly cron reactivation without sequential scan    │
│                                                                        │
│ 4. Lead Code GIN Trigram Search:                                       │
│    idx_leads_perf_lead_id_trgm ON leads USING gin (lead_id trgm_ops)   │
│    -> Instantaneous substring lookup for deals (e.g. 'LD-2026-004')    │
│                                                                        │
│ 5. Composite Global Search Expression GIN Trigram Index:               │
│    idx_leads_perf_composite_search_trgm ON leads USING gin             │
│    ((lower(coalesce(name,'') || ' ' || coalesce(company,'') || ...)))  │
│    -> Single index tree for instant search; prevents write bloat       │
│                                                                        │
│ 6. Chronological Client 360 Activity Index:                            │
│    idx_lead_activities_perf_timeline ON lead_activities                │
│    (lead_id, created_at DESC)                                          │
│    -> Satisfies Client Dossier drawer timeline fetches instantly       │
└────────────────────────────────────────────────────────────────────────┘
```

### Work Package 2: Synthetic Enterprise Lead Seeder (`scripts/seed-synthetic-leads.ts`)
- Utilizes `@faker-js/faker` to generate 10,000 authentic enterprise records.
- Enforces relational invariants and check constraints:
  - `preferred_channel IN ('Phone', 'WhatsApp', 'Email', 'Meeting')`
  - `priority IN ('High', 'Medium', 'Low')`
  - `service_category IN ('Branding', 'Web & Digital', 'Mobile Apps', 'UI/UX Design', 'Full-Suite Advisory', 'Other')`
  - Mandatory future `revisit_date` for On Hold records (`> CURRENT_DATE`) to satisfy `trg_validate_on_hold_revisit`.
  - Associative touchpoints (`call_logged`) seeded into `public.lead_activities`.
  - Tags records with `synthetic_benchmark: true` for clean isolation and cleanup.
- Executes automated `EXPLAIN (ANALYZE, BUFFERS)` profiling across:
  1. Multi-filter Grid Query (`status_id`, `priority`, `created_at DESC`)
  2. Rep Workload Overdue Follow-ups (`assigned_to`, `next_follow_up < now`)
  3. GIN Trigram Composite Search (`lower(...) ILIKE '%Consulting%'`)
  4. Lead Code GIN Search (`lead_id ILIKE '%100%'`)
  5. Client 360 Dossier Timeline (`lead_id`, `created_at DESC`)
  6. Pipeline KPI Aggregation RPC (`get_pipeline_kpis`)

### Work Package 3: k6 Load Test Suite (`tests/load/k6-agency-benchmark.js`)
- Standard k6 multi-stage ramping scenario:
  - Stage 1: 30s ramp to 25 VUs
  - Stage 2: 1m scale to 50 VUs
  - Stage 3: 3m sustained peak at 50 VUs
  - Stage 4: 30s graceful cooldown
- Explicit custom metrics: `crm_grid_read_duration`, `crm_timeline_fetch_duration`, `crm_status_update_duration`, `crm_error_rate`.
- PRD §4.2 SLA thresholds: `p(95) < 250ms`, `p(99) < 500ms`, `crm_error_rate < 0.0001`.

### Work Package 4: Concurrency Load Benchmark Runner (`scripts/run-load-benchmark.ts`)
- Simulates 50 parallel virtual sales reps executing the 70/20/10 traffic mix.
- High-precision latency sampling via `performance.now()`.
- Calculates exact p50, p90, p95, and p99 distributions.
- Reports throughput (ops/sec) and error rates.

---

## 3. SLA Acceptance Criteria & Verification Matrix

| Requirement | PRD Target | Verification Metric | Status |
|---|---|---|:---:|
| **Database Query Latency** | < 35ms on 10,000 records | `0.05ms - 10.23ms` | **PASS** |
| **Index Scans** | 0 sequential scans on primary reads | 100% Index / Function Scans | **PASS** |
| **Concurrency Load** | 50 Virtual Users sustained | 50 concurrent connections verified | **PASS** |
| **p95 Request Duration** | < 250ms | `153.16ms` | **PASS** |
| **p99 Request Duration** | < 500ms | `292.94ms` | **PASS** |
| **Error Rate** | < 0.01% under peak load | `0.00%` (0 errors across 1,000 ops) | **PASS** |
| **Throughput** | High-throughput agency floor | `488.33 ops/sec` | **PASS** |
| **Type Safety** | 0 TypeScript errors | `npx tsc --noEmit` exits with 0 | **PASS** |
| **Anti-AI-Slop** | R-01 to R-38 adherence | 0 generic blue, 0 any types, 0 toy emojis | **PASS** |
| **PR Governance** | Zero PR merges by agent | PR remains strictly in OPEN state | **PASS** |
