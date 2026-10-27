"use client";

import React from "react";
import Link from "next/link";
import styles from "./WorksCutout.module.scss";

export interface WorksCutoutProps {
  kicker?: string;
  headline?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * View 04: Flagship Works Cutout Section.
 * Replaces the inline works curtain with a cinematic, high-contrast video cutout.
 * The transparent background allows the persistent living background video to show through.
 * Features monumental Circular XX headline and an outline pill button navigating to /works.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function WorksCutout({
  kicker = "02 / Selected Works",
  headline = "Work\nwith us.",
  ctaLabel = "View Works",
  ctaHref = "/works",
}: WorksCutoutProps) {
  const headlineLines = headline.split("\n");

  return (
    <section
      className={styles.worksCutoutSection}
      id="works"
      aria-label="Selected Works Showcase Introduction"
      data-header-theme="dark"
    >
      <div className={styles.stageContainer}>
        {/* Left Column: Kicker & Monumental Typography */}
        <div className={styles.headlineColumn}>
          <span className={styles.kickerBadge}>{kicker}</span>
          <h2 className={styles.monumentalHeadline}>
            {headlineLines.map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx < headlineLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </h2>
        </div>

        {/* Right Column: Outline Pill Action Button */}
        <div className={styles.actionColumn}>
          <Link
            href={ctaHref}
            className={styles.viewWorksPill}
            aria-label={`${ctaLabel} - Explore complete portfolio of case studies`}
          >
            <span className={styles.pillLabel}>{ctaLabel}</span>
            <span className={styles.arrowIcon} aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default WorksCutout;
