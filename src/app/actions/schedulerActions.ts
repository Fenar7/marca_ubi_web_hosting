'use server';

/**
 * @file schedulerActions.ts
 * @description Next.js 16 Server Actions for commercial follow-up scheduling, calendar integration,
 *              and deal parking on hold. Strictly exports async Server Action functions to comply
 *              with Next.js App Router RPC boundary invariants.
 * @module actions/schedulerActions
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import { CrmUserRole } from '@/types/crm';
import {
  ON_HOLD_STATUS_ID,
  generateIcsCalendarInvite,
  scheduleFollowUpSchema,
  transitionToOnHoldSchema,
  type FollowUpActionType,
  type SchedulerActionResult,
} from '@/app/lib/scheduler-schemas';

/**
 * Server Action wrapper for generating an RFC 5545 iCalendar invite string asynchronously.
 * Allows client or server invocation via asynchronous RPC when needed.
 */
export async function generateIcsCalendarInviteAction(params: {
  title: string;
  description: string;
  startTime: Date;
  durationMinutes?: number;
  location?: string;
}): Promise<string> {
  return generateIcsCalendarInvite(params);
}

/**
 * Sanitizes user-provided text by stripping dangerous HTML and script tags.
 */
function sanitizeInputText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
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
