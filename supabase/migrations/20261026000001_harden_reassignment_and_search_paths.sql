/**
 * @file 20261026000001_harden_reassignment_and_search_paths.sql
 * @description Hardens stored procedure execution privileges, caller identity authorization,
 *              and search_path security definer bounds across the sales intelligence engine.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

-- ============================================================================
-- 1. Hardened execute_atomic_lead_reassignment with Caller Auth Verification
-- ============================================================================
CREATE OR REPLACE FUNCTION public.execute_atomic_lead_reassignment(
    p_source_user_id UUID,
    p_destination_user_id UUID,
    p_admin_id UUID,
    p_transfer_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_source_name TEXT;
    v_source_email TEXT;
    v_dest_name TEXT;
    v_dest_email TEXT;
    v_dest_role TEXT;
    v_dest_status TEXT;
    v_affected_lead_ids UUID[];
    v_total_value NUMERIC(14, 2) := 0.00;
    v_lead_id UUID;
    v_reassigned_count INT := 0;
BEGIN
    -- 1. Caller Authorization Guard: Enforce caller identity matches admin parameter or caller is active admin
    IF auth.uid() IS NULL OR (auth.uid() != p_admin_id AND NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )) THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Invoking user is not authorized to execute administrative reassignment.'
            USING ERRCODE = '42501';
    END IF;

    -- Target Admin Profile Verification
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = p_admin_id AND role = 'admin' AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Target administrator profile not found or inactive.'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Input Integrity: Validate transfer reason length
    IF p_transfer_reason IS NULL OR length(trim(p_transfer_reason)) < 5 THEN
        RAISE EXCEPTION 'INVALID PARAMETER: A descriptive transfer reason of at least 5 characters is required for regulatory audit trail compliance.'
            USING ERRCODE = '22023';
    END IF;

    -- 3. Invariant Guard: Source and Destination cannot be identical
    IF p_source_user_id = p_destination_user_id THEN
        RAISE EXCEPTION 'INVALID REASSIGNMENT: Source and destination representatives cannot be identical.'
            USING ERRCODE = '22023';
    END IF;

    -- 4. Retrieve and Validate Source Representative Profile
    SELECT full_name, email INTO v_source_name, v_source_email
    FROM public.profiles
    WHERE id = p_source_user_id;

    IF v_source_name IS NULL THEN
        RAISE EXCEPTION 'NOT FOUND: Source representative profile not found.'
            USING ERRCODE = '02000';
    END IF;

    -- 5. Retrieve and Validate Destination Representative Profile
    SELECT full_name, email, role, status INTO v_dest_name, v_dest_email, v_dest_role, v_dest_status
    FROM public.profiles
    WHERE id = p_destination_user_id;

    IF v_dest_name IS NULL THEN
        RAISE EXCEPTION 'NOT FOUND: Destination representative profile not found.'
            USING ERRCODE = '02000';
    END IF;

    IF v_dest_status != 'active' THEN
        RAISE EXCEPTION 'INVALID STATUS: Destination representative is not in an active status (current: %).' , v_dest_status
            USING ERRCODE = '22023';
    END IF;

    -- 6. Collect Reassignable Leads
    SELECT COALESCE(array_agg(l.id), ARRAY[]::UUID[])
    INTO v_affected_lead_ids
    FROM public.leads l
    JOIN public.funnel_statuses fs ON fs.id = l.status_id
    WHERE l.assigned_to = p_source_user_id
      AND fs.bucket != 'converted';

    v_reassigned_count := COALESCE(array_length(v_affected_lead_ids, 1), 0);

    -- 7. Early return if source representative has 0 active deals
    IF v_reassigned_count = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'reassigned_count', 0,
            'total_value', 0.00,
            'affected_lead_ids', '[]'::jsonb,
            'source_user_id', p_source_user_id,
            'destination_user_id', p_destination_user_id,
            'message', 'No active, un-converted leads found for reassignment.'
        );
    END IF;

    -- 8. Compute Aggregate Reassigned Pipeline Value
    SELECT COALESCE(SUM(estimated_value), 0.00)
    INTO v_total_value
    FROM public.leads
    WHERE id = ANY(v_affected_lead_ids);

    -- 9. Reassign Leads to Destination Representative
    UPDATE public.leads
    SET assigned_to = p_destination_user_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = ANY(v_affected_lead_ids);

    -- Record Activity Logs for Each Reassigned Lead
    FOREACH v_lead_id IN ARRAY v_affected_lead_ids
    LOOP
        INSERT INTO public.lead_activities (
            lead_id,
            user_id,
            activity_type,
            details,
            created_at
        ) VALUES (
            v_lead_id,
            p_admin_id,
            'reassigned',
            jsonb_build_object(
                'previous_owner_id', p_source_user_id,
                'previous_owner_name', v_source_name,
                'new_owner_id', p_destination_user_id,
                'new_owner_name', v_dest_name,
                'reason', trim(p_transfer_reason),
                'admin_id', p_admin_id
            ),
            timezone('utc'::text, now())
        );
    END LOOP;

    -- 10. Record Tamper-Proof Audit Event in Team Audit Logs
    INSERT INTO public.team_audit_logs (
        actor_id,
        action,
        target_user_email,
        details,
        created_at
    ) VALUES (
        p_admin_id,
        'leads_bulk_reassigned',
        v_source_email,
        jsonb_build_object(
            'source_user_id', p_source_user_id,
            'source_user_name', v_source_name,
            'source_user_email', v_source_email,
            'destination_user_id', p_destination_user_id,
            'destination_user_name', v_dest_name,
            'destination_user_email', v_dest_email,
            'reassigned_count', v_reassigned_count,
            'total_value', v_total_value,
            'lead_ids', v_affected_lead_ids,
            'reason', trim(p_transfer_reason)
        ),
        timezone('utc'::text, now())
    );

    -- 11. Return Enriched Operation Summary
    RETURN jsonb_build_object(
        'success', true,
        'reassigned_count', v_reassigned_count,
        'total_value', v_total_value,
        'affected_lead_ids', to_jsonb(v_affected_lead_ids),
        'source_user_id', p_source_user_id,
        'destination_user_id', p_destination_user_id,
        'message', format('Successfully reassigned %s active deal(s) valued at %s.', v_reassigned_count, v_total_value)
    );
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth, pg_temp;

REVOKE ALL ON FUNCTION public.execute_atomic_lead_reassignment(UUID, UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_atomic_lead_reassignment(UUID, UUID, UUID, TEXT) TO authenticated, service_role;

-- ============================================================================
-- 2. Restrict reactivate_expired_on_hold_leads to Service Role
-- ============================================================================
REVOKE ALL ON FUNCTION public.reactivate_expired_on_hold_leads() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_expired_on_hold_leads() TO service_role;

-- ============================================================================
-- 3. Harden validate_on_hold_revisit search_path
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_on_hold_revisit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_status_name TEXT;
BEGIN
    SELECT name INTO v_status_name
    FROM public.funnel_statuses
    WHERE id = NEW.status_id;

    IF v_status_name = 'On Hold' THEN
        IF NEW.revisit_date IS NULL THEN
            RAISE EXCEPTION 'On Hold leads require a mandatory future revisit_date.'
                USING ERRCODE = '23514';
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

-- ============================================================================
-- 4. Harden auto_spawn_client_work_on_conversion search_path
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_spawn_client_work_on_conversion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    target_bucket TEXT;
    existing_work_id UUID;
    default_scope TEXT;
    initial_milestones JSONB;
BEGIN
    SELECT bucket INTO target_bucket
    FROM public.funnel_statuses
    WHERE id = NEW.status_id;

    IF target_bucket = 'converted' THEN
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
                    'title', 'Production Go-Live & Handover',
                    'status', 'pending',
                    'completed_at', null
                )
            );

            INSERT INTO public.client_works (
                lead_id,
                project_name,
                scope_narrative,
                creative_lead_id,
                technical_lead_id,
                start_date,
                target_completion_date,
                current_milestones
            ) VALUES (
                NEW.id,
                NEW.company_name || ' — Platform Engineering',
                default_scope,
                NULL,
                NULL,
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '90 days',
                initial_milestones
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;
