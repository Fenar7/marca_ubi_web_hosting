-- Migration: 20261015000011_kpi_rpc_function.sql
-- Module: High-Performance Pipeline KPI Aggregation RPC, Indexing & Analytics Engine (Sprint 6.1)
-- Author: Fenar7 <86710532+Fenar7@users.noreply.github.com>
-- Architectural Standard: Master PRD Section 1.5, Section 6 & SPEC-MARCA-CRM-UX-PHASES-6-9

-- 1. High-Performance Composite Indexes for Analytical Query Acceleration
CREATE INDEX IF NOT EXISTS idx_leads_created_status_assignee 
    ON public.leads (created_at, status_id, assigned_to);

CREATE INDEX IF NOT EXISTS idx_leads_source_created 
    ON public.leads (lead_source_id, created_at);

CREATE INDEX IF NOT EXISTS idx_leads_followup_status 
    ON public.leads (next_follow_up, status_id) 
    WHERE next_follow_up IS NOT NULL;

-- 2. Drop Existing Functions to Enable Clean Signature Evolution Without Overload Ambiguity
DROP FUNCTION IF EXISTS public.get_pipeline_kpis(UUID);
DROP FUNCTION IF EXISTS public.get_pipeline_kpis(TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID);
DROP FUNCTION IF EXISTS public.get_pipeline_kpis(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID);

-- 3. Core Unified Parameterized Pipeline KPI Aggregation Function
-- Architectural Rationale: Computes all core commercial metrics in a single database round-trip.
-- Supports multi-dimensional filtering across date ranges, acquisition sources, and assigned personnel.
-- Scoping Defense: Sales Executives are strictly sandboxed to their own assigned deals,
-- while Leadership (Admin, Sales Manager) and Viewers can query agency-wide totals or specific representatives.
-- Security Definer Hardening: Statically pinned to SET search_path = public, auth, pg_temp to prevent CWE-426.
-- Role-Gated Perimeter Defense: Enforces strict session authentication, rejecting unauthenticated callers
-- and suspended accounts with ERRCODE 42501 (CWE-284 / OWASP API3).
-- Mathematical Safety: Implements safe conditional division to eliminate division-by-zero exceptions,
-- excludes spam/invalid inquiries from conversion rate calculations, and wraps sums in COALESCE to guarantee non-null numeric returns.
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
AS $$
DECLARE
    caller_role TEXT;
    selected_rep UUID;
    effective_assignee UUID;
    result JSONB;
BEGIN
    caller_role := public.current_user_role();

    IF caller_role IS NULL THEN
        RAISE EXCEPTION 'Access denied: active authenticated CRM session required.' 
            USING ERRCODE = '42501';
    ELSIF caller_role = 'sales_executive' THEN
        effective_assignee := auth.uid();
    ELSIF caller_role IN ('admin', 'sales_manager', 'viewer') THEN
        selected_rep := COALESCE(p_assignee_id, target_user_id);
        effective_assignee := selected_rep;
    ELSE
        RAISE EXCEPTION 'Access denied: unauthorized operational role.' 
            USING ERRCODE = '42501';
    END IF;

    WITH lead_metrics AS (
        SELECT
            l.expected_value,
            l.next_follow_up,
            l.revisit_date,
            l.lost_reason,
            fs.bucket,
            fs.name AS status_name
        FROM public.leads l
        JOIN public.funnel_statuses fs ON l.status_id = fs.id
        WHERE (effective_assignee IS NULL OR l.assigned_to = effective_assignee)
          AND (p_start_date IS NULL OR l.created_at >= p_start_date)
          AND (p_end_date IS NULL OR l.created_at <= p_end_date)
          AND (p_source_id IS NULL OR l.lead_source_id = p_source_id)
    ),
    aggregated AS (
        SELECT
            COUNT(*)::INT AS total_leads_count,
            COUNT(*) FILTER (WHERE bucket = 'open')::INT AS open_leads_count,
            COUNT(*) FILTER (WHERE bucket = 'potential')::INT AS potential_leads_count,
            COALESCE(SUM(expected_value) FILTER (WHERE bucket = 'potential'), 0.00)::NUMERIC(14,2) AS potential_pipeline_value,
            COALESCE(SUM(
                CASE 
                    WHEN bucket = 'potential' THEN
                        expected_value * (
                            CASE 
                                WHEN lower(status_name) LIKE '%negotiat%' THEN 0.85
                                WHEN lower(status_name) LIKE '%proposal%' THEN 0.50
                                WHEN lower(status_name) LIKE '%qualified%' THEN 0.25
                                ELSE 0.20
                            END
                        )
                    ELSE 0.00
                END
            ), 0.00)::NUMERIC(14,2) AS stage_weighted_pipeline_value,
            COUNT(*) FILTER (WHERE bucket = 'converted')::INT AS converted_leads_count,
            COALESCE(SUM(expected_value) FILTER (WHERE bucket = 'converted'), 0.00)::NUMERIC(14,2) AS converted_revenue_value,
            COUNT(*) FILTER (WHERE bucket = 'lost')::INT AS lost_leads_count,
            COUNT(*) FILTER (WHERE lost_reason IN ('spam_invalid', 'out_of_scope'))::INT AS disqualified_leads_count,
            COUNT(*) FILTER (
                WHERE bucket NOT IN ('converted', 'lost') 
                  AND next_follow_up IS NOT NULL 
                  AND next_follow_up < timezone('utc'::text, now())
                  AND (status_name != 'On Hold' OR revisit_date IS NULL OR revisit_date <= CURRENT_DATE)
            )::INT AS overdue_follow_ups_count,
            CASE 
                WHEN (COUNT(*) - COUNT(*) FILTER (WHERE lost_reason IN ('spam_invalid', 'out_of_scope'))) = 0 THEN 0.0
                ELSE ROUND(
                    (COUNT(*) FILTER (WHERE bucket = 'converted')::NUMERIC / 
                    NULLIF(COUNT(*) - COUNT(*) FILTER (WHERE lost_reason IN ('spam_invalid', 'out_of_scope')), 0)::NUMERIC) * 100.0, 
                    2
                )
            END AS conversion_rate_percentage
        FROM lead_metrics
    )
    SELECT jsonb_build_object(
        'total_leads_count', aggregated.total_leads_count,
        'total_leads', aggregated.total_leads_count,
        'open_leads_count', aggregated.open_leads_count,
        'potential_leads_count', aggregated.potential_leads_count,
        'potential_count', aggregated.potential_leads_count,
        'potential_pipeline_value', aggregated.potential_pipeline_value,
        'potential_value', aggregated.potential_pipeline_value,
        'stage_weighted_pipeline_value', aggregated.stage_weighted_pipeline_value,
        'converted_leads_count', aggregated.converted_leads_count,
        'converted_count', aggregated.converted_leads_count,
        'converted_revenue_value', aggregated.converted_revenue_value,
        'converted_value', aggregated.converted_revenue_value,
        'lost_leads_count', aggregated.lost_leads_count,
        'lost_count', aggregated.lost_leads_count,
        'disqualified_leads_count', aggregated.disqualified_leads_count,
        'overdue_follow_ups_count', aggregated.overdue_follow_ups_count,
        'overdue_count', aggregated.overdue_follow_ups_count,
        'conversion_rate_percentage', aggregated.conversion_rate_percentage,
        'conversion_rate', aggregated.conversion_rate_percentage
    )
    INTO result
    FROM aggregated;

    RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_pipeline_kpis(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID) IS 'High-speed aggregated pipeline analytics RPC returning commercial KPIs in a single round-trip with multi-dimensional filtering, stage weighting, spam exclusion, and role-based scoping.';

-- 4. Explicit Privilege Configuration: Revoke public and anon access, grant exclusively to authenticated staff and service_role.
REVOKE EXECUTE ON FUNCTION public.get_pipeline_kpis(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_pipeline_kpis(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_pipeline_kpis(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID) TO authenticated, service_role;
