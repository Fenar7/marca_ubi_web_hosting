'use server';

import { headers } from 'next/headers';
import {
  persistPublicInquiry,
  PublicInquiryError,
  publicInquiryKey,
} from '@/app/lib/intake/publicInquiry';
import {
  normalizeEmail,
  normalizePhone,
  sanitizeHtml,
} from '@/app/lib/normalization';
import { checkRateLimit, extractClientIp } from '@/app/lib/rateLimit';
import {
  contactInquirySchema,
  type ContactActionResult,
} from '@/app/lib/validations/contact';

const trackLabels = {
  'new-business': 'New Business & Commissions',
  'press-media': 'Press & Speaking Engagements',
  partnerships: 'Partnerships',
  general: 'General Inquiries',
};

/** Public Contact acknowledges only a committed inquiry, while the honeypot does not create records. */
export async function submitContactInquiry(
  _prevState: unknown,
  formData: FormData,
): Promise<ContactActionResult> {
  const requestHeaders = await headers();
  if (!checkRateLimit(extractClientIp({ headers: requestHeaders })).allowed) {
    return {
      success: false,
      message: 'Too many requests. Please wait before submitting again.',
    };
  }

  const honeypot = formData.get('marca_contact_hp');
  if (typeof honeypot === 'string' && honeypot.trim()) {
    return { success: true, message: 'Your inquiry has been received.' };
  }
  const parsed = contactInquirySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    organization: formData.get('organization'),
    phone: formData.get('phone'),
    track: formData.get('track') ?? undefined,
    budgetAmount: formData.get('budgetAmount'),
    message: formData.get('message'),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: 'Please correct the marked fields.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = parsed.data;
  const name = sanitizeHtml(input.name.replaceAll('\0', '').trim());
  const message = sanitizeHtml(input.message.replaceAll('\0', '').trim());
  if (!name || !message) {
    return { success: false, message: 'Enter a name and a message.' };
  }

  try {
    const key = formData.get('idempotencyKey');
    if (key !== null && typeof key !== 'string') {
      return { success: false, message: 'Invalid inquiry request identifier.' };
    }
    const budget = sanitizeHtml(input.budgetAmount?.replaceAll('\0', ''));
    const phone = normalizePhone(input.phone).phone;
    const receipt = await persistPublicInquiry({
      origin: 'contact',
      idempotency_key: publicInquiryKey(key),
      name,
      email: normalizeEmail(input.email),
      phone: phone && /^\+?[0-9]{7,15}$/.test(phone) ? phone : null,
      company: sanitizeHtml(input.organization?.replaceAll('\0', '')),
      preferred_channel: 'Email',
      service_category:
        input.track === 'new-business' ? 'Branding' : 'Full-Suite Advisory',
      budget_bracket: budget,
      expected_value: 0,
      summary: message,
      source_detail: 'Contact Page Direct Inquiry',
      brief: { track: trackLabels[input.track], ...(budget ? { budget } : {}) },
    });
    return {
      success: true,
      message: 'Your inquiry has been received.',
      receiptId: receipt.inquiry_ref,
    };
  } catch (error) {
    if (!(error instanceof PublicInquiryError)) {
      console.error('[inquiry-capture] Contact capture failed');
    }
    return {
      success: false,
      message:
        error instanceof PublicInquiryError
          ? error.message
          : 'Could not save your inquiry. Please try again or email hello@marcaubi.com.',
    };
  }
}
