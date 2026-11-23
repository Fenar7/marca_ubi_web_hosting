-- Restore the display projection on installations where the directory view is absent.
-- The caller's active CRM role gates access. The view exposes no contact or account fields.
CREATE OR REPLACE VIEW public.crm_team_directory
WITH (security_barrier = true, security_invoker = false)
AS
SELECT id, full_name, role, avatar_url
FROM public.profiles
WHERE status = 'active'
  AND (SELECT public.current_user_role()) IN ('admin', 'sales_manager', 'sales_executive', 'viewer');

REVOKE ALL ON public.crm_team_directory FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.crm_team_directory TO authenticated;

COMMENT ON VIEW public.crm_team_directory IS
    'Active CRM staff display projection: id, full name, role and avatar.';

NOTIFY pgrst, 'reload schema';
