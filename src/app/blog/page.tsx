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
 * Editorial Blog Listing Server Page.
 * Concurrently streams dispatches and category taxonomy from Sanity CMS,
 * wrapping the broadsheet reader in the 160over90 design shell.
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
    <div data-client-shell="true" className={styles.blogPageContainer}>
      <ClientHeader defaultTheme="dark" />
      <main id="main-content" className={styles.blogPageMain} data-header-theme="dark">
        <BlogListingClient posts={posts} categories={categories} />
      </main>
      <MonumentalFooter />
    </div>
  );
}
