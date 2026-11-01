import { Suspense } from "react";
import type { Metadata } from "next";
import ClientHeader from "@/app/components/ClientHeader/ClientHeader";
import MonumentalFooter from "@/app/components/Sections/MonumentalFooter";
import { client } from "@/sanity/lib/client";
import { categoriesQuery, postsQuery } from "@/sanity/lib/blog-queries";
import type { Category, PostSummary } from "@/sanity/types/blog";
import BlogListingClient from "./BlogListingClient";
import styles from "./Blog.module.scss";

export const revalidate = 60; // ISR cache revalidation every 60s

export const metadata: Metadata = {
  title: "Insights & Dispatches | Marca Ubi",
  description:
    "Essays, architectural observations, brand strategy, design systems, and digital engineering from the Marca Ubi studio floor.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    type: "website",
    title: "Insights & Dispatches | Marca Ubi",
    description:
      "Essays, architectural observations, brand strategy, design systems, and digital engineering from the Marca Ubi studio floor.",
    url: "/blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "Insights & Dispatches | Marca Ubi",
    description:
      "Essays, architectural observations, brand strategy, design systems, and digital engineering from the Marca Ubi studio floor.",
  },
};

/**
 * Editorial Blog Listing Server Page (/blog).
 * Concurrently fetches dispatch summaries and the category taxonomy (with
 * live post counts) from Sanity, then renders the light magazine contents
 * shell that mirrors /services/[slug]: ClientHeader locked to its light theme
 * and the MonumentalFooter beneath. The category postCount and the total
 * dispatch count also drive the masthead issue ledger, so both queries are
 * load-bearing for the nameplate, not only for the filter strip.
 *
 * BlogListingClient reads useSearchParams for URL-synced category filtering,
 * so the App Router requires a Suspense boundary around it; fallback is null
 * because the server shell already paints the full-page canvas during
 * streaming and a skeleton would fight with the masthead type.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default async function BlogPage() {
  let posts: PostSummary[] = [];
  let categories: Category[] = [];

  try {
    const [fetchedPosts, fetchedCategories] = await Promise.all([
      client.fetch<PostSummary[]>(postsQuery),
      client.fetch<Category[]>(categoriesQuery),
    ]);
    posts = fetchedPosts || [];
    categories = fetchedCategories || [];
  } catch (error) {
    console.error("Error fetching blog dispatches from Sanity:", error);
    posts = [];
    categories = [];
  }

  return (
    <div data-client-shell="true" className={styles.pageShell}>
      <ClientHeader defaultTheme="light" />
      <main id="main-content" className={styles.pageMain} data-header-theme="light">
        <Suspense fallback={null}>
          <BlogListingClient posts={posts} categories={categories} />
        </Suspense>
      </main>
      <MonumentalFooter />
    </div>
  );
}
