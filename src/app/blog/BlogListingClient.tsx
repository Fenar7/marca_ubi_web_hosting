"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Category, PostSummary } from "@/sanity/types/blog";
import { urlFor } from "@/sanity/lib/image";
import styles from "./Blog.module.scss";

interface BlogListingClientProps {
  posts: PostSummary[];
  categories: Category[];
}

function formatDate(isoString: string): string {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "";
  }
}

/**
 * Client-Side Interactive Broadsheet Blog Listing.
 * Pure Swiss editorial design with category slash navigation and 60/40 featured showcase.
 * Zero AI-slop pills, zero capsule badges, 100% Circular XX typography.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function BlogListingClient({ posts, categories }: BlogListingClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "all") return posts;
    return posts.filter((post) => post.category?.slug === selectedCategory);
  }, [posts, selectedCategory]);

  const featuredPost = useMemo(() => {
    if (selectedCategory !== "all") return null;
    return filteredPosts.find((p) => p.featured) || filteredPosts[0] || null;
  }, [filteredPosts, selectedCategory]);

  const gridPosts = useMemo(() => {
    if (featuredPost && selectedCategory === "all") {
      return filteredPosts.filter((p) => p._id !== featuredPost._id);
    }
    return filteredPosts;
  }, [filteredPosts, featuredPost, selectedCategory]);

  return (
    <div className={styles.blogWrapper}>
      {/* 1. Monumental Hero Stage */}
      <header className={styles.heroHeader}>
        <span className={styles.kicker}>01 / Studio Dispatches &amp; Architectural Papers</span>
        <h1 className={styles.displayTitle}>Thinking in Systems.</h1>
        <p className={styles.heroLead}>
          Essays, strategic field notes, and technical insights on brand architecture, digital craft, and high-velocity systems from the Marca Ubi studio floor.
        </p>
      </header>

      {/* 2. Typographic Category Navigation Rail (Zero Pills) */}
      <nav className={styles.categoryRail} aria-label="Filter essays by category">
        <button
          type="button"
          aria-pressed={selectedCategory === "all"}
          className={`${styles.categoryTab} ${selectedCategory === "all" ? styles.categoryTabActive : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          <span>All Dispatches</span>
          <span className={styles.countNumeral}>({posts.length})</span>
        </button>

        {categories.map((category) => {
          const count = posts.filter((p) => p.category?.slug === category.slug).length;
          if (count === 0 && selectedCategory !== category.slug) return null;

          return (
            <React.Fragment key={category._id}>
              <span className={styles.railSlash} aria-hidden="true">/</span>
              <button
                type="button"
                aria-pressed={selectedCategory === category.slug}
                className={`${styles.categoryTab} ${selectedCategory === category.slug ? styles.categoryTabActive : ""}`}
                onClick={() => setSelectedCategory(category.slug)}
              >
                <span>{category.title}</span>
                <span className={styles.countNumeral}>({count})</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* 3. Featured Flagship Article (60/40 Broadsheet Card) */}
      {featuredPost && (
        <section className={styles.featuredSection} aria-label="Featured Dispatch">
          <article className={styles.featuredCard}>
            {/* 60% Left Cover Image */}
            <div className={styles.featuredImageFrame}>
              <Link href={`/blog/${featuredPost.slug}`} tabIndex={-1} aria-hidden="true">
                <Image
                  src={
                    featuredPost.mainImage?.asset?.url
                      ? urlFor(featuredPost.mainImage).width(1400).height(800).quality(90).url()
                      : "/images/what-we-stand-for.png"
                  }
                  alt={featuredPost.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className={styles.featuredImage}
                  priority
                />
              </Link>
            </div>

            {/* 40% Right Editorial Dossier */}
            <div className={styles.featuredDossier}>
              <div className={styles.featuredMetaRow}>
                <span className={styles.featuredKicker}>Featured Dispatch</span>
                {featuredPost.category && (
                  <span className={styles.featuredCategory}>
                    / {featuredPost.category.title}
                  </span>
                )}
              </div>

              <h2 className={styles.featuredTitle}>
                <Link href={`/blog/${featuredPost.slug}`} className={styles.titleLink}>
                  {featuredPost.title}
                </Link>
              </h2>

              <p className={styles.featuredExcerpt}>{featuredPost.excerpt}</p>

              <div className={styles.featuredFooter}>
                <div className={styles.authorCluster}>
                  {featuredPost.author?.name && (
                    <span className={styles.authorName}>{featuredPost.author.name}</span>
                  )}
                  <span className={styles.metaSlash}>/</span>
                  <span className={styles.readingTime}>
                    {featuredPost.estimatedReadingTime || 5} Min Read
                  </span>
                </div>

                <Link href={`/blog/${featuredPost.slug}`} className={styles.readAction}>
                  <span>Read Full Dispatch</span>
                  <span className={styles.arrow} aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* 4. 3-Column Broadsheet Dispatches Grid */}
      <section className={styles.dispatchesGridSection} aria-label="All Dispatches">
        {gridPosts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No dispatches found in this category.</p>
          </div>
        ) : (
          <div className={styles.dispatchesGrid}>
            {gridPosts.map((post) => {
              const imageUrl = post.mainImage?.asset?.url
                ? urlFor(post.mainImage).width(800).height(450).quality(85).url()
                : "/images/what-we-stand-for.png";

              return (
                <article key={post._id} className={styles.gridCard}>
                  <Link href={`/blog/${post.slug}`} className={styles.cardImageLink} tabIndex={-1} aria-hidden="true">
                    <div className={styles.cardImageFrame}>
                      <Image
                        src={imageUrl}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={styles.cardImage}
                      />
                    </div>
                  </Link>

                  <div className={styles.cardMetaRow}>
                    {post.category && (
                      <span className={styles.cardCategory}>{post.category.title}</span>
                    )}
                    <span className={styles.cardMetaDivider}>/</span>
                    <span className={styles.cardReadingTime}>
                      {post.estimatedReadingTime || 4} MIN READ
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>
                    <Link href={`/blog/${post.slug}`} className={styles.titleLink}>
                      {post.title}
                    </Link>
                  </h3>

                  <p className={styles.cardExcerpt}>{post.excerpt}</p>

                  <div className={styles.cardFooter}>
                    <time dateTime={post.publishedAt} className={styles.cardDate}>
                      {formatDate(post.publishedAt)}
                    </time>
                    <Link href={`/blog/${post.slug}`} className={styles.cardReadLink}>
                      <span>Read</span>
                      <span className={styles.arrow} aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
