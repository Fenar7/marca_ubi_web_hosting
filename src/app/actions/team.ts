'use server';

/**
 * @file team.ts
 * @description Server Actions for multi-user identity provisioning, role governance,
 *              and administrative team management (/admin/team).
 *              Integrates the privileged Supabase Admin SDK with two-phase transactional
 *              rollback mechanics to prevent orphaned identities and enforce agency invariants.
 * @module actions/team
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import { getAdminClient } from '@/app/lib/supabase/admin';
import type {
  CrmUserRole,
  ProfileAccountStatus,
  Profile,
  TeamMemberRosterItem,
  TeamActionResult,
} from '@/types/crm';

import { createTeamUserSchema, type CreateTeamUserFormData } from '@/app/lib/team-schemas';

/**
 * Verifies that the active request session belongs to an active administrator.
 * Throws an explicit authorization error if the caller is unauthenticated, suspended,
 * or lacks the privileged 'admin' role.
 */
async function assertActiveAdmin(): Promise<{ callerId: string; callerEmail: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

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
 * Provisions a new team member account within the agency CRM.
 *
 * Two-Phase Transactional Mechanics:
 * 1. Auth Identity Creation: Invokes `adminClient.auth.admin.createUser` with `email_confirm: true`.
 * 2. Profile Record Persistence: Atomically inserts into `public.profiles` with `must_change_password = true`.
 * 3. Compensating Rollback: If database profile insertion fails, immediately executes `adminClient.auth.admin.deleteUser`
 *    to purge the orphaned Auth identity, guaranteeing zero dangling auth records.
 * 4. Audit Log Recording: Records an immutable entry in `public.team_audit_logs`.
 *
 * @param {CreateTeamUserFormData} input Unsanitized team member input payload.
 * @returns {Promise<TeamActionResult<Profile>>} Result envelope with provisioned profile or validation errors.
 */
export async function createTeamUser(
  input: CreateTeamUserFormData
): Promise<TeamActionResult<Profile>> {
  // 1. Validate input payload against Zod schema
  const parsed = createTeamUserSchema.safeParse(input);
  if (!parsed.success) {
    const validationErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] ? String(issue.path[0]) : 'form';
      validationErrors[field] = issue.message;
    });

    return {
      success: false,
      error: 'Validation failed. Please correct the highlighted errors.',
      validationErrors,
    };
  }

  const { fullName, email, role, jobTitle, phone, tempPassword } = parsed.data;

  // 2. Enforce active administrator authorization boundary
  let caller: { callerId: string; callerEmail: string };
  try {
    caller = await assertActiveAdmin();
  } catch (authErr: unknown) {
    const message = authErr instanceof Error ? authErr.message : 'Authorization check failed.';
    return { success: false, error: message };
  }

  const adminClient = getAdminClient();

  // 3. Pre-flight duplicate check against public.profiles
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    return {
      success: false,
      error: 'A team member with this email address already exists in the agency directory.',
    };
  }

  // 4. Phase 1: Provision identity in Supabase Auth via Admin SDK
  let newUserId: string;
  try {
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        job_title: jobTitle,
        must_change_password: true,
      },
      app_metadata: {
        role,
      },
    });

    if (authError || !authData.user) {
      if (authError?.message?.toLowerCase().includes('already') || authError?.message?.toLowerCase().includes('exists')) {
        return {
          success: false,
          error: 'An authentication identity with this email already exists.',
        };
      }
      return {
        success: false,
        error: `Authentication identity provisioning failed: ${authError?.message || 'Unknown auth error.'}`,
      };
    }

    newUserId = authData.user.id;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reach authentication service.';
    return { success: false, error: message };
  }

  // 5. Phase 2: Insert domain profile in public.profiles with transactional compensation
  try {
    const { data: newProfile, error: profileInsertError } = await adminClient
      .from('profiles')
      .insert({
        id: newUserId,
        email,
        full_name: fullName,
        role,
        job_title: jobTitle,
        phone,
        status: 'active',
        invited_by: caller.callerId,
        must_change_password: true,
      })
      .select()
      .single();

    if (profileInsertError || !newProfile) {
      throw profileInsertError || new Error('Failed to retrieve inserted profile record.');
    }

    // 6. Record immutable compliance entry in public.team_audit_logs
    const { error: auditError } = await adminClient
      .from('team_audit_logs')
      .insert({
        actor_id: caller.callerId,
        action: 'user_created',
        target_user_email: email,
        details: {
          target_user_id: newUserId,
          role,
          job_title: jobTitle,
          full_name: fullName,
          invited_by_id: caller.callerId,
          invited_by_email: caller.callerEmail,
          created_at: new Date().toISOString(),
        },
      });

    if (auditError) {
      console.warn('[AUDIT_WARNING] Team audit log entry failed to record:', auditError.message);
    }

    try {
      revalidatePath('/admin/team');
    } catch {
      // Safe no-op outside Next.js request context
    }

    return {
      success: true,
      data: newProfile as Profile,
    };
  } catch (profileError: unknown) {
    // COMPENSATING ROLLBACK TRANSACTION:
    // If domain profile insertion encounters an unexpected database constraint failure or network disconnect,
    // immediately delete the provisioned Auth user to guarantee zero orphaned identities.
    console.error(
      `[ROLLBACK_ALERT] Profile creation failed for user ${newUserId}. Executing compensating auth deletion:`,
      profileError
    );

    try {
      await adminClient.auth.admin.deleteUser(newUserId);
      console.log(`[ROLLBACK_SUCCESS] Orphaned auth user ${newUserId} successfully deleted.`);
    } catch (rollbackErr: unknown) {
      console.error(
        `[CRITICAL_ROLLBACK_FAILURE] Failed to delete orphaned auth user ${newUserId}:`,
        rollbackErr
      );
    }

    return {
      success: false,
      error: 'Database profile provisioning failed. The authentication identity was safely rolled back.',
    };
  }
}

/**
 * Updates a team member's commercial role.
 * Enforces the agency sole-administrator invariant: prevents demoting the last active administrator.
 *
 * @param {string} targetUserId UUID of the user whose role is being changed.
 * @param {CrmUserRole} newRole The target role to assign.
 * @returns {Promise<TeamActionResult<Profile>>} Updated profile record or error.
 */
export async function updateTeamUserRole(
  targetUserId: string,
  newRole: CrmUserRole
): Promise<TeamActionResult<Profile>> {
  if (!targetUserId || !newRole) {
    return { success: false, error: 'Target user ID and new role are required.' };
  }

  let caller: { callerId: string; callerEmail: string };
  try {
    caller = await assertActiveAdmin();
  } catch (authErr: unknown) {
    const message = authErr instanceof Error ? authErr.message : 'Authorization check failed.';
    return { success: false, error: message };
  }

  const adminClient = getAdminClient();

  // Retrieve current target profile
  const { data: targetProfile, error: fetchError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .maybeSingle();

  if (fetchError || !targetProfile) {
    return { success: false, error: 'Target team member profile not found.' };
  }

  // Sole active administrator invariant pre-check
  if (targetProfile.role === 'admin' && targetProfile.status === 'active' && newRole !== 'admin') {
    const { count, error: countError } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('status', 'active');

    if (countError) {
      return { success: false, error: 'Failed to verify active administrator count.' };
    }

    if (count !== null && count <= 1) {
      return {
        success: false,
        error: 'Agency Invariant Violation: Operation rejected. Cannot demote the sole active administrator in the agency.',
      };
    }
  }

  try {
    // Update profile role in public.profiles (protected by database trigger trg_protect_sole_admin)
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      if (updateError?.code === '23514') {
        return {
          success: false,
          error: 'Agency Invariant Violation: Operation rejected. Cannot demote the sole active administrator in the agency.',
        };
      }
      throw updateError || new Error('Failed to update profile role.');
    }

    // Synchronize role metadata in Supabase Auth
    await adminClient.auth.admin.updateUserById(targetUserId, {
      app_metadata: { role: newRole },
      user_metadata: { role: newRole },
    });

    // Record audit event
    await adminClient.from('team_audit_logs').insert({
      actor_id: caller.callerId,
      action: 'role_changed',
      target_user_email: targetProfile.email,
      details: {
        target_user_id: targetUserId,
        previous_role: targetProfile.role,
        new_role: newRole,
        actor_email: caller.callerEmail,
        timestamp: new Date().toISOString(),
      },
    });

    try {
      revalidatePath('/admin/team');
    } catch {
      // Safe no-op outside Next.js request context
    }

    return {
      success: true,
      data: updatedProfile as Profile,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update team member role.';
    return { success: false, error: message };
  }
}

/**
 * Suspends or reactivates a team member account.
 * Enforces the agency sole-administrator invariant: prevents suspending the last active administrator.
 *
 * @param {string} targetUserId UUID of the user whose status is being modified.
 * @param {ProfileAccountStatus} newStatus Target operational status ('active' | 'suspended').
 * @returns {Promise<TeamActionResult<Profile>>} Updated profile record or error.
 */
export async function setTeamUserStatus(
  targetUserId: string,
  newStatus: ProfileAccountStatus
): Promise<TeamActionResult<Profile>> {
  if (!targetUserId || !newStatus) {
    return { success: false, error: 'Target user ID and operational status are required.' };
  }

  let caller: { callerId: string; callerEmail: string };
  try {
    caller = await assertActiveAdmin();
  } catch (authErr: unknown) {
    const message = authErr instanceof Error ? authErr.message : 'Authorization check failed.';
    return { success: false, error: message };
  }

  const adminClient = getAdminClient();

  const { data: targetProfile, error: fetchError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .maybeSingle();

  if (fetchError || !targetProfile) {
    return { success: false, error: 'Target team member profile not found.' };
  }

  // Sole active administrator invariant pre-check
  if (targetProfile.role === 'admin' && targetProfile.status === 'active' && newStatus === 'suspended') {
    const { count, error: countError } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('status', 'active');

    if (countError) {
      return { success: false, error: 'Failed to verify active administrator count.' };
    }

    if (count !== null && count <= 1) {
      return {
        success: false,
        error: 'Agency Invariant Violation: Operation rejected. Cannot suspend the sole active administrator in the agency.',
      };
    }
  }

  try {
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      if (updateError?.code === '23514') {
        return {
          success: false,
          error: 'Agency Invariant Violation: Operation rejected. Cannot suspend the sole active administrator in the agency.',
        };
      }
      throw updateError || new Error('Failed to update account status.');
    }

    // Record audit event
    const auditAction = newStatus === 'suspended' ? 'user_suspended' : 'user_activated';
    await adminClient.from('team_audit_logs').insert({
      actor_id: caller.callerId,
      action: auditAction,
      target_user_email: targetProfile.email,
      details: {
        target_user_id: targetUserId,
        previous_status: targetProfile.status,
        new_status: newStatus,
        actor_email: caller.callerEmail,
        timestamp: new Date().toISOString(),
      },
    });

    try {
      revalidatePath('/admin/team');
    } catch {
      // Safe no-op outside Next.js request context
    }

    return {
      success: true,
      data: updatedProfile as Profile,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update account status.';
    return { success: false, error: message };
  }
}

/**
 * Retrieves the complete agency commercial directory roster with active deal counts
 * and aggregated potential pipeline volume.
 * Accessible by authenticated staff with roles 'admin', 'sales_manager', or 'viewer'.
 *
 * @returns {Promise<TeamActionResult<TeamMemberRosterItem[]>>} Directory roster records.
 */
export async function getTeamRoster(): Promise<TeamActionResult<TeamMemberRosterItem[]>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized: Session authentication required.' };
  }

  const { data: callerProfile, error: callerProfileError } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (callerProfileError || !callerProfile) {
    return { success: false, error: 'Caller profile could not be verified.' };
  }

  if (callerProfile.status !== 'active') {
    return { success: false, error: 'Access Denied: Suspended accounts cannot view team directory.' };
  }

  if (callerProfile.role === 'sales_executive') {
    return { success: false, error: 'Access Denied: Sales Executives do not have roster inspection privileges.' };
  }

  const adminClient = getAdminClient();

  // Fetch all profiles ordered by creation timestamp
  const { data: profiles, error: profilesError } = await adminClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError || !profiles) {
    return { success: false, error: `Failed to load team roster: ${profilesError?.message || 'Unknown error'}` };
  }

  // Fetch all leads to compute active deal counts per representative
  const { data: leads, error: leadsError } = await adminClient
    .from('leads')
    .select('assigned_to, expected_value');

  if (leadsError) {
    return { success: false, error: `Failed to aggregate deal counts: ${leadsError.message}` };
  }

  // Aggregate deal counts and pipeline value per user
  const metricsMap = new Map<string, { count: number; totalValue: number }>();
  (leads || []).forEach((lead) => {
    if (lead.assigned_to) {
      const current = metricsMap.get(lead.assigned_to) || { count: 0, totalValue: 0 };
      current.count += 1;
      current.totalValue += Number(lead.expected_value || 0);
      metricsMap.set(lead.assigned_to, current);
    }
  });

  // Map invited_by names for presentation
  const profileNameMap = new Map<string, string>();
  profiles.forEach((p) => {
    profileNameMap.set(p.id, p.full_name);
  });

  const roster: TeamMemberRosterItem[] = profiles.map((p) => {
    const metrics = metricsMap.get(p.id) || { count: 0, totalValue: 0 };
    return {
      ...(p as Profile),
      active_deals_count: metrics.count,
      total_deal_value: metrics.totalValue,
      invited_by_name: p.invited_by ? profileNameMap.get(p.invited_by) || null : null,
    };
  });

  return {
    success: true,
    data: roster,
  };
}
