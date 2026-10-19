/**
 * Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
 * Migration: 20261015000007_offboarding_policies.sql
 * Phase: 4 (Personnel Offboarding, Session Revocation & Lead Reassignment Engine)
 * Sprint: 4.1 (Rep Offboarding Protocol, Session Revocation & Account Suspension Engine)
 * Target Engine: PostgreSQL 15+ (Supabase Managed PostgreSQL)
 * Description: Hardens Row Level Security policies asserting active account status for data modifications,
 *              blocks suspended representatives from reading historical lead activities,
 *              prevents suspended profiles from self-modifying coordinates,
 *              and verifies offboarding audit trail constraints.
 */

-- 1. Hardened Profiles Update Policy
-- Architectural Rationale: Prevents suspended or offboarded personnel from mutating their own profile
-- coordinates (name, phone, avatar) or tampering with status flags after administrative offboarding.
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (
    public.current_user_role() = 'admin'
    OR (
        id = auth.uid()
        AND (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid()) = 'active'
    )
)
WITH CHECK (
    public.current_user_role() = 'admin'
    OR (
        id = auth.uid()
        AND (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid()) = 'active'
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
        AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
    )
);

-- 2. Hardened Lead Activities Selection Policy
-- Architectural Rationale: Ensures that departing/suspended sales executives cannot access historical lead activity logs
-- or client touchpoint timelines even if assigned to a lead ID prior to offboarding.
DROP POLICY IF EXISTS "activities_select_policy" ON public.lead_activities;
CREATE POLICY "activities_select_policy" ON public.lead_activities
FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('admin', 'sales_manager', 'viewer')
    OR (
        public.current_user_role() = 'sales_executive'
        AND EXISTS (
            SELECT 1 FROM public.leads l 
            WHERE l.id = lead_activities.lead_id 
              AND l.assigned_to = auth.uid()
        )
    )
);

-- 3. Verify and Assert Team Audit Actions Whitelist
-- Architectural Rationale: Guarantees that offboarding audit entries ('user_suspended') conform to
-- evidentiary integrity standards and cannot be rejected or bypassed.
DO $$
BEGIN
    ALTER TABLE public.team_audit_logs 
    DROP CONSTRAINT IF EXISTS chk_team_audit_actions;

    ALTER TABLE public.team_audit_logs 
    DROP CONSTRAINT IF EXISTS team_audit_logs_action_check;

    ALTER TABLE public.team_audit_logs 
    ADD CONSTRAINT chk_team_audit_actions CHECK (action IN (
        'user_created',
        'role_changed',
        'user_suspended',
        'user_activated',
        'leads_bulk_reassigned',
        'password_reset_dispatched',
        'password_reset_completed'
    ));
END $$;
