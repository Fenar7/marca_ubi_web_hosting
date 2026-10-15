import type { Metadata } from "next";
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { client } from "@/sanity/lib/client";
import { categoriesQuery, postsQuery } from "@/sanity/lib/blog-queries";
import type { Category, PostSummary } from "@/sanity/types/blog";
import BlogListingClient from "./BlogListingClient";
import styles from "./Blog.module.scss";

export const revalidate = 60; // ISR cache revalidation every 60s

export const metadata: Metadata = {
  title: "Insights & Dispatches — Marca Ubi",
  description:
    "Essays, architectural observations, brand strategy, design systems, and digital engineering from the Marca Ubi studio floor.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    type: "website",
    title: "Insights & Dispatches — Marca Ubi",
    description:
      "Essays, architectural observations, brand strategy, design systems, and digital engineering from the Marca Ubi studio floor.",
    url: "/blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "Insights & Dispatches — Marca Ubi",
    description:
      "Essays, architectural observations, brand strategy, design systems, and digital engineering from the Marca Ubi studio floor.",
  },
};

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
    // Graceful fallback to empty array
    posts = [];
    categories = [];
  }

  return (
    <main className={styles.blogPageMain}>
      <Header />
      <BlogListingClient posts={posts} categories={categories} />
      <Footer />
    </main>
  );
}
