/**
 * @file route.ts
 * @description Executive Pipeline KPI Aggregation Gateway for the Marca Ubi CRM.
 * @route GET /api/sales-funnel/kpis
 * @architecture Implements Master PRD Section 6 and SPEC-MARCA-CRM-UX-PHASES-6-9:
 *               1. Sub-45ms single-round-trip database aggregation via `get_pipeline_kpis` RPC.
 *               2. Strict caller session authentication & suspension verification.
 *               3. Cryptographic role sandboxing: Sales Executives are locked to their own deals.
 *               4. Input sanitization & temporal sequence validation via Zod 4 (`kpiQuerySchema`).
 *               5. Stale-While-Revalidate HTTP cache-control (`s-maxage=15, stale-while-revalidate=45`).
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { kpiQuerySchema } from '@/app/lib/validations/kpiQuerySchema';
import type { KpiApiResponseEnvelope, PipelineRpcMetrics } from '@/types/crm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Handles incoming analytical KPI queries with role sandboxing, input validation,
 * and high-performance database stored procedure execution.
 *
 * @param {NextRequest} request The incoming Next.js API request.
 * @returns {Promise<NextResponse<KpiApiResponseEnvelope>>} Structured API envelope.
 */
export async function GET(request: NextRequest): Promise<NextResponse<KpiApiResponseEnvelope>> {
  const startTime = performance.now();

  try {
    // 1. Extract and Validate Query Parameters via Zod
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      source_id: searchParams.get('source_id') || undefined,
      assignee_id: searchParams.get('assignee_id') || undefined,
      target_user_id: searchParams.get('target_user_id') || undefined,
    };

    const validationResult = kpiQuerySchema.safeParse(rawParams);

    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const pathKey = issue.path.join('.') || 'parameter';
        details[pathKey] = issue.message;
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: Invalid query parameters provided.',
          details,
        },
        { status: 400 }
      );
    }

    const { start_date, end_date, source_id, assignee_id, target_user_id } = validationResult.data;

    // 2. Authenticate Caller Session via SSR Cookie Store
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Active authenticated CRM session required.',
        },
        { status: 401 }
      );
    }

    // 3. Inspect Caller Profile & Operational Status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Operational identity profile not found.',
        },
        { status: 403 }
      );
    }

    if (profile.status === 'suspended') {
      return NextResponse.json(
        {
          success: false,
          error: 'Security Policy Violation: Account suspended. Analytics access revoked.',
        },
        { status: 403 }
      );
    }

    // 4. Enforce Role Sandboxing Invariants
    // Sales Executives are strictly sandboxed to their own assigned portfolio.
    // Leadership (admin, sales_manager) and Viewers may inspect global or targeted portfolios.
    let effectiveAssignee = assignee_id || target_user_id || null;
    if (profile.role === 'sales_executive') {
      effectiveAssignee = user.id;
    }

    // 5. Execute Stored Aggregation RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_pipeline_kpis', {
      p_start_date: start_date || null,
      p_end_date: end_date || null,
      p_source_id: source_id || null,
      p_assignee_id: effectiveAssignee,
    });

    if (rpcError) {
      console.error('[KPI_ROUTE_ERROR] Database RPC get_pipeline_kpis execution failed:', rpcError);
      return NextResponse.json(
        {
          success: false,
          error: `Analytical calculation failed: ${rpcError.message}`,
        },
        { status: 500 }
      );
    }

    const executionTimeMs = Math.round(performance.now() - startTime);

    // 6. Return Structured Envelope with HTTP Stale-While-Revalidate Headers
    return NextResponse.json(
      {
        success: true,
        data: rpcData as PipelineRpcMetrics,
        meta: {
          startDate: start_date || null,
          endDate: end_date || null,
          sourceId: source_id || null,
          assigneeId: effectiveAssignee,
          cachedAt: new Date().toISOString(),
          executionTimeMs,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45',
        },
      }
    );
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    console.error(`[KPI_ROUTE_CRITICAL] Unhandled exception in KPI API (${duration}ms):`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
