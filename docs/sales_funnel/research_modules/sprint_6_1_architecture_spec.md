# Sprint 6.1 Architectural Specification: High-Performance Pipeline KPI Aggregation RPC, Indexing & Analytics API Gateway

**Document ID**: `SPEC-MARCA-CRM-SPRINT-6-1`  
**Phase**: Phase 6 (Executive Analytics, Dynamic KPI Ribbon & Aggregation Engine)  
**Sprint**: Sprint 6.1  
**Base Milestone**: `phase-6/analytics-and-kpi-ribbon`  
**Author**: Fenar7 <86710532+Fenar7@users.noreply.github.com>  
**Status**: Completed & Verified  

---

## 1. Overview & Business Objectives
Sprint 6.1 delivers the enterprise backend aggregation engine and API gateway powering the Executive KPI Ribbon and Executive Analytics surfaces across the Marca Ubi CRM.
To support high-concurrency executive querying across 100,000+ lead records without saturating database connection pools or suffering from query latency degradation, all multi-stage commercial pipeline metrics are consolidated into a high-performance PostgreSQL stored procedure (`get_pipeline_kpis`) paired with composite B-tree indexing and an authenticated Next.js 16 API Route Gateway (`/api/sales-funnel/kpis`).

---

## 2. Relational Schema & Composite Indexing Architecture
Migration: `supabase/migrations/20261015000011_kpi_rpc_function.sql`

### 2.1 High-Performance Composite Indexes
1. `idx_leads_created_status_assignee`:
   - Columns: `(created_at, status_id, assigned_to)`
   - Purpose: Enables index-only scans and bitmap index scans during temporal window queries filtered by stage or sales representative.
2. `idx_leads_source_created`:
   - Columns: `(lead_source_id, created_at)`
   - Purpose: Accelerates marketing channel cohort evaluations and acquisition-filtered metrics.
3. `idx_leads_followup_status`:
   - Columns: `(next_follow_up, status_id) WHERE next_follow_up IS NOT NULL`
   - Purpose: Partial covering index accelerating real-time overdue alerts while filtering out terminal stages.

### 2.2 Stored Procedure (`public.get_pipeline_kpis`)
- **Signature**:
  ```sql
  CREATE OR REPLACE FUNCTION public.get_pipeline_kpis(
      target_user_id UUID DEFAULT NULL,
      p_start_date TIMESTAMPTZ DEFAULT NULL,
      p_end_date TIMESTAMPTZ DEFAULT NULL,
      p_source_id UUID DEFAULT NULL,
      p_assignee_id UUID DEFAULT NULL
  )
  RETURNS JSONB
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public, auth, pg_temp
  ```
- **Unified Parameter Architecture**:
  - `target_user_id`: Preserves positional backward compatibility with single-argument invocations from Phase 1 (`get_pipeline_kpis($1)`).
  - `p_start_date`, `p_end_date`: Filter leads created within the temporal boundary.
  - `p_source_id`: Filter leads acquired through a specific channel.
  - `p_assignee_id`: Filter deals assigned to a designated commercial representative.
- **Role Sandboxing**:
  - `sales_executive`: Strictly sandboxed to `auth.uid()`, ignoring any passed target parameters.
  - `admin`, `sales_manager`, `viewer`: Permitted to query agency-wide totals or specific representatives.
  - Anonymous / Suspended accounts: Rejected with `ERRCODE = '42501'`.
- **Calculated Commercial Metrics**:
  - `total_leads_count` / `total_leads`: Total inquiries within filtered scope.
  - `open_leads_count`: Inquiries currently in open/intake stage.
  - `potential_leads_count` / `potential_count`: Active pipeline deals.
  - `potential_pipeline_value` / `potential_value`: Unweighted potential pipeline sum.
  - `stage_weighted_pipeline_value`: Probability-adjusted valuation (0.85 for negotiation, 0.50 for proposal, 0.25 for qualified, 0.20 other).
  - `converted_leads_count` / `converted_count`: Successfully won deals.
  - `converted_revenue_value` / `converted_value`: Total closed revenue.
  - `lost_leads_count` / `lost_count`: Lost deals count.
  - `disqualified_leads_count`: Leads marked lost due to spam/invalid or out of scope.
  - `conversion_rate_percentage` / `conversion_rate`: Net conversion rate excluding disqualified leads.
  - `overdue_follow_ups_count` / `overdue_count`: Past-due touches, respecting `On Hold` alert suppression.

---

## 3. Next.js 16 API Route Gateway (`/api/sales-funnel/kpis`)
- **Route**: `GET /api/sales-funnel/kpis`
- **Validation**: `src/app/lib/validations/kpiQuerySchema.ts` (Zod 4 schema validating ISO 8601 datetimes, UUID formats, and chronological range sequencing).
- **Authentication**: SSR Session verification via `createClient()`. Enforces active account status check.
- **Caching**: Stale-While-Revalidate caching header: `Cache-Control: public, s-maxage=15, stale-while-revalidate=45`.
- **Latency SLA**: Internal database execution time `< 2ms` (`EXPLAIN ANALYZE`), HTTP round-trip within production bounds.

---

## 4. Verification Results
- **`scripts/verify-sprint-6-1.ts`**: **42 / 42 assertions passed (100%)**.
- **`tests/analytics/kpi_rpc_and_api.test.ts`**: **19 / 19 passed (100%)**.
- **`tests/database/kpi_rpc_and_indexes.test.ts`**: **9 / 9 passed (100%)**.
- **Total Test Suite**: **204 / 204 tests passed across 62 suites (100%)**.
- **TypeScript Static Verification**: **0 errors (`tsc --noEmit`)**.
