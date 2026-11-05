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
 * UTC-pinned calendar formatting ("12 Oct 2026", en-GB to match the /blog index
 * and the article page): fixing the timeZone keeps the server render and client
 * hydration byte-identical regardless of the renderer's local offset, avoiding
 * a hydration mismatch on dated entries.
 */
function formatDate(isoString: string): string {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleDateString("en-GB", {
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
 * Journal teaser, the approved 3-card editorial stack.
 * Solid white curtain (#ffffff) over the living background video on a 30/70
 * Swiss split: a sticky left rail (red mono kicker, extralight Helvetica
 * headline, summary, hairline, zero-padded count of the live Sanity total,
 * outline CTA) beside a right column of three vertical cards. Each card is a
 * 16/9 hotspot-aware cover (coverUrl + lqip blur-up, first paint prioritised),
 * a mono category label, a 3-line clamped light Helvetica title carrying the
 * stretched link, a 2-line excerpt and a hairline-topped footer so the stack
 * never ragged-ends. Reading time is omitted here on purpose: a `PostSummary`
 * carries no body, so any duration shown would be invented. No cover renders a
 * per-card initial plate derived from the category, never a shared stock
 * fallback; an empty Sanity result renders an honest note pointing at /blog
 * instead of fabricated posts.
 */
export function DispatchesCurtain({ posts = [] }: DispatchesCurtainProps) {
  const displayPosts = posts.slice(0, 3);
  // Ledger mirrors the true CMS total, not the 3 rendered slots.
  const paddedCount = String(posts.length).padStart(2, "0");

  return (
    <section
      className={styles.dispatchesSection}
      // Deliberately not renamed: external deep links already target this id,
      // while all user-facing copy reads as the journal.
      id="dispatches"
      aria-label="Journal"
      data-header-theme="light"
    >
      <div className={styles.gridContainer}>
        {/* Left Sticky Rail (30%) */}
        <aside className={styles.leftColumn}>
          <div className={styles.stickyRail}>
            <span className={styles.railKicker}>Journal</span>
            <h2 className={styles.railHeadline}>From the studio floor.</h2>
            <p className={styles.railSummary}>
              Essays, architectural field notes, brand strategy, and digital engineering from the Marca Ubi studio floor.
            </p>
            <hr className={styles.railRule} />
            <span className={styles.ledgerLine} aria-hidden="true">
              {paddedCount} entries
            </span>
            <Link href="/blog" className={styles.architecturalButton}>
              <span>Read the journal</span>
              <span className={styles.arrow} aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </aside>

        {/* Right 3-Card Stack (70%) */}
        <div className={styles.rightColumn}>
          {displayPosts.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyNote}>New entries are being drafted.</p>
              <Link href="/blog" className={styles.ctaLink}>
                <span>Read the journal</span>
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
                        alt={post.mainImage?.alt || post.title || "Marca Ubi Editorial Journal Dispatch"}
                        fill
                        sizes="(max-width: 1024px) 100vw, 62vw"
                        className={styles.postImage}
                        loading="lazy"
                        decoding="async"
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
                    {/* Category only: `PostSummary` has no body, so a reading
                        time here could not be measured and is omitted rather
                        than guessed. */}
                    {post.category && (
                      <div className={styles.postMeta}>
                        <span className={styles.categoryName}>{post.category.title}</span>
                      </div>
                    )}

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
                        <span>Read</span>
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
