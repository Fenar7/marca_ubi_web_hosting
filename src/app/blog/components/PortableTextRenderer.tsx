/**
 * @file src/app/blog/components/PortableTextRenderer.tsx
 * @description Master Portable Text React renderer for Marca Ubi editorial dispatches.
 *              Implements the dark luxury visual hierarchy with custom renderers for:
 *              - Headings (H2 with slugified anchors, H3, H4)
 *              - Editorial Callouts (Note, Principle, Warning)
 *              - Hotspot-optimized and LQIP-blurred figures
 *              - Syntax-highlighted code blocks
 *              - GEO Block 1: Structured Comparison Tables with scroll frames
 *              - GEO Block 2: Executive Summary & Direct Answer Boxes
 *              - GEO Block 3: Verifiable Metric & Stat Callout Cards
 *              - GEO Block 4: In-Body Accordion FAQ Sections
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from "react";
import { PortableText, type PortableTextComponents, type PortableTextBlock } from "next-sanity";
import Link from "next/link";
import Image from "next/image";
import { urlFor, coverUrl } from "@/sanity/lib/image";
import { slugify } from "@/app/blog/lib/slugify";
import type { SanityImageReference } from "@/sanity/types/blog";
import styles from "./PortableTextRenderer.module.scss";

interface ChildSpan {
  text?: string;
  _type?: string;
}

/**
 * Portable Text block payload for the studio callout object type. `type`
 * selects one of the three rendered variants (note / principle / warning);
 * unknown values fall back to the neutral note wash rather than rendering
 * dead markup.
 */
interface CalloutValue {
  type?: string;
  title?: string;
  content?: string;
}

/** Code Block object payload: filename/lang drive the frame header only. */
interface CodeBlockValue {
  filename?: string;
  language?: string;
  code?: string;
}

/** GEO Comparison Table payload */
interface ComparisonTableValue {
  title?: string;
  caption?: string;
  headers?: string[];
  rows?: Array<{
    _key?: string;
    cells?: string[];
  }>;
}

/** GEO Executive Summary payload */
interface ExecutiveSummaryValue {
  title?: string;
  content?: string;
  keyTakeaways?: string[];
}

/** GEO Stat Callout payload */
interface StatCalloutValue {
  value?: string;
  label?: string;
  description?: string;
  sourceCitation?: string;
}

/** GEO In-Body FAQ Section payload */
interface FaqSectionValue {
  title?: string;
  items?: Array<{
    _key?: string;
    question?: string;
    answer?: string;
  }>;
}

/**
 * Studio callout variants. The class names are resolved from this literal set
 * instead of a computed `callout_${type}` key: CSS Modules camelCase the
 * exported names, so a bracket lookup on the underscored original silently
 * returned undefined and every callout rendered unvariant.
 */
type CalloutVariant = "note" | "principle" | "warning";

function resolveCalloutVariant(type?: string): CalloutVariant {
  if (type === "principle" || type === "warning") return type;
  return "note";
}

/**
 * Extracts the plain heading text from a block so the anchor id can be
 * stamped identically to the TableOfContents resolver. Both sides import
 * slugify from @/app/blog/lib/slugify: drift between the two silently breaks
 * every in-page jump link.
 */
function headingText(value: { children?: unknown } | undefined): string {
  const spans = (value?.children || []) as ChildSpan[];
  return spans.map((c) => c.text || "").join("");
}

export const portableTextComponents: PortableTextComponents = {
  block: {
    h2: ({ children, value, index }) => {
      const id = slugify(headingText(value), index);
      return (
        <h2 id={id} className={styles.heading2}>
          <a href={`#${id}`} className={styles.headingAnchor}>
            {children}
            <span className={styles.anchorSymbol} aria-hidden="true">#</span>
          </a>
        </h2>
      );
    },
    /* h3 carries the same slugified id so a future multi-level TOC resolves
       against real anchors, but stays visually quiet (no self-link marker). */
    h3: ({ children, value, index }) => {
      const id = slugify(headingText(value), index);
      return (
        <h3 id={id} className={styles.heading3}>
          {children}
        </h3>
      );
    },
    h4: ({ children }) => <h4 className={styles.heading4}>{children}</h4>,
    normal: ({ children }) => <p className={styles.paragraph}>{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className={styles.blockquote}>
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className={styles.bulletList}>{children}</ul>,
    number: ({ children }) => <ol className={styles.numberedList}>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className={styles.listItem}>{children}</li>,
    number: ({ children }) => <li className={styles.listItem}>{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className={styles.strongText}>{children}</strong>,
    em: ({ children }) => <em className={styles.emText}>{children}</em>,
    underline: ({ children }) => <span className={styles.underlineText}>{children}</span>,
    code: ({ children }) => <code className={styles.inlineCode}>{children}</code>,
    link: ({ value, children }) => {
      const href = value?.href || "#";
      const isExternal = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//");
      const isProtocolLink = href.startsWith("mailto:") || href.startsWith("tel:");

      if (isExternal || isProtocolLink) {
        return (
          <a
            href={href}
            target={isExternal && value?.blank !== false ? "_blank" : undefined}
            rel={isExternal && value?.blank !== false ? "noopener noreferrer" : undefined}
            className={styles.articleLink}
          >
            {children}
            {isExternal && (
              <span className={styles.linkArrowIcon} aria-hidden="true">{"\u2197"}</span>
            )}
          </a>
        );
      }
      return (
        <Link href={href} className={styles.articleLink}>
          {children}
        </Link>
      );
    },
  },
  types: {
    callout: ({ value }) => {
      const data = (value || {}) as CalloutValue;
      const variant = resolveCalloutVariant(data.type);
      const variantClass =
        variant === "principle"
          ? styles.calloutPrinciple
          : variant === "warning"
            ? styles.calloutWarning
            : styles.calloutNote;

      return (
        <aside className={`${styles.calloutCard} ${variantClass}`}>
          <div className={styles.calloutHeader}>
            <span className={styles.calloutDot} aria-hidden="true" />
            <p className={styles.calloutTitle}>{data.title || "Studio Insight"}</p>
          </div>
          <div className={styles.calloutBody}>
            <p>{data.content}</p>
          </div>
        </aside>
      );
    },
    /* In-body imagery goes through the same hotspot-aware crop pipeline as
       the covers (raw Sanity originals were shipping multi-MB <img> tags),
       with the authored lqip as the blur-up placeholder when present. */
    image: ({ value }) => {
      const source = value as SanityImageReference | undefined;
      if (!source?.asset?.url) return null;
      const src = coverUrl(source, 1200, 800) ?? urlFor(source).width(1200).url();
      const lqip = source.asset.metadata?.lqip;
      return (
        <figure className={styles.figure}>
          <div className={styles.imageWrap}>
            <Image
              src={src}
              alt={source.alt || "Article visual"}
              width={1200}
              height={800}
              sizes="(max-width: 1024px) 92vw, 60rem"
              loading="lazy"
              className={styles.contentImage}
              {...(lqip ? { placeholder: "blur" as const, blurDataURL: lqip } : {})}
            />
          </div>
          {source.caption && <figcaption className={styles.figcaption}>{source.caption}</figcaption>}
        </figure>
      );
    },
    codeBlock: ({ value }) => {
      const data = (value || {}) as CodeBlockValue;
      return (
        <div className={styles.codeContainer}>
          {(data.filename || data.language) && (
            <div className={styles.codeHeader}>
              <span className={styles.codeFilename}>{data.filename || ""}</span>
              {data.language && <span className={styles.codeLang}>{data.language}</span>}
            </div>
          )}
          <pre className={styles.pre}>
            <code>{data.code}</code>
          </pre>
        </div>
      );
    },

    // ── GEO Block 1: Structured Comparison Table
    comparisonTable: ({ value }) => {
      const data = (value || {}) as ComparisonTableValue;
      if (!data.headers || data.headers.length === 0) return null;
      return (
        <div className={styles.tableWrapper}>
          {data.title && <h4 className={styles.tableTitle}>{data.title}</h4>}
          <div className={styles.tableScrollFrame}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  {data.headers.map((header, idx) => (
                    <th key={idx} scope="col">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.rows || []).map((row, rIdx) => (
                  <tr key={row._key || rIdx}>
                    {(row.cells || []).map((cell, cIdx) => (
                      <td key={cIdx}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.caption && <p className={styles.tableCaption}>{data.caption}</p>}
        </div>
      );
    },

    // ── GEO Block 2: Executive Summary / Direct Answer Box
    executiveSummary: ({ value }) => {
      const data = (value || {}) as ExecutiveSummaryValue;
      if (!data.content) return null;
      return (
        <aside className={styles.executiveSummaryCard} aria-label="Executive Summary">
          <div className={styles.executiveSummaryKicker}>
            <span className={styles.kickerDot} aria-hidden="true" />
            <span className={styles.kickerText}>EXECUTIVE THESIS // STRATEGIC SUMMARY</span>
          </div>
          {data.title && <h3 className={styles.executiveSummaryTitle}>{data.title}</h3>}
          <p className={styles.executiveSummaryText}>{data.content}</p>
          {Array.isArray(data.keyTakeaways) && data.keyTakeaways.length > 0 && (
            <div className={styles.takeawaysSection}>
              <p className={styles.takeawaysHeading}>Key Strategic Takeaways</p>
              <ul className={styles.takeawaysList}>
                {data.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className={styles.takeawayItem}>
                    <span className={styles.takeawayMarker} aria-hidden="true">
                      {"\u2014"}
                    </span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      );
    },

    // ── GEO Block 3: Verifiable Stat Callout
    statCallout: ({ value }) => {
      const data = (value || {}) as StatCalloutValue;
      if (!data.value || !data.label) return null;
      return (
        <div className={styles.statCalloutCard}>
          <div className={styles.statMetricRow}>
            <span className={styles.statMetricValue}>{data.value}</span>
            <span className={styles.statMetricBadge}>VERIFIED METRIC</span>
          </div>
          <p className={styles.statMetricLabel}>{data.label}</p>
          {data.description && (
            <p className={styles.statMetricDescription}>{data.description}</p>
          )}
          {data.sourceCitation && (
            <div className={styles.statSourceRow}>
              <span className={styles.statSourceTag}>SOURCE</span>
              <span className={styles.statSourceText}>{data.sourceCitation}</span>
            </div>
          )}
        </div>
      );
    },

    // ── GEO Block 4: In-Body Accordion FAQ Section
    faqSection: ({ value }) => {
      const data = (value || {}) as FaqSectionValue;
      const items = (data.items || []).filter((item) => item.question && item.answer);
      if (items.length === 0) return null;
      return (
        <section
          className={styles.faqSection}
          aria-label={data.title || "Frequently Asked Questions"}
        >
          <h3 className={styles.faqSectionTitle}>{data.title || "Frequently Asked Questions"}</h3>
          <div className={styles.faqList}>
            {items.map((item, idx) => (
              <details key={item._key || idx} className={styles.faqItem}>
                <summary className={styles.faqSummary}>
                  <span className={styles.faqQuestion}>{item.question}</span>
                  <span className={styles.faqChevron} aria-hidden="true" />
                </summary>
                <div className={styles.faqAnswer}>
                  <p>{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      );
    },
  },
};

export default function PortableTextRenderer({ value }: { value: PortableTextBlock[] }) {
  if (!value) return null;
  return (
    <div className={styles.articleContent}>
      <PortableText value={value} components={portableTextComponents} />
    </div>
  );
}
