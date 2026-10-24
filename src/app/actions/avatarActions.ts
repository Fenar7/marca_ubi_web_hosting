'use server';

/**
 * @file avatarActions.ts
 * @description Enterprise Server Actions governing user profile photo mutation and deletion.
 * @architecture
 *   - Enforces strict dual-path authorization: callers may upload/remove their own avatar (self-service),
 *     or administrators (role='admin') may upload/remove avatars for any member in the directory.
 *   - Direct binary streaming into the Supabase Storage 'avatars' bucket under scoped paths:
 *     `avatars/{targetUserId}/avatar_{timestamp}.webp`.
 *   - Auto-purges previous avatar assets to eliminate orphaned storage accumulation.
 *   - Atomically updates `public.profiles.avatar_url` and writes compliance records to `public.team_audit_logs`.
 *   - Revalidates `/admin/team` and the root layout shell for instantaneous UI hydration.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import { getAdminClient } from '@/app/lib/supabase/admin';
import {
  targetUserIdSchema,
  MAX_AVATAR_RAW_BYTES,
  ALLOWED_AVATAR_MIME_TYPES,
} from '@/app/lib/avatar-schemas';
import type { CrmUserRole } from '@/types/crm';

export interface AvatarActionResult {
  success: boolean;
  avatarUrl?: string;
  error?: string;
}

/**
 * Verifies session authentication and enforces role permissions for the target user ID.
 */
async function authenticateCallerAndAuthorize(
  targetUserId: string
): Promise<{
  callerId: string;
  callerEmail: string;
  callerRole: CrmUserRole;
  isAdmin: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: An active authenticated session is required.');
  }

  // Retrieve caller profile to inspect role and active status
  const { data: callerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, status')
    .eq('id', user.id)
    .single();

  if (profileError || !callerProfile) {
    throw new Error('Caller profile could not be verified in the security directory.');
  }

  if (callerProfile.status !== 'active') {
    throw new Error('Access denied: Account is suspended or pending verification.');
  }

  const isAdmin = callerProfile.role === 'admin';
  const isSelf = user.id === targetUserId;

  // Dual-access boundary: must be either self or administrative user
  if (!isSelf && !isAdmin) {
    throw new Error('Forbidden: You do not possess permission to modify this user photo.');
  }

  return {
    callerId: user.id,
    callerEmail: user.email || '',
    callerRole: callerProfile.role as CrmUserRole,
    isAdmin,
  };
}

/**
 * Extracts storage relative object key from a full public Supabase CDN URL.
 */
function extractStoragePathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const marker = '/storage/v1/object/public/avatars/';
    const index = parsed.pathname.indexOf(marker);
    if (index !== -1) {
      return decodeURIComponent(parsed.pathname.slice(index + marker.length));
    }
  } catch {
    // Malformed URL or external image provider
  }
  return null;
}

/**
 * Server Action: Uploads and sets an avatar for a target team member.
 *
 * @param targetUserId UUID of the user receiving the avatar.
 * @param formData FormData instance containing the processed 'avatar' File or Blob.
 */
export async function updateUserAvatarAction(
  targetUserId: string,
  formData: FormData
): Promise<AvatarActionResult> {
  try {
    // 1. Validate Target UUID format
    const validatedUserId = targetUserIdSchema.parse(targetUserId);

    // 2. Authorize Caller (Self or Admin)
    const caller = await authenticateCallerAndAuthorize(validatedUserId);

    // 3. Extract and validate binary file payload
    const file = formData.get('avatar');
    if (!file || !(file instanceof File)) {
      return { success: false, error: 'No image file payload provided.' };
    }

    if (file.size > MAX_AVATAR_RAW_BYTES) {
      return {
        success: false,
        error: `Image exceeds maximum permitted boundary (${MAX_AVATAR_RAW_BYTES / (1024 * 1024)}MB).`,
      };
    }

    const mimeType = file.type;
    if (!ALLOWED_AVATAR_MIME_TYPES.includes(mimeType as (typeof ALLOWED_AVATAR_MIME_TYPES)[number])) {
      return {
        success: false,
        error: 'Unsupported image MIME type. Please supply JPEG, PNG, or WebP.',
      };
    }

    const adminClient = getAdminClient();

    // 4. Fetch target user's existing profile to identify any current avatar asset
    const { data: targetProfile, error: targetError } = await adminClient
      .from('profiles')
      .select('id, email, avatar_url')
      .eq('id', validatedUserId)
      .single();

    if (targetError || !targetProfile) {
      return { success: false, error: 'Target user could not be located in directory.' };
    }

    // 5. Stream binary buffer to Supabase Storage bucket 'avatars'
    const extension = mimeType === 'image/webp' ? 'webp' : mimeType === 'image/png' ? 'png' : 'jpg';
    const storageFilePath = `${validatedUserId}/avatar_${Date.now()}.${extension}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await adminClient.storage
      .from('avatars')
      .upload(storageFilePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      return {
        success: false,
        error: `Cloud storage upload failed: ${uploadError.message}`,
      };
    }

    // 6. Resolve public CDN URL
    const {
      data: { publicUrl },
    } = adminClient.storage.from('avatars').getPublicUrl(storageFilePath);

    // 7. Atomically persist updated avatar_url on target profile
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedUserId);

    if (updateError) {
      // Revert newly uploaded storage object to prevent orphan leak on database failure
      await adminClient.storage.from('avatars').remove([storageFilePath]);
      return {
        success: false,
        error: `Database persistence failure: ${updateError.message}`,
      };
    }

    // 8. Purge old storage asset if replacing an existing avatar
    if (targetProfile.avatar_url) {
      const oldStoragePath = extractStoragePathFromUrl(targetProfile.avatar_url);
      if (oldStoragePath && oldStoragePath !== storageFilePath) {
        await adminClient.storage.from('avatars').remove([oldStoragePath]);
      }
    }

    // 9. Write compliance audit log
    await adminClient.from('team_audit_logs').insert({
      actor_id: caller.callerId,
      action: 'avatar_updated',
      target_user_email: targetProfile.email,
      details: {
        target_user_id: validatedUserId,
        caller_role: caller.callerRole,
        file_size_bytes: file.size,
        mime_type: mimeType,
      },
    });

    // 10. Invalidate server cache tags across team workspace and layout header
    revalidatePath('/admin/team');
    revalidatePath('/admin', 'layout');

    return {
      success: true,
      avatarUrl: publicUrl,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal avatar update failure.';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Deletes and removes an avatar for a target team member.
 *
 * @param targetUserId UUID of the user whose avatar should be deleted.
 */
export async function removeUserAvatarAction(
  targetUserId: string
): Promise<AvatarActionResult> {
  try {
    // 1. Validate Target UUID format
    const validatedUserId = targetUserIdSchema.parse(targetUserId);

    // 2. Authorize Caller (Self or Admin)
    const caller = await authenticateCallerAndAuthorize(validatedUserId);

    const adminClient = getAdminClient();

    // 3. Locate target user and current avatar URL
    const { data: targetProfile, error: targetError } = await adminClient
      .from('profiles')
      .select('id, email, avatar_url')
      .eq('id', validatedUserId)
      .single();

    if (targetError || !targetProfile) {
      return { success: false, error: 'Target user could not be located in directory.' };
    }

    // If user has no avatar registered, return early as successful no-op
    if (!targetProfile.avatar_url) {
      return { success: true };
    }

    // 4. Purge storage asset from 'avatars' bucket
    const oldStoragePath = extractStoragePathFromUrl(targetProfile.avatar_url);
    if (oldStoragePath) {
      await adminClient.storage.from('avatars').remove([oldStoragePath]);
    }

    // 5. Clear avatar_url in database
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedUserId);

    if (updateError) {
      return {
        success: false,
        error: `Database persistence failure: ${updateError.message}`,
      };
    }

    // 6. Write compliance audit log
    await adminClient.from('team_audit_logs').insert({
      actor_id: caller.callerId,
      action: 'avatar_removed',
      target_user_email: targetProfile.email,
      details: {
        target_user_id: validatedUserId,
        caller_role: caller.callerRole,
      },
    });

    // 7. Invalidate server cache tags
    revalidatePath('/admin/team');
    revalidatePath('/admin', 'layout');

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal avatar removal failure.';
    return { success: false, error: message };
  }
}
