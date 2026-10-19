-- Migration: 20261019000004_fix_client_works_auto_spawn_trigger.sql
-- Description: Hardens client works auto-spawn trigger to eliminate privilege escalation.
--              Sets creative_lead_id to NULL upon automatic instantiation.
--              Directorial assignment (Creative Lead, Technical Lead) must be explicitly
--              conducted by authorized administrators or sales managers.
-- Author: Fenar7 <86710532+Fenar7@users.noreply.github.com>

CREATE OR REPLACE FUNCTION public.auto_spawn_client_work_on_conversion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    target_bucket TEXT;
    existing_work_id UUID;
    default_scope TEXT;
    initial_milestones JSONB;
BEGIN
    -- Check if the lead status transitioned to converted
    SELECT bucket INTO target_bucket
    FROM public.funnel_statuses
    WHERE id = NEW.status_id;

    IF target_bucket = 'converted' THEN
        -- Verify no existing client_works project is mapped to this lead
        SELECT id INTO existing_work_id
        FROM public.client_works
        WHERE lead_id = NEW.id;

        IF existing_work_id IS NULL THEN
            default_scope := COALESCE(NEW.service_category, 'Digital Infrastructure & Brand Elevation');
            
            initial_milestones := jsonb_build_array(
                jsonb_build_object(
                    'id', 'm1',
                    'title', 'Executive Kickoff & Requirements Alignment',
                    'status', 'completed',
                    'completed_at', timezone('utc'::text, now())
                ),
                jsonb_build_object(
                    'id', 'm2',
                    'title', 'Brand Architecture & Design Systems Sprint',
                    'status', 'pending',
                    'completed_at', null
                ),
                jsonb_build_object(
                    'id', 'm3',
                    'title', 'Full-Stack Engineering & API Integration',
                    'status', 'pending',
                    'completed_at', null
                ),
                jsonb_build_object(
                    'id', 'm4',
                    'title', 'UAT, Performance Auditing & Penetration Testing',
                    'status', 'pending',
                    'completed_at', null
                ),
                jsonb_build_object(
                    'id', 'm5',
                    'title', 'Production Handover & SLA Sign-off',
                    'status', 'pending',
                    'completed_at', null
                )
            );

            -- Privilege Escalation Fix: creative_lead_id and tech_lead_id set to NULL.
            -- Explicit directorial assignment is required via assignClientWorkDirectorsAction.
            INSERT INTO public.client_works (
                lead_id,
                client_name,
                company,
                service_scope,
                contract_value,
                delivery_stage,
                health_status,
                creative_lead_id,
                tech_lead_id,
                milestones,
                kickoff_date,
                target_delivery_date
            ) VALUES (
                NEW.id,
                NEW.name,
                NEW.company,
                default_scope,
                COALESCE(NEW.expected_value, 0.00),
                'kickoff',
                'on_track',
                NULL,
                NULL,
                initial_milestones,
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '45 days'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_spawn_client_work_on_conversion() IS 'Instantiates client_works engagement with NULL directors, requiring explicit assignment by admin/sales_manager.';
