/**
 * @file agency-settings-schemas.ts
 * @description Zod validation schemas and TypeScript types for Agency Operational Settings,
 *              SLAs, Alert Grace Periods, Ingestion Security, and Inbound Brief Simulation.
 * @module app/lib/agency-settings-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';

export const agencySettingsSchema = z.object({
  id: z.literal('default').default('default'),
  lead_response_sla_minutes: z
    .number()
    .int('SLA minutes must be an integer')
    .min(5, 'SLA must be at least 5 minutes')
    .max(1440, 'SLA cannot exceed 24 hours (1440 minutes)')
    .default(60),
  followup_grace_period_hours: z
    .number()
    .int('Grace period must be an integer')
    .min(0, 'Grace period cannot be negative')
    .max(72, 'Grace period cannot exceed 72 hours')
    .default(4),
  stale_deal_threshold_days: z
    .number()
    .int('Stale threshold must be an integer')
    .min(1, 'Stale threshold must be at least 1 day')
    .max(90, 'Stale threshold cannot exceed 90 days')
    .default(14),
  dedup_window_hours: z
    .number()
    .int('Deduplication window must be an integer')
    .min(1, 'Deduplication window must be at least 1 hour')
    .max(168, 'Deduplication window cannot exceed 7 days (168 hours)')
    .default(24),
  bot_rate_limit_per_minute: z
    .number()
    .int('Rate limit must be an integer')
    .min(5, 'Rate limit must be at least 5 requests per minute')
    .max(120, 'Rate limit cannot exceed 120 requests per minute')
    .default(10),
  notification_email: z
    .union([z.string().email('Invalid notification email address'), z.literal('')])
    .nullable()
    .optional(),
  updated_at: z.string().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const updateAgencySettingsSchema = agencySettingsSchema.omit({
  id: true,
  updated_at: true,
  updated_by: true,
});

export const CANONICAL_SERVICE_CATEGORIES = [
  'Branding',
  'Web & Digital',
  'Mobile Apps',
  'UI/UX Design',
  'Full-Suite Advisory',
  'Other',
] as const;

export type CanonicalServiceCategory = (typeof CANONICAL_SERVICE_CATEGORIES)[number];

export const simulateInboundBriefSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Client name must be at least 2 characters')
    .max(100, 'Client name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid client email address')
    .max(120, 'Email cannot exceed 120 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number format'),
  company: z
    .string()
    .trim()
    .max(100, 'Company cannot exceed 100 characters')
    .optional()
    .default('Simulated Organization'),
  serviceCategory: z
    .enum(CANONICAL_SERVICE_CATEGORIES)
    .default('Web & Digital'),
  budgetBracket: z
    .string()
    .trim()
    .max(50, 'Budget bracket cannot exceed 50 characters')
    .optional()
    .default('₹15L - ₹25L'),
  message: z
    .string()
    .trim()
    .max(2000, 'Message cannot exceed 2000 characters')
    .optional()
    .default('Simulated inbound creative brief submission.'),
});

export type AgencySettings = z.infer<typeof agencySettingsSchema>;
export type UpdateAgencySettingsInput = z.infer<typeof updateAgencySettingsSchema>;
export type SimulateInboundBriefInput = z.infer<typeof simulateInboundBriefSchema>;
