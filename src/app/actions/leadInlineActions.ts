'use server';

/**
 * @file leadInlineActions.ts
 * @description Next.js 16 Server Actions for instantaneous inline deal mutations within the Leads Data Grid.
 *              Enforces cryptographic caller authentication, Supabase Row-Level Security, role-based
 *              sandboxing (sales executives isolated to assigned leads, leadership granted global scope),
 *              and atomic append-only activity ledger audit trails in `public.lead_activities`.
 * @module actions/leadInlineActions
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/app/lib/supabase/server';
import { LEAD_PRIORITIES } from '@/app/lib/lead-schemas';
import type { LeadActionResult, LeadPriority, FunnelBucket } from '@/types/crm';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const inlineStatusSchema = z.object({
  leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid deal UUID format.' }),
  statusId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid target status UUID format.' }),
});

export const inlinePrioritySchema = z.object({
  leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid deal UUID format.' }),
  priority: z.enum(LEAD_PRIORITIES, { message: 'Invalid priority tier specified.' }),
});

export interface InlineMutationResultPayload {
  leadId: string;
  field: 'status' | 'priority';
  newValue: string;
  statusDetails?: {
    id: string;
    name: string;
    bucket: FunnelBucket;
    color_code: string;
  };
  updatedAt: string;
}

/**
 * Executes an inline pipeline stage transition from the virtualized data grid or mobile card.
 *
 * Architectural Invariants:
 * 1. Strict Session Verification: Blocks unauthenticated callers.
 * 2. Suspension Defense: Prevents suspended team members from writing commercial updates.
 * 3. Role Sandboxing: Sales Executives cannot alter deals assigned to other representatives.
 * 4. Terminal State Guard: Status transitions to Converted or Lost require guided modal completion.
 * 5. Audit Trail: Appends an immutable row to `public.lead_activities` with old and new status coordinates.
 *
 * @param leadId Primary key UUID of the commercial inquiry.
 * @param statusId Primary key UUID of the target funnel stage in `public.funnel_statuses`.
 * @returns {Promise<LeadActionResult<InlineMutationResultPayload>>} Structured outcome payload.
 */
export async function updateLeadStatusInlineAction(
  leadId: string,
  statusId: string
): Promise<LeadActionResult<InlineMutationResultPayload>> {
  try {
    const parseResult = inlineStatusSchema.safeParse({ leadId, statusId });
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid parameters supplied.',
      };
    }

    const supabase = await createClient();

    // 1. Authenticate caller session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: Active CRM session required to modify commercial deal stages.',
      };
    }

    // 2. Query caller profile & enforce suspension check
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, status, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Forbidden: Operational identity profile not found.',
      };
    }

    if (profile.status === 'suspended') {
      return {
        success: false,
        error: 'Forbidden: Suspended accounts are barred from commercial mutations.',
      };
    }

    // 3. Inspect existing deal and verify role sandboxing
    const { data: existingLead, error: leadFetchError } = await supabase
      .from('leads')
      .select('id, lead_id, assigned_to, status_id, funnel_statuses(name, bucket)')
      .eq('id', leadId)
      .maybeSingle();

    if (leadFetchError || !existingLead) {
      return {
        success: false,
        error: 'Commercial inquiry not found or inaccessible under security boundaries.',
      };
    }

    if (profile.role === 'viewer') {
      return {
        success: false,
        error: 'Forbidden: Viewers hold read-only permissions across the commercial pipeline.',
      };
    }

    if (
      profile.role !== 'admin' &&
      profile.role !== 'sales_manager' &&
      profile.role !== 'sales_executive'
    ) {
      return {
        success: false,
        error: 'Forbidden: Insufficient privileges to modify commercial pipeline records.',
      };
    }

    if (
      profile.role === 'sales_executive' &&
      existingLead.assigned_to !== profile.id
    ) {
      return {
        success: false,
        error: 'Unauthorized: Sales Executives are locked strictly to their assigned client portfolio.',
      };
    }

    // 4. Validate target status existence in funnel_statuses catalog
    const { data: targetStatus, error: statusFetchError } = await supabase
      .from('funnel_statuses')
      .select('id, name, bucket, color_code, is_active')
      .eq('id', statusId)
      .maybeSingle();

    if (statusFetchError || !targetStatus || !targetStatus.is_active) {
      return {
        success: false,
        error: 'Selected pipeline stage does not exist or is inactive in the agency taxonomy.',
      };
    }

    // Guard terminal states: Converted or Lost require contract values or loss attribution
    if (targetStatus.bucket === 'converted' || targetStatus.bucket === 'lost') {
      return {
        success: false,
        error: `Guarded transition: Changing status to ${targetStatus.name} requires modal confirmation with required commercial disclosures.`,
      };
    }

    // 5. Execute atomic lead record status mutation
    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status_id: targetStatus.id,
        updated_at: nowIso,
      })
      .eq('id', leadId);

    if (updateError) {
      return {
        success: false,
        error: `Database mutation failure: ${updateError.message}`,
      };
    }

    // 6. Record immutable activity ledger entry
    const previousStatusName =
      (existingLead.funnel_statuses as { name?: string } | null)?.name || 'Previous Stage';

    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      actor_id: profile.id,
      activity_type: 'status_change',
      description: `Stage updated from "${previousStatusName}" to "${targetStatus.name}" via fast inline selector.`,
      metadata: {
        previous_status_id: existingLead.status_id,
        previous_status_name: previousStatusName,
        new_status_id: targetStatus.id,
        new_status_name: targetStatus.name,
        new_bucket: targetStatus.bucket,
        client_timestamp: nowIso,
      },
    });

    revalidatePath('/admin/leads');

    return {
      success: true,
      data: {
        leadId,
        field: 'status',
        newValue: targetStatus.id,
        statusDetails: {
          id: targetStatus.id,
          name: targetStatus.name,
          bucket: targetStatus.bucket as FunnelBucket,
          color_code: targetStatus.color_code,
        },
        updatedAt: nowIso,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Internal server failure while updating deal status: ${errorMsg}`,
    };
  }
}

/**
 * Executes an inline deal priority tier update from the data grid or mobile card.
 *
 * @param leadId Primary key UUID of the commercial inquiry.
 * @param priority Target priority tier ('High' | 'Medium' | 'Low').
 * @returns {Promise<LeadActionResult<InlineMutationResultPayload>>} Outcome payload.
 */
export async function updateLeadPriorityInlineAction(
  leadId: string,
  priority: LeadPriority
): Promise<LeadActionResult<InlineMutationResultPayload>> {
  try {
    const parseResult = inlinePrioritySchema.safeParse({ leadId, priority });
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid priority tier supplied.',
      };
    }

    const supabase = await createClient();

    // 1. Authenticate caller session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: Active CRM session required to modify deal priorities.',
      };
    }

    // 2. Query caller profile & check suspension
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Forbidden: Operational profile verification failed.',
      };
    }

    if (profile.status === 'suspended') {
      return {
        success: false,
        error: 'Forbidden: Suspended accounts cannot adjust deal priorities.',
      };
    }

    // 3. Inspect target lead and verify role isolation
    const { data: existingLead, error: leadFetchError } = await supabase
      .from('leads')
      .select('id, lead_id, assigned_to, priority')
      .eq('id', leadId)
      .maybeSingle();

    if (leadFetchError || !existingLead) {
      return {
        success: false,
        error: 'Target inquiry not found or inaccessible.',
      };
    }

    if (profile.role === 'viewer') {
      return {
        success: false,
        error: 'Forbidden: Viewers hold read-only permissions across the commercial pipeline.',
      };
    }

    if (
      profile.role !== 'admin' &&
      profile.role !== 'sales_manager' &&
      profile.role !== 'sales_executive'
    ) {
      return {
        success: false,
        error: 'Forbidden: Insufficient privileges to modify commercial pipeline records.',
      };
    }

    if (
      profile.role === 'sales_executive' &&
      existingLead.assigned_to !== profile.id
    ) {
      return {
        success: false,
        error: 'Unauthorized: Sales Executives can only reprioritize their assigned inquiries.',
      };
    }

    // 4. Update deal priority
    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        priority,
        updated_at: nowIso,
      })
      .eq('id', leadId);

    if (updateError) {
      return {
        success: false,
        error: `Database priority update failure: ${updateError.message}`,
      };
    }

    // 5. Append immutable activity ledger log
    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      actor_id: profile.id,
      activity_type: 'priority_change',
      description: `Deal priority reprioritized from ${existingLead.priority} to ${priority}.`,
      metadata: {
        previous_priority: existingLead.priority,
        new_priority: priority,
        client_timestamp: nowIso,
      },
    });

    revalidatePath('/admin/leads');

    return {
      success: true,
      data: {
        leadId,
        field: 'priority',
        newValue: priority,
        updatedAt: nowIso,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Internal server failure while updating priority: ${errorMsg}`,
    };
  }
}

/**
 * Universal dispatcher action supporting dynamic inline mutations from grid cells.
 */
export async function updateLeadInlineAction(
  leadId: string,
  field: 'status' | 'priority',
  value: string
): Promise<LeadActionResult<InlineMutationResultPayload>> {
  if (field === 'status') {
    return updateLeadStatusInlineAction(leadId, value);
  }
  if (field === 'priority') {
    return updateLeadPriorityInlineAction(leadId, value as LeadPriority);
  }
  return {
    success: false,
    error: `Unsupported inline mutation field: "${field}"`,
  };
}
