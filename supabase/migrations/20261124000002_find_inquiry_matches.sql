BEGIN;

-- Use invoker RLS for the lead read and scope the capability check to the caller's own profile.
CREATE FUNCTION public.find_inquiry_matches(p_email text, p_phone text)
RETURNS TABLE (id uuid, lead_ref text, name text, company text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
    WITH coordinates AS (
        SELECT nullif(lower(btrim(p_email)), '') AS email,
               nullif(regexp_replace(p_phone, '[^0-9]', '', 'g'), '') AS phone
    )
    SELECT lead.id, lead.lead_id, lead.name, lead.company
    FROM public.leads AS lead CROSS JOIN coordinates
    WHERE (SELECT public.current_inquiry_role()) IN ('admin', 'sales_manager')
      AND EXISTS (
        SELECT 1 FROM public.profiles AS caller
        WHERE caller.id = (SELECT auth.uid()) AND caller.status = 'active'
          AND (caller.role = 'admin' OR CASE
              WHEN cardinality(caller.allowed_tabs) > 0 THEN 'leads' = ANY (caller.allowed_tabs)
              ELSE caller.role = 'sales_manager' END)
      )
      AND lead.brief_payload->>'synthetic_benchmark' IS DISTINCT FROM 'true'
      AND lead.brief_payload->>'simulated' IS DISTINCT FROM 'true'
      AND ((coordinates.email IS NOT NULL AND lower(btrim(lead.email)) = coordinates.email)
        OR (length(coordinates.phone) BETWEEN 7 AND 15 AND
            regexp_replace(lead.phone, '[^0-9]', '', 'g') = coordinates.phone))
    ORDER BY lead.created_at DESC, lead.id DESC
    LIMIT 20
$$;

REVOKE ALL ON FUNCTION public.find_inquiry_matches(text, text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.find_inquiry_matches(text, text) TO authenticated;

COMMIT;
