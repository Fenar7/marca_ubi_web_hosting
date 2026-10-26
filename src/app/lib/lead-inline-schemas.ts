/**
 * @file lead-inline-schemas.ts
 * @description Zod validation schemas and payload types for inline status and priority mutations
 *              originating from the virtualized data grid and mobile card view.
 *              Separated from 'use server' modules to strictly comply with Next.js App Router
 *              Server Action boundary invariants (all Server Action exports must be async functions).
 * @module lib/lead-inline-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';
import { LEAD_PRIORITIES } from '@/app/lib/lead-schemas';
import type { FunnelBucket } from '@/types/crm';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const inlineStatusSchema = z.object({
  leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid deal UUID format.' }),
  statusId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid target status UUID format.' }),
});

export type InlineStatusInput = z.infer<typeof inlineStatusSchema>;

export const inlinePrioritySchema = z.object({
  leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid deal UUID format.' }),
  priority: z.enum(LEAD_PRIORITIES, { message: 'Invalid priority tier specified.' }),
});

export type InlinePriorityInput = z.infer<typeof inlinePrioritySchema>;

export interface InlineMutationResultPayload {
  leadId: string;
  field: 'status' | 'priority';
  newValue: string;
  statusDetails?: {
    id: string;
    name: string;
    bucket: FunnelBucket;
    color_code: string;
  };
  updatedAt: string;
}
