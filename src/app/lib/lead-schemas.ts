/**
 * @file lead-schemas.ts
 * @description Zod validation schemas and TypeScript contracts for commercial lead creation
 *              and pipeline operations within the Marca Ubi Enterprise CRM.
 * @module lib/lead-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';
import type {
  CrmUserRole,
  PreferredChannel,
  ServiceCategory,
  LeadPriority,
  AssigneeOption,
  LeadActionResult,
} from '@/types/crm';

/**
 * Service category enum list matching database check constraint `chk_leads_service_category`.
 */
export const SERVICE_CATEGORIES = [
  'Branding',
  'Web & Digital',
  'Mobile Apps',
  'UI/UX Design',
  'Full-Suite Advisory',
  'Other',
] as const;

/**
 * Preferred communication channels matching database check constraint `chk_leads_preferred_channel`.
 */
export const PREFERRED_CHANNELS = [
  'Phone',
  'WhatsApp',
  'Email',
  'Meeting',
] as const;

/**
 * Lead priority tiers matching database check constraint `chk_leads_priority`.
 */
export const LEAD_PRIORITIES = ['High', 'Medium', 'Low'] as const;

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Common budget tiers for agency client valuation profiling.
 */
export const BUDGET_TIERS = [
  '< ₹5 Lakhs',
  '₹5L - ₹15L',
  '₹15L - ₹30L',
  '₹30L - ₹75L',
  '₹75L - ₹1.5Cr',
  '> ₹1.5 Crore',
] as const;

/**
 * Zod schema enforcing rigorous validation for manual lead creation.
 * Enforces database-level constraint `chk_lead_contact_info` requiring either
 * a valid trimmed email or telephone coordinate.
 */
export const createManualLeadSchema = z
  .object({
    name: z
      .string({ message: 'Client contact name is required' })
      .trim()
      .min(2, { message: 'Client name must contain at least 2 characters' })
      .max(100, { message: 'Client name must not exceed 100 characters' }),
    company: z
      .string()
      .trim()
      .max(100, { message: 'Company name must not exceed 100 characters' })
      .optional()
      .or(z.literal('')),
    companyWebsite: z
      .string()
      .trim()
      .max(255, { message: 'Website URL must not exceed 255 characters' })
      .optional()
      .or(z.literal('')),
    email: z
      .string()
      .trim()
      .max(255, { message: 'Email address must not exceed 255 characters' })
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val.length === 0) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        },
        { message: 'Please provide a valid email coordinate' }
      ),
    phone: z
      .string()
      .trim()
      .max(30, { message: 'Phone number must not exceed 30 digits' })
      .optional()
      .or(z.literal('')),
    preferredChannel: z
      .enum(PREFERRED_CHANNELS, {
        message: 'Please select a valid communication channel',
      })
      .default('Phone'),
    serviceCategory: z
      .enum(SERVICE_CATEGORIES, {
        message: 'Please select a valid service category',
      })
      .default('Web & Digital'),
    budgetBracket: z
      .string()
      .trim()
      .max(50, { message: 'Budget tier must not exceed 50 characters' })
      .optional()
      .or(z.literal('')),
    priority: z
      .enum(LEAD_PRIORITIES, {
        message: 'Please select a valid deal priority',
      })
      .default('Medium'),
    expectedValue: z.coerce
      .number({ message: 'Expected valuation must be a numeric amount' })
      .min(0, { message: 'Expected valuation cannot be negative' })
      .default(0),
    assignedTo: z
      .string()
      .regex(UUID_REGEX, { message: 'Invalid representative identifier' })
      .optional()
      .or(z.literal('')),
    leadSourceId: z
      .string()
      .regex(UUID_REGEX, { message: 'Invalid lead source identifier' })
      .optional()
      .or(z.literal('')),
    notes: z
      .string()
      .trim()
      .max(2000, { message: 'Engagement notes must not exceed 2000 characters' })
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    const hasEmail = typeof data.email === 'string' && data.email.trim().length > 0;
    const hasPhone = typeof data.phone === 'string' && data.phone.trim().length > 0;

    if (!hasEmail && !hasPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one contact coordinate (email or telephone) is required for client outreach.',
        path: ['phone'],
      });
    }
  });

export type CreateManualLeadInput = z.infer<typeof createManualLeadSchema>;

export type { AssigneeOption, LeadActionResult } from '@/types/crm';

/**
 * Omnichannel touchpoint activity types supported by the fast logger.
 */
export const TOUCHPOINT_ACTIVITY_TYPES = [
  'call_logged',
  'email_sent',
  'meeting_held',
  'meeting_notes',
  'whatsapp_sent',
  'note_added',
  'follow_up_scheduled',
] as const;

export type TouchpointActivityType = (typeof TOUCHPOINT_ACTIVITY_TYPES)[number];

/**
 * Zod validation schema for updating deal funnel stage progression.
 * Accommodates terminal status attribution (lostReason) and optional stage transition notes.
 */
export const updateLeadStatusSchema = z.object({
  leadId: z
    .string({ message: 'Lead identifier is required' })
    .regex(UUID_REGEX, { message: 'Invalid lead identifier' }),
  newStatusId: z
    .string({ message: 'New status identifier is required' })
    .regex(UUID_REGEX, { message: 'Invalid status identifier' }),
  lostReason: z
    .string()
    .trim()
    .max(500, { message: 'Lost reason must not exceed 500 characters' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  note: z
    .string()
    .trim()
    .max(2000, { message: 'Status transition note must not exceed 2000 characters' })
    .optional()
    .or(z.literal(''))
    .nullable(),
});

export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;

/**
 * Zod validation schema for logging customer touchpoints and scheduling follow-ups.
 * Enforces non-empty interaction narratives and sanitized ISO date stamps.
 */
export const addLeadTouchpointSchema = z.object({
  leadId: z
    .string({ message: 'Lead identifier is required' })
    .regex(UUID_REGEX, { message: 'Invalid lead identifier' }),
  activityType: z.enum(TOUCHPOINT_ACTIVITY_TYPES, {
    message: 'Please select a valid touchpoint activity type',
  }),
  description: z
    .string({ message: 'Touchpoint description is required' })
    .trim()
    .min(1, { message: 'Touchpoint description must not be empty' })
    .max(3000, { message: 'Touchpoint description must not exceed 3000 characters' }),
  nextFollowUp: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true;
        const parsed = Date.parse(val);
        return !Number.isNaN(parsed);
      },
      { message: 'Next follow-up must be a valid ISO date timestamp' }
    )
    .optional()
    .or(z.literal(''))
    .nullable(),
});

export type AddLeadTouchpointInput = z.infer<typeof addLeadTouchpointSchema>;

/**
 * Zod validation schema for reassigning commercial deal ownership to a staff member.
 * Restricts target user to active representatives via downstream server action validation.
 */
export const updateLeadAssigneeSchema = z.object({
  leadId: z
    .string({ message: 'Lead identifier is required' })
    .regex(UUID_REGEX, { message: 'Invalid lead identifier' }),
  newAssigneeId: z
    .string({ message: 'Assignee identifier is required' })
    .regex(UUID_REGEX, { message: 'Invalid representative identifier' }),
  note: z
    .string()
    .trim()
    .max(2000, { message: 'Reassignment note must not exceed 2000 characters' })
    .optional()
    .or(z.literal(''))
    .nullable(),
});

export type UpdateLeadAssigneeInput = z.infer<typeof updateLeadAssigneeSchema>;

/**
 * Zod validation schema for updating deal valuation parameters, priority tier, and client notes.
 */
export const updateLeadDealParametersSchema = z.object({
  leadId: z
    .string({ message: 'Lead identifier is required' })
    .regex(UUID_REGEX, { message: 'Invalid lead identifier' }),
  expectedValue: z.coerce
    .number({ message: 'Expected valuation must be a numeric amount' })
    .min(0, { message: 'Expected valuation cannot be negative' })
    .max(1000000000, { message: 'Expected valuation cannot exceed ₹100 Crore' })
    .optional(),
  priority: z
    .enum(LEAD_PRIORITIES, {
      message: 'Please select a valid deal priority',
    })
    .optional(),
  notes: z
    .string()
    .trim()
    .max(5000, { message: 'Engagement notes must not exceed 5000 characters' })
    .optional()
    .or(z.literal(''))
    .nullable(),
});

export type UpdateLeadDealParametersInput = z.infer<typeof updateLeadDealParametersSchema>;

/**
 * Zod validation schema for converting an inbound inquiry into an active pipeline deal.
 */
export const convertLeadToDealSchema = z.object({
  leadId: z
    .string({ message: 'Lead identifier is required' })
    .regex(UUID_REGEX, { message: 'Invalid lead identifier' }),
  targetStatusId: z
    .string()
    .regex(UUID_REGEX, { message: 'Invalid target status identifier' })
    .optional(),
  expectedValue: z.coerce
    .number({ message: 'Expected valuation must be a numeric amount' })
    .min(0, { message: 'Expected valuation cannot be negative' })
    .max(1000000000, { message: 'Expected valuation cannot exceed ₹100 Crore' }),
  assignedTo: z
    .string()
    .regex(UUID_REGEX, { message: 'Invalid representative identifier' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  priority: z
    .enum(LEAD_PRIORITIES, {
      message: 'Please select a valid deal priority',
    })
    .default('High'),
  notes: z
    .string()
    .trim()
    .max(2000, { message: 'Conversion notes must not exceed 2000 characters' })
    .optional()
    .or(z.literal(''))
    .nullable(),
});

export type ConvertLeadToDealInput = z.infer<typeof convertLeadToDealSchema>;
/**
 * Zod validation schema for updating comprehensive lead details, contact coordinates,
 * commercial engagement scope, and executive notes from the Client 360° Dossier.
 */
export const updateLeadDetailsSchema = z.object({
  leadId: z
    .string({ message: 'Lead identifier is required' })
    .regex(UUID_REGEX, { message: 'Invalid lead identifier' }),
  name: z
    .string()
    .trim()
    .min(1, { message: 'Contact name cannot be empty' })
    .max(255, { message: 'Contact name cannot exceed 255 characters' })
    .optional(),
  company: z
    .string()
    .trim()
    .max(255, { message: 'Company name cannot exceed 255 characters' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  companyWebsite: z
    .string()
    .trim()
    .max(500, { message: 'Website cannot exceed 500 characters' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  industry: z
    .string()
    .trim()
    .max(255, { message: 'Industry cannot exceed 255 characters' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  email: z
    .string()
    .trim()
    .email({ message: 'Invalid business email format' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  phone: z
    .string()
    .trim()
    .max(50, { message: 'Phone number cannot exceed 50 characters' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  preferredChannel: z
    .enum(PREFERRED_CHANNELS, {
      message: 'Please select a valid communication channel',
    })
    .optional(),
  serviceCategory: z
    .enum(SERVICE_CATEGORIES, {
      message: 'Please select a valid service scope category',
    })
    .optional(),
  budgetBracket: z
    .string()
    .trim()
    .max(100, { message: 'Budget tier cannot exceed 100 characters' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  expectedValue: z.coerce
    .number({ message: 'Expected valuation must be a numeric amount' })
    .min(0, { message: 'Expected valuation cannot be negative' })
    .max(1000000000, { message: 'Expected valuation cannot exceed ₹100 Crore' })
    .optional(),
  priority: z
    .enum(LEAD_PRIORITIES, {
      message: 'Please select a valid deal priority',
    })
    .optional(),
  notes: z
    .string()
    .trim()
    .max(5000, { message: 'Executive deal notes must not exceed 5000 characters' })
    .optional()
    .or(z.literal(''))
    .nullable(),
});

export type UpdateLeadDetailsInput = z.infer<typeof updateLeadDetailsSchema>;
