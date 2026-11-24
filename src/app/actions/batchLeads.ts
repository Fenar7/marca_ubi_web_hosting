'use server';

/**
 * @file batchLeads.ts
 * @description Next.js 16 Server Actions for commercial batch mutations and data export.
 *              Strictly exports only async functions to adhere to Next.js boundary invariants.
 * @module actions/batchLeads
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import {
  batchUpdateLeadStatusSchema,
  batchReassignLeadsSchema,
  exportLeadsCsvSchema,
} from '@/app/lib/lead-schemas';
import { dashboardCsvCell } from '@/app/admin/lib/dashboardContracts';
import type { LeadActionResult } from '@/types/crm';

/**
 * Batch updates funnel stage for up to 100 candidate leads.
 * Executes atomic public.batch_update_lead_status RPC with deterministic row locking.
 */
export async function batchUpdateLeadStatusAction(
  input: unknown
): Promise<LeadActionResult<{ affectedCount: number; targetStatusName: string }>> {
  try {
    const parsed = batchUpdateLeadStatusSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid batch status parameters.',
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Active user session required.' };
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'batch_update_lead_status',
      {
        p_lead_ids: parsed.data.leadIds,
        p_status_id: parsed.data.statusId,
        p_actor_id: user.id,
        p_lost_reason: parsed.data.lostReason || null,
        p_note: parsed.data.note || null,
      }
    );

    if (rpcError) {
      return {
        success: false,
        error: `Database transaction aborted: ${rpcError.message}`,
      };
    }

    const result = rpcData as {
      success: boolean;
      affected_count: number;
      target_status_name: string;
    };

    revalidatePath('/admin');
    revalidatePath('/admin/leads');
    revalidatePath('/admin/deals');
    revalidatePath('/admin/analytics');

    return {
      success: true,
      data: {
        affectedCount: result.affected_count,
        targetStatusName: result.target_status_name,
      },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred during batch status update.';
    return { success: false, error: message };
  }
}

/**
 * Batch reassigns ownership of candidate deals to a target representative.
 * Executes atomic public.batch_reassign_leads RPC with deterministic row locking.
 */
export async function batchReassignLeadsAction(
  input: unknown
): Promise<LeadActionResult<{ affectedCount: number; destinationUserName: string }>> {
  try {
    const parsed = batchReassignLeadsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid batch reassignment parameters.',
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Active user session required.' };
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'batch_reassign_leads',
      {
        p_lead_ids: parsed.data.leadIds,
        p_destination_user_id: parsed.data.assigneeId,
        p_actor_id: user.id,
        p_transfer_reason: parsed.data.transferReason,
      }
    );

    if (rpcError) {
      return {
        success: false,
        error: `Database transaction aborted: ${rpcError.message}`,
      };
    }

    const result = rpcData as {
      success: boolean;
      affected_count: number;
      destination_user_name: string;
    };

    revalidatePath('/admin');
    revalidatePath('/admin/leads');
    revalidatePath('/admin/team');

    return {
      success: true,
      data: {
        affectedCount: result.affected_count,
        destinationUserName: result.destination_user_name,
      },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'An unexpected error occurred during batch lead reassignment.';
    return { success: false, error: message };
  }
}

/**
 * Generates an RFC 4180 CSV spreadsheet export with formula injection protection.
 * Masks financial values for unprivileged viewers.
 */
export async function exportLeadsCsvAction(
  input: unknown
): Promise<LeadActionResult<{ csvData: string; filename: string }>> {
  try {
    const parsed = exportLeadsCsvSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid export filter parameters.',
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Active user session required.' };
    }

    // Role & Feature check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, feature_permissions')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || 'viewer';
    const permissions = profile?.feature_permissions as Record<string, unknown> | null;
    const canExport = role === 'admin' || permissions?.can_export_data === true;

    if (!canExport) {
      return {
        success: false,
        error: 'Access Denied: You do not hold data export permissions.',
      };
    }

    const canViewFinancials =
      role === 'admin' ||
      role === 'sales_manager' ||
      permissions?.can_view_financials === true;

    let query = supabase
      .from('leads')
      .select(`
        id,
        lead_id,
        name,
        company,
        phone,
        email,
        preferred_channel,
        service_category,
        expected_value,
        priority,
        next_follow_up,
        created_at,
        converted_at,
        funnel_statuses(name, bucket),
        lead_sources(name),
        profiles!leads_assigned_to_fkey(full_name)
      `)
      .or(
        'brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true'
      )
      .order('created_at', { ascending: false })
      .limit(5000);

    if (parsed.data.leadIds && parsed.data.leadIds.length > 0) {
      query = query.in('id', parsed.data.leadIds);
    }
    if (parsed.data.stage) {
      query = query.eq('status_id', parsed.data.stage);
    }
    if (parsed.data.assignedTo) {
      query = query.eq('assigned_to', parsed.data.assignedTo);
    }
    if (parsed.data.source) {
      query = query.eq('lead_source_id', parsed.data.source);
    }
    if (parsed.data.priority) {
      query = query.ilike('priority', parsed.data.priority);
    }

    const { data: rows, error: queryError } = await query;

    if (queryError || !rows) {
      return {
        success: false,
        error: `Failed to query records for export: ${queryError?.message || 'Unknown error'}`,
      };
    }

    const headers = [
      'Lead ID',
      'Contact Name',
      'Company',
      'Email',
      'Phone',
      'Preferred Channel',
      'Service Practice',
      'Funnel Stage',
      'Lifecycle Bucket',
      'Representative',
      'Acquisition Source',
      'Priority Tier',
      'Expected Valuation (INR)',
      'Next Touchpoint SLA',
      'Creation Date',
      'Converted Date',
    ];

    const lines: string[] = [headers.map((h) => dashboardCsvCell(h)).join(',')];

    for (const row of rows) {
      const statusData = row.funnel_statuses as { name?: string; bucket?: string } | null;
      const sourceData = row.lead_sources as { name?: string } | null;
      const ownerData = row.profiles as { full_name?: string } | null;

      const cells = [
        dashboardCsvCell(row.lead_id || ''),
        dashboardCsvCell(row.name || ''),
        dashboardCsvCell(row.company || ''),
        dashboardCsvCell(row.email || ''),
        dashboardCsvCell(row.phone || ''),
        dashboardCsvCell(row.preferred_channel || ''),
        dashboardCsvCell(row.service_category || ''),
        dashboardCsvCell(statusData?.name || ''),
        dashboardCsvCell(statusData?.bucket || ''),
        dashboardCsvCell(ownerData?.full_name || 'Unassigned'),
        dashboardCsvCell(sourceData?.name || 'Direct / Organic'),
        dashboardCsvCell(row.priority || ''),
        dashboardCsvCell(
          canViewFinancials
            ? row.expected_value !== null
              ? Number(row.expected_value).toFixed(2)
              : '0.00'
            : '[RESTRICTED]'
        ),
        dashboardCsvCell(
          row.next_follow_up
            ? new Date(row.next_follow_up).toISOString().replace('T', ' ').substring(0, 16)
            : ''
        ),
        dashboardCsvCell(
          row.created_at
            ? new Date(row.created_at).toISOString().replace('T', ' ').substring(0, 16)
            : ''
        ),
        dashboardCsvCell(
          row.converted_at
            ? new Date(row.converted_at).toISOString().replace('T', ' ').substring(0, 16)
            : ''
        ),
      ];

      lines.push(cells.join(','));
    }

    const csvData = '\uFEFF' + lines.join('\r\n');
    const dateStr = new Date().toISOString().substring(0, 10);
    const filename = `marca_ubi_leads_export_${dateStr}.csv`;

    return {
      success: true,
      data: { csvData, filename },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred during CSV export.';
    return { success: false, error: message };
  }
}
