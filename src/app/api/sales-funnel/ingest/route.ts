/**
 * @file route.ts
 * @description Public CRM Ingestion Route Handler (/api/sales-funnel/ingest).
 *              Accepts incoming client inquiries from `/start-project` brief builders
 *              and website modals. Enforces token-bucket rate limits, honeypot traps,
 *              Zod schema validation, and E.164 contact normalization.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getAdminClient } from '@/app/lib/supabase/admin';
import { ingestLeadSchema } from '@/app/lib/validations/ingest';
import { normalizeEmail, normalizePhone, sanitizeHtml } from '@/app/lib/normalization';
import { checkRateLimit, extractClientIp } from '@/app/lib/rateLimit';

export const runtime = 'nodejs';

// Maximum incoming payload size: 64 KB (65,536 bytes)
const MAX_PAYLOAD_BYTES = 64 * 1024;

// Default reference UUIDs from Phase 1 database seed
const DEFAULT_WEBSITE_FORM_SOURCE_ID = 'a0000000-0000-0000-0000-000000000001';
const DEFAULT_NEW_FUNNEL_STATUS_ID = 'b0000000-0000-0000-0000-000000000001';

// Server-side database connection pool for environments with DATABASE_URL
let pgPoolInstance: Pool | null = null;

function getPgPool(): Pool {
  if (!pgPoolInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Database connection configuration (DATABASE_URL or SUPABASE_SERVICE_ROLE_KEY) is missing.');
    }
    pgPoolInstance = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pgPoolInstance;
}

/**
 * Handles public inbound lead submissions.
 */
export async function POST(request: Request) {
  try {
    // 1. Payload size boundary check to defend against memory exhaustion
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payload size exceeds the 64KB limit.',
        },
        { status: 413 }
      );
    }

    // 2. Client IP extraction and Token-Bucket Rate Limiting (10 reqs / 10 mins)
    const clientIp = extractClientIp(request);
    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Maximum 10 submissions permitted per 10 minutes.',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
          },
        }
      );
    }

    // 3. Request body parsing
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Malformed JSON payload in request body.',
        },
        { status: 400 }
      );
    }

    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON payload. Object expected.',
        },
        { status: 400 }
      );
    }

    // 4. Cryptographic Honeypot Trap
    // Automated scrapers and spam bots fill all hidden form coordinates
    const bodyRecord = rawBody as Record<string, unknown>;
    const honeypotVal = bodyRecord._hp_company_url_confirm;

    if (typeof honeypotVal === 'string' && honeypotVal.trim().length > 0) {
      console.warn(`[HONEYPOT_INTERCEPTED] Bot submission from IP: ${clientIp}`);
      // Return simulated success to avoid alerting the bot script
      return NextResponse.json(
        {
          success: true,
          lead_id: 'LD-CONFIRMED',
          simulated: true,
        },
        { status: 200 }
      );
    }

    // 5. Schema Validation via Zod
    const validationResult = ingestLeadSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed for lead submission.',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    // 6. Contact Normalization & Sanitization
    const normalizedEmail = normalizeEmail(input.email);
    const phoneResult = normalizePhone(input.phone);
    const normalizedPhone = phoneResult.phone;

    const sanitizedName = sanitizeHtml(input.name);
    const sanitizedCompany = sanitizeHtml(input.company);
    const sanitizedWebsite = sanitizeHtml(input.company_website);
    const sanitizedIndustry = sanitizeHtml(input.industry);
    const sanitizedBudget = sanitizeHtml(input.budget_bracket);
    const sanitizedNotes = sanitizeHtml(input.notes);

    // 7. Assemble rich brief payload metadata
    const enrichedBriefPayload = {
      ...input.brief_payload,
      phone_normalization_warning: phoneResult.warning,
      raw_phone: phoneResult.raw,
      client_ip: clientIp,
      ingested_at: new Date().toISOString(),
    };

    // 8. Database Persistence Layer
    let insertedLead: { id: string; lead_id: string } | null = null;
    const hasServiceRoleKey =
      !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY.trim().length >= 20;

    if (hasServiceRoleKey) {
      // Primary Route: Use privileged Supabase Admin SDK
      const adminClient = getAdminClient();

      let resolvedSourceId = input.source_id;
      if (!resolvedSourceId && input.source_name) {
        const { data: sourceData } = await adminClient
          .from('lead_sources')
          .select('id')
          .ilike('name', input.source_name)
          .eq('is_active', true)
          .maybeSingle();

        resolvedSourceId = sourceData?.id || DEFAULT_WEBSITE_FORM_SOURCE_ID;
      } else if (!resolvedSourceId) {
        resolvedSourceId = DEFAULT_WEBSITE_FORM_SOURCE_ID;
      }

      const { data: leadRecord, error: leadError } = await adminClient
        .from('leads')
        .insert({
          name: sanitizedName,
          company: sanitizedCompany,
          company_website: sanitizedWebsite,
          industry: sanitizedIndustry,
          phone: normalizedPhone,
          email: normalizedEmail,
          preferred_channel: input.preferred_channel,
          service_category: input.service_category,
          budget_bracket: sanitizedBudget,
          expected_value: input.expected_value,
          notes: sanitizedNotes,
          lead_source_id: resolvedSourceId,
          status_id: DEFAULT_NEW_FUNNEL_STATUS_ID,
          brief_payload: enrichedBriefPayload,
        })
        .select('id, lead_id')
        .single();

      if (leadError || !leadRecord) {
        console.error('[INGEST_DB_ERROR] Supabase insert failed:', leadError);
        return NextResponse.json(
          {
            success: false,
            error: 'An internal error occurred while persisting your inquiry.',
          },
          { status: 500 }
        );
      }

      insertedLead = leadRecord;

      await adminClient.from('lead_activities').insert({
        lead_id: insertedLead.id,
        actor_id: null,
        activity_type: 'system_event',
        description: `Inbound lead inquiry ingested via public API from ${input.source_name || 'Website Form'}`,
        metadata: {
          source_name: input.source_name || 'Website Form',
          client_ip: clientIp,
          phone_warning: phoneResult.warning,
          service_category: input.service_category,
        },
      });
    } else {
      // Resilient Fallback Route: Direct PostgreSQL pool via DATABASE_URL
      const pool = getPgPool();

      let resolvedSourceId = input.source_id;
      if (!resolvedSourceId && input.source_name) {
        const sourceQuery = await pool.query(
          'SELECT id FROM public.lead_sources WHERE name ILIKE $1 AND is_active = true LIMIT 1',
          [input.source_name]
        );
        resolvedSourceId = sourceQuery.rows[0]?.id || DEFAULT_WEBSITE_FORM_SOURCE_ID;
      } else if (!resolvedSourceId) {
        resolvedSourceId = DEFAULT_WEBSITE_FORM_SOURCE_ID;
      }

      const insertQuery = `
        INSERT INTO public.leads (
          name, company, company_website, industry, phone, email,
          preferred_channel, service_category, budget_bracket, expected_value,
          notes, lead_source_id, status_id, brief_payload
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        RETURNING id, lead_id;
      `;

      const insertResult = await pool.query(insertQuery, [
        sanitizedName,
        sanitizedCompany,
        sanitizedWebsite,
        sanitizedIndustry,
        normalizedPhone,
        normalizedEmail,
        input.preferred_channel,
        input.service_category,
        sanitizedBudget,
        input.expected_value,
        sanitizedNotes,
        resolvedSourceId,
        DEFAULT_NEW_FUNNEL_STATUS_ID,
        JSON.stringify(enrichedBriefPayload),
      ]);

      const row = insertResult.rows[0];
      if (!row) {
        throw new Error('PostgreSQL insertion returned 0 rows.');
      }

      insertedLead = { id: row.id, lead_id: row.lead_id };

      await pool.query(
        `INSERT INTO public.lead_activities (
          lead_id, actor_id, activity_type, description, metadata
        ) VALUES ($1, NULL, 'system_event', $2, $3);`,
        [
          insertedLead.id,
          `Inbound lead inquiry ingested via public API from ${input.source_name || 'Website Form'}`,
          JSON.stringify({
            source_name: input.source_name || 'Website Form',
            client_ip: clientIp,
            phone_warning: phoneResult.warning,
            service_category: input.service_category,
          }),
        ]
      );
    }

    // 9. Successful Response with Rate Limit Transparency Headers
    return NextResponse.json(
      {
        success: true,
        id: insertedLead.id,
        lead_id: insertedLead.lead_id,
        message: 'Lead successfully captured into CRM sales funnel.',
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
        },
      }
    );
  } catch (error) {
    console.error('[INGEST_UNEXPECTED_ERROR] Critical failure in ingestion route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error processing lead ingestion.',
      },
      { status: 500 }
    );
  }
}
