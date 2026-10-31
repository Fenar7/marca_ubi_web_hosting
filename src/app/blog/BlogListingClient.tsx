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
 * Formats a Sanity ISO publish date for the editorial meta rows.
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
 * Per-slot cover fallback: when a dispatch has no mainImage at all, we render
 * a neutral #fafafa frame carrying the category initial in Helvetica 200, so
 * each empty slot still reads as authored editorial furniture rather than a
 * recycled stock PNG shared across the whole grid.
 */
function fallbackInitial(post: PostSummary): string {
  const initial = post.category?.title?.trim().charAt(0);
  return (initial || "M").toUpperCase();
}

/**
 * Client-Side Interactive Broadsheet Blog Listing (/blog).
 * Light editorial canvas mirroring the /services/[slug] canon: Helvetica 200
 * display type, hairline rails, zero pills and zero shadows.
 *
 * Filtering is URL-synced (?category=<slug>; absence means all) so a filter
 * state is shareable, survives reload, and back/forward navigation restores
 * the exact rail selection; server fetch stays static under ISR.
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

  // The flagship split layout is reserved for the unfiltered view; a single
  // category read should scan as an honest column of equal-weight dispatches.
  const featuredPost = useMemo(() => {
    if (activeCategory !== "all") return null;
    return filteredPosts.find((post) => post.featured) || filteredPosts[0] || null;
  }, [filteredPosts, activeCategory]);

  const gridPosts = useMemo(() => {
    if (featuredPost && activeCategory === "all") {
      return filteredPosts.filter((post) => post._id !== featuredPost._id);
    }
    return filteredPosts;
  }, [filteredPosts, featuredPost, activeCategory]);

  const dispatchCountLabel = `${String(posts.length).padStart(2, "0")} Dispatches`;

  // Hotspot-aware fixed-crop URL; null when the editor never attached a cover.
  const featuredCover = featuredPost ? coverUrl(featuredPost.mainImage, 1400, 875) : null;

  return (
    <div className={styles.blogWrapper}>
      <header className={styles.heroHeader}>
        <span className={styles.kicker}>Studio Dispatches</span>
        <h1 className={styles.displayTitle}>Thinking in Systems.</h1>
        <p className={styles.heroLead}>
          Essays, strategic field notes, and technical insights on brand architecture, digital craft, and high-velocity systems from the Marca Ubi studio floor.
        </p>
        <span className={styles.dispatchCount} aria-hidden="true">
          {dispatchCountLabel}
        </span>
      </header>

      <nav className={styles.categoryRail} aria-label="Filter essays by category">
        <button
          type="button"
          aria-pressed={activeCategory === "all"}
          className={`${styles.categoryTab} ${activeCategory === "all" ? styles.categoryTabActive : ""}`}
          onClick={() => selectCategory("all")}
        >
          <span>All Dispatches</span>
          <span className={styles.countNumeral}>({posts.length})</span>
        </button>

        {categories.map((category) => {
          // Live count comes from the categoriesQuery projection; recomputing
          // it here would drift from the server truth under ISR caching.
          const count = category.postCount ?? 0;
          const isActive = activeCategory === category.slug;
          // Zero-count tabs stay mounted and disabled so the rail never
          // reshuffles between filters; active tabs remain clickable even at
          // zero to let the reader exit a shared dead-end URL.
          const isDisabled = count === 0 && !isActive;

          return (
            <React.Fragment key={category._id}>
              <span className={styles.railSlash} aria-hidden="true">/</span>
              <button
                type="button"
                aria-pressed={isActive}
                aria-disabled={isDisabled}
                className={`${styles.categoryTab} ${isActive ? styles.categoryTabActive : ""} ${isDisabled ? styles.categoryTabDisabled : ""}`}
                onClick={() => {
                  if (!isDisabled) selectCategory(category.slug);
                }}
              >
                <span>{category.title}</span>
                <span className={styles.countNumeral}>({count})</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {featuredPost && (
        <section className={styles.featuredSection} aria-label="Featured Dispatch">
          <article className={styles.featuredCard}>
            <div
              className={`${styles.featuredImageFrame} ${featuredCover ? "" : styles.imageFallback}`}
            >
              {featuredCover ? (
                <Image
                  src={featuredCover}
                  alt={featuredPost.mainImage?.alt || featuredPost.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className={styles.featuredImage}
                  priority
                  placeholder={lqipFor(featuredPost.mainImage) ? "blur" : "empty"}
                  blurDataURL={lqipFor(featuredPost.mainImage)}
                />
              ) : (
                <span className={styles.fallbackInitial} aria-hidden="true">
                  {fallbackInitial(featuredPost)}
                </span>
              )}
            </div>

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

                <Link href={`/blog/${featuredPost.slug}`} className={styles.ctaLink}>
                  <span>Read Full Dispatch</span>
                  <span className={styles.arrow} aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </article>
        </section>
      )}

      <section className={styles.dispatchesGridSection} aria-label="All Dispatches">
        {gridPosts.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              No dispatches filed under this category yet.
            </p>
            <Link href={pathname} className={styles.emptyAction}>
              <span>View all dispatches</span>
              <span className={styles.arrow} aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        ) : (
          <div className={styles.dispatchesGrid}>
            {gridPosts.map((post) => {
              // Stretched-link pattern: the title anchor paints an inset-0
              // overlay so the whole card is one tabbable, one-href link.
              const cardCover = coverUrl(post.mainImage, 800, 450);

              return (
                <article key={post._id} className={styles.gridCard}>
                  <div
                    className={`${styles.cardImageFrame} ${cardCover ? "" : styles.imageFallback}`}
                  >
                    {cardCover ? (
                      <Image
                        src={cardCover}
                        alt={post.mainImage?.alt || post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className={styles.cardImage}
                        placeholder={lqipFor(post.mainImage) ? "blur" : "empty"}
                        blurDataURL={lqipFor(post.mainImage)}
                      />
                    ) : (
                      <span className={styles.fallbackInitial} aria-hidden="true">
                        {fallbackInitial(post)}
                      </span>
                    )}
                  </div>

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
                    <Link href={`/blog/${post.slug}`} className={styles.cardTitleLink}>
                      {post.title}
                    </Link>
                  </h3>

                  <p className={styles.cardExcerpt}>{post.excerpt}</p>

                  <div className={styles.cardFooter}>
                    <time dateTime={post.publishedAt} className={styles.cardDate}>
                      {formatDate(post.publishedAt)}
                    </time>
                    <span className={styles.cardReadHint} aria-hidden="true">
                      <span>Read</span>
                      <span className={styles.arrow}>&rarr;</span>
                    </span>
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
