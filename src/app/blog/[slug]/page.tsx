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
import type { Author, Post, PostSummary } from "@/sanity/types/blog";
import { calculateReadingTime } from "@/sanity/types/blog";
import { urlFor, coverUrl } from "@/sanity/lib/image";
import PortableTextRenderer from "../components/PortableTextRenderer";
import TableOfContents, { ReadingProgressRule } from "../components/TableOfContents";
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
      title: "Entry not found | Marca Ubi",
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

/**
 * Brand-correct labels for the four author platforms the Sanity schema allows.
 * Capitalising the first letter of the stored key produced "Linkedin" and
 * mislabelled the X profile as "Twitter", so the dossier named none of them
 * correctly.
 */
const AUTHOR_PLATFORM_LABELS: Record<
  NonNullable<Author["socialLinks"]>[number]["platform"],
  string
> = {
  linkedin: "LinkedIn",
  twitter: "X",
  instagram: "Instagram",
  website: "Website",
};

/**
 * The one date formatter for this surface. `en-GB` sentence case ("31 Oct 2026")
 * matches the accepted /blog listing and this page's own word count; a US
 * "Oct 31, 2026" on the article contradicted the archive it links back to.
 */
function formatDateCard(isoString: string): string {
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
 * Editorial Article Reader (light surface).
 * One wide canvas carries breadcrumb, masthead, byline bar, cover plate and a
 * two-zone reading grid: a prose column capped at 85 characters and a sticky
 * right rail. Media, pull quotes and code fill the whole reading column, so the
 * page alternates measure and full width the way print does instead of parking
 * a narrow column in a wide void.
 *
 * Nothing floats into a left gutter. An earlier build reserved 96px beside the
 * prose for a `01`/`02` section counter, which bought the page an empty void and
 * a number that carried no information a heading does not already carry. The
 * rail is gone and the prose takes the width it was sitting in.
 *
 * Covers and related rows flow through coverUrl()'s hotspot-aware crops and
 * JSON-LD pairs BlogPosting (with wordCount/articleSection) and a
 * BreadcrumbList graph.
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
  const heroCover = coverUrl(post.mainImage, 1680, 720);
  const heroLqip = post.mainImage?.asset?.metadata?.lqip;
  const schemaImage = coverUrl(post.mainImage, 1200, 630);
  const wordCount = countBodyWords(post.body);

  // An update stamp only earns editorial real estate once it clears a full
  // day over the publication date, so silent same-day fixes never mislead. The
  // value is the bare date because the row's own label already says "Revised";
  // "Revised / Updated 31 Oct 2026" was a label echoing its own value.
  const updatedDelta = post._updatedAt
    ? new Date(post._updatedAt).getTime() - new Date(post.publishedAt).getTime()
    : NaN;
  const updatedLabel =
    !Number.isNaN(updatedDelta) && updatedDelta > DAY_MS
      ? formatDateCard(post._updatedAt as string)
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
        <article className={styles.articleContainer} data-article-reader="true">
          {/* Breadcrumb ends on the article, not the category: the terminal crumb
              is what tells the reader (and the accessible path) which page they
              are on, and a category here only restated the red kicker. */}
          <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
            <ol className={styles.breadcrumbList}>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{post.title}</li>
            </ol>
          </nav>

          {/* Masthead: lead copy left, compact production ledger flush right.
              The ledger keeps only the two rows that add facts the page does
              not already state (read time, revision). Section restates the red
              kicker, Published restates the byline date and Words contradicted
              the authored read time, so all three are gone from the UI while
              wordCount survives inside the BlogPosting JSON-LD. */}
          <header className={styles.masthead}>
            <div className={styles.mastheadLead}>
              {post.category?.title && (
                <span className={styles.kicker}>{post.category.title}</span>
              )}

              <h1 className={styles.articleTitle}>{post.title}</h1>
              <p className={styles.articleStandfirst}>{post.excerpt}</p>
            </div>

            <dl className={styles.specStack}>
              {readingMinutes > 0 && (
                <div className={styles.specItem}>
                  <dt className={styles.specLabel}>Read time</dt>
                  <dd className={styles.specValue}>{readingMinutes} min</dd>
                </div>
              )}
              {updatedLabel && (
                <div className={styles.specItem}>
                  <dt className={styles.specLabel}>Last revised</dt>
                  <dd className={styles.specValue}>{updatedLabel}</dd>
                </div>
              )}
            </dl>
          </header>

          {/* Byline bar: authorship only. Sharing lives in the rail as a single
              affordance so the article never mounts two share clusters. */}
          {post.author && (
            <div className={styles.bylineBar}>
              <div className={styles.bylinePerson}>
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
            </div>
          )}

          {/* Cover Plate: full container width, hotspot-aware 21/9 letterbox */}
          {heroCover && (
            <figure className={styles.heroMediaWrap}>
              <div className={styles.heroImageFrame}>
                <Image
                  src={heroCover}
                  alt={post.mainImage?.alt || post.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, min(1680px, 100vw)"
                  {...(heroLqip ? { placeholder: "blur" as const, blurDataURL: heroLqip } : {})}
                />
              </div>
              {post.mainImage?.caption && (
                <div className={styles.heroCaptionBand}>
                  <figcaption className={styles.heroCaption}>{post.mainImage.caption}</figcaption>
                </div>
              )}
            </figure>
          )}

          {/* Reading grid: prose measure on the left, sticky rail on the right. */}
          <div className={styles.readingGrid}>
            <div className={styles.bodyColumn} data-article-prose="true">
              <PortableTextRenderer value={post.body} />
            </div>

            <aside className={styles.stickyRail} aria-label="Article contents and sharing">
              <div className={styles.railProgress}>
                <ReadingProgressRule />
              </div>

              <div className={styles.railToc}>
                <TableOfContents blocks={post.body} />
              </div>

              <div className={styles.railShare}>
                <SocialShareBar title={post.title} url={postUrl} />
              </div>

              {/* No "next entry" card: it was fed by relatedPosts[0], the very
                  first row the "More from the journal" ledger below renders, so
                  the same title, meta and excerpt appeared twice in one page
                  view. The rail now carries only what is unique to it -
                  progress, contents, sharing. */}
            </aside>
          </div>

          {/* Closing editorial CTA row removed: the commissions banner below is
              the single call to action, so no lone "Start a conversation" link
              doubles it. */}

          {/* Author Dossier: bio left, kicker and socials right */}
          {post.author && (
            <aside
              className={styles.authorDossier}
              aria-label={`About the author ${post.author.name}`}
            >
              <div className={styles.dossierBio}>
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
                  <h3 className={styles.bioName}>{post.author.name}</h3>
                  <span className={styles.bioRole}>{post.author.role}</span>
                  {post.author.bio && <p className={styles.bioText}>{post.author.bio}</p>}
                </div>
              </div>

              <div className={styles.dossierAside}>
                <span className={styles.bioTag}>Author dossier</span>

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

          {/* Studio Conversion CTA Banner */}
          <BlogCtaBanner />

          {/* Journal ledger: full-width hairline rows using the listing anatomy */}
          {relatedPosts.length > 0 && (
            <section className={styles.relatedSection} aria-labelledby="related-heading">
              <div className={styles.relatedHeader}>
                <h2 id="related-heading" className={styles.relatedTitle}>
                  More from the journal
                </h2>
                <Link href="/blog" className={styles.relatedViewAll}>
                  <span>All entries</span>
                  <span className={styles.arrow} aria-hidden="true">&rarr;</span>
                </Link>
              </div>

              <ol className={styles.relatedLedger}>
                {relatedPosts.map((related, index) => {
                  return (
                    <li key={related._id} className={styles.ledgerRow}>
                      <Link href={`/blog/${related.slug}`} className={styles.ledgerLink}>
                        <span className={styles.ledgerNumeral} aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className={styles.ledgerBody}>
                          <span className={styles.ledgerMeta}>
                            {related.category?.title && (
                              <span className={styles.ledgerCategory}>{related.category.title}</span>
                            )}
                            <span className={styles.relatedMetaSlash} aria-hidden="true">/</span>
                            <time dateTime={related.publishedAt}>
                              {formatDateCard(related.publishedAt)}
                            </time>
                            {/* A summary row carries no body, so a duration here can
                                only ever be invented. Shown when Sanity authored one,
                                omitted when it did not. */}
                            {related.estimatedReadingTime ? (
                              <>
                                <span className={styles.relatedMetaSlash} aria-hidden="true">/</span>
                                <span>{related.estimatedReadingTime} min</span>
                              </>
                            ) : null}
                          </span>

                          <h3 className={styles.ledgerTitle}>
                            <span className={styles.ledgerTitleText}>{related.title}</span>
                          </h3>

                          <span className={styles.ledgerExcerpt}>{related.excerpt}</span>
                        </span>

                        <span className={styles.ledgerArrow} aria-hidden="true">
                          &rarr;
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </article>
      </main>

      <MonumentalFooter />
    </div>
  );
}

/**
 * Mirrors calculateReadingTime's extraction so BlogPosting.wordCount reflects
 * the exact prose the reader sees (block children only; images, code blocks
 * and callouts carry no visible paragraph text and are excluded upstream).
 */
interface RawBodyBlock {
  _type?: string;
  type?: string;
  caption?: string;
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
