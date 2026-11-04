/**
 * @file src/app/api/indexnow/route.ts
 * @description Real-time IndexNow Submission Gateway for Microsoft Bing, Copilot,
 *              and Perplexity AI. Validates incoming URL submission batches, ensures
 *              host domain integrity, and triggers immediate crawl requests via
 *              the standardized IndexNow API.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const INDEXNOW_KEY = "e4a7c8b9d1024f5a8923bcde14567890";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");
const hostDomain = new URL(siteUrl).host;

/**
 * Zod schema supporting single or multiple URL submissions.
 * Accepts { url: string } or { urls: string[] } or { urlList: string[] }.
 */
const IndexNowRequestSchema = z
  .object({
    url: z.string().url().optional(),
    urls: z.array(z.string().url()).optional(),
    urlList: z.array(z.string().url()).optional(),
    key: z.string().optional(),
  })
  .refine(
    (data) => Boolean(data.url || (data.urls && data.urls.length > 0) || (data.urlList && data.urlList.length > 0)),
    { message: "At least one valid URL must be provided in 'url', 'urls', or 'urlList'." }
  );

interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

export async function POST(req: NextRequest) {
  // Enforce optional bearer token authentication if configured in environment
  const expectedSecret = process.env.INDEXNOW_SECRET;
  if (expectedSecret) {
    const authHeader = req.headers.get("authorization") || "";
    const customHeader = req.headers.get("x-indexnow-secret") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    if (bearerToken !== expectedSecret && customHeader !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing IndexNow secret token." },
        { status: 401 }
      );
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload in request body." },
      { status: 400 }
    );
  }

  const parseResult = IndexNowRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Validation error",
        issues: parseResult.error.format(),
      },
      { status: 422 }
    );
  }

  const { url, urls, urlList, key } = parseResult.data;

  // Aggregate and de-duplicate target URLs
  const candidateUrls = [
    ...(url ? [url] : []),
    ...(urls || []),
    ...(urlList || []),
  ];

  const uniqueUrls = Array.from(new Set(candidateUrls));

  // Domain boundary check: verify that submitted URLs belong to our registered host
  const invalidDomainUrls = uniqueUrls.filter((targetUrl) => {
    try {
      const parsedUrl = new URL(targetUrl);
      return parsedUrl.host !== hostDomain;
    } catch {
      return true;
    }
  });

  if (invalidDomainUrls.length > 0) {
    return NextResponse.json(
      {
        error: `Submitted URLs must match host domain '${hostDomain}'.`,
        invalidUrls: invalidDomainUrls,
      },
      { status: 400 }
    );
  }

  const payload: IndexNowPayload = {
    host: hostDomain,
    key: key || INDEXNOW_KEY,
    keyLocation: `${siteUrl}/${key || INDEXNOW_KEY}.txt`,
    urlList: uniqueUrls,
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    // IndexNow responds with HTTP 200, 202, or 204 on valid submission
    const isSuccess = response.status >= 200 && response.status < 300;
    const responseText = await response.text();

    return NextResponse.json(
      {
        success: isSuccess,
        status: response.status,
        submittedUrls: uniqueUrls,
        host: hostDomain,
        keyLocation: payload.keyLocation,
        engineResponse: responseText || "Submission accepted by IndexNow protocol.",
      },
      { status: isSuccess ? 200 : response.status }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown network error";
    console.error("[IndexNow Submission Failed]:", errorMessage);

    return NextResponse.json(
      {
        error: "Failed to dispatch submission to IndexNow upstream gateway.",
        details: errorMessage,
      },
      { status: 502 }
    );
  }
}
