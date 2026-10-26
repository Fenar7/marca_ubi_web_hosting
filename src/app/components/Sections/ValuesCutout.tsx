"use client";

import React from "react";
import styles from "./ValuesCutout.module.scss";

interface ValueCard {
  number: string;
  title: string;
  statement: string;
}

const VALUES: ValueCard[] = [
  {
    number: "01",
    title: "Thought Before Form",
    statement: "We do not begin with style. We begin with what the brand means and what it needs to become in culture.",
  },
  {
    number: "02",
    title: "Art With Intention",
    statement: "Color, motion, typography, and imagery are chosen to command attention and create emotion, not decoration.",
  },
  {
    number: "03",
    title: "Experiences That Pull People In",
    statement: "We design for emotional, participatory, and immersive connection rather than passive consumer viewing.",
  },
  {
    number: "04",
    title: "Built, Not Improvised",
    statement: "Enduring commercial work comes from structure, rigor, and technical systems that hold long after launch.",
  },
];

/**
 * View 05: Guiding Principles & Philosophy Cutout.
 * Transparent cutout exposing the living background video layer.
 * Enforces Apple HIG Vibrancy glass cards on an obsidian viewport.
 * Marked with data-header-theme="dark" for white logo/header text.
 */
export function ValuesCutout() {
  return (
    <section
      className={styles.valuesSection}
      id="values"
      aria-label="Guiding Principles and Philosophy"
      data-header-theme="dark"
    >
      <div className={styles.container}>
        {/* Header Stage */}
        <header className={styles.sectionHeader}>
          <span className={styles.kicker}>03 / Guiding Principles</span>
          <h2 className={styles.headline}>What Shapes The Way We Build</h2>
          <p className={styles.subtext}>
            Marca Ubi is guided by a clear belief: enduring brands are built with unwavering intent, never assembled through disconnected compromise.
          </p>
        </header>

        {/* 4 Architectural Glass Fluid Cards */}
        <div className={styles.cardsGrid}>
          {VALUES.map((item) => (
            <article key={item.number} className={styles.valueCard}>
              <div className={styles.cardHeader}>
                <span className={styles.valueNumber}>{item.number}</span>
                <span className={styles.dividerLine} aria-hidden="true" />
              </div>
              <h3 className={styles.valueTitle}>{item.title}</h3>
              <p className={styles.valueStatement}>{item.statement}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ValuesCutout;
