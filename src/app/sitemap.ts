/**
 * @file src/app/sitemap.ts
 * @description Master XML Sitemap for Marca Ubi Enterprise Digital Platform.
 *              Calibrates crawl frequencies and search priorities across all
 *              static institutional hubs, the 16 dedicated capability detail routes,
 *              legal and compliance vectors, and dynamic Sanity editorial dispatches.
 *              Eliminates false-freshness anti-patterns by pinning static releases
 *              to stable deployment dates.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { MetadataRoute } from "next";
import { client } from "@/sanity/lib/client";
import { sitemapPostsQuery } from "@/sanity/lib/blog-queries";
import { getAllServiceSlugs } from "./services/content";

export const revalidate = 3600; // 1-hour Edge ISR cache revalidation

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");

/**
 * Stable static release timestamp.
 * Avoids the 'new Date()' false-freshness anti-pattern which degrades crawl
 * budget and search trust scores when bots re-fetch unchanged pages.
 */
const STATIC_RELEASE_DATE = new Date("2026-11-04T00:00:00.000Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Core Static & Commercial Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: STATIC_RELEASE_DATE,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/works`,
      lastModified: STATIC_RELEASE_DATE,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // Dedicated capability pages for all 16 Services (priority 0.9)
    ...getAllServiceSlugs().map((slug) => ({
      url: `${siteUrl}/services/${slug}`,
      lastModified: STATIC_RELEASE_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    {
      url: `${siteUrl}/blog`,
      lastModified: STATIC_RELEASE_DATE,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/start-project`,
      lastModified: STATIC_RELEASE_DATE,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/careers`,
      lastModified: STATIC_RELEASE_DATE,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: STATIC_RELEASE_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: STATIC_RELEASE_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/security`,
      lastModified: STATIC_RELEASE_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic Editorial Dispatches from Sanity CMS
  try {
    const posts = await client.fetch<Array<{ slug: string; _updatedAt?: string; publishedAt?: string }>>(
      sitemapPostsQuery
    );

    const postRoutes: MetadataRoute.Sitemap = (posts || []).map((post) => {
      const rawDate = post._updatedAt || post.publishedAt;
      const lastModified = rawDate ? new Date(rawDate) : STATIC_RELEASE_DATE;
      return {
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: isNaN(lastModified.getTime()) ? STATIC_RELEASE_DATE : lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      };
    });

    return [...staticRoutes, ...postRoutes];
  } catch (error) {
    console.error("[Sitemap Error] Sanity fetch failed, falling back to static routes:", error);
    return staticRoutes;
  }
}
