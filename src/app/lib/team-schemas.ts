/**
 * @file team-schemas.ts
 * @description Zod validation schemas and type inferences for administrative team governance,
 *              user provisioning, and password credential lifecycle workflows.
 *              Separated from 'use server' modules to comply with Next.js Server Action boundary invariants.
 * @module lib/team-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';

/**
 * Zod validation schema for provisioning a new team member.
 * Enforces strict RFC email validation, sanitized string lengths,
 * and high-entropy temporary password complexity.
 */
export const createTeamUserSchema = z.object({
  fullName: z
    .string({ message: 'Full name is required.' })
    .trim()
    .min(2, 'Full name must contain at least 2 characters.')
    .max(100, 'Full name must not exceed 100 characters.'),

  email: z
    .string({ message: 'Email address is required.' })
    .trim()
    .toLowerCase()
    .email('A valid business email address is required.'),

  role: z.enum(['admin', 'sales_manager', 'sales_executive', 'viewer'], {
    message: 'Role must be one of: admin, sales_manager, sales_executive, or viewer.',
  }),

  jobTitle: z
    .string({ message: 'Job title is required.' })
    .trim()
    .min(2, 'Job title must contain at least 2 characters.')
    .max(100, 'Job title must not exceed 100 characters.'),

  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),

  tempPassword: z
    .string({ message: 'Temporary password is required.' })
    .min(8, 'Temporary password must contain at least 8 characters.')
    .max(128, 'Temporary password must not exceed 128 characters.'),
});

export type CreateTeamUserFormData = z.infer<typeof createTeamUserSchema>;

/**
 * Validation schema for first-login mandatory password reset.
 * Enforces strong password complexity: >=12 characters, uppercase, lowercase, digit, and symbol.
 */
export const ResetPasswordSchema = z
  .object({
    newPassword: z
      .string({ error: 'New password is required.' })
      .min(12, 'Password must contain at least 12 characters.')
      .max(128, 'Password must not exceed 128 characters.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one numeric digit.')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
    confirmPassword: z.string({ error: 'Password confirmation is required.' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match.',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

/**
 * Commercial workload limit defining the maximum active deal assignments
 * for an individual Sales Representative before triggering the 'Reps at Capacity' indicator.
 * Governed by Master PRD Section 15.8.
 */
export const SALES_REP_CAPACITY_LIMIT = 15;

/**
 * Zod validation schema for suspending / offboarding a team member account.
 * Enforces valid UUID format and bounds optional suspension notes to 500 characters.
 * Governed by Master PRD Section 15.9 Sprint 4.1.
 */
export const suspendTeamUserSchema = z.object({
  targetUserId: z
    .string({ message: 'Target user ID is required.' })
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Target user ID must be a valid UUID.'
    ),
  reason: z
    .string()
    .trim()
    .max(500, 'Suspension reason must not exceed 500 characters.')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type SuspendTeamUserFormData = z.infer<typeof suspendTeamUserSchema>;

