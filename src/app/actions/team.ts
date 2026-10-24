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

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import { getAdminClient } from '@/app/lib/supabase/admin';
import type {
  CrmUserRole,
  ProfileAccountStatus,
  Profile,
  TeamMemberRosterItem,
  TeamActionResult,
  PersonnelProfilePayload,
  PersonnelDealsPayload,
  PersonnelPerformanceKpis,
  PersonnelAuditLogEntry,
  LeadWithRelations,
} from '@/types/crm';

import {
  createTeamUserSchema,
  suspendTeamUserSchema,
  updateUserPermissionsSchema,
  adminResetPasswordSchema,
  adminRevokeSessionsSchema,
  updatePersonnelCoordinatesSchema,
  personnelDealsFilterSchema,
  SALES_REP_CAPACITY_LIMIT,
  type CreateTeamUserFormData,
  type UpdateUserPermissionsFormData,
  type UpdatePersonnelCoordinatesFormData,
  type PersonnelDealsFilterInput,
} from '@/app/lib/team-schemas';
import { ROLE_DEFAULT_TABS, ROLE_DEFAULT_FEATURES, type CrmTabKey } from '@/types/crm';
import { hasPersonnelDirectoryAccess } from '@/app/lib/team-permissions-config';

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

  const { fullName, email, role, jobTitle, phone, tempPassword, allowedTabs, featurePermissions } = parsed.data;

  // SEC-03: Administrators must always have all 9 canonical tabs to preserve agency governance
  // F-01: Fallback feature permissions to role defaults when omitted so permissions are not dropped
  const effectiveAllowedTabs: string[] =
    role === 'admin'
      ? ['command_center', 'leads', 'deals', 'works', 'tasks', 'users', 'analytics', 'ingestion', 'settings']
      : Array.isArray(allowedTabs) && allowedTabs.length > 0
      ? allowedTabs
      : (Object.keys(ROLE_DEFAULT_TABS[role] || {}) as CrmTabKey[]).filter(
          (k) => ROLE_DEFAULT_TABS[role]?.[k]
        );

  const effectiveFeaturePermissions =
    featurePermissions && Object.keys(featurePermissions).length > 0
      ? featurePermissions
      : ROLE_DEFAULT_FEATURES[role] || {};

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
        allowed_tabs: effectiveAllowedTabs,
      },
      app_metadata: {
        role,
        must_change_password: true,
        allowed_tabs: effectiveAllowedTabs,
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
        allowed_tabs: effectiveAllowedTabs,
        feature_permissions: effectiveFeaturePermissions,
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
          allowed_tabs: effectiveAllowedTabs,
          feature_permissions: effectiveFeaturePermissions,
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
 * Enforces dual governance invariants:
 * 1. Blocks administrator self-demotion (accidental or unilateral administrative lockout defense).
 * 2. Enforces the agency sole-administrator invariant: prevents demoting the last active administrator.
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

  const sanitizedUserId = targetUserId.trim();

  let caller: { callerId: string; callerEmail: string };
  try {
    caller = await assertActiveAdmin();
  } catch (authErr: unknown) {
    const message = authErr instanceof Error ? authErr.message : 'Authorization check failed.';
    return { success: false, error: message };
  }

  // Prevent Admin Self-Demotion (Security Invariant Protection)
  if (sanitizedUserId === caller.callerId && newRole !== 'admin') {
    return {
      success: false,
      error: 'Security Policy Violation: Administrators cannot demote their own account. Another administrator must perform this role modification.',
    };
  }

  const adminClient = getAdminClient();

  // Retrieve current target profile
  const { data: targetProfile, error: fetchError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', sanitizedUserId)
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
      .eq('id', sanitizedUserId)
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
    await adminClient.auth.admin.updateUserById(sanitizedUserId, {
      app_metadata: { role: newRole },
      user_metadata: { role: newRole },
    });

    // Record audit event
    await adminClient.from('team_audit_logs').insert({
      actor_id: caller.callerId,
      action: 'role_changed',
      target_user_email: targetProfile.email,
      details: {
        target_user_id: sanitizedUserId,
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
 * Suspends a team member account and instantly revokes all active authentication sessions.
 * Enforces strict administrative role authorization, self-suspension prevention,
 * and sole-administrator invariance protection.
 *
 * Technical Sequence (Master PRD Section 15.9):
 * 1. Schema Validation: Validates target user UUID and optional suspension rationale via Zod.
 * 2. Authorization Boundary: Confirms the caller is an active authenticated administrator.
 * 3. Self-Suspension Prevention: Explicitly blocks administrators from suspending their own accounts.
 * 4. Sole Admin Invariance: Prevents suspending the sole active administrator in the agency.
 * 5. Session Revocation: Invokes `adminClient.auth.admin.signOut(targetUserId, 'all')` to invalidate
 *    all active refresh tokens and browser sessions across all devices.
 * 6. Database Status Transition: Updates `public.profiles` setting `status = 'suspended'`.
 * 7. Audit Trail Logging: Records an immutable audit log entry in `public.team_audit_logs`.
 * 8. Cache Revalidation: Triggers path revalidation on `/admin/team` and `/admin`.
 *
 * @param {string} targetUserId UUID of the user to offboard/suspend.
 * @param {string} [reason] Optional administrative justification for offboarding.
 * @returns {Promise<TeamActionResult<Profile>>} Result envelope with updated profile or error message.
 */
export async function suspendTeamUser(
  targetUserId: string,
  reason?: string
): Promise<TeamActionResult<Profile>> {
  // 1. Validate input payload against Zod schema
  const parsed = suspendTeamUserSchema.safeParse({ targetUserId, reason });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error: firstIssue ? firstIssue.message : 'Invalid suspension request payload.',
    };
  }

  const { targetUserId: sanitizedUserId, reason: sanitizedReason } = parsed.data;

  // 2. Enforce active administrator authorization boundary
  let caller: { callerId: string; callerEmail: string };
  try {
    caller = await assertActiveAdmin();
  } catch (authErr: unknown) {
    const message = authErr instanceof Error ? authErr.message : 'Authorization check failed.';
    return { success: false, error: message };
  }

  // 3. Prevent Admin Self-Suspension (PRD Section 15.9 Package 4.1.1 / Edge Case Guard)
  if (sanitizedUserId === caller.callerId) {
    return {
      success: false,
      error: 'Security Policy Violation: Administrators cannot suspend their own account.',
    };
  }

  const adminClient = getAdminClient();

  // Retrieve current target profile
  const { data: targetProfile, error: fetchError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', sanitizedUserId)
    .maybeSingle();

  if (fetchError || !targetProfile) {
    return { success: false, error: 'Target team member profile not found in agency directory.' };
  }

  if (targetProfile.status === 'suspended') {
    return {
      success: false,
      error: 'Target team member account is already suspended.',
    };
  }

  // 4. Sole active administrator invariant pre-check
  if (targetProfile.role === 'admin' && targetProfile.status === 'active') {
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
    // 5. Instant Session Revocation via Supabase Admin SDK (Package 4.1.2)
    // Revokes all active refresh tokens and terminates real-time channels across all client devices.
    const { error: signOutError } = await adminClient.auth.admin.signOut(sanitizedUserId, 'global');
    if (signOutError) {
      console.warn(
        `[AUTH_REVOCATION_WARNING] Failed to cleanly sign out user ${sanitizedUserId}:`,
        signOutError.message
      );
    }

    // Harden session invalidation by banning the user in Supabase Auth and updating app_metadata
    const { data: authUserData } = await adminClient.auth.admin.getUserById(sanitizedUserId);
    await adminClient.auth.admin.updateUserById(sanitizedUserId, {
      ban_duration: '876000h',
      app_metadata: {
        ...(authUserData?.user?.app_metadata || {}),
        status: 'suspended',
      },
    });

    // 6. Database Status Transition to 'suspended' (Package 4.1.3)
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sanitizedUserId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      if (updateError?.code === '23514') {
        return {
          success: false,
          error: 'Agency Invariant Violation: Operation rejected. Cannot suspend the sole active administrator in the agency.',
        };
      }
      throw updateError || new Error('Failed to update account status to suspended.');
    }

    // 7. Offboarding Audit Trail Logging (Package 4.1.4)
    const { error: auditError } = await adminClient.from('team_audit_logs').insert({
      actor_id: caller.callerId,
      action: 'user_suspended',
      target_user_email: targetProfile.email,
      details: {
        target_user_id: sanitizedUserId,
        target_user_name: targetProfile.full_name,
        role: targetProfile.role,
        previous_status: targetProfile.status,
        new_status: 'suspended',
        session_revoked: true,
        reason: sanitizedReason || 'Administrative offboarding',
        actor_email: caller.callerEmail,
        timestamp: new Date().toISOString(),
      },
    });

    if (auditError) {
      console.warn('[AUDIT_WARNING] Offboarding audit log entry failed to record:', auditError.message);
    }

    try {
      revalidatePath('/admin/team');
      revalidatePath('/admin');
    } catch {
      // Safe no-op outside Next.js request context
    }

    return {
      success: true,
      data: updatedProfile as Profile,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to execute account offboarding.';
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

  // Self-suspension prevention guard
  if (newStatus === 'suspended' && targetUserId === caller.callerId) {
    return {
      success: false,
      error: 'Security Policy Violation: Administrators cannot suspend their own account.',
    };
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
    // If suspending, revoke all active sessions across all devices
    if (newStatus === 'suspended') {
      const { error: signOutError } = await adminClient.auth.admin.signOut(targetUserId, 'global');
      if (signOutError) {
        console.warn(
          `[AUTH_REVOCATION_WARNING] Failed to cleanly sign out user ${targetUserId}:`,
          signOutError.message
        );
      }
      const { data: authUserData } = await adminClient.auth.admin.getUserById(targetUserId);
      await adminClient.auth.admin.updateUserById(targetUserId, {
        ban_duration: '876000h',
        app_metadata: {
          ...(authUserData?.user?.app_metadata || {}),
          status: 'suspended',
        },
      });
    } else if (newStatus === 'active') {
      // Unban account in Supabase Auth upon reactivation
      const { data: authUserData } = await adminClient.auth.admin.getUserById(targetUserId);
      await adminClient.auth.admin.updateUserById(targetUserId, {
        ban_duration: 'none',
        app_metadata: {
          ...(authUserData?.user?.app_metadata || {}),
          status: 'active',
        },
      });
    }

    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
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
        session_revoked: newStatus === 'suspended',
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
    .select('role, status, allowed_tabs')
    .eq('id', user.id)
    .maybeSingle();

  if (callerProfileError || !callerProfile) {
    return { success: false, error: 'Caller profile could not be verified.' };
  }

  if (callerProfile.status !== 'active') {
    return { success: false, error: 'Access Denied: Suspended accounts cannot view team directory.' };
  }

  // Canonical Permission Invariant:
  // Evaluates centralized hasPersonnelDirectoryAccess predicate:
  // 1. Administrators ALWAYS have roster inspection privileges.
  // 2. Custom allowed_tabs checked if populated.
  // 3. Fall back strictly to sales_manager baseline (viewers and sales reps denied).
  const hasUsersAccess = hasPersonnelDirectoryAccess(
    callerProfile.role as CrmUserRole,
    callerProfile.allowed_tabs
  );

  if (!hasUsersAccess) {
    return { success: false, error: 'Access Denied: You do not have roster inspection privileges.' };
  }

  // Fetch all profiles ordered by creation timestamp using caller's authenticated session under RLS
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError || !profiles) {
    return { success: false, error: `Failed to load team roster: ${profilesError?.message || 'Unknown error'}` };
  }

  // Fetch active funnel statuses (non-terminal) to align active counts with Reassignment Wizard
  const { data: terminalStatuses } = await supabase
    .from('funnel_statuses')
    .select('id')
    .in('bucket', ['converted', 'lost']);

  const terminalIds = new Set((terminalStatuses || []).map((s) => s.id));

  // Fetch leads with status_id to compute active non-terminal deal metrics per representative
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('assigned_to, expected_value, status_id')
    .or('brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true');

  if (leadsError) {
    return { success: false, error: `Failed to aggregate deal counts: ${leadsError.message}` };
  }

  // Aggregate deal counts and pipeline value per user for active deals only
  const metricsMap = new Map<string, { count: number; totalValue: number }>();
  (leads || []).forEach((lead) => {
    if (lead.assigned_to && !terminalIds.has(lead.status_id)) {
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

/**
 * Updates a team member's granular tab access permissions and feature capabilities.
 *
 * Invariants & Security Boundaries:
 * 1. Administrator Guard: Caller must be an active administrator (assertActiveAdmin).
 * 2. Admin Self-Lockout Prevention: If caller is modifying their own account, they CANNOT revoke
 *    their own access to the 'users' or 'settings' workspace tabs.
 * 3. Identity Sync: Persists allowed_tabs and feature_permissions atomically in `public.profiles`
 *    and synchronizes to Supabase Auth `user_metadata` and `app_metadata`.
 * 4. Audit Log Immutability: Records an entry in `public.team_audit_logs` capturing previous and new tab sets.
 * 5. Cache Revalidation: Revalidates `/admin/team` and `/admin`.
 *
 * @param {UpdateUserPermissionsFormData} input Target user ID and new allowed tabs array.
 * @returns {Promise<TeamActionResult<Profile>>} Result envelope with updated profile record.
 */
export async function updateUserPermissions(
  input: UpdateUserPermissionsFormData
): Promise<TeamActionResult<Profile>> {
  // 1. Validate payload against Zod schema
  const parsed = updateUserPermissionsSchema.safeParse(input);
  if (!parsed.success) {
    const validationErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] ? String(issue.path[0]) : 'form';
      validationErrors[field] = issue.message;
    });

    return {
      success: false,
      error: 'Validation failed. Please provide a valid UUID and tab permissions array.',
      validationErrors,
    };
  }

  const { targetUserId, allowedTabs, featurePermissions } = parsed.data;

  // 2. Caller authorization guard: only active admins can alter permissions
  let caller: { callerId: string; callerEmail: string };
  try {
    caller = await assertActiveAdmin();
  } catch (authErr: unknown) {
    const message = authErr instanceof Error ? authErr.message : 'Authorization check failed.';
    return { success: false, error: message };
  }

  const adminClient = getAdminClient();

  // 3. Fetch existing profile to inspect current state
  const { data: targetProfile, error: fetchError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .maybeSingle();

  if (fetchError || !targetProfile) {
    return {
      success: false,
      error: 'Target team member profile does not exist in the agency directory.',
    };
  }

  // 4. Admin Self-Lockout Prevention Guard:
  // An administrator cannot revoke their own access to the 'users' or 'settings' tabs
  if (targetUserId === caller.callerId) {
    if (!allowedTabs.includes('users') || !allowedTabs.includes('settings')) {
      return {
        success: false,
        error: 'Self-Lockout Violation: Administrators cannot revoke their own access to the Users or Settings workspace tabs.',
      };
    }
  }

  // 5. Update domain profile in public.profiles
  try {
    const updatePayload: Record<string, unknown> = {
      allowed_tabs: allowedTabs,
      updated_at: new Date().toISOString(),
    };
    if (featurePermissions) {
      updatePayload.feature_permissions = featurePermissions;
    }

    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update(updatePayload)
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      return {
        success: false,
        error: `Database update failed: ${updateError?.message || 'Unknown error'}`,
      };
    }

    // 6. Synchronize with Supabase Auth app_metadata and user_metadata
    try {
      await adminClient.auth.admin.updateUserById(targetUserId, {
        app_metadata: { allowed_tabs: allowedTabs },
        user_metadata: { allowed_tabs: allowedTabs },
      });
    } catch (authSyncErr: unknown) {
      console.warn(
        `[AUTH_SYNC_WARNING] Failed to sync allowed_tabs to Supabase Auth metadata for user ${targetUserId}:`,
        authSyncErr
      );
    }

    // 7. Record immutable entry in public.team_audit_logs
    const { error: auditError } = await adminClient
      .from('team_audit_logs')
      .insert({
        actor_id: caller.callerId,
        action: 'permissions_updated',
        target_user_email: targetProfile.email,
        details: {
          target_user_id: targetUserId,
          target_user_name: targetProfile.full_name,
          previous_allowed_tabs: targetProfile.allowed_tabs || [],
          new_allowed_tabs: allowedTabs,
          feature_permissions: featurePermissions || targetProfile.feature_permissions || {},
          updated_at: new Date().toISOString(),
        },
      });

    if (auditError) {
      console.warn('[AUDIT_WARNING] Failed to record permissions_updated audit entry:', auditError.message);
    }

    try {
      revalidatePath('/admin/team');
      revalidatePath('/admin');
    } catch {
      // Safe no-op outside Next.js request context
    }

    return {
      success: true,
      data: updatedProfile as Profile,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update user permissions.';
    return { success: false, error: message };
  }
}



/**
 * Generates a high-entropy temporary password compliant with enterprise complexity rules.
 * Enforces >=16 characters with guaranteed presence of uppercase, lowercase, numbers, and symbols.
 */
function generateSecureTemporaryPassword(): string {
  const charsUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const charsLower = 'abcdefghijkmnopqrstuvwxyz';
  const charsNumbers = '23456789';
  const charsSymbols = '!@#$%^&*()-_=+';
  const allChars = charsUpper + charsLower + charsNumbers + charsSymbols;

  const getRandom = (set: string) => set[Math.floor(Math.random() * set.length)];
  const result: string[] = [
    getRandom(charsUpper),
    getRandom(charsLower),
    getRandom(charsNumbers),
    getRandom(charsSymbols),
  ];

  for (let i = result.length; i < 16; i++) {
    result.push(getRandom(allChars));
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

/**
 * Retrieves the complete hydrated personnel profile dossier including commercial KPIs
 * and tamper-proof administrative compliance audit logs (/admin/team/[id]).
 *
 * Authorization Invariant:
 * - Active administrators and users with 'users' tab permission may inspect any profile.
 * - Active team members may inspect their own profile.
 * - Suspended or unauthenticated sessions are strictly rejected.
 *
 * @param {string} userId UUID of the target team member.
 * @returns {Promise<TeamActionResult<PersonnelProfilePayload>>} Complete hydrated personnel dossier.
 */
export async function getPersonnelProfile(
  userId: string
): Promise<TeamActionResult<PersonnelProfilePayload>> {
  try {
    if (!userId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId)) {
      return { success: false, error: 'Invalid user ID format: UUID expected.' };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Session authentication required.' };
    }

    const { data: callerProfile, error: callerProfileError } = await supabase
      .from('profiles')
      .select('id, role, status, allowed_tabs')
      .eq('id', user.id)
      .maybeSingle();

    if (callerProfileError || !callerProfile) {
      return { success: false, error: 'Caller profile could not be verified in the agency directory.' };
    }

    if (callerProfile.status !== 'active') {
      return { success: false, error: 'Access Denied: Suspended accounts cannot view personnel dossiers.' };
    }

    const isSelf = callerProfile.id === userId;
    const hasDirectoryPrivilege = hasPersonnelDirectoryAccess(
      callerProfile.role as CrmUserRole,
      callerProfile.allowed_tabs
    );

    if (!isSelf && !hasDirectoryPrivilege) {
      return { success: false, error: 'Access Denied: You do not have permission to inspect this personnel dossier.' };
    }

    // 1. Fetch domain profile using authenticated session under Supabase RLS
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (targetError || !targetProfile) {
      return { success: false, error: 'Personnel record not found in agency directory.' };
    }

    // 2. Fetch inviter full name if invited_by exists
    let invitedByName: string | null = null;
    if (targetProfile.invited_by) {
      const { data: inviter } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', targetProfile.invited_by)
        .maybeSingle();
      invitedByName = inviter?.full_name || null;
    }

    // 3. Fetch funnel status definitions to segment deals
    const { data: statuses } = await supabase
      .from('funnel_statuses')
      .select('id, bucket');

    const statusBucketMap = new Map<string, string>();
    (statuses || []).forEach((s) => statusBucketMap.set(s.id, s.bucket));

    // 4. Fetch deals assigned to this user, excluding synthetic benchmark records
    const { data: userLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, expected_value, status_id')
      .eq('assigned_to', userId)
      .or('brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true');

    if (leadsError) {
      return { success: false, error: `Failed to aggregate commercial velocity KPIs: ${leadsError.message}` };
    }

    let wonRevenue = 0;
    let activePipelineValue = 0;
    let wonDealsCount = 0;
    let lostDealsCount = 0;
    let activeDealsCount = 0;
    const totalDealsAssigned = userLeads ? userLeads.length : 0;

    (userLeads || []).forEach((lead) => {
      const bucket = statusBucketMap.get(lead.status_id) || 'open';
      const val = Number(lead.expected_value || 0);

      if (bucket === 'converted') {
        wonRevenue += val;
        wonDealsCount += 1;
      } else if (bucket === 'lost') {
        lostDealsCount += 1;
      } else {
        activeDealsCount += 1;
        activePipelineValue += val;
      }
    });

    const closedDealsCount = wonDealsCount + lostDealsCount;
    const winRatePercentage = closedDealsCount > 0 ? Math.round((wonDealsCount / closedDealsCount) * 100) : 0;
    const capacityUtilizationPercentage = Math.min(100, Math.round((activeDealsCount / SALES_REP_CAPACITY_LIMIT) * 100));
    const isAtCapacity = activeDealsCount >= SALES_REP_CAPACITY_LIMIT;

    const kpis: PersonnelPerformanceKpis = {
      wonRevenue,
      activePipelineValue,
      winRatePercentage,
      closedDealsCount,
      wonDealsCount,
      activeDealsCount,
      capacityLimit: SALES_REP_CAPACITY_LIMIT,
      capacityUtilizationPercentage,
      isAtCapacity,
      totalDealsAssigned,
    };

    // 5. Fetch audit logs if caller is administrator with localized fault tolerance
    let auditLogs: PersonnelAuditLogEntry[] = [];
    if (callerProfile.role === 'admin') {
      try {
        const { data: rawLogs } = await supabase
          .from('team_audit_logs')
          .select('id, actor_id, action, target_user_email, details, created_at')
          .or(`target_user_email.eq.${targetProfile.email},details->>target_user_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (rawLogs && rawLogs.length > 0) {
          const actorIds = Array.from(new Set(rawLogs.map((l) => l.actor_id).filter(Boolean))) as string[];
          const actorMap = new Map<string, { name: string; email: string }>();

          if (actorIds.length > 0) {
            const { data: actors } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', actorIds);

            (actors || []).forEach((a) => actorMap.set(a.id, { name: a.full_name, email: a.email }));
          }

          auditLogs = rawLogs.map((l) => ({
            id: l.id,
            actor_id: l.actor_id,
            actor_name: l.actor_id ? actorMap.get(l.actor_id)?.name || 'System Operator' : 'System Automation',
            actor_email: l.actor_id ? actorMap.get(l.actor_id)?.email || null : null,
            action: l.action,
            target_user_email: l.target_user_email,
            details: (l.details || {}) as Record<string, unknown>,
            created_at: l.created_at,
          }));
        }
      } catch (auditErr) {
        console.warn('[AUDIT_WARNING] Failed to load personnel audit logs:', auditErr);
        auditLogs = [];
      }
    }

    return {
      success: true,
      data: {
        profile: targetProfile as Profile,
        invited_by_name: invitedByName,
        kpis,
        auditLogs,
        canEdit: callerProfile.role === 'admin',
        isSelf,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve personnel profile.';
    console.error('[PERSONNEL_PROFILE_ERROR]', message);
    return { success: false, error: message };
  }
}

/**
 * Retrieves paginated deals assigned to a representative with optional status bucket
 * and search filtering (/admin/team/[id]).
 *
 * @param {string} userId UUID of the representative.
 * @param {PersonnelDealsFilterInput} filters Filtering, search, and pagination arguments.
 * @returns {Promise<TeamActionResult<PersonnelDealsPayload>>} Paginated deal ledger records.
 */
export async function getPersonnelDeals(
  userId: string,
  filters?: PersonnelDealsFilterInput
): Promise<TeamActionResult<PersonnelDealsPayload>> {
  try {
    if (!userId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId)) {
      return { success: false, error: 'Invalid user ID format: UUID expected.' };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Session authentication required.' };
    }

    const { data: callerProfile, error: callerProfileError } = await supabase
      .from('profiles')
      .select('id, role, status, allowed_tabs')
      .eq('id', user.id)
      .maybeSingle();

    if (callerProfileError || !callerProfile) {
      return { success: false, error: 'Caller profile could not be verified.' };
    }

    if (callerProfile.status !== 'active') {
      return { success: false, error: 'Access Denied: Suspended accounts cannot inspect deals.' };
    }

    const isSelf = callerProfile.id === userId;
    const hasDirectoryPrivilege = hasPersonnelDirectoryAccess(
      callerProfile.role as CrmUserRole,
      callerProfile.allowed_tabs
    );

    if (!isSelf && !hasDirectoryPrivilege) {
      return { success: false, error: 'Access Denied: You do not have permission to view deals for this representative.' };
    }

    const parsedFilters = personnelDealsFilterSchema.safeParse(filters || {});
    const validated = parsedFilters.success ? parsedFilters.data : personnelDealsFilterSchema.parse({});

    // 1. Resolve status bucket IDs if a specific bucket filter is requested
    let statusFilterIds: string[] | null = null;
    if (validated.statusBucket !== 'all') {
      const { data: bucketStatuses } = await supabase
        .from('funnel_statuses')
        .select('id')
        .eq('bucket', validated.statusBucket);

      statusFilterIds = (bucketStatuses || []).map((s) => s.id);
    }

    // 2. Resolve time filter threshold
    let timeThreshold: string | null = null;
    if (validated.timeRange !== 'all') {
      const thresholdDate = new Date();
      if (validated.timeRange === '30d') thresholdDate.setDate(thresholdDate.getDate() - 30);
      else if (validated.timeRange === '90d') thresholdDate.setDate(thresholdDate.getDate() - 90);
      else if (validated.timeRange === 'ytd') {
        thresholdDate.setMonth(0, 1);
        thresholdDate.setHours(0, 0, 0, 0);
      } else if (validated.timeRange === '12m') thresholdDate.setFullYear(thresholdDate.getFullYear() - 1);
      timeThreshold = thresholdDate.toISOString();
    }

    // 3. Construct query with foreign key joins and synthetic benchmark exclusion under Supabase RLS
    let query = supabase
      .from('leads')
      .select(`
        *,
        lead_source:lead_sources(id, name, color_code, is_active, created_at),
        status:funnel_statuses(id, name, bucket, color_code, sort_order, is_active, created_at)
      `, { count: 'exact' })
      .eq('assigned_to', userId)
      .or('brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true');

    if (statusFilterIds !== null) {
      if (statusFilterIds.length === 0) {
        return {
          success: true,
          data: {
            deals: [],
            totalCount: 0,
            page: validated.page,
            pageSize: validated.pageSize,
            totalPages: 0,
          },
        };
      }
      query = query.in('status_id', statusFilterIds);
    }

    if (timeThreshold) {
      query = query.gte('created_at', timeThreshold);
    }

    if (validated.search) {
      const cleanSearch = validated.search.replace(/[%_]/g, '');
      query = query.or(`name.ilike.%${cleanSearch}%,company.ilike.%${cleanSearch}%,lead_id.ilike.%${cleanSearch}%`);
    }

    const offset = (validated.page - 1) * validated.pageSize;
    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + validated.pageSize - 1);

    const { data: deals, count, error: dealsQueryError } = await query;

    if (dealsQueryError) {
      return { success: false, error: `Failed to load representative deals: ${dealsQueryError.message}` };
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / validated.pageSize) || 1;

    return {
      success: true,
      data: {
        deals: (deals || []) as LeadWithRelations[],
        totalCount,
        page: validated.page,
        pageSize: validated.pageSize,
        totalPages,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load representative deals.';
    console.error('[PERSONNEL_DEALS_ERROR]', message);
    return { success: false, error: message };
  }
}

/**
 * Administrative password reset for an individual team member account.
 * Assigns either a custom temporary password or auto-generates a high-entropy credential,
 * sets must_change_password = true, and records an immutable compliance audit record.
 *
 * @param {string} userId UUID of target team member.
 * @param {string} [tempPassword] Optional administrative custom temporary password.
 * @param {boolean} [mustChangePassword=true] Whether to enforce first-login password rotation.
 * @returns {Promise<TeamActionResult<{ tempPassword: string }>>} Result with temporary password.
 */
export async function adminResetPersonnelPassword(
  userId: string,
  tempPassword?: string,
  mustChangePassword = true
): Promise<TeamActionResult<{ tempPassword: string }>> {
  let caller: { callerId: string; callerEmail: string };
  try {
    caller = await assertActiveAdmin();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized administrative request.';
    return { success: false, error: message };
  }

  const parsed = adminResetPasswordSchema.safeParse({
    targetUserId: userId,
    tempPassword: tempPassword && tempPassword.trim().length > 0 ? tempPassword.trim() : undefined,
    mustChangePassword,
  });

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Invalid password reset input parameters.';
    return { success: false, error: errorMsg };
  }

  const adminClient = getAdminClient();

  const { data: targetProfile, error: targetError } = await adminClient
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .maybeSingle();

  if (targetError || !targetProfile) {
    return { success: false, error: 'Target user record not found in agency directory.' };
  }

  const effectivePassword = parsed.data.tempPassword || generateSecureTemporaryPassword();

  try {
    // 1. Update Supabase Auth password
    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
      password: effectivePassword,
    });

    if (authError) {
      throw new Error(`Failed to update Auth password: ${authError.message}`);
    }

    // 2. Persist must_change_password flag in public.profiles
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        must_change_password: parsed.data.mustChangePassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Failed to update profile rotation flag: ${profileError.message}`);
    }

    // 3. Record immutable compliance entry in public.team_audit_logs
    const { error: auditError } = await adminClient
      .from('team_audit_logs')
      .insert({
        actor_id: caller.callerId,
        action: 'password_reset_dispatched',
        target_user_email: targetProfile.email,
        details: {
          target_user_id: userId,
          target_user_name: targetProfile.full_name,
          must_change_password: parsed.data.mustChangePassword,
          initiated_by_admin: true,
          actor_email: caller.callerEmail,
          timestamp: new Date().toISOString(),
        },
      });

    if (auditError) {
      console.warn('[AUDIT_WARNING] Failed to record password_reset_dispatched audit entry:', auditError.message);
    }

    try {
      revalidatePath('/admin/team');
      revalidatePath(`/admin/team/${userId}`);
    } catch {
      // Safe no-op outside Next.js request context
    }

    return {
      success: true,
      data: { tempPassword: effectivePassword },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Administrative password reset failed.';
    return { success: false, error: message };
  }
}

/**
 * Revokes all active browser and refresh sessions for a user across all devices.
 * Prevents administrator self-lockout and records an immutable audit entry.
 *
 * @param {string} userId UUID of target team member.
 * @returns {Promise<TeamActionResult<{ message: string }>>} Confirmation envelope.
 */
export async function adminRevokePersonnelSessions(
  userId: string
): Promise<TeamActionResult<{ message: string }>> {
  let caller: { callerId: string; callerEmail: string };
  try {
    caller = await assertActiveAdmin();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized administrative request.';
    return { success: false, error: message };
  }

  const parsed = adminRevokeSessionsSchema.safeParse({ targetUserId: userId });
  if (!parsed.success) {
    return { success: false, error: 'Target user ID must be a valid UUID.' };
  }

  if (caller.callerId === userId) {
    return {
      success: false,
      error: 'Self-lockout prevented: You cannot revoke your own active administrative session via this action.',
    };
  }

  const adminClient = getAdminClient();

  const { data: targetProfile, error: targetError } = await adminClient
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', userId)
    .maybeSingle();

  if (targetError || !targetProfile) {
    return { success: false, error: 'Target user record not found in agency directory.' };
  }

  try {
    // 1. Terminate all active sessions via global signOut
    const { error: signOutError } = await adminClient.auth.admin.signOut(userId, 'global');
    if (signOutError) {
      throw new Error(`Failed to revoke sessions via Auth service: ${signOutError.message}`);
    }

    // 2. Record compliance event in team_audit_logs
    const { error: auditError } = await adminClient
      .from('team_audit_logs')
      .insert({
        actor_id: caller.callerId,
        action: 'permissions_updated',
        target_user_email: targetProfile.email,
        details: {
          event: 'sessions_revoked',
          target_user_id: userId,
          target_user_name: targetProfile.full_name,
          revoked_by_email: caller.callerEmail,
          timestamp: new Date().toISOString(),
        },
      });

    if (auditError) {
      console.warn('[AUDIT_WARNING] Failed to record session revocation audit entry:', auditError.message);
    }

    try {
      revalidatePath('/admin/team');
      revalidatePath(`/admin/team/${userId}`);
    } catch {
      // Safe no-op outside Next.js request context
    }

    return {
      success: true,
      data: { message: `All active sessions for ${targetProfile.full_name} have been terminated across all devices.` },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to terminate user sessions.';
    return { success: false, error: message };
  }
}

/**
 * Updates personnel coordinates (full_name, job_title, phone, avatar_url) for a team member.
 * Authorized for agency administrators or the authenticated account holder themselves.
 *
 * @param {string} userId UUID of the team member.
 * @param {Partial<UpdatePersonnelCoordinatesFormData>} input Profile coordinates payload.
 * @returns {Promise<TeamActionResult<Profile>>} Updated profile domain object.
 */
export async function updatePersonnelCoordinates(
  userId: string,
  input: Partial<UpdatePersonnelCoordinatesFormData>
): Promise<TeamActionResult<Profile>> {
  if (!userId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId)) {
    return { success: false, error: 'Invalid user ID format: UUID expected.' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized: Session authentication required.' };
  }

  const { data: callerProfile, error: callerProfileError } = await supabase
    .from('profiles')
    .select('id, email, role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (callerProfileError || !callerProfile) {
    return { success: false, error: 'Caller profile could not be verified.' };
  }

  if (callerProfile.status !== 'active') {
    return { success: false, error: 'Access Denied: Suspended accounts cannot modify personnel coordinates.' };
  }

  const isSelf = callerProfile.id === userId;
  const isAdmin = callerProfile.role === 'admin';

  if (!isSelf && !isAdmin) {
    return { success: false, error: 'Privilege Escalation Blocked: Only administrators or the account holder can update these coordinates.' };
  }

  const parsed = updatePersonnelCoordinatesSchema.safeParse({
    targetUserId: userId,
    ...input,
  });

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Invalid personnel coordinate values.';
    return { success: false, error: errorMsg };
  }

  const updateFields: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.fullName !== undefined) updateFields.full_name = parsed.data.fullName;
  if (parsed.data.jobTitle !== undefined) updateFields.job_title = parsed.data.jobTitle;
  if (parsed.data.phone !== undefined) updateFields.phone = parsed.data.phone;
  if (parsed.data.avatarUrl !== undefined) updateFields.avatar_url = parsed.data.avatarUrl;

  try {
    // Persist coordinate mutations under Supabase RLS policies (admin or self)
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', userId)
      .select('*')
      .single();

    if (updateError || !updatedProfile) {
      throw new Error(updateError?.message || 'Failed to persist coordinate changes.');
    }

    // Keep Auth user_metadata in sync if fullName or avatarUrl was updated (optional privileged sync)
    if (parsed.data.fullName !== undefined || parsed.data.avatarUrl !== undefined) {
      try {
        const adminClient = getAdminClient();
        const metadataUpdates: Record<string, unknown> = {};
        if (parsed.data.fullName !== undefined) metadataUpdates.full_name = parsed.data.fullName;
        if (parsed.data.avatarUrl !== undefined) metadataUpdates.avatar_url = parsed.data.avatarUrl;

        await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: metadataUpdates,
        });
      } catch (authSyncErr) {
        console.warn('[AUTH_SYNC_NOTICE] Auth metadata sync bypassed:', authSyncErr instanceof Error ? authSyncErr.message : authSyncErr);
      }
    }

    try {
      revalidatePath('/admin/team');
      revalidatePath(`/admin/team/${userId}`);
    } catch {
      // Safe no-op outside Next.js request context
    }

    return {
      success: true,
      data: updatedProfile as Profile,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update personnel coordinates.';
    return { success: false, error: message };
  }
}
