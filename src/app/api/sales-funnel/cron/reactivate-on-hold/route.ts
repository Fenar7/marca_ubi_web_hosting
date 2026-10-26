/**
 * @file route.ts
 * @description Automated Scheduled Maintenance Gateway: Reactivates Expired On Hold Deals.
 * @route POST /api/sales-funnel/cron/reactivate-on-hold
 * @architecture Implements Master PRD Section 14.2 & Section 15.19:
 *               1. Executes nightly at 00:00:00 UTC via scheduled edge worker or Vercel Cron.
 *               2. Enforces cryptographic bearer authorization via CRON_SECRET header guard.
 *               3. Invokes stored procedure `public.reactivate_expired_on_hold_leads()` atomically.
 *               4. Transitions expired On Hold deals back to Contacted stage and writes system_event activities.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/app/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Validates the authorization header against the secret key.
 * Requires cryptographic Bearer CRON_SECRET token match.
 */
function isCronAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.trim().length === 0) {
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = performance.now();

  if (!isCronAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Invalid or missing CRON_SECRET bearer authorization.',
      },
      { status: 401 }
    );
  }

  try {
    const supabaseAdmin = getAdminClient();

    const { data: reactivatedCount, error: rpcError } = await supabaseAdmin.rpc(
      'reactivate_expired_on_hold_leads'
    );

    if (rpcError) {
      return NextResponse.json(
        {
          success: false,
          error: `Database procedure execution failed: ${rpcError.message}`,
        },
        { status: 500 }
      );
    }

    const durationMs = Math.round(performance.now() - startTime);

    return NextResponse.json(
      {
        success: true,
        reactivatedCount: reactivatedCount ?? 0,
        executedAt: new Date().toISOString(),
        durationMs,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown exception occurred.';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return POST(request);
}
