"use client";

import React, { useState, useEffect } from "react";
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
    city: "Kozhikode",
    code: "CCJ",
    subdivision: "HiLITE Business Park",
    address: "HiLITE Business Park, Kozhikode, Kerala 673014",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=HiLITE+Business+Park%2C+Kozhikode",
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
 * Kozhikode (HiLITE Business Park) and Trivandrum.
 * Pure Swiss typography with tabular numerals and real-time IST clock.
 * Zero AI-slop pills, zero pulsing dots, zero synthetic international hubs.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function GlobalLocationsCloud() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [istTime, setIstTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(now);
        setIstTime(formatted);
      } catch {
        setIstTime("12:00");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className={styles.locationsSection}
      id="network"
      aria-label="Studio Corridors"
      data-header-theme="light"
    >
      <div className={styles.gridContainer}>
        <aside className={styles.leftColumn}>
          <span className={styles.sectionLabel}>07 / Studio Corridors</span>
          <p className={styles.summaryText}>
            Operating across Kerala with permanent studios in Kozhikode and Trivandrum,
            delivering strategic brand architecture and digital flagships.
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

          {/* Synchronized Operational Rail: Pure Swiss typography with tabular numerals */}
          <div className={styles.operationalRail} aria-label="Synchronized Studio Operations">
            <span className={styles.railNode}>
              <span className={styles.railCode}>IST</span>
              <span className={styles.railTime}>{istTime || "12:00"}</span>
              <span className={styles.railAbbr}>UTC+05:30</span>
            </span>

            <span className={styles.railDivider} aria-hidden="true">/</span>

            <span className={styles.railNode}>
              <span className={styles.railCode}>CCJ</span>
              <span className={styles.railText}>HiLITE Business Park, Kozhikode</span>
            </span>

            <span className={styles.railDivider} aria-hidden="true">/</span>

            <span className={styles.railNode}>
              <span className={styles.railCode}>TRV</span>
              <span className={styles.railText}>Creative Studio, Trivandrum</span>
            </span>

            <span className={styles.railDivider} aria-hidden="true">/</span>

            <span className={styles.railNode}>
              <span className={styles.railText}>MON–FRI 09:30–18:30 IST</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GlobalLocationsCloud;
