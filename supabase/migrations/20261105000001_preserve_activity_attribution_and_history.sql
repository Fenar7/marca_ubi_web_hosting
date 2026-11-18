-- Preserve authenticated actor attribution and prevent lead deletion from erasing its audit trail.

DROP POLICY IF EXISTS "activities_insert_policy" ON public.lead_activities;
CREATE POLICY "activities_insert_policy" ON public.lead_activities
FOR INSERT TO authenticated
WITH CHECK (
    actor_id = (SELECT auth.uid())
    AND (
        public.current_user_role() IN ('admin', 'sales_manager')
        OR (
            public.current_user_role() = 'sales_executive'
            AND EXISTS (
                SELECT 1
                FROM public.leads l
                WHERE l.id = lead_activities.lead_id
                  AND l.assigned_to = (SELECT auth.uid())
            )
        )
    )
);

COMMENT ON POLICY "activities_insert_policy" ON public.lead_activities IS
    'Allows staff to append activity only within their lead scope and binds actor_id to the authenticated user; SECURITY DEFINER database triggers remain the path for system events.';

DROP POLICY IF EXISTS "activities_update_policy" ON public.lead_activities;
DROP POLICY IF EXISTS "activities_delete_policy" ON public.lead_activities;

-- Preserve the PRD's lifecycle contract: normal users cannot mutate activity rows, while an
-- authorized permanent lead purge removes its dependent events atomically with the lead.

-- Direct profile-table reads may contain contact and account-governance fields.
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_scoped" ON public.profiles;
CREATE POLICY "profiles_select_scoped" ON public.profiles
FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('admin', 'sales_manager')
    OR (
        id = (SELECT auth.uid())
        AND public.current_user_role() IS NOT NULL
    )
);

COMMENT ON POLICY "profiles_select_scoped" ON public.profiles IS
    'Restricts direct profile-table reads to leadership and the authenticated user; non-leadership CRM display consumers use the safe directory projection.';

-- The view intentionally runs with its owner privileges so callers receive only the
-- minimum active-staff fields needed to label lead ownership and activity history.
CREATE OR REPLACE VIEW public.crm_team_directory
WITH (security_barrier = true)
AS
SELECT id, full_name, role, avatar_url
FROM public.profiles
WHERE status = 'active'
  AND public.current_user_role() IN ('admin', 'sales_manager', 'sales_executive', 'viewer');

REVOKE ALL ON public.crm_team_directory FROM PUBLIC, anon;
GRANT SELECT ON public.crm_team_directory TO authenticated;

COMMENT ON VIEW public.crm_team_directory IS
    'Safe active-staff display projection: id, full name, role, and avatar only. Direct profile rows remain protected by profiles_select_scoped.';

NOTIFY pgrst, 'reload schema';
