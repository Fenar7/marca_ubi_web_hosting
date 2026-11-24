/**
 * Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
 * Migration: 20261125000001_personnel_login_telemetry.sql
 * Description: Extends public.team_audit_logs action constraint to record real user login
 *              and session revocation events, and adds composite indexes for personnel
 *              login history and touchpoint velocity queries.
 */

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
        'permissions_updated',
        'update_agency_settings',
        'user_login',
        'sessions_revoked'
    ));
END $$;

CREATE INDEX IF NOT EXISTS idx_team_audit_logs_target_action_created
    ON public.team_audit_logs (target_user_email, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_audit_logs_actor_created
    ON public.team_audit_logs (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_activities_actor_created
    ON public.lead_activities (actor_id, created_at DESC);
