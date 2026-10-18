/**
 * Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
 * Migration: 20261019000002_client_works_projects_schema.sql
 * Phase: 1 (Client Works Relational Engine & Auto-Conversion Trigger)
 * Description: Implements public.client_works table, monotonic PRJ-1001 code sequence,
 *              milestone JSONB schema, auto-spawn trigger on deal conversion,
 *              and comprehensive Row Level Security policies.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

-- 1. Atomic Sequence for Project Codes (PRJ-1001)
CREATE SEQUENCE IF NOT EXISTS public.project_code_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

COMMENT ON SEQUENCE public.project_code_seq IS 'Atomic monotonically increasing sequence generator for client project codes (PRJ-1001).';

CREATE OR REPLACE FUNCTION public.generate_project_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN 'PRJ-' || nextval('public.project_code_seq')::text;
END;
$$;

COMMENT ON FUNCTION public.generate_project_code() IS 'Generates unique human-readable client project codes.';

-- 2. Client Works Relational Table
CREATE TABLE IF NOT EXISTS public.client_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code TEXT NOT NULL UNIQUE DEFAULT public.generate_project_code(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    company TEXT,
    service_scope TEXT NOT NULL DEFAULT 'Branding & Digital Infrastructure',
    contract_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    delivery_stage TEXT NOT NULL DEFAULT 'kickoff' CHECK (delivery_stage IN (
        'kickoff', 'strategy', 'design_ui_ux', 'development', 'review_qa', 'delivered'
    )),
    health_status TEXT NOT NULL DEFAULT 'on_track' CHECK (health_status IN (
        'on_track', 'at_risk', 'blocked', 'completed'
    )),
    creative_lead_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tech_lead_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_delivery_date DATE,
    kickoff_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.client_works IS 'Post-conversion active client projects, milestone progress, and creative delivery tracking.';
COMMENT ON COLUMN public.client_works.delivery_stage IS 'Active production stage: kickoff, strategy, design_ui_ux, development, review_qa, delivered.';
COMMENT ON COLUMN public.client_works.health_status IS 'Operational delivery status: on_track, at_risk, blocked, completed.';

-- 3. Automatic UTC Timestamp Synchronization Trigger
DROP TRIGGER IF EXISTS trg_client_works_updated_at ON public.client_works;
CREATE TRIGGER trg_client_works_updated_at
BEFORE UPDATE ON public.client_works
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Auto-Spawn Trigger: Spawns Client Work Entry When Lead is Converted
CREATE OR REPLACE FUNCTION public.auto_spawn_client_work_on_conversion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_bucket TEXT;
    existing_work_id UUID;
    default_scope TEXT;
    initial_milestones JSONB;
BEGIN
    -- Query the bucket of the newly assigned funnel status
    SELECT bucket INTO target_bucket
    FROM public.funnel_statuses
    WHERE id = NEW.status_id;

    -- Trigger condition: Deal transitioned to converted bucket or converted_at is newly populated
    IF (target_bucket = 'converted' OR NEW.converted_at IS NOT NULL) THEN
        -- Verify whether a client work engagement is already associated with this deal
        SELECT id INTO existing_work_id
        FROM public.client_works
        WHERE lead_id = NEW.id;

        IF existing_work_id IS NULL THEN
            default_scope := COALESCE(NEW.service_category, 'Branding & Digital Infrastructure');
            
            -- Standard 5-stage agency milestone checklist
            initial_milestones := jsonb_build_array(
                jsonb_build_object('id', 'm1', 'title', 'Kickoff & Brand Brief Alignment', 'status', 'completed', 'completed_at', timezone('utc'::text, now())),
                jsonb_build_object('id', 'm2', 'title', 'Creative Strategy & Architecture Blueprint', 'status', 'in_progress', 'completed_at', null),
                jsonb_build_object('id', 'm3', 'title', 'Design Systems & UI/UX High-Fidelity Specs', 'status', 'pending', 'completed_at', null),
                jsonb_build_object('id', 'm4', 'title', 'Production Build & Infrastructure Engineering', 'status', 'pending', 'completed_at', null),
                jsonb_build_object('id', 'm5', 'title', 'Client QA, Security Audit & Live Deployment', 'status', 'pending', 'completed_at', null)
            );

            INSERT INTO public.client_works (
                lead_id,
                client_name,
                company,
                service_scope,
                contract_value,
                delivery_stage,
                health_status,
                creative_lead_id,
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
                NEW.assigned_to,
                initial_milestones,
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '45 days'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_spawn_client_work_on_conversion() IS 'Automatically instantiates a client_works engagement with milestone checklist when a deal reaches converted status.';

DROP TRIGGER IF EXISTS trg_auto_spawn_client_work ON public.leads;
CREATE TRIGGER trg_auto_spawn_client_work
AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.auto_spawn_client_work_on_conversion();

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_client_works_delivery_stage 
    ON public.client_works (delivery_stage);

CREATE INDEX IF NOT EXISTS idx_client_works_health_status 
    ON public.client_works (health_status);

CREATE INDEX IF NOT EXISTS idx_client_works_lead_id 
    ON public.client_works (lead_id);

CREATE INDEX IF NOT EXISTS idx_client_works_creative_lead 
    ON public.client_works (creative_lead_id) 
    WHERE creative_lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_works_tech_lead 
    ON public.client_works (tech_lead_id) 
    WHERE tech_lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_works_created_at_desc 
    ON public.client_works (created_at DESC);

-- 6. Row Level Security Policies
ALTER TABLE public.client_works ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated active personnel can select client works
DROP POLICY IF EXISTS "client_works_select_policy" ON public.client_works;
CREATE POLICY "client_works_select_policy" ON public.client_works
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND status = 'active'
    )
);

-- Policy 2: Admins, Sales Managers, and assigned creative/tech leads can update client works
DROP POLICY IF EXISTS "client_works_update_policy" ON public.client_works;
CREATE POLICY "client_works_update_policy" ON public.client_works
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND status = 'active'
          AND (
              role IN ('admin', 'sales_manager') OR
              id = client_works.creative_lead_id OR
              id = client_works.tech_lead_id
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND status = 'active'
          AND (
              role IN ('admin', 'sales_manager') OR
              id = client_works.creative_lead_id OR
              id = client_works.tech_lead_id
          )
    )
);

-- Policy 3: Leadership can insert client works manually
DROP POLICY IF EXISTS "client_works_insert_policy" ON public.client_works;
CREATE POLICY "client_works_insert_policy" ON public.client_works
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND status = 'active'
          AND role IN ('admin', 'sales_manager')
    )
);

-- Policy 4: Only Admins can delete client works
DROP POLICY IF EXISTS "client_works_delete_policy" ON public.client_works;
CREATE POLICY "client_works_delete_policy" ON public.client_works
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND status = 'active'
          AND role = 'admin'
    )
);
