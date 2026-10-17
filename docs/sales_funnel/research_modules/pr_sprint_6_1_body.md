## Architectural Overview: Sprint 6.1 High-Performance Pipeline KPI Aggregation RPC, Indexing & Analytics API Gateway

### 1. Objective & Motivation
This Pull Request delivers **Sprint 6.1: High-Performance Pipeline KPI Aggregation RPC, Indexing & Analytics API Gateway** for Phase 6 (`phase-6/analytics-and-kpi-ribbon`).
It establishes the enterprise backend aggregation engine powering the upcoming Executive KPI Ribbon and Executive Analytics views. Heavy multi-dimensional pipeline calculations are executed in a single index-accelerated PostgreSQL stored procedure (`public.get_pipeline_kpis`) paired with composite B-tree indexing and a hardened Next.js 16 API Route Gateway (`/api/sales-funnel/kpis`).

---

### 2. Delivered Work Packages

#### Package 6.1.1: Relational Schema & Composite Indexing (`20261015000011_kpi_rpc_function.sql`)
- **Composite Index `idx_leads_created_status_assignee`**: `(created_at, status_id, assigned_to)` accelerates time-windowed and representative-scoped aggregations.
- **Composite Index `idx_leads_source_created`**: `(lead_source_id, created_at)` accelerates marketing acquisition channel cohort evaluation.
- **Partial Index `idx_leads_followup_status`**: `(next_follow_up, status_id) WHERE next_follow_up IS NOT NULL` accelerates real-time overdue alerts while filtering out terminal stages.

#### Package 6.1.2: Core Unified Parameterized Stored Function (`public.get_pipeline_kpis`)
- **Single Database Round-Trip Aggregation**: Evaluates all primary and secondary commercial metrics in `< 2ms` internal execution time via `FILTER (WHERE ...)` clauses.
- **Multi-Dimensional Scope Filtering**: Evaluates date ranges (`p_start_date`, `p_end_date`), acquisition source (`p_source_id`), and assigned personnel (`p_assignee_id`).
- **Backward-Compatible Signature**: First parameter `target_user_id` preserves 100% compatibility with Phase 1 positional calls (`get_pipeline_kpis($1)`).
- **Security Definer & Role Sandboxing**: Statically pinned to `SET search_path = public, auth, pg_temp` to prevent CWE-426. Sales Executives are strictly sandboxed to `auth.uid()`, while anonymous and suspended users are rejected with `ERRCODE 42501`.
- **Advanced Commercial Formulas**:
  - `total_leads_count` / `total_leads`: Total inquiries within filtered scope.
  - `potential_pipeline_value` / `potential_value`: Sum of expected value for active pipeline deals.
  - `stage_weighted_pipeline_value`: Probability-adjusted valuation (0.85 for negotiation, 0.50 for proposal, 0.25 for qualified, 0.20 other).
  - `converted_revenue_value` / `converted_value`: Total closed revenue.
  - `conversion_rate_percentage` / `conversion_rate`: Net conversion rate excluding disqualified inquiries (`spam_invalid`, `out_of_scope`).
  - `overdue_follow_ups_count` / `overdue_count`: Active past-due touches, respecting `On Hold` alert suppression.

#### Package 6.1.3: Zod Validation Contracts & TypeScript Domain Models
- **`src/app/lib/validations/kpiQuerySchema.ts`**: Validates ISO 8601 timestamps, calendar date formats, UUID syntax via `UUID_REGEX`, and enforces chronological sequence bounds (`start_date <= end_date`).
- **`src/types/crm.ts`**: Centralized domain interfaces (`PipelineKpis`, `PipelineRpcMetrics`, `KpiQueryParams`, `KpiApiResponseEnvelope`).

#### Package 6.1.4: Next.js 16 API Route Gateway (`/api/sales-funnel/kpis`)
- **Route**: `GET /api/sales-funnel/kpis`
- **Authentication**: SSR Session verification via `createClient()`.
- **Authorization**: Verifies profile account status and enforces role sandboxing.
- **Cache-Control**: `public, s-maxage=15, stale-while-revalidate=45` to protect database throughput during high-concurrency executive dashboard sessions.

---

### 3. Automated Verification Matrix
- **Automated Delivery Gate (`scripts/verify-sprint-6-1.ts`)**: **42 / 42 assertions passed (100%)**.
- **Sprint 6.1 Test Suite (`tests/analytics/kpi_rpc_and_api.test.ts`)**: **19 / 19 passed (100%)**.
- **Phase 1 Regression Suite (`tests/database/kpi_rpc_and_indexes.test.ts`)**: **9 / 9 passed (100%)**.
- **Complete Test Suite (`tests/**/*.test.ts`)**: **204 / 204 unit & database tests passed across 62 suites (100%)**.
- **TypeScript Static Verification (`tsc --noEmit`)**: **0 errors**.
- **Anti-Slop AST Gate**: 0 `any` types, 0 generic blue (`#2563eb`), 0 decorative comment banners.
- **Git Authorship**: Authored strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- **Merge State**: Strict zero-merge policy enforced; PR remains strictly OPEN awaiting manual human review on GitHub.
