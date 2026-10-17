/**
 * @file kpiQuerySchema.ts
 * @description Zod validation schema and TypeScript type definitions for the
 *              Executive Pipeline KPI Aggregation API (/api/sales-funnel/kpis).
 * @architecture Validates temporal bounds (ISO 8601 strings), UUID identifiers for acquisition
 *               sources and sales assignees, and enforces logical date range sequencing.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const kpiQuerySchema = z
  .object({
    start_date: z
      .string()
      .trim()
      .datetime({ offset: true, message: 'start_date must be a valid ISO 8601 datetime with timezone.' })
      .or(
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be in YYYY-MM-DD or ISO 8601 format.')
      )
      .nullable()
      .optional(),
    end_date: z
      .string()
      .trim()
      .datetime({ offset: true, message: 'end_date must be a valid ISO 8601 datetime with timezone.' })
      .or(
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be in YYYY-MM-DD or ISO 8601 format.')
      )
      .nullable()
      .optional(),
    source_id: z
      .string()
      .trim()
      .regex(UUID_REGEX, 'source_id must be a valid UUID format.')
      .nullable()
      .optional(),
    assignee_id: z
      .string()
      .trim()
      .regex(UUID_REGEX, 'assignee_id must be a valid UUID format.')
      .nullable()
      .optional(),
    target_user_id: z
      .string()
      .trim()
      .regex(UUID_REGEX, 'target_user_id must be a valid UUID format.')
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date).getTime();
      const end = new Date(data.end_date).getTime();
      if (!isNaN(start) && !isNaN(end) && start > end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Temporal sequence violation: start_date cannot be chronologically later than end_date.',
          path: ['start_date'],
        });
      }
    }
  });

export type KpiQueryInput = z.infer<typeof kpiQuerySchema>;
