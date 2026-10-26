/**
 * Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
 * Migration: 20261015000006_password_reset_governance.sql
 * Phase: 3 (Multi-User Identity, Team Provisioning & Governance Engine)
 * Sprint: 3.2 (Team Management Workspace, Temporary Credential Security & Audit Logging)
 * Target Engine: PostgreSQL 15+ (Supabase Managed PostgreSQL)
 * Description: Upgrades check constraint on public.team_audit_logs to include
 *              'password_reset_completed' action for first-login reset auditability.
 */

DO $$
BEGIN
    -- Upgrade check constraint on public.team_audit_logs to include password_reset_completed
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
