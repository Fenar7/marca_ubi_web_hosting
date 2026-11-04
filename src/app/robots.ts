/**
 * @file src/app/robots.ts
 * @description Enterprise Search & AI Crawler Governance for Marca Ubi.
 *              Authorizes LLM Search & Grounding agents (OAI-SearchBot, PerplexityBot,
 *              ClaudeBot, Applebot) to index public services, dispatches, and machine-readable
 *              llms.txt manifests while strictly shielding administrative CRM interfaces,
 *              Next.js internals, and Sanity studio surfaces from exposure.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Standard search engine crawlers (Googlebot, Bingbot, etc.)
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/*",
          "/api/*",
          "/studio/*",
          "/_next/*",
          "/preview/*",
        ],
      },
      // Explicit Generative Search & Retrieval Grounding Agents (SearchGPT, Perplexity, Claude, Applebot)
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Applebot",
        ],
        allow: [
          "/",
          "/llms.txt",
          "/llms-full.txt",
          "/services/*",
          "/blog/*",
          "/works",
          "/start-project",
        ],
        disallow: [
          "/admin/*",
          "/api/*",
          "/studio/*",
          "/_next/*",
          "/preview/*",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
