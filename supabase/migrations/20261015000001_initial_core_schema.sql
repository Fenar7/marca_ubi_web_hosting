/**
 * Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
 * Migration: 20261015000001_initial_core_schema.sql
 * Phase: 1 (Database Architecture & Stored Logic Engine)
 * Sprint: 1.1 (Core Relational Schema, Domain Types & Table Constraints)
 * Target Engine: PostgreSQL 15+ (Supabase Managed PostgreSQL)
 * Description: Establishes foundational relational tables, sequence generators,
 *              integrity constraints, performance indexes, and initial reference seeds.
 */

-- Extensions Setup
-- uuid-ossp: Used for cryptographic UUID generation if needed alongside gen_random_uuid()
-- pg_trgm: Used for high-speed trigram text matching across lead names, companies, and phones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- User Profiles Table (Mirrors Supabase auth.users & powers Team Management)
-- Architectural Rationale: Mirrors the internal auth.users table in Supabase.
-- Separates authentication concerns from application domain data, roles, and job titles.
-- Cascading Rules: ON DELETE CASCADE ensures profile cleanup when auth user is purged.
-- Self-referential invited_by links new joiners to the inviting administrator.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'sales_manager', 'sales_executive', 'viewer')),
    job_title TEXT NOT NULL DEFAULT 'Commercial Desk',
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'invited')),
    avatar_url TEXT,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.profiles IS 'Agency team directory mirroring auth.users, storing authorization roles, job titles, and operational account status.';
COMMENT ON COLUMN public.profiles.role IS 'Authorization role determining RLS data access boundaries across the agency CRM.';
COMMENT ON COLUMN public.profiles.status IS 'Account state: active staff member, suspended (locked out), or invited (awaiting onboarding).';
COMMENT ON COLUMN public.profiles.invited_by IS 'Self-referential foreign key indicating the administrator who provisioned the account.';

-- Lead Sources Table (Commercial Acquisition Channels)
-- Architectural Rationale: Catalog of marketing and inbound acquisition sources.
-- Color codes provide visual indicators matching the dark luxury brand design tokens.
CREATE TABLE IF NOT EXISTS public.lead_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color_code TEXT NOT NULL DEFAULT '#ff6100',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.lead_sources IS 'Catalog of commercial lead acquisition channels (e.g., Website Brief, WhatsApp Inbound, Referral, Founder Outreach).';
COMMENT ON COLUMN public.lead_sources.color_code IS 'Hexadecimal color token for badge presentation on the leads data grid.';

-- Funnel Statuses Table (Commercial Stage State Machine)
-- Architectural Rationale: Represents the pipeline stages of the commercial funnel.
-- Every status is bound to one of 4 macro-buckets: open, potential, converted, lost.
-- The sort_order column ensures deterministic presentation in Kanban boards and filter bars.
CREATE TABLE IF NOT EXISTS public.funnel_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    bucket TEXT NOT NULL CHECK (bucket IN ('open', 'potential', 'converted', 'lost')),
    color_code TEXT NOT NULL DEFAULT '#ffffff',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.funnel_statuses IS 'Ordered pipeline progression stages categorized into the 4 commercial macro-buckets: open, potential, converted, and lost.';
COMMENT ON COLUMN public.funnel_statuses.bucket IS 'Commercial macro-bucket classifying pipeline health and revenue aggregation.';
COMMENT ON COLUMN public.funnel_statuses.sort_order IS 'Integer sort weight for visual sequence ordering in CRM views.';

-- Atomic Human-Readable Sequence Generator
-- Architectural Rationale: Monotonically increasing BIGINT sequence starting at 1001.
-- Executed via nextval() outside transaction lock blocks to ensure zero thread contention
-- during concurrent webhook ingestion.
CREATE SEQUENCE IF NOT EXISTS public.lead_code_seq 
    AS BIGINT
    START WITH 1001 
    INCREMENT BY 1 
    NO CYCLE;

COMMENT ON SEQUENCE public.lead_code_seq IS 'Atomic, monotonically increasing sequence generator for generating client-facing lead identifiers (LD-1001).';

-- Leads Table (Comprehensive Commercial Client & Brief Dossier)
-- Architectural Rationale: Central registry for all commercial deals and enterprise inquiries.
-- Constraints:
--   - chk_lead_contact_info: Enforces non-empty, trimmed phone or email. Guards against whitespace/empty string bypass.
--   - expected_value: Explicitly NUMERIC(12,2) with non-negative check to avoid float precision drift.
--   - lead_source_id & status_id: ON DELETE RESTRICT prevents accidental deletion of active reference lookups.
--   - assigned_to: ON DELETE SET NULL ensures leads revert to unassigned if a staff member is removed.
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id TEXT NOT NULL UNIQUE DEFAULT ('LD-' || nextval('public.lead_code_seq')::text),
    name TEXT NOT NULL,
    company TEXT,
    company_website TEXT,
    industry TEXT,
    phone TEXT,
    email TEXT,
    preferred_channel TEXT NOT NULL DEFAULT 'Phone' CHECK (preferred_channel IN ('Phone', 'WhatsApp', 'Email', 'Meeting')),
    lead_source_id UUID NOT NULL REFERENCES public.lead_sources(id) ON DELETE RESTRICT,
    source_detail TEXT,
    service_category TEXT NOT NULL DEFAULT 'Web & Digital' CHECK (service_category IN ('Branding', 'Web & Digital', 'Mobile Apps', 'UI/UX Design', 'Full-Suite Advisory', 'Other')),
    budget_bracket TEXT,
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    status_id UUID NOT NULL REFERENCES public.funnel_statuses(id) ON DELETE RESTRICT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    expected_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (expected_value >= 0),
    next_follow_up TIMESTAMPTZ,
    lost_reason TEXT,
    revisit_date DATE,
    notes TEXT,
    brief_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    converted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    -- Table-level constraint: Enforces viable, trimmed contact coordinate availability
    CONSTRAINT chk_lead_contact_info CHECK (
        (phone IS NOT NULL AND length(trim(phone)) > 0) OR
        (email IS NOT NULL AND length(trim(email)) > 0)
    )
);

-- Idempotent constraint upgrade guard for existing tables
DO $$
BEGIN
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS chk_lead_contact_info;
    ALTER TABLE public.leads ADD CONSTRAINT chk_lead_contact_info CHECK (
        (phone IS NOT NULL AND length(trim(phone)) > 0) OR
        (email IS NOT NULL AND length(trim(email)) > 0)
    );
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

COMMENT ON TABLE public.leads IS 'Core agency client record containing business profile, engagement scope, commercial valuation, and funnel stage.';
COMMENT ON COLUMN public.leads.lead_id IS 'Immutable human-readable identifier prefixed with LD- generated via atomic sequence.';
COMMENT ON COLUMN public.leads.brief_payload IS 'Serialized raw JSON submission from /start-project brief wizard or CompanyProfileModal.';
COMMENT ON COLUMN public.leads.expected_value IS 'Contract or deal valuation in base currency units (NUMERIC 12,2 precision).';

-- Lead Activities Table (Chronological Touchpoint & Compliance Audit Trail)
-- Architectural Rationale: Append-only event store capturing all communications, stage
-- advances, reassignment events, and commercial updates on a deal.
-- ON DELETE CASCADE ensures cleanup if an authorized admin deletes a lead record.
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'status_change', 'priority_change', 'reassignment', 
        'call_logged', 'whatsapp_sent', 'meeting_notes', 
        'note_added', 'follow_up_scheduled', 'system_event', 'field_update'
    )),
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.lead_activities IS 'Immutable chronological ledger of all customer communications, sales notes, stage transitions, and field mutations.';
COMMENT ON COLUMN public.lead_activities.metadata IS 'Structured JSON payload storing state transitions (old_value, new_value) or communication metadata.';

-- Team Audit Logs Table (Administrative Governance & Staff Accountability)
-- Architectural Rationale: Isolated compliance log capturing administrative governance events
-- such as team member onboarding, role changes, suspensions, and bulk lead reassignments.
CREATE TABLE IF NOT EXISTS public.team_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN (
        'user_created', 'role_changed', 'user_suspended', 
        'user_activated', 'leads_bulk_reassigned', 'password_reset_dispatched'
    )),
    target_user_email TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.team_audit_logs IS 'Tamper-proof compliance log capturing all administrative user provisioning, privilege escalation, and reassignment actions.';

-- Performance & Foreign Key Indexes
-- Index 1: Composite filter for assigned rep pipeline views
CREATE INDEX IF NOT EXISTS idx_leads_assigned_status 
    ON public.leads (assigned_to, status_id);

-- Index 2: Chronological status pipeline rendering
CREATE INDEX IF NOT EXISTS idx_leads_status_created 
    ON public.leads (status_id, created_at DESC);

-- Index 3: Partial index for overdue follow-up escalations
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up 
    ON public.leads (next_follow_up) 
    WHERE next_follow_up IS NOT NULL;

-- Index 4: Foreign key index on lead_source_id for fast referential checks and channel filtering
CREATE INDEX IF NOT EXISTS idx_leads_source_id 
    ON public.leads (lead_source_id);

-- Index 5: Pipeline priority filter index
CREATE INDEX IF NOT EXISTS idx_leads_priority 
    ON public.leads (priority);

-- Index 6: Staff directory role lookup index
CREATE INDEX IF NOT EXISTS idx_profiles_role 
    ON public.profiles (role);

-- Index 7: Staff account operational status index
CREATE INDEX IF NOT EXISTS idx_profiles_status 
    ON public.profiles (status);

-- Index 8: Chronological touchpoint lookup by lead
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_created 
    ON public.lead_activities (lead_id, created_at DESC);

-- Index 9: Audit log chronological query index
CREATE INDEX IF NOT EXISTS idx_team_audit_logs_created 
    ON public.team_audit_logs (created_at DESC);

-- Index 10-13: Fast trigram text search for client company and contact coordinates
CREATE INDEX IF NOT EXISTS idx_leads_company_trgm 
    ON public.leads USING gin (company gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_leads_name_trgm 
    ON public.leads USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_leads_email_trgm 
    ON public.leads USING gin (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_leads_phone_trgm 
    ON public.leads USING gin (phone gin_trgm_ops);

-- Initial Reference Data Seeds
-- Deterministic seed UUIDs are provided to allow resilient fallback assignment
-- in inbound webhook APIs (/api/sales-funnel/ingest) without database lookup round-trips.
INSERT INTO public.lead_sources (id, name, color_code, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Website Form', '#ff6100', true),
    ('a0000000-0000-0000-0000-000000000002', 'WhatsApp Inbound', '#22c55e', true),
    ('a0000000-0000-0000-0000-000000000003', 'Direct Referral', '#3b82f6', true),
    ('a0000000-0000-0000-0000-000000000004', 'Founder / Executive Outreach', '#a855f7', true),
    ('a0000000-0000-0000-0000-000000000005', 'Cold Campaign', '#eab308', true)
ON CONFLICT (name) DO UPDATE SET
    color_code = EXCLUDED.color_code,
    is_active = EXCLUDED.is_active;

-- The initial 8 stages map directly to the 4 commercial macro-buckets.
-- 'New' status (UUID b0000000-0000-0000-0000-000000000001) serves as the
-- immutable default state for all automated inbound web briefs.
INSERT INTO public.funnel_statuses (id, name, bucket, color_code, sort_order, is_active)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'New', 'open', '#475569', 10, true),
    ('b0000000-0000-0000-0000-000000000002', 'Contacted', 'open', '#94a3b8', 20, true),
    ('b0000000-0000-0000-0000-000000000003', 'On Hold', 'open', '#f59e0b', 30, true),
    ('b0000000-0000-0000-0000-000000000004', 'Qualified', 'potential', '#38bdf8', 40, true),
    ('b0000000-0000-0000-0000-000000000005', 'Proposal Sent', 'potential', '#818cf8', 50, true),
    ('b0000000-0000-0000-0000-000000000006', 'Negotiation', 'potential', '#ff6100', 60, true),
    ('b0000000-0000-0000-0000-000000000007', 'Converted', 'converted', '#22c55e', 70, true),
    ('b0000000-0000-0000-0000-000000000008', 'Lost', 'lost', '#ef4444', 80, true)
ON CONFLICT (name) DO UPDATE SET
    bucket = EXCLUDED.bucket,
    color_code = EXCLUDED.color_code,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;
