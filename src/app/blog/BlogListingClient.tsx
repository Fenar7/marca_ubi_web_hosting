"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Category, PostSummary, SanityImageReference } from "@/sanity/types/blog";
import { coverUrl } from "@/sanity/lib/image";
import styles from "./Blog.module.scss";

interface BlogListingClientProps {
  posts: PostSummary[];
  categories: Category[];
}

/**
 * Archive furniture numbers are always two glyphs so the ledger's monospace
 * columns stay optically aligned from 1 dispatch up to 99.
 */
function pad2(value: number): string {
  return String(Math.max(0, value)).padStart(2, "0");
}

/**
 * Formats a Sanity ISO publish date for the ledger and the issue stats.
 * timeZone UTC keeps the rendered day identical to the CMS-stored instant,
 * regardless of the reader's locale. Any malformed date degrades to an empty
 * string with a console trace rather than throwing during render.
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
  } catch (error) {
    console.error("Failed to format blog publish date:", error);
    return "";
  }
}

/**
 * Low-quality image placeholder (base64 LQIP) attached by Sanity's asset
 * metadata when the editor generated one. Absent LQIP simply means the Image
 * renders without a blur placeholder, never a broken blurDataURL prop.
 */
function lqipFor(image: SanityImageReference | undefined): string | undefined {
  return image?.asset?.metadata?.lqip;
}

/**
 * Lead-cover fallback: when a dispatch has no mainImage at all, the frame
 * carries the category initial in Helvetica 200 so the slot reads as authored
 * editorial furniture rather than a recycled stock PNG.
 */
function fallbackInitial(post: PostSummary): string {
  const initial = post.category?.title?.trim().charAt(0);
  return (initial || "M").toUpperCase();
}

/**
 * The most recent publish instant in the corpus, returned as its raw ISO
 * string. postsQuery already orders publishedAt desc, but the archive is
 * scanned explicitly so a CMS re-order can never mislabel LAST FILED.
 */
function latestPublishedAt(posts: PostSummary[]): string {
  let latest = "";
  let latestMs = Number.NEGATIVE_INFINITY;
  for (const post of posts) {
    const parsed = Date.parse(post.publishedAt || "");
    if (Number.isFinite(parsed) && parsed > latestMs) {
      latestMs = parsed;
      latest = post.publishedAt;
    }
  }
  return latest;
}

/**
 * Client-side interactive editorial index (/blog).
 *
 * Composition is a print "contents" page, not a card grid: a full-bleed
 * masthead whose right column is filled by a real issue ledger (year, dispatch
 * count, category count, last filing), a hairline category strip, one
 * asymmetric lead story whose dossier pins its footer to the cover's bottom
 * edge, then hairline numbered rows that scan in a single pass.
 *
 * Filtering stays URL-synced (?category=<slug>; absence means all) so a filter
 * state is shareable, survives reload, and back/forward restores the exact tab
 * selection; the server fetch stays static under ISR.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function BlogListingClient({ posts, categories }: BlogListingClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Absence of the param is the canonical "all" state; a malformed or
  // zero-result category still navigates honestly to the empty state.
  const activeCategory = searchParams.get("category") || "all";

  const selectCategory = (slug: string) => {
    if (slug === activeCategory) return;
    if (slug === "all") {
      router.replace(pathname, { scroll: false });
      return;
    }
    const params = new URLSearchParams();
    params.set("category", slug);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const filteredPosts = useMemo(() => {
    if (activeCategory === "all") return posts;
    return posts.filter((post) => post.category?.slug === activeCategory);
  }, [posts, activeCategory]);

  // The flagship split is reserved for the unfiltered view and only earns its
  // space when there is a second dispatch to index beneath it.
  const featuredPost = useMemo(() => {
    if (activeCategory !== "all" || filteredPosts.length < 2) return null;
    return filteredPosts.find((post) => post.featured) || filteredPosts[0] || null;
  }, [filteredPosts, activeCategory]);

  const ledgerPosts = useMemo(() => {
    if (featuredPost && activeCategory === "all") {
      return filteredPosts.filter((post) => post._id !== featuredPost._id);
    }
    return filteredPosts;
  }, [filteredPosts, featuredPost, activeCategory]);

  // The lead consumes numeral 01, so the ledger only offsets when it is shown.
  const ledgerNumeralOffset = featuredPost ? 2 : 1;

  // Every figure is derived from the fetched corpus; nothing is hard-coded, so
  // an empty archive reports 00 rather than a fabricated masthead statistic.
  const issueStats = useMemo(() => {
    const latest = latestPublishedAt(posts);
    const latestYear = latest ? new Date(latest).getUTCFullYear() : new Date().getFullYear();
    return [
      { label: "Issue", value: String(Number.isFinite(latestYear) ? latestYear : new Date().getFullYear()) },
      { label: "Dispatches", value: pad2(posts.length) },
      { label: "Categories", value: pad2(categories.length) },
      { label: "Last filed", value: latest ? formatDate(latest) : "None yet" },
    ];
  }, [posts, categories]);

  // Hotspot-aware fixed-crop URL; null when the editor never attached a cover.
  const featuredCover = featuredPost ? coverUrl(featuredPost.mainImage, 1400, 933) : null;
  const featuredLqip = lqipFor(featuredPost?.mainImage);

  const tabClass = (isActive: boolean, isDisabled: boolean) =>
    [
      styles.categoryTab,
      isActive ? styles.categoryTabActive : "",
      isDisabled ? styles.categoryTabDisabled : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div className={styles.blogWrapper}>
      {/* Band 1: masthead. The right column is an issue ledger built from live
          archive data, which is what removes the dead space the owner flagged. */}
      <header className={styles.masthead}>
        <div className={styles.mastheadMain}>
          <span className={styles.kicker}>Studio Dispatches</span>
          <h1 className={styles.displayTitle}>Thinking in Systems.</h1>
          <p className={styles.standfirst}>
            Essays, strategic field notes and technical observations on brand architecture,
            digital craft and high-velocity systems, filed from the Marca Ubi studio floor.
          </p>
        </div>

        <dl className={styles.issueLedger} aria-label="Archive summary">
          {issueStats.map((stat) => (
            <div className={styles.issueRow} key={stat.label}>
              <dt className={styles.issueLabel}>{stat.label}</dt>
              <dd className={styles.issueValue}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Band 2: category strip. Separated by spacing only; slash separators
          were dropped because they read as unfinished markup. */}
      <nav className={styles.categoryStrip} aria-label="Filter essays by category">
        <button
          type="button"
          aria-pressed={activeCategory === "all"}
          className={tabClass(activeCategory === "all", false)}
          onClick={() => selectCategory("all")}
        >
          <span className={styles.tabLabel}>All dispatches</span>
          <span className={styles.tabCount}>({posts.length})</span>
        </button>

        {categories.map((category) => {
          // Live count comes from the categoriesQuery projection; recomputing
          // it here would drift from the server truth under ISR caching.
          const count = category.postCount ?? 0;
          const isActive = activeCategory === category.slug;
          // Zero-count tabs stay mounted and disabled so the strip never
          // reshuffles between filters; the active tab remains clickable even
          // at zero, so a shared dead-end URL can always be escaped.
          const isDisabled = count === 0 && !isActive;

          return (
            <button
              key={category._id}
              type="button"
              aria-pressed={isActive}
              aria-disabled={isDisabled}
              className={tabClass(isActive, isDisabled)}
              onClick={() => {
                if (!isDisabled) selectCategory(category.slug);
              }}
            >
              <span className={styles.tabLabel}>{category.title}</span>
              <span className={styles.tabCount}>({count})</span>
            </button>
          );
        })}
      </nav>

      {/* Band 3: lead story, unfiltered view only. */}
      {featuredPost && (
        <section className={styles.leadBand} aria-label="Featured dispatch">
          <article className={styles.leadCard}>
            <div className={styles.leadCoverFrame}>
              {featuredCover ? (
                <Image
                  src={featuredCover}
                  alt={featuredPost.mainImage?.alt || featuredPost.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 62vw"
                  className={styles.leadCoverImg}
                  priority
                  placeholder={featuredLqip ? "blur" : "empty"}
                  blurDataURL={featuredLqip}
                />
              ) : (
                <span className={styles.leadFallbackInitial} aria-hidden="true">
                  {fallbackInitial(featuredPost)}
                </span>
              )}
            </div>

            <div className={styles.leadDossier}>
              <span className={styles.leadIndexNum} aria-hidden="true">
                {pad2(1)}
              </span>

              <div className={styles.leadKickerRow}>
                <span className={styles.leadKicker}>Featured dispatch</span>
                {featuredPost.category?.title && (
                  <span className={styles.leadCategory}>/ {featuredPost.category.title}</span>
                )}
              </div>

              <h2 className={styles.leadTitle}>
                <Link href={`/blog/${featuredPost.slug}`} className={styles.leadTitleLink}>
                  {featuredPost.title}
                </Link>
              </h2>

              {featuredPost.excerpt && (
                <p className={styles.leadExcerpt}>{featuredPost.excerpt}</p>
              )}

              {/* margin-top: auto on this block is the specific fix for the
                  dossier floating above the cover's bottom edge. */}
              <div className={styles.leadFooter}>
                <div className={styles.leadCredit}>
                  {featuredPost.author?.name && (
                    <span className={styles.leadAuthor}>{featuredPost.author.name}</span>
                  )}
                  <span className={styles.leadRead}>
                    {featuredPost.estimatedReadingTime || 5} min read
                  </span>
                </div>

                {/* The title anchor paints the inset-0 overlay, so the CTA is a
                    span: one href, one tab stop, no nested interactive nodes. */}
                <span className={styles.leadCta} aria-hidden="true">
                  <span>Read full dispatch</span>
                  <span className={styles.leadCtaArrow}>&rarr;</span>
                </span>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* Band 4: the index ledger. Hairline rows replace the card grid. */}
      <section className={styles.indexSection} aria-label="Dispatch index">
        {ledgerPosts.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              No dispatches filed under this category yet.
            </p>
            <Link href={pathname} className={styles.emptyAction}>
              <span>View all dispatches</span>
              <span className={styles.emptyArrow} aria-hidden="true">
                &rarr;
              </span>
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.indexHeader}>
              <span className={styles.indexHeaderLabel}>The index</span>
              <span className={styles.indexHeaderCount}>
                {ledgerPosts.length} {ledgerPosts.length === 1 ? "entry" : "entries"}
              </span>
            </div>

            {ledgerPosts.map((post, index) => {
              const readingMinutes = post.estimatedReadingTime || 4;

              return (
                <article key={post._id} className={styles.indexRow}>
                  <span className={styles.rowNum} aria-hidden="true">
                    {pad2(ledgerNumeralOffset + index)}
                  </span>

                  {/* display: contents on desktop lets each meta cell occupy its
                      own ledger column; the narrow layouts switch this wrapper
                      to flex so the same three cells form one meta line. */}
                  <div className={styles.rowHead}>
                    <time dateTime={post.publishedAt} className={styles.rowDate}>
                      {formatDate(post.publishedAt)}
                    </time>
                    {post.category?.title && (
                      <span className={styles.rowCat}>{post.category.title}</span>
                    )}
                    <span className={styles.rowRead}>{readingMinutes} min read</span>
                  </div>

                  <div className={styles.rowBody}>
                    <h3 className={styles.rowTitle}>
                      <Link href={`/blog/${post.slug}`} className={styles.rowTitleLink}>
                        {post.title}
                      </Link>
                    </h3>
                    {post.excerpt && <p className={styles.rowExcerpt}>{post.excerpt}</p>}
                  </div>

                  <span className={styles.rowArrow} aria-hidden="true">
                    &rarr;
                  </span>
                </article>
              );
            })}
          </>
        )}
      </section>

      {/* Band 5: closing destinations, so the page ends on intent instead of
          trailing off into whitespace. */}
      <nav className={styles.closingBand} aria-label="More from the studio">
        <Link href="/works" className={styles.closingLink}>
          <span>Selected work</span>
          <span className={styles.closingArrow} aria-hidden="true">
            &rarr;
          </span>
        </Link>
        <Link href="/services" className={styles.closingLink}>
          <span>Services</span>
          <span className={styles.closingArrow} aria-hidden="true">
            &rarr;
          </span>
        </Link>
        <Link href="/start-project" className={styles.closingLink}>
          <span>Initiate a brief</span>
          <span className={styles.closingArrow} aria-hidden="true">
            &rarr;
          </span>
        </Link>
      </nav>
    </div>
  );
}
