-- Migration: 20261125120000_fix_conversion_trigger_and_rls.sql
-- Description:
--   1. Repairs public.auto_spawn_client_work_on_conversion() to match the canonical
--      public.client_works schema and idempotently backfills existing Won deals.
--   2. Repairs public.execute_atomic_lead_reassignment() to use expected_value,
--      actor_id, description, metadata, and activity_type = 'reassignment'.
--   3. Adds trg_a_clear_revisit_date_on_exit BEFORE UPDATE trigger so revisit_date
--      is cleared automatically when a lead moves out of 'On Hold'.
--   4. Hardens audit_lead_changes_trigger() with app.skip_audit_trigger session opt-out
--      and applies opt-out in batch/follow-up RPCs that insert rich ledger events.
--   5. Enforces strict caller authentication, sales_executive portfolio sandboxing,
--      can_view_financials monetary masking, new_status_name attribution, and exact
--      REVOKE/GRANT EXECUTE signatures on all 5 Analytics RPCs.
-- Author: Fenar7 <86710532+Fenar7@users.noreply.github.com>

-- ============================================================================
-- 1. Repair auto_spawn_client_work_on_conversion() + Idempotent Backfill
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_spawn_client_work_on_conversion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_bucket TEXT;
    default_scope TEXT;
    initial_milestones JSONB;
BEGIN
    SELECT bucket INTO target_bucket
    FROM public.funnel_statuses
    WHERE id = NEW.status_id;

    IF target_bucket = 'converted' OR NEW.converted_at IS NOT NULL THEN
        default_scope := COALESCE(NULLIF(TRIM(NEW.service_category), ''), 'Digital Infrastructure & Brand Elevation');

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
                'title', 'UAT, Performance Auditing & Security Review',
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

        -- Directors remain NULL on auto-spawn and must be explicitly assigned
        -- by an Administrator or Sales Manager via assignClientWorkDirectorsAction.
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
        )
        ON CONFLICT (lead_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_spawn_client_work ON public.leads;
CREATE TRIGGER trg_auto_spawn_client_work
    AFTER INSERT OR UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_spawn_client_work_on_conversion();

-- Idempotent backfill for previously converted deals lacking a client_works row
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
)
SELECT
    l.id,
    l.name,
    l.company,
    COALESCE(NULLIF(TRIM(l.service_category), ''), 'Digital Infrastructure & Brand Elevation'),
    COALESCE(l.expected_value, 0.00),
    'kickoff',
    'on_track',
    NULL,
    NULL,
    jsonb_build_array(
        jsonb_build_object('id', 'm1', 'title', 'Executive Kickoff & Requirements Alignment', 'status', 'completed', 'completed_at', COALESCE(l.converted_at, timezone('utc'::text, now()))),
        jsonb_build_object('id', 'm2', 'title', 'Brand Architecture & Design Systems Sprint', 'status', 'pending', 'completed_at', null),
        jsonb_build_object('id', 'm3', 'title', 'Full-Stack Engineering & API Integration', 'status', 'pending', 'completed_at', null),
        jsonb_build_object('id', 'm4', 'title', 'UAT, Performance Auditing & Security Review', 'status', 'pending', 'completed_at', null),
        jsonb_build_object('id', 'm5', 'title', 'Production Handover & SLA Sign-off', 'status', 'pending', 'completed_at', null)
    ),
    COALESCE(l.converted_at::date, CURRENT_DATE),
    COALESCE(l.converted_at::date, CURRENT_DATE) + INTERVAL '45 days'
FROM public.leads l
JOIN public.funnel_statuses fs ON fs.id = l.status_id
WHERE (fs.bucket = 'converted' OR l.converted_at IS NOT NULL)
  AND NOT EXISTS (
      SELECT 1 FROM public.client_works cw WHERE cw.lead_id = l.id
  )
ON CONFLICT (lead_id) DO NOTHING;

-- ============================================================================
-- 2. Repair execute_atomic_lead_reassignment (schema columns & search_path)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.execute_atomic_lead_reassignment(
    p_source_user_id UUID,
    p_destination_user_id UUID,
    p_admin_id UUID,
    p_transfer_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
    IF auth.uid() IS NULL OR (auth.uid() != p_admin_id AND NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )) THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Invoking user is not authorized to execute administrative reassignment.'
            USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_admin_id AND role = 'admin' AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Target administrator profile not found or inactive.'
            USING ERRCODE = '42501';
    END IF;

    IF p_transfer_reason IS NULL OR length(trim(p_transfer_reason)) < 5 THEN
        RAISE EXCEPTION 'INVALID PARAMETER: A descriptive transfer reason of at least 5 characters is required for regulatory audit trail compliance.'
            USING ERRCODE = '22023';
    END IF;

    IF p_source_user_id = p_destination_user_id THEN
        RAISE EXCEPTION 'INVALID REASSIGNMENT: Source and destination representatives cannot be identical.'
            USING ERRCODE = '22023';
    END IF;

    SELECT full_name, email INTO v_source_name, v_source_email
    FROM public.profiles
    WHERE id = p_source_user_id;

    IF v_source_name IS NULL THEN
        RAISE EXCEPTION 'NOT FOUND: Source representative profile not found.'
            USING ERRCODE = '02000';
    END IF;

    SELECT full_name, email, role, status INTO v_dest_name, v_dest_email, v_dest_role, v_dest_status
    FROM public.profiles
    WHERE id = p_destination_user_id;

    IF v_dest_name IS NULL THEN
        RAISE EXCEPTION 'NOT FOUND: Destination representative profile not found.'
            USING ERRCODE = '02000';
    END IF;

    IF v_dest_status != 'active' THEN
        RAISE EXCEPTION 'INVALID STATUS: Destination representative is not in an active status (current: %).', v_dest_status
            USING ERRCODE = '22023';
    END IF;

    IF v_dest_role NOT IN ('admin', 'sales_manager', 'sales_executive') THEN
        RAISE EXCEPTION 'INVALID ROLE: Destination user must hold an active commercial role (current: %).', v_dest_role
            USING ERRCODE = '22023';
    END IF;

    SELECT COALESCE(array_agg(locked.id ORDER BY locked.id ASC), ARRAY[]::UUID[])
    INTO v_affected_lead_ids
    FROM (
        SELECT l.id
        FROM public.leads l
        JOIN public.funnel_statuses fs ON fs.id = l.status_id
        WHERE l.assigned_to = p_source_user_id
          AND fs.bucket NOT IN ('converted', 'lost')
        ORDER BY l.id ASC
        FOR UPDATE OF l
    ) locked;

    v_reassigned_count := COALESCE(array_length(v_affected_lead_ids, 1), 0);

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

    SELECT COALESCE(SUM(expected_value), 0.00)
    INTO v_total_value
    FROM public.leads
    WHERE id = ANY(v_affected_lead_ids);

    PERFORM set_config('app.skip_audit_trigger', 'true', true);

    UPDATE public.leads
    SET assigned_to = p_destination_user_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = ANY(v_affected_lead_ids);

    PERFORM set_config('app.skip_audit_trigger', 'false', true);

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
            'Deal reassigned from ' || v_source_name || ' to ' || v_dest_name || '. Reason: ' || trim(p_transfer_reason),
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
            'destination_user_id', p_destination_user_id,
            'destination_user_name', v_dest_name,
            'destination_user_email', v_dest_email,
            'reassigned_count', v_reassigned_count,
            'total_pipeline_value', v_total_value,
            'affected_lead_ids', v_affected_lead_ids,
            'transfer_reason', trim(p_transfer_reason)
        ),
        timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', true,
        'reassigned_count', v_reassigned_count,
        'total_value', v_total_value,
        'affected_lead_ids', to_jsonb(v_affected_lead_ids),
        'source_user_id', p_source_user_id,
        'destination_user_id', p_destination_user_id,
        'message', format('Successfully reassigned %s active deals from %s to %s.', v_reassigned_count, v_source_name, v_dest_name)
    );
END;
$$;

-- ============================================================================
-- 3. Auto-Clear revisit_date When Transitioning Out of 'On Hold'
-- ============================================================================
CREATE OR REPLACE FUNCTION public.clear_revisit_date_on_stage_exit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_target_name TEXT;
BEGIN
    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
        SELECT name INTO v_target_name
        FROM public.funnel_statuses
        WHERE id = NEW.status_id;

        IF COALESCE(v_target_name, '') <> 'On Hold' THEN
            NEW.revisit_date := NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Named alphabetically before trg_validate_on_hold_revisit so exit cleanup runs first.
DROP TRIGGER IF EXISTS trg_a_clear_revisit_date_on_exit ON public.leads;
CREATE TRIGGER trg_a_clear_revisit_date_on_exit
    BEFORE UPDATE OF status_id ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.clear_revisit_date_on_stage_exit();

-- ============================================================================
-- 4. Deduplicate audit_lead_changes_trigger + Hardened RPC Opt-Out
-- ============================================================================
CREATE OR REPLACE FUNCTION public.audit_lead_changes_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_actor_id UUID;
    delta_json JSONB := '{}'::jsonb;
    desc_parts TEXT[] := ARRAY[]::TEXT[];
    old_status_name TEXT;
    new_status_name TEXT;
    v_activity_type TEXT := 'field_update';
BEGIN
    IF COALESCE(current_setting('app.skip_audit_trigger', true), '') = 'true' THEN
        RETURN NEW;
    END IF;

    BEGIN
        current_actor_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        current_actor_id := NULL;
    END;

    IF current_actor_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = current_actor_id) THEN
            current_actor_id := NULL;
        END IF;
    END IF;

    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
        SELECT name INTO old_status_name FROM public.funnel_statuses WHERE id = OLD.status_id;
        SELECT name INTO new_status_name FROM public.funnel_statuses WHERE id = NEW.status_id;

        delta_json := delta_json || jsonb_build_object(
            'status_id', jsonb_build_object(
                'old', OLD.status_id, 'new', NEW.status_id,
                'old_name', COALESCE(old_status_name, 'Unknown'),
                'new_name', COALESCE(new_status_name, 'Unknown')
            ),
            'new_status_name', COALESCE(new_status_name, 'Unknown')
        );
        desc_parts := array_append(desc_parts, format('Stage changed from "%s" to "%s"', COALESCE(old_status_name, 'Unknown'), COALESCE(new_status_name, 'Unknown')));
    END IF;

    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
        delta_json := delta_json || jsonb_build_object('assigned_to', jsonb_build_object('old', OLD.assigned_to, 'new', NEW.assigned_to));
        desc_parts := array_append(desc_parts, 'Assigned agent reassigned');
    END IF;

    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        delta_json := delta_json || jsonb_build_object('priority', jsonb_build_object('old', OLD.priority, 'new', NEW.priority));
        desc_parts := array_append(desc_parts, format('Priority updated from "%s" to "%s"', OLD.priority, NEW.priority));
    END IF;

    IF OLD.expected_value IS DISTINCT FROM NEW.expected_value THEN
        delta_json := delta_json || jsonb_build_object('expected_value', jsonb_build_object('old', OLD.expected_value, 'new', NEW.expected_value));
        desc_parts := array_append(desc_parts, 'Expected valuation updated');
    END IF;

    IF OLD.budget_bracket IS DISTINCT FROM NEW.budget_bracket THEN
        delta_json := delta_json || jsonb_build_object('budget_bracket', jsonb_build_object('old', OLD.budget_bracket, 'new', NEW.budget_bracket));
        desc_parts := array_append(desc_parts, 'Budget bracket updated');
    END IF;

    IF OLD.service_category IS DISTINCT FROM NEW.service_category THEN
        delta_json := delta_json || jsonb_build_object('service_category', jsonb_build_object('old', OLD.service_category, 'new', NEW.service_category));
        desc_parts := array_append(desc_parts, 'Service practice updated');
    END IF;

    IF OLD.name IS DISTINCT FROM NEW.name THEN
        delta_json := delta_json || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
        desc_parts := array_append(desc_parts, 'Contact name updated');
    END IF;

    IF OLD.company IS DISTINCT FROM NEW.company THEN
        delta_json := delta_json || jsonb_build_object('company', jsonb_build_object('old', OLD.company, 'new', NEW.company));
        desc_parts := array_append(desc_parts, 'Company updated');
    END IF;

    IF OLD.email IS DISTINCT FROM NEW.email THEN
        delta_json := delta_json || jsonb_build_object('email', jsonb_build_object('old', OLD.email, 'new', NEW.email));
        desc_parts := array_append(desc_parts, 'Email updated');
    END IF;

    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
        delta_json := delta_json || jsonb_build_object('phone', jsonb_build_object('old', OLD.phone, 'new', NEW.phone));
        desc_parts := array_append(desc_parts, 'Phone updated');
    END IF;

    IF OLD.next_follow_up IS DISTINCT FROM NEW.next_follow_up THEN
        delta_json := delta_json || jsonb_build_object('next_follow_up', jsonb_build_object('old', OLD.next_follow_up, 'new', NEW.next_follow_up));
        desc_parts := array_append(desc_parts, 'Next follow-up milestone updated');
    END IF;

    IF OLD.revisit_date IS DISTINCT FROM NEW.revisit_date THEN
        delta_json := delta_json || jsonb_build_object('revisit_date', jsonb_build_object('old', OLD.revisit_date, 'new', NEW.revisit_date));
        desc_parts := array_append(desc_parts, 'On-Hold revisit date adjusted');
    END IF;

    IF OLD.lost_reason IS DISTINCT FROM NEW.lost_reason THEN
        delta_json := delta_json || jsonb_build_object('lost_reason', jsonb_build_object('old', OLD.lost_reason, 'new', NEW.lost_reason));
        desc_parts := array_append(desc_parts, 'Lost reason recorded');
    END IF;

    IF OLD.converted_at IS DISTINCT FROM NEW.converted_at THEN
        delta_json := delta_json || jsonb_build_object('converted_at', jsonb_build_object('old', OLD.converted_at, 'new', NEW.converted_at));
        desc_parts := array_append(desc_parts, 'Conversion lock timestamp updated');
    END IF;

    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
        delta_json := delta_json || jsonb_build_object('notes', jsonb_build_object('old_length', COALESCE(length(OLD.notes), 0), 'new_length', COALESCE(length(NEW.notes), 0)));
        desc_parts := array_append(desc_parts, 'Case notes updated');
    END IF;

    IF delta_json = '{}'::jsonb THEN
        RETURN NEW;
    END IF;

    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
        v_activity_type := 'status_change';
    ELSIF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
        v_activity_type := 'reassignment';
    ELSIF OLD.priority IS DISTINCT FROM NEW.priority THEN
        v_activity_type := 'priority_change';
    ELSIF current_actor_id IS NULL THEN
        v_activity_type := 'system_event';
    ELSE
        v_activity_type := 'field_update';
    END IF;

    INSERT INTO public.lead_activities (
        lead_id,
        actor_id,
        activity_type,
        description,
        metadata,
        created_at
    ) VALUES (
        NEW.id,
        current_actor_id,
        v_activity_type,
        array_to_string(desc_parts, '; '),
        jsonb_build_object(
            'auto_audit', true,
            'changes', delta_json,
            'deltas', delta_json,
            'lead_id_code', NEW.lead_id,
            'new_status_name', COALESCE(new_status_name, NULL)
        ),
        timezone('utc'::text, now())
    );

    RETURN NEW;
END;
$$;

-- Apply app.skip_audit_trigger in batch/follow-up/on-hold RPCs to eliminate duplicate activity entries
CREATE OR REPLACE FUNCTION public.batch_update_lead_status(
  p_lead_ids uuid[],
  p_status_id uuid,
  p_actor_id uuid,
  p_lost_reason text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_role text;
  v_actor_name text;
  v_target_stage record;
  v_affected_count integer := 0;
  v_lead record;
  v_sanitized_note text := TRIM(COALESCE(p_note, ''));
  v_sanitized_lost text := NULLIF(TRIM(COALESCE(p_lost_reason, '')), '');
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_actor_id THEN
    RAISE EXCEPTION 'Caller identity mismatch.' USING ERRCODE = '42501';
  END IF;

  SELECT role, full_name INTO v_actor_role, v_actor_name
  FROM public.profiles
  WHERE id = p_actor_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caller identity not found or suspended.' USING ERRCODE = '42501';
  END IF;

  IF v_actor_role = 'viewer' THEN
    RAISE EXCEPTION 'Privilege Violation: Read-only accounts cannot modify deal status.' USING ERRCODE = '42501';
  END IF;

  IF length(v_sanitized_note) > 2000 OR v_sanitized_note ~ '[<>]' OR regexp_replace(v_sanitized_note, E'[\n\r\t]', '', 'g') ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'Invalid transition note parameters.' USING ERRCODE = '22023';
  END IF;

  IF v_sanitized_lost IS NOT NULL AND (length(v_sanitized_lost) > 500 OR v_sanitized_lost ~ '[<>]' OR regexp_replace(v_sanitized_lost, E'[\n\r\t]', '', 'g') ~ '[[:cntrl:]]') THEN
    RAISE EXCEPTION 'Invalid lost reason parameters.' USING ERRCODE = '22023';
  END IF;

  SELECT id, name, bucket INTO v_target_stage
  FROM public.funnel_statuses
  WHERE id = p_status_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target funnel status not found or inactive.' USING ERRCODE = '02000';
  END IF;

  IF v_target_stage.bucket = 'converted' THEN
    RAISE EXCEPTION 'Guarded conversion requires the dedicated atomic conversion workflow.' USING ERRCODE = '22023';
  END IF;

  FOR v_lead IN
    SELECT l.id, l.status_id, l.assigned_to, l.converted_at, fs.name AS current_stage_name
    FROM public.leads l
    JOIN public.funnel_statuses fs ON fs.id = l.status_id
    WHERE l.id = ANY(p_lead_ids)
    ORDER BY l.id ASC
    FOR UPDATE OF l
  LOOP
    IF v_actor_role = 'sales_executive' AND v_lead.assigned_to != p_actor_id THEN
      RAISE EXCEPTION 'Privilege Violation: Sales executives may only update deals assigned to their portfolio. Deal ID: %', v_lead.id USING ERRCODE = '42501';
    END IF;

    IF v_lead.converted_at IS NOT NULL AND v_actor_role != 'admin' THEN
      RAISE EXCEPTION 'Forbidden: Converted deals are locked from non-administrative modification. Deal ID: %', v_lead.id USING ERRCODE = '42501';
    END IF;

    PERFORM set_config('app.skip_audit_trigger', 'true', true);

    UPDATE public.leads
    SET
      status_id = p_status_id,
      converted_at = CASE
        WHEN v_target_stage.bucket != 'converted' THEN NULL
        ELSE converted_at
      END,
      lost_reason = CASE
        WHEN v_target_stage.bucket = 'lost' THEN v_sanitized_lost
        ELSE NULL
      END,
      updated_at = NOW()
    WHERE id = v_lead.id;

    PERFORM set_config('app.skip_audit_trigger', 'false', true);

    INSERT INTO public.lead_activities (
      lead_id, actor_id, activity_type, description, metadata, created_at
    ) VALUES (
      v_lead.id,
      p_actor_id,
      'status_change',
      'Batch updated stage from ' || v_lead.current_stage_name || ' to ' || v_target_stage.name || ' by ' || v_actor_name ||
        CASE WHEN v_sanitized_note != '' THEN '. Note: ' || v_sanitized_note ELSE '' END,
      jsonb_build_object(
        'batch_mutation', true,
        'old_stage', v_lead.current_stage_name,
        'new_stage', v_target_stage.name,
        'new_status_name', v_target_stage.name,
        'new_status_id', p_status_id,
        'lost_reason', v_sanitized_lost
      ),
      NOW()
    );

    v_affected_count := v_affected_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'affected_count', v_affected_count,
    'target_status_name', v_target_stage.name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.batch_reassign_leads(
  p_lead_ids uuid[],
  p_destination_user_id uuid,
  p_actor_id uuid,
  p_transfer_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_role text;
  v_actor_name text;
  v_dest_role text;
  v_dest_name text;
  v_dest_status text;
  v_affected_count integer := 0;
  v_lead record;
  v_sanitized_reason text := TRIM(COALESCE(p_transfer_reason, ''));
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_actor_id THEN
    RAISE EXCEPTION 'Caller identity mismatch.' USING ERRCODE = '42501';
  END IF;

  SELECT role, full_name INTO v_actor_role, v_actor_name
  FROM public.profiles
  WHERE id = p_actor_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caller identity not found or suspended.' USING ERRCODE = '42501';
  END IF;

  IF v_actor_role NOT IN ('admin', 'sales_manager') THEN
    RAISE EXCEPTION 'Privilege Violation: Only administrators and sales managers can reassign leads.' USING ERRCODE = '42501';
  END IF;

  IF length(v_sanitized_reason) < 5 OR length(v_sanitized_reason) > 1000 OR v_sanitized_reason ~ '[<>]' OR regexp_replace(v_sanitized_reason, E'[\n\r\t]', '', 'g') ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'Invalid transfer reason supplied.' USING ERRCODE = '22023';
  END IF;

  SELECT role, full_name, status INTO v_dest_role, v_dest_name, v_dest_status
  FROM public.profiles
  WHERE id = p_destination_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination user not found.' USING ERRCODE = '02000';
  END IF;

  IF v_dest_status != 'active' THEN
    RAISE EXCEPTION 'Destination representative is currently suspended.' USING ERRCODE = '22023';
  END IF;

  IF v_dest_role NOT IN ('admin', 'sales_manager', 'sales_executive') THEN
    RAISE EXCEPTION 'Destination user must hold an active commercial role.' USING ERRCODE = '22023';
  END IF;

  FOR v_lead IN
    SELECT l.id, l.name, l.assigned_to, l.converted_at
    FROM public.leads l
    WHERE l.id = ANY(p_lead_ids)
    ORDER BY l.id ASC
    FOR UPDATE OF l
  LOOP
    IF v_lead.converted_at IS NOT NULL AND v_actor_role != 'admin' THEN
      RAISE EXCEPTION 'Forbidden: Converted deals cannot be reassigned by non-administrators. Deal ID: %', v_lead.id USING ERRCODE = '42501';
    END IF;

    PERFORM set_config('app.skip_audit_trigger', 'true', true);

    UPDATE public.leads
    SET
      assigned_to = p_destination_user_id,
      updated_at = NOW()
    WHERE id = v_lead.id;

    PERFORM set_config('app.skip_audit_trigger', 'false', true);

    INSERT INTO public.lead_activities (
      lead_id, actor_id, activity_type, description, metadata, created_at
    ) VALUES (
      v_lead.id,
      p_actor_id,
      'reassignment',
      'Lead reassigned to ' || v_dest_name || ' by ' || v_actor_name || '. Reason: ' || v_sanitized_reason,
      jsonb_build_object(
        'batch_mutation', true,
        'previous_assigned_to', v_lead.assigned_to,
        'new_assigned_to', p_destination_user_id,
        'transfer_reason', v_sanitized_reason
      ),
      NOW()
    );

    v_affected_count := v_affected_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'affected_count', v_affected_count,
    'destination_user_name', v_dest_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_lead_follow_up(
  p_lead_id uuid,
  p_expected_follow_up timestamptz,
  p_note text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_name text;
  caller_role text;
  caller_status text;
  target_assigned uuid;
  target_converted timestamptz;
  updated_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized to complete follow-ups' USING ERRCODE = '42501';
  END IF;

  SELECT role, status, full_name INTO caller_role, caller_status, caller_name
  FROM public.profiles
  WHERE id = caller_id;

  IF caller_status IS DISTINCT FROM 'active' OR COALESCE(caller_role, '') NOT IN ('admin', 'sales_manager', 'sales_executive') THEN
    RAISE EXCEPTION 'Not authorized to complete follow-ups' USING ERRCODE = '42501';
  END IF;

  IF p_expected_follow_up IS NULL OR (p_note IS NOT NULL AND (length(p_note) > 2000 OR p_note ~ '[<>]' OR regexp_replace(p_note, E'[\n\r\t]', '', 'g') ~ '[[:cntrl:]]')) THEN
    RAISE EXCEPTION 'Invalid follow-up note' USING ERRCODE = '22023';
  END IF;

  SELECT assigned_to, converted_at INTO target_assigned, target_converted
  FROM public.leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF caller_role = 'sales_executive' AND target_assigned IS DISTINCT FROM caller_id THEN
    RAISE EXCEPTION 'Privilege Violation: Sales executives may only complete follow-ups on assigned leads.' USING ERRCODE = '42501';
  END IF;

  IF target_converted IS NOT NULL AND caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Converted deals cannot be modified by non-administrators.' USING ERRCODE = '42501';
  END IF;

  PERFORM set_config('app.skip_audit_trigger', 'true', true);

  UPDATE public.leads SET next_follow_up = NULL, updated_at = timezone('utc'::text, now())
    WHERE id = p_lead_id AND next_follow_up = p_expected_follow_up
    RETURNING id INTO updated_id;

  PERFORM set_config('app.skip_audit_trigger', 'false', true);

  IF updated_id IS NULL THEN RETURN false; END IF;

  INSERT INTO public.lead_activities (lead_id, actor_id, activity_type, description, metadata)
  VALUES (updated_id, caller_id, 'note_added',
    'Scheduled follow-up marked as completed by ' || COALESCE(caller_name, 'team member') || '.' ||
      CASE WHEN p_note IS NOT NULL AND p_note <> '' THEN ' Note: ' || p_note ELSE '' END,
    jsonb_build_object('cleared_follow_up', true, 'note', p_note));
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.reactivate_expired_on_hold_leads()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_reactivated_count INTEGER := 0;
    v_on_hold_id UUID;
    v_contacted_id UUID;
    v_lead RECORD;
BEGIN
    IF auth.role() <> 'service_role' AND COALESCE(public.current_user_role(), '') NOT IN ('admin', 'sales_manager') THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Invoking caller cannot execute batch lead reactivation.' USING ERRCODE = '42501';
    END IF;

    SELECT id INTO v_on_hold_id FROM public.funnel_statuses WHERE name = 'On Hold';
    SELECT id INTO v_contacted_id FROM public.funnel_statuses WHERE name = 'Contacted';

    IF v_on_hold_id IS NULL OR v_contacted_id IS NULL THEN
        RETURN 0;
    END IF;

    FOR v_lead IN
        SELECT id, name, company, assigned_to, revisit_date
        FROM public.leads
        WHERE status_id = v_on_hold_id
          AND revisit_date <= CURRENT_DATE
          AND converted_at IS NULL
        ORDER BY id ASC
        FOR UPDATE
    LOOP
        PERFORM set_config('app.skip_audit_trigger', 'true', true);

        UPDATE public.leads
        SET status_id = v_contacted_id,
            revisit_date = NULL,
            next_follow_up = clock_timestamp(),
            updated_at = clock_timestamp()
        WHERE id = v_lead.id;

        PERFORM set_config('app.skip_audit_trigger', 'false', true);

        INSERT INTO public.lead_activities (
            lead_id,
            actor_id,
            activity_type,
            description,
            metadata
        ) VALUES (
            v_lead.id,
            v_lead.assigned_to,
            'system_event',
            format('Automated reactivation: On Hold milestone reached (Revisit Date: %s). Returned to active queue.', v_lead.revisit_date),
            jsonb_build_object(
                'event_type', 'system_reactivation',
                'previous_status', 'On Hold',
                'new_status', 'Contacted',
                'new_status_name', 'Contacted',
                'expired_revisit_date', v_lead.revisit_date,
                'reactivated_at', clock_timestamp()
            )
        );

        v_reactivated_count := v_reactivated_count + 1;
    END LOOP;

    RETURN v_reactivated_count;
END;
$$;

-- ============================================================================
-- 5. Hardened Analytics RPCs (Auth + Role Scoping + Monetary Gating + Exact Schema Contracts)
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_funnel_conversion_dropoff(timestamptz, timestamptz, uuid, uuid);
CREATE FUNCTION public.get_funnel_conversion_dropoff(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_assignee_id uuid DEFAULT NULL,
  p_source_id uuid DEFAULT NULL
)
RETURNS TABLE (
  stage_id uuid,
  stage_name text,
  stage_order integer,
  color_code text,
  deals_reached bigint,
  conversion_from_prev_pct numeric(5,2),
  overall_conversion_pct numeric(5,2),
  drop_off_count bigint,
  avg_time_in_stage_days numeric(6,1)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT := public.current_user_role();
  v_effective_assignee UUID;
  v_total_intake bigint;
BEGIN
  IF auth.uid() IS NULL OR v_role IS NULL OR v_role NOT IN ('admin', 'sales_manager', 'sales_executive', 'viewer') THEN
    RAISE EXCEPTION 'Unauthorized: Active CRM role required for funnel telemetry.' USING ERRCODE = '42501';
  END IF;

  v_effective_assignee := CASE WHEN v_role = 'sales_executive' THEN auth.uid() ELSE p_assignee_id END;

  SELECT COUNT(DISTINCT l.id)
  INTO v_total_intake
  FROM public.leads l
  WHERE (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
    AND (p_start_date IS NULL OR l.created_at >= p_start_date)
    AND (p_end_date IS NULL OR l.created_at <= p_end_date)
    AND (v_effective_assignee IS NULL OR l.assigned_to = v_effective_assignee)
    AND (p_source_id IS NULL OR l.lead_source_id = p_source_id);

  IF v_total_intake = 0 OR v_total_intake IS NULL THEN
    v_total_intake := 1;
  END IF;

  RETURN QUERY
  WITH ordered_stages AS (
    SELECT
      fs.id AS s_id,
      fs.name AS s_name,
      fs.sort_order AS s_order,
      fs.color_code AS s_color
    FROM public.funnel_statuses fs
    WHERE fs.is_active = true
      AND fs.bucket != 'lost'
    ORDER BY fs.sort_order ASC
  ),
  lead_historical_milestones AS (
    SELECT
      l.id AS lead_id,
      l.status_id AS current_status_id,
      GREATEST(
        COALESCE(MAX(fs_hist.sort_order), 0),
        CASE WHEN fs_curr.bucket != 'lost' THEN fs_curr.sort_order ELSE 0 END
      ) AS max_sort_order_reached
    FROM public.leads l
    JOIN public.funnel_statuses fs_curr ON fs_curr.id = l.status_id
    LEFT JOIN public.lead_activities la ON la.lead_id = l.id AND la.activity_type = 'status_change'
    LEFT JOIN public.funnel_statuses fs_hist
      ON fs_hist.name = COALESCE(la.metadata->>'new_status_name', la.metadata->>'new_stage')
      AND fs_hist.bucket != 'lost'
    WHERE (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
      AND (p_start_date IS NULL OR l.created_at >= p_start_date)
      AND (p_end_date IS NULL OR l.created_at <= p_end_date)
      AND (v_effective_assignee IS NULL OR l.assigned_to = v_effective_assignee)
      AND (p_source_id IS NULL OR l.lead_source_id = p_source_id)
    GROUP BY l.id, l.status_id, fs_curr.bucket, fs_curr.sort_order
  ),
  stage_counts AS (
    SELECT
      os.s_id,
      os.s_name,
      os.s_order,
      os.s_color,
      COUNT(lhm.lead_id) FILTER (WHERE lhm.current_status_id = os.s_id) AS currently_here,
      COUNT(lhm.lead_id) FILTER (WHERE lhm.max_sort_order_reached >= os.s_order) AS cumulative_reached
    FROM ordered_stages os
    LEFT JOIN lead_historical_milestones lhm ON true
    GROUP BY os.s_id, os.s_name, os.s_order, os.s_color
  ),
  funnel_with_lag AS (
    SELECT
      sc.s_id,
      sc.s_name,
      sc.s_order,
      sc.s_color,
      sc.currently_here,
      sc.cumulative_reached,
      LAG(sc.cumulative_reached) OVER (ORDER BY sc.s_order ASC) AS prev_stage_reached,
      LEAD(sc.cumulative_reached) OVER (ORDER BY sc.s_order ASC) AS next_stage_reached
    FROM stage_counts sc
  )
  SELECT
    f.s_id AS stage_id,
    f.s_name AS stage_name,
    f.s_order AS stage_order,
    f.s_color AS color_code,
    f.cumulative_reached AS deals_reached,
    ROUND((f.cumulative_reached::numeric / NULLIF(COALESCE(f.prev_stage_reached, f.cumulative_reached), 0)::numeric) * 100.0, 2) AS conversion_from_prev_pct,
    ROUND((f.cumulative_reached::numeric / v_total_intake::numeric) * 100.0, 2) AS overall_conversion_pct,
    GREATEST(0, f.cumulative_reached - COALESCE(f.next_stage_reached, f.currently_here)) AS drop_off_count,
    NULL::numeric(6,1) AS avg_time_in_stage_days
  FROM funnel_with_lag f
  ORDER BY f.s_order ASC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_stage_dwell_time_metrics(integer);
CREATE FUNCTION public.get_stage_dwell_time_metrics(
  p_lookback_days integer DEFAULT 180
)
RETURNS TABLE (
  stage_id uuid,
  stage_name text,
  sort_order integer,
  color_code text,
  deal_count bigint,
  avg_dwell_days numeric(6,1),
  median_dwell_days numeric(6,1),
  stalled_deals_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT := public.current_user_role();
  v_lookback integer := LEAST(GREATEST(COALESCE(p_lookback_days, 180), 1), 3650);
BEGIN
  IF auth.uid() IS NULL OR v_role IS NULL OR v_role NOT IN ('admin', 'sales_manager', 'sales_executive', 'viewer') THEN
    RAISE EXCEPTION 'Unauthorized: Active CRM role required for dwell telemetry.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH stage_events AS (
    SELECT
      l.id AS lead_id,
      fs_initial.id AS stage_id,
      fs_initial.name AS stage_name,
      fs_initial.sort_order,
      fs_initial.color_code,
      l.created_at AS entered_at
    FROM public.leads l
    JOIN (
      SELECT id, name, sort_order, color_code
      FROM public.funnel_statuses
      WHERE bucket = 'open' AND is_active = true
      ORDER BY sort_order ASC
      LIMIT 1
    ) fs_initial ON true
    WHERE l.created_at >= (NOW() - (v_lookback || ' days')::interval)
      AND (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
      AND (v_role <> 'sales_executive' OR l.assigned_to = auth.uid())

    UNION ALL

    SELECT
      la.lead_id,
      fs.id AS stage_id,
      fs.name AS stage_name,
      fs.sort_order,
      fs.color_code,
      la.created_at AS entered_at
    FROM public.lead_activities la
    JOIN public.leads l ON l.id = la.lead_id
    JOIN public.funnel_statuses fs ON fs.name = COALESCE(la.metadata->>'new_status_name', la.metadata->>'new_stage')
    WHERE la.activity_type = 'status_change'
      AND la.created_at >= (NOW() - (v_lookback || ' days')::interval)
      AND (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
      AND (v_role <> 'sales_executive' OR l.assigned_to = auth.uid())
  ),
  stage_intervals AS (
    SELECT
      se.lead_id,
      se.stage_id,
      se.stage_name,
      se.sort_order,
      se.color_code,
      se.entered_at,
      LEAD(se.entered_at) OVER (PARTITION BY se.lead_id ORDER BY se.entered_at ASC) AS exited_at,
      EXTRACT(EPOCH FROM (
        COALESCE(LEAD(se.entered_at) OVER (PARTITION BY se.lead_id ORDER BY se.entered_at ASC), NOW()) - se.entered_at
      )) / 86400.0 AS dwell_days
    FROM stage_events se
  )
  SELECT
    si.stage_id,
    si.stage_name,
    si.sort_order,
    si.color_code,
    COUNT(si.lead_id) AS deal_count,
    ROUND(AVG(si.dwell_days)::numeric, 1) AS avg_dwell_days,
    ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY si.dwell_days)::numeric, 1) AS median_dwell_days,
    COUNT(si.lead_id) FILTER (WHERE si.exited_at IS NULL AND si.dwell_days > 14.0) AS stalled_deals_count
  FROM stage_intervals si
  WHERE si.dwell_days >= 0.05
  GROUP BY si.stage_id, si.stage_name, si.sort_order, si.color_code
  ORDER BY si.sort_order ASC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_timeframe_revenue_spline(text);
CREATE FUNCTION public.get_timeframe_revenue_spline(
  p_timeframe text DEFAULT '30d'
)
RETURNS TABLE (
  bucket_period text,
  period_label text,
  converted_revenue numeric(14,2),
  inbound_potential_valuation numeric(14,2),
  converted_deals_count bigint,
  new_inquiries_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT := public.current_user_role();
  v_can_view_financials BOOLEAN := false;
  v_start timestamptz;
  v_end timestamptz := NOW();
  v_interval_count integer;
  v_step_seconds double precision;
  v_q_num integer;
  v_year integer;
BEGIN
  IF auth.uid() IS NULL OR v_role IS NULL OR v_role NOT IN ('admin', 'sales_manager', 'sales_executive', 'viewer') THEN
    RAISE EXCEPTION 'Unauthorized: Active CRM role required for revenue telemetry.' USING ERRCODE = '42501';
  END IF;

  SELECT CASE
    WHEN v_role = 'admin' THEN true
    WHEN lower(COALESCE(p.feature_permissions->>'can_view_financials', '')) = 'true' THEN true
    WHEN lower(COALESCE(p.feature_permissions->>'can_view_financials', '')) = 'false' THEN false
    ELSE v_role IN ('sales_manager', 'viewer')
  END
  INTO v_can_view_financials
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF p_timeframe = '7d' THEN
    v_start := v_end - interval '7 days';
    v_interval_count := 7;
  ELSIF p_timeframe = '30d' THEN
    v_start := v_end - interval '30 days';
    v_interval_count := 8;
  ELSIF p_timeframe = '90d' THEN
    v_start := v_end - interval '90 days';
    v_interval_count := 8;
  ELSIF p_timeframe = 'quarter' THEN
    v_start := date_trunc('quarter', NOW());
    v_end := (v_start + interval '3 months') - interval '1 millisecond';
    v_interval_count := 6;
  ELSIF p_timeframe ~* '^q[1-4]$' THEN
    v_q_num := SUBSTRING(p_timeframe FROM 2 FOR 1)::integer;
    v_year := EXTRACT(YEAR FROM NOW())::integer;
    v_start := MAKE_TIMESTAMPTZ(v_year, (v_q_num - 1) * 3 + 1, 1, 0, 0, 0, 'UTC');
    v_end := (v_start + interval '3 months') - interval '1 millisecond';
    v_interval_count := 6;
  ELSIF p_timeframe IN ('ytd', 'year') THEN
    v_start := MAKE_TIMESTAMPTZ(EXTRACT(YEAR FROM NOW())::integer, 1, 1, 0, 0, 0, 'UTC');
    v_interval_count := 12;
  ELSE
    v_start := v_end - interval '30 days';
    v_interval_count := 8;
  END IF;

  v_step_seconds := EXTRACT(EPOCH FROM (v_end - v_start)) / v_interval_count;

  RETURN QUERY
  WITH interval_series AS (
    SELECT
      s.idx,
      v_start + ((s.idx * v_step_seconds) || ' seconds')::interval AS b_start,
      v_start + (((s.idx + 1) * v_step_seconds) || ' seconds')::interval AS b_end
    FROM generate_series(0, v_interval_count - 1) AS s(idx)
  )
  SELECT
    (TO_CHAR(i.b_start, 'DD Mon YYYY') || ' - ' || TO_CHAR(i.b_end, 'DD Mon YYYY')) AS bucket_period,
    TO_CHAR(i.b_start, 'DD Mon') AS period_label,
    CASE WHEN COALESCE(v_can_view_financials, false) THEN COALESCE(SUM(l_conv.expected_value), 0.00) ELSE 0.00 END AS converted_revenue,
    CASE WHEN COALESCE(v_can_view_financials, false) THEN COALESCE(SUM(l_inbound.expected_value), 0.00) ELSE 0.00 END AS inbound_potential_valuation,
    COUNT(l_conv.id) AS converted_deals_count,
    COUNT(l_inbound.id) AS new_inquiries_count
  FROM interval_series i
  LEFT JOIN public.leads l_conv
    ON l_conv.converted_at >= i.b_start
    AND l_conv.converted_at < i.b_end
    AND (l_conv.brief_payload->'synthetic_benchmark' IS NULL OR l_conv.brief_payload->>'synthetic_benchmark' != 'true')
    AND (v_role <> 'sales_executive' OR l_conv.assigned_to = auth.uid())
  LEFT JOIN public.leads l_inbound
    ON l_inbound.created_at >= i.b_start
    AND l_inbound.created_at < i.b_end
    AND (l_inbound.brief_payload->'synthetic_benchmark' IS NULL OR l_inbound.brief_payload->>'synthetic_benchmark' != 'true')
    AND (v_role <> 'sales_executive' OR l_inbound.assigned_to = auth.uid())
  GROUP BY i.idx, i.b_start, i.b_end
  ORDER BY i.idx ASC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_service_category_distribution(integer);
CREATE FUNCTION public.get_service_category_distribution(
  p_lookback_days integer DEFAULT 90
)
RETURNS TABLE (
  category_name text,
  deal_count bigint,
  active_valuation numeric(14,2),
  share_percentage numeric(5,2),
  avg_deal_size numeric(14,2),
  color_code text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT := public.current_user_role();
  v_can_view_financials BOOLEAN := false;
  v_lookback integer := LEAST(GREATEST(COALESCE(p_lookback_days, 90), 1), 3650);
  v_total_pipeline numeric(14,2);
  v_total_count bigint;
BEGIN
  IF auth.uid() IS NULL OR v_role IS NULL OR v_role NOT IN ('admin', 'sales_manager', 'sales_executive', 'viewer') THEN
    RAISE EXCEPTION 'Unauthorized: Active CRM role required for category telemetry.' USING ERRCODE = '42501';
  END IF;

  SELECT CASE
    WHEN v_role = 'admin' THEN true
    WHEN lower(COALESCE(p.feature_permissions->>'can_view_financials', '')) = 'true' THEN true
    WHEN lower(COALESCE(p.feature_permissions->>'can_view_financials', '')) = 'false' THEN false
    ELSE v_role IN ('sales_manager', 'viewer')
  END
  INTO v_can_view_financials
  FROM public.profiles p
  WHERE p.id = auth.uid();

  SELECT COALESCE(SUM(l.expected_value), 0.00), COUNT(l.id)
  INTO v_total_pipeline, v_total_count
  FROM public.leads l
  JOIN public.funnel_statuses fs ON fs.id = l.status_id
  WHERE fs.bucket IN ('open', 'potential')
    AND l.created_at >= (NOW() - (v_lookback || ' days')::interval)
    AND (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
    AND (v_role <> 'sales_executive' OR l.assigned_to = auth.uid());

  IF v_total_pipeline = 0 OR v_total_pipeline IS NULL THEN v_total_pipeline := 1; END IF;
  IF v_total_count = 0 OR v_total_count IS NULL THEN v_total_count := 1; END IF;

  RETURN QUERY
  WITH category_raw AS (
    SELECT
      COALESCE(NULLIF(TRIM(l.service_category), ''), 'Other') AS cat,
      COUNT(l.id) AS active_cnt,
      COALESCE(SUM(l.expected_value), 0.00) AS active_val
    FROM public.leads l
    JOIN public.funnel_statuses fs ON fs.id = l.status_id
    WHERE fs.bucket IN ('open', 'potential')
      AND l.created_at >= (NOW() - (v_lookback || ' days')::interval)
      AND (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
      AND (v_role <> 'sales_executive' OR l.assigned_to = auth.uid())
    GROUP BY COALESCE(NULLIF(TRIM(l.service_category), ''), 'Other')
  )
  SELECT
    c.cat AS category_name,
    c.active_cnt AS deal_count,
    CASE WHEN COALESCE(v_can_view_financials, false) THEN c.active_val ELSE 0.00 END AS active_valuation,
    CASE WHEN COALESCE(v_can_view_financials, false)
      THEN ROUND((c.active_val / v_total_pipeline) * 100.0, 2)
      ELSE ROUND((c.active_cnt::numeric / v_total_count::numeric) * 100.0, 2)
    END AS share_percentage,
    CASE WHEN COALESCE(v_can_view_financials, false)
      THEN ROUND(c.active_val / NULLIF(c.active_cnt, 0)::numeric, 2)
      ELSE 0.00
    END AS avg_deal_size,
    CASE c.cat
      WHEN 'Web & Digital' THEN '#4f46e5'
      WHEN 'UI/UX Design' THEN '#f97316'
      WHEN 'Branding' THEN '#ea002a'
      WHEN 'Brand Identity' THEN '#ea002a'
      WHEN 'Full-Suite Advisory' THEN '#10b981'
      WHEN 'Mobile Apps' THEN '#d97706'
      ELSE '#666663'
    END AS color_code
  FROM category_raw c
  ORDER BY CASE WHEN COALESCE(v_can_view_financials, false) THEN c.active_val ELSE c.active_cnt::numeric END DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_cohort_win_rates(
  p_cohort_months integer DEFAULT 12
)
RETURNS TABLE (
  cohort_month text,
  total_ingested bigint,
  active_in_flight bigint,
  closed_won bigint,
  closed_lost bigint,
  closed_deal_win_rate numeric(5,2),
  pipeline_win_rate numeric(5,2),
  total_won_revenue numeric(14,2),
  avg_cycle_days numeric(6,1),
  weighted_pipeline_value numeric(14,2)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT := public.current_user_role();
  v_can_view_financials BOOLEAN := false;
  v_months integer := LEAST(GREATEST(COALESCE(p_cohort_months, 12), 1), 120);
BEGIN
  IF auth.uid() IS NULL OR v_role IS NULL OR v_role NOT IN ('admin', 'sales_manager', 'sales_executive', 'viewer') THEN
    RAISE EXCEPTION 'Unauthorized: Active CRM role required for cohort telemetry.' USING ERRCODE = '42501';
  END IF;

  SELECT CASE
    WHEN v_role = 'admin' THEN true
    WHEN lower(COALESCE(p.feature_permissions->>'can_view_financials', '')) = 'true' THEN true
    WHEN lower(COALESCE(p.feature_permissions->>'can_view_financials', '')) = 'false' THEN false
    ELSE v_role IN ('sales_manager', 'viewer')
  END
  INTO v_can_view_financials
  FROM public.profiles p
  WHERE p.id = auth.uid();

  RETURN QUERY
  WITH cohort_leads AS (
    SELECT
      TO_CHAR(DATE_TRUNC('month', l.created_at), 'YYYY-MM') AS c_month,
      l.id,
      l.expected_value,
      fs.bucket,
      l.created_at,
      l.converted_at,
      CASE
        WHEN l.converted_at IS NOT NULL THEN EXTRACT(EPOCH FROM (l.converted_at - l.created_at)) / 86400.0
        ELSE NULL
      END AS cycle_days,
      CASE fs.name
        WHEN 'New' THEN 0.10
        WHEN 'Contacted' THEN 0.20
        WHEN 'Qualified' THEN 0.40
        WHEN 'Proposal Sent' THEN 0.65
        WHEN 'Negotiation' THEN 0.85
        WHEN 'Converted' THEN 1.00
        ELSE 0.00
      END AS stage_probability
    FROM public.leads l
    JOIN public.funnel_statuses fs ON fs.id = l.status_id
    WHERE l.created_at >= (DATE_TRUNC('month', NOW()) - ((v_months - 1) || ' months')::interval)
      AND (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
      AND (v_role <> 'sales_executive' OR l.assigned_to = auth.uid())
  )
  SELECT
    cl.c_month AS cohort_month,
    COUNT(cl.id) AS total_ingested,
    COUNT(cl.id) FILTER (WHERE cl.bucket IN ('open', 'potential')) AS active_in_flight,
    COUNT(cl.id) FILTER (WHERE cl.bucket = 'converted') AS closed_won,
    COUNT(cl.id) FILTER (WHERE cl.bucket = 'lost') AS closed_lost,
    ROUND((COUNT(cl.id) FILTER (WHERE cl.bucket = 'converted')::numeric / NULLIF(COUNT(cl.id) FILTER (WHERE cl.bucket IN ('converted', 'lost')), 0)::numeric) * 100.0, 2) AS closed_deal_win_rate,
    ROUND((COUNT(cl.id) FILTER (WHERE cl.bucket = 'converted')::numeric / NULLIF(COUNT(cl.id), 0)::numeric) * 100.0, 2) AS pipeline_win_rate,
    CASE WHEN COALESCE(v_can_view_financials, false) THEN COALESCE(SUM(cl.expected_value) FILTER (WHERE cl.bucket = 'converted'), 0.00) ELSE 0.00 END AS total_won_revenue,
    ROUND(AVG(cl.cycle_days)::numeric, 1) AS avg_cycle_days,
    CASE WHEN COALESCE(v_can_view_financials, false) THEN ROUND(COALESCE(SUM(cl.expected_value * cl.stage_probability), 0.00)::numeric, 2) ELSE 0.00 END AS weighted_pipeline_value
  FROM cohort_leads cl
  GROUP BY cl.c_month
  ORDER BY cl.c_month DESC;
END;
$$;

-- Hardened get_pipeline_kpis: add synthetic_benchmark exclusion + can_view_financials gating
CREATE OR REPLACE FUNCTION public.get_pipeline_kpis(
    target_user_id UUID DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_source_id UUID DEFAULT NULL,
    p_assignee_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    caller_role TEXT;
    selected_rep UUID;
    effective_assignee UUID;
    v_can_view_financials BOOLEAN := false;
    result JSONB;
BEGIN
    caller_role := public.current_user_role();

    IF caller_role IS NULL THEN
        RAISE EXCEPTION 'Access denied: active authenticated CRM session required.'
            USING ERRCODE = '42501';
    ELSIF caller_role = 'sales_executive' THEN
        effective_assignee := auth.uid();
    ELSIF caller_role IN ('admin', 'sales_manager', 'viewer') THEN
        selected_rep := COALESCE(p_assignee_id, target_user_id);
        effective_assignee := selected_rep;
    ELSE
        RAISE EXCEPTION 'Access denied: unauthorized operational role.'
            USING ERRCODE = '42501';
    END IF;

    SELECT CASE
      WHEN caller_role = 'admin' THEN true
      WHEN lower(COALESCE(p.feature_permissions->>'can_view_financials', '')) = 'true' THEN true
      WHEN lower(COALESCE(p.feature_permissions->>'can_view_financials', '')) = 'false' THEN false
      ELSE caller_role IN ('sales_manager', 'viewer')
    END
    INTO v_can_view_financials
    FROM public.profiles p
    WHERE p.id = auth.uid();

    WITH lead_metrics AS (
        SELECT
            l.expected_value,
            l.next_follow_up,
            l.revisit_date,
            l.lost_reason,
            fs.bucket,
            fs.name AS status_name
        FROM public.leads l
        JOIN public.funnel_statuses fs ON l.status_id = fs.id
        WHERE (l.brief_payload->'synthetic_benchmark' IS NULL OR l.brief_payload->>'synthetic_benchmark' != 'true')
          AND (effective_assignee IS NULL OR l.assigned_to = effective_assignee)
          AND (p_start_date IS NULL OR l.created_at >= p_start_date)
          AND (p_end_date IS NULL OR l.created_at <= p_end_date)
          AND (p_source_id IS NULL OR l.lead_source_id = p_source_id)
    ),
    aggregated AS (
        SELECT
            COUNT(*)::INT AS total_leads_count,
            COUNT(*) FILTER (WHERE bucket = 'open')::INT AS open_leads_count,
            COUNT(*) FILTER (WHERE bucket = 'potential')::INT AS potential_leads_count,
            CASE WHEN COALESCE(v_can_view_financials, false)
              THEN COALESCE(SUM(expected_value) FILTER (WHERE bucket = 'potential'), 0.00)::NUMERIC(14,2)
              ELSE 0.00::NUMERIC(14,2)
            END AS potential_pipeline_value,
            CASE WHEN COALESCE(v_can_view_financials, false)
              THEN COALESCE(SUM(
                CASE
                    WHEN bucket = 'potential' THEN
                        expected_value * (
                            CASE
                                WHEN lower(status_name) LIKE '%negotiat%' THEN 0.85
                                WHEN lower(status_name) LIKE '%proposal%' THEN 0.50
                                WHEN lower(status_name) LIKE '%qualified%' THEN 0.25
                                ELSE 0.20
                            END
                        )
                    ELSE 0.00
                END
              ), 0.00)::NUMERIC(14,2)
              ELSE 0.00::NUMERIC(14,2)
            END AS stage_weighted_pipeline_value,
            COUNT(*) FILTER (WHERE bucket = 'converted')::INT AS converted_leads_count,
            CASE WHEN COALESCE(v_can_view_financials, false)
              THEN COALESCE(SUM(expected_value) FILTER (WHERE bucket = 'converted'), 0.00)::NUMERIC(14,2)
              ELSE 0.00::NUMERIC(14,2)
            END AS converted_revenue_value,
            COUNT(*) FILTER (WHERE bucket = 'lost')::INT AS lost_leads_count,
            COUNT(*) FILTER (WHERE lost_reason IN ('spam_invalid', 'out_of_scope'))::INT AS disqualified_leads_count,
            COUNT(*) FILTER (
                WHERE bucket NOT IN ('converted', 'lost')
                  AND next_follow_up IS NOT NULL
                  AND next_follow_up < timezone('utc'::text, now())
                  AND (status_name != 'On Hold' OR revisit_date IS NULL OR revisit_date <= CURRENT_DATE)
            )::INT AS overdue_follow_ups_count,
            CASE
                WHEN (COUNT(*) - COUNT(*) FILTER (WHERE lost_reason IN ('spam_invalid', 'out_of_scope'))) = 0 THEN 0.0
                ELSE ROUND(
                    (COUNT(*) FILTER (WHERE bucket = 'converted')::NUMERIC /
                    NULLIF(COUNT(*) - COUNT(*) FILTER (WHERE lost_reason IN ('spam_invalid', 'out_of_scope')), 0)::NUMERIC) * 100.0,
                    2
                )
            END AS conversion_rate_percentage
        FROM lead_metrics
    )
    SELECT jsonb_build_object(
        'total_leads_count', aggregated.total_leads_count,
        'total_leads', aggregated.total_leads_count,
        'open_leads_count', aggregated.open_leads_count,
        'potential_leads_count', aggregated.potential_leads_count,
        'potential_count', aggregated.potential_leads_count,
        'potential_pipeline_value', aggregated.potential_pipeline_value,
        'potential_value', aggregated.potential_pipeline_value,
        'stage_weighted_pipeline_value', aggregated.stage_weighted_pipeline_value,
        'converted_leads_count', aggregated.converted_leads_count,
        'converted_count', aggregated.converted_leads_count,
        'converted_revenue_value', aggregated.converted_revenue_value,
        'converted_value', aggregated.converted_revenue_value,
        'lost_leads_count', aggregated.lost_leads_count,
        'lost_count', aggregated.lost_leads_count,
        'disqualified_leads_count', aggregated.disqualified_leads_count,
        'overdue_follow_ups_count', aggregated.overdue_follow_ups_count,
        'overdue_count', aggregated.overdue_follow_ups_count,
        'conversion_rate_percentage', aggregated.conversion_rate_percentage,
        'conversion_rate', aggregated.conversion_rate_percentage
    )
    INTO result
    FROM aggregated;

    RETURN result;
END;
$$;

-- Exact-signature permission enforcement across modified RPCs
REVOKE EXECUTE ON FUNCTION public.get_funnel_conversion_dropoff(timestamptz, timestamptz, uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_stage_dwell_time_metrics(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_timeframe_revenue_spline(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_service_category_distribution(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_cohort_win_rates(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.execute_atomic_lead_reassignment(uuid, uuid, uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.batch_update_lead_status(uuid[], uuid, uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.batch_reassign_leads(uuid[], uuid, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_lead_follow_up(uuid, timestamptz, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reactivate_expired_on_hold_leads() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_pipeline_kpis(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_funnel_conversion_dropoff(timestamptz, timestamptz, uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_stage_dwell_time_metrics(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_timeframe_revenue_spline(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_service_category_distribution(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_cohort_win_rates(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.execute_atomic_lead_reassignment(uuid, uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.batch_update_lead_status(uuid[], uuid, uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.batch_reassign_leads(uuid[], uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_lead_follow_up(uuid, timestamptz, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reactivate_expired_on_hold_leads() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_pipeline_kpis(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
