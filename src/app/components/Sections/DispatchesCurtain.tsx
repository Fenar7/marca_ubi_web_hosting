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
 * View 08: Studio Dispatches Curtain, light-editorial broadsheet composition.
 * Solid pure white curtain (#ffffff) sliding over the living background video,
 * on the Swiss 28fr/72fr client grid with a sticky left rail. The right column
 * runs ONE lead dispatch (hotspot-aware cover via coverUrl in a 5/3 letterboxed
 * frame, mono meta row, extralight Helvetica headline, 2-line excerpt and an
 * editorial ctaLink) followed by TWO compact hairline index rows without images.
 * Only real Sanity records render: a missing CMS never gets fabricated posts,
 * just an honest empty state pointing at /blog.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function DispatchesCurtain({ posts = [] }: DispatchesCurtainProps) {
  // Featured record owns the lead slot; otherwise the newest date-ordered post leads.
  const lead = posts.find((post) => post.featured) ?? posts[0] ?? null;
  // Index rows take the next two records after the lead, never repeating its photo.
  const indexPosts = lead
    ? posts.filter((post) => post._id !== lead._id).slice(0, 2)
    : [];

  // 1200x720 crop honours the editor-authored hotspot; null means no cover exists,
  // so the lead degrades to a text-only broadsheet entry instead of a stock photo.
  const leadCover = lead ? coverUrl(lead.mainImage, 1200, 720) : null;
  const leadLqip = lead?.mainImage?.asset?.metadata?.lqip;

  return (
    <section
      className={styles.dispatchesSection}
      id="dispatches"
      aria-label="Studio Dispatches and Field Notes"
      data-header-theme="light"
    >
      <div className={styles.gridContainer}>
        {/* Left Sticky Rail (28fr) */}
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

        {/* Right Broadsheet Column (72fr) */}
        <div className={styles.rightColumn}>
          {lead === null ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyNote}>New dispatches are being drafted.</p>
              <Link href="/blog" className={styles.ctaLink}>
                <span>View All Dispatches</span>
                <span className={styles.arrow} aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          ) : (
            <>
              <article className={styles.leadDispatch}>
                {leadCover !== null && (
                  <Link
                    href={`/blog/${lead.slug}`}
                    className={styles.leadCover}
                    tabIndex={-1}
                  >
                    <Image
                      src={leadCover}
                      alt={lead.mainImage?.alt ?? lead.title}
                      fill
                      sizes="(max-width: 1024px) calc(100vw - 3rem), 70vw"
                      className={styles.leadCoverImage}
                      placeholder={leadLqip ? "blur" : "empty"}
                      blurDataURL={leadLqip}
                    />
                  </Link>
                )}

                <div className={styles.leadMeta}>
                  {lead.category && (
                    <>
                      <span className={styles.categoryKicker}>{lead.category.title}</span>
                      <span className={styles.metaDivider} aria-hidden="true">/</span>
                    </>
                  )}
                  <time dateTime={lead.publishedAt} className={styles.leadDate}>
                    {formatDate(lead.publishedAt)}
                  </time>
                  <span className={styles.metaDivider} aria-hidden="true">/</span>
                  {/* Sanity computes reading time at build; 3 MIN mirrors the
                      calculateReadingTime default for legacy drafts. */}
                  <span className={styles.leadReadTime}>
                    {lead.estimatedReadingTime ?? 3} MIN READ
                  </span>
                </div>

                <h3 className={styles.leadTitle}>
                  <Link href={`/blog/${lead.slug}`} className={styles.leadTitleLink}>
                    {lead.title}
                  </Link>
                </h3>

                <p className={styles.leadExcerpt}>{lead.excerpt}</p>

                <Link href={`/blog/${lead.slug}`} className={styles.ctaLink}>
                  <span>Read dispatch</span>
                  <span className={styles.arrow} aria-hidden="true">&rarr;</span>
                </Link>
              </article>

              {indexPosts.length > 0 && (
                <div className={styles.indexRows}>
                  {indexPosts.map((post) => (
                    <Link
                      key={post._id}
                      href={`/blog/${post.slug}`}
                      className={styles.indexRow}
                    >
                      <time dateTime={post.publishedAt} className={styles.indexDate}>
                        {formatDate(post.publishedAt)}
                      </time>
                      {/* Uncategorised legacy drafts fall back to the generic
                          label rather than an invented category name. */}
                      <span className={styles.indexCategory}>
                        {post.category ? post.category.title : "Dispatch"}
                      </span>
                      <span className={styles.indexTitle}>{post.title}</span>
                      <span className={styles.indexArrow} aria-hidden="true">&rarr;</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default DispatchesCurtain;
