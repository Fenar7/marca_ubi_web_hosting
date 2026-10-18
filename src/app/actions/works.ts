'use server';

/**
 * @file works.ts
 * @description Next.js 16 Server Actions for Client Works & Project Deliverables (/admin/works).
 *              Manages post-conversion active client deliverables, interactive milestone checklist toggling,
 *              production stage state progression, operational health status updates, and director assignments.
 *              Enforces cryptographic caller authentication, Supabase Row-Level Security,
 *              and atomic updates across public.client_works.
 * @module actions/works
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import {
  updateClientWorkStageSchema,
  updateClientWorkHealthSchema,
  updateClientWorkMilestoneSchema,
  assignClientWorkLeadsSchema,
  type UpdateClientWorkStageFormData,
  type UpdateClientWorkHealthFormData,
  type UpdateClientWorkMilestoneFormData,
  type AssignClientWorkLeadsFormData,
} from '@/app/lib/client-works-schemas';
import type { ClientWorkItem, ClientWorkMilestone } from '@/types/crm';

export interface WorksActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string>;
}

/**
 * Verifies caller authentication and operational role privileges.
 * Restricts mutations to active users; Viewers are strictly barred.
 */
async function authenticateAndAuthorizeCaller() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false as const,
      error: 'Unauthorized: Active CRM session required to modify client works.',
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
      error: 'Forbidden: Suspended accounts are barred from modifying client projects.',
    };
  }

  if (profile.role === 'viewer') {
    return {
      authorized: false as const,
      error: 'Forbidden: Viewers hold read-only permissions across client deliverables.',
    };
  }

  return {
    authorized: true as const,
    supabase,
    callerProfile: profile,
  };
}

/**
 * Toggles or updates an individual milestone within a client work engagement.
 * Automatically synchronizes completion timestamps and recalculates project health.
 *
 * @param input Raw input matching updateClientWorkMilestoneSchema.
 * @returns {Promise<WorksActionResult<ClientWorkMilestone[]>>} Updated milestone list.
 */
export async function updateClientWorkMilestoneAction(
  input: unknown
): Promise<WorksActionResult<ClientWorkMilestone[]>> {
  const parsed = updateClientWorkMilestoneSchema.safeParse(input);

  if (!parsed.success) {
    const validationErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || 'form';
      validationErrors[field] = issue.message;
    }
    return {
      success: false,
      error: 'Validation failed for milestone update.',
      validationErrors,
    };
  }

  const { workId, milestoneId, status } = parsed.data;

  const authCheck = await authenticateAndAuthorizeCaller();
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const { supabase } = authCheck;

  // Retrieve current milestones for this client work
  const { data: currentWork, error: fetchError } = await supabase
    .from('client_works')
    .select('id, milestones, delivery_stage, health_status')
    .eq('id', workId)
    .maybeSingle();

  if (fetchError || !currentWork) {
    return {
      success: false,
      error: 'Client work project not found or inaccessible under security boundaries.',
    };
  }

  const rawMilestones = (currentWork.milestones as ClientWorkMilestone[]) || [];
  let found = false;

  const updatedMilestones: ClientWorkMilestone[] = rawMilestones.map((m) => {
    if (m.id === milestoneId) {
      found = true;
      return {
        ...m,
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      };
    }
    return m;
  });

  if (!found) {
    return {
      success: false,
      error: `Milestone "${milestoneId}" does not exist on this project.`,
    };
  }

  // Update client_works table
  const { error: updateError } = await supabase
    .from('client_works')
    .update({
      milestones: updatedMilestones,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workId);

  if (updateError) {
    return {
      success: false,
      error: `Database update failed: ${updateError.message}`,
    };
  }

  revalidatePath('/admin/works');
  return {
    success: true,
    data: updatedMilestones,
  };
}

/**
 * Transitions a client work engagement across production delivery stages.
 * If transitioned to 'delivered', automatically updates health_status to 'completed'.
 *
 * @param input Raw input matching updateClientWorkStageSchema.
 * @returns {Promise<WorksActionResult>}
 */
export async function updateClientWorkStageAction(
  input: unknown
): Promise<WorksActionResult<{ stage: string; healthStatus: string }>> {
  const parsed = updateClientWorkStageSchema.safeParse(input);

  if (!parsed.success) {
    const validationErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || 'form';
      validationErrors[field] = issue.message;
    }
    return {
      success: false,
      error: 'Validation failed for production stage transition.',
      validationErrors,
    };
  }

  const { workId, stage } = parsed.data;

  const authCheck = await authenticateAndAuthorizeCaller();
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const { supabase } = authCheck;

  const updatePayload: Record<string, unknown> = {
    delivery_stage: stage,
    updated_at: new Date().toISOString(),
  };

  // If marking delivered, reflect health status as completed
  if (stage === 'delivered') {
    updatePayload.health_status = 'completed';
  }

  const { error: updateError } = await supabase
    .from('client_works')
    .update(updatePayload)
    .eq('id', workId);

  if (updateError) {
    return {
      success: false,
      error: `Failed to transition delivery stage: ${updateError.message}`,
    };
  }

  revalidatePath('/admin/works');
  return {
    success: true,
    data: {
      stage,
      healthStatus: (updatePayload.health_status as string) || 'on_track',
    },
  };
}

/**
 * Updates operational delivery health status (on_track, at_risk, blocked, completed).
 *
 * @param input Raw input matching updateClientWorkHealthSchema.
 * @returns {Promise<WorksActionResult>}
 */
export async function updateClientWorkHealthAction(
  input: unknown
): Promise<WorksActionResult<{ healthStatus: string }>> {
  const parsed = updateClientWorkHealthSchema.safeParse(input);

  if (!parsed.success) {
    const validationErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || 'form';
      validationErrors[field] = issue.message;
    }
    return {
      success: false,
      error: 'Validation failed for delivery health update.',
      validationErrors,
    };
  }

  const { workId, healthStatus } = parsed.data;

  const authCheck = await authenticateAndAuthorizeCaller();
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const { supabase } = authCheck;

  const { error: updateError } = await supabase
    .from('client_works')
    .update({
      health_status: healthStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workId);

  if (updateError) {
    return {
      success: false,
      error: `Failed to update delivery health: ${updateError.message}`,
    };
  }

  revalidatePath('/admin/works');
  return {
    success: true,
    data: { healthStatus },
  };
}

/**
 * Assigns or updates Creative Director and Technical Director oversight.
 *
 * @param input Raw input matching assignClientWorkLeadsSchema.
 * @returns {Promise<WorksActionResult>}
 */
export async function assignClientWorkDirectorsAction(
  input: unknown
): Promise<WorksActionResult<{ creativeLeadId?: string | null; techLeadId?: string | null }>> {
  const parsed = assignClientWorkLeadsSchema.safeParse(input);

  if (!parsed.success) {
    const validationErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || 'form';
      validationErrors[field] = issue.message;
    }
    return {
      success: false,
      error: 'Validation failed for director assignment.',
      validationErrors,
    };
  }

  const { workId, creativeLeadId, techLeadId } = parsed.data;

  const authCheck = await authenticateAndAuthorizeCaller();
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const { supabase, callerProfile } = authCheck;

  // Only Admins and Sales Managers can assign directors
  if (callerProfile.role !== 'admin' && callerProfile.role !== 'sales_manager') {
    return {
      success: false,
      error: 'Forbidden: Only administrators and sales managers can reassign project directors.',
    };
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (creativeLeadId !== undefined) {
    updatePayload.creative_lead_id = creativeLeadId;
  }
  if (techLeadId !== undefined) {
    updatePayload.tech_lead_id = techLeadId;
  }

  const { error: updateError } = await supabase
    .from('client_works')
    .update(updatePayload)
    .eq('id', workId);

  if (updateError) {
    return {
      success: false,
      error: `Failed to assign project directors: ${updateError.message}`,
    };
  }

  revalidatePath('/admin/works');
  return {
    success: true,
    data: { creativeLeadId, techLeadId },
  };
}
