'use server';

/**
 * @file workloadActions.ts
 * @description Server Actions for Manager Workload Oversight and Batch Overdue Lead Reassignment (/admin).
 *              Provides aggregated operational telemetry per sales representative (active deals, conversion rate,
 *              overdue touchpoints broken down into urgency tiers), and executes atomic batch deal reassignment
 *              with strict RBAC guards, post-conversion record locking, and immutable audit ledgering.
 * @module actions/workloadActions
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/app/lib/supabase/server';
import { getAdminClient } from '@/app/lib/supabase/admin';
import { calculateOverdueTier, type OverdueTier } from '@/app/admin/components/Badges/badgeUtils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Zod validation schema for batch overdue lead reassignment.
 */
export const batchReassignSchema = z.object({
  leadIds: z
    .array(z.string().regex(UUID_REGEX, 'Each lead ID must be a valid UUID v4.'))
    .min(1, 'At least one overdue deal must be selected for reassignment.')
    .max(100, 'Cannot reassign more than 100 deals in a single batch.'),
  destinationUserId: z.string().regex(UUID_REGEX, 'Destination representative ID must be a valid UUID v4.'),
  reason: z
    .string()
    .min(3, 'Reassignment rationale must contain at least 3 characters.')
    .max(1000, 'Reassignment rationale cannot exceed 1,000 characters.'),
});

export type BatchReassignInput = z.infer<typeof batchReassignSchema>;

export interface OverdueLeadSummary {
  id: string;
  leadId: string;
  name: string;
  company: string;
  expectedValue: number;
  priority: string;
  nextFollowUp: string;
  statusName: string;
  currentAssigneeId: string | null;
  currentAssigneeName: string;
  tier: OverdueTier;
  overdueLabel: string;
}

export interface RepWorkloadTelemetry {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  avatarInitials: string;
  activeDealsCount: number;
  totalPipelineValue: number;
  convertedDealsCount: number;
  conversionRatePercentage: number;
  overdueTasksCount: number;
  amberCount: number;
  orangeCount: number;
  criticalCount: number;
  overdueLeads: OverdueLeadSummary[];
}

export interface ManagerWorkloadData {
  reps: RepWorkloadTelemetry[];
  totals: {
    totalActiveReps: number;
    totalActiveDeals: number;
    totalPipelineValue: number;
    totalOverdueDeals: number;
    totalCriticalOverdue: number;
  };
  availableReps: Array<{ id: string; fullName: string; role: string; email: string }>;
}

export interface WorkloadActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
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

/**
 * Authenticates the caller session and verifies active account standing.
 */
async function authenticateManagerCaller(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: 'Unauthorized: An active authenticated session is required.',
      statusCode: 401,
      identity: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      error: 'Caller profile could not be verified in the agency directory.',
      statusCode: 403,
      identity: null,
    };
  }

  if (profile.status !== 'active') {
    return {
      error: 'Account suspended: Inactive personnel cannot access manager oversight controls.',
      statusCode: 403,
      identity: null,
    };
  }

  if (profile.role !== 'admin' && profile.role !== 'sales_manager') {
    return {
      error: 'Access Denied: Only administrators and sales managers can access workload oversight controls.',
      statusCode: 403,
      identity: null,
    };
  }

  return {
    error: null,
    statusCode: 200,
    identity: {
      userId: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role,
    },
  };
}

/**
 * Fetches aggregated sales representative workload metrics, active deal counts,
 * conversion rates, and tiered overdue touchpoints.
 *
 * @returns {Promise<WorkloadActionResult<ManagerWorkloadData>>} Aggregated telemetry payload.
 */
export async function getManagerWorkloadDataAction(): Promise<WorkloadActionResult<ManagerWorkloadData>> {
  try {
    const supabase = await createClient();
    const authCheck = await authenticateManagerCaller(supabase);

    if (!authCheck.identity) {
      return {
        success: false,
        error: authCheck.error || 'Authentication failed.',
        statusCode: authCheck.statusCode || 401,
      };
    }

    // 1. Fetch all commercial personnel
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status')
      .in('role', ['admin', 'sales_manager', 'sales_executive'])
      .order('full_name', { ascending: true });

    if (profilesError || !profiles) {
      return {
        success: false,
        error: `Failed to retrieve sales representatives: ${profilesError?.message || 'Unknown error'}`,
        statusCode: 500,
      };
    }

    // 2. Fetch all leads with current status and follow-up data
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        lead_id,
        name,
        company,
        expected_value,
        priority,
        next_follow_up,
        revisit_date,
        converted_at,
        assigned_to,
        status_id,
        funnel_statuses (
          name,
          bucket
        )
      `);

    if (leadsError || !leads) {
      return {
        success: false,
        error: `Failed to retrieve lead inventory: ${leadsError?.message || 'Unknown error'}`,
        statusCode: 500,
      };
    }

    const availableReps = profiles
      .filter((p) => p.status === 'active')
      .map((p) => ({
        id: p.id,
        fullName: p.full_name,
        role: p.role,
        email: p.email,
      }));

    const repMap = new Map<string, string>();
    profiles.forEach((p) => repMap.set(p.id, p.full_name));

    const repsTelemetry: RepWorkloadTelemetry[] = [];

    let totalActiveDeals = 0;
    let totalPipelineValue = 0;
    let totalOverdueDeals = 0;
    let totalCriticalOverdue = 0;

    for (const rep of profiles) {
      const repLeads = leads.filter((l) => l.assigned_to === rep.id);

      let activeDealsCount = 0;
      let repPipelineValue = 0;
      let convertedCount = 0;
      let lostCount = 0;
      let overdueTasksCount = 0;
      let amberCount = 0;
      let orangeCount = 0;
      let criticalCount = 0;

      const overdueLeads: OverdueLeadSummary[] = [];

      for (const lead of repLeads) {
        const rawStatus = lead.funnel_statuses;
        const statusRecord = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
        const bucket = (statusRecord?.bucket || 'open').toLowerCase();
        const statusName = statusRecord?.name || 'In Progress';
        const expectedVal = Number(lead.expected_value) || 0;

        if (bucket === 'converted') {
          convertedCount++;
        } else if (bucket === 'lost') {
          lostCount++;
        } else {
          // Active deal
          activeDealsCount++;
          repPipelineValue += expectedVal;

          // Check overdue tier
          const overdueResult = calculateOverdueTier(lead.next_follow_up, {
            bucket,
            statusName,
            revisitDate: lead.revisit_date,
          });

          if (overdueResult.isOverdue) {
            overdueTasksCount++;

            if (overdueResult.tier === 'amber') amberCount++;
            else if (overdueResult.tier === 'orange') orangeCount++;
            else if (overdueResult.tier === 'red_pulse') {
              criticalCount++;
              totalCriticalOverdue++;
            }

            overdueLeads.push({
              id: lead.id,
              leadId: lead.lead_id,
              name: lead.name,
              company: lead.company || 'Private Client',
              expectedValue: expectedVal,
              priority: lead.priority || 'Medium',
              nextFollowUp: lead.next_follow_up || '',
              statusName,
              currentAssigneeId: lead.assigned_to,
              currentAssigneeName: rep.full_name,
              tier: overdueResult.tier,
              overdueLabel: overdueResult.label,
            });
          }
        }
      }

      const totalClosed = convertedCount + lostCount;
      const conversionRatePercentage =
        totalClosed > 0
          ? Math.round((convertedCount / totalClosed) * 100)
          : repLeads.length > 0
            ? Math.round((convertedCount / repLeads.length) * 100)
            : 0;

      const avatarInitials = (rep.full_name || 'Commercial Rep')
        .split(' ')
        .filter(Boolean)
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'CR';

      totalActiveDeals += activeDealsCount;
      totalPipelineValue += repPipelineValue;
      totalOverdueDeals += overdueTasksCount;

      repsTelemetry.push({
        userId: rep.id,
        fullName: rep.full_name,
        email: rep.email,
        role: rep.role,
        status: rep.status,
        avatarInitials,
        activeDealsCount,
        totalPipelineValue: repPipelineValue,
        convertedDealsCount: convertedCount,
        conversionRatePercentage,
        overdueTasksCount,
        amberCount,
        orangeCount,
        criticalCount,
        overdueLeads,
      });
    }

    // Sort reps by overdue urgency descending, then by active deals
    repsTelemetry.sort((a, b) => {
      if (b.criticalCount !== a.criticalCount) return b.criticalCount - a.criticalCount;
      if (b.overdueTasksCount !== a.overdueTasksCount) return b.overdueTasksCount - a.overdueTasksCount;
      return b.activeDealsCount - a.activeDealsCount;
    });

    return {
      success: true,
      statusCode: 200,
      data: {
        reps: repsTelemetry,
        totals: {
          totalActiveReps: profiles.filter((p) => p.status === 'active').length,
          totalActiveDeals,
          totalPipelineValue,
          totalOverdueDeals,
          totalCriticalOverdue,
        },
        availableReps,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown exception occurred.';
    return {
      success: false,
      error: `Internal server failure while fetching workload telemetry: ${errorMsg}`,
      statusCode: 500,
    };
  }
}

/**
 * Executes a transactional batch reassignment of selected overdue deals to a designated team member.
 *
 * @param {unknown} rawInput - Untrusted client input.
 * @returns {Promise<WorkloadActionResult<{ reassignedCount: number; destinationName: string }>>} Result payload.
 */
export async function batchReassignOverdueLeadsAction(
  rawInput: unknown
): Promise<WorkloadActionResult<{ reassignedCount: number; destinationName: string }>> {
  try {
    const parseResult = batchReassignSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid batch reassignment payload.',
        statusCode: 422,
      };
    }

    const { leadIds, destinationUserId, reason } = parseResult.data;
    const supabase = await createClient();

    const authCheck = await authenticateManagerCaller(supabase);
    if (!authCheck.identity) {
      return {
        success: false,
        error: authCheck.error || 'Authentication failed.',
        statusCode: authCheck.statusCode || 401,
      };
    }

    const { userId: callerId, role: callerRole, fullName: callerName } = authCheck.identity;

    // 1. Verify destination representative exists and is active
    const { data: destProfile, error: destProfileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status')
      .eq('id', destinationUserId)
      .maybeSingle();

    if (destProfileError || !destProfile) {
      return {
        success: false,
        error: 'Destination representative profile not found in agency directory.',
        statusCode: 404,
      };
    }

    if (destProfile.status !== 'active') {
      return {
        success: false,
        error: 'Cannot reassign deals to a suspended representative. Choose an active team member.',
        statusCode: 400,
      };
    }

    if (
      destProfile.role !== 'admin' &&
      destProfile.role !== 'sales_manager' &&
      destProfile.role !== 'sales_executive'
    ) {
      return {
        success: false,
        error: 'Destination representative must hold an operational sales role (Executive, Manager, or Admin).',
        statusCode: 400,
      };
    }

    // 2. Fetch target leads to check post-conversion locking
    const { data: targetLeads, error: fetchLeadsError } = await supabase
      .from('leads')
      .select('id, lead_id, name, company, assigned_to, converted_at')
      .in('id', leadIds);

    if (fetchLeadsError || !targetLeads || targetLeads.length === 0) {
      return {
        success: false,
        error: 'None of the selected leads could be found in the database.',
        statusCode: 404,
      };
    }

    // Check post-conversion lock for non-admin callers
    if (callerRole !== 'admin') {
      const lockedLead = targetLeads.find((l) => l.converted_at);
      if (lockedLead) {
        return {
          success: false,
          error: `Forbidden: Converted deal ${lockedLead.lead_id} is locked from reassignment by non-admins.`,
          statusCode: 403,
        };
      }
    }

    const sanitizedReason = sanitizeInputText(reason);
    const nowIso = new Date().toISOString();

    // 3. Batch update leads.assigned_to
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        assigned_to: destinationUserId,
        updated_at: nowIso,
      })
      .in('id', leadIds);

    if (updateError) {
      return {
        success: false,
        error: `Database failure during batch lead reassignment: ${updateError.message}`,
        statusCode: 500,
      };
    }

    // 4. Batch record activities in public.lead_activities
    const activityEntries = targetLeads.map((lead) => ({
      lead_id: lead.id,
      actor_id: callerId,
      activity_type: 'reassignment',
      description: `Deal reassigned from previous owner to ${destProfile.full_name} by ${callerName}. Reason: ${sanitizedReason}`,
      metadata: {
        previous_assignee: lead.assigned_to,
        new_assignee: destinationUserId,
        reassignment_type: 'batch_overdue_transfer',
        reason: sanitizedReason,
        reassigned_at: nowIso,
      },
    }));

    const { error: activityError } = await supabase
      .from('lead_activities')
      .insert(activityEntries);

    if (activityError) {
      console.error('[workloadActions] Activity logging failure during batch reassignment:', activityError);
    }

    // 5. Record administrative governance log in public.team_audit_logs via privileged admin client
    try {
      const adminClient = getAdminClient();
      const { error: auditError } = await adminClient.from('team_audit_logs').insert({
        actor_id: callerId,
        action: 'leads_bulk_reassigned',
        target_user_email: destProfile.email,
        details: {
          destination_user_id: destinationUserId,
          reassigned_deal_count: leadIds.length,
          reassigned_lead_ids: leadIds,
          reason: sanitizedReason,
          timestamp: nowIso,
        },
      });

      if (auditError) {
        console.error('[workloadActions] Audit logging failure during batch reassignment:', auditError);
      }
    } catch (auditErr) {
      console.warn('[workloadActions] Audit logging notice:', auditErr);
    }

    // 6. Invalidate Next.js path caches
    try {
      revalidatePath('/admin');
      revalidatePath('/admin/leads');
      revalidatePath('/admin/team');
    } catch {
      // Safe no-op outside Next.js request context
    }

    return {
      success: true,
      statusCode: 200,
      data: {
        reassignedCount: leadIds.length,
        destinationName: destProfile.full_name,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown exception occurred.';
    return {
      success: false,
      error: `Internal server failure during batch reassignment: ${errorMsg}`,
      statusCode: 500,
    };
  }
}
