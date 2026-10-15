import { PortableText, type PortableTextComponents, type PortableTextBlock } from "next-sanity";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";
import styles from "./PortableTextRenderer.module.scss";

export function slugify(text: string, index?: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
  return slug || `heading-${index ?? 0}`;
}

export const portableTextComponents: PortableTextComponents = {
  block: {
    h2: ({ children, value, index }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = value?.children?.map((c: any) => c.text).join("") || "";
      const id = slugify(text, index);
      return (
        <h2 id={id} className={styles.heading2}>
          <a href={`#${id}`} className={styles.headingAnchor}>
            {children}
            <span className={styles.anchorSymbol} aria-hidden="true">#</span>
          </a>
        </h2>
      );
    },
    h3: ({ children, value, index }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = value?.children?.map((c: any) => c.text).join("") || "";
      const id = slugify(text, index);
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
              <img
                src="/hero/primary-arrow.png"
                alt=""
                width={12}
                height={12}
                className={styles.linkArrowIcon}
                aria-hidden="true"
              />
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
      const type = value?.type || "note";
      return (
        <aside className={`${styles.calloutCard} ${styles[`callout_${type}`] || ""}`}>
          <div className={styles.calloutHeader}>
            <span className={styles.calloutDot} aria-hidden="true" />
            <p className={styles.calloutTitle}>{value?.title || "Studio Insight"}</p>
          </div>
          <p className={styles.calloutContent}>{value?.content}</p>
        </aside>
      );
    },
    image: ({ value }) => {
      const url = value?.asset?.url || (value?.asset ? urlFor(value).url() : null);
      if (!url) return null;
      return (
        <figure className={styles.figure}>
          <div className={styles.imageWrap}>
            <img
              src={url}
              alt={value.alt || "Article visual"}
              className={styles.contentImage}
              loading="lazy"
            />
          </div>
          {value.caption && <figcaption className={styles.figcaption}>{value.caption}</figcaption>}
        </figure>
      );
    },
    codeBlock: ({ value }) => {
      return (
        <div className={styles.codeContainer}>
          {(value?.filename || value?.language) && (
            <div className={styles.codeHeader}>
              <span className={styles.codeFilename}>{value?.filename || ""}</span>
              {value?.language && <span className={styles.codeLang}>{value.language}</span>}
            </div>
          )}
          <pre className={styles.pre}>
            <code>{value?.code}</code>
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
