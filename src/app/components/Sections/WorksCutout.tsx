"use client";

import React from "react";
import Link from "next/link";
import styles from "./WorksCutout.module.scss";

export interface WorksCutoutProps {
  kicker?: string;
  headline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onOpenBrief?: () => void;
}

/**
 * View 04: Flagship Works Cutout Section.
 * Replaces the inline works curtain with a cinematic, high-contrast video cutout.
 * The transparent background allows the persistent living background video to show through.
 * Features monumental Circular XX headline and dual action triggers:
 * 1. "Start a Project" pill opening the multi-step brief modal.
 * 2. "View Works" pill navigating to /works.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function WorksCutout({
  kicker,
  headline = "Work\nwith us.",
  ctaLabel = "View Works",
  ctaHref = "/works",
  onOpenBrief,
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
          {kicker ? <span className={styles.kickerBadge}>{kicker}</span> : null}
          <h2 className={styles.monumentalHeadline}>
            {headlineLines.map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx < headlineLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </h2>
        </div>

        {/* Right Column: Dual Architectural Action Triggers */}
        <div className={styles.actionColumn}>
          <div className={styles.actionCluster}>
            {onOpenBrief ? (
              <button
                type="button"
                onClick={onOpenBrief}
                className={styles.startProjectPill}
                aria-label="Start a Project Brief"
              >
                <span className={styles.pillLabel}>Start a Project</span>
                <span className={styles.arrowIcon} aria-hidden="true">&rarr;</span>
              </button>
            ) : (
              <Link
                href="/start-project"
                className={styles.startProjectPill}
                aria-label="Start a Project Brief"
              >
                <span className={styles.pillLabel}>Start a Project</span>
                <span className={styles.arrowIcon} aria-hidden="true">&rarr;</span>
              </Link>
            )}

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
      </div>
    </section>
  );
}

export default WorksCutout;
