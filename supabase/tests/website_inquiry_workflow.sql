-- Run with psql -v ON_ERROR_STOP=1 against a disposable database whose migrations are applied.
-- All inserted data and injected failures are rolled back.
BEGIN;

INSERT INTO auth.users (id, email) VALUES
    ('f3000000-0000-4000-8000-000000000001', 'inquiry-admin@example.invalid'),
    ('f3000000-0000-4000-8000-000000000002', 'inquiry-manager@example.invalid'),
    ('f3000000-0000-4000-8000-000000000003', 'inquiry-exec@example.invalid'),
    ('f3000000-0000-4000-8000-000000000004', 'inquiry-viewer@example.invalid'),
    ('f3000000-0000-4000-8000-000000000005', 'inquiry-suspended@example.invalid');

INSERT INTO public.profiles (id, email, full_name, role, status, allowed_tabs) VALUES
    ('f3000000-0000-4000-8000-000000000001', 'inquiry-admin@example.invalid', 'Fixture Admin', 'admin', 'active', ARRAY['users','settings','ingestion']),
    ('f3000000-0000-4000-8000-000000000002', 'inquiry-manager@example.invalid', 'Fixture Manager', 'sales_manager', 'active', ARRAY['ingestion']),
    ('f3000000-0000-4000-8000-000000000003', 'inquiry-exec@example.invalid', 'Fixture Executive', 'sales_executive', 'active', ARRAY['ingestion','leads']),
    ('f3000000-0000-4000-8000-000000000004', 'inquiry-viewer@example.invalid', 'Fixture Viewer', 'viewer', 'active', ARRAY['ingestion']),
    ('f3000000-0000-4000-8000-000000000005', 'inquiry-suspended@example.invalid', 'Fixture Suspended', 'sales_manager', 'suspended', ARRAY['ingestion','leads']);

CREATE TEMP TABLE inquiry_fixture_result (fixture text PRIMARY KEY, result jsonb NOT NULL);
GRANT SELECT, INSERT ON inquiry_fixture_result TO authenticated, service_role;

SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role', 'service_role', true), set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);

DO $$
DECLARE
    v_payload jsonb := '{
        "origin":"contact", "idempotency_key":"fixture-contact-1", "name":"Fixture Contact",
        "email":"  FIXTURE-contact@example.invalid ", "summary":"First project inquiry",
        "brief":{"ip":"127.0.0.1","raw_message":"A real question","services":["Design"]}
    }';
    v_first jsonb;
    v_repeat jsonb;
BEGIN
    v_first := public.record_inquiry(v_payload);
    ASSERT v_first->>'outcome' = 'created';
    ASSERT v_first->>'action' = 'NEW_LEAD';
    ASSERT v_first->>'replayed' = 'false';
    ASSERT (v_first->>'inquiry_ref') LIKE 'INQ-%';
    ASSERT public.record_inquiry(v_payload) = (v_first || '{"replayed":true}'::jsonb);

    BEGIN
        PERFORM public.record_inquiry(v_payload || '{"summary":"Different content"}'::jsonb);
        RAISE EXCEPTION 'Conflicting replay was incorrectly accepted';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;

    v_repeat := public.record_inquiry(v_payload || '{
        "idempotency_key":"fixture-contact-2", "origin":"start_project", "summary":"Second inquiry"
    }'::jsonb);
    ASSERT v_repeat->>'action' = 'MERGE_INQUIRY';
    ASSERT v_repeat->>'lead_id' = v_first->>'lead_id';
    ASSERT v_repeat->>'id' <> v_first->>'id';
    INSERT INTO inquiry_fixture_result VALUES ('first', v_first), ('repeat', v_repeat);

    BEGIN
        PERFORM public.record_inquiry(v_payload || '{
            "origin":"manual", "idempotency_key":"fixture-false-manual", "original_channel":"phone"
        }'::jsonb);
        RAISE EXCEPTION 'Service could impersonate a manual caller';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END;
$$;

RESET ROLE;

DO $$
DECLARE
    v_first jsonb := (SELECT result FROM inquiry_fixture_result WHERE fixture = 'first');
    v_id uuid := (v_first->>'id')::uuid;
    v_lead uuid := (v_first->>'lead_id')::uuid;
BEGIN
    ASSERT (SELECT count(*) FROM public.inquiries WHERE lead_id = v_lead) = 2;
    ASSERT (SELECT inquiry_count = 2 AND priority = 'High' FROM public.leads WHERE id = v_lead);
    ASSERT (SELECT NOT (brief ? 'ip') AND brief->>'raw_message' = 'A real question'
        FROM public.inquiries WHERE id = v_id);
    ASSERT (SELECT count(*) FROM public.inquiry_activity WHERE inquiry_id = v_id) = 1;
END;
$$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000001', true);
SELECT set_config('request.jwt.claims', '{"sub":"f3000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

DO $$
BEGIN
    ASSERT (SELECT count(*) FROM public.find_inquiry_matches('  FIXTURE-CONTACT@example.invalid  ', NULL)) = 1;
    ASSERT NOT EXISTS (SELECT 1 FROM public.find_inquiry_matches(NULL, NULL));
END;
$$;

DO $$
DECLARE
    v_payload jsonb := '{
        "origin":"manual", "idempotency_key":"fixture-manual-1", "name":"Fixture Manual",
        "email":"fixture-manual@example.invalid", "summary":"Third inquiry", "original_channel":"phone",
        "link_mode":"review", "assigned_to":"f3000000-0000-4000-8000-000000000003"
    }';
    v_result jsonb;
    v_inquiry public.inquiries;
    v_updated jsonb;
BEGIN
    v_result := public.record_inquiry(v_payload);
    ASSERT v_result->>'outcome' = 'needs_review';
    SELECT * INTO v_inquiry FROM public.inquiries WHERE id = (v_result->>'id')::uuid;

    BEGIN
        PERFORM public.record_inquiry(v_payload || '{"idempotency_key":"fixture-invalid-channel","original_channel":"contact"}');
        RAISE EXCEPTION 'Manual caller supplied an invalid channel';
    EXCEPTION WHEN invalid_parameter_value THEN NULL;
    END;

    BEGIN
        PERFORM public.record_inquiry(v_payload || '{"idempotency_key":"fixture-false-public","origin":"contact"}');
        RAISE EXCEPTION 'Manual caller impersonated public origin';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    BEGIN
        UPDATE public.inquiries SET state = 'reviewed' WHERE id = v_inquiry.id;
        RAISE EXCEPTION 'Authenticated role bypassed triage RPC';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    v_updated := public.triage_inquiry(v_inquiry.id, v_inquiry.updated_at, 'reviewed', v_inquiry.assigned_to, NULL);
    ASSERT v_updated->>'state' = 'reviewed';

    BEGIN
        PERFORM public.triage_inquiry(v_inquiry.id, v_inquiry.updated_at, 'new', NULL, NULL);
        RAISE EXCEPTION 'Stale triage overwrote the current state';
    EXCEPTION WHEN serialization_failure THEN NULL;
    END;

    BEGIN
        PERFORM public.triage_inquiry(v_inquiry.id, (v_updated->>'updated_at')::timestamptz, 'closed', NULL, NULL);
        RAISE EXCEPTION 'Inquiry closed without a reason';
    EXCEPTION WHEN invalid_parameter_value THEN NULL;
    END;

    v_result := public.link_inquiry(v_inquiry.id, (v_updated->>'updated_at')::timestamptz, 'create', NULL);
    ASSERT v_result->>'outcome' = 'created';
    ASSERT public.record_inquiry(v_payload)->>'outcome' = 'needs_review';
    ASSERT (SELECT count(*) FROM public.inquiry_activity WHERE inquiry_id = v_inquiry.id) = 3;
    INSERT INTO inquiry_fixture_result VALUES ('owned', v_result);
END;
$$;

SELECT set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000002', true);
SELECT set_config('request.jwt.claims', '{"sub":"f3000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

DO $$
BEGIN
    ASSERT NOT EXISTS (SELECT 1 FROM public.find_inquiry_matches('fixture-contact@example.invalid', NULL));
END;
$$;

DO $$
DECLARE
    v_result jsonb;
    v_inquiry public.inquiries;
BEGIN
    v_result := public.record_inquiry('{
        "origin":"manual", "original_channel":"email", "idempotency_key":"fixture-manager-1",
        "name":"Fixture Manager Contact", "email":"fixture-manager-contact@example.invalid", "summary":"Fourth inquiry"
    }');
    ASSERT v_result->>'outcome' = 'needs_review';
    SELECT * INTO v_inquiry FROM public.inquiries WHERE id = (v_result->>'id')::uuid;
    BEGIN
        PERFORM public.link_inquiry(v_inquiry.id, v_inquiry.updated_at, 'create', NULL);
        RAISE EXCEPTION 'Manager without Leads tab created a lead';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END;
$$;

SELECT set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000003', true);
SELECT set_config('request.jwt.claims', '{"sub":"f3000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM public.inquiries WHERE email = 'fixture-contact@example.invalid') = 0;
    ASSERT (SELECT count(*) FROM public.inquiries WHERE email = 'fixture-manual@example.invalid') = 1;
END;
$$;

SELECT set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000004', true);
SELECT set_config('request.jwt.claims', '{"sub":"f3000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
DO $$
DECLARE
    v_inquiry public.inquiries;
BEGIN
    SELECT * INTO v_inquiry FROM public.inquiries WHERE email = 'fixture-manual@example.invalid';
    ASSERT FOUND;
    BEGIN
        PERFORM public.triage_inquiry(v_inquiry.id, v_inquiry.updated_at, 'reviewed', NULL, NULL);
        RAISE EXCEPTION 'Viewer mutated inquiry';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        PERFORM * FROM public.inquiry_receipts;
        RAISE EXCEPTION 'Viewer could inspect idempotency data';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END;
$$;

SELECT set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000005', true);
SELECT set_config('request.jwt.claims', '{"sub":"f3000000-0000-4000-8000-000000000005","role":"authenticated"}', true);
DO $$
BEGIN
    ASSERT NOT EXISTS (SELECT 1 FROM public.inquiries);
END;
$$;

RESET ROLE;

CREATE FUNCTION pg_temp.reject_fixture_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'fixture audit failed' USING ERRCODE = 'P0001';
END;
$$;
CREATE TRIGGER reject_fixture_audit BEFORE INSERT ON public.inquiry_activity
FOR EACH ROW EXECUTE FUNCTION pg_temp.reject_fixture_audit();

SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role', 'service_role', true), set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
DO $$
BEGIN
    BEGIN
        PERFORM public.record_inquiry('{
            "origin":"contact", "idempotency_key":"fixture-audit-failure", "name":"Fixture Rollback",
            "email":"fixture-audit-rollback@example.invalid","summary":"Must not persist"
        }');
        RAISE EXCEPTION 'Expected audit failure did not occur' USING ERRCODE = 'P0002';
    EXCEPTION WHEN raise_exception THEN
        ASSERT SQLERRM = 'fixture audit failed';
    END;
END;
$$;

RESET ROLE;
DO $$
BEGIN
    ASSERT NOT EXISTS (SELECT 1 FROM public.inquiries WHERE email = 'fixture-audit-rollback@example.invalid');
    ASSERT NOT EXISTS (SELECT 1 FROM public.leads WHERE email = 'fixture-audit-rollback@example.invalid');
    ASSERT NOT EXISTS (SELECT 1 FROM public.inquiry_receipts WHERE idempotency_key = 'fixture-audit-failure');
END;
$$;

ROLLBACK;
