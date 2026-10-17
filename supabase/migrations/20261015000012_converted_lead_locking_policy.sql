-- ==============================================================================
-- Migration: 20261015000012_converted_lead_locking_policy.sql
-- Description: Enforces database-level check constraints and RLS update policies
--              preventing non-admins from editing converted leads (PRD §15.18).
-- Author: Fenar7 <86710532+Fenar7@users.noreply.github.com>
-- ==============================================================================

-- 1. Upgrade leads update RLS policy
-- Converted deals (where converted_at IS NOT NULL) are strictly locked from non-admin modifications.
-- Only 'admin' role is permitted to modify a lead once converted_at is set.
DROP POLICY IF EXISTS "leads_update_policy" ON public.leads;

CREATE POLICY "leads_update_policy" ON public.leads
FOR UPDATE TO authenticated
USING (
    -- Admin has universal update rights across all stages including converted deals
    public.current_user_role() = 'admin'
    OR (
        -- Sales Manager can only update non-converted deals
        public.current_user_role() = 'sales_manager'
        AND converted_at IS NULL
    )
    OR (
        -- Sales Executive can only update assigned non-converted deals
        public.current_user_role() = 'sales_executive'
        AND assigned_to = auth.uid()
        AND converted_at IS NULL
    )
)
WITH CHECK (
    public.current_user_role() = 'admin'
    OR (
        public.current_user_role() = 'sales_manager'
        AND converted_at IS NULL
    )
    OR (
        public.current_user_role() = 'sales_executive'
        AND assigned_to = auth.uid()
        AND converted_at IS NULL
    )
);

COMMENT ON POLICY "leads_update_policy" ON public.leads IS 
'Enforces post-conversion record locking: non-admin roles (sales_manager, sales_executive) are barred from editing deals once converted_at is set.';
