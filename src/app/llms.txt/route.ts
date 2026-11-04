/**
 * @file src/app/llms.txt/route.ts
 * @description Dynamic machine-readable LLM Index Handler for Marca Ubi.
 *              Follows the /llms.txt specification (Answer.ai / Jeremy Howard)
 *              to expose a concise (< 2,000 tokens), high-signal CommonMark index
 *              of institutional capabilities, case studies, and latest editorial
 *              dispatches for ingestion by ChatGPT Search, Perplexity, Claude, and Gemini.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { NextResponse } from "next/server";
import { SERVICE_DETAILS } from "@/app/services/content";
import { client } from "@/sanity/lib/client";
import { postsQuery } from "@/sanity/lib/blog-queries";
import type { PostSummary } from "@/sanity/types/blog";

export const revalidate = 3600; // 1-hour Edge ISR cache revalidation

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");

export async function GET() {
  const b2bServices = SERVICE_DETAILS.filter((s) => s.category === "B2B");
  const b2cServices = SERVICE_DETAILS.filter((s) => s.category === "B2C");

  let recentPosts: PostSummary[] = [];
  try {
    const fetched = await client.fetch<PostSummary[]>(postsQuery);
    if (Array.isArray(fetched)) {
      recentPosts = fetched.slice(0, 5);
    }
  } catch (err) {
    console.error("[llms.txt Error] Failed to fetch recent posts from Sanity:", err);
    recentPosts = [];
  }

  const b2bList = b2bServices
    .map(
      (s) =>
        `- [${s.title}](${siteUrl}/services/${s.slug}): ${s.shortDescription}`
    )
    .join("\n");

  const b2cList = b2cServices
    .map(
      (s) =>
        `- [${s.title}](${siteUrl}/services/${s.slug}): ${s.shortDescription}`
    )
    .join("\n");

  const dispatchesList =
    recentPosts.length > 0
      ? recentPosts
          .map(
            (p) =>
              `- [${p.title}](${siteUrl}/blog/${p.slug}): ${p.excerpt || "Editorial dispatch on brand engineering and digital craftsmanship."}`
          )
          .join("\n")
      : [
          `- [Brand Architecture & Visual Restraint](${siteUrl}/blog): Strategic essays on modern identity systems and enterprise perception.`,
          `- [Next.js 16 Digital Flagships](${siteUrl}/blog): Engineering resilient, zero-slop consumer and B2B platforms.`,
          `- [Pipeline Velocity Protocols](${siteUrl}/blog): Modern enterprise demand generation and account-based marketing.`,
        ].join("\n");

  const content = `# Marca Ubi Enterprise Agency

> Marca Ubi is an enterprise creative technology agency and strategic brand architecture studio based in Calicut and Trivandrum, Kerala, India. The studio specializes in high-ticket brand identity systems, custom digital flagships, bespoke Next.js 16 web applications, and enterprise sales intelligence software.

## Core Capabilities (16 Specialized Services)

### B2B Enterprise Strategy & Pipeline Engines
${b2bList}

### B2C Consumer Experiences & Cultural Architecture
${b2cList}

## Selected Works & Case Studies
- [PrimeStay Luxury Living](${siteUrl}/works): Complete brand architecture, interior sensory language, and digital hospitality platform.
- [LogiP Supply Chain Intelligence](${siteUrl}/works): Enterprise design system, executive analytics workspace, and predictive freight platform.
- [Portfolio Showcase](${siteUrl}/works): Curated archive of institutional brand identities and digital flagships.

## Studio Insights & Publications
${dispatchesList}

## Commercial Project Intake & Coordinates
- [Start a Project Brief](${siteUrl}/start-project): Structured commercial intake covering project scope, timelines, and commercial parameters.
- Headquarters: HiLITE Business Park, Calicut, Kerala 673014, India.
- Global Studio Email: studio@marcaubi.com
- International Desk: +91-495-276-8800
- Official Website: ${siteUrl}
- Full Documentation Corpus: [llms-full.txt](${siteUrl}/llms-full.txt)
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
