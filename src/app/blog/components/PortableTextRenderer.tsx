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
      const type = data.type || "note";
      return (
        <aside className={`${styles.calloutCard} ${styles[`callout_${type}`] || ""}`}>
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
              sizes="(max-width: 1024px) 92vw, 72ch"
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
