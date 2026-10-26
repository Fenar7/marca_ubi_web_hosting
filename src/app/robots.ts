import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");

/**
 * Search Engine Crawler Governance.
 * Strictly shields administrative CRM interfaces and internal endpoints from indexing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api",
          "/api/",
          "/studio",
          "/studio/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
