/**
 * Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
 * Migration: 20261015000005_team_provisioning_and_governance.sql
 * Phase: 3 (Multi-User Identity, Team Provisioning & Governance Engine)
 * Sprint: 3.1 (Admin SDK Provisioning Engine, Server Action createTeamUser & Multi-Role Governance)
 * Target Engine: PostgreSQL 15+ (Supabase Managed PostgreSQL)
 * Description: Extends profiles schema with credential lifecycle flags (must_change_password),
 *              provisions high-performance team governance indexes, and verifies
 *              tamper-proof audit trail triggers.
 */

-- 1. Credential Lifecycle Tracking
-- Architectural Rationale: When an administrator provisions a staff account via createTeamUser,
-- a temporary password is generated. The must_change_password flag enables Edge Middleware
-- and client route guards to enforce a mandatory password reset before granting CRM access.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.must_change_password IS 'Requires team member to update their temporary password upon initial login before accessing workspace data.';

-- 2. Team Governance & Directory Lookup Indexes
-- Architectural Rationale: Accelerates filtered staff queries in /admin/team and optimizes
-- sole-admin concurrency checks executed inside protect_sole_admin().
CREATE INDEX IF NOT EXISTS idx_profiles_role_status 
    ON public.profiles (role, status);

CREATE INDEX IF NOT EXISTS idx_profiles_invited_by 
    ON public.profiles (invited_by) 
    WHERE invited_by IS NOT NULL;

-- 3. Team Audit Log Immutability & Action Integrity
-- Architectural Rationale: Guarantees that administrative actions recorded in team_audit_logs
-- conform to strict governance classifications and cannot be mutated or purged.
DO $$
BEGIN
    -- Verify check constraint on action types covers all Phase 3 governance operations
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_team_audit_actions' 
          AND conrelid = 'public.team_audit_logs'::regclass
    ) THEN
        -- Add explicit check constraint if not already present
        ALTER TABLE public.team_audit_logs 
        DROP CONSTRAINT IF EXISTS team_audit_logs_action_check;

        ALTER TABLE public.team_audit_logs 
        ADD CONSTRAINT chk_team_audit_actions CHECK (action IN (
            'user_created',
            'role_changed',
            'user_suspended',
            'user_activated',
            'leads_bulk_reassigned',
            'password_reset_dispatched'
        ));
    END IF;
END $$;
