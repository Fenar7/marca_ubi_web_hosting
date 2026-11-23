import { NextResponse } from 'next/server';
import {
  collectPublicBrief,
  persistPublicInquiry,
  PublicInquiryError,
  publicInquiryKey,
  resolvePublicOrigin,
} from '@/app/lib/intake/publicInquiry';
import { ingestLeadSchema } from '@/app/lib/validations/ingest';
import {
  normalizeEmail,
  normalizePhone,
  sanitizeHtml,
} from '@/app/lib/normalization';
import { checkRateLimit, extractClientIp } from '@/app/lib/rateLimit';

export const runtime = 'nodejs';

const MAX_PAYLOAD_BYTES = 64 * 1024;

/** Enforce the byte limit on the actual stream, including without a Content-Length header. */
async function readBoundedJson(request: Request): Promise<unknown> {
  const length = request.headers.get('content-length');
  if (length !== null && Number(length) > MAX_PAYLOAD_BYTES) {
    throw new PublicInquiryError(413, 'Inquiry payload must not exceed 64 KB.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new PublicInquiryError(400, 'A JSON object is required.');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const chunks: string[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PAYLOAD_BYTES) {
        await reader.cancel().catch(() => {});
        throw new PublicInquiryError(
          413,
          'Inquiry payload must not exceed 64 KB.',
        );
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return JSON.parse(chunks.join(''));
  } catch (error) {
    if (error instanceof PublicInquiryError) throw error;
    throw new PublicInquiryError(400, 'A valid JSON object is required.');
  } finally {
    reader.releaseLock();
  }
}

function errorResponse(
  status: number,
  message: string,
  responseHeaders?: HeadersInit,
) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: responseHeaders },
  );
}

/** Public capture returns an inquiry receipt without revealing whether CRM matches already exist. */
export async function POST(request: Request) {
  const rate = checkRateLimit(extractClientIp(request));
  const headers = {
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': String(rate.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rate.resetAt / 1000)),
  };
  if (!rate.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many inquiries from this network. Please try again later.',
        retryAfter: rate.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { ...headers, 'Retry-After': String(rate.retryAfterSeconds) },
      },
    );
  }

  try {
    const raw = await readBoundedJson(request);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return errorResponse(400, 'A JSON object is required.', headers);
    }
    if (
      '_hp_company_url_confirm' in raw &&
      typeof raw._hp_company_url_confirm === 'string' &&
      raw._hp_company_url_confirm.trim()
    ) {
      return NextResponse.json(
        { success: true, lead_id: 'LD-CONFIRMED', simulated: true },
        { headers },
      );
    }
    const parsed = ingestLeadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Check your inquiry and try again.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400, headers },
      );
    }
    const input = parsed.data;
    const email = normalizeEmail(input.email);
    const { phone } = normalizePhone(input.phone);
    if (!email && (!phone || !/^\+?[0-9]{7,15}$/.test(phone))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Check your inquiry and try again.',
          details: {
            phone: ['Enter a valid phone number or provide an email address.'],
          },
        },
        { status: 400, headers },
      );
    }
    const name = clean(input.name);
    if (!name) return errorResponse(400, 'Enter your name.', headers);
    const source = resolvePublicOrigin(input.source_name, input.source_detail);
    const brief = collectPublicBrief(input.brief_payload, source.origin);
    const receipt = await persistPublicInquiry({
      origin: source.origin,
      source_detail: source.detail,
      idempotency_key: publicInquiryKey(
        request.headers.get('x-idempotency-key'),
      ),
      name,
      email,
      phone: phone && /^\+?[0-9]{7,15}$/.test(phone) ? phone : null,
      company: clean(input.company),
      company_website: clean(input.company_website),
      industry: clean(input.industry),
      service_category: input.service_category,
      preferred_channel: input.preferred_channel,
      budget_bracket: clean(input.budget_bracket),
      expected_value: input.expected_value,
      summary:
        clean(input.notes) || 'Service requested: ' + input.service_category,
      brief,
    });

    return NextResponse.json(
      {
        success: true,
        receiptId: receipt.inquiry_ref,
        message: 'Your inquiry has been received.',
      },
      { status: receipt.replayed ? 200 : 201, headers },
    );
  } catch (error) {
    if (error instanceof PublicInquiryError) {
      return errorResponse(error.status, error.message, headers);
    }
    console.error('[inquiry-capture] Website capture failed');
    return errorResponse(
      503,
      'Could not save your inquiry. Please try again.',
      headers,
    );
  }
}

function clean(value?: string | null): string | null {
  return sanitizeHtml(value?.replaceAll('\0', '').trim());
}
