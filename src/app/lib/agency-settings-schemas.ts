/**
 * @file agency-settings-schemas.ts
 * @description Zod validation schemas and TypeScript types for Agency Operational Settings,
 *              SLAs, Alert Grace Periods, and Ingestion Security Configurations.
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
    .string()
    .email('Invalid notification email address')
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

export type AgencySettings = z.infer<typeof agencySettingsSchema>;
export type UpdateAgencySettingsInput = z.infer<typeof updateAgencySettingsSchema>;
