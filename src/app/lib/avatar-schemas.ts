/**
 * @file avatar-schemas.ts
 * @description Zod validation schemas and invariants for team member avatar uploads and profile photo governance.
 *              Separated from 'use server' modules to comply with Next.js Server Action boundary invariants.
 * @module lib/avatar-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';

/** Maximum raw binary size permitted for avatar uploads (2 megabytes) */
export const MAX_AVATAR_RAW_BYTES = 2 * 1024 * 1024;

/** Strict list of MIME types accepted for personnel profile imagery */
export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedAvatarMimeType = (typeof ALLOWED_AVATAR_MIME_TYPES)[number];

/** Target user identifier validation schema */
export const targetUserIdSchema = z
  .string()
  .uuid({ message: 'Target user ID must be a valid UUID.' });

/**
 * Validates payload parameters received by avatar Server Actions.
 */
export const updateAvatarPayloadSchema = z.object({
  targetUserId: targetUserIdSchema,
  avatarUrl: z.string().url().max(1024),
});

export type UpdateAvatarPayload = z.infer<typeof updateAvatarPayloadSchema>;
