"use client";

import React from "react";
import styles from "./HeroCutout.module.scss";

export interface HeroCutoutProps {
  headline?: string;
  kicker?: string;
  showScrollCue?: boolean;
}

/**
 * Renders the display headline, isolating the terminal period with an optical space
 * and brand red accent color while preventing line-wrap orphaning.
 *
 * @param text The input headline string, optionally containing newlines and trailing period.
 */
function renderHeadline(text: string) {
  if (text.endsWith(".")) {
    const mainText = text.slice(0, -1);
    const lastSpaceIndex = mainText.lastIndexOf(" ");
    if (lastSpaceIndex !== -1) {
      const beforeLastWord = mainText.slice(0, lastSpaceIndex + 1);
      const lastWord = mainText.slice(lastSpaceIndex + 1);
      return (
        <>
          {beforeLastWord}
          <span className={styles.terminalCluster}>
            {lastWord}
            <span className={styles.accentDot}>.</span>
          </span>
        </>
      );
    }
    return (
      <span className={styles.terminalCluster}>
        {mainText}
        <span className={styles.accentDot}>.</span>
      </span>
    );
  }
  return text;
}

/**
 * View 01: Hero Video Cutout.
 * Pure monumental typography over continuous background video layer.
 * Enforces the 160over90 minimalist aesthetic: zero kicker clutter,
 * zero artificial scroll prompts, and balanced multi-line typographic scale.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function HeroCutout({
  headline = "Engineering Brands\nThat Move The World.",
  kicker,
  showScrollCue = false,
}: HeroCutoutProps) {
  return (
    <section
      className={styles.heroCutoutSection}
      aria-label="Hero Introduction"
      data-header-theme="dark"
    >
      <div className={styles.heroContentStage}>
        {kicker ? <span className={styles.kicker}>{kicker}</span> : null}
        <h1 className={styles.displayHeadline}>{renderHeadline(headline)}</h1>
        {showScrollCue ? (
          <div className={styles.scrollCueCluster} aria-hidden="true">
            <span className={styles.scrollCueLabel}>Scroll to explore</span>
            <span className={styles.scrollHairline} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default HeroCutout;
