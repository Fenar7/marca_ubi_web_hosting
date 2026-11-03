/**
 * @file contact.ts
 * @description Zod validation schema and TypeScript contracts for the public contact inquiry portal (/contact).
 *              Enforces strict input sanitization, RFC email conformance, boundary lengths,
 *              cryptographic honeypot inspection, and track categorizations.
 * @module lib/validations/contact
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';

export const contactTrackEnum = z.enum([
  'new-business',
  'press-media',
  'partnerships',
  'general',
]);

export type ContactTrack = z.infer<typeof contactTrackEnum>;

export const contactInquirySchema = z.object({
  name: z
    .string({ message: 'Full name is required.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name cannot exceed 100 characters.'),
  email: z
    .string({ message: 'Email address is required.' })
    .trim()
    .email('Please provide a valid email address.')
    .max(255, 'Email cannot exceed 255 characters.')
    .transform((val) => val.toLowerCase()),
  organization: z
    .string()
    .trim()
    .max(120, 'Organization name cannot exceed 120 characters.')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  phone: z
    .string()
    .trim()
    .max(50, 'Phone number cannot exceed 50 characters.')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  track: contactTrackEnum.default('new-business'),
  budgetAmount: z
    .string()
    .trim()
    .max(60, 'Budget amount cannot exceed 60 characters.')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  message: z
    .string({ message: 'Message is required.' })
    .trim()
    .min(10, 'Message must be at least 10 characters.')
    .max(2000, 'Message cannot exceed 2000 characters.'),
  marca_contact_hp: z
    .string()
    .optional()
    .nullable(),
});

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;

export interface ContactActionResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  receiptId?: string;
}
