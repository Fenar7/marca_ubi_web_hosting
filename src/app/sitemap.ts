import type { MetadataRoute } from "next";
import { client } from "@/sanity/lib/client";
import { sitemapPostsQuery } from "@/sanity/lib/blog-queries";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Core Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/start-project`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Dynamic Blog Post Routes from Sanity
  try {
    const posts = await client.fetch<Array<{ slug: string; _updatedAt?: string; publishedAt: string }>>(
      sitemapPostsQuery
    );

    const postRoutes: MetadataRoute.Sitemap = (posts || []).map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post._updatedAt || post.publishedAt || new Date()),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...postRoutes];
  } catch (error) {
    console.error("Failed to generate dynamic blog routes for sitemap:", error);
    return staticRoutes;
  }
}
