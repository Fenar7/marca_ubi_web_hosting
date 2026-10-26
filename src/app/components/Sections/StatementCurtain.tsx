"use client";

import React from "react";
import styles from "./StatementCurtain.module.scss";

export interface StatementCurtainProps {
  id?: string;
  statement?: string;
}

const DEFAULT_STATEMENT =
  "Marca Ubi is a creative technology and brand engineering studio that connects ambitious enterprises to the culture, spaces, and audiences that shape the modern world. We build deeper and we design for lasting conviction. Turning products into identities, and identities into institutions.";

/**
 * View 04: Pure White Monumental Statement Curtain.
 *
 * Positioned between ReelCutout (View 03) and WorksCutout (View 05) to restore
 * the authentic 160over90 alternating visual cadence (Cutout -> Curtain -> Cutout -> Curtain).
 *
 * Implements data-header-theme="light" to signal ClientHeader's IntersectionObserver
 * to transition the sticky header typography and MarcaUbiLogo to #0a0a0a (19.8:1 contrast).
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function StatementCurtain({
  id = "statement",
  statement = DEFAULT_STATEMENT,
}: StatementCurtainProps) {
  return (
    <section
      className={styles.statementCurtainSection}
      id={id}
      aria-label="Studio Brand Engineering Statement"
      data-header-theme="light"
    >
      <div className={styles.stageContainer}>
        <div className={styles.statementStage}>
          <h2 className={styles.monumentalStatement}>
            {statement}
          </h2>
        </div>
      </div>
    </section>
  );
}

export default StatementCurtain;
