import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

// In-memory rate limiter: maximum 10 requests per 10 minutes per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Legacy Project Brief Submission Proxy.
 * Enforces rate limiting, honeypot bot trap defense, and zero `any` types.
 */
export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: "Too many submission attempts. Please wait 10 minutes." },
        { status: 429, headers: { "Retry-After": "600" } }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    // Cryptographic Honeypot Trap
    if (body._hp_company_url_confirm && typeof body._hp_company_url_confirm === "string" && body._hp_company_url_confirm.trim().length > 0) {
      console.warn(`[INGEST BOT TRAP] Legacy brief submission trapped from IP: ${clientIp}`);
      return NextResponse.json({ success: true, id: "synthetic-trap" }, { status: 200 });
    }

    const writeClient = client.withConfig({
      token: process.env.SANITY_API_EDIT_TOKEN,
    });

    const newBrief = {
      _type: "projectBrief",
      ...body,
      submittedAt: new Date().toISOString(),
    };

    const response = await writeClient.create(newBrief);

    return NextResponse.json(
      { success: true, id: response._id },
      { headers: { "X-Deprecated-Endpoint": "Use /api/sales-funnel/ingest" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit project brief.";
    console.error("Error submitting project brief:", message);
    return NextResponse.json(
      { error: "Failed to submit project brief." },
      { status: 500 }
    );
  }
}
