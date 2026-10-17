/**
 * @file ingest.ts
 * @description Zod validation schemas and TypeScript contracts for public lead ingestion
 *              via `/api/sales-funnel/ingest`. Enforces RFC email rules, bounded strings,
 *              domain enums, and cryptographic honeypot field inspection.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';

/**
 * Whitelist of acceptable commercial communication channels.
 */
export const preferredChannels = ['Phone', 'WhatsApp', 'Email', 'Meeting'] as const;

/**
 * Whitelist of commercial agency service categories.
 */
export const serviceCategories = [
  'Branding',
  'Web & Digital',
  'Mobile Apps',
  'UI/UX Design',
  'Full-Suite Advisory',
  'Other',
] as const;

/**
 * Zod schema validating incoming public lead ingestion submissions.
 * Requires at least one contact method (email or phone) to satisfy
 * database constraint `chk_lead_contact_info`.
 */
export const ingestLeadSchema = z
  .object({
    name: z
      .string({ message: 'Full name is required.' })
      .trim()
      .min(1, 'Full name cannot be empty.')
      .max(100, 'Full name cannot exceed 100 characters.'),
    email: z
      .string()
      .trim()
      .email('Please provide a valid email address.')
      .max(255, 'Email cannot exceed 255 characters.')
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val.toLowerCase() : null)),
    phone: z
      .string()
      .trim()
      .max(50, 'Phone number cannot exceed 50 characters.')
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    company: z
      .string()
      .trim()
      .max(120, 'Company name cannot exceed 120 characters.')
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    company_website: z
      .string()
      .trim()
      .max(255, 'Website URL cannot exceed 255 characters.')
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    industry: z
      .string()
      .trim()
      .max(100, 'Industry cannot exceed 100 characters.')
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    preferred_channel: z
      .enum(preferredChannels, {
        message: 'Invalid preferred communication channel.',
      })
      .default('Email'),
    service_category: z
      .enum(serviceCategories, {
        message: 'Invalid service category.',
      })
      .default('Web & Digital'),
    budget_bracket: z
      .string()
      .trim()
      .max(100, 'Budget bracket cannot exceed 100 characters.')
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    expected_value: z
      .number({ message: 'Expected value must be numeric.' })
      .nonnegative('Expected value cannot be negative.')
      .max(999999999.99, 'Expected value exceeds maximum allowed pipeline limit.')
      .optional()
      .default(0),
    notes: z
      .string()
      .trim()
      .max(2000, 'Notes cannot exceed 2000 characters.')
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    source_name: z
      .string()
      .trim()
      .max(100)
      .optional()
      .default('Website Form'),
    source_detail: z
      .string()
      .trim()
      .max(255)
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    source_id: z
      .string()
      .uuid('Invalid source identifier UUID.')
      .optional(),
    brief_payload: z
      .record(z.string(), z.unknown())
      .optional()
      .default({}),
    /**
     * Cryptographic honeypot field. Invisible to legitimate human users.
     * Bots auto-filling form inputs will populate this field, triggering immediate interception.
     */
    _hp_company_url_confirm: z
      .string()
      .nullable()
      .optional(),
  })
  .refine(
    (data) => (data.email && data.email.length > 0) || (data.phone && data.phone.length > 0),
    {
      message: 'Either a valid email address or phone number must be provided.',
      path: ['email'],
    }
  );

export type IngestLeadInput = z.infer<typeof ingestLeadSchema>;
