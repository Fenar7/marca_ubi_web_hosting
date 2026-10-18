'use server';

/**
 * @file works.ts
 * @description Next.js 16 Server Actions for Client Works & Project Deliverables (/admin/works).
 *              Manages post-conversion active client deliverables, interactive milestone checklist toggling,
 *              production stage state progression, operational health status updates, and director assignments.
 *              Enforces cryptographic caller authentication, explicit role boundaries, Supabase Row-Level Security,
 *              row update verification, and immutable activity logging across public.lead_activities.
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
 * Automatically synchronizes completion timestamps and logs immutable activity audit.
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

  const { supabase, callerProfile } = authCheck;

  // Retrieve current project coordinates and director assignment
  const { data: currentWork, error: fetchError } = await supabase
    .from('client_works')
    .select('id, lead_id, project_code, creative_lead_id, tech_lead_id, milestones, delivery_stage, health_status')
    .eq('id', workId)
    .maybeSingle();

  if (fetchError || !currentWork) {
    return {
      success: false,
      error: 'Client work project not found or inaccessible under security boundaries.',
    };
  }

  // Explicit role guard: Admin, Sales Manager, or assigned Creative/Tech Director
  const isDirectlyAuthorized =
    callerProfile.role === 'admin' ||
    callerProfile.role === 'sales_manager' ||
    currentWork.creative_lead_id === callerProfile.id ||
    currentWork.tech_lead_id === callerProfile.id;

  if (!isDirectlyAuthorized) {
    return {
      success: false,
      error: 'Forbidden: Only administrators, sales managers, or assigned directors can modify project milestones.',
    };
  }

  const rawMilestones = (currentWork.milestones as ClientWorkMilestone[]) || [];
  let found = false;
  let targetMilestoneTitle = milestoneId;

  const updatedMilestones: ClientWorkMilestone[] = rawMilestones.map((m) => {
    if (m.id === milestoneId) {
      found = true;
      targetMilestoneTitle = m.title;
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

  // Update client_works table with row verification
  const { data: updatedRows, error: updateError } = await supabase
    .from('client_works')
    .update({
      milestones: updatedMilestones,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workId)
    .select('id');

  if (updateError || !updatedRows || updatedRows.length === 0) {
    return {
      success: false,
      error: updateError
        ? `Database update failed: ${updateError.message}`
        : 'Milestone update rejected: Project not found or prohibited by security policies.',
    };
  }

  // Record immutable activity log
  if (currentWork.lead_id) {
    await supabase.from('lead_activities').insert({
      lead_id: currentWork.lead_id,
      actor_id: callerProfile.id,
      activity_type: 'note_added',
      description: `Deliverable milestone updated: "${targetMilestoneTitle}" marked as ${status} by ${callerProfile.full_name}.`,
      metadata: {
        work_id: workId,
        milestone_id: milestoneId,
        status,
      },
    });
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

  const { supabase, callerProfile } = authCheck;

  // Retrieve current project coordinates
  const { data: currentWork, error: fetchError } = await supabase
    .from('client_works')
    .select('id, lead_id, project_code, creative_lead_id, tech_lead_id, delivery_stage')
    .eq('id', workId)
    .maybeSingle();

  if (fetchError || !currentWork) {
    return {
      success: false,
      error: 'Client work project not found or inaccessible under security boundaries.',
    };
  }

  const isDirectlyAuthorized =
    callerProfile.role === 'admin' ||
    callerProfile.role === 'sales_manager' ||
    currentWork.creative_lead_id === callerProfile.id ||
    currentWork.tech_lead_id === callerProfile.id;

  if (!isDirectlyAuthorized) {
    return {
      success: false,
      error: 'Forbidden: Only administrators, sales managers, or assigned directors can transition production stages.',
    };
  }

  const updatePayload: Record<string, unknown> = {
    delivery_stage: stage,
    updated_at: new Date().toISOString(),
  };

  // If marking delivered, reflect health status as completed
  if (stage === 'delivered') {
    updatePayload.health_status = 'completed';
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from('client_works')
    .update(updatePayload)
    .eq('id', workId)
    .select('id');

  if (updateError || !updatedRows || updatedRows.length === 0) {
    return {
      success: false,
      error: updateError
        ? `Failed to transition delivery stage: ${updateError.message}`
        : 'Stage transition rejected: Project not found or prohibited by security policies.',
    };
  }

  // Record immutable activity log
  if (currentWork.lead_id) {
    await supabase.from('lead_activities').insert({
      lead_id: currentWork.lead_id,
      actor_id: callerProfile.id,
      activity_type: 'stage_change',
      description: `Production delivery stage transitioned from ${currentWork.delivery_stage} to ${stage} by ${callerProfile.full_name}.`,
      metadata: {
        work_id: workId,
        previous_stage: currentWork.delivery_stage,
        new_stage: stage,
      },
    });
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

  const { supabase, callerProfile } = authCheck;

  // Retrieve current project coordinates
  const { data: currentWork, error: fetchError } = await supabase
    .from('client_works')
    .select('id, lead_id, project_code, creative_lead_id, tech_lead_id, health_status')
    .eq('id', workId)
    .maybeSingle();

  if (fetchError || !currentWork) {
    return {
      success: false,
      error: 'Client work project not found or inaccessible under security boundaries.',
    };
  }

  const isDirectlyAuthorized =
    callerProfile.role === 'admin' ||
    callerProfile.role === 'sales_manager' ||
    currentWork.creative_lead_id === callerProfile.id ||
    currentWork.tech_lead_id === callerProfile.id;

  if (!isDirectlyAuthorized) {
    return {
      success: false,
      error: 'Forbidden: Only administrators, sales managers, or assigned directors can update delivery health status.',
    };
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from('client_works')
    .update({
      health_status: healthStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workId)
    .select('id');

  if (updateError || !updatedRows || updatedRows.length === 0) {
    return {
      success: false,
      error: updateError
        ? `Failed to update delivery health: ${updateError.message}`
        : 'Health update rejected: Project not found or prohibited by security policies.',
    };
  }

  // Record immutable activity log
  if (currentWork.lead_id) {
    await supabase.from('lead_activities').insert({
      lead_id: currentWork.lead_id,
      actor_id: callerProfile.id,
      activity_type: 'note_added',
      description: `Delivery operational health updated from ${currentWork.health_status} to ${healthStatus} by ${callerProfile.full_name}.`,
      metadata: {
        work_id: workId,
        previous_health: currentWork.health_status,
        new_health: healthStatus,
      },
    });
  }

  revalidatePath('/admin/works');
  return {
    success: true,
    data: { healthStatus },
  };
}

/**
 * Assigns or updates Creative Director and Technical Director oversight.
 * Restricts mutation strictly to administrators and sales managers.
 * Validates director identities against active user profiles.
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

  // Strict role boundary: Only Admins and Sales Managers can assign project directors
  if (callerProfile.role !== 'admin' && callerProfile.role !== 'sales_manager') {
    return {
      success: false,
      error: 'Forbidden: Only administrators and sales managers can reassign project directors.',
    };
  }

  // Verify project exists
  const { data: currentWork, error: fetchError } = await supabase
    .from('client_works')
    .select('id, lead_id, project_code')
    .eq('id', workId)
    .maybeSingle();

  if (fetchError || !currentWork) {
    return {
      success: false,
      error: 'Client work project not found or inaccessible.',
    };
  }

  // Validate active profile for Creative Director
  let creativeDirectorName: string | null = null;
  if (creativeLeadId) {
    const { data: creativeProfile } = await supabase
      .from('profiles')
      .select('id, full_name, status')
      .eq('id', creativeLeadId)
      .maybeSingle();

    if (!creativeProfile || creativeProfile.status !== 'active') {
      return {
        success: false,
        error: 'Invalid Creative Director: User profile not found or inactive.',
      };
    }
    creativeDirectorName = creativeProfile.full_name;
  }

  // Validate active profile for Technical Director
  let techDirectorName: string | null = null;
  if (techLeadId) {
    const { data: techProfile } = await supabase
      .from('profiles')
      .select('id, full_name, status')
      .eq('id', techLeadId)
      .maybeSingle();

    if (!techProfile || techProfile.status !== 'active') {
      return {
        success: false,
        error: 'Invalid Technical Director: User profile not found or inactive.',
      };
    }
    techDirectorName = techProfile.full_name;
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

  const { data: updatedRows, error: updateError } = await supabase
    .from('client_works')
    .update(updatePayload)
    .eq('id', workId)
    .select('id');

  if (updateError || !updatedRows || updatedRows.length === 0) {
    return {
      success: false,
      error: updateError
        ? `Failed to assign project directors: ${updateError.message}`
        : 'Director assignment rejected: Project not found or prohibited by security policies.',
    };
  }

  // Record immutable activity log
  if (currentWork.lead_id) {
    const directorSummary = [
      creativeLeadId !== undefined ? `Creative Director: ${creativeDirectorName || 'Unassigned'}` : null,
      techLeadId !== undefined ? `Tech Director: ${techDirectorName || 'Unassigned'}` : null,
    ]
      .filter(Boolean)
      .join(', ');

    await supabase.from('lead_activities').insert({
      lead_id: currentWork.lead_id,
      actor_id: callerProfile.id,
      activity_type: 'note_added',
      description: `Project directorial governance updated (${directorSummary}) by ${callerProfile.full_name}.`,
      metadata: {
        work_id: workId,
        creative_lead_id: creativeLeadId,
        tech_lead_id: techLeadId,
      },
    });
  }

  revalidatePath('/admin/works');
  return {
    success: true,
    data: { creativeLeadId, techLeadId },
  };
}
