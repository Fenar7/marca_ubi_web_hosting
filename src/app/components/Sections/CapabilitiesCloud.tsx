"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./CapabilitiesCloud.module.scss";

const DISCIPLINES = [
  "Brand Strategy",
  "Visual Identity Systems",
  "Creative Direction",
  "Culture Marketing",
  "Experiential Production",
  "Digital Infrastructure",
  "Creative Technology",
  "Motion & Cinema",
  "Campaign Architecture",
  "Editorial Systems",
  "High-Growth GTM",
  "Spatial Brand Design",
];

/**
 * View 04: Capabilities & Disciplines Cloud.
 * Solid pure white background (#ffffff) sliding cleanly over the video.
 * Features an editorial Swiss layout with an interactive kinetic slash cloud
 * that illuminates in vibrant #ea002a on hover.
 */
export function CapabilitiesCloud() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section
      className={styles.capabilitiesSection}
      id="capabilities"
      aria-label="Capabilities and Disciplines"
      data-header-theme="light"
    >
      <div className={styles.gridContainer}>
        <aside className={styles.leftColumn}>
          <span className={styles.sectionLabel}>04 / Practice Areas</span>
          <p className={styles.summaryText}>
            A unified creative technology and brand architecture practice. Twelve integrated disciplines operating without departmental siloing.
          </p>
        </aside>

        <div className={styles.rightColumn}>
          <div className={styles.cloudWrapper}>
            {DISCIPLINES.map((discipline, index) => {
              const isSlashActive =
                hoveredIndex === index || (hoveredIndex !== null && hoveredIndex === index + 1);

              return (
                <span key={discipline} className={styles.itemGroup}>
                  <Link
                    href="/start-project"
                    className={styles.disciplineLink}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {discipline}
                  </Link>

                  {index < DISCIPLINES.length - 1 && (
                    <span
                      className={`${styles.slashDivider} ${isSlashActive ? styles.activeSlash : ""}`}
                      aria-hidden="true"
                    >
                      /
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CapabilitiesCloud;
