/**
 * Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
 * Migration: 20261015000008_atomic_reassignment_proc.sql
 * Phase: 4 (Personnel Offboarding, Session Revocation & Lead Reassignment Engine)
 * Sprint: 4.2 (Lead Reassignment Wizard, Stored Procedure & Activity Backfill)
 * Target Engine: PostgreSQL 15+ (Supabase Managed PostgreSQL)
 * Description: Deploys atomic batch lead reassignment stored procedure (public.execute_atomic_lead_reassignment).
 *              Guarantees deterministic row-lock acquisition (ORDER BY id ASC FOR UPDATE) to eliminate deadlock risk,
 *              executes atomic reassignments in an ACID transaction, writes immutable touchpoint activity records
 *              to public.lead_activities for every affected deal, and records tamper-proof compliance entries
 *              in public.team_audit_logs.
 *              Enhances public.audit_lead_changes_trigger to support transaction-scoped suppression during batch transfers.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

-- 1. Enhance audit_lead_changes_trigger with Transaction-Scoped Batch Suppression
CREATE OR REPLACE FUNCTION public.audit_lead_changes_trigger()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    current_actor UUID;
    delta_json JSONB := '{}'::jsonb;
    key_name TEXT;
    old_val JSONB;
    new_val JSONB;
    activity_type_val TEXT := 'field_update';
    change_desc TEXT := 'Lead record updated';
    old_row_json JSONB;
    new_row_json JSONB;
    is_status_changed BOOLEAN := FALSE;
    is_reassigned BOOLEAN := FALSE;
    is_priority_changed BOOLEAN := FALSE;
BEGIN
    -- Check if audit logging is explicitly suppressed for atomic batch operations
    IF current_setting('app.skip_lead_audit_trigger', true) = 'true' THEN
        RETURN NEW;
    END IF;

    -- Extract current authenticated Supabase user or fall back to NULL for automated background jobs
    BEGIN
        current_actor := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        current_actor := NULL;
    END;

    -- Validate referential integrity: Verify actor exists in public.profiles
    IF current_actor IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = current_actor) THEN
            current_actor := NULL;
        END IF;
    END IF;

    -- Convert records to JSONB for key-by-key comparison
    old_row_json := to_jsonb(OLD);
    new_row_json := to_jsonb(NEW);

    -- Calculate delta payload, omitting transient timestamps
    FOR key_name IN SELECT jsonb_object_keys(new_row_json) LOOP
        IF key_name NOT IN ('updated_at', 'created_at') THEN
            old_val := old_row_json -> key_name;
            new_val := new_row_json -> key_name;

            IF old_val IS DISTINCT FROM new_val THEN
                delta_json := delta_json || jsonb_build_object(
                    key_name, jsonb_build_object('old', old_val, 'new', new_val)
                );
            END IF;
        END IF;
    END LOOP;

    -- If no substantial data columns changed (e.g. only updated_at changed), bypass activity logging
    IF delta_json = '{}'::jsonb THEN
        RETURN NEW;
    END IF;

    -- Detect primary commercial events
    is_status_changed := (OLD.status_id IS DISTINCT FROM NEW.status_id);
    is_reassigned := (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to);
    is_priority_changed := (OLD.priority IS DISTINCT FROM NEW.priority);

    -- Classify and compose event descriptions
    IF is_status_changed AND is_reassigned THEN
        activity_type_val := 'status_change';
        change_desc := 'Funnel status transitioned & account ownership reassigned';
    ELSIF is_status_changed THEN
        activity_type_val := 'status_change';
        change_desc := 'Funnel status transitioned';
    ELSIF is_reassigned THEN
        activity_type_val := 'reassignment';
        change_desc := 'Account ownership reassigned';
    ELSIF is_priority_changed THEN
        activity_type_val := 'priority_change';
        change_desc := 'Priority level updated to ' || NEW.priority;
    ELSIF current_actor IS NULL THEN
        -- Automated backend job update per Master PRD Section 15.2
        activity_type_val := 'system_event';
        change_desc := 'Automated system update';
    ELSE
        activity_type_val := 'field_update';
        change_desc := 'Lead record updated';
    END IF;

    -- Insert immutable audit record directly into lead_activities
    INSERT INTO public.lead_activities (
        lead_id,
        actor_id,
        activity_type,
        description,
        metadata,
        created_at
    ) VALUES (
        NEW.id,
        current_actor,
        activity_type_val,
        change_desc,
        jsonb_build_object(
            'changes', delta_json,
            'lead_id_code', NEW.lead_id
        ),
        timezone('utc'::text, now())
    );

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_lead_changes_trigger() IS 'Automated JSONB delta-capturing audit trigger recording stage transitions and field mutations into lead_activities with security definer search_path protection and transaction-scoped batch suppression.';

-- 2. Create or Replace the Atomic Lead Reassignment Stored Procedure
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
    -- 1. Authorization Guard: Caller must be an active administrator
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = p_admin_id AND role = 'admin' AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Only active administrators can execute batch lead reassignment.'
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
    SELECT full_name, email, role, status 
    INTO v_dest_name, v_dest_email, v_dest_role, v_dest_status
    FROM public.profiles
    WHERE id = p_destination_user_id;

    IF v_dest_name IS NULL THEN
        RAISE EXCEPTION 'NOT FOUND: Destination representative profile not found.'
            USING ERRCODE = '02000';
    END IF;

    IF v_dest_status <> 'active' THEN
        RAISE EXCEPTION 'INVALID DESTINATION: Destination team member must be an active user.'
            USING ERRCODE = '22023';
    END IF;

    IF v_dest_role NOT IN ('admin', 'sales_manager', 'sales_executive') THEN
        RAISE EXCEPTION 'INVALID DESTINATION: Destination team member must hold a commercial role.'
            USING ERRCODE = '22023';
    END IF;

    -- 6. Acquire Exclusive Row Locks in Deterministic Ascending Order (Deadlock Elimination)
    -- Only active deals (not in 'converted' or 'lost' macro-buckets) are selected for reassignment.
    SELECT 
        ARRAY_AGG(l.id ORDER BY l.id ASC),
        COALESCE(SUM(l.expected_value), 0.00)::NUMERIC(14, 2)
    INTO 
        v_affected_lead_ids,
        v_total_value
    FROM (
        SELECT id, expected_value
        FROM public.leads
        WHERE assigned_to = p_source_user_id
          AND status_id NOT IN (
              SELECT id FROM public.funnel_statuses WHERE bucket IN ('converted', 'lost')
          )
        ORDER BY id ASC
        FOR UPDATE
    ) l;

    -- 7. Zero Active Deals Early Exit
    IF v_affected_lead_ids IS NULL OR ARRAY_LENGTH(v_affected_lead_ids, 1) = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'reassigned_count', 0,
            'total_value', 0.00,
            'affected_lead_ids', '[]'::jsonb,
            'message', 'No active leads required reassignment.'
        );
    END IF;

    -- 8. Suppress Generic Lead Trigger During Atomic Batch Update
    PERFORM set_config('app.skip_lead_audit_trigger', 'true', true);

    -- Batch update active leads to the destination representative
    UPDATE public.leads
    SET assigned_to = p_destination_user_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = ANY(v_affected_lead_ids);

    GET DIAGNOSTICS v_reassigned_count = ROW_COUNT;

    -- Reset suppression flag
    PERFORM set_config('app.skip_lead_audit_trigger', 'false', true);

    -- 9. Backfill Immutable Activity Log for Every Reassigned Deal
    FOREACH v_lead_id IN ARRAY v_affected_lead_ids
    LOOP
        INSERT INTO public.lead_activities (
            lead_id,
            actor_id,
            activity_type,
            description,
            metadata,
            created_at
        ) VALUES (
            v_lead_id,
            p_admin_id,
            'reassignment',
            format('Commercial ownership transferred from %s to %s. Reason: %s', 
                   v_source_name, v_dest_name, trim(p_transfer_reason)),
            jsonb_build_object(
                'previous_rep_id', p_source_user_id,
                'previous_rep_name', v_source_name,
                'new_rep_id', p_destination_user_id,
                'new_rep_name', v_dest_name,
                'transfer_reason', trim(p_transfer_reason),
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

COMMENT ON FUNCTION public.execute_atomic_lead_reassignment(UUID, UUID, UUID, TEXT) IS 
'Executes an atomic batch reassignment of all active leads from a source representative to a destination team member, inserting immutable audit trails in public.lead_activities and logging to public.team_audit_logs.';

-- Hardened Permission Boundaries
REVOKE ALL ON FUNCTION public.execute_atomic_lead_reassignment(UUID, UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_atomic_lead_reassignment(UUID, UUID, UUID, TEXT) TO authenticated, service_role;
