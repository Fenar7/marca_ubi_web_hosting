-- Hosted review records belong to the normal queue with a distinct, server-owned marker.
ALTER TABLE public.inquiries
    ADD COLUMN test_batch text CHECK (test_batch ~ '^[a-z0-9][a-z0-9-]{0,63}$');

CREATE INDEX inquiries_test_batch ON public.inquiries (test_batch)
    WHERE test_batch IS NOT NULL;

-- A test inquiry may only link to a test lead from its own batch, including through RPCs.
CREATE FUNCTION public.enforce_inquiry_test_lead()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
    IF NEW.test_batch IS NOT NULL AND NEW.lead_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.leads AS lead
        WHERE lead.id = NEW.lead_id
          AND lead.brief_payload->>'inquiry_test_batch' = NEW.test_batch
          AND lead.brief_payload->>'synthetic_benchmark' = 'true'
    ) THEN
        RAISE EXCEPTION 'Test inquiries can only link to leads from the same test batch'
            USING ERRCODE = '22023';
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_inquiry_test_lead() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER inquiry_test_lead_guard
    BEFORE INSERT OR UPDATE OF lead_id, test_batch ON public.inquiries
    FOR EACH ROW EXECUTE FUNCTION public.enforce_inquiry_test_lead();
