"use client";

import React, { useState } from "react";
import styles from "./GlobalLocationsCloud.module.scss";

interface KeralaStudio {
  city: string;
  code: string;
  subdivision: string;
  address: string;
  mapsUrl: string;
}

const KERALA_STUDIOS: KeralaStudio[] = [
  {
    city: "Calicut",
    code: "CCJ",
    subdivision: "HiLITE Business Park",
    address: "HiLITE Business Park, Calicut, Kerala 673014",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=HiLITE+Business+Park%2C+Calicut",
  },
  {
    city: "Trivandrum",
    code: "TRV",
    subdivision: "Creative Studio",
    address: "Creative Studio, Trivandrum, Kerala",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Trivandrum%2C+Kerala",
  },
];

/**
 * View 09: Studio Corridors & Kerala Operations.
 * Solid pure white curtain (#ffffff) sliding over the living video background.
 * Swiss broadsheet layout featuring authentic Kerala studio coordinates:
 * Calicut (HiLITE Business Park) and Trivandrum.
 * Pure Swiss typography with distributed creators narrative.
 * Zero AI-slop pills, zero pulsing dots, zero synthetic international hubs.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function GlobalLocationsCloud() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section
      className={styles.locationsSection}
      id="network"
      aria-label="Studio Corridors"
      data-header-theme="light"
    >
      <div className={styles.gridContainer}>
        <aside className={styles.leftColumn}>
          <p className={styles.summaryText}>
            Our finest creators and collaborators working across India to deliver top-notch digital assets and creatives.
          </p>
        </aside>

        <div className={styles.rightColumn}>
          <div className={styles.cloudWrapper}>
            {KERALA_STUDIOS.map((studio, index) => {
              const isSlashActive =
                hoveredIndex === index ||
                (hoveredIndex !== null && hoveredIndex === index + 1);

              return (
                <span key={studio.code} className={styles.itemGroup}>
                  <a
                    href={studio.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cityLink}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    aria-label={`View ${studio.city} studio coordinates on Google Maps`}
                  >
                    <span className={styles.cityName}>{studio.city}</span>
                    <span className={styles.citySubdivision}>{studio.subdivision}</span>
                  </a>

                  {index < KERALA_STUDIOS.length - 1 && (
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

export default GlobalLocationsCloud;
