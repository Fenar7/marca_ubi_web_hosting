"use client";

import { useState } from "react";
import styles from "./BlogPostComponents.module.scss";

/**
 * The rail mounts this exactly once, so there is never a second share cluster
 * competing with it. On tablet the surrounding strip flattens the rows through
 * the unhashed `data-share-variant` hook in BlogPost.module.scss.
 */
interface SocialShareBarProps {
  title: string;
  url: string;
}

/**
 * Brand marks are the genuine X and LinkedIn glyphs. Their `d` data is copied
 * verbatim from the simple-icons set (viewBox 0 0 24 24) rather than
 * approximated from memory, so the silhouette is correct. They carry no colour
 * of their own: fill resolves to `currentColor`, letting one CSS rule drive the
 * ink-at-rest to accent-on-hover shift across every row.
 */
function XBrandMark() {
  return (
    <svg
      className={styles.shareBarIcon}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  );
}

function LinkedInBrandMark() {
  return (
    <svg
      className={styles.shareBarIcon}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/**
 * Copy-link is an action, not a brand, so it takes a neutral hand-drawn chain
 * mark rather than a logo: two facing open clips joined by a bar. Stroked with
 * currentColor so it shares the same hover shift as the brand marks, and marked
 * decorative so the button label alone names the action.
 */
function LinkActionMark() {
  return (
    <svg
      className={`${styles.shareBarIcon} ${styles.shareBarIconStroke}`}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9.5 8H8a4 4 0 0 0 0 8h1.5" />
      <path d="M14.5 8H16a4 4 0 0 1 0 8h-1.5" />
      <path d="M9 12h6" />
    </svg>
  );
}

export default function SocialShareBar({ title, url }: SocialShareBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (error) {
      /* Clipboard writes fail on insecure contexts and on denied permissions.
         The control stays honest (aria-live never claims "Copied" without the
         write) and the reason is logged rather than swallowed. */
      console.warn("Article link copy failed:", error);
      setCopied(false);
    }
  };

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  return (
    <div
      className={`${styles.shareBar} ${styles.shareBarStacked}`}
      data-share-variant="stacked"
      role="group"
      aria-label="Share this article"
    >
      <span className={styles.shareBarLabel}>Share</span>
      <div className={styles.shareBarList}>
        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareBarRow}
        >
          <XBrandMark />
          <span className={styles.shareBarText}>Post on X</span>
        </a>

        <a
          href={linkedInShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareBarRow}
        >
          <LinkedInBrandMark />
          <span className={styles.shareBarText}>LinkedIn</span>
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className={`${styles.shareBarRow} ${copied ? styles.shareBarRowCopied : ""}`}
        >
          <LinkActionMark />
          <span className={styles.shareBarText} aria-live="polite">
            {copied ? "Copied" : "Copy link"}
          </span>
        </button>
      </div>
    </div>
  );
}
