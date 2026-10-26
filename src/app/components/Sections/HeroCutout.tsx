"use client";

import React from "react";
import styles from "./HeroCutout.module.scss";

export interface HeroCutoutProps {
  headline?: string;
  kicker?: string;
  showScrollCue?: boolean;
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
        <h1 className={styles.displayHeadline}>{headline}</h1>
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
