/**
 * @file src/app/e4a7c8b9d1024f5a8923bcde14567890.txt/route.ts
 * @description IndexNow ownership verification key route for Microsoft Bing,
 *              Perplexity AI, and Yandex. Returns the raw 32-character hexadecimal
 *              token with text/plain content-type and edge caching headers.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { NextResponse } from "next/server";

export const dynamic = "force-static";

const INDEXNOW_KEY = "e4a7c8b9d1024f5a8923bcde14567890";

export function GET() {
  return new NextResponse(INDEXNOW_KEY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
    },
  });
}
