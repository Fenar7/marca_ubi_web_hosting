-- Inquiry receipts represent individual submissions. Lead records continue to own the sales relationship.
CREATE TABLE public.inquiries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_ref text GENERATED ALWAYS AS ('INQ-' || upper(replace(id::text, '-', ''))) STORED UNIQUE,
    origin text NOT NULL CHECK (origin IN ('contact', 'start_project', 'chat_pod', 'website', 'manual')),
    original_channel text CHECK (length(original_channel) BETWEEN 1 AND 80),
    received_at timestamptz NOT NULL DEFAULT now(),
    name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
    email text CHECK (length(email) BETWEEN 1 AND 255),
    phone text CHECK (length(phone) BETWEEN 1 AND 50),
    company text CHECK (length(company) BETWEEN 1 AND 200),
    service_category text CHECK (service_category IN ('Branding', 'Web & Digital', 'Mobile Apps', 'UI/UX Design', 'Full-Suite Advisory', 'Other')),
    summary text NOT NULL CHECK (length(summary) BETWEEN 1 AND 12000),
    brief jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(brief) = 'object' AND octet_length(brief::text) <= 32768),
    lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
    outcome text NOT NULL DEFAULT 'needs_review' CHECK (outcome IN ('created', 'linked', 'needs_review')),
    state text NOT NULL DEFAULT 'new' CHECK (state IN ('new', 'reviewed', 'closed')),
    assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    close_reason text CHECK (length(close_reason) BETWEEN 1 AND 500),
    is_historical boolean NOT NULL DEFAULT false,
    CHECK (email IS NOT NULL OR phone IS NOT NULL),
    CHECK ((state = 'closed') = (close_reason IS NOT NULL))
);

CREATE INDEX inquiries_queue_order ON public.inquiries (received_at DESC, id DESC);
CREATE INDEX inquiries_origin_queue_order ON public.inquiries (origin, received_at DESC, id DESC);
CREATE INDEX inquiries_state_queue_order ON public.inquiries (state, received_at DESC, id DESC);
CREATE INDEX inquiries_assignee_queue_order ON public.inquiries (assigned_to, received_at DESC, id DESC);
CREATE INDEX inquiries_linked_lead ON public.inquiries (lead_id);
CREATE INDEX inquiries_unassigned_actionable ON public.inquiries (received_at DESC, id DESC)
    WHERE assigned_to IS NULL AND state <> 'closed';
CREATE INDEX leads_inquiry_phone_identity ON public.leads
    ((nullif(regexp_replace(phone, '[^0-9]', '', 'g'), ''))) WHERE phone IS NOT NULL;

CREATE TABLE public.inquiry_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id uuid NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
    actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type text NOT NULL CHECK (event_type IN ('received', 'linked', 'triaged', 'backfilled')),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX inquiry_activity_timeline ON public.inquiry_activity (inquiry_id, created_at DESC, id DESC);

-- Replay metadata is inaccessible to browser roles. It preserves the initial commit response even after triage or linking.
CREATE TABLE public.inquiry_receipts (
    origin text NOT NULL,
    actor_scope uuid NOT NULL,
    idempotency_key text NOT NULL,
    request_hash bytea NOT NULL,
    inquiry_id uuid NOT NULL REFERENCES public.inquiries(id) ON DELETE RESTRICT,
    response jsonb NOT NULL,
    PRIMARY KEY (origin, actor_scope, idempotency_key)
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_receipts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.inquiries, public.inquiry_activity, public.inquiry_receipts FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.inquiries, public.inquiry_activity TO authenticated;

-- Mirror the Admin route's role defaults while preserving explicit access overrides.
CREATE FUNCTION public.inquiry_staff_role(p_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
    SELECT profile.role
    FROM public.profiles AS profile
    WHERE profile.id = p_user_id AND profile.status = 'active'
      AND (profile.role = 'admin' OR CASE
          WHEN cardinality(profile.allowed_tabs) > 0 THEN 'ingestion' = ANY (profile.allowed_tabs)
          ELSE profile.role = 'sales_manager'
      END)
$$;

REVOKE ALL ON FUNCTION public.inquiry_staff_role(uuid) FROM PUBLIC, anon, authenticated, service_role;

-- Lead association remains tied to the separate Leads capability.
CREATE FUNCTION public.inquiry_can_access_leads(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = pg_catalog AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles AS profile
        WHERE profile.id = p_user_id AND profile.status = 'active'
          AND (profile.role = 'admin' OR CASE
              WHEN cardinality(profile.allowed_tabs) > 0 THEN 'leads' = ANY (profile.allowed_tabs)
              ELSE profile.role IN ('sales_manager', 'sales_executive', 'viewer')
          END)
    )
$$;

REVOKE ALL ON FUNCTION public.inquiry_can_access_leads(uuid) FROM PUBLIC, anon, authenticated, service_role;

-- An intake owner must have Inbox access and retain visibility of any linked lead.
CREATE FUNCTION public.assert_inquiry_owner(p_owner uuid, p_lead uuid)
RETURNS void LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE
    v_role text;
BEGIN
    IF p_owner IS NULL THEN
        RETURN;
    END IF;
    PERFORM 1 FROM public.profiles WHERE id = p_owner FOR SHARE;
    v_role := public.inquiry_staff_role(p_owner);
    IF COALESCE(v_role, '') NOT IN ('admin', 'sales_manager', 'sales_executive')
        OR (v_role = 'sales_executive' AND p_lead IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.leads WHERE id = p_lead AND assigned_to = p_owner
        ))
    THEN
        RAISE EXCEPTION 'Inquiry owner is unavailable for this record' USING ERRCODE = '22023';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_inquiry_owner(uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.current_inquiry_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
    SELECT public.inquiry_staff_role(auth.uid())
$$;

REVOKE ALL ON FUNCTION public.current_inquiry_role() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_inquiry_role() TO authenticated;

CREATE POLICY inquiries_read ON public.inquiries FOR SELECT TO authenticated
USING (
    (SELECT public.current_inquiry_role()) IN ('admin', 'sales_manager', 'viewer')
    OR (
        (SELECT public.current_inquiry_role()) = 'sales_executive'
        AND assigned_to = (SELECT auth.uid())
        AND (
            lead_id IS NULL OR EXISTS (
                SELECT 1 FROM public.leads AS lead WHERE lead.id = inquiries.lead_id
            )
        )
    )
);

CREATE POLICY inquiry_activity_read ON public.inquiry_activity FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.inquiries AS inquiry WHERE inquiry.id = inquiry_activity.inquiry_id)
);

COMMENT ON TABLE public.inquiries IS 'Accepted website and staff-recorded submissions, with triage scoped separately from the linked sales lead.';
COMMENT ON TABLE public.inquiry_activity IS 'Append-only inquiry timeline written in the same transaction as capture, association, or triage.';

INSERT INTO public.lead_sources (name, color_code, is_active)
VALUES ('Manual Inquiry', '#525965', true), ('Chat Pod', '#475569', true)
ON CONFLICT (name) DO NOTHING;

-- Store only explicitly supported brief fields. Rebuild expected collections from string arrays so nested data cannot cross into the inbox.
CREATE FUNCTION public.project_inquiry_brief(p_value jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = pg_catalog AS $$
    SELECT COALESCE(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
    FROM jsonb_each(p_value) AS entry
    WHERE (
        jsonb_typeof(entry.value) = 'string'
        AND entry.key IN (
            'category', 'service', 'language', 'projectName', 'projectDescription', 'industry',
            'website', 'agencyStatus', 'referral', 'timeline', 'inspirationLinks', 'showcasePermission',
            'extraNotes', 'instagram', 'combinedNotes', 'track', 'budget', 'budget_amount', 'message',
            'raw_message', 'companyWebsite', 'businessType', 'instagramId'
        )
    ) OR (
        entry.key IN ('services', 'categories', 'serviceInterests')
        AND jsonb_typeof(entry.value) = 'array'
        AND NOT jsonb_path_exists(entry.value, '$[*] ? (@.type() != "string")')
    )
$$;

REVOKE ALL ON FUNCTION public.project_inquiry_brief(jsonb) FROM PUBLIC, anon, authenticated, service_role;

-- The lock set includes each available identity. Shared locks prevent racing no-match inserts,
-- and deterministic ordering avoids deadlock when two requests share only one coordinate.
CREATE FUNCTION public.lock_inquiry_identity(p_email text, p_phone text)
RETURNS void LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE
    v_lock bigint;
BEGIN
    FOR v_lock IN
        SELECT DISTINCT lock_key
        FROM unnest(ARRAY[
            CASE WHEN p_email IS NOT NULL THEN hashtextextended('inquiry:email:' || p_email, 0) END,
            CASE WHEN p_phone IS NOT NULL THEN hashtextextended('inquiry:phone:' || p_phone, 0) END
        ]) AS keys(lock_key)
        WHERE lock_key IS NOT NULL
        ORDER BY lock_key
    LOOP
        PERFORM pg_advisory_xact_lock(v_lock);
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.lock_inquiry_identity(text, text) FROM PUBLIC, anon, authenticated, service_role;

-- Match by exact normalized coordinates. Contact matches split across incompatible records require operator review.
-- Multiple opportunities with the same identity remain valid and the newest exact compatible record wins.
CREATE FUNCTION public.find_inquiry_lead(p_email text, p_phone text, p_linked_lead_id uuid DEFAULT NULL)
RETURNS TABLE (lead_id uuid, conflicting_match boolean)
LANGUAGE sql STABLE SET search_path = pg_catalog AS $$
    WITH candidates AS MATERIALIZED (
        SELECT
            lead.id, lead.created_at,
            COALESCE(lower(btrim(lead.email)) = p_email, false) AS email_match,
            COALESCE(nullif(regexp_replace(lead.phone, '[^0-9]', '', 'g'), '') = p_phone, false) AS phone_match,
            (p_email IS NULL OR nullif(btrim(lead.email), '') IS NULL OR lower(btrim(lead.email)) = p_email)
                AND (p_phone IS NULL OR nullif(regexp_replace(lead.phone, '[^0-9]', '', 'g'), '') IS NULL
                    OR nullif(regexp_replace(lead.phone, '[^0-9]', '', 'g'), '') = p_phone) AS compatible
        FROM public.leads AS lead
        WHERE lead.brief_payload->>'synthetic_benchmark' IS DISTINCT FROM 'true'
          AND lead.brief_payload->>'simulated' IS DISTINCT FROM 'true'
          AND (
              lower(btrim(lead.email)) = p_email OR
              (lead.phone IS NOT NULL AND nullif(regexp_replace(lead.phone, '[^0-9]', '', 'g'), '') = p_phone)
          )
    ), resolution AS (
        SELECT
            COALESCE(bool_or(email_match), false) AS has_email,
            COALESCE(bool_or(phone_match), false) AS has_phone,
            COALESCE(bool_or(email_match AND phone_match), false) AS has_pair,
            COALESCE(bool_or(compatible), false) AS has_compatible,
            count(*) AS total
        FROM candidates
    )
    SELECT
        (
            SELECT candidate.id FROM candidates AS candidate
            WHERE candidate.compatible
              AND (p_linked_lead_id IS NULL OR candidate.id = p_linked_lead_id)
              AND (NOT (resolution.has_email AND resolution.has_phone) OR (candidate.email_match AND candidate.phone_match))
            ORDER BY (candidate.email_match AND candidate.phone_match) DESC, candidate.created_at DESC, candidate.id DESC
            LIMIT 1
        ),
        (resolution.has_email AND resolution.has_phone AND NOT resolution.has_pair)
            OR (resolution.total > 0 AND NOT resolution.has_compatible)
    FROM resolution
$$;

REVOKE ALL ON FUNCTION public.find_inquiry_lead(text, text, uuid) FROM PUBLIC, anon, authenticated, service_role;

-- References are validated while the transaction holds shared locks, preventing a concurrent deactivation.
CREATE FUNCTION public.create_inquiry_lead(p_inquiry public.inquiries, p_input jsonb, p_previous_ref text DEFAULT NULL)
RETURNS public.leads LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE
    v_source uuid;
    v_stage uuid;
    v_lead public.leads;
    v_value numeric;
BEGIN
    SELECT source.id INTO v_source FROM public.lead_sources AS source
    WHERE source.is_active AND CASE
        WHEN p_inquiry.origin = 'manual' THEN source.name = 'Manual Inquiry'
        WHEN p_inquiry.origin = 'chat_pod' THEN source.name = 'Chat Pod'
        ELSE source.id = 'a0000000-0000-0000-0000-000000000001'
    END
    FOR SHARE;

    SELECT stage.id INTO v_stage FROM public.funnel_statuses AS stage
    WHERE stage.id = 'b0000000-0000-0000-0000-000000000001' AND stage.is_active AND stage.bucket = 'open'
    FOR SHARE;

    IF v_source IS NULL OR v_stage IS NULL THEN
        RAISE EXCEPTION 'Inquiry lead source or starting stage is unavailable' USING ERRCODE = '55000';
    END IF;

    v_value := COALESCE((p_input->>'expected_value')::numeric, 0);
    IF v_value < 0 OR v_value >= 10000000000 OR v_value = 'NaN'::numeric THEN
        RAISE EXCEPTION 'Invalid inquiry valuation' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.leads (
        name, email, phone, company, company_website, industry, service_category, budget_bracket,
        preferred_channel, expected_value, notes, lead_source_id, source_detail, status_id, assigned_to, brief_payload
    )
    VALUES (
        p_inquiry.name, p_inquiry.email, p_inquiry.phone, p_inquiry.company,
        nullif(btrim(p_input->>'company_website'), ''), nullif(btrim(p_input->>'industry'), ''),
        COALESCE(p_inquiry.service_category, 'Other'), nullif(btrim(p_input->>'budget_bracket'), ''),
        COALESCE(nullif(p_input->>'preferred_channel', ''), CASE WHEN p_inquiry.email IS NOT NULL THEN 'Email' ELSE 'Phone' END),
        v_value, p_inquiry.summary, v_source,
        COALESCE(nullif(btrim(p_input->>'source_detail'), ''), p_inquiry.original_channel, p_inquiry.origin),
        v_stage, p_inquiry.assigned_to,
        p_inquiry.brief
            || jsonb_build_object('inquiry_ref', p_inquiry.inquiry_ref, 'inquiry_origin', p_inquiry.origin)
            || CASE WHEN p_previous_ref IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('previous_lead_id', p_previous_ref) END
    )
    -- Legacy CRM keeps one lead per normalized email. The caller can still retain the inquiry for review.
    ON CONFLICT (lower(btrim(email))) WHERE email IS NOT NULL DO NOTHING
    RETURNING * INTO v_lead;

    RETURN v_lead;
END;
$$;

REVOKE ALL ON FUNCTION public.create_inquiry_lead(public.inquiries, jsonb, text) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.record_inquiry(p_input jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
    v_origin text := p_input->>'origin';
    v_actor uuid := auth.uid();
    v_scope uuid;
    v_key text := p_input->>'idempotency_key';
    v_hash bytea;
    v_receipt public.inquiry_receipts;
    v_manual boolean := v_origin = 'manual';
    v_mode text := COALESCE(p_input->>'link_mode', 'auto');
    v_channel text := nullif(btrim(p_input->>'original_channel'), '');
    v_name text := btrim(p_input->>'name');
    v_summary text := btrim(p_input->>'summary');
    v_company text := nullif(btrim(p_input->>'company'), '');
    v_email text := nullif(lower(btrim(p_input->>'email')), '');
    v_phone text := nullif(btrim(p_input->>'phone'), '');
    v_digits text := nullif(regexp_replace(v_phone, '[^0-9]', '', 'g'), '');
    v_owner uuid := nullif(p_input->>'assigned_to', '')::uuid;
    v_explicit_id uuid := nullif(p_input->>'linked_lead_id', '')::uuid;
    v_matched_id uuid;
    v_conflict boolean;
    v_received timestamptz;
    v_inquiry public.inquiries;
    v_lead public.leads;
    v_existing public.leads;
    v_bucket text;
    v_stage uuid;
    v_action text := 'NEEDS_REVIEW';
    v_outcome text := 'needs_review';
    v_result jsonb;
BEGIN
    IF jsonb_typeof(p_input) IS DISTINCT FROM 'object'
        OR v_origin IS NULL OR v_origin NOT IN ('contact', 'start_project', 'chat_pod', 'website', 'manual')
        OR v_key IS NULL OR v_key !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$'
        OR v_name IS NULL OR length(v_name) NOT BETWEEN 1 AND 120
        OR v_summary IS NULL OR length(v_summary) NOT BETWEEN 1 AND 12000
        OR length(v_company) > 200 OR length(v_email) > 255 OR length(v_phone) > 50
        OR v_name ~ '[[:cntrl:]]' OR v_company ~ '[[:cntrl:]]'
        OR translate(v_summary, E'\t\n\r', '') ~ '[[:cntrl:]]'
        OR (p_input->>'service_category' IS NOT NULL AND p_input->>'service_category' NOT IN (
            'Branding', 'Web & Digital', 'Mobile Apps', 'UI/UX Design', 'Full-Suite Advisory', 'Other'
        ))
        OR v_mode NOT IN ('auto', 'create', 'link', 'review')
        OR ((v_mode = 'link') IS DISTINCT FROM (v_explicit_id IS NOT NULL))
        OR (v_email IS NULL AND (v_digits IS NULL OR length(v_digits) < 7))
        OR (v_email IS NOT NULL AND v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')
        OR (v_phone IS NOT NULL AND (v_digits IS NULL OR length(v_digits) NOT BETWEEN 7 AND 15))
        OR jsonb_typeof(COALESCE(p_input->'brief', '{}'::jsonb)) <> 'object'
        OR octet_length(p_input::text) > 131072 THEN
        RAISE EXCEPTION 'Invalid inquiry' USING ERRCODE = '22023';
    END IF;

    IF v_manual THEN
        PERFORM 1 FROM public.profiles WHERE id = v_actor FOR SHARE;
        IF COALESCE(public.inquiry_staff_role(v_actor), '') NOT IN ('admin', 'sales_manager') THEN
            RAISE EXCEPTION 'Inquiry write access denied' USING ERRCODE = '42501';
        END IF;
        IF v_channel IS NULL OR v_channel NOT IN ('email', 'phone', 'referral', 'in_person', 'other')
            OR p_input ?| ARRAY['expected_value', 'source_detail', 'preferred_channel', 'company_website', 'industry', 'budget_bracket'] THEN
            RAISE EXCEPTION 'Invalid manual inquiry channel or fields' USING ERRCODE = '22023';
        END IF;
        IF NOT public.inquiry_can_access_leads(v_actor) THEN
            IF v_mode IN ('link', 'create') THEN
                RAISE EXCEPTION 'Lead access required to associate an inquiry' USING ERRCODE = '42501';
            END IF;
            v_mode := 'review';
        END IF;
        v_received := COALESCE(nullif(p_input->>'received_at', '')::timestamptz, now());
        IF NOT isfinite(v_received) OR v_received > now() + interval '5 minutes' THEN
            RAISE EXCEPTION 'Invalid inquiry received time' USING ERRCODE = '22023';
        END IF;
        v_scope := v_actor;
    ELSE
        IF auth.role() IS DISTINCT FROM 'service_role' OR v_actor IS NOT NULL
            OR v_owner IS NOT NULL OR v_mode NOT IN ('auto', 'review') THEN
            RAISE EXCEPTION 'Website inquiry write access denied' USING ERRCODE = '42501';
        END IF;
        v_received := now();
        v_scope := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- JSONB serialization has stable key order. Persist the response and hash rather than duplicating the request body.
    v_hash := sha256(convert_to((p_input - 'idempotency_key')::text, 'UTF8'));
    PERFORM pg_advisory_xact_lock(hashtextextended('inquiry:receipt:' || v_origin || ':' || v_scope || ':' || v_key, 0));

    SELECT receipt.* INTO v_receipt FROM public.inquiry_receipts AS receipt
    WHERE receipt.origin = v_origin AND receipt.actor_scope = v_scope AND receipt.idempotency_key = v_key;

    IF FOUND THEN
        IF v_receipt.request_hash <> v_hash THEN
            RAISE EXCEPTION 'Inquiry retry conflicts with the original request' USING ERRCODE = '23505';
        END IF;
        RETURN v_receipt.response || '{"replayed":true}'::jsonb;
    END IF;

    PERFORM public.assert_inquiry_owner(v_owner, NULL);

    IF v_mode <> 'review' THEN
        PERFORM public.lock_inquiry_identity(v_email, v_digits);
        SELECT match.lead_id, match.conflicting_match INTO v_matched_id, v_conflict
        FROM public.find_inquiry_lead(v_email, v_digits, v_explicit_id) AS match;
        IF v_mode = 'link' AND (v_conflict OR v_matched_id IS NULL) THEN
            RAISE EXCEPTION 'Inquiry association could not be verified' USING ERRCODE = '22023';
        END IF;

        IF NOT v_conflict AND v_matched_id IS NOT NULL AND v_mode <> 'create' THEN
            SELECT lead.* INTO v_existing FROM public.leads AS lead
            WHERE lead.id = v_matched_id AND lead.brief_payload->>'synthetic_benchmark' IS DISTINCT FROM 'true'
              AND lead.brief_payload->>'simulated' IS DISTINCT FROM 'true'
              AND (lower(btrim(lead.email)) = v_email OR nullif(regexp_replace(lead.phone, '[^0-9]', '', 'g'), '') = v_digits)
              AND (v_email IS NULL OR nullif(btrim(lead.email), '') IS NULL OR lower(btrim(lead.email)) = v_email)
              AND (v_digits IS NULL OR nullif(regexp_replace(lead.phone, '[^0-9]', '', 'g'), '') IS NULL OR nullif(regexp_replace(lead.phone, '[^0-9]', '', 'g'), '') = v_digits)
            FOR UPDATE;
            IF NOT FOUND THEN
                IF v_mode = 'link' THEN
                    RAISE EXCEPTION 'Inquiry association changed. Review the matching lead again.' USING ERRCODE = '40001';
                END IF;
                v_conflict := true;
            ELSE
                SELECT stage.bucket INTO v_bucket FROM public.funnel_statuses AS stage WHERE stage.id = v_existing.status_id;
            END IF;
        END IF;
    END IF;

    INSERT INTO public.inquiries (
        origin, original_channel, received_at, name, email, phone, company, service_category, summary,
        brief, assigned_to, created_by
    )
    VALUES (
        v_origin, v_channel, v_received,
        v_name, v_email, v_phone, v_company,
        p_input->>'service_category', v_summary,
        public.project_inquiry_brief(COALESCE(p_input->'brief', '{}'::jsonb))
            || jsonb_strip_nulls(jsonb_build_object('budget', nullif(btrim(p_input->>'budget_bracket'), ''))),
        v_owner, v_actor
    )
    RETURNING * INTO v_inquiry;

    IF v_mode <> 'review' AND NOT v_conflict THEN
        IF v_existing.id IS NULL OR (NOT v_manual AND (
            v_existing.converted_at IS NOT NULL OR v_bucket = 'converted'
            OR (v_bucket = 'lost' AND v_existing.updated_at < v_received - interval '90 days')
        )) THEN
            v_lead := public.create_inquiry_lead(v_inquiry, p_input, v_existing.lead_id);
            IF v_lead.id IS NOT NULL THEN
                v_action := CASE WHEN v_existing.id IS NULL THEN 'NEW_LEAD' ELSE 'CREATE_NEW_REENGAGEMENT' END;
                v_outcome := 'created';
            ELSIF v_manual AND v_mode = 'create' THEN
                RAISE EXCEPTION 'A separate lead is unavailable for this inquiry' USING ERRCODE = '22023';
            END IF;
        ELSE
            v_lead := v_existing;
            v_outcome := 'linked';
            v_action := 'MERGE_INQUIRY';

            -- Staff can append an inquiry without altering an existing lead's stage, flags, or ownership.
            IF NOT v_manual THEN
                v_stage := v_existing.status_id;
                IF v_bucket = 'lost' THEN
                    SELECT stage.id INTO v_stage FROM public.funnel_statuses AS stage
                    WHERE stage.id = 'b0000000-0000-0000-0000-000000000001' AND stage.is_active AND stage.bucket = 'open'
                    FOR SHARE;
                    IF v_stage IS NULL THEN
                        RAISE EXCEPTION 'Inquiry starting stage is unavailable' USING ERRCODE = '55000';
                    END IF;
                    v_action := 'REACTIVATE_LEAD';
                END IF;
                UPDATE public.leads
                SET inquiry_count = inquiry_count + 1,
                    priority = 'High',
                    next_follow_up = v_received,
                    status_id = v_stage,
                    lost_reason = CASE WHEN v_bucket = 'lost' THEN NULL ELSE lost_reason END
                WHERE id = v_lead.id;
            END IF;
        END IF;
    END IF;

    IF v_lead.id IS NOT NULL THEN
        PERFORM public.assert_inquiry_owner(v_owner, v_lead.id);
        UPDATE public.inquiries SET lead_id = v_lead.id, outcome = v_outcome WHERE id = v_inquiry.id;
        INSERT INTO public.lead_activities (lead_id, actor_id, activity_type, description, metadata)
        VALUES (
            v_lead.id, v_actor, CASE WHEN v_action = 'NEW_LEAD' THEN 'system_event' ELSE 'duplicate_inquiry' END,
            CASE v_action
                WHEN 'NEW_LEAD' THEN 'Lead created from inquiry'
                WHEN 'REACTIVATE_LEAD' THEN 'Lead reactivated on receipt of new inquiry'
                WHEN 'CREATE_NEW_REENGAGEMENT' THEN 'New opportunity created from a returning contact'
                ELSE 'Inquiry linked to existing lead'
            END,
            jsonb_build_object('inquiry_id', v_inquiry.id, 'origin', v_origin, 'action', v_action)
        );
    END IF;

    INSERT INTO public.inquiry_activity (inquiry_id, actor_id, event_type, metadata)
    VALUES (
        v_inquiry.id, v_actor, 'received',
        jsonb_build_object('outcome', v_outcome, 'lead_id', v_lead.id)
    );

    v_result := jsonb_build_object(
        'id', v_inquiry.id, 'inquiry_ref', v_inquiry.inquiry_ref, 'lead_id', v_lead.id,
        'lead_ref', v_lead.lead_id, 'outcome', v_outcome, 'action', v_action, 'replayed', false
    );

    INSERT INTO public.inquiry_receipts (origin, actor_scope, idempotency_key, request_hash, inquiry_id, response)
    VALUES (v_origin, v_scope, v_key, v_hash, v_inquiry.id, v_result);

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.record_inquiry(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_inquiry(jsonb) TO authenticated, service_role;

-- Stale clients must refresh before overwriting triage or creating a second association.
CREATE FUNCTION public.lock_editable_inquiry(p_inquiry_id uuid, p_expected_updated_at timestamptz)
RETURNS public.inquiries LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE
    v_inquiry public.inquiries;
BEGIN
    PERFORM 1 FROM public.profiles WHERE id = auth.uid() FOR SHARE;
    IF COALESCE(public.inquiry_staff_role(auth.uid()), '') NOT IN ('admin', 'sales_manager') THEN
        RAISE EXCEPTION 'Inquiry write access denied' USING ERRCODE = '42501';
    END IF;
    SELECT inquiry.* INTO v_inquiry FROM public.inquiries AS inquiry
    WHERE inquiry.id = p_inquiry_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inquiry unavailable' USING ERRCODE = '42501';
    END IF;
    IF v_inquiry.updated_at IS DISTINCT FROM p_expected_updated_at THEN
        RAISE EXCEPTION 'Inquiry has changed. Refresh before saving.' USING ERRCODE = '40001';
    END IF;
    RETURN v_inquiry;
END;
$$;

REVOKE ALL ON FUNCTION public.lock_editable_inquiry(uuid, timestamptz) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.triage_inquiry(
    p_inquiry_id uuid, p_expected_updated_at timestamptz, p_state text, p_owner_id uuid, p_close_reason text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
    v_inquiry public.inquiries;
    v_reason text := nullif(btrim(p_close_reason), '');
BEGIN
    v_inquiry := public.lock_editable_inquiry(p_inquiry_id, p_expected_updated_at);
    IF p_state IS NULL OR p_state NOT IN ('new', 'reviewed', 'closed')
        OR (p_state = 'closed') IS DISTINCT FROM (v_reason IS NOT NULL)
        OR length(v_reason) > 500 OR v_reason ~ '[[:cntrl:]]' THEN
        RAISE EXCEPTION 'Invalid inquiry triage' USING ERRCODE = '22023';
    END IF;

    PERFORM public.assert_inquiry_owner(p_owner_id, v_inquiry.lead_id);

    IF ROW(v_inquiry.state, v_inquiry.assigned_to, v_inquiry.close_reason) IS DISTINCT FROM ROW(p_state, p_owner_id, v_reason) THEN
        UPDATE public.inquiries AS inquiry
        SET state = p_state, assigned_to = p_owner_id, close_reason = v_reason,
            updated_at = greatest(clock_timestamp(), inquiry.updated_at + interval '1 microsecond')
        WHERE inquiry.id = v_inquiry.id
        RETURNING * INTO v_inquiry;

        INSERT INTO public.inquiry_activity (inquiry_id, actor_id, event_type, metadata)
        VALUES (
            v_inquiry.id, auth.uid(), 'triaged',
            jsonb_build_object('state', p_state, 'assigned_to', p_owner_id)
        );
    END IF;

    RETURN jsonb_build_object(
        'id', v_inquiry.id, 'state', v_inquiry.state, 'assigned_to', v_inquiry.assigned_to,
        'updated_at', v_inquiry.updated_at, 'close_reason', v_inquiry.close_reason
    );
END;
$$;

REVOKE ALL ON FUNCTION public.triage_inquiry(uuid, timestamptz, text, uuid, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.triage_inquiry(uuid, timestamptz, text, uuid, text) TO authenticated;

CREATE FUNCTION public.link_inquiry(
    p_inquiry_id uuid, p_expected_updated_at timestamptz, p_link_mode text, p_lead_id uuid
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
    v_inquiry public.inquiries;
    v_lead public.leads;
    v_digits text;
    v_match uuid;
    v_conflict boolean;
    v_outcome text;
    v_action text;
BEGIN
    v_inquiry := public.lock_editable_inquiry(p_inquiry_id, p_expected_updated_at);
    IF NOT public.inquiry_can_access_leads(auth.uid()) THEN
        RAISE EXCEPTION 'Lead access required to associate an inquiry' USING ERRCODE = '42501';
    END IF;
    IF v_inquiry.lead_id IS NOT NULL OR v_inquiry.state = 'closed'
        OR p_link_mode IS NULL OR p_link_mode NOT IN ('link', 'create')
        OR (p_link_mode = 'link') IS DISTINCT FROM (p_lead_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Inquiry cannot be associated in this state' USING ERRCODE = '22023';
    END IF;

    v_digits := nullif(regexp_replace(v_inquiry.phone, '[^0-9]', '', 'g'), '');
    PERFORM public.lock_inquiry_identity(v_inquiry.email, v_digits);
    SELECT match.lead_id, match.conflicting_match INTO v_match, v_conflict
    FROM public.find_inquiry_lead(v_inquiry.email, v_digits, p_lead_id) AS match;

    IF p_link_mode = 'link' THEN
        IF v_conflict OR v_match IS NULL THEN
            RAISE EXCEPTION 'Inquiry association could not be verified' USING ERRCODE = '22023';
        END IF;
        SELECT lead.* INTO v_lead FROM public.leads AS lead
        WHERE lead.id = v_match AND lead.brief_payload->>'synthetic_benchmark' IS DISTINCT FROM 'true'
          AND lead.brief_payload->>'simulated' IS DISTINCT FROM 'true'
          AND (lower(btrim(lead.email)) = v_inquiry.email OR nullif(regexp_replace(lead.phone, '[^0-9]', '', 'g'), '') = v_digits)
          AND (v_inquiry.email IS NULL OR nullif(btrim(lead.email), '') IS NULL OR lower(btrim(lead.email)) = v_inquiry.email)
          AND (v_digits IS NULL OR nullif(regexp_replace(lead.phone, '[^0-9]', '', 'g'), '') IS NULL OR nullif(regexp_replace(lead.phone, '[^0-9]', '', 'g'), '') = v_digits)
        FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Inquiry association changed. Review the matching lead again.' USING ERRCODE = '40001';
        END IF;
        v_outcome := 'linked';
        v_action := 'MERGE_INQUIRY';
    ELSE
        IF v_conflict THEN
            RAISE EXCEPTION 'Conflicting contact details require correction before creating a lead' USING ERRCODE = '22023';
        END IF;
        PERFORM public.assert_inquiry_owner(v_inquiry.assigned_to, NULL);
        v_lead := public.create_inquiry_lead(v_inquiry, jsonb_build_object(
            'company_website', COALESCE(v_inquiry.brief->>'companyWebsite', v_inquiry.brief->>'website'),
            'industry', v_inquiry.brief->>'industry',
            'budget_bracket', COALESCE(v_inquiry.brief->>'budget', v_inquiry.brief->>'budget_amount')
        ));
        IF v_lead.id IS NULL THEN
            RAISE EXCEPTION 'A separate lead is unavailable for this inquiry' USING ERRCODE = '22023';
        END IF;
        v_outcome := 'created';
        v_action := 'NEW_LEAD';
    END IF;

    PERFORM public.assert_inquiry_owner(v_inquiry.assigned_to, v_lead.id);

    UPDATE public.inquiries AS inquiry
    SET lead_id = v_lead.id, outcome = v_outcome,
        updated_at = greatest(clock_timestamp(), inquiry.updated_at + interval '1 microsecond')
    WHERE inquiry.id = v_inquiry.id;

    INSERT INTO public.inquiry_activity (inquiry_id, actor_id, event_type, metadata)
    VALUES (v_inquiry.id, auth.uid(), 'linked', jsonb_build_object('lead_id', v_lead.id, 'outcome', v_outcome));

    INSERT INTO public.lead_activities (lead_id, actor_id, activity_type, description, metadata)
    VALUES (
        v_lead.id, auth.uid(), CASE WHEN v_outcome = 'created' THEN 'system_event' ELSE 'duplicate_inquiry' END,
        CASE WHEN v_outcome = 'created' THEN 'Lead created from inquiry after review' ELSE 'Inquiry linked to lead after review' END,
        jsonb_build_object('inquiry_id', v_inquiry.id, 'origin', v_inquiry.origin, 'action', v_action)
    );

    RETURN jsonb_build_object(
        'id', v_inquiry.id, 'inquiry_ref', v_inquiry.inquiry_ref, 'lead_id', v_lead.id,
        'lead_ref', v_lead.lead_id, 'outcome', v_outcome, 'action', v_action, 'replayed', false
    );
END;
$$;

REVOKE ALL ON FUNCTION public.link_inquiry(uuid, timestamptz, text, uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.link_inquiry(uuid, timestamptz, text, uuid) TO authenticated;

-- Preserve one observed original capture for known legacy markers. Lead creation time is
-- the only historical timestamp available here. It is never used to infer later submissions.
WITH identified AS (
    SELECT lead.*,
        public.project_inquiry_brief(lead.brief_payload)
            || jsonb_strip_nulls(jsonb_build_object('budget', COALESCE(
                nullif(btrim(lead.brief_payload->>'budget'), ''),
                nullif(btrim(lead.brief_payload->>'budget_amount'), ''),
                nullif(btrim(lead.budget_bracket), '')
            ))) AS historical_brief,
        CASE
            WHEN lead.brief_payload->>'source' = 'Contact Page Direct Inquiry'
                AND lead.brief_payload->>'receipt_id' LIKE 'MUBI-%' THEN 'contact'
            WHEN lead.source_detail = 'Start Project Brief Wizard (Multi-Service)'
                AND lead.brief_payload ? 'projectDescription' THEN 'start_project'
            WHEN lead.source_detail IN ('Conversational intake (chat pod)', 'Service enquiry and optional deliverables (chat pod v2)')
                AND lead.brief_payload ? 'projectDescription' THEN 'chat_pod'
            WHEN lead.source_detail = 'Hero Company Profile Download Modal' THEN 'website'
        END AS historical_origin
    FROM public.leads AS lead
    WHERE lead.brief_payload->>'synthetic_benchmark' IS DISTINCT FROM 'true'
      AND lead.brief_payload->>'simulated' IS DISTINCT FROM 'true'
      AND NOT (lead.brief_payload ? 'inquiry_origin')
      AND length(btrim(lead.name)) BETWEEN 1 AND 120
      AND (length(btrim(lead.email)) BETWEEN 1 AND 255 OR length(btrim(lead.phone)) BETWEEN 1 AND 50)
), backfilled AS (
    INSERT INTO public.inquiries (
        origin, received_at, name, email, phone, company, service_category, summary, brief, lead_id,
        outcome, is_historical
    )
    SELECT
        lead.historical_origin, lead.created_at, btrim(lead.name),
        CASE WHEN length(btrim(lead.email)) BETWEEN 1 AND 255 THEN lower(btrim(lead.email)) END,
        CASE WHEN length(btrim(lead.phone)) BETWEEN 1 AND 50 THEN btrim(lead.phone) END,
        left(nullif(btrim(lead.company), ''), 200), lead.service_category,
        left(COALESCE(
            nullif(btrim(lead.brief_payload->>'raw_message'), ''),
            nullif(btrim(lead.brief_payload->>'projectDescription'), ''),
            'Original message unavailable in imported history.'
        ), 12000),
        CASE
            WHEN octet_length(lead.historical_brief::text) <= 32768
                THEN lead.historical_brief
            ELSE '{}'::jsonb
        END,
        lead.id, 'linked', true
    FROM identified AS lead
    WHERE lead.historical_origin IS NOT NULL
    RETURNING id
)
INSERT INTO public.inquiry_activity (inquiry_id, event_type)
SELECT id, 'backfilled' FROM backfilled;
