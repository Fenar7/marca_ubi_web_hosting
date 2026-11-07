-- The update and its activity entry must succeed or roll back together.
CREATE OR REPLACE FUNCTION public.complete_lead_follow_up(p_lead_id uuid, p_expected_follow_up timestamptz, p_note text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_name text;
  updated_id uuid;
BEGIN
  IF caller_id IS NULL OR COALESCE(public.current_user_role(), '') NOT IN ('admin', 'sales_manager', 'sales_executive') THEN
    RAISE EXCEPTION 'Not authorized to complete follow-ups' USING ERRCODE = '42501';
  END IF;
  IF p_expected_follow_up IS NULL OR (p_note IS NOT NULL AND (length(p_note) > 2000 OR p_note ~ '[<>]' OR regexp_replace(p_note, E'[\n\r\t]', '', 'g') ~ '[[:cntrl:]]')) THEN
    RAISE EXCEPTION 'Invalid follow-up note' USING ERRCODE = '22023';
  END IF;

  SELECT full_name INTO caller_name FROM public.profiles WHERE id = caller_id;
  UPDATE public.leads SET next_follow_up = NULL
    WHERE id = p_lead_id AND next_follow_up = p_expected_follow_up
    RETURNING id INTO updated_id;
  IF updated_id IS NULL THEN RETURN false; END IF;

  INSERT INTO public.lead_activities (lead_id, actor_id, activity_type, description, metadata)
  VALUES (updated_id, caller_id, 'note_added',
    'Scheduled follow-up marked as completed by ' || COALESCE(caller_name, 'team member') || '.' ||
      CASE WHEN p_note IS NOT NULL AND p_note <> '' THEN ' Note: ' || p_note ELSE '' END,
    jsonb_build_object('cleared_follow_up', true, 'note', p_note));
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_lead_follow_up(uuid, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_lead_follow_up(uuid, timestamptz, text) TO authenticated;
NOTIFY pgrst, 'reload schema';
