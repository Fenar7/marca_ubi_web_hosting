-- Migration: 20261015000009_deduplication_and_inquiry_engine.sql
-- Description: Schema enhancements for Sprint 5.2 Smart Deduplication State Machine:
--              1. Adds inquiry_count column to public.leads to track repeat inquiries.
--              2. Expands public.lead_activities check constraint to include 'duplicate_inquiry'.
--              3. Creates composite index for high-performance deduplication lookups.
-- Author: Fenar7 <86710532+Fenar7@users.noreply.github.com>

-- 1. Add inquiry_count column to public.leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS inquiry_count INT NOT NULL DEFAULT 1 CHECK (inquiry_count >= 1);

COMMENT ON COLUMN public.leads.inquiry_count IS 'Cumulative count of prospect inquiries received across identical contact coordinates.';

-- 2. Expand public.lead_activities check constraint to support 'duplicate_inquiry'
ALTER TABLE public.lead_activities 
DROP CONSTRAINT IF EXISTS lead_activities_activity_type_check;

ALTER TABLE public.lead_activities 
ADD CONSTRAINT lead_activities_activity_type_check CHECK (
    activity_type IN (
        'status_change', 'priority_change', 'reassignment', 
        'call_logged', 'whatsapp_sent', 'meeting_notes', 
        'note_added', 'follow_up_scheduled', 'system_event', 
        'field_update', 'duplicate_inquiry'
    )
);

-- 3. High-performance composite index for duplicate email & phone seeks
CREATE INDEX IF NOT EXISTS idx_leads_dedup_lookup 
ON public.leads (lower(trim(email)), phone);

COMMENT ON INDEX public.idx_leads_dedup_lookup IS 'Composite functional B-tree index enabling sub-5ms deduplication lookups on normalized email and phone.';
