/**
 * @file reassignment-schemas.ts
 * @description Zod validation schemas and client form type contracts for the
 *              Lead Reassignment Wizard (/admin/team) and atomic reassignment engine.
 *              Separated from Server Actions to maintain Next.js 16 build boundary invariants.
 * @module lib/reassignment-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Strict schema validating atomic batch lead reassignment form submissions.
 * Prevents transferring deals to the source representative and enforces audit rationale length constraints.
 */
export const leadReassignmentSchema = z
  .object({
    sourceUserId: z
      .string({ message: 'Source user identifier is required.' })
      .regex(UUID_REGEX, 'Source representative identifier must be a valid UUID.'),
    destinationUserId: z
      .string({ message: 'Destination user identifier is required.' })
      .regex(UUID_REGEX, 'Destination representative identifier must be a valid UUID.'),
    transferReason: z
      .string({ message: 'Transfer reason is required.' })
      .trim()
      .min(5, { message: 'Transfer reason must be at least 5 characters.' })
      .max(500, { message: 'Transfer reason cannot exceed 500 characters.' }),
  })
  .refine((data) => data.sourceUserId !== data.destinationUserId, {
    message: 'Source and destination representatives cannot be identical.',
    path: ['destinationUserId'],
  });

export type LeadReassignmentFormData = z.infer<typeof leadReassignmentSchema>;

/**
 * Schema validating deal inventory queries for a specific commercial personnel.
 */
export const repInventoryQuerySchema = z.object({
  userId: z
    .string({ message: 'Representative identifier is required.' })
    .regex(UUID_REGEX, 'Representative identifier must be a valid UUID.'),
});

export type RepInventoryQueryInput = z.infer<typeof repInventoryQuerySchema>;
