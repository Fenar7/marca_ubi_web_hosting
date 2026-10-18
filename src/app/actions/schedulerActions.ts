'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/app/lib/supabase/server';
import { CrmUserRole } from '@/types/crm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ON_HOLD_STATUS_ID = 'b0000000-0000-0000-0000-000000000003';

export const FOLLOW_UP_ACTION_TYPES = [
  'call',
  'whatsapp',
  'email',
  'meeting',
  'demo',
  'proposal_review',
] as const;

export type FollowUpActionType = (typeof FOLLOW_UP_ACTION_TYPES)[number];

export const ON_HOLD_REASONS = [
  'Client Budget Cycle / Q1 Planning',
  'Key Decision Maker Away / On Leave',
  'Pending Contract / Legal Review',
  'Project Paused Temporarily',
  'Awaiting Technical Specification',
  'Other',
] as const;

export type OnHoldReason = (typeof ON_HOLD_REASONS)[number];

/**
 * Sanitizes user-provided text by stripping dangerous HTML and script tags.
 */
function sanitizeInputText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Generates an RFC 5545 compliant .ics iCalendar file string for client schedule integration.
 */
export function generateIcsCalendarInvite(params: {
  title: string;
  description: string;
  startTime: Date;
  durationMinutes?: number;
  location?: string;
}): string {
  const formatIcsDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const durationMs = (params.durationMinutes ?? 30) * 60 * 1000;
  const endTime = new Date(params.startTime.getTime() + durationMs);
  const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@marcaubi.com`;

  const cleanTitle = params.title.replace(/[\r\n]+/g, ' ').replace(/[,;\\]/g, '\\$&');
  const cleanDescription = params.description
    .replace(/\r\n|\r/g, '\n')
    .replace(/[,;\\]/g, '\\$&')
    .replace(/\n/g, '\\n');
  const cleanLocation = params.location
    ? params.location.replace(/[\r\n]+/g, ' ').replace(/[,;\\]/g, '\\$&')
    : '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Marca Ubi//CRM Follow-up Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(params.startTime)}`,
    `DTEND:${formatIcsDate(endTime)}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDescription}`,
    cleanLocation ? `LOCATION:${cleanLocation}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

export const scheduleFollowUpSchema = z.object({
  leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid lead UUID format.' }),
  scheduledFor: z
    .string()
    .trim()
    .min(1, { message: 'Scheduled date and time is required.' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Scheduled date must be a valid ISO 8601 date string.',
    })
    .refine((val) => new Date(val).getTime() > Date.now() - 60000, {
      message: 'Scheduled follow-up cannot be set in the past.',
    }),
  actionType: z.enum(FOLLOW_UP_ACTION_TYPES, {
    message: 'Invalid action type specified.',
  }),
  agenda: z.string().trim().max(1000).optional().nullable(),
  sendCalendarInvite: z.boolean().optional().default(false),
});

export type ScheduleFollowUpInput = z.infer<typeof scheduleFollowUpSchema>;

export const transitionToOnHoldSchema = z.object({
  leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid lead UUID format.' }),
  revisitDate: z
    .string()
    .trim()
    .min(1, { message: 'Revisit date is required.' })
    .refine(
      (val) => {
        const parsed = Date.parse(val);
        if (isNaN(parsed)) return false;
        const parts = val.split('-');
        if (parts.length === 3) {
          const target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          target.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return target.getTime() > today.getTime();
        }
        const target = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return target.getTime() > today.getTime();
      },
      {
        message: 'Revisit date must be strictly in the future.',
      }
    ),
  reason: z.string().trim().min(3, { message: 'Parking reason is required (minimum 3 characters).' }),
  parkingNotes: z.string().trim().max(2000).optional().nullable(),
});

export type TransitionToOnHoldInput = z.infer<typeof transitionToOnHoldSchema>;

export interface SchedulerActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  calendarIcs?: string;
}

interface CallerIdentity {
  userId: string;
  role: CrmUserRole;
  fullName: string;
}

/**
 * Validates caller session, active profile status, and returns caller role identity.
 */
async function authenticateCaller(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ identity?: CallerIdentity; error?: string; statusCode?: number }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: 'Unauthorized: Session is missing or expired. Please sign in.',
      statusCode: 401,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, status, full_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: 'Forbidden: User identity profile could not be verified.',
      statusCode: 403,
    };
  }

  if (profile.status !== 'active') {
    return {
      error: 'Forbidden: Inactive or suspended accounts cannot perform scheduling operations.',
      statusCode: 403,
    };
  }

  return {
    identity: {
      userId: user.id,
      role: profile.role as CrmUserRole,
      fullName: profile.full_name || 'Team Member',
    },
  };
}

/**
 * Schedules a precision follow-up date and time for a lead, appending an activity audit row.
 */
export async function scheduleFollowUpAction(
  rawInput: unknown
): Promise<SchedulerActionResult<{ leadId: string; nextFollowUp: string }>> {
  try {
    const parseResult = scheduleFollowUpSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid scheduling payload.',
        statusCode: 422,
      };
    }

    const { leadId, scheduledFor, actionType, agenda, sendCalendarInvite } = parseResult.data;
    const supabase = await createClient();

    const authCheck = await authenticateCaller(supabase);
    if (!authCheck.identity) {
      return {
        success: false,
        error: authCheck.error,
        statusCode: authCheck.statusCode,
      };
    }

    const { role, userId, fullName } = authCheck.identity;

    if (role === 'viewer') {
      return {
        success: false,
        error: 'Forbidden: Viewers are not permitted to modify follow-up schedules.',
        statusCode: 403,
      };
    }

    const { data: existingLead, error: leadFetchError } = await supabase
      .from('leads')
      .select('id, name, company, assigned_to, converted_at, next_follow_up, status_id')
      .eq('id', leadId)
      .single();

    if (leadFetchError || !existingLead) {
      return {
        success: false,
        error: 'Lead record not found.',
        statusCode: 404,
      };
    }

    if (role === 'sales_executive' && existingLead.assigned_to !== userId) {
      return {
        success: false,
        error: 'Unauthorized: Sales Executives can only schedule follow-ups for assigned accounts.',
        statusCode: 403,
      };
    }

    if (existingLead.converted_at && role !== 'admin') {
      return {
        success: false,
        error: 'Forbidden: Converted deals are locked from non-admin modifications.',
        statusCode: 403,
      };
    }

    const sanitizedAgenda = agenda ? sanitizeInputText(agenda) : null;
    const targetDate = new Date(scheduledFor);

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        next_follow_up: targetDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateError) {
      return {
        success: false,
        error: `Database update failure: ${updateError.message}`,
        statusCode: 500,
      };
    }

    const actionReadableLabels: Record<FollowUpActionType, string> = {
      call: 'Follow-up Call',
      whatsapp: 'WhatsApp Check-in',
      email: 'Email Follow-up',
      meeting: 'Client Meeting',
      demo: 'Platform Demo',
      proposal_review: 'Proposal Review',
    };

    const actionLabel = actionReadableLabels[actionType] || 'Follow-up';
    const description = `Scheduled ${actionLabel} for ${targetDate.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}${sanitizedAgenda ? `: "${sanitizedAgenda}"` : ''}`;

    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      actor_id: userId,
      activity_type: 'follow_up_scheduled',
      description,
      metadata: {
        scheduled_for: targetDate.toISOString(),
        action_type: actionType,
        agenda: sanitizedAgenda,
        actor_name: fullName,
        previous_follow_up: existingLead.next_follow_up,
      },
    });

    let calendarIcs: string | undefined;
    if (sendCalendarInvite) {
      calendarIcs = generateIcsCalendarInvite({
        title: `Marca Ubi CRM: ${actionLabel} - ${existingLead.name || existingLead.company || 'Client'}`,
        description: `Follow-up Touchpoint with ${existingLead.name || 'Client'} (${existingLead.company || 'Organization'}).\n\nAgenda: ${sanitizedAgenda || 'Standard commercial touchpoint.'}`,
        startTime: targetDate,
        durationMinutes: 30,
      });
    }

    revalidatePath('/admin/leads');
    revalidatePath('/admin');

    return {
      success: true,
      data: {
        leadId,
        nextFollowUp: targetDate.toISOString(),
      },
      calendarIcs,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown exception occurred.';
    return {
      success: false,
      error: `Internal server failure during scheduling: ${errorMsg}`,
      statusCode: 500,
    };
  }
}

/**
 * Transitions a lead to 'On Hold' with a mandatory future revisit date and alert suppression.
 */
export async function transitionToOnHoldAction(
  rawInput: unknown
): Promise<SchedulerActionResult<{ leadId: string; revisitDate: string }>> {
  try {
    const parseResult = transitionToOnHoldSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid On Hold transition payload.',
        statusCode: 422,
      };
    }

    const { leadId, revisitDate, reason, parkingNotes } = parseResult.data;
    const supabase = await createClient();

    const authCheck = await authenticateCaller(supabase);
    if (!authCheck.identity) {
      return {
        success: false,
        error: authCheck.error,
        statusCode: authCheck.statusCode,
      };
    }

    const { role, userId, fullName } = authCheck.identity;

    if (role === 'viewer') {
      return {
        success: false,
        error: 'Forbidden: Viewers are not permitted to change deal stages.',
        statusCode: 403,
      };
    }

    const { data: existingLead, error: leadFetchError } = await supabase
      .from('leads')
      .select('id, name, company, assigned_to, converted_at, status_id')
      .eq('id', leadId)
      .single();

    if (leadFetchError || !existingLead) {
      return {
        success: false,
        error: 'Lead record not found.',
        statusCode: 404,
      };
    }

    if (role === 'sales_executive' && existingLead.assigned_to !== userId) {
      return {
        success: false,
        error: 'Unauthorized: Sales Executives can only manage stages of assigned accounts.',
        statusCode: 403,
      };
    }

    if (existingLead.converted_at && role !== 'admin') {
      return {
        success: false,
        error: 'Forbidden: Converted deals are locked from non-admin modifications.',
        statusCode: 403,
      };
    }

    const sanitizedReason = sanitizeInputText(reason);
    const sanitizedNotes = parkingNotes ? sanitizeInputText(parkingNotes) : null;
    const scheduledMilestoneUtc = new Date(`${revisitDate}T09:00:00Z`).toISOString();

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status_id: ON_HOLD_STATUS_ID,
        revisit_date: revisitDate,
        next_follow_up: scheduledMilestoneUtc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateError) {
      return {
        success: false,
        error: `Database update failure: ${updateError.message}`,
        statusCode: 500,
      };
    }

    const description = `Deal placed On Hold until ${revisitDate}. Reason: ${sanitizedReason}${
      sanitizedNotes ? ` - Notes: "${sanitizedNotes}"` : ''
    }. Overdue alerts suppressed until milestone.`;

    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      actor_id: userId,
      activity_type: 'status_change',
      description,
      metadata: {
        previous_status_id: existingLead.status_id,
        new_status: 'On Hold',
        revisit_date: revisitDate,
        parking_reason: sanitizedReason,
        parking_notes: sanitizedNotes,
        actor_name: fullName,
      },
    });

    revalidatePath('/admin/leads');
    revalidatePath('/admin');

    return {
      success: true,
      data: {
        leadId,
        revisitDate,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown exception occurred.';
    return {
      success: false,
      error: `Internal server failure during On Hold transition: ${errorMsg}`,
      statusCode: 500,
    };
  }
}

/**
 * Stored logic trigger to reactivate expired On Hold leads where revisit_date <= CURRENT_DATE.
 */
export async function reactivateExpiredOnHoldLeadsAction(): Promise<
  SchedulerActionResult<{ reactivatedCount: number }>
> {
  try {
    const supabase = await createClient();
    const authCheck = await authenticateCaller(supabase);
    if (!authCheck.identity) {
      return {
        success: false,
        error: authCheck.error,
        statusCode: authCheck.statusCode,
      };
    }

    const { role } = authCheck.identity;
    if (role !== 'admin' && role !== 'sales_manager') {
      return {
        success: false,
        error: 'Forbidden: Only Administrators and Sales Managers can execute reactivation maintenance.',
        statusCode: 403,
      };
    }

    const { data: reactivatedCount, error: rpcError } = await supabase.rpc(
      'reactivate_expired_on_hold_leads'
    );

    if (rpcError) {
      return {
        success: false,
        error: `Stored procedure failure: ${rpcError.message}`,
        statusCode: 500,
      };
    }

    revalidatePath('/admin/leads');
    revalidatePath('/admin');

    return {
      success: true,
      data: { reactivatedCount: typeof reactivatedCount === 'number' ? reactivatedCount : 0 },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown exception occurred.';
    return {
      success: false,
      error: `Reactivation execution failure: ${errorMsg}`,
      statusCode: 500,
    };
  }
}
