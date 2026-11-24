-- Audit each settings update in the same transaction using the caller's existing RLS grants.
CREATE FUNCTION public.audit_agency_settings_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE
    v_actor_id uuid := auth.uid();
    v_actor_email text;
BEGIN
    SELECT email INTO STRICT v_actor_email FROM public.profiles WHERE id = v_actor_id;
    INSERT INTO public.team_audit_logs (actor_id, action, target_user_email, details)
    VALUES (
        v_actor_id, 'update_agency_settings', v_actor_email,
        jsonb_build_object(
            'lead_response_sla_minutes', NEW.lead_response_sla_minutes,
            'followup_grace_period_hours', NEW.followup_grace_period_hours,
            'stale_deal_threshold_days', NEW.stale_deal_threshold_days,
            'dedup_window_hours', NEW.dedup_window_hours,
            'bot_rate_limit_per_minute', NEW.bot_rate_limit_per_minute,
            'notification_email', NEW.notification_email
        )
    );
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_agency_settings_update() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER audit_agency_settings_update
    AFTER UPDATE ON public.agency_settings
    FOR EACH ROW EXECUTE FUNCTION public.audit_agency_settings_update();
