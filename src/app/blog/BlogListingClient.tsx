"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PillButton from "@/app/components/ui/PillButton/PillButton";
import type { Category, PostSummary } from "@/sanity/types/blog";
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
    });
  } catch {
    return "";
  }
}

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
    <div className={styles.blogContainer}>
      {/* Editorial Hero Header */}
      <header className={styles.heroHeader}>
        <div className={styles.heroTag}>
          <img
            src="/images/asterisk.png"
            alt=""
            className={styles.tagAsterisk}
            width={16}
            height={16}
            aria-hidden="true"
          />
          <h2 className={styles.tagText}>Insights / Marca Ubi</h2>
        </div>
        <h1 className={styles.heroTitle}>
          Dispatches on brand architecture, digital craft, and modern systems.
        </h1>
        <p className={styles.heroSubtitle}>
          Essays, strategic field notes, and technical insights from the Marca Ubi studio floor.
        </p>
      </header>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <nav className={styles.filterBar} aria-label="Filter insights by category">
          <button
            type="button"
            className={`${styles.filterPill} ${selectedCategory === "all" ? styles.filterPillActive : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            <span>All Dispatches</span>
            <span className={styles.countBadge}>{posts.length}</span>
          </button>

          {categories.map((category) => {
            const count = posts.filter((p) => p.category?.slug === category.slug).length;
            if (count === 0 && selectedCategory !== category.slug) return null;

            return (
              <button
                key={category._id}
                type="button"
                className={`${styles.filterPill} ${selectedCategory === category.slug ? styles.filterPillActive : ""}`}
                onClick={() => setSelectedCategory(category.slug)}
              >
                <span>{category.title}</span>
                <span className={styles.countBadge}>{count}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Featured Leading Card */}
      {featuredPost && (
        <article className={styles.featuredCard}>
          <div className={styles.featuredMedia}>
            {featuredPost.mainImage?.asset?.url ? (
              <Image
                src={featuredPost.mainImage.asset.url}
                alt={featuredPost.mainImage.alt || featuredPost.title}
                fill
                priority
                sizes="(max-width: 60rem) 100vw, 55vw"
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "#161616" }} />
            )}
          </div>

          <div className={styles.featuredContent}>
            <div className={styles.featuredTop}>
              <div className={styles.metaRow}>
                {featuredPost.category?.title && (
                  <span className={styles.categoryTag}>{featuredPost.category.title}</span>
                )}
                {featuredPost.publishedAt && (
                  <>
                    <span className={styles.metaDot}>•</span>
                    <span className={styles.readingTime}>{formatDate(featuredPost.publishedAt)}</span>
                  </>
                )}
                {featuredPost.estimatedReadingTime && (
                  <>
                    <span className={styles.metaDot}>•</span>
                    <span className={styles.readingTime}>{featuredPost.estimatedReadingTime} min read</span>
                  </>
                )}
              </div>

              <Link href={`/blog/${featuredPost.slug}`} style={{ textDecoration: "none" }}>
                <h2 className={styles.featuredTitle}>{featuredPost.title}</h2>
              </Link>

              <p className={styles.featuredExcerpt}>{featuredPost.excerpt}</p>
            </div>

            <div className={styles.featuredAuthorRow}>
              {featuredPost.author && (
                <div className={styles.authorMeta}>
                  {featuredPost.author.avatar?.asset?.url && (
                    <div className={styles.authorAvatar}>
                      <img
                        src={featuredPost.author.avatar.asset.url}
                        alt={featuredPost.author.name}
                        width={40}
                        height={40}
                      />
                    </div>
                  )}
                  <div className={styles.authorInfo}>
                    <p className={styles.authorName}>{featuredPost.author.name}</p>
                    <p className={styles.authorRole}>{featuredPost.author.role}</p>
                  </div>
                </div>
              )}

              <PillButton
                href={`/blog/${featuredPost.slug}`}
                label="Read Dispatch"
                variant="brand"
                icon={<img src="/hero/primary-arrow.png" alt="" width={16} height={16} />}
              />
            </div>
          </div>
        </article>
      )}

      {/* Dispatches Grid */}
      {gridPosts.length > 0 ? (
        <section className={styles.postsGrid} aria-label="Latest dispatches">
          {gridPosts.map((post) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug}`}
              className={styles.postCard}
            >
              <div className={styles.cardMedia}>
                {post.mainImage?.asset?.url ? (
                  <Image
                    src={post.mainImage.asset.url}
                    alt={post.mainImage.alt || post.title}
                    fill
                    sizes="(max-width: 44rem) 100vw, (max-width: 72rem) 50vw, 33vw"
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#161616" }} />
                )}
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardTextContent}>
                  <div className={styles.metaRow}>
                    {post.category?.title && (
                      <span className={styles.categoryTag}>{post.category.title}</span>
                    )}
                    {post.estimatedReadingTime && (
                      <>
                        <span className={styles.metaDot}>•</span>
                        <span className={styles.readingTime}>{post.estimatedReadingTime} min read</span>
                      </>
                    )}
                  </div>

                  <h3 className={styles.cardTitle}>{post.title}</h3>
                  <p className={styles.cardExcerpt}>{post.excerpt}</p>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.cardDate}>{formatDate(post.publishedAt)}</span>
                  <span className={styles.cardReadMore}>
                    Read Dispatch <span aria-hidden="true">↗</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        !featuredPost && (
          <div className={styles.emptyState}>
            <span className={styles.emptyBadge}>[ 00 / ARCHIVE EMPTY ]</span>
            <h2 className={styles.emptyTitle}>No dispatches published yet</h2>
            <p className={styles.emptyDescription}>
              Our team is actively drafting new field notes on brand strategy and digital engineering. Check back shortly or start a project conversation.
            </p>
            <PillButton
              href="/start-project"
              label="Start a Project Brief"
              variant="brand"
              icon={<img src="/hero/primary-arrow.png" alt="" width={16} height={16} />}
            />
          </div>
        )
      )}
    </div>
  );
}
