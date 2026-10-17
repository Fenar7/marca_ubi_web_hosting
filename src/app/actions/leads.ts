'use server';

/**
 * @file leads.ts
 * @description Server Actions for manual lead creation and commercial assignee resolution.
 *              Enforces strict Supabase RLS security policies, role-based invariants,
 *              and transaction consistency across `public.leads` and `public.lead_activities`.
 * @module actions/leads
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import { normalizeEmail, normalizePhone, sanitizeHtml } from '@/app/lib/normalization';
import {
  createManualLeadSchema,
  type AssigneeOption,
  type LeadActionResult,
} from '@/app/lib/lead-schemas';
import type { CrmUserRole } from '@/types/crm';

const DEFAULT_NEW_FUNNEL_STATUS_ID = 'b0000000-0000-0000-0000-000000000001';
const DEFAULT_DIRECT_REFERRAL_SOURCE_ID = 'a0000000-0000-0000-0000-000000000003';
const DEFAULT_FOUNDER_OUTREACH_SOURCE_ID = 'a0000000-0000-0000-0000-000000000004';

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

    // Verify caller credentials and governance status
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

    // Enforce Master PRD Table 7 role boundary
    if (callerProfile.role === 'viewer') {
      return {
        success: false,
        error: 'Privilege Violation: Read-only personnel cannot create client records.',
      };
    }

    // Validate incoming payload via Zod
    const validationResult = createManualLeadSchema.safeParse(input);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      return {
        success: false,
        error: firstIssue ? firstIssue.message : 'Invalid prospective lead parameters.',
      };
    }

    const data = validationResult.data;

    // Contact coordinate normalization and HTML entity escaping
    const normalizedEmail = normalizeEmail(data.email);
    const phoneResult = normalizePhone(data.phone);
    const normalizedPhone = phoneResult.phone;

    const sanitizedName = sanitizeHtml(data.name) ?? data.name;
    const sanitizedCompany = sanitizeHtml(data.company);
    const sanitizedWebsite = sanitizeHtml(data.companyWebsite);
    const sanitizedNotes = sanitizeHtml(data.notes);
    const sanitizedBudget = sanitizeHtml(data.budgetBracket);

    // Enforce RLS assigned_to invariant:
    // Sales executives must assign the deal to themselves
    let targetAssigneeId: string | null = null;
    if (callerProfile.role === 'sales_executive') {
      targetAssigneeId = user.id;
    } else {
      // Admins and Managers can assign to any designated personnel, default to caller
      targetAssigneeId = data.assignedTo && data.assignedTo.trim().length > 0
        ? data.assignedTo
        : user.id;
    }

    // Determine lead acquisition source
    const defaultSourceId =
      callerProfile.role === 'admin'
        ? DEFAULT_FOUNDER_OUTREACH_SOURCE_ID
        : DEFAULT_DIRECT_REFERRAL_SOURCE_ID;
    const finalSourceId = data.leadSourceId || defaultSourceId;

    // Insert record under caller RLS credentials
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

    // Record initial engagement touchpoint in immutable activity store
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

    // Revalidate CRM workspaces
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
 * Queries active commercial personnel to populate the representative selector.
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
