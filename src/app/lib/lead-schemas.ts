/**
 * @file lead-schemas.ts
 * @description Zod validation schemas and TypeScript contracts for commercial lead creation
 *              and pipeline operations within the Marca Ubi Enterprise CRM.
 * @module lib/lead-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';
import type { CrmUserRole, PreferredChannel, ServiceCategory, LeadPriority } from '@/types/crm';

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
      .uuid({ message: 'Invalid representative identifier' })
      .optional()
      .or(z.literal('')),
    leadSourceId: z
      .string()
      .uuid({ message: 'Invalid lead source identifier' })
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

export interface AssigneeOption {
  id: string;
  fullName: string;
  email: string;
  role: CrmUserRole;
}

export interface LeadActionResult {
  success: boolean;
  leadId?: string;
  id?: string;
  error?: string;
}
