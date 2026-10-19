/**
 * @file stage-transition-schemas.ts
 * @description Zod validation schemas, lost reason taxonomies, and type contracts for commercial pipeline
 *              stage transitions (Negotiation, Lost, and Converted).
 *              Separated from 'use server' modules to strictly comply with Next.js App Router
 *              Server Action boundary invariants (all Server Action exports must be async functions).
 * @module lib/stage-transition-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';
import type { FunnelBucket } from '@/types/crm';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Standardized lost reason catalog according to PRD Section 15.18 and Section 5.
 */
export const LOST_REASON_OPTIONS = [
  'Budget Incompatible',
  'Selected Competitor',
  'Project Cancelled',
  'Timeline Mismatch',
  'Unresponsive / Ghosted',
  'Terms Inflexible',
  'Other',
] as const;

export type LostReasonEnum = (typeof LOST_REASON_OPTIONS)[number];

/**
 * Normalized mapping to support internal shorthand keys as well as display labels.
 */
export const LOST_REASON_ALIASES: Record<string, LostReasonEnum> = {
  price: 'Budget Incompatible',
  budget: 'Budget Incompatible',
  'budget incompatible': 'Budget Incompatible',
  competitor: 'Selected Competitor',
  'selected competitor': 'Selected Competitor',
  out_of_scope: 'Project Cancelled',
  cancelled: 'Project Cancelled',
  'project cancelled': 'Project Cancelled',
  timing: 'Timeline Mismatch',
  'timeline mismatch': 'Timeline Mismatch',
  ghosted: 'Unresponsive / Ghosted',
  unresponsive: 'Unresponsive / Ghosted',
  'unresponsive / ghosted': 'Unresponsive / Ghosted',
  terms: 'Terms Inflexible',
  'terms inflexible': 'Terms Inflexible',
  other: 'Other',
};

/**
 * Zod Input Validation Schemas for Guarded Stage Transitions
 */

export const transitionToNegotiationSchema = z.object({
  leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid deal UUID format.' }),
  expectedValue: z
    .number({ message: 'Deal valuation must be a valid number.' })
    .positive({ message: 'Advancing to Negotiation requires a positive deal valuation (> 0).' }),
  anticipatedCloseDate: z
    .string()
    .trim()
    .min(1, { message: 'Anticipated close date is required.' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Anticipated close date must be a valid date.',
    }),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type TransitionToNegotiationInput = z.infer<typeof transitionToNegotiationSchema>;

export const transitionToLostSchema = z
  .object({
    leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid deal UUID format.' }),
    lostReason: z.string().trim().min(1, { message: 'Lost reason is required.' }),
    lostNotes: z.string().trim().max(2000).optional().nullable(),
  })
  .refine(
    (data) => {
      const normalized =
        LOST_REASON_ALIASES[data.lostReason.toLowerCase()] ||
        (LOST_REASON_OPTIONS.includes(data.lostReason as LostReasonEnum) ? data.lostReason : null);
      return normalized !== null;
    },
    {
      message: 'Invalid lost reason specified. Must match standardized agency catalog.',
      path: ['lostReason'],
    }
  )
  .refine(
    (data) => {
      const normalized =
        LOST_REASON_ALIASES[data.lostReason.toLowerCase()] || data.lostReason;
      if (normalized === 'Other') {
        return !!data.lostNotes && data.lostNotes.trim().length >= 10;
      }
      return true;
    },
    {
      message: 'Detailed explanatory notes (minimum 10 characters) are required when selecting "Other".',
      path: ['lostNotes'],
    }
  );

export type TransitionToLostInput = z.infer<typeof transitionToLostSchema>;

export const transitionToConvertedSchema = z.object({
  leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid deal UUID format.' }),
  finalRevenue: z
    .number({ message: 'Final contract revenue must be a valid number.' })
    .positive({ message: 'Conversion requires a positive signed contract value (> 0).' }),
  signedContractDate: z
    .string()
    .trim()
    .min(1, { message: 'Signed contract date is required.' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Signed contract date must be a valid date.',
    }),
  paymentTerms: z
    .string()
    .trim()
    .min(3, { message: 'Commercial payment terms are required (minimum 3 characters).' }),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type TransitionToConvertedInput = z.infer<typeof transitionToConvertedSchema>;

export interface GuardedTransitionResultPayload {
  leadId: string;
  previousStatusId: string;
  previousStatusName: string;
  newStatusId: string;
  newStatusName: string;
  bucket: FunnelBucket;
  updatedAt: string;
  convertedAt?: string | null;
  expectedValue?: number;
  lostReason?: string | null;
  revisitDate?: string | null;
  nextFollowUp?: string | null;
}
