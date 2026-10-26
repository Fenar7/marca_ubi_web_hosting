'use server';

/**
 * @file stageTransitionActions.ts
 * @description Next.js 16 Server Actions for guarded commercial pipeline stage transitions.
 *              Enforces cryptographic caller authentication, Supabase Row-Level Security,
 *              sales executive portfolio sandboxing, state machine linear progression,
 *              positive valuation enforcement, loss attribution, and post-conversion record locking.
 * @module actions/stageTransitionActions
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/app/lib/supabase/server';
import type { LeadActionResult, FunnelBucket } from '@/types/crm';
import {
  LOST_REASON_OPTIONS,
  LOST_REASON_ALIASES,
  transitionToNegotiationSchema,
  transitionToLostSchema,
  transitionToConvertedSchema,
  type LostReasonEnum,
  type GuardedTransitionResultPayload,
} from '@/app/lib/stage-transition-schemas';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Strips dangerous HTML tags while preserving text formatting.
 */
function sanitizeInputText(input?: string | null): string | null {
  if (!input) return null;
  const stripped = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
  return stripped.length > 0 ? stripped : null;
}

/**
 * Validates caller identity, role authorization, and deal assignment boundaries.
 */
async function authenticateAndAuthorizeCaller(
  leadId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false as const,
      error: 'Unauthorized: Active CRM session required to modify commercial deal stages.',
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, status, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      authorized: false as const,
      error: 'Forbidden: Operational identity profile not found.',
    };
  }

  if (profile.status !== 'active') {
    return {
      authorized: false as const,
      error: 'Forbidden: Inactive or suspended accounts are barred from commercial mutations.',
    };
  }

  if (profile.role === 'viewer') {
    return {
      authorized: false as const,
      error: 'Forbidden: Viewers hold read-only permissions across the commercial pipeline.',
    };
  }

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, lead_id, assigned_to, status_id, expected_value, notes, converted_at, funnel_statuses(id, name, bucket)')
    .eq('id', leadId)
    .maybeSingle();

  if (leadError || !lead) {
    return {
      authorized: false as const,
      error: 'Commercial inquiry not found or inaccessible under security boundaries.',
    };
  }

  // Enforce post-conversion record locking: non-admins are blocked from editing converted records
  if (lead.converted_at && profile.role !== 'admin') {
    return {
      authorized: false as const,
      error: 'Forbidden: Converted deals are locked from non-admin modifications.',
    };
  }

  // Enforce Sales Executive portfolio sandboxing
  if (profile.role === 'sales_executive' && lead.assigned_to !== profile.id) {
    return {
      authorized: false as const,
      error: 'Unauthorized: Sales Executives are locked strictly to their assigned client portfolio.',
    };
  }

  return {
    authorized: true as const,
    supabase,
    user,
    profile,
    lead,
  };
}

/**
 * Advances a deal to Negotiation stage, enforcing positive expected value and target close date.
 *
 * @param input Transition parameters including expected value and close date.
 * @returns Operation outcome payload.
 */
export async function transitionToNegotiationAction(
  input: z.infer<typeof transitionToNegotiationSchema>
): Promise<LeadActionResult<GuardedTransitionResultPayload>> {
  try {
    const parseResult = transitionToNegotiationSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid negotiation parameters.',
      };
    }

    const { leadId, expectedValue, anticipatedCloseDate, notes } = parseResult.data;
    const auth = await authenticateAndAuthorizeCaller(leadId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const { supabase, profile, lead } = auth;

    // Locate Negotiation status from catalog
    const { data: targetStatus, error: statusError } = await supabase
      .from('funnel_statuses')
      .select('id, name, bucket, color_code')
      .ilike('name', 'Negotiation')
      .maybeSingle();

    if (statusError || !targetStatus) {
      return {
        success: false,
        error: 'Negotiation stage definition not found in pipeline taxonomy.',
      };
    }

    const nowIso = new Date().toISOString();
    const sanitizedNotes = sanitizeInputText(notes);
    const existingNotes = lead.notes ? `${lead.notes}\n\n` : '';
    const updatedNotes = sanitizedNotes
      ? `${existingNotes}[Negotiation Scope]: ${sanitizedNotes}`.trim()
      : lead.notes;

    // Atomic update of lead coordinates
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status_id: targetStatus.id,
        expected_value: expectedValue,
        next_follow_up: new Date(anticipatedCloseDate).toISOString(),
        notes: updatedNotes,
        updated_at: nowIso,
      })
      .eq('id', leadId);

    if (updateError) {
      return {
        success: false,
        error: `Stage advancement failure: ${updateError.message}`,
      };
    }

    // Append audit activity entry
    const previousStatusName =
      (lead.funnel_statuses as { name?: string } | null)?.name || 'Previous Stage';

    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      actor_id: profile.id,
      activity_type: 'status_change',
      description: `Stage advanced to "Negotiation" with expected valuation of ₹${expectedValue.toLocaleString('en-IN')}.`,
      metadata: {
        previous_status_id: lead.status_id,
        previous_status_name: previousStatusName,
        new_status_id: targetStatus.id,
        new_status_name: targetStatus.name,
        expected_value: expectedValue,
        anticipated_close_date: anticipatedCloseDate,
        transition_type: 'guarded_negotiation',
      },
    });

    revalidatePath('/admin/leads');
    revalidatePath('/admin');

    return {
      success: true,
      data: {
        leadId,
        previousStatusId: lead.status_id,
        previousStatusName,
        newStatusId: targetStatus.id,
        newStatusName: targetStatus.name,
        bucket: targetStatus.bucket as FunnelBucket,
        updatedAt: nowIso,
        expectedValue,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected exception occurred during stage advancement.',
    };
  }
}

/**
 * Transitions a deal to Lost status, enforcing standardized loss attribution and explanatory notes.
 *
 * @param input Transition parameters including lost reason enum and notes.
 * @returns Operation outcome payload.
 */
export async function transitionToLostAction(
  input: z.infer<typeof transitionToLostSchema>
): Promise<LeadActionResult<GuardedTransitionResultPayload>> {
  try {
    const parseResult = transitionToLostSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid loss parameters.',
      };
    }

    const { leadId, lostReason, lostNotes } = parseResult.data;
    const normalizedReason =
      LOST_REASON_ALIASES[lostReason.toLowerCase()] ||
      (LOST_REASON_OPTIONS.includes(lostReason as LostReasonEnum) ? (lostReason as LostReasonEnum) : 'Other');

    const auth = await authenticateAndAuthorizeCaller(leadId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const { supabase, profile, lead } = auth;

    // Locate Lost status in catalog
    const { data: targetStatus, error: statusError } = await supabase
      .from('funnel_statuses')
      .select('id, name, bucket, color_code')
      .eq('bucket', 'lost')
      .maybeSingle();

    if (statusError || !targetStatus) {
      return {
        success: false,
        error: 'Lost stage definition not found in pipeline taxonomy.',
      };
    }

    const nowIso = new Date().toISOString();
    const sanitizedNotes = sanitizeInputText(lostNotes);
    const existingNotes = lead.notes ? `${lead.notes}\n\n` : '';
    const updatedNotes = sanitizedNotes
      ? `${existingNotes}[Lost Reason: ${normalizedReason}]: ${sanitizedNotes}`.trim()
      : lead.notes;

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status_id: targetStatus.id,
        lost_reason: normalizedReason,
        notes: updatedNotes,
        updated_at: nowIso,
      })
      .eq('id', leadId);

    if (updateError) {
      return {
        success: false,
        error: `Deal closure failure: ${updateError.message}`,
      };
    }

    const previousStatusName =
      (lead.funnel_statuses as { name?: string } | null)?.name || 'Previous Stage';

    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      actor_id: profile.id,
      activity_type: 'status_change',
      description: `Deal marked as "Lost" (${normalizedReason}).`,
      metadata: {
        previous_status_id: lead.status_id,
        previous_status_name: previousStatusName,
        new_status_id: targetStatus.id,
        new_status_name: targetStatus.name,
        lost_reason: normalizedReason,
        lost_notes: sanitizedNotes,
        transition_type: 'guarded_lost',
      },
    });

    revalidatePath('/admin/leads');
    revalidatePath('/admin');

    return {
      success: true,
      data: {
        leadId,
        previousStatusId: lead.status_id,
        previousStatusName,
        newStatusId: targetStatus.id,
        newStatusName: targetStatus.name,
        bucket: 'lost',
        updatedAt: nowIso,
        lostReason: normalizedReason,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected exception occurred while recording deal loss.',
    };
  }
}

/**
 * Transitions a deal to Converted (Won), enforcing commercial contract parameters,
 * setting converted_at, and activating permanent record locking.
 *
 * @param input Conversion parameters including contract revenue and payment terms.
 * @returns Operation outcome payload.
 */
export async function transitionToConvertedAction(
  input: z.infer<typeof transitionToConvertedSchema>
): Promise<LeadActionResult<GuardedTransitionResultPayload>> {
  try {
    const parseResult = transitionToConvertedSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid conversion parameters.',
      };
    }

    const { leadId, finalRevenue, signedContractDate, paymentTerms, notes } = parseResult.data;
    const auth = await authenticateAndAuthorizeCaller(leadId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const { supabase, profile, lead } = auth;

    // Enforce state machine linear progression:
    // Direct jumps from New, Contacted, or Lost to Converted are strictly forbidden (PRD §5)
    const currentStatusName = (lead.funnel_statuses as { name?: string; bucket?: string } | null)?.name || '';
    const currentBucket = (lead.funnel_statuses as { name?: string; bucket?: string } | null)?.bucket || '';

    if (currentStatusName === 'New' || currentStatusName === 'Contacted') {
      return {
        success: false,
        error: 'Invalid stage transition: Deals must reach at least Qualified or Negotiation before conversion to Won/Converted.',
      };
    }

    if (currentBucket === 'lost' || currentStatusName === 'Lost') {
      return {
        success: false,
        error: 'Invalid stage transition: Lost leads cannot be directly converted. They must first be reopened to Qualified.',
      };
    }

    // Locate Converted status in catalog
    const { data: targetStatus, error: statusError } = await supabase
      .from('funnel_statuses')
      .select('id, name, bucket, color_code')
      .eq('bucket', 'converted')
      .maybeSingle();

    if (statusError || !targetStatus) {
      return {
        success: false,
        error: 'Converted stage definition not found in pipeline taxonomy.',
      };
    }

    const nowIso = new Date().toISOString();
    const sanitizedNotes = sanitizeInputText(notes);
    const sanitizedTerms = sanitizeInputText(paymentTerms);
    if (!sanitizedTerms || sanitizedTerms.length < 3) {
      return {
        success: false,
        error: 'Commercial payment terms must contain valid text (minimum 3 characters).',
      };
    }
    const existingNotes = lead.notes ? `${lead.notes}\n\n` : '';
    const updatedNotes = `${existingNotes}[Converted Agreement]: Signed on ${signedContractDate}. Terms: ${sanitizedTerms}.${sanitizedNotes ? ` Note: ${sanitizedNotes}` : ''}`.trim();

    // Atomic update of lead coordinates and lock timestamp
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status_id: targetStatus.id,
        expected_value: finalRevenue,
        converted_at: nowIso,
        notes: updatedNotes,
        updated_at: nowIso,
      })
      .eq('id', leadId);

    if (updateError) {
      return {
        success: false,
        error: `Deal conversion failure: ${updateError.message}`,
      };
    }

    const previousStatusName =
      (lead.funnel_statuses as { name?: string } | null)?.name || 'Previous Stage';

    const { error: activityError } = await supabase.from('lead_activities').insert({
      lead_id: leadId,
      actor_id: profile.id,
      activity_type: 'status_change',
      description: `Deal converted to Won with signed contract value of ₹${finalRevenue.toLocaleString('en-IN')}. Record locked from non-admin modifications.`,
      metadata: {
        previous_status_id: lead.status_id,
        previous_status_name: previousStatusName,
        new_status_id: targetStatus.id,
        new_status_name: targetStatus.name,
        final_revenue: finalRevenue,
        signed_contract_date: signedContractDate,
        payment_terms: sanitizedTerms,
        is_converted: true,
        transition_type: 'guarded_converted',
      },
    });

    if (activityError) {
      console.warn('[STAGE_TRANSITION] Activity ledger logging warning:', activityError.message);
    }

    revalidatePath('/admin/leads');
    revalidatePath('/admin');

    return {
      success: true,
      data: {
        leadId,
        previousStatusId: lead.status_id,
        previousStatusName,
        newStatusId: targetStatus.id,
        newStatusName: targetStatus.name,
        bucket: 'converted',
        updatedAt: nowIso,
        convertedAt: nowIso,
        expectedValue: finalRevenue,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected exception occurred during deal conversion.',
    };
  }
}

/**
 * Administrative action to unlock a converted lead if corrections are strictly required.
 *
 * @param leadId Primary key UUID of the commercial deal.
 * @returns Operation outcome payload.
 */
export async function unlockConvertedLeadAction(
  leadId: string
): Promise<LeadActionResult<{ leadId: string; unlockedAt: string }>> {
  try {
    if (!UUID_REGEX.test(leadId)) {
      return { success: false, error: 'Invalid lead UUID format.' };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Active CRM session required.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, status, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      return {
        success: false,
        error: 'Forbidden: Only system administrators can unlock converted deals.',
      };
    }

    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        converted_at: null,
        updated_at: nowIso,
      })
      .eq('id', leadId);

    if (updateError) {
      return { success: false, error: `Unlock failure: ${updateError.message}` };
    }

    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      actor_id: profile.id,
      activity_type: 'status_change',
      description: `Deal converted record lock released by administrator ${profile.full_name}.`,
      metadata: {
        action: 'unlock_converted_lead',
        unlocked_by: profile.id,
      },
    });

    revalidatePath('/admin/leads');
    return { success: true, data: { leadId, unlockedAt: nowIso } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to unlock converted deal.',
    };
  }
}
