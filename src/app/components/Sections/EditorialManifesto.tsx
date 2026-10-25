"use client";

import React from "react";
import styles from "./EditorialManifesto.module.scss";

/**
 * View 02: Editorial Manifesto Curtain.
 * Solid pure white background (#ffffff) sliding cleanly over the fixed video layer.
 * Swiss asymmetric 30/70 grid presenting agency doctrine and commercial strategy.
 */
export function EditorialManifesto() {
  return (
    <section className={styles.manifestoSection} id="manifesto" aria-label="Agency Manifesto">
      <div className={styles.gridContainer}>
        <aside className={styles.leftColumn}>
          <span className={styles.sectionLabel}>01 / Manifesto</span>
          <span className={styles.subKicker}>A declaration of agency doctrine.</span>
        </aside>

        <div className={styles.rightColumn}>
          <h2 className={styles.statementHeadline}>
            We live at the collision of culture and commerce. Where brand identity ceases to be decoration and becomes an operating system for commercial influence.
          </h2>

          <p className={styles.doctrineBody}>
            In an era of synthetic sameness and algorithmic dilution, enduring resonance cannot be stumbled upon. It must be engineered. We partner with founders, institutions, and category pioneers to design brand systems that do not merely participate in contemporary culture; they define it.
          </p>
        </div>
      </div>
    </section>
  );
}

export default EditorialManifesto;
