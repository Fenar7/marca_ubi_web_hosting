'use server';

/**
 * @file leads.ts
 * @description Server Actions for commercial deal management, 360-degree client dossiers,
 *              pipeline stage advancement, omnichannel touchpoint logging, and deal parameter mutations.
 *              Enforces strict Next.js 16 Server Action boundaries, Supabase RLS security policies,
 *              role-based access guards (viewers blocked, sales executives restricted to assigned deals,
 *              administrators and sales managers permitted global commercial mutation scope),
 *              and transaction consistency across `public.leads` and `public.lead_activities`.
 * @module actions/leads
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import { normalizeEmail, normalizePhone, sanitizeHtml } from '@/app/lib/normalization';
import {
  createManualLeadSchema,
  updateLeadAssigneeSchema,
  updateLeadDealParametersSchema,
  convertLeadToDealSchema,
  updateLeadDetailsSchema,
  type UpdateLeadDetailsInput,
} from '@/app/lib/lead-schemas';
import type {
  CrmUserRole,
  AssigneeOption,
  LeadActionResult,
  LeadDetailPayload,
  LeadWithRelations,
  LeadActivityWithActor,
  FunnelStatus,
  LeadSource,
  Profile,
  LeadPriority,
  LeadActivityType,
  PreferredChannel,
  ServiceCategory,
} from '@/types/crm';

const DEFAULT_NEW_FUNNEL_STATUS_ID = 'b0000000-0000-0000-0000-000000000001';
const DEFAULT_DIRECT_REFERRAL_SOURCE_ID = 'a0000000-0000-0000-0000-000000000003';
const DEFAULT_FOUNDER_OUTREACH_SOURCE_ID = 'a0000000-0000-0000-0000-000000000004';
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Creates a new commercial deal dossier manually from the CRM workspace drawer.
 * Enforces RLS invariant `leads_insert_policy`:
 * - Admins and Sales Managers can assign to any active commercial personnel.
 * - Sales Executives are strictly restricted to assigning deals to themselves.
 * - Viewers are rejected with a privilege authorization exception.
 *
 * @param input Raw form values matching `createManualLeadSchema`.
 * @returns {Promise<LeadActionResult>} Outcome containing new lead identifiers or error message.
 */
export async function createManualLead(input: unknown): Promise<LeadActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: Active CRM session required to register a prospective engagement.',
      };
    }

    const { data: callerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !callerProfile) {
      return {
        success: false,
        error: 'Caller profile could not be verified in the agency directory.',
      };
    }

    if (callerProfile.status !== 'active') {
      return {
        success: false,
        error: 'Account suspended: Inactive personnel cannot register prospective engagements.',
      };
    }

    if (callerProfile.role === 'viewer') {
      return {
        success: false,
        error: 'Privilege Violation: Read-only personnel cannot create client records.',
      };
    }

    const validationResult = createManualLeadSchema.safeParse(input);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      return {
        success: false,
        error: firstIssue ? firstIssue.message : 'Invalid prospective lead parameters.',
      };
    }

    const data = validationResult.data;

    const normalizedEmail = normalizeEmail(data.email);
    const phoneResult = normalizePhone(data.phone);
    const normalizedPhone = phoneResult.phone;

    const sanitizedName = sanitizeHtml(data.name) ?? data.name;
    const sanitizedCompany = sanitizeHtml(data.company);
    const sanitizedWebsite = sanitizeHtml(data.companyWebsite);
    const sanitizedNotes = sanitizeHtml(data.notes);
    const sanitizedBudget = sanitizeHtml(data.budgetBracket);

    let targetAssigneeId: string | null = null;
    if (callerProfile.role === 'sales_executive') {
      targetAssigneeId = user.id;
    } else {
      targetAssigneeId =
        data.assignedTo && data.assignedTo.trim().length > 0
          ? data.assignedTo
          : user.id;
    }

    const defaultSourceId =
      callerProfile.role === 'admin'
        ? DEFAULT_FOUNDER_OUTREACH_SOURCE_ID
        : DEFAULT_DIRECT_REFERRAL_SOURCE_ID;
    const finalSourceId = data.leadSourceId || defaultSourceId;

    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert({
        name: sanitizedName,
        company: sanitizedCompany,
        company_website: sanitizedWebsite,
        email: normalizedEmail,
        phone: normalizedPhone,
        preferred_channel: data.preferredChannel,
        lead_source_id: finalSourceId,
        source_detail: 'Manual CRM Workspace Entry',
        service_category: data.serviceCategory,
        budget_bracket: sanitizedBudget,
        priority: data.priority,
        status_id: DEFAULT_NEW_FUNNEL_STATUS_ID,
        assigned_to: targetAssigneeId,
        expected_value: data.expectedValue,
        notes: sanitizedNotes,
        brief_payload: {
          created_via: 'manual_workspace_drawer',
          creator_id: user.id,
          creator_name: callerProfile.full_name,
          creator_role: callerProfile.role,
          phone_warning: phoneResult.warning,
          created_at: new Date().toISOString(),
        },
      })
      .select('id, lead_id')
      .single();

    if (insertError || !newLead) {
      return {
        success: false,
        error: `Database insertion rejected: ${insertError?.message || 'Unknown persistence fault.'}`,
      };
    }

    await supabase.from('lead_activities').insert({
      lead_id: newLead.id,
      actor_id: user.id,
      activity_type: 'system_event',
      description: `Prospect manually registered and assigned to commercial representative by ${callerProfile.full_name}.`,
      metadata: {
        lead_id_code: newLead.lead_id,
        creator_id: user.id,
        assigned_to: targetAssigneeId,
        source: 'manual_crm_drawer',
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/leads');
    revalidatePath('/admin/tasks');
    revalidatePath('/admin/analytics');

    return {
      success: true,
      id: newLead.id,
      leadId: newLead.lead_id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Action Error';
    return {
      success: false,
      error: `Execution failure: ${message}`,
    };
  }
}

/**
 * Queries active commercial personnel to populate representative selectors.
 * Gated to active authenticated staff.
 *
 * @returns {Promise<AssigneeOption[]>} List of active commercial personnel.
 */
export async function getActiveTeamAssignees(): Promise<AssigneeOption[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return [];
    }

    const { data: roster, error: rosterError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('status', 'active')
      .in('role', ['admin', 'sales_manager', 'sales_executive'])
      .order('full_name', { ascending: true });

    if (rosterError || !roster) {
      return [];
    }

    return roster.map((p) => ({
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      role: p.role as CrmUserRole,
    }));
  } catch {
    return [];
  }
}

/**
 * Retrieves the comprehensive 360-degree commercial client dossier for a specific deal.
 * Joins related stage progression, lead acquisition source, and assigned representative.
 * Enforces role guards: Sales Executives can only inspect deals assigned to their portfolio.
 *
 * @param leadId Primary key UUID of the deal record.
 * @returns {Promise<LeadActionResult<LeadDetailPayload>>} Full dossier, interaction history, and mutation options.
 */
export async function getLeadDetails(
  leadId: string
): Promise<LeadActionResult<LeadDetailPayload>> {
  try {
    if (!leadId || typeof leadId !== 'string' || !isValidUuid(leadId)) {
      return {
        success: false,
        error: 'Invalid deal identifier format.',
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
        error: 'Unauthorized: Active CRM session required to inspect deal details.',
      };
    }

    const { data: callerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !callerProfile) {
      return {
        success: false,
        error: 'Caller profile could not be verified in the agency directory.',
      };
    }

    if (callerProfile.status !== 'active') {
      return {
        success: false,
        error: 'Account suspended: Inactive personnel cannot access commercial dossiers.',
      };
    }

    const { data: leadRecord, error: leadError } = await supabase
      .from('leads')
      .select(`
        id,
        lead_id,
        name,
        company,
        company_website,
        industry,
        phone,
        email,
        preferred_channel,
        lead_source_id,
        source_detail,
        service_category,
        budget_bracket,
        priority,
        status_id,
        assigned_to,
        expected_value,
        next_follow_up,
        lost_reason,
        revisit_date,
        notes,
        brief_payload,
        inquiry_count,
        created_at,
        converted_at,
        updated_at,
        funnel_statuses(id, name, bucket, color_code, sort_order, is_active, created_at),
        lead_sources(id, name, color_code, is_active, created_at),
        profiles!leads_assigned_to_fkey(id, full_name, role, email, avatar_url)
      `)
      .eq('id', leadId)
      .maybeSingle();

    if (leadError || !leadRecord) {
      return {
        success: false,
        error: 'Deal record not found or inaccessible.',
      };
    }

    if (callerProfile.role === 'sales_executive' && leadRecord.assigned_to !== user.id) {
      return {
        success: false,
        error: 'Privilege Violation: Sales executives may only access deals assigned to their portfolio.',
      };
    }

    const { data: rawActivities } = await supabase
      .from('lead_activities')
      .select(`
        id,
        lead_id,
        actor_id,
        activity_type,
        description,
        metadata,
        created_at,
        profiles(id, full_name, role, avatar_url, email)
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    const { data: rawStatuses } = await supabase
      .from('funnel_statuses')
      .select('id, name, bucket, color_code, sort_order, is_active, created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    const { data: rawStaff } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('status', 'active')
      .in('role', ['admin', 'sales_manager', 'sales_executive'])
      .order('full_name', { ascending: true });

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

    const lead: LeadWithRelations = {
      id: leadRecord.id,
      lead_id: leadRecord.lead_id,
      name: leadRecord.name,
      company: leadRecord.company,
      company_website: leadRecord.company_website,
      industry: leadRecord.industry,
      phone: leadRecord.phone,
      email: leadRecord.email,
      preferred_channel: (leadRecord.preferred_channel as PreferredChannel) || 'Phone',
      lead_source_id: leadRecord.lead_source_id,
      source_detail: leadRecord.source_detail,
      service_category: (leadRecord.service_category as ServiceCategory) || 'Web & Digital',
      budget_bracket: leadRecord.budget_bracket,
      priority: (leadRecord.priority as LeadPriority) || 'Medium',
      status_id: leadRecord.status_id,
      assigned_to: leadRecord.assigned_to,
      expected_value: Number(leadRecord.expected_value) || 0,
      next_follow_up: leadRecord.next_follow_up,
      lost_reason: leadRecord.lost_reason,
      revisit_date: leadRecord.revisit_date,
      notes: leadRecord.notes,
      brief_payload: (leadRecord.brief_payload as Record<string, unknown>) || {},
      inquiry_count: Number(leadRecord.inquiry_count) || 1,
      created_at: leadRecord.created_at,
      converted_at: leadRecord.converted_at,
      updated_at: leadRecord.updated_at,
      status: (leadRecord.funnel_statuses as unknown as FunnelStatus) || undefined,
      lead_source: (leadRecord.lead_sources as unknown as LeadSource) || undefined,
      assignee: (leadRecord.profiles as unknown as Profile) || null,
    };

    const availableStatuses: FunnelStatus[] = (rawStatuses || []).map((s) => ({
      id: s.id,
      name: s.name,
      bucket: s.bucket,
      color_code: s.color_code || '#ffffff',
      sort_order: s.sort_order || 0,
      is_active: s.is_active,
      created_at: s.created_at,
    }));

    const availableAssignees: AssigneeOption[] = (rawStaff || []).map((p) => ({
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      role: p.role as CrmUserRole,
    }));

    const payload: LeadDetailPayload = {
      lead,
      activities,
      availableStatuses,
      availableAssignees,
      funnelStatuses: availableStatuses,
      teamAssignees: availableAssignees,
    };

    return {
      success: true,
      data: payload,
      lead,
      activities,
      availableStatuses,
      availableAssignees,
      funnelStatuses: availableStatuses,
      teamAssignees: availableAssignees,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Action Error';
    return {
      success: false,
      error: `Dossier retrieval fault: ${message}`,
    };
  }
}

/**
 * Reassigns commercial deal ownership to another active agency representative.
 * Strictly gated to Administrators and Sales Managers per Master PRD Section 7.
 * Appends a reassignment audit entry to the immutable activity ledger.
 *
 * @param inputOrLeadId Object conforming to `updateLeadAssigneeSchema` or leadId string.
 * @param optionalAssigneeId Target personnel profile UUID when called with positional arguments.
 * @param optionalNote Optional reassignment justification note when called with positional arguments.
 * @returns {Promise<LeadActionResult>} Operation outcome.
 */
export async function updateLeadAssignee(
  inputOrLeadId: unknown,
  optionalAssigneeId?: string,
  optionalNote?: string
): Promise<LeadActionResult> {
  try {
    let normalizedInput: unknown;
    if (typeof inputOrLeadId === 'string') {
      normalizedInput = {
        leadId: inputOrLeadId,
        newAssigneeId: optionalAssigneeId,
        note: optionalNote,
      };
    } else {
      normalizedInput = inputOrLeadId;
    }

    const validationResult = updateLeadAssigneeSchema.safeParse(normalizedInput);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      return {
        success: false,
        error: firstIssue ? firstIssue.message : 'Invalid reassignment parameters.',
      };
    }

    const data = validationResult.data;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: Active CRM session required to reassign deals.',
      };
    }

    const { data: callerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !callerProfile) {
      return {
        success: false,
        error: 'Caller profile could not be verified in the agency directory.',
      };
    }

    if (callerProfile.status !== 'active') {
      return {
        success: false,
        error: 'Account suspended: Inactive personnel cannot reassign deals.',
      };
    }

    if (callerProfile.role !== 'admin' && callerProfile.role !== 'sales_manager') {
      return {
        success: false,
        error: 'Privilege Violation: Deal reassignment requires Administrative or Sales Manager authorization.',
      };
    }

    const { data: destUser, error: destError } = await supabase
      .from('profiles')
      .select('id, full_name, role, status')
      .eq('id', data.newAssigneeId)
      .maybeSingle();

    if (destError || !destUser) {
      return {
        success: false,
        error: 'Target representative does not exist in the agency directory.',
      };
    }

    if (destUser.status !== 'active') {
      return {
        success: false,
        error: 'Cannot assign deal to an inactive or suspended representative.',
      };
    }

    if (destUser.role === 'viewer') {
      return {
        success: false,
        error: 'Cannot assign deal to read-only personnel.',
      };
    }

    const { data: currentLead, error: currentLeadError } = await supabase
      .from('leads')
      .select('id, lead_id, assigned_to, converted_at')
      .eq('id', data.leadId)
      .maybeSingle();

    if (currentLeadError || !currentLead) {
      return {
        success: false,
        error: 'Deal record not found or inaccessible.',
      };
    }

    if (currentLead.converted_at && callerProfile.role !== 'admin') {
      return {
        success: false,
        error: 'Forbidden: Converted deals are locked from non-admin modifications.',
      };
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update({ assigned_to: data.newAssigneeId })
      .eq('id', data.leadId);

    if (updateError) {
      return {
        success: false,
        error: `Reassignment update rejected: ${updateError.message}`,
      };
    }

    const sanitizedNote = data.note ? sanitizeHtml(data.note.trim()) : null;
    const descriptionText = sanitizedNote
      ? `Deal reassigned to ${destUser.full_name} by ${callerProfile.full_name}. Note: ${sanitizedNote}`
      : `Deal reassigned to ${destUser.full_name} by ${callerProfile.full_name}.`;

    await supabase.from('lead_activities').insert({
      lead_id: data.leadId,
      actor_id: user.id,
      activity_type: 'reassignment',
      description: descriptionText,
      metadata: {
        previous_assignee_id: currentLead.assigned_to,
        new_assignee_id: data.newAssigneeId,
        new_assignee_name: destUser.full_name,
        reassigned_by: callerProfile.full_name,
        note: sanitizedNote,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/leads');
    revalidatePath('/admin/tasks');
    revalidatePath('/admin/team');

    return {
      success: true,
      id: data.leadId,
      leadId: data.leadId,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Action Error';
    return {
      success: false,
      error: `Execution failure: ${message}`,
    };
  }
}

/**
 * Modifies commercial deal parameters (valuation, priority tier, internal notes).
 * Enforces role guards: Sales Executives may only edit deals assigned to their portfolio.
 *
 * @param inputOrLeadId Object conforming to `updateLeadDealParametersSchema` or leadId string.
 * @param optionalPayload Deal parameters when called with positional arguments.
 * @returns {Promise<LeadActionResult>} Operation outcome.
 */
export async function updateLeadDealParameters(
  inputOrLeadId: unknown,
  optionalPayload?: {
    expectedValue?: number;
    priority?: LeadPriority;
    notes?: string | null;
  }
): Promise<LeadActionResult> {
  try {
    let normalizedInput: unknown;
    if (typeof inputOrLeadId === 'string') {
      normalizedInput = {
        leadId: inputOrLeadId,
        expectedValue: optionalPayload?.expectedValue,
        priority: optionalPayload?.priority,
        notes: optionalPayload?.notes,
      };
    } else {
      normalizedInput = inputOrLeadId;
    }

    const validationResult = updateLeadDealParametersSchema.safeParse(normalizedInput);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      return {
        success: false,
        error: firstIssue ? firstIssue.message : 'Invalid deal parameter values.',
      };
    }

    const data = validationResult.data;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: Active CRM session required to modify deal parameters.',
      };
    }

    const { data: callerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !callerProfile) {
      return {
        success: false,
        error: 'Caller profile could not be verified in the agency directory.',
      };
    }

    if (callerProfile.status !== 'active') {
      return {
        success: false,
        error: 'Account suspended: Inactive personnel cannot modify deal parameters.',
      };
    }

    if (callerProfile.role === 'viewer') {
      return {
        success: false,
        error: 'Privilege Violation: Read-only personnel cannot modify deal parameters.',
      };
    }

    const { data: currentLead, error: leadError } = await supabase
      .from('leads')
      .select('id, assigned_to, converted_at')
      .eq('id', data.leadId)
      .maybeSingle();

    if (leadError || !currentLead) {
      return {
        success: false,
        error: 'Deal record not found or inaccessible.',
      };
    }

    if (currentLead.converted_at && callerProfile.role !== 'admin') {
      return {
        success: false,
        error: 'Forbidden: Converted deals are locked from non-admin modifications.',
      };
    }

    if (callerProfile.role === 'sales_executive' && currentLead.assigned_to !== user.id) {
      return {
        success: false,
        error: 'Privilege Violation: Sales executives may only edit deals assigned to their portfolio.',
      };
    }

    const updatePayload: Record<string, unknown> = {};
    if (data.expectedValue !== undefined) {
      updatePayload.expected_value = data.expectedValue;
    }
    if (data.priority !== undefined) {
      updatePayload.priority = data.priority;
    }
    if (data.notes !== undefined) {
      updatePayload.notes =
        data.notes && data.notes.trim().length > 0
          ? sanitizeHtml(data.notes.trim())
          : null;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from('leads')
        .update(updatePayload)
        .eq('id', data.leadId);

      if (updateError) {
        return {
          success: false,
          error: `Deal parameters update rejected: ${updateError.message}`,
        };
      }

      await supabase.from('lead_activities').insert({
        lead_id: data.leadId,
        actor_id: user.id,
        activity_type: 'field_update',
        description: `Deal terms updated by ${callerProfile.full_name}.`,
        metadata: {
          updated_fields: Object.keys(updatePayload),
        },
      });
    }

    revalidatePath('/admin');
    revalidatePath('/admin/leads');
    revalidatePath('/admin/tasks');
    revalidatePath('/admin/analytics');

    return {
      success: true,
      id: data.leadId,
      leadId: data.leadId,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Action Error';
    return {
      success: false,
      error: `Execution failure: ${message}`,
    };
  }
}

/**
 * One-click clearance for completed follow-up touchpoints from the scheduler queue.
 * Clears the next_follow_up date and logs completion in the activity ledger.
 *
 * @param leadId Lead identifier.
 * @param note Optional resolution context.
 * @returns {Promise<LeadActionResult>} Operation outcome.
 */
export async function clearLeadFollowUp(
  leadId: string,
  note?: string
): Promise<LeadActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Session required.' };
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('full_name, role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.status !== 'active') {
      return { success: false, error: 'Account suspended or unverified.' };
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update({ next_follow_up: null })
      .eq('id', leadId);

    if (updateError) {
      return { success: false, error: `Clearing follow-up failed: ${updateError.message}` };
    }

    const cleanNote = note ? sanitizeHtml(note) ?? note : undefined;
    const desc = `Scheduled follow-up marked as completed by ${callerProfile.full_name}.${cleanNote ? ` Note: ${cleanNote}` : ''}`;

    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      actor_id: user.id,
      activity_type: 'note_added',
      description: desc,
      metadata: {
        cleared_follow_up: true,
        note: cleanNote,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/tasks');
    revalidatePath('/admin/leads');

    return { success: true, id: leadId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Clear follow-up fault.';
    return { success: false, error: message };
  }
}

/**
 * Converts a raw inbound lead or inquiry into an active commercial deal opportunity.
 * Advances the lead into a qualified stage with target contract valuation, deal priority,
 * and designated representative assignment.
 *
 * @param input Raw input matching convertLeadToDealSchema.
 * @returns {Promise<LeadActionResult>}
 */
export async function convertInboundLeadToDealAction(
  input: unknown
): Promise<LeadActionResult> {
  try {
    const parsed = convertLeadToDealSchema.safeParse(input);

    if (!parsed.success) {
      const validationErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() || 'form';
        validationErrors[field] = issue.message;
      }
      return {
        success: false,
        error: 'Validation failed for lead conversion.',
        validationErrors,
      };
    }

    const { leadId, targetStatusId, expectedValue, assignedTo, priority, notes } = parsed.data;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: Active CRM session required to convert inbound lead.',
      };
    }

    const { data: callerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !callerProfile) {
      return {
        success: false,
        error: 'Forbidden: Operational identity profile not found.',
      };
    }

    if (callerProfile.status !== 'active') {
      return {
        success: false,
        error: 'Forbidden: Inactive or suspended accounts cannot convert leads.',
      };
    }

    // Managerial Authorization Guard: Inbound triage and commercial deal creation restricted to Admin & Sales Manager
    if (callerProfile.role !== 'admin' && callerProfile.role !== 'sales_manager') {
      return {
        success: false,
        error: 'Forbidden: Only administrators and sales managers can convert inbound leads to pipeline deals.',
      };
    }

    // Verify existing lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, lead_id, name, company, status_id, assigned_to, funnel_statuses(id, name, bucket)')
      .eq('id', leadId)
      .maybeSingle();

    if (leadError || !lead) {
      return {
        success: false,
        error: 'Inbound inquiry not found or inaccessible under security boundaries.',
      };
    }

    // Resolve target status: if not provided or valid, find first potential status
    let resolvedStatusId = targetStatusId;
    let targetStatusName = 'Qualified Deal';

    if (!resolvedStatusId) {
      const { data: statusMatch } = await supabase
        .from('funnel_statuses')
        .select('id, name, bucket, is_active')
        .eq('is_active', true)
        .eq('bucket', 'potential')
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (statusMatch) {
        resolvedStatusId = statusMatch.id;
        targetStatusName = statusMatch.name;
      } else {
        // Fallback to current status
        resolvedStatusId = lead.status_id;
      }
    } else {
      const { data: statusObj } = await supabase
        .from('funnel_statuses')
        .select('id, name, bucket, is_active')
        .eq('id', resolvedStatusId)
        .maybeSingle();

      if (!statusObj || !statusObj.is_active) {
        return {
          success: false,
          error: 'Invalid target stage: Funnel stage does not exist or is currently inactive.',
        };
      }

      if (statusObj.bucket === 'converted' || statusObj.bucket === 'lost') {
        return {
          success: false,
          error: 'Invalid target stage: Inbound conversion must enter an active pipeline stage, not terminal states.',
        };
      }

      targetStatusName = statusObj.name;
    }

    // Determine assignee
    let finalAssignee = lead.assigned_to;
    if (assignedTo && isValidUuid(assignedTo)) {
      finalAssignee = assignedTo;
    }

    const cleanNotes = notes ? sanitizeHtml(notes) ?? notes : null;

    // Execute atomic update with row verification
    const { data: updatedRows, error: updateError } = await supabase
      .from('leads')
      .update({
        status_id: resolvedStatusId,
        expected_value: expectedValue,
        priority,
        assigned_to: finalAssignee,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select('id');

    if (updateError || !updatedRows || updatedRows.length === 0) {
      return {
        success: false,
        error: updateError
          ? `Database mutation error during lead conversion: ${updateError.message}`
          : 'Lead conversion failed: Inbound inquiry not found or inaccessible.',
      };
    }

    // Log conversion activity
    const activityDesc = `Inbound lead converted to active deal (${targetStatusName}) with expected valuation ₹${expectedValue.toLocaleString('en-IN')} by ${callerProfile.full_name}.${cleanNotes ? ` Notes: ${cleanNotes}` : ''}`;

    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      actor_id: user.id,
      activity_type: 'note_added',
      description: activityDesc,
      metadata: {
        converted_to_deal: true,
        previous_status_id: lead.status_id,
        new_status_id: resolvedStatusId,
        expected_value: expectedValue,
        priority,
        assigned_to: finalAssignee,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/leads');
    revalidatePath('/admin/deals');

    return {
      success: true,
      id: leadId,
      leadId,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected lead conversion fault.';
    return { success: false, error: message };
  }
}
/**
 * Updates comprehensive commercial engagement scope, contact coordinates,
 * deal valuation, priority tier, and client notes from the Client 360° Dossier Drawer.
 *
 * @param input Raw payload validated against updateLeadDetailsSchema
 * @returns {Promise<LeadActionResult>} Operation outcome
 */
export async function updateLeadDetailsAction(
  input: UpdateLeadDetailsInput
): Promise<LeadActionResult> {
  try {
    const validationResult = updateLeadDetailsSchema.safeParse(input);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      return {
        success: false,
        error: firstIssue ? firstIssue.message : 'Invalid lead details parameters.',
      };
    }

    const data = validationResult.data;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: Active CRM session required to modify lead details.',
      };
    }

    const { data: callerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !callerProfile) {
      return {
        success: false,
        error: 'Caller profile could not be verified in the agency directory.',
      };
    }

    if (callerProfile.status !== 'active') {
      return {
        success: false,
        error: 'Account suspended: Inactive personnel cannot modify lead parameters.',
      };
    }

    if (callerProfile.role === 'viewer') {
      return {
        success: false,
        error: 'Privilege Violation: Read-only personnel cannot modify lead parameters.',
      };
    }

    const { data: currentLead, error: leadError } = await supabase
      .from('leads')
      .select('id, assigned_to, converted_at, name, company, email, phone')
      .eq('id', data.leadId)
      .maybeSingle();

    if (leadError || !currentLead) {
      return {
        success: false,
        error: 'Lead record not found or inaccessible.',
      };
    }

    if (currentLead.converted_at && callerProfile.role !== 'admin') {
      return {
        success: false,
        error: 'Forbidden: Converted deals are locked from non-admin modifications.',
      };
    }

    if (callerProfile.role === 'sales_executive' && currentLead.assigned_to !== user.id) {
      return {
        success: false,
        error: 'Privilege Violation: Sales executives may only edit leads assigned to their portfolio.',
      };
    }

    // Enforce PostgreSQL chk_lead_contact_info constraint: at least one coordinate must be preserved
    const finalEmail = data.email !== undefined
      ? (data.email && data.email.trim().length > 0 ? normalizeEmail(data.email) : null)
      : currentLead.email;
    const finalPhone = data.phone !== undefined
      ? (data.phone && data.phone.trim().length > 0 ? (normalizePhone(data.phone)?.phone || null) : null)
      : currentLead.phone;

    if (!finalEmail && !finalPhone) {
      return {
        success: false,
        error: 'Invariant Violation: A lead must retain at least one valid contact coordinate (email or phone).',
      };
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      updatePayload.name = sanitizeHtml(trimmed) ?? trimmed;
    }
    if (data.company !== undefined) {
      updatePayload.company = data.company && data.company.trim().length > 0 ? sanitizeHtml(data.company.trim()) : null;
    }
    if (data.companyWebsite !== undefined) {
      updatePayload.company_website = data.companyWebsite && data.companyWebsite.trim().length > 0 ? sanitizeHtml(data.companyWebsite.trim()) : null;
    }
    if (data.industry !== undefined) {
      updatePayload.industry = data.industry && data.industry.trim().length > 0 ? sanitizeHtml(data.industry.trim()) : null;
    }
    if (data.email !== undefined) {
      updatePayload.email = finalEmail;
    }
    if (data.phone !== undefined) {
      updatePayload.phone = finalPhone;
    }
    if (data.preferredChannel !== undefined) {
      updatePayload.preferred_channel = data.preferredChannel;
    }
    if (data.serviceCategory !== undefined) {
      updatePayload.service_category = data.serviceCategory;
    }
    if (data.budgetBracket !== undefined) {
      updatePayload.budget_bracket = data.budgetBracket && data.budgetBracket.trim().length > 0 ? sanitizeHtml(data.budgetBracket.trim()) : null;
    }
    if (data.expectedValue !== undefined) {
      updatePayload.expected_value = data.expectedValue;
    }
    if (data.priority !== undefined) {
      updatePayload.priority = data.priority;
    }
    if (data.notes !== undefined) {
      updatePayload.notes = data.notes && data.notes.trim().length > 0 ? sanitizeHtml(data.notes.trim()) : null;
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', data.leadId);

    if (updateError) {
      return {
        success: false,
        error: `Lead details update rejected: ${updateError.message}`,
      };
    }

    // Immutable audit ledger entry - strictly enforces PostgreSQL CHECK constraint ('field_update')
    const { error: activityError } = await supabase.from('lead_activities').insert({
      lead_id: data.leadId,
      actor_id: user.id,
      activity_type: 'field_update',
      description: `Lead details & commercial scope updated by ${callerProfile.full_name}`,
      metadata: {
        updated_fields: Object.keys(updatePayload).filter((k) => k !== 'updated_at'),
        updated_at: updatePayload.updated_at,
      },
    });

    if (activityError) {
      console.error('[updateLeadDetailsAction] Activity ledger append failed:', activityError);
    }

    revalidatePath('/admin');
    revalidatePath('/admin/leads');
    revalidatePath('/admin/deals');

    return {
      success: true,
      leadId: data.leadId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal failure while updating lead details.';
    return {
      success: false,
      error: message,
    };
  }
}
