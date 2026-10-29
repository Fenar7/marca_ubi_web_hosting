"use client";

import React from "react";
import Link from "next/link";
import styles from "./CareersCutout.module.scss";

export interface CareersCutoutProps {
  kicker?: string;
}

/**
 * Careers Cutout Section.
 * Transparent video cutout section framing the persistent living background video engine.
 * Displays monumental Circular XX headline with signature Brand Red accent dot and dual action triggers:
 * 1. "View Positions →" navigating to /careers.
 * 2. "Kerala Studios →" navigating to /#locations.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function CareersCutout({ kicker }: CareersCutoutProps) {
  return (
    <section
      className={styles.careersCutoutSection}
      id="careers"
      aria-label="Careers and Opportunities at Marca Ubi"
      data-header-theme="dark"
    >
      <div className={styles.stageContainer}>
        {/* Left Column: Kicker & Monumental Typography */}
        <div className={styles.headlineColumn}>
          {kicker ? <span className={styles.kickerBadge}>{kicker}</span> : null}
          <h2 className={styles.monumentalHeadline}>
            Explore<br />
            Careers<span className={styles.brandDot}>.</span>
          </h2>
        </div>

        {/* Right Column: Dual Architectural Action Triggers */}
        <div className={styles.actionColumn}>
          <div className={styles.actionCluster}>
            <Link
              href="/careers"
              className={styles.viewPositionsPill}
              aria-label="View Positions - Explore open roles and career opportunities at Marca Ubi"
            >
              <span className={styles.pillLabel}>View Positions</span>
              <span className={styles.arrowIcon} aria-hidden="true">&rarr;</span>
            </Link>

            <Link
              href="/#locations"
              className={styles.keralaStudiosPill}
              aria-label="Kerala Studios - Explore our Calicut and Trivandrum creative workspaces"
            >
              <span className={styles.pillLabel}>Kerala Studios</span>
              <span className={styles.arrowIcon} aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CareersCutout;
