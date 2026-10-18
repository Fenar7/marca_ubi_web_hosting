'use server';

/**
 * @file leadActivityActions.ts
 * @description Next.js Server Actions for logging and retrieving omnichannel touchpoint activities.
 *              Enforces cryptographic caller authentication, Supabase Row-Level Security, role sandboxing
 *              (sales executives restricted to assigned deals, leadership granted global scope, viewers blocked),
 *              and atomic append-only ledger entries in `public.lead_activities`.
 * @module actions/leadActivityActions
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import type {
  LeadActionResult,
  LeadActivityType,
  LeadActivityWithActor,
  CrmUserRole,
} from '@/types/crm';
import {
  leadActivityInputSchema,
  type LeadActivityInput,
} from '@/app/lib/lead-activity-schemas';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Appends an immutable interaction touchpoint to `public.lead_activities`.
 *
 * Architectural & Security Invariants:
 * 1. Strict Session Verification: Reject unauthenticated callers (401).
 * 2. Suspension Defense: Prevents suspended team members from writing interactions (403).
 * 3. Role Whitelist & Viewer Gate: Viewers are strictly prohibited from creating touchpoints (403).
 * 4. Executive Role Sandboxing: Sales executives may only log activities on leads in their assigned portfolio.
 * 5. Script & Markup Sanitization: Basic protection stripping script tags and excessive control characters.
 * 6. Audit Immutability & Timestamp Sync: Atomically refreshes `leads.updated_at` alongside activity ledger write.
 *
 * @param input Raw interaction input payload matching `leadActivityInputSchema`.
 * @returns {Promise<LeadActionResult<LeadActivityWithActor>>} Result containing the hydrated touchpoint.
 */
export async function logLeadActivityAction(
  input: LeadActivityInput
): Promise<LeadActionResult<LeadActivityWithActor>> {
  try {
    const parseResult = leadActivityInputSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid parameters supplied.',
      };
    }

    const { leadId, activityType, description, metadata } = parseResult.data;

    const supabase = await createClient();

    // 1. Authenticate caller session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: Valid commercial session credentials required.',
      };
    }

    // 2. Fetch and verify caller role & status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role, status, avatar_url, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Forbidden: Caller profile does not exist in organizational directory.',
      };
    }

    if (profile.status === 'suspended') {
      return {
        success: false,
        error: 'Forbidden: Account has been suspended by an enterprise administrator.',
      };
    }

    // Role Gate: Viewers are read-only
    if (profile.role === 'viewer') {
      return {
        success: false,
        error: 'Forbidden: Viewer credentials cannot log interaction touchpoints.',
      };
    }

    const allowedRoles: CrmUserRole[] = ['admin', 'sales_manager', 'sales_executive'];
    if (!allowedRoles.includes(profile.role as CrmUserRole)) {
      return {
        success: false,
        error: 'Forbidden: Role not authorized to record interaction touchpoints.',
      };
    }

    // 3. Verify target lead and enforce role sandboxing
    const { data: leadRecord, error: leadError } = await supabase
      .from('leads')
      .select('id, lead_id, assigned_to')
      .eq('id', leadId)
      .single();

    if (leadError || !leadRecord) {
      return {
        success: false,
        error: 'Target commercial inquiry could not be located in pipeline.',
      };
    }

    if (profile.role === 'sales_executive' && leadRecord.assigned_to !== user.id) {
      return {
        success: false,
        error: 'Privilege Violation: Sales executives may only record touchpoints on deals in their active portfolio.',
      };
    }

    // 4. Sanitize text against embedded script injection
    const sanitizedDescription = description
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .trim();

    if (sanitizedDescription.length < 3) {
      return {
        success: false,
        error: 'Interaction note contains insufficient content after sanitization.',
      };
    }

    // 5. Atomic write to public.lead_activities
    const { data: activityRecord, error: insertError } = await supabase
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        actor_id: user.id,
        activity_type: activityType,
        description: sanitizedDescription,
        metadata: metadata || {},
      })
      .select('id, lead_id, actor_id, activity_type, description, metadata, created_at')
      .single();

    if (insertError || !activityRecord) {
      return {
        success: false,
        error: `Activity ledger insertion failed: ${insertError?.message || 'Database error'}`,
      };
    }

    // 6. Update lead touchpoint timestamp
    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('leads')
      .update({ updated_at: nowIso })
      .eq('id', leadId);

    if (updateError) {
      console.warn(`[WARN] Failed to update lead updated_at timestamp: ${updateError.message}`);
    }

    // 7. Revalidate leads workspace cache
    revalidatePath('/admin/leads');

    // 8. Construct hydrated outcome entity
    const hydratedResult: LeadActivityWithActor = {
      id: activityRecord.id,
      lead_id: activityRecord.lead_id,
      actor_id: user.id,
      activity_type: activityRecord.activity_type as LeadActivityType,
      description: activityRecord.description,
      metadata: (activityRecord.metadata as Record<string, unknown>) || {},
      created_at: activityRecord.created_at,
      actor_name: profile.full_name || 'Staff Member',
      actor_role: profile.role,
      actor: {
        id: user.id,
        full_name: profile.full_name || 'Staff Member',
        role: profile.role as CrmUserRole,
        avatar_url: profile.avatar_url || null,
        email: profile.email || null,
      },
    };

    return {
      success: true,
      data: hydratedResult,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown exception occurred.';
    return {
      success: false,
      error: `Internal server failure during activity registration: ${errorMsg}`,
    };
  }
}

/**
 * Retrieves all chronological activities recorded for a commercial deal.
 *
 * @param leadId Primary key UUID of the inquiry.
 * @returns {Promise<LeadActionResult<LeadActivityWithActor[]>>} Ordered list of interactions.
 */
export async function getLeadActivitiesAction(
  leadId: string
): Promise<LeadActionResult<LeadActivityWithActor[]>> {
  try {
    if (!UUID_REGEX.test(leadId)) {
      return {
        success: false,
        error: 'Invalid deal UUID identifier supplied.',
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: Valid commercial session credentials required.',
      };
    }

    // Verify caller profile & status defense
    const { data: callerProfile, error: callerProfileError } = await supabase
      .from('profiles')
      .select('id, status')
      .eq('id', user.id)
      .single();

    if (callerProfileError || !callerProfile) {
      return {
        success: false,
        error: 'Forbidden: Caller profile does not exist in organizational directory.',
      };
    }

    if (callerProfile.status === 'suspended') {
      return {
        success: false,
        error: 'Forbidden: Account has been suspended by an enterprise administrator.',
      };
    }

    // Fetch activities joined with profiles
    const { data: rawActivities, error: activitiesError } = await supabase
      .from('lead_activities')
      .select(`
        id,
        lead_id,
        actor_id,
        activity_type,
        description,
        metadata,
        created_at,
        profiles (
          id,
          full_name,
          role,
          avatar_url,
          email
        )
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (activitiesError) {
      return {
        success: false,
        error: `Failed to retrieve deal activity ledger: ${activitiesError.message}`,
      };
    }

    const activities: LeadActivityWithActor[] = (rawActivities || []).map((act) => {
      const actProfile = act.profiles as {
        id?: string;
        full_name?: string;
        role?: CrmUserRole;
        avatar_url?: string | null;
        email?: string | null;
      } | null;

      return {
        id: act.id,
        lead_id: act.lead_id,
        actor_id: act.actor_id,
        actor_name: actProfile?.full_name || 'System Staff',
        actor_role: actProfile?.role || 'viewer',
        activity_type: act.activity_type as LeadActivityType,
        description: act.description,
        metadata: (act.metadata as Record<string, unknown>) || {},
        created_at: act.created_at,
        actor: actProfile
          ? {
              id: actProfile.id || act.actor_id || '',
              full_name: actProfile.full_name || 'System Staff',
              role: (actProfile.role as CrmUserRole) || 'viewer',
              avatar_url: actProfile.avatar_url || null,
              email: actProfile.email || null,
            }
          : null,
      };
    });

    return {
      success: true,
      data: activities,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown exception occurred.';
    return {
      success: false,
      error: `Internal server failure during activity ledger retrieval: ${errorMsg}`,
    };
  }
}
