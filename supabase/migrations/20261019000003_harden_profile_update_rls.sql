/**
 * Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
 * Migration: 20261019000003_harden_profile_update_rls.sql
 * Phase: 3 Remediation (Security & Row Level Security Hardening)
 * Description: Hardens profiles_update_policy to strictly forbid non-admin self-mutation
 *              of allowed_tabs, feature_permissions, must_change_password, role, and status.
 *              Also restores password_reset_completed to chk_team_audit_actions.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

-- 1. Hardened Profiles Update Policy
-- Blocks unauthorized privilege escalation via PostgREST / client-side update queries.
-- Non-admin users are strictly limited to updating profile coordinates (name, phone, avatar)
-- and cannot self-grant tabs, capabilities, role elevation, or bypass mandatory password resets.
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
        AND allowed_tabs = (SELECT p.allowed_tabs FROM public.profiles p WHERE p.id = auth.uid())
        AND feature_permissions = (SELECT p.feature_permissions FROM public.profiles p WHERE p.id = auth.uid())
        AND must_change_password = (SELECT p.must_change_password FROM public.profiles p WHERE p.id = auth.uid())
    )
);

COMMENT ON POLICY "profiles_update_policy" ON public.profiles IS
    'Allows full updates for administrators; restricts self-updates for active authenticated staff to non-security coordinates, strictly preventing privilege escalation.';

-- 2. Ensure comprehensive audit actions whitelist includes both permissions_updated and password_reset_completed
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
        'password_reset_completed',
        'permissions_updated'
    ));
END $$;
