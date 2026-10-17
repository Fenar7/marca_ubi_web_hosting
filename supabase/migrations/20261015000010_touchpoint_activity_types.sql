-- Migration: 20261015000010_touchpoint_activity_types.sql
-- Description: Expands public.lead_activities activity_type check constraint to support
--              omnichannel touchpoint logging for 'email_sent' and 'meeting_held'.
-- Author: Fenar7 <86710532+Fenar7@users.noreply.github.com>

ALTER TABLE public.lead_activities 
DROP CONSTRAINT IF EXISTS lead_activities_activity_type_check;

ALTER TABLE public.lead_activities 
ADD CONSTRAINT lead_activities_activity_type_check CHECK (
    activity_type IN (
        'status_change', 'priority_change', 'reassignment', 
        'call_logged', 'email_sent', 'meeting_held', 'meeting_notes', 
        'whatsapp_sent', 'note_added', 'follow_up_scheduled', 'system_event', 
        'field_update', 'duplicate_inquiry'
    )
);

COMMENT ON CONSTRAINT lead_activities_activity_type_check ON public.lead_activities 
IS 'Enforces valid omnichannel touchpoints, commercial stage transitions, and audit events.';
