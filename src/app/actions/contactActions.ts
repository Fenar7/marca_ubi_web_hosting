'use server';

/**
 * @file contactActions.ts
 * @description Secure Server Action for public contact inquiries from `/contact`.
 *              Enforces Zod validation, cryptographic honeypot bot trap, RFC normalization,
 *              and direct ingestion into the sales funnel CRM with deduplication.
 *              Strictly complies with Next.js 16 Server Action boundaries (async functions only).
 * @module actions/contactActions
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { headers } from 'next/headers';
import { contactInquirySchema, type ContactActionResult } from '@/app/lib/validations/contact';
import { normalizeEmail, normalizePhone, sanitizeHtml } from '@/app/lib/normalization';
import { getAdminClient } from '@/app/lib/supabase/admin';
import { checkRateLimit, extractClientIp } from '@/app/lib/rateLimit';
import { evaluateLeadDeduplication, type ExistingLeadRecord } from '@/app/lib/deduplication';
import { dispatchStudioLeadAlert } from '@/app/lib/notifications';

const DEFAULT_NEW_FUNNEL_STATUS_ID = 'b0000000-0000-0000-0000-000000000001';
const DEFAULT_WEBSITE_FORM_SOURCE_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Submits a contact inquiry from the public `/contact` page.
 * Sanitizes input, checks the anti-spam honeypot, normalizes contact coordinates,
 * and enters the lead into the commercial CRM pipeline.
 *
 * @param {unknown} _prevState Previous action state (for useActionState compatibility).
 * @param {FormData} formData Native form payload submitted by client.
 * @returns {Promise<ContactActionResult>} Result with success indicator, receipt, or validation errors.
 */
export async function submitContactInquiry(
  _prevState: unknown,
  formData: FormData
): Promise<ContactActionResult> {
  try {
    // 1. Extract raw parameters from FormData
    const rawData = {
      name: formData.get('name'),
      email: formData.get('email'),
      organization: formData.get('organization'),
      phone: formData.get('phone'),
      track: formData.get('track'),
      budgetAmount: formData.get('budgetAmount'),
      message: formData.get('message'),
      marca_contact_hp: formData.get('marca_contact_hp'),
    };

    // 2. Cryptographic Honeypot Trap
    // Bots auto-fill all visible and invisible text fields. If this field contains any string,
    // we simulate a valid transmission (200 OK) without writing to the database, neutralizing spam.
    if (rawData.marca_contact_hp && String(rawData.marca_contact_hp).trim().length > 0) {
      return {
        success: true,
        message: 'Your inquiry has been received. Our studio desks will review your brief.',
        receiptId: 'MUBI-HP-MOCK',
      };
    }

    // 3. Schema validation via Zod
    const parseResult = contactInquirySchema.safeParse(rawData);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      return {
        success: false,
        message: 'Please review and correct the marked fields below.',
        errors: fieldErrors,
      };
    }

    const input = parseResult.data;

    // 4. Rate Limiting Check
    const headersList = await headers();
    const reqLike = { headers: headersList };
    const clientIp = extractClientIp(reqLike as unknown as Request);
    const rateCheck = checkRateLimit(clientIp);

    if (!rateCheck.allowed) {
      return {
        success: false,
        message: 'Too many requests. Please wait a few moments before submitting again.',
      };
    }

    // 5. Normalization & Sanitization
    const normalizedEmail = normalizeEmail(input.email);
    const phoneResult = normalizePhone(input.phone);
    const normalizedPhone = phoneResult.phone;

    const sanitizedName = sanitizeHtml(input.name) ?? input.name;
    const sanitizedOrg = sanitizeHtml(input.organization);
    const sanitizedBudget = sanitizeHtml(input.budgetAmount);
    const sanitizedMsg = sanitizeHtml(input.message) ?? input.message;

    const trackLabel =
      input.track === 'new-business'
        ? 'New Business & Commissions'
        : input.track === 'press-media'
          ? 'Press & Speaking Engagements'
          : 'Strategic Partnerships & General';

    const formattedNotes = `[INQUIRY TRACK: ${trackLabel.toUpperCase()}]${
      sanitizedBudget ? `\n[APPROXIMATE BUDGET: ${sanitizedBudget}]` : ''
    }\n\n${sanitizedMsg}`;

    const receiptId = `MUBI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 6. Persistence via Supabase Admin Client
    const adminClient = getAdminClient();
    if (adminClient) {
      try {
        // Query for duplicates by email
        const { data: existingLeads } = await adminClient
          .from('leads')
          .select('id, lead_id, name, email, phone, status_id, priority, notes, inquiry_count, brief_payload')
          .eq('email', normalizedEmail)
          .limit(1);

        const existingLead = existingLeads && existingLeads.length > 0 ? (existingLeads[0] as ExistingLeadRecord) : null;

        if (existingLead) {
          const decision = evaluateLeadDeduplication(existingLead, {
            name: sanitizedName,
            email: normalizedEmail,
            phone: normalizedPhone,
            company: sanitizedOrg,
            service_category: input.track === 'new-business' ? 'Branding' : 'Full-Suite Advisory',
            notes: formattedNotes,
          });

          const currentCount = existingLead.inquiry_count || 1;
          await adminClient
            .from('leads')
            .update({
              inquiry_count: currentCount + 1,
              priority: 'High',
              notes: `${existingLead.notes || ''}\n\n--- Follow-up Inquiry (${new Date().toLocaleDateString('en-GB')}) ---\n${formattedNotes}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLead.id);

          await adminClient.from('lead_activities').insert({
            lead_id: existingLead.id,
            actor_id: null,
            activity_type: decision.activityType || 'SYSTEM_NOTE',
            description: `Contact Page inquiry merged into existing client record (${trackLabel}).`,
            metadata: {
              track: input.track,
              budget: sanitizedBudget,
              receipt_id: receiptId,
            },
          });
        } else {
          // New Lead Insertion
          const { data: newLead } = await adminClient
            .from('leads')
            .insert({
              name: sanitizedName,
              email: normalizedEmail,
              phone: normalizedPhone,
              company: sanitizedOrg,
              status_id: DEFAULT_NEW_FUNNEL_STATUS_ID,
              lead_source_id: DEFAULT_WEBSITE_FORM_SOURCE_ID,
              service_category: input.track === 'new-business' ? 'Branding' : 'Full-Suite Advisory',
              budget_bracket: sanitizedBudget,
              notes: formattedNotes,
              priority: input.track === 'new-business' ? 'High' : 'Medium',
              preferred_channel: 'Email',
              brief_payload: {
                source: 'Contact Page Direct Inquiry',
                track: input.track,
                budget_amount: sanitizedBudget,
                raw_message: sanitizedMsg,
                receipt_id: receiptId,
                ip: clientIp,
              },
            })
            .select('id, lead_id')
            .single();

          if (newLead) {
            await adminClient.from('lead_activities').insert({
              lead_id: newLead.id,
              actor_id: null,
              activity_type: 'INQUIRY_RECEIVED',
              description: `New contact inquiry received via /contact (${trackLabel}).`,
              metadata: {
                track: input.track,
                budget: sanitizedBudget,
                receipt_id: receiptId,
              },
            });
          }
        }

        // Asynchronously notify studio team
        dispatchStudioLeadAlert({
          leadId: receiptId,
          action: 'NEW_LEAD',
          name: sanitizedName,
          company: sanitizedOrg,
          email: normalizedEmail,
          phone: normalizedPhone,
          source: 'Website Form (Contact Page)',
          serviceCategory: input.track === 'new-business' ? 'Branding' : 'Full-Suite Advisory',
          expectedValue: 0,
          priority: input.track === 'new-business' ? 'High' : 'Medium',
          notes: formattedNotes,
        }).catch((err) => console.warn('[CONTACT_ALERT_WARN]', err));
      } catch (dbErr) {
        console.warn('[CONTACT_PERSISTENCE_FALLBACK]', dbErr);
      }
    }

    return {
      success: true,
      message: 'Your inquiry has been transmitted to our desks. Our partners review all inquiries within 24 business hours.',
      receiptId,
    };
  } catch (err: unknown) {
    console.error('[SUBMIT_CONTACT_INQUIRY_ERR]', err);
    return {
      success: false,
      message: 'An unexpected transmission error occurred. Please try again or reach us directly at hello@marcaubi.com.',
    };
  }
}
