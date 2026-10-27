"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { PostSummary } from "@/sanity/types/blog";
import { urlFor } from "@/sanity/lib/image";
import styles from "./DispatchesCurtain.module.scss";

interface DispatchesCurtainProps {
  posts?: PostSummary[];
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
 * View 08: Studio Dispatches & Insights Curtain.
 * Solid pure white curtain (#ffffff) sliding over the living background video.
 * Enforces the 160over90 Swiss 30/70 editorial broadsheet layout.
 * Displays the latest 3 essays from Sanity CMS with direct links to /blog and /blog/[slug].
 */
export function DispatchesCurtain({ posts = [] }: DispatchesCurtainProps) {
  // Use latest 3 posts, or safe architectural fallbacks if Sanity has no records
  const displayPosts = posts.length > 0 ? posts.slice(0, 3) : [
    {
      _id: "fb-dispatch-1",
      title: "Systems Over Style: Why Brand Identity Fails Without Structural Logic",
      slug: "systems-over-style",
      publishedAt: new Date().toISOString(),
      excerpt: "Why contemporary brand identity must operate as complete living software rather than static guideline books.",
      estimatedReadingTime: 5,
      category: { _id: "c1", title: "Brand Architecture", slug: "brand-architecture" },
    },
    {
      _id: "fb-dispatch-2",
      title: "The Architecture of Distinction in High-Ticket Digital Platforms",
      slug: "architecture-of-distinction",
      publishedAt: new Date().toISOString(),
      excerpt: "How deliberate technical precision and tactile interaction geometry establish enduring authority.",
      estimatedReadingTime: 7,
      category: { _id: "c2", title: "Digital Craft", slug: "digital-craft" },
    },
    {
      _id: "fb-dispatch-3",
      title: "Tactile Typography and the Cultural Velocity of Luxury Brands",
      slug: "tactile-typography",
      publishedAt: new Date().toISOString(),
      excerpt: "Exploring the emotional friction of bespoke type systems in high-velocity commerce ecosystems.",
      estimatedReadingTime: 4,
      category: { _id: "c3", title: "Cultural Velocity", slug: "cultural-velocity" },
    },
  ];

  return (
    <section
      className={styles.dispatchesSection}
      id="dispatches"
      aria-label="Studio Dispatches and Field Notes"
      data-header-theme="light"
    >
      <div className={styles.gridContainer}>
        {/* Left Sticky Rail (30%) */}
        <aside className={styles.leftColumn}>
          <div className={styles.stickyRail}>
            <h2 className={styles.railHeadline}>
              Thinking in Systems.
            </h2>
            <p className={styles.railSummary}>
              Essays, architectural field notes, brand strategy, and digital engineering from the Marca Ubi studio floor.
            </p>
            <div className={styles.actionWrap}>
              <Link href="/blog" className={styles.architecturalButton}>
                <span>View All Dispatches</span>
                <span className={styles.arrow} aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Right 3-Column Broadsheet Grid (70%) */}
        <div className={styles.rightColumn}>
          <div className={styles.postsGrid}>
            {displayPosts.map((post) => {
              const imageUrl = post.mainImage?.asset?.url
                ? urlFor(post.mainImage).width(800).height(450).quality(85).url()
                : "/images/what-we-stand-for.png";

              return (
                <article key={post._id} className={styles.postCard}>
                  <Link href={`/blog/${post.slug}`} className={styles.imageLink} tabIndex={-1} aria-hidden="true">
                    <div className={styles.imageFrame}>
                      <Image
                        src={imageUrl}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className={styles.postImage}
                      />
                    </div>
                  </Link>

                  <div className={styles.postMeta}>
                    {post.category && (
                      <span className={styles.categoryName}>{post.category.title}</span>
                    )}
                    <span className={styles.metaDivider}>/</span>
                    <span className={styles.readingTime}>
                      {post.estimatedReadingTime || 4} MIN READ
                    </span>
                  </div>

                  <h3 className={styles.postTitle}>
                    <Link href={`/blog/${post.slug}`} className={styles.titleLink}>
                      {post.title}
                    </Link>
                  </h3>

                  <p className={styles.postExcerpt}>{post.excerpt}</p>

                  <div className={styles.postFooter}>
                    <time dateTime={post.publishedAt} className={styles.dateLabel}>
                      {formatDate(post.publishedAt)}
                    </time>
                    <Link href={`/blog/${post.slug}`} className={styles.readMoreLink}>
                      <span>Read</span>
                      <span className={styles.arrow} aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default DispatchesCurtain;
