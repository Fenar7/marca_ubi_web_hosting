-- Migration: 20261015000003_rls_security_policies.sql
-- Description: Phase 1 / Sprint 1.3: Granular Row Level Security (RLS) Engine & Access Controls.
-- Implements bulletproof tenant data isolation across the platform's four operational roles:
-- 'admin', 'sales_manager', 'sales_executive', and 'viewer'.
-- Enforces immutable append-only ledgers on activities and audit logs, subquery optimization via
-- STABLE current_user_role(), and self-escalation / account-hijacking defenses.

-- Function: public.current_user_role()
-- Architectural Rationale: Evaluates caller's role from public.profiles with STABLE optimizer caching.
-- Marked STABLE to instruct the query planner to evaluate role lookup once per query plan execution,
-- avoiding O(N) secondary table scan degradation across large result sets.
-- Marked SECURITY DEFINER with fixed search_path to prevent privilege escalation or search_path hijacking (CWE-426).
-- Inactive / suspended accounts return NULL, causing immediate denial across all role-gated policies.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role 
    FROM public.profiles 
    WHERE id = auth.uid() 
      AND status = 'active';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp;

COMMENT ON FUNCTION public.current_user_role() IS 'High-performance STABLE helper function caching caller role for single-pass RLS evaluation; returns NULL for suspended or non-existent accounts.';

-- Enable Row Level Security across all core domain and ledger tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
-- Authenticated staff can inspect teammate profiles to populate assignment dropdowns and avatar cards.
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles
FOR SELECT TO authenticated
USING (true);

-- Users can edit their personal contact coordinates (full_name, phone, avatar_url).
-- Only Admins possess unrestricted update rights over roles and account statuses.
-- Non-admin callers attempting to alter their stored role or status are blocked by WITH CHECK subquery evaluation.
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (
    public.current_user_role() = 'admin'
    OR id = auth.uid()
)
WITH CHECK (
    public.current_user_role() = 'admin'
    OR (
        id = auth.uid()
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
        AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
    )
);

-- Creation and permanent deletion of employee directory records is strictly restricted to agency administrators.
DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
CREATE POLICY "profiles_admin_insert" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_admin_delete" ON public.profiles
FOR DELETE TO authenticated
USING (public.current_user_role() = 'admin');

-- 2. LEAD SOURCES & FUNNEL STATUSES POLICIES
-- Reference catalog tables are publicly readable by all authenticated staff members.
DROP POLICY IF EXISTS "sources_select_all" ON public.lead_sources;
CREATE POLICY "sources_select_all" ON public.lead_sources
FOR SELECT TO authenticated
USING (true);

-- Adding, renaming, or toggling commercial channels is restricted to leadership (admin and sales_manager).
DROP POLICY IF EXISTS "sources_admin_manager_mutation" ON public.lead_sources;
CREATE POLICY "sources_admin_manager_mutation" ON public.lead_sources
FOR ALL TO authenticated
USING (public.current_user_role() IN ('admin', 'sales_manager'))
WITH CHECK (public.current_user_role() IN ('admin', 'sales_manager'));

DROP POLICY IF EXISTS "statuses_select_all" ON public.funnel_statuses;
CREATE POLICY "statuses_select_all" ON public.funnel_statuses
FOR SELECT TO authenticated
USING (true);

-- Adding, reordering, or color-coding pipeline statuses is restricted to leadership (admin and sales_manager).
DROP POLICY IF EXISTS "statuses_admin_manager_mutation" ON public.funnel_statuses;
CREATE POLICY "statuses_admin_manager_mutation" ON public.funnel_statuses
FOR ALL TO authenticated
USING (public.current_user_role() IN ('admin', 'sales_manager'))
WITH CHECK (public.current_user_role() IN ('admin', 'sales_manager'));

-- 3. LEADS POLICIES
-- Admins, Sales Managers, and Viewers can inspect all agency deals.
-- Sales Executives are strictly sandboxed to records explicitly assigned to their auth.uid().
DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
CREATE POLICY "leads_select_policy" ON public.leads
FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('admin', 'sales_manager', 'viewer')
    OR (public.current_user_role() = 'sales_executive' AND assigned_to = auth.uid())
);

-- Admins and Managers can manually create leads assigned to any representative.
-- Executives can create leads provided they assign the lead directly to themselves.
-- Viewers have zero creation permissions.
DROP POLICY IF EXISTS "leads_insert_policy" ON public.leads;
CREATE POLICY "leads_insert_policy" ON public.leads
FOR INSERT TO authenticated
WITH CHECK (
    public.current_user_role() IN ('admin', 'sales_manager')
    OR (public.current_user_role() = 'sales_executive' AND assigned_to = auth.uid())
);

-- Admins and Managers can update any lead across all stages.
-- Executives can update only their own assigned deals.
-- WITH CHECK prevents Executives from transferring ownership (hijacking or dumping accounts) to another rep.
-- Viewers cannot execute updates.
DROP POLICY IF EXISTS "leads_update_policy" ON public.leads;
CREATE POLICY "leads_update_policy" ON public.leads
FOR UPDATE TO authenticated
USING (
    public.current_user_role() IN ('admin', 'sales_manager')
    OR (public.current_user_role() = 'sales_executive' AND assigned_to = auth.uid())
)
WITH CHECK (
    public.current_user_role() IN ('admin', 'sales_manager')
    OR (public.current_user_role() = 'sales_executive' AND assigned_to = auth.uid())
);

-- Deletion of client accounts is permanently restricted to agency administrators.
DROP POLICY IF EXISTS "leads_delete_policy" ON public.leads;
CREATE POLICY "leads_delete_policy" ON public.leads
FOR DELETE TO authenticated
USING (public.current_user_role() = 'admin');

-- 4. LEAD ACTIVITIES POLICIES
-- Activities inherit visibility from the parent lead:
-- Leadership and Viewers can inspect all entries; Executives view only activities on assigned deals.
DROP POLICY IF EXISTS "activities_select_policy" ON public.lead_activities;
CREATE POLICY "activities_select_policy" ON public.lead_activities
FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('admin', 'sales_manager', 'viewer')
    OR EXISTS (
        SELECT 1 FROM public.leads l 
        WHERE l.id = lead_activities.lead_id 
          AND l.assigned_to = auth.uid()
    )
);

-- Staff can record calls, meetings, and notes on leads within their authorized scope.
DROP POLICY IF EXISTS "activities_insert_policy" ON public.lead_activities;
CREATE POLICY "activities_insert_policy" ON public.lead_activities
FOR INSERT TO authenticated
WITH CHECK (
    public.current_user_role() IN ('admin', 'sales_manager')
    OR (
        public.current_user_role() = 'sales_executive'
        AND EXISTS (
            SELECT 1 FROM public.leads l 
            WHERE l.id = lead_activities.lead_id 
              AND l.assigned_to = auth.uid()
        )
    )
);

-- Immutability Guarantee: No UPDATE or DELETE policies are defined for lead_activities.
-- PostgreSQL RLS default-deny prevents modification or deletion of historical audit logs.

-- 5. TEAM AUDIT LOGS POLICIES
-- Agency administrative audit records are readable and writable exclusively by administrators.
DROP POLICY IF EXISTS "team_audit_admin_only_select" ON public.team_audit_logs;
CREATE POLICY "team_audit_admin_only_select" ON public.team_audit_logs
FOR SELECT TO authenticated
USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "team_audit_insert_system" ON public.team_audit_logs;
CREATE POLICY "team_audit_insert_system" ON public.team_audit_logs
FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() = 'admin');

-- Immutability Guarantee: No UPDATE or DELETE policies are declared for team_audit_logs.
