import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { client } from "@/sanity/lib/client";
import {
  postBySlugQuery,
  postSlugsQuery,
  relatedPostsQuery,
} from "@/sanity/lib/blog-queries";
import type { Post, PostSummary } from "@/sanity/types/blog";
import { calculateReadingTime } from "@/sanity/types/blog";
import PortableTextRenderer from "../components/PortableTextRenderer";
import TableOfContents from "../components/TableOfContents";
import SocialShareBar from "../components/SocialShareBar";
import BlogCtaBanner from "../components/BlogCtaBanner";
import blogListingStyles from "../Blog.module.scss";
import styles from "./BlogPost.module.scss";

export const revalidate = 60; // ISR cache revalidation

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const slugs = await client.fetch<string[]>(postSlugsQuery);
    return (slugs || []).map((slug) => ({ slug }));
  } catch (error) {
    console.error("Error generating static params for blog:", error);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await client.fetch<Post>(postBySlugQuery, { slug });

  if (!post) {
    return {
      title: "Dispatch Not Found — Marca Ubi",
    };
  }

  const metaTitle = post.seo?.metaTitle || `${post.title} — Marca Ubi Insights`;
  const metaDescription = post.seo?.metaDescription || post.excerpt;
  const ogImageUrl = post.seo?.ogImage?.asset?.url || post.mainImage?.asset?.url;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");
  const canonicalUrl = post.seo?.canonicalUrl || `${siteUrl}/blog/${post.slug}`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: post.seo?.keywords,
    robots: post.seo?.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "article",
      title: metaTitle,
      description: metaDescription,
      url: canonicalUrl,
      siteName: "Marca Ubi",
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt || post.publishedAt,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630, alt: post.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  };
}

function formatDate(isoString: string): string {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "";
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await client.fetch<Post>(postBySlugQuery, { slug });

  if (!post) {
    notFound();
  }

  let relatedPosts: PostSummary[] = [];
  if (post.category?._id) {
    try {
      relatedPosts = await client.fetch<PostSummary[]>(relatedPostsQuery, {
        categoryId: post.category._id,
        currentPostId: post._id,
      });
    } catch (error) {
      console.error("Error fetching related posts:", error);
      relatedPosts = [];
    }
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const readingMinutes = post.estimatedReadingTime || calculateReadingTime(post.body);

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    isPartOf: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    headline: post.title,
    description: post.excerpt,
    image: post.mainImage?.asset?.url ? [post.mainImage.asset.url] : [],
    datePublished: post.publishedAt,
    dateModified: post._updatedAt || post.publishedAt,
    inLanguage: "en-US",
    author: {
      "@type": "Person",
      name: post.author?.name || "Marca Ubi",
      jobTitle: post.author?.role || "Brand Engineer",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Marca Ubi",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/hero/marca-ubi-logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    keywords: post.seo?.keywords?.join(", "),
  };

  return (
    <main className={styles.articlePageMain}>
      {/* JSON-LD Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <article className={styles.articleContainer}>
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <Link href="/blog">Insights</Link>
          {post.category && (
            <>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span>{post.category.title}</span>
            </>
          )}
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.currentBreadcrumb} aria-current="page">
            {post.title}
          </span>
        </nav>

        {/* Article Header */}
        <header className={styles.articleHeader}>
          <div className={styles.headerMetaRow}>
            {post.category?.title && (
              <span className={styles.categoryBadge}>{post.category.title}</span>
            )}
            {post.publishedAt && (
              <>
                <span className={styles.metaDot}>•</span>
                <time className={styles.dateText} dateTime={post.publishedAt}>
                  {formatDate(post.publishedAt)}
                </time>
              </>
            )}
            {readingMinutes > 0 && (
              <>
                <span className={styles.metaDot}>•</span>
                <span className={styles.readingTimeText}>{readingMinutes} min read</span>
              </>
            )}
          </div>

          <h1 className={styles.articleTitle}>{post.title}</h1>
          <p className={styles.articleStandfirst}>{post.excerpt}</p>

          {post.author && (
            <div className={styles.authorRow}>
              {post.author.avatar?.asset?.url && (
                <div className={styles.authorAvatar}>
                  <Image
                    src={post.author.avatar.asset.url}
                    alt={post.author.name}
                    width={44}
                    height={44}
                  />
                </div>
              )}
              <div className={styles.authorDetails}>
                <span className={styles.authorName}>{post.author.name}</span>
                <span className={styles.authorRole}>{post.author.role}</span>
              </div>
            </div>
          )}
        </header>

        {/* Hero Panoramic Image */}
        {post.mainImage?.asset?.url && (
          <div className={styles.heroMediaWrap}>
            <div className={styles.heroImageContainer}>
              <Image
                src={post.mainImage.asset.url}
                alt={post.mainImage.alt || post.title}
                fill
                priority
                sizes="(max-width: 75rem) 100vw, 1200px"
              />
            </div>
            {post.mainImage.caption && (
              <p className={styles.heroCaption}>{post.mainImage.caption}</p>
            )}
          </div>
        )}

        {/* 2-Column Editorial Reading Experience */}
        <div className={styles.editorialLayout}>
          {/* Left Sticky Rail */}
          <aside className={styles.stickyRail}>
            <Link href="/blog" className={styles.backLink}>
              <span aria-hidden="true">←</span>
              <span>All Dispatches</span>
            </Link>

            <TableOfContents blocks={post.body} />

            <SocialShareBar title={post.title} url={postUrl} />
          </aside>

          {/* Main Reading Column */}
          <section className={styles.mainReadingColumn}>
            <PortableTextRenderer value={post.body} />

            {/* Author Bio Card */}
            {post.author && (
              <div className={styles.authorBioCard}>
                {post.author.avatar?.asset?.url && (
                  <div className={styles.bioAvatar}>
                    <Image
                      src={post.author.avatar.asset.url}
                      alt={post.author.name}
                      width={64}
                      height={64}
                    />
                  </div>
                )}
                <div className={styles.bioContent}>
                  <span className={styles.bioTag}>Written by</span>
                  <h3 className={styles.bioName}>{post.author.name}</h3>
                  <span className={styles.bioRole}>{post.author.role}</span>
                  {post.author.bio && <p className={styles.bioText}>{post.author.bio}</p>}

                  {post.author.socialLinks && post.author.socialLinks.length > 0 && (
                    <div className={styles.bioSocials}>
                      {post.author.socialLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>{link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}</span>
                          <img
                            src="/hero/primary-arrow.png"
                            alt=""
                            width={11}
                            height={11}
                            className={styles.bioSocialArrow}
                            aria-hidden="true"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section className={styles.relatedSection} aria-labelledby="related-heading">
            <div className={styles.relatedHeader}>
              <h2 id="related-heading" className={styles.relatedTitle}>
                Related Dispatches
              </h2>
              <Link href="/blog" className={styles.relatedViewAll}>
                <span>Explore All</span>
                <img
                  src="/hero/primary-arrow.png"
                  alt=""
                  width={12}
                  height={12}
                  className={styles.relatedArrowIcon}
                  aria-hidden="true"
                />
              </Link>
            </div>

            <div className={styles.relatedGrid}>
              {relatedPosts.map((related) => (
                <Link
                  key={related._id}
                  href={`/blog/${related.slug}`}
                  className={blogListingStyles.postCard}
                >
                  <div className={blogListingStyles.cardMedia}>
                    {related.mainImage?.asset?.url ? (
                      <Image
                        src={related.mainImage.asset.url}
                        alt={related.mainImage.alt || related.title}
                        fill
                        sizes="(max-width: 44rem) 100vw, 33vw"
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#161616" }} />
                    )}
                  </div>
                  <div className={blogListingStyles.cardBody}>
                    <div className={blogListingStyles.cardTextContent}>
                      {related.category?.title && (
                        <span className={blogListingStyles.categoryTag}>
                          {related.category.title}
                        </span>
                      )}
                      <h3 className={blogListingStyles.cardTitle}>{related.title}</h3>
                      <p className={blogListingStyles.cardExcerpt}>{related.excerpt}</p>
                    </div>
                    <div className={blogListingStyles.cardFooter}>
                      <span className={blogListingStyles.cardDate}>
                        {formatDate(related.publishedAt)}
                      </span>
                      <span className={blogListingStyles.cardReadMore}>
                        <span>Read More</span>
                        <img
                          src="/hero/primary-arrow.png"
                          alt=""
                          width={13}
                          height={13}
                          className={blogListingStyles.cardArrowIcon}
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Studio Conversion CTA Banner */}
        <BlogCtaBanner />
      </article>

      <Footer />
    </main>
  );
}
