/**
 * @file lead-activity-schemas.ts
 * @description Zod validation schemas and type contracts for logging omnichannel touchpoint activities
 *              (calls, meetings, notes, WhatsApp interactions).
 *              Separated from 'use server' modules to strictly comply with Next.js App Router
 *              Server Action boundary invariants (all Server Action exports must be async functions).
 * @module lib/lead-activity-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Validated input schema for logging commercial interactions in the CRM.
 */
export const leadActivityInputSchema = z.object({
  leadId: z
    .string()
    .trim()
    .regex(UUID_REGEX, { message: 'Invalid deal UUID identifier format.' }),
  activityType: z.enum(
    [
      'call_logged',
      'whatsapp_sent',
      'meeting_notes',
      'meeting_held',
      'note_added',
    ],
    { message: 'Invalid commercial interaction type specified.' }
  ),
  description: z
    .string()
    .trim()
    .min(3, { message: 'Interaction note must be at least 3 characters in length.' })
    .max(5000, { message: 'Interaction note cannot exceed 5,000 characters.' }),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type LeadActivityInput = z.infer<typeof leadActivityInputSchema>;
