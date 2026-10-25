"use client";

import React from "react";
import Link from "next/link";
import styles from "./CareersCutout.module.scss";

/**
 * View 05: Careers / Collaboration Cutout.
 * Transparent viewport revealing the fixed background video.
 * Monumental headline with high-contrast pill link to open opportunities.
 */
export function CareersCutout() {
  return (
    <section className={styles.careersCutoutSection} id="careers" aria-label="Careers at Marca Ubi">
      <div className={styles.contentStage}>
        <span className={styles.kicker}>Join the Collective</span>
        <h2 className={styles.displayHeadline}>Work with us.</h2>
        <p className={styles.leadText}>
          We are persistently scouting architects, computational designers, brand strategists, and creative technologists who reject the generic.
        </p>

        <div className={styles.actionWrapper}>
          <Link
            href="mailto:careers@marcaubi.com?subject=Creative%20Inquiry%20%7C%20Marca%20Ubi"
            className={styles.openPositionsButton}
          >
            <span>Open Positions</span>
            <span className={styles.arrowIcon} aria-hidden="true">&nearr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CareersCutout;
