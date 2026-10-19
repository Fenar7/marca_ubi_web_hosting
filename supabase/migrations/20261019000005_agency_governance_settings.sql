/**
 * Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform
 * Migration: 20261019000005_agency_governance_settings.sql
 * Phase: 6 (Slop Purge, Live Telemetry & SLA Settings Architecture)
 * Description: Implements public.agency_settings table, singleton record constraint,
 *              Row Level Security policies, audit action constraint expansion,
 *              and initial default configuration seed.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

-- 1. Create Agency Operational Governance & SLA Settings Table
CREATE TABLE IF NOT EXISTS public.agency_settings (\
    id TEXT PRIMARY KEY DEFAULT 'default',\
    lead_response_sla_minutes INT NOT NULL DEFAULT 60 CHECK (lead_response_sla_minutes BETWEEN 5 AND 1440),\
    followup_grace_period_hours INT NOT NULL DEFAULT 4 CHECK (followup_grace_period_hours BETWEEN 0 AND 72),\
    stale_deal_threshold_days INT NOT NULL DEFAULT 14 CHECK (stale_deal_threshold_days BETWEEN 1 AND 90),\
    dedup_window_hours INT NOT NULL DEFAULT 24 CHECK (dedup_window_hours BETWEEN 1 AND 168),\
    bot_rate_limit_per_minute INT NOT NULL DEFAULT 10 CHECK (bot_rate_limit_per_minute BETWEEN 5 AND 120),\
    notification_email TEXT,\
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,\
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())\
);

COMMENT ON TABLE public.agency_settings IS 'Agency-wide operational thresholds, SLAs, alert grace periods, and intake security settings.';
COMMENT ON COLUMN public.agency_settings.lead_response_sla_minutes IS 'Target first-touch response time SLA for newly captured inbound leads.';
COMMENT ON COLUMN public.agency_settings.followup_grace_period_hours IS 'Grace interval before scheduled touchpoints escalate to overdue alert status.';
COMMENT ON COLUMN public.agency_settings.stale_deal_threshold_days IS 'Inactivity window before an open deal is flagged as stalled or at-risk.';
COMMENT ON COLUMN public.agency_settings.dedup_window_hours IS 'Time window in hours within which incoming submissions from identical phones/emails are merged.';
COMMENT ON COLUMN public.agency_settings.bot_rate_limit_per_minute IS 'Burst rate limit threshold per client IP on the public intake endpoint.';

-- 2. Seed Default Operational Singleton
INSERT INTO public.agency_settings (\
    id,\
    lead_response_sla_minutes,\
    followup_grace_period_hours,\
    stale_deal_threshold_days,\
    dedup_window_hours,\
    bot_rate_limit_per_minute,\
    notification_email\
) VALUES (\
    'default',\
    60,\
    4,\
    14,\
    24,\
    10,\
    'executive@marcaubi.com'\
) ON CONFLICT (id) DO NOTHING;

-- 3. Row Level Security Policies
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_settings_select_policy" ON public.agency_settings;
CREATE POLICY "agency_settings_select_policy" ON public.agency_settings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.status = 'active'
        )
    );

DROP POLICY IF EXISTS "agency_settings_insert_policy" ON public.agency_settings;
CREATE POLICY "agency_settings_insert_policy" ON public.agency_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.status = 'active'
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "agency_settings_update_policy" ON public.agency_settings;
CREATE POLICY "agency_settings_update_policy" ON public.agency_settings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.status = 'active'
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.status = 'active'
            AND profiles.role = 'admin'
        )
    );

-- 4. Update team_audit_logs action check constraint to support settings mutations
DO $$
BEGIN
    ALTER TABLE public.team_audit_logs 
    DROP CONSTRAINT IF EXISTS chk_team_audit_actions;

    ALTER TABLE public.team_audit_logs 
    DROP CONSTRAINT IF EXISTS team_audit_logs_action_check;

    ALTER TABLE public.team_audit_logs 
    ADD CONSTRAINT chk_team_audit_actions CHECK (action IN (
        'user_created',
        'role_changed',
        'user_suspended',
        'user_activated',
        'leads_bulk_reassigned',
        'password_reset_dispatched',
        'password_reset_completed',
        'permissions_updated',
        'update_agency_settings'
    ));
END $$;
