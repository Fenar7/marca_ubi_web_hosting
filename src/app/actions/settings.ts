'use server';

/**
 * @file settings.ts
 * @description Server Actions for Agency Governance, SLA & Alert Thresholds,
 *              and Inbound Webhook Brief Simulation.
 *              Strictly enforces administrator role guards and atomic mutations.
 * @module actions/settings
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import {
  updateAgencySettingsSchema,
  type AgencySettings,
} from '@/app/lib/agency-settings-schemas';

interface CallerIdentity {
  callerId: string;
  callerEmail: string;
}

/**
 * Asserts that the authenticated caller has the active 'admin' role.
 * Throws an explicit error if unauthenticated, suspended, or unauthorized.
 */
async function assertAdminRole(): Promise<CallerIdentity> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: An active administrative session is required.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error('Caller profile could not be verified in the agency directory.');
  }

  if (profile.status !== 'active') {
    throw new Error('Account suspended: Inactive administrators cannot modify agency settings.');
  }

  if (profile.role !== 'admin') {
    throw new Error('Privilege Escalation Blocked: Only active administrators can modify agency settings.');
  }

  return { callerId: profile.id, callerEmail: profile.email };
}

/**
 * Retrieves the singleton agency operational settings.
 * If no record exists, returns standard defaults.
 */
export async function getAgencySettingsAction(): Promise<{
  success: boolean;
  data?: AgencySettings;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('agency_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      // Invariant: Gracefully return defaults if table is in initialization state
      return {
        success: true,
        data: {
          id: 'default',
          lead_response_sla_minutes: 60,
          followup_grace_period_hours: 4,
          stale_deal_threshold_days: 14,
          dedup_window_hours: 24,
          bot_rate_limit_per_minute: 10,
          notification_email: 'executive@marcaubi.com',
        },
      };
    }

    if (!data) {
      return {
        success: true,
        data: {
          id: 'default',
          lead_response_sla_minutes: 60,
          followup_grace_period_hours: 4,
          stale_deal_threshold_days: 14,
          dedup_window_hours: 24,
          bot_rate_limit_per_minute: 10,
          notification_email: 'executive@marcaubi.com',
        },
      };
    }

    return {
      success: true,
      data: data as AgencySettings,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve agency settings.',
    };
  }
}

/**
 * Updates agency operational thresholds and SLA configurations.
 * Gated strictly to active administrators.
 */
export async function updateAgencySettingsAction(rawInput: unknown): Promise<{
  success: boolean;
  data?: AgencySettings;
  error?: string;
}> {
  try {
    const { callerId, callerEmail } = await assertAdminRole();

    const parseResult = updateAgencySettingsSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid agency settings payload.',
      };
    }

    const input = parseResult.data;
    const supabase = await createClient();

    const { data: updated, error: upsertError } = await supabase
      .from('agency_settings')
      .upsert(
        {
          id: 'default',
          lead_response_sla_minutes: input.lead_response_sla_minutes,
          followup_grace_period_hours: input.followup_grace_period_hours,
          stale_deal_threshold_days: input.stale_deal_threshold_days,
          dedup_window_hours: input.dedup_window_hours,
          bot_rate_limit_per_minute: input.bot_rate_limit_per_minute,
          notification_email: input.notification_email || null,
          updated_by: callerId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (upsertError || !updated) {
      return {
        success: false,
        error: upsertError?.message || 'Failed to persist agency settings update.',
      };
    }

    // Append immutable audit log
    await supabase.from('team_audit_logs').insert({
      actor_id: callerId,
      actor_email: callerEmail,
      target_user_id: callerId,
      target_user_email: callerEmail,
      action: 'update_agency_settings',
      metadata: {
        lead_response_sla_minutes: input.lead_response_sla_minutes,
        followup_grace_period_hours: input.followup_grace_period_hours,
        stale_deal_threshold_days: input.stale_deal_threshold_days,
        dedup_window_hours: input.dedup_window_hours,
        bot_rate_limit_per_minute: input.bot_rate_limit_per_minute,
      },
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin/ingestion');
    revalidatePath('/admin');

    return {
      success: true,
      data: updated as AgencySettings,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update agency settings.',
    };
  }
}

/**
 * Dispatches a simulated inbound brief through the deduplication pipeline.
 * Used exclusively by administrators in `/admin/ingestion` to test intake health,
 * 24-hour smart merge behavior, and creative brief payload parsing.
 */
export async function simulateInboundBriefAction(rawPayload: {
  name: string;
  email: string;
  phone: string;
  company?: string;
  serviceCategory?: string;
  budgetBracket?: string;
  message?: string;
}): Promise<{
  success: boolean;
  leadId?: string;
  isDuplicate?: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const { callerId } = await assertAdminRole();
    const supabase = await createClient();

    const name = (rawPayload.name || '').trim();
    const email = (rawPayload.email || '').trim().toLowerCase();
    const phone = (rawPayload.phone || '').trim();
    const company = (rawPayload.company || '').trim() || 'Simulated Organization';
    const serviceCategory = rawPayload.serviceCategory || 'Web & Digital';
    const budgetBracket = rawPayload.budgetBracket || '₹15L - ₹25L';
    const message = rawPayload.message || 'Simulated inbound creative brief submission.';

    if (!name || (!email && !phone)) {
      return {
        success: false,
        error: 'Name and either phone or email are strictly required.',
      };
    }

    // Check for recent duplicate inquiry within the 24h window
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let query = supabase
      .from('leads')
      .select('id, lead_id, name, created_at')
      .gte('created_at', windowStart);

    if (email && phone) {
      query = query.or(`email.eq.${email},phone.eq.${phone}`);
    } else if (email) {
      query = query.eq('email', email);
    } else {
      query = query.eq('phone', phone);
    }

    const { data: existingLeads } = await query.limit(1);

    if (existingLeads && existingLeads.length > 0) {
      const existing = existingLeads[0];
      // Append duplicate inquiry activity record
      await supabase.from('lead_activities').insert({
        lead_id: existing.id,
        actor_id: callerId,
        activity_type: 'duplicate_inquiry',
        description: `Simulated repeated inquiry from ${name} (${email || phone}). Smart merge applied without stage reset.`,
      });

      revalidatePath('/admin/ingestion');
      revalidatePath('/admin/leads');
      revalidatePath('/admin');

      return {
        success: true,
        leadId: existing.lead_id,
        isDuplicate: true,
        message: `Matched existing lead ${existing.lead_id} within 24-hour window. Duplicate inquiry logged to timeline.`,
      };
    }

    // Retrieve default lead source and initial funnel status
    const { data: source } = await supabase
      .from('lead_sources')
      .select('id')
      .eq('name', 'Website Brief')
      .maybeSingle();

    const { data: status } = await supabase
      .from('funnel_statuses')
      .select('id')
      .eq('bucket', 'open')
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    const fallbackSourceId = source?.id;
    const fallbackStatusId = status?.id;

    if (!fallbackSourceId || !fallbackStatusId) {
      return {
        success: false,
        error: 'Pipeline configuration missing: ensure lead_sources and funnel_statuses are seeded.',
      };
    }

    const briefPayload = {
      services: [serviceCategory],
      budget_bracket: budgetBracket,
      timeline: 'Q4 2026',
      client_message: message,
      simulated: true,
      simulated_at: new Date().toISOString(),
      simulated_by: callerId,
    };

    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert({
        name,
        email: email || null,
        phone: phone || null,
        company,
        service_category: serviceCategory,
        budget_bracket: budgetBracket,
        lead_source_id: fallbackSourceId,
        status_id: fallbackStatusId,
        expected_value: 1500000,
        brief_payload: briefPayload,
      })
      .select('id, lead_id')
      .single();

    if (insertError || !newLead) {
      return {
        success: false,
        error: insertError?.message || 'Failed to insert simulated lead.',
      };
    }

    // Append initial system intake activity
    await supabase.from('lead_activities').insert({
      lead_id: newLead.id,
      actor_id: callerId,
      activity_type: 'system_event',
      description: `Inbound inquiry registered via simulation console for ${name} (${company}).`,
    });

    revalidatePath('/admin/ingestion');
    revalidatePath('/admin/leads');
    revalidatePath('/admin');

    return {
      success: true,
      leadId: newLead.lead_id,
      isDuplicate: false,
      message: `Successfully generated new commercial deal ${newLead.lead_id}. Brief payload attached.`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Simulation failed.',
    };
  }
}
