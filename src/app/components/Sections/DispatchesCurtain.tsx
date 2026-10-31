"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { PostSummary } from "@/sanity/types/blog";
import { coverUrl } from "@/sanity/lib/image";
import styles from "./DispatchesCurtain.module.scss";

interface DispatchesCurtainProps {
  posts?: PostSummary[];
}

/**
 * UTC-pinned calendar formatting ("Oct 12, 2026"): fixing the timeZone keeps
 * the server render and client hydration byte-identical regardless of the
 * renderer's local offset, avoiding hydration mismatch on dated dispatches.
 */
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
 * View 08: Studio Dispatches Curtain, the approved 3-card editorial stack.
 * Solid white curtain (#ffffff) over the living background video on a 30/70
 * Swiss split: a sticky left rail (red mono kicker, extralight Helvetica
 * "Thinking in Systems." headline, summary, hairline, zero-padded ledger of
 * the live Sanity count, outline CTA) beside a right column of three vertical
 * cards. Each card is a 16/9 hotspot-aware cover (coverUrl + lqip blur-up,
 * first paint prioritised), a mono meta row, a 3-line clamped light Helvetica
 * title carrying the stretched link, a 2-line excerpt and a hairline-topped
 * footer so the stack never ragged-ends. No cover renders a per-card initial
 * plate derived from the category, never a shared stock fallback; an empty
 * Sanity result renders an honest note pointing at /blog instead of
 * fabricated posts.
 */
export function DispatchesCurtain({ posts = [] }: DispatchesCurtainProps) {
  const displayPosts = posts.slice(0, 3);
  // Ledger mirrors the true CMS total, not the 3 rendered slots.
  const paddedCount = String(posts.length).padStart(2, "0");

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
            <span className={styles.railKicker}>Studio Dispatches</span>
            <h2 className={styles.railHeadline}>Thinking in Systems.</h2>
            <p className={styles.railSummary}>
              Essays, architectural field notes, brand strategy, and digital engineering from the Marca Ubi studio floor.
            </p>
            <hr className={styles.railRule} />
            <span className={styles.ledgerLine} aria-hidden="true">
              {paddedCount} / Dispatches
            </span>
            <Link href="/blog" className={styles.architecturalButton}>
              <span>View All Dispatches</span>
              <span className={styles.arrow} aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </aside>

        {/* Right 3-Card Stack (70%) */}
        <div className={styles.rightColumn}>
          {displayPosts.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyNote}>New dispatches are being drafted.</p>
              <Link href="/blog" className={styles.ctaLink}>
                <span>View All Dispatches</span>
                <span className={styles.arrow} aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          ) : (
            displayPosts.map((post, index) => {
              // 1200x675 keeps the 16/9 frame exact while honouring the
              // editor-authored hotspot; null means no cover exists at all.
              const cover = coverUrl(post.mainImage, 1200, 675);
              // LQIP is only valid when Sanity generated it; next/image throws
              // on placeholder="blur" without a blurDataURL, so gate both.
              const lqip = post.mainImage?.asset?.metadata?.lqip;

              return (
                <article key={post._id} className={styles.postCard}>
                  <div
                    className={
                      cover === null
                        ? `${styles.imageFrame} ${styles.imageFrameFallback}`
                        : styles.imageFrame
                    }
                  >
                    {cover !== null ? (
                      <Image
                        src={cover}
                        alt={post.mainImage?.alt ?? post.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 62vw"
                        className={styles.postImage}
                        priority={index === 0}
                        loading={index === 0 ? undefined : "lazy"}
                        placeholder={lqip ? "blur" : "empty"}
                        blurDataURL={lqip}
                      />
                    ) : (
                      <span className={styles.coverInitial} aria-hidden="true">
                        {(post.category?.title ?? post.title).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.postMeta}>
                      {post.category && (
                        <>
                          <span className={styles.categoryName}>{post.category.title}</span>
                          <span className={styles.metaDivider} aria-hidden="true">/</span>
                        </>
                      )}
                      {/* Legacy drafts predating the reading-time field render
                          the studio baseline rather than a blank cell. */}
                      <span className={styles.readingTime}>
                        {post.estimatedReadingTime ?? 4} MIN READ
                      </span>
                    </div>

                    <h3 className={styles.postTitle}>
                      {/* Stretched link: the ::after overlay makes the whole
                          card clickable, so every other element stays a plain
                          span/time to keep exactly one tabbable target. */}
                      <Link href={`/blog/${post.slug}`} className={styles.titleLink}>
                        {post.title}
                      </Link>
                    </h3>

                    <p className={styles.postExcerpt}>{post.excerpt}</p>

                    <div className={styles.postFooter}>
                      <time dateTime={post.publishedAt} className={styles.dateLabel}>
                        {formatDate(post.publishedAt)}
                      </time>
                      <span className={styles.readMore}>
                        <span>Read dispatch</span>
                        <span className={styles.arrow} aria-hidden="true">&rarr;</span>
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default DispatchesCurtain;
