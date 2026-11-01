"use client";

import { useState } from "react";
import styles from "./BlogPostComponents.module.scss";

interface SocialShareBarProps {
  title: string;
  url: string;
  /**
   * stacked = the rail's vertical hairline text-link list (default)
   * inline  = same links laid on one row, for the tablet strip
   * The article mounts this exactly once, so there is never a second share
   * cluster competing with it.
   */
  variant?: "inline" | "stacked";
}

export default function SocialShareBar({
  title,
  url,
  variant = "stacked",
}: SocialShareBarProps) {
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
      className={`${styles.shareContainer} ${variant === "inline" ? styles.shareInline : styles.shareStacked}`}
      data-share-variant={variant}
      role="group"
      aria-label="Share this article"
    >
      <p className={styles.shareTitle}>Share</p>
      <div className={styles.shareLinks}>
        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareLink}
        >
          Post on X
        </a>

        <a
          href={linkedInShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareLink}
        >
          LinkedIn
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className={`${styles.shareLink} ${copied ? styles.copiedLink : ""}`}
        >
          <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
        </button>
      </div>
    </div>
  );
}
