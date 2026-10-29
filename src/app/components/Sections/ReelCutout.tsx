"use client";

import React from "react";
import Link from "next/link";
import styles from "./ReelCutout.module.scss";

interface ReelCutoutProps {
  onPlayReel?: () => void;
  headline?: string;
}

/**
 * View 03: Showreel & Curated Work Cutout.
 * Transparent viewport revealing the fixed background video.
 * Displays signature 160over90 headline with dual action pills (Play Reel & Explore Work).
 */
export function ReelCutout({
  onPlayReel,
  headline = "Everything you expect. A few things you don't.",
}: ReelCutoutProps) {
  return (
    <section
      className={styles.reelCutoutSection}
      id="work"
      aria-label="Curated Work Showreel"
      data-header-theme="dark"
    >
      <div className={styles.contentStage}>
        <h2 className={styles.statementHeadline}>
          Everything you expect<span className={styles.accentDot}>.</span> A few things you don&apos;t<span className={styles.accentDot}>.</span>
        </h2>

        <div className={styles.actionCluster}>
          <button
            type="button"
            className={styles.playReelButton}
            onClick={onPlayReel}
            aria-label="Play Creative Showreel Video"
          >
            <span>Play Reel</span>
            <span className={styles.playTriangleIcon} aria-hidden="true" />
          </button>

          <Link href="/works" className={styles.exploreWorkAnchor}>
            <span>Explore Selected Work &rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ReelCutout;
