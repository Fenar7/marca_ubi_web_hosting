"use client";

import React from "react";
import styles from "./HeroCutout.module.scss";

interface HeroCutoutProps {
  headline?: string;
  kicker?: string;
}

/**
 * View 01: Hero Video Cutout.
 * Transparent viewport revealing the fixed background video.
 * Monumental typography with subtle contrast protection and minimal scroll cue.
 */
export function HeroCutout({
  headline = "Engineering Brands That Move The World.",
  kicker = "Strategic Brand Architecture & Cultural Velocity",
}: HeroCutoutProps) {
  return (
    <section
      className={styles.heroCutoutSection}
      aria-label="Hero Introduction"
      data-header-theme="dark"
    >
      <div className={styles.heroContentStage}>
        <span className={styles.kicker}>{kicker}</span>
        <h1 className={styles.displayHeadline}>{headline}</h1>
        <div className={styles.scrollCueCluster} aria-hidden="true">
          <span className={styles.scrollCueLabel}>Scroll to explore</span>
          <span className={styles.scrollHairline} />
        </div>
      </div>
    </section>
  );
}

export default HeroCutout;
