-- Migration: 20261015000013_on_hold_revisit_automation.sql
-- Description: Enforces mandatory future revisit_date when parking leads in 'On Hold',
-- and defines automated stored logic to reactivate expired parked leads into active follow-up.

-- 1. Validation trigger for 'On Hold' status transitions
CREATE OR REPLACE FUNCTION public.validate_on_hold_revisit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status_name TEXT;
BEGIN
    -- Query the target funnel status name
    SELECT name INTO v_status_name
    FROM public.funnel_statuses
    WHERE id = NEW.status_id;

    -- If target status is 'On Hold', strictly enforce a non-null future revisit_date
    IF v_status_name = 'On Hold' THEN
        IF NEW.revisit_date IS NULL THEN
            RAISE EXCEPTION 'On Hold leads require a mandatory future revisit_date.'
                USING ERRCODE = '23514'; -- check_violation
        END IF;

        IF NEW.revisit_date <= CURRENT_DATE THEN
            RAISE EXCEPTION 'The revisit_date for On Hold leads must be strictly in the future (after %). Provided: %',
                CURRENT_DATE, NEW.revisit_date
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_on_hold_revisit ON public.leads;
CREATE TRIGGER trg_validate_on_hold_revisit
    BEFORE INSERT OR UPDATE OF status_id, revisit_date
    ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_on_hold_revisit();

-- 2. Stored procedure to reactivate expired On Hold leads
CREATE OR REPLACE FUNCTION public.reactivate_expired_on_hold_leads()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reactivated_count INTEGER := 0;
    v_on_hold_id UUID;
    v_contacted_id UUID;
    v_lead RECORD;
BEGIN
    -- Retrieve canonical status IDs
    SELECT id INTO v_on_hold_id FROM public.funnel_statuses WHERE name = 'On Hold';
    SELECT id INTO v_contacted_id FROM public.funnel_statuses WHERE name = 'Contacted';

    IF v_on_hold_id IS NULL OR v_contacted_id IS NULL THEN
        RETURN 0;
    END IF;

    -- Iterate through expired on-hold leads
    FOR v_lead IN
        SELECT id, name, company, assigned_to, revisit_date
        FROM public.leads
        WHERE status_id = v_on_hold_id
          AND revisit_date <= CURRENT_DATE
          AND converted_at IS NULL
    LOOP
        -- Revert status to Contacted and align next_follow_up to current time
        UPDATE public.leads
        SET status_id = v_contacted_id,
            revisit_date = NULL,
            next_follow_up = clock_timestamp(),
            updated_at = clock_timestamp()
        WHERE id = v_lead.id;

        -- Record automated system reactivation in activity ledger
        INSERT INTO public.lead_activities (
            lead_id,
            actor_id,
            activity_type,
            description,
            metadata
        ) VALUES (
            v_lead.id,
            v_lead.assigned_to,
            'system_reactivation',
            format('Automated reactivation: On Hold milestone reached (Revisit Date: %s). Returned to active queue.', v_lead.revisit_date),
            jsonb_build_object(
                'previous_status', 'On Hold',
                'new_status', 'Contacted',
                'expired_revisit_date', v_lead.revisit_date,
                'reactivated_at', clock_timestamp()
            )
        );

        v_reactivated_count := v_reactivated_count + 1;
    END LOOP;

    RETURN v_reactivated_count;
END;
$$;
