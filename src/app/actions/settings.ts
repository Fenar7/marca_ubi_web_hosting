'use server';

/**
 * @file settings.ts
 * @description Server Actions for Agency Governance, SLA & Alert Thresholds,
 *              and Inbound Webhook Brief Simulation.
 *              Strictly enforces administrator role guards, atomic mutations,
 *              sanitized deduplication queries, and immutable audit logs.
 * @module actions/settings
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import {
  updateAgencySettingsSchema,
  simulateInboundBriefSchema,
  type AgencySettings,
} from '@/app/lib/agency-settings-schemas';
import { normalizeEmail, normalizePhone } from '@/app/lib/normalization';

interface CallerIdentity {
  callerId: string;
  callerEmail: string;
  role: string;
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

  return { callerId: profile.id, callerEmail: profile.email, role: profile.role };
}

/**
 * Asserts that the authenticated caller is an active administrator or sales manager.
 * Used for testing consoles like brief simulation.
 */
async function assertManagerOrAdminRole(): Promise<CallerIdentity> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: An active session is required.');
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
    throw new Error('Account suspended: Inactive personnel cannot invoke ingestion simulation.');
  }

  if (profile.role !== 'admin' && profile.role !== 'sales_manager') {
    throw new Error('Privilege Escalation Blocked: Simulation console requires administrative or managerial role.');
  }

  return { callerId: profile.id, callerEmail: profile.email, role: profile.role };
}

/**
 * Retrieves the singleton agency operational settings.
 * Gated to active authenticated users to prevent public disclosure.
 */
export async function getAgencySettingsAction(): Promise<{
  success: boolean;
  data?: AgencySettings;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: Authentication required to inspect agency operational settings.',
      };
    }

    const { data, error } = await supabase
      .from('agency_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to retrieve operational settings from database.',
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

    // Singleton table pre-seeded at migration: execute atomic update
    const { data: updated, error: updateError } = await supabase
      .from('agency_settings')
      .update({
        lead_response_sla_minutes: input.lead_response_sla_minutes,
        followup_grace_period_hours: input.followup_grace_period_hours,
        stale_deal_threshold_days: input.stale_deal_threshold_days,
        dedup_window_hours: input.dedup_window_hours,
        bot_rate_limit_per_minute: input.bot_rate_limit_per_minute,
        notification_email: input.notification_email || null,
        updated_by: callerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'default')
      .select('*')
      .single();

    if (updateError || !updated) {
      return {
        success: false,
        error: updateError?.message || 'Failed to persist agency settings update.',
      };
    }

    // Append immutable audit log and verify insertion
    const { error: auditError } = await supabase.from('team_audit_logs').insert({
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
        notification_email: input.notification_email || null,
      },
    });

    if (auditError) {
      // Invariant: Fail if audit ledger write fails
      return {
        success: false,
        error: `Settings saved but audit ledger logging failed: ${auditError.message}`,
      };
    }

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
 * Gated to active administrators and sales managers to test intake health,
 * configured smart merge behavior, and creative brief payload parsing.
 */
export async function simulateInboundBriefAction(rawPayload: unknown): Promise<{
  success: boolean;
  leadId?: string;
  isDuplicate?: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const { callerId } = await assertManagerOrAdminRole();

    const parseResult = simulateInboundBriefSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid brief simulation payload.',
      };
    }

    const input = parseResult.data;
    const supabase = await createClient();

    // 1. Normalize contact coordinates
    const normalizedEmail = normalizeEmail(input.email);
    const phoneNorm = normalizePhone(input.phone);
    const normalizedPhone = phoneNorm.phone || input.phone.replace(/[^0-9+]/g, '');

    if (!normalizedEmail && !normalizedPhone) {
      return {
        success: false,
        error: 'Either a valid email address or phone number is strictly required.',
      };
    }

    // 2. Fetch current configured deduplication window from agency settings
    const { data: settings } = await supabase
      .from('agency_settings')
      .select('dedup_window_hours')
      .eq('id', 'default')
      .maybeSingle();

    const dedupHours = settings?.dedup_window_hours ?? 24;
    const windowStart = new Date(Date.now() - dedupHours * 60 * 60 * 1000).toISOString();

    // 3. Query existing lead within the configured window using parameterized / sanitized matching
    let query = supabase
      .from('leads')
      .select('id, lead_id, name, created_at')
      .gte('created_at', windowStart);

    // Sanitize string to prevent PostgREST AST injection (commas or parentheses in input)
    const safeEmail = normalizedEmail ? normalizedEmail.replace(/[,()]/g, '') : '';
    const safePhone = normalizedPhone ? normalizedPhone.replace(/[,()]/g, '') : '';

    if (safeEmail && safePhone) {
      query = query.or(`email.eq.${safeEmail},phone.eq.${safePhone}`);
    } else if (safeEmail) {
      query = query.eq('email', safeEmail);
    } else {
      query = query.eq('phone', safePhone);
    }

    const { data: existingLeads, error: queryError } = await query.limit(1);

    if (queryError) {
      return {
        success: false,
        error: `Deduplication lookup failed: ${queryError.message}`,
      };
    }

    if (existingLeads && existingLeads.length > 0) {
      const existing = existingLeads[0];
      // Append duplicate inquiry activity record
      const { error: actError } = await supabase.from('lead_activities').insert({
        lead_id: existing.id,
        actor_id: callerId,
        activity_type: 'duplicate_inquiry',
        description: `Simulated repeat inquiry from ${input.name} (${safeEmail || safePhone}). Smart merge applied within ${dedupHours}h window.`,
      });

      if (actError) {
        return {
          success: false,
          error: `Failed to record duplicate activity: ${actError.message}`,
        };
      }

      revalidatePath('/admin/ingestion');
      revalidatePath('/admin/leads');
      revalidatePath('/admin');

      return {
        success: true,
        leadId: existing.lead_id,
        isDuplicate: true,
        message: `Matched existing lead ${existing.lead_id} within ${dedupHours}-hour window. Duplicate inquiry logged to timeline.`,
      };
    }

    // 4. Retrieve seeded lead source ('Website Form' or first available) and initial funnel status
    let { data: source } = await supabase
      .from('lead_sources')
      .select('id')
      .eq('name', 'Website Form')
      .maybeSingle();

    if (!source) {
      const { data: fallbackSource } = await supabase
        .from('lead_sources')
        .select('id')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();
      source = fallbackSource;
    }

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
        error: 'Pipeline configuration missing: ensure lead_sources and funnel_statuses are seeded in database.',
      };
    }

    const briefPayload = {
      services: [input.serviceCategory],
      budget_bracket: input.budgetBracket,
      timeline: 'Q4 2026',
      client_message: input.message,
      simulated: true,
      simulated_at: new Date().toISOString(),
      simulated_by: callerId,
    };

    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert({
        name: input.name,
        email: safeEmail || null,
        phone: safePhone || null,
        company: input.company || null,
        service_category: input.serviceCategory,
        budget_bracket: input.budgetBracket,
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

    // 5. Append initial system intake activity
    await supabase.from('lead_activities').insert({
      lead_id: newLead.id,
      actor_id: callerId,
      activity_type: 'system_event',
      description: `Inbound inquiry registered via simulation console for ${input.name} (${input.company || 'Private Client'}).`,
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
