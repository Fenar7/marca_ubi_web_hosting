import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ClientHeader from "@/app/components/ClientHeader/ClientHeader";
import MonumentalFooter from "@/app/components/Sections/MonumentalFooter";
import { client } from "@/sanity/lib/client";
import {
  postBySlugQuery,
  postSlugsQuery,
  relatedPostsQuery,
} from "@/sanity/lib/blog-queries";
import type { Post, PostSummary } from "@/sanity/types/blog";
import { calculateReadingTime } from "@/sanity/types/blog";
import { urlFor, coverUrl } from "@/sanity/lib/image";
import PortableTextRenderer from "../components/PortableTextRenderer";
import TableOfContents from "../components/TableOfContents";
import SocialShareBar from "../components/SocialShareBar";
import BlogCtaBanner from "../components/BlogCtaBanner";
import styles from "./BlogPost.module.scss";

export const revalidate = 60; // ISR cache revalidation

/** One calendar day in ms: the tolerance before an _updatedAt bump is worth
 *  surfacing as an "Updated" stamp to the reader (typo-level edits stay quiet). */
const DAY_MS = 86_400_000;

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

/**
 * og:image is served through the same hotspot-aware crop pipeline as the
 * on-page covers: the declared 1200x630 now matches the delivered bytes
 * (previously the multi-MB Sanity original was announced at 1200x630).
 * When neither an authored OG card nor a main image exists the block is
 * omitted entirely rather than pointing crawlers at a broken URL.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await client.fetch<Post>(postBySlugQuery, { slug });

  if (!post) {
    return {
      title: "Dispatch Not Found | Marca Ubi",
    };
  }

  const metaTitle = post.seo?.metaTitle || `${post.title} | Marca Ubi Insights`;
  const metaDescription = post.seo?.metaDescription || post.excerpt;
  const ogImageUrl = coverUrl(post.seo?.ogImage || post.mainImage, 1200, 630);
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

function formatDateLong(isoString: string): string {
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

function formatDateCard(isoString: string): string {
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
 * Mirrors calculateReadingTime's extraction so BlogPosting.wordCount reflects
 * the exact prose the reader sees (block children only; images, code blocks
 * and callouts carry no visible paragraph text and are excluded upstream).
 */
interface RawBodyBlock {
  _type?: string;
  children?: Array<{ text?: string }>;
}

function countBodyWords(body: Post["body"]): number {
  const raw = (body || []) as unknown as RawBodyBlock[];
  return raw
    .filter((b) => b._type === "block")
    .flatMap((b) => b.children || [])
    .map((c) => c.text || "")
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Editorial Article Reader (light surface).
 * Single 1680px container carries breadcrumb, header band, cover and the
 * 280px-rail + 72ch-column reading grid so all copy shares one left edge.
 * Covers and related cards flow through coverUrl()'s hotspot-aware crops,
 * the TOC/share rail sticks beside the body, and JSON-LD pairs BlogPosting
 * (with wordCount/articleSection) and a BreadcrumbList graph.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
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
  const heroCover = coverUrl(post.mainImage, 1680, 880);
  const schemaImage = coverUrl(post.mainImage, 1200, 630);
  const wordCount = countBodyWords(post.body);

  // An update stamp only earns editorial real estate once it clears a full
  // day over the publication date, so silent same-day fixes never mislead.
  const updatedDelta = post._updatedAt
    ? new Date(post._updatedAt).getTime() - new Date(post.publishedAt).getTime()
    : NaN;
  const updatedLabel =
    !Number.isNaN(updatedDelta) && updatedDelta > DAY_MS
      ? `Updated ${formatDateCard(post._updatedAt as string)}`
      : null;

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
    image: schemaImage ? [schemaImage] : [],
    datePublished: post.publishedAt,
    dateModified: post._updatedAt || post.publishedAt,
    inLanguage: "en",
    wordCount: wordCount > 0 ? wordCount : undefined,
    articleSection: post.category?.title || undefined,
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
        url: `${siteUrl}/images/marca-ubi-white.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    keywords: post.seo?.keywords?.join(", "),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${siteUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  return (
    <div data-client-shell="true" className={styles.articlePageMain}>
      {/* JSON-LD Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ClientHeader defaultTheme="light" />

      <main id="main-content" className={styles.articleMain} data-header-theme="light">
        <article className={styles.articleContainer}>
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
            <ol className={styles.breadcrumbList}>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              {post.category && (
                <>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page">{post.category.title}</li>
                </>
              )}
            </ol>
          </nav>

          {/* Article Header Band */}
          <header className={styles.articleHeader}>
            {post.category?.title && (
              <span className={styles.kicker}>{post.category.title}</span>
            )}

            <h1 className={styles.articleTitle}>{post.title}</h1>
            <p className={styles.articleStandfirst}>{post.excerpt}</p>

            <div className={styles.metaRow}>
              {post.publishedAt && (
                <time dateTime={post.publishedAt}>{formatDateLong(post.publishedAt)}</time>
              )}
              {readingMinutes > 0 && (
                <>
                  <span className={styles.metaSlash} aria-hidden="true">/</span>
                  <span>{readingMinutes} MIN READ</span>
                </>
              )}
              {updatedLabel && (
                <>
                  <span className={styles.metaSlash} aria-hidden="true">/</span>
                  <span>{updatedLabel}</span>
                </>
              )}
            </div>

            {post.author && (
              <div className={styles.authorRow}>
                {post.author.avatar?.asset?.url && (
                  <span className={styles.authorAvatar}>
                    <Image
                      src={urlFor(post.author.avatar).width(88).height(88).url()}
                      width={44}
                      height={44}
                      alt={post.author.avatar.alt || post.author.name}
                    />
                  </span>
                )}
                <div className={styles.authorDetails}>
                  <span className={styles.authorName}>{post.author.name}</span>
                  <span className={styles.authorRole}>{post.author.role}</span>
                </div>
              </div>
            )}
          </header>

          {/* Cover Plate: full container width, hotspot-aware 1680px crop */}
          {heroCover && (
            <figure className={styles.heroMediaWrap}>
              <div className={styles.heroImageFrame}>
                <Image
                  src={heroCover}
                  alt={post.mainImage?.alt || post.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 1680px"
                />
              </div>
              {post.mainImage?.caption && (
                <figcaption className={styles.heroCaption}>{post.mainImage.caption}</figcaption>
              )}
            </figure>
          )}

          {/* Rail + Body Reading Grid */}
          <div className={styles.readingGrid}>
            <aside className={styles.stickyRail} aria-label="Article contents and sharing">
              <div className={styles.railToc}>
                <TableOfContents blocks={post.body} />
              </div>

              <SocialShareBar title={post.title} url={postUrl} />
            </aside>

            <div className={styles.bodyColumn}>
              <PortableTextRenderer value={post.body} />

              {/* Author Dossier */}
              {post.author && (
                <aside className={styles.authorDossier} aria-label={`About the author ${post.author.name}`}>
                  {post.author.avatar?.asset?.url && (
                    <span className={styles.bioAvatar}>
                      <Image
                        src={urlFor(post.author.avatar).width(128).height(128).url()}
                        width={64}
                        height={64}
                        alt={post.author.avatar.alt || post.author.name}
                      />
                    </span>
                  )}
                  <div className={styles.bioContent}>
                    <span className={styles.bioTag}>Author Dossier</span>
                    <h3 className={styles.bioName}>{post.author.name}</h3>
                    <span className={styles.bioRole}>{post.author.role}</span>
                    {post.author.bio && <p className={styles.bioText}>{post.author.bio}</p>}

                    {post.author.socialLinks && post.author.socialLinks.length > 0 && (
                      <div className={styles.bioSocials}>
                        {post.author.socialLinks.map((link) => (
                          <a
                            key={`${link.platform}-${link.url}`}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span>{link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}</span>
                            <span aria-hidden="true">{"\u2197"}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </aside>
              )}
            </div>
          </div>

          {/* Closing Editorial CTA Row */}
          <div className={styles.ctaRow}>
            <Link href="/start-project" className={styles.ctaLink}>
              Start a conversation
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          {/* Related Dispatches: same card anatomy as the /blog listing grid */}
          {relatedPosts.length > 0 && (
            <section className={styles.relatedSection} aria-labelledby="related-heading">
              <div className={styles.relatedHeader}>
                <h2 id="related-heading" className={styles.relatedTitle}>
                  Related Dispatches
                </h2>
                <Link href="/blog" className={styles.relatedViewAll}>
                  <span>Explore All</span>
                  <span className={styles.arrow} aria-hidden="true">&rarr;</span>
                </Link>
              </div>

              <div className={styles.relatedGrid}>
                {relatedPosts.map((related) => {
                  const cover = coverUrl(related.mainImage, 800, 450);
                  const minutes = related.estimatedReadingTime || 4;

                  return (
                    <article key={related._id} className={styles.relatedCard}>
                      <Link
                        href={`/blog/${related.slug}`}
                        className={styles.relatedImageFrame}
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        {cover ? (
                          <Image
                            src={cover}
                            alt={related.mainImage?.alt || related.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <span className={styles.relatedFallback} aria-hidden="true">
                            {(related.category?.title || related.title).charAt(0)}
                          </span>
                        )}
                      </Link>

                      <div className={styles.relatedMetaRow}>
                        {related.category?.title && (
                          <span className={styles.relatedCategory}>{related.category.title}</span>
                        )}
                        <span className={styles.relatedMetaSlash} aria-hidden="true">/</span>
                        <time dateTime={related.publishedAt}>{formatDateCard(related.publishedAt)}</time>
                        <span className={styles.relatedMetaSlash} aria-hidden="true">/</span>
                        <span>{minutes} MIN READ</span>
                      </div>

                      <h3 className={styles.relatedCardTitle}>
                        <Link href={`/blog/${related.slug}`}>{related.title}</Link>
                      </h3>

                      <p className={styles.relatedExcerpt}>{related.excerpt}</p>

                      <div className={styles.relatedCardFooter}>
                        <Link href={`/blog/${related.slug}`} className={styles.relatedReadLink}>
                          <span>Read</span>
                          <span className={styles.arrow} aria-hidden="true">&rarr;</span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Studio Conversion CTA Banner */}
          <BlogCtaBanner />
        </article>
      </main>

      <MonumentalFooter />
    </div>
  );
}
