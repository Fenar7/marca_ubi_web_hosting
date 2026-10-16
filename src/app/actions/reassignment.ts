'use server';

/**
 * @file reassignment.ts
 * @description Server Actions for the Lead Reassignment Wizard and atomic pipeline transfer engine (/admin/team).
 *              Integrates the PostgreSQL stored procedure public.execute_atomic_lead_reassignment with
 *              deterministic row locking (ORDER BY id ASC FOR UPDATE) to eliminate deadlock risks,
 *              writes immutable touchpoint entries to public.lead_activities for every affected deal,
 *              and captures administrative governance logs in public.team_audit_logs.
 * @module actions/reassignment
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import { getAdminClient } from '@/app/lib/supabase/admin';
import type {
  TeamActionResult,
  RepDealInventory,
  StageDealBreakdown,
  ActiveDealSummary,
  AtomicReassignmentResult,
  FunnelBucket,
  LeadPriority,
} from '@/types/crm';
import {
  leadReassignmentSchema,
  repInventoryQuerySchema,
  type LeadReassignmentFormData,
} from '@/app/lib/reassignment-schemas';

/**
 * Asserts that the active request session belongs to an active administrator.
 * Throws an explicit authorization error if the caller is unauthenticated, suspended,
 * or lacks the privileged 'admin' role.
 */
async function assertActiveAdmin(): Promise<{ callerId: string; callerEmail: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: An active administrative session is required to perform this action.');
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
    throw new Error('Account suspended: Inactive administrators cannot perform team governance operations.');
  }

  if (profile.role !== 'admin') {
    throw new Error('Privilege Escalation Blocked: Only active administrators can perform team governance operations.');
  }

  return { callerId: profile.id, callerEmail: profile.email };
}

/**
 * Asserts that the caller is an active staff member with managerial or administrative oversight.
 */
async function assertActiveStaffManager(): Promise<{ callerId: string; callerEmail: string; role: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: An active session is required to inspect team member inventory.');
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
    throw new Error('Account suspended: Inactive personnel cannot access commercial inventory.');
  }

  if (profile.role !== 'admin' && profile.role !== 'sales_manager') {
    throw new Error('Access Denied: Only administrators and sales managers can inspect representative deal inventory.');
  }

  return { callerId: profile.id, callerEmail: profile.email, role: profile.role };
}

/**
 * Scans and aggregates the active commercial deal inventory for a specific sales representative.
 * Computes active deal count, cumulative pipeline valuation, overdue follow-ups, and stage breakdown.
 *
 * @param {string} userId - UUID of the target representative.
 * @returns {Promise<TeamActionResult<RepDealInventory>>} Complete inventory breakdown.
 */
export async function getRepDealInventory(userId: string): Promise<TeamActionResult<RepDealInventory>> {
  try {
    await assertActiveStaffManager();

    const validation = repInventoryQuerySchema.safeParse({ userId });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Invalid representative identifier.',
      };
    }

    const adminClient = getAdminClient();

    // 1. Fetch target representative profile
    const { data: targetProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, full_name, email, role, status')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !targetProfile) {
      return {
        success: false,
        error: 'Target representative profile could not be found.',
      };
    }

    // 2. Fetch all funnel statuses to accurately partition active vs terminal macro-buckets
    const { data: statuses, error: statusesError } = await adminClient
      .from('funnel_statuses')
      .select('id, name, bucket, color_code, sort_order')
      .order('sort_order', { ascending: true });

    if (statusesError || !statuses) {
      return {
        success: false,
        error: `Failed to load funnel stage configuration: ${statusesError?.message || 'Unknown error'}`,
      };
    }

    const activeStatusMap = new Map<string, { name: string; bucket: FunnelBucket; color_code: string; sort_order: number }>();
    const activeStatusIds: string[] = [];

    statuses.forEach((st) => {
      if (st.bucket !== 'converted' && st.bucket !== 'lost') {
        activeStatusIds.push(st.id);
        activeStatusMap.set(st.id, {
          name: st.name,
          bucket: st.bucket as FunnelBucket,
          color_code: st.color_code,
          sort_order: st.sort_order,
        });
      }
    });

    // 3. Fetch all active leads currently assigned to the target representative
    const { data: leads, error: leadsError } = await adminClient
      .from('leads')
      .select('id, lead_id, name, company, expected_value, priority, next_follow_up, created_at, status_id')
      .eq('assigned_to', userId)
      .in('status_id', activeStatusIds.length > 0 ? activeStatusIds : ['00000000-0000-0000-0000-000000000000'])
      .order('created_at', { ascending: false });

    if (leadsError) {
      return {
        success: false,
        error: `Failed to query representative deals: ${leadsError.message}`,
      };
    }

    const activeLeads = leads || [];
    const nowIso = new Date().toISOString();

    let cumulativeValue = 0;
    let overdueFollowUpsCount = 0;

    // Track stage distributions
    const stageCounts = new Map<string, { count: number; totalValue: number }>();

    activeLeads.forEach((lead) => {
      const val = Number(lead.expected_value || 0);
      cumulativeValue += val;

      if (lead.next_follow_up && lead.next_follow_up < nowIso) {
        overdueFollowUpsCount += 1;
      }

      const currentStage = stageCounts.get(lead.status_id) || { count: 0, totalValue: 0 };
      currentStage.count += 1;
      currentStage.totalValue += val;
      stageCounts.set(lead.status_id, currentStage);
    });

    // Compile ordered stage breakdown
    const stageBreakdown: StageDealBreakdown[] = [];
    statuses.forEach((st) => {
      if (activeStatusMap.has(st.id)) {
        const counts = stageCounts.get(st.id) || { count: 0, totalValue: 0 };
        stageBreakdown.push({
          status_id: st.id,
          status_name: st.name,
          bucket: st.bucket as FunnelBucket,
          color_code: st.color_code,
          sort_order: st.sort_order,
          deal_count: counts.count,
          total_value: counts.totalValue,
        });
      }
    });

    // Compile active deal summaries
    const dealSummaries: ActiveDealSummary[] = activeLeads.map((lead) => {
      const stageInfo = activeStatusMap.get(lead.status_id);
      return {
        id: lead.id,
        lead_id: lead.lead_id,
        name: lead.name,
        company: lead.company,
        expected_value: Number(lead.expected_value || 0),
        status_name: stageInfo?.name || 'In Progress',
        priority: lead.priority as LeadPriority,
        next_follow_up: lead.next_follow_up,
        created_at: lead.created_at,
      };
    });

    const inventory: RepDealInventory = {
      user_id: targetProfile.id,
      user_name: targetProfile.full_name,
      user_email: targetProfile.email,
      user_role: targetProfile.role,
      user_status: targetProfile.status,
      active_deals_count: activeLeads.length,
      cumulative_pipeline_value: cumulativeValue,
      overdue_follow_ups_count: overdueFollowUpsCount,
      stage_breakdown: stageBreakdown,
      deals: dealSummaries,
    };

    return {
      success: true,
      data: inventory,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred while querying deal inventory.';
    return { success: false, error: message };
  }
}

/**
 * Executes an atomic batch reassignment of all active leads from a source representative
 * to a designated destination team member via public.execute_atomic_lead_reassignment.
 *
 * @param {LeadReassignmentFormData} input - Validated reassignment payload.
 * @returns {Promise<TeamActionResult<AtomicReassignmentResult>>} Stored procedure execution result.
 */
export async function executeLeadReassignment(
  input: LeadReassignmentFormData
): Promise<TeamActionResult<AtomicReassignmentResult>> {
  try {
    const caller = await assertActiveAdmin();

    const validation = leadReassignmentSchema.safeParse(input);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return {
        success: false,
        error: firstIssue?.message || 'Invalid reassignment payload.',
      };
    }

    const { sourceUserId, destinationUserId, transferReason } = validation.data;
    const adminClient = getAdminClient();

    // Verify destination representative is an active commercial staff member
    const { data: destProfile, error: destError } = await adminClient
      .from('profiles')
      .select('id, full_name, email, role, status')
      .eq('id', destinationUserId)
      .maybeSingle();

    if (destError || !destProfile) {
      return {
        success: false,
        error: 'Destination representative profile not found in agency directory.',
      };
    }

    if (destProfile.status !== 'active') {
      return {
        success: false,
        error: 'Destination representative is currently suspended. Reassignment must target an active team member.',
      };
    }

    if (
      destProfile.role !== 'admin' &&
      destProfile.role !== 'sales_manager' &&
      destProfile.role !== 'sales_executive'
    ) {
      return {
        success: false,
        error: 'Destination representative must hold a commercial role (Sales Executive, Manager, or Admin).',
      };
    }

    // Call atomic PostgreSQL stored procedure
    const { data: rpcResult, error: rpcError } = await adminClient.rpc(
      'execute_atomic_lead_reassignment',
      {
        p_source_user_id: sourceUserId,
        p_destination_user_id: destinationUserId,
        p_admin_id: caller.callerId,
        p_transfer_reason: transferReason,
      }
    );

    if (rpcError) {
      return {
        success: false,
        error: `Database transaction aborted: ${rpcError.message}`,
      };
    }

    const parsedResult = rpcResult as unknown as AtomicReassignmentResult;

    // Trigger UI revalidation
    try {
      revalidatePath('/admin');
      revalidatePath('/admin/team');
      revalidatePath('/admin/leads');
    } catch {
      // Safe no-op outside Next.js request context
    }

    return {
      success: true,
      data: parsedResult,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during batch lead reassignment.';
    return { success: false, error: message };
  }
}
