/**
 * @file client-works-schemas.ts
 * @description Zod validation schemas and type inferences for post-conversion Client Works,
 *              milestone tracking, production stage state machines, and lead assignments.
 *              Separated from 'use server' modules to comply with Next.js Server Action boundary invariants.
 * @module lib/client-works-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';

export const clientWorkDeliveryStages = [
  'kickoff',
  'strategy',
  'design_ui_ux',
  'development',
  'review_qa',
  'delivered',
] as const;

export const clientWorkHealthStatuses = [
  'on_track',
  'at_risk',
  'blocked',
  'completed',
] as const;

export const clientWorkStageEnum = z.enum(clientWorkDeliveryStages, {
  message: 'Invalid delivery stage.',
});

export const clientWorkHealthEnum = z.enum(clientWorkHealthStatuses, {
  message: 'Invalid health status.',
});

export const clientWorkMilestoneStatusEnum = z.enum(['pending', 'in_progress', 'completed'], {
  message: 'Milestone status must be pending, in_progress, or completed.',
});

/**
 * Validation schema for transitioning a client project across production delivery stages.
 */
export const updateClientWorkStageSchema = z.object({
  workId: z
    .string({ message: 'Client work ID is required.' })
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Client work ID must be a valid UUID.'
    ),
  stage: clientWorkStageEnum,
  notes: z.string().trim().max(1000, 'Stage transition note must not exceed 1000 characters.').optional().nullable(),
});

export type UpdateClientWorkStageFormData = z.infer<typeof updateClientWorkStageSchema>;

/**
 * Validation schema for updating operational delivery health status.
 */
export const updateClientWorkHealthSchema = z.object({
  workId: z
    .string({ message: 'Client work ID is required.' })
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Client work ID must be a valid UUID.'
    ),
  healthStatus: clientWorkHealthEnum,
  reason: z.string().trim().max(500, 'Health status explanation must not exceed 500 characters.').optional().nullable(),
});

export type UpdateClientWorkHealthFormData = z.infer<typeof updateClientWorkHealthSchema>;

/**
 * Validation schema for updating individual milestone progress.
 */
export const updateClientWorkMilestoneSchema = z.object({
  workId: z
    .string({ message: 'Client work ID is required.' })
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Client work ID must be a valid UUID.'
    ),
  milestoneId: z.string().trim().min(1, 'Milestone identifier is required.'),
  status: clientWorkMilestoneStatusEnum,
});

export type UpdateClientWorkMilestoneFormData = z.infer<typeof updateClientWorkMilestoneSchema>;

/**
 * Validation schema for assigning creative and technical directors to a client work.
 */
export const assignClientWorkLeadsSchema = z.object({
  workId: z
    .string({ message: 'Client work ID is required.' })
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Client work ID must be a valid UUID.'
    ),
  creativeLeadId: z
    .string()
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, 'Creative lead must be a valid UUID.')
    .optional()
    .nullable(),
  techLeadId: z
    .string()
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, 'Tech lead must be a valid UUID.')
    .optional()
    .nullable(),
});

export type AssignClientWorkLeadsFormData = z.infer<typeof assignClientWorkLeadsSchema>;
