/**
 * @file route.ts
 * @description Public Inbound Lead Ingestion Gateway with Smart Deduplication State Machine
 *              for the Marca Ubi Agency CRM & Sales Pipeline Platform.
 * @route POST /api/sales-funnel/ingest
 * @architecture Implements Master PRD Section 3, Section 5, and Section 15.11/15.12:
 *               1. Strict 64KB Request Body Defense (HTTP 413)
 *               2. Token-Bucket Rate Limiter with Spoofing-Resistant Leftmost IP (HTTP 429)
 *               3. Cryptographic Honeypot Trap (_hp_company_url_confirm) returning simulated HTTP 200
 *               4. Zod 4 Schema Validation with cross-field constraint sync (chk_lead_contact_info)
 *               5. International ITU-T E.164 Phone & RFC-5322 Lowercase Email Normalization
 *               6. Smart Deduplication State Machine:
 *                  - Active deals (open/potential): Merge inquiry, bump inquiry_count, elevate to High,
 *                    reset next_follow_up = now(), log 'duplicate_inquiry' activity (HTTP 200).
 *                  - Lost deals <= 90 days: Reactivate to 'New', elevate to High, reset follow-up (HTTP 200).
 *                  - Converted deals or lost > 90 days: Create linked re-engagement deal (HTTP 201).
 *               7. Asynchronous Studio Alert Dispatch Bridge with non-blocking latency SLA (<600ms)
 *               8. Dual-Engine Persistence: Supabase Service Role Admin SDK with automatic
 *                  fallback to parameterized PostgreSQL pool (pg.Pool).
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { NextRequest, NextResponse } from 'next/server';
import pg from 'pg';
import { getAdminClient } from '@/app/lib/supabase/admin';
import { ingestLeadSchema } from '@/app/lib/validations/ingest';
import { normalizeEmail, normalizePhone, sanitizeHtml } from '@/app/lib/normalization';
import { checkRateLimit, extractClientIp } from '@/app/lib/rateLimit';
import {
  evaluateLeadDeduplication,
  type ExistingLeadRecord,
} from '@/app/lib/deduplication';
import { dispatchStudioLeadAlert } from '@/app/lib/notifications';
import type { LeadPriority } from '@/types/crm';

export const runtime = 'nodejs';

const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 Kilobytes boundary
const DEFAULT_NEW_FUNNEL_STATUS_ID = 'b0000000-0000-0000-0000-000000000001';
const DEFAULT_WEBSITE_FORM_SOURCE_ID = 'a0000000-0000-0000-0000-000000000001';

let globalPgPool: pg.Pool | null = null;

function getPgPool(): pg.Pool {
  if (!globalPgPool) {
    const connStr = process.env.DATABASE_URL;
    if (!connStr) {
      throw new Error('DATABASE_URL environment variable is missing.');
    }
    globalPgPool = new pg.Pool({
      connectionString: connStr,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return globalPgPool;
}

export async function POST(request: Request | NextRequest) {
  try {
    // 1. Request Body Size Boundary Defense (< 64KB)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payload Too Large. Ingestion payload must not exceed 64KB.',
        },
        { status: 413 }
      );
    }

    // 2. Token-Bucket Rate Limiter Evaluation (10 reqs / 10 mins per IP)
    const clientIp = extractClientIp(request);
    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      const retryAfterSec = rateLimit.retryAfterSeconds;
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Too many inquiries submitted from this network coordinate.',
          retryAfter: retryAfterSec,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
          },
        }
      );
    }

    // 3. Safe JSON Body Deserialization
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON payload. Object expected.',
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
    const bodyRecord = rawBody as Record<string, unknown>;
    const honeypotVal = bodyRecord._hp_company_url_confirm;

    if (typeof honeypotVal === 'string' && honeypotVal.trim().length > 0) {
      console.warn(`[HONEYPOT_INTERCEPTED] Bot submission from IP: ${clientIp}`);
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

    const sanitizedName = sanitizeHtml(input.name) ?? input.name;
    const sanitizedCompany = sanitizeHtml(input.company);
    const sanitizedWebsite = sanitizeHtml(input.company_website);
    const sanitizedIndustry = sanitizeHtml(input.industry);
    const sanitizedBudget = sanitizeHtml(input.budget_bracket);
    const sanitizedNotes = sanitizeHtml(input.notes);

    // 7. Enriched Brief Metadata
    const enrichedBriefPayload = {
      ...input.brief_payload,
      phone_normalization_warning: phoneResult.warning,
      raw_phone: phoneResult.raw,
      client_ip: clientIp,
      ingested_at: new Date().toISOString(),
    };

    // 8. Dual-Engine Persistence & Deduplication State Machine Layer
    const hasServiceRoleKey =
      !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY.trim().length >= 20;

    let responseData: {
      status: number;
      body: {
        success: boolean;
        id: string;
        lead_id: string;
        action: string;
        is_duplicate?: boolean;
        reactivated?: boolean;
        previous_lead_id?: string;
        message: string;
      };
    };

    if (hasServiceRoleKey) {
      // Primary Route: Use privileged Supabase Admin SDK
      const adminClient = getAdminClient();

      // Resolve Lead Source
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

      // Check for Existing Matching Lead (Deduplication Seek)
      let existingLeadRecord: ExistingLeadRecord | null = null;
      if (normalizedEmail || normalizedPhone) {
        let dedupQuery = adminClient
          .from('leads')
          .select(`
            id, lead_id, name, email, phone, priority, status_id,
            inquiry_count, assigned_to, notes, brief_payload,
            created_at, updated_at, converted_at,
            funnel_statuses:status_id (name, bucket)
          `)
          .order('created_at', { ascending: false })
          .limit(1);

        if (normalizedEmail && normalizedPhone) {
          dedupQuery = dedupQuery.or(`email.ilike.${normalizedEmail},phone.eq.${normalizedPhone}`);
        } else if (normalizedEmail) {
          dedupQuery = dedupQuery.ilike('email', normalizedEmail);
        } else if (normalizedPhone) {
          dedupQuery = dedupQuery.eq('phone', normalizedPhone);
        }

        const { data: matchedRows } = await dedupQuery;
        if (matchedRows && matchedRows.length > 0) {
          const row = matchedRows[0] as unknown as {
            id: string;
            lead_id: string;
            name: string;
            email: string | null;
            phone: string | null;
            priority: LeadPriority;
            status_id: string;
            inquiry_count: number;
            assigned_to: string | null;
            notes: string | null;
            brief_payload: Record<string, unknown>;
            created_at: string;
            updated_at: string;
            converted_at?: string | null;
            funnel_statuses?: { name: string; bucket: string } | null;
          };

          existingLeadRecord = {
            id: row.id,
            lead_id: row.lead_id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            priority: row.priority || 'Medium',
            status_id: row.status_id,
            status_name: row.funnel_statuses?.name || 'New',
            status_bucket: (row.funnel_statuses?.bucket as ExistingLeadRecord['status_bucket']) || 'open',
            inquiry_count: row.inquiry_count || 1,
            assigned_to: row.assigned_to,
            notes: row.notes,
            brief_payload: row.brief_payload || {},
            created_at: row.created_at,
            updated_at: row.updated_at,
            converted_at: row.converted_at,
          };
        }
      }

      if (existingLeadRecord) {
        const decision = evaluateLeadDeduplication(existingLeadRecord, {
          name: sanitizedName,
          email: normalizedEmail,
          phone: normalizedPhone,
          company: sanitizedCompany,
          notes: sanitizedNotes,
          service_category: input.service_category,
          expected_value: input.expected_value,
          source_code: input.source_name,
          brief_payload: enrichedBriefPayload,
        });

        if (decision.action === 'MERGE_INQUIRY') {
          // Merge Repeat Inquiry
          const mergedInquiryCount = (existingLeadRecord.inquiry_count || 1) + 1;
          const mergedNotes = sanitizedNotes
            ? `${existingLeadRecord.notes || ''}\n\n[Inquiry #${mergedInquiryCount} - ${new Date().toISOString()}]: ${sanitizedNotes}`.trim()
            : existingLeadRecord.notes;

          await adminClient
            .from('leads')
            .update({
              inquiry_count: mergedInquiryCount,
              priority: decision.newPriority || 'High',
              next_follow_up: new Date().toISOString(),
              notes: mergedNotes,
              brief_payload: {
                ...existingLeadRecord.brief_payload,
                latest_inquiry: enrichedBriefPayload,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLeadRecord.id);

          await adminClient.from('lead_activities').insert({
            lead_id: existingLeadRecord.id,
            actor_id: null,
            activity_type: decision.activityType,
            description: decision.activityDescription,
            metadata: decision.activityMetadata,
          });

          // Dispatch Studio Alert Asynchronously
          dispatchStudioLeadAlert({
            leadId: existingLeadRecord.lead_id,
            action: 'MERGE_INQUIRY',
            name: sanitizedName,
            company: sanitizedCompany,
            email: normalizedEmail,
            phone: normalizedPhone,
            source: input.source_name || 'Website Form',
            serviceCategory: input.service_category,
            expectedValue: input.expected_value,
            priority: 'High',
            isDuplicate: true,
            notes: sanitizedNotes,
          }).catch((err) => console.warn('[ALERT_DISPATCH_BACKGROUND_ERR]', err));

          responseData = {
            status: 200,
            body: {
              success: true,
              id: existingLeadRecord.id,
              lead_id: existingLeadRecord.lead_id,
              action: 'MERGE_INQUIRY',
              is_duplicate: true,
              message: 'Repeat inquiry recorded. Priority elevated to High and follow-up scheduled.',
            },
          };
        } else if (decision.action === 'REACTIVATE_LEAD') {
          // Reactivate Lost Lead
          const mergedInquiryCount = (existingLeadRecord.inquiry_count || 1) + 1;
          await adminClient
            .from('leads')
            .update({
              status_id: DEFAULT_NEW_FUNNEL_STATUS_ID,
              inquiry_count: mergedInquiryCount,
              priority: 'High',
              next_follow_up: new Date().toISOString(),
              lost_reason: null,
              brief_payload: {
                ...existingLeadRecord.brief_payload,
                reactivation_inquiry: enrichedBriefPayload,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLeadRecord.id);

          await adminClient.from('lead_activities').insert({
            lead_id: existingLeadRecord.id,
            actor_id: null,
            activity_type: decision.activityType,
            description: decision.activityDescription,
            metadata: decision.activityMetadata,
          });

          dispatchStudioLeadAlert({
            leadId: existingLeadRecord.lead_id,
            action: 'REACTIVATE_LEAD',
            name: sanitizedName,
            company: sanitizedCompany,
            email: normalizedEmail,
            phone: normalizedPhone,
            source: input.source_name || 'Website Form',
            serviceCategory: input.service_category,
            expectedValue: input.expected_value,
            priority: 'High',
            isDuplicate: true,
            notes: sanitizedNotes,
          }).catch((err) => console.warn('[ALERT_DISPATCH_BACKGROUND_ERR]', err));

          responseData = {
            status: 200,
            body: {
              success: true,
              id: existingLeadRecord.id,
              lead_id: existingLeadRecord.lead_id,
              action: 'REACTIVATE_LEAD',
              is_duplicate: true,
              reactivated: true,
              message: 'Previously lost lead reactivated to New status.',
            },
          };
        } else {
          // CREATE_NEW_REENGAGEMENT
          const { data: newLead, error: insertError } = await adminClient
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
              source_detail: input.source_detail || null,
              status_id: DEFAULT_NEW_FUNNEL_STATUS_ID,
              brief_payload: {
                ...enrichedBriefPayload,
                previous_lead_id: existingLeadRecord.lead_id,
              },
            })
            .select('id, lead_id')
            .single();

          if (insertError || !newLead) {
            throw new Error(`Failed to insert re-engagement lead: ${insertError?.message}`);
          }

          await adminClient.from('lead_activities').insert({
            lead_id: newLead.id,
            actor_id: null,
            activity_type: 'duplicate_inquiry',
            description: decision.activityDescription,
            metadata: decision.activityMetadata,
          });

          dispatchStudioLeadAlert({
            leadId: newLead.lead_id,
            action: 'CREATE_NEW_REENGAGEMENT',
            name: sanitizedName,
            company: sanitizedCompany,
            email: normalizedEmail,
            phone: normalizedPhone,
            source: input.source_name || 'Website Form',
            serviceCategory: input.service_category,
            expectedValue: input.expected_value,
            priority: 'Medium',
            notes: sanitizedNotes,
          }).catch((err) => console.warn('[ALERT_DISPATCH_BACKGROUND_ERR]', err));

          responseData = {
            status: 201,
            body: {
              success: true,
              id: newLead.id,
              lead_id: newLead.lead_id,
              action: 'CREATE_NEW_REENGAGEMENT',
              previous_lead_id: existingLeadRecord.lead_id,
              message: 'New re-engagement opportunity created for returning client.',
            },
          };
        }
      } else {
        // Brand New Lead Insertion
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
            source_detail: input.source_detail || null,
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

        await adminClient.from('lead_activities').insert({
          lead_id: leadRecord.id,
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

        dispatchStudioLeadAlert({
          leadId: leadRecord.lead_id,
          action: 'NEW_LEAD',
          name: sanitizedName,
          company: sanitizedCompany,
          email: normalizedEmail,
          phone: normalizedPhone,
          source: input.source_name || 'Website Form',
          serviceCategory: input.service_category,
          expectedValue: input.expected_value,
          priority: 'Medium',
          notes: sanitizedNotes,
        }).catch((err) => console.warn('[ALERT_DISPATCH_BACKGROUND_ERR]', err));

        responseData = {
          status: 201,
          body: {
            success: true,
            id: leadRecord.id,
            lead_id: leadRecord.lead_id,
            action: 'NEW_LEAD',
            message: 'Lead successfully captured into CRM sales funnel.',
          },
        };
      }
    } else {
      // Resilient Fallback Route: Direct PostgreSQL pool via DATABASE_URL
      const pool = getPgPool();
      const pgClient = await pool.connect();

      try {
        await pgClient.query('BEGIN');

        // Resolve Source ID
        let resolvedSourceId = input.source_id;
        if (!resolvedSourceId && input.source_name) {
          const sourceQuery = await pgClient.query(
            'SELECT id FROM public.lead_sources WHERE name ILIKE $1 AND is_active = true LIMIT 1',
            [input.source_name]
          );
          resolvedSourceId = sourceQuery.rows[0]?.id || DEFAULT_WEBSITE_FORM_SOURCE_ID;
        } else if (!resolvedSourceId) {
          resolvedSourceId = DEFAULT_WEBSITE_FORM_SOURCE_ID;
        }

        // Deduplication Query with Row-Level Exclusive Lock (FOR UPDATE)
        const dedupRes = await pgClient.query(
          `SELECT 
             l.id, l.lead_id, l.name, l.email, l.phone, l.priority, l.inquiry_count,
             l.status_id, l.assigned_to, l.notes, l.brief_payload, l.created_at,
             l.updated_at, l.converted_at,
             fs.name AS status_name, fs.bucket AS status_bucket
           FROM public.leads l
           JOIN public.funnel_statuses fs ON fs.id = l.status_id
           WHERE (l.email IS NOT NULL AND lower(trim(l.email)) = lower(trim($1)))
              OR (l.phone IS NOT NULL AND $2::text IS NOT NULL AND l.phone = $2)
           ORDER BY l.created_at DESC
           LIMIT 1
           FOR UPDATE OF l;`,
          [normalizedEmail || '', normalizedPhone || null]
        );

        if (dedupRes.rows.length > 0) {
          const existingRow = dedupRes.rows[0];
          const existingLeadRecord: ExistingLeadRecord = {
            id: existingRow.id,
            lead_id: existingRow.lead_id,
            name: existingRow.name,
            email: existingRow.email,
            phone: existingRow.phone,
            priority: existingRow.priority || 'Medium',
            status_id: existingRow.status_id,
            status_name: existingRow.status_name,
            status_bucket: existingRow.status_bucket,
            inquiry_count: existingRow.inquiry_count || 1,
            assigned_to: existingRow.assigned_to,
            notes: existingRow.notes,
            brief_payload: existingRow.brief_payload || {},
            created_at: existingRow.created_at,
            updated_at: existingRow.updated_at,
            converted_at: existingRow.converted_at,
          };

          const decision = evaluateLeadDeduplication(existingLeadRecord, {
            name: sanitizedName,
            email: normalizedEmail,
            phone: normalizedPhone,
            company: sanitizedCompany,
            notes: sanitizedNotes,
            service_category: input.service_category,
            expected_value: input.expected_value,
            source_code: input.source_name,
            brief_payload: enrichedBriefPayload,
          });

          if (decision.action === 'MERGE_INQUIRY') {
            const mergedInquiryCount = (existingLeadRecord.inquiry_count || 1) + 1;
            const mergedNotes = sanitizedNotes
              ? `${existingLeadRecord.notes || ''}\n\n[Inquiry #${mergedInquiryCount} - ${new Date().toISOString()}]: ${sanitizedNotes}`.trim()
              : existingLeadRecord.notes;

            await pgClient.query(
              `UPDATE public.leads
               SET inquiry_count = inquiry_count + 1,
                   priority = 'High',
                   next_follow_up = now(),
                   notes = $1,
                   brief_payload = brief_payload || $2::jsonb,
                   updated_at = now()
               WHERE id = $3;`,
              [
                mergedNotes,
                JSON.stringify({ latest_inquiry: enrichedBriefPayload }),
                existingLeadRecord.id,
              ]
            );

            await pgClient.query(
              `INSERT INTO public.lead_activities (
                 lead_id, actor_id, activity_type, description, metadata
               ) VALUES ($1, NULL, $2, $3, $4);`,
              [
                existingLeadRecord.id,
                decision.activityType,
                decision.activityDescription,
                JSON.stringify(decision.activityMetadata),
              ]
            );

            await pgClient.query('COMMIT');

            dispatchStudioLeadAlert({
              leadId: existingLeadRecord.lead_id,
              action: 'MERGE_INQUIRY',
              name: sanitizedName,
              company: sanitizedCompany,
              email: normalizedEmail,
              phone: normalizedPhone,
              source: input.source_name || 'Website Form',
              serviceCategory: input.service_category,
              expectedValue: input.expected_value,
              priority: 'High',
              isDuplicate: true,
              notes: sanitizedNotes,
            }).catch((err) => console.warn('[ALERT_DISPATCH_BACKGROUND_ERR]', err));

            responseData = {
              status: 200,
              body: {
                success: true,
                id: existingLeadRecord.id,
                lead_id: existingLeadRecord.lead_id,
                action: 'MERGE_INQUIRY',
                is_duplicate: true,
                message: 'Repeat inquiry recorded. Priority elevated to High and follow-up scheduled.',
              },
            };
          } else if (decision.action === 'REACTIVATE_LEAD') {
            await pgClient.query(
              `UPDATE public.leads
               SET status_id = $1,
                   inquiry_count = inquiry_count + 1,
                   priority = 'High',
                   next_follow_up = now(),
                   lost_reason = NULL,
                   brief_payload = brief_payload || $2::jsonb,
                   updated_at = now()
               WHERE id = $3;`,
              [
                DEFAULT_NEW_FUNNEL_STATUS_ID,
                JSON.stringify({ reactivation_inquiry: enrichedBriefPayload }),
                existingLeadRecord.id,
              ]
            );

            await pgClient.query(
              `INSERT INTO public.lead_activities (
                 lead_id, actor_id, activity_type, description, metadata
               ) VALUES ($1, NULL, $2, $3, $4);`,
              [
                existingLeadRecord.id,
                decision.activityType,
                decision.activityDescription,
                JSON.stringify(decision.activityMetadata),
              ]
            );

            await pgClient.query('COMMIT');

            dispatchStudioLeadAlert({
              leadId: existingLeadRecord.lead_id,
              action: 'REACTIVATE_LEAD',
              name: sanitizedName,
              company: sanitizedCompany,
              email: normalizedEmail,
              phone: normalizedPhone,
              source: input.source_name || 'Website Form',
              serviceCategory: input.service_category,
              expectedValue: input.expected_value,
              priority: 'High',
              isDuplicate: true,
              notes: sanitizedNotes,
            }).catch((err) => console.warn('[ALERT_DISPATCH_BACKGROUND_ERR]', err));

            responseData = {
              status: 200,
              body: {
                success: true,
                id: existingLeadRecord.id,
                lead_id: existingLeadRecord.lead_id,
                action: 'REACTIVATE_LEAD',
                is_duplicate: true,
                reactivated: true,
                message: 'Previously lost lead reactivated to New status.',
              },
            };
          } else {
            // CREATE_NEW_REENGAGEMENT
            const insertResult = await pgClient.query(
              `INSERT INTO public.leads (
                 name, company, company_website, industry, phone, email,
                 preferred_channel, service_category, budget_bracket, expected_value,
                 notes, lead_source_id, source_detail, status_id, brief_payload
               ) VALUES (
                 $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
               ) RETURNING id, lead_id;`,
              [
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
                input.source_detail || null,
                DEFAULT_NEW_FUNNEL_STATUS_ID,
                JSON.stringify({
                  ...enrichedBriefPayload,
                  previous_lead_id: existingLeadRecord.lead_id,
                }),
              ]
            );

            const newRow = insertResult.rows[0];
            await pgClient.query(
              `INSERT INTO public.lead_activities (
                 lead_id, actor_id, activity_type, description, metadata
               ) VALUES ($1, NULL, 'duplicate_inquiry', $2, $3);`,
              [
                newRow.id,
                decision.activityDescription,
                JSON.stringify(decision.activityMetadata),
              ]
            );

            await pgClient.query('COMMIT');

            dispatchStudioLeadAlert({
              leadId: newRow.lead_id,
              action: 'CREATE_NEW_REENGAGEMENT',
              name: sanitizedName,
              company: sanitizedCompany,
              email: normalizedEmail,
              phone: normalizedPhone,
              source: input.source_name || 'Website Form',
              serviceCategory: input.service_category,
              expectedValue: input.expected_value,
              priority: 'Medium',
              notes: sanitizedNotes,
            }).catch((err) => console.warn('[ALERT_DISPATCH_BACKGROUND_ERR]', err));

            responseData = {
              status: 201,
              body: {
                success: true,
                id: newRow.id,
                lead_id: newRow.lead_id,
                action: 'CREATE_NEW_REENGAGEMENT',
                previous_lead_id: existingLeadRecord.lead_id,
                message: 'New re-engagement opportunity created for returning client.',
              },
            };
          }
        } else {
          // New Lead Insertion in Transaction
          const insertQuery = `
            INSERT INTO public.leads (
              name, company, company_website, industry, phone, email,
              preferred_channel, service_category, budget_bracket, expected_value,
              notes, lead_source_id, source_detail, status_id, brief_payload
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
            )
            RETURNING id, lead_id;
          `;

          const insertResult = await pgClient.query(insertQuery, [
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
            input.source_detail || null,
            DEFAULT_NEW_FUNNEL_STATUS_ID,
            JSON.stringify(enrichedBriefPayload),
          ]);

          const row = insertResult.rows[0];
          if (!row) {
            throw new Error('PostgreSQL insertion returned 0 rows.');
          }

          await pgClient.query(
            `INSERT INTO public.lead_activities (
              lead_id, actor_id, activity_type, description, metadata
            ) VALUES ($1, NULL, 'system_event', $2, $3);`,
            [
              row.id,
              `Inbound lead inquiry ingested via public API from ${input.source_name || 'Website Form'}`,
              JSON.stringify({
                source_name: input.source_name || 'Website Form',
                client_ip: clientIp,
                phone_warning: phoneResult.warning,
                service_category: input.service_category,
              }),
            ]
          );

          await pgClient.query('COMMIT');

          dispatchStudioLeadAlert({
            leadId: row.lead_id,
            action: 'NEW_LEAD',
            name: sanitizedName,
            company: sanitizedCompany,
            email: normalizedEmail,
            phone: normalizedPhone,
            source: input.source_name || 'Website Form',
            serviceCategory: input.service_category,
            expectedValue: input.expected_value,
            priority: 'Medium',
            notes: sanitizedNotes,
          }).catch((err) => console.warn('[ALERT_DISPATCH_BACKGROUND_ERR]', err));

          responseData = {
            status: 201,
            body: {
              success: true,
              id: row.id,
              lead_id: row.lead_id,
              action: 'NEW_LEAD',
              message: 'Lead successfully captured into CRM sales funnel.',
            },
          };
        }
      } catch (pgError) {
        await pgClient.query('ROLLBACK');
        throw pgError;
      } finally {
        pgClient.release();
      }
    }

    // 9. Return Response with Rate Limit Transparency Headers
    return NextResponse.json(responseData.body, {
      status: responseData.status,
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
      },
    });
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
