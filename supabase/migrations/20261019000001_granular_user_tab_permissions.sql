/**
 * Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
 * Migration: 20261019000001_granular_user_tab_permissions.sql
 * Phase: 1 (Database Architecture & Granular Permissions Engine)
 * Description: Introduces granular tab and feature-level permission schemas to public.profiles,
 *              populates role-based defaults, enforces admin lockout protection triggers,
 *              extends team audit actions, and provides high-performance GIN indexing.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

-- 1. Extend profiles table with allowed_tabs and feature_permissions
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS allowed_tabs TEXT[] NOT NULL DEFAULT ARRAY[
    'command_center', 'leads', 'deals', 'works', 'tasks'
]::TEXT[],
ADD COLUMN IF NOT EXISTS feature_permissions JSONB NOT NULL DEFAULT '{
    "can_view_financials": false,
    "can_export_data": false,
    "can_reassign_leads": false,
    "can_delete_records": false,
    "can_manage_team": false
}'::jsonb;

COMMENT ON COLUMN public.profiles.allowed_tabs IS 'Array of canonical CRM tab identifiers accessible by this team member.';
COMMENT ON COLUMN public.profiles.feature_permissions IS 'Granular operational capability flags governing sensitive actions.';

-- 2. Enforce check constraint on canonical tab keys
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS chk_profiles_allowed_tabs;

ALTER TABLE public.profiles
ADD CONSTRAINT chk_profiles_allowed_tabs CHECK (
    allowed_tabs <@ ARRAY[
        'command_center', 'leads', 'deals', 'works', 'tasks',
        'users', 'analytics', 'ingestion', 'settings'
    ]::TEXT[]
);

-- 3. Backfill existing profiles with proper role-based defaults
UPDATE public.profiles
SET allowed_tabs = CASE
    WHEN role = 'admin' THEN ARRAY[
        'command_center', 'leads', 'deals', 'works', 'tasks',
        'users', 'analytics', 'ingestion', 'settings'
    ]::TEXT[]
    WHEN role = 'sales_manager' THEN ARRAY[
        'command_center', 'leads', 'deals', 'works', 'tasks',
        'users', 'analytics', 'ingestion'
    ]::TEXT[]
    WHEN role = 'sales_executive' THEN ARRAY[
        'command_center', 'leads', 'deals', 'works', 'tasks'
    ]::TEXT[]
    WHEN role = 'viewer' THEN ARRAY[
        'command_center', 'leads', 'deals', 'works', 'analytics'
    ]::TEXT[]
    ELSE allowed_tabs
END,
feature_permissions = CASE
    WHEN role = 'admin' THEN '{
        "can_view_financials": true,
        "can_export_data": true,
        "can_reassign_leads": true,
        "can_delete_records": true,
        "can_manage_team": true
    }'::jsonb
    WHEN role = 'sales_manager' THEN '{
        "can_view_financials": true,
        "can_export_data": true,
        "can_reassign_leads": true,
        "can_delete_records": false,
        "can_manage_team": false
    }'::jsonb
    WHEN role = 'sales_executive' THEN '{
        "can_view_financials": false,
        "can_export_data": false,
        "can_reassign_leads": false,
        "can_delete_records": false,
        "can_manage_team": false
    }'::jsonb
    WHEN role = 'viewer' THEN '{
        "can_view_financials": true,
        "can_export_data": false,
        "can_reassign_leads": false,
        "can_delete_records": false,
        "can_manage_team": false
    }'::jsonb
    ELSE feature_permissions
END;

-- 4. Invariant Protection: Active administrators must never lose access to user management or settings
CREATE OR REPLACE FUNCTION public.validate_admin_tab_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.role = 'admin' AND NEW.status = 'active' THEN
        -- If an explicit modification to allowed_tabs was attempted that strips users or settings
        IF TG_OP = 'UPDATE' AND (OLD.allowed_tabs IS DISTINCT FROM NEW.allowed_tabs) THEN
            IF NOT ('users' = ANY(NEW.allowed_tabs)) OR NOT ('settings' = ANY(NEW.allowed_tabs)) THEN
                RAISE EXCEPTION 'Agency Invariant Violation: Active administrators must retain access to users and settings workspaces.'
                    USING ERRCODE = '23514';
            END IF;
        ELSE
            -- On INSERT or an UPDATE not modifying allowed_tabs, ensure active admin automatically possesses all admin tabs
            IF NEW.allowed_tabs IS NULL OR NOT ('users' = ANY(NEW.allowed_tabs)) OR NOT ('settings' = ANY(NEW.allowed_tabs)) THEN
                NEW.allowed_tabs := ARRAY[
                    'command_center', 'leads', 'deals', 'works', 'tasks',
                    'users', 'analytics', 'ingestion', 'settings'
                ]::TEXT[];
            END IF;
            IF NEW.feature_permissions IS NULL OR (NEW.feature_permissions->>'can_manage_team')::boolean IS NOT TRUE THEN
                NEW.feature_permissions := '{
                    "can_view_financials": true,
                    "can_export_data": true,
                    "can_reassign_leads": true,
                    "can_delete_records": true,
                    "can_manage_team": true
                }'::jsonb;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_admin_tab_permissions() IS 'Guarantees agency governance by preventing active administrators from being stripped of users or settings tab permissions.';

DROP TRIGGER IF EXISTS trg_validate_admin_tab_permissions ON public.profiles;
CREATE TRIGGER trg_validate_admin_tab_permissions
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_admin_tab_permissions();

-- 5. Extend team_audit_logs constraint to include permissions_updated
ALTER TABLE public.team_audit_logs 
DROP CONSTRAINT IF EXISTS chk_team_audit_actions;

ALTER TABLE public.team_audit_logs 
ADD CONSTRAINT chk_team_audit_actions CHECK (action IN (
    'user_created',
    'role_changed',
    'user_suspended',
    'user_activated',
    'leads_bulk_reassigned',
    'password_reset_dispatched',
    'permissions_updated'
));

-- 6. GIN Indexes for high-speed permission array containment queries
CREATE INDEX IF NOT EXISTS idx_profiles_allowed_tabs 
    ON public.profiles USING gin (allowed_tabs);

CREATE INDEX IF NOT EXISTS idx_profiles_feature_permissions 
    ON public.profiles USING gin (feature_permissions);

-- 7. Helper function to check tab permission for current authenticated user
CREATE OR REPLACE FUNCTION public.current_user_has_tab(p_tab TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    has_tab BOOLEAN;
BEGIN
    SELECT (p_tab = ANY(allowed_tabs))
    INTO has_tab
    FROM public.profiles
    WHERE id = auth.uid() AND status = 'active';

    RETURN COALESCE(has_tab, false);
END;
$$;

COMMENT ON FUNCTION public.current_user_has_tab(TEXT) IS 'Returns true if the calling authenticated active user possesses explicit permission for the specified tab.';
