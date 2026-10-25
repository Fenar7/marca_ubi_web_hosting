"use client";

import React, { useState, useEffect } from "react";
import styles from "./GlobalLocationsCloud.module.scss";

interface StudioCity {
  name: string;
  code: string;
  timezone: string;
  tzAbbr: string;
}

const CITIES: StudioCity[] = [
  { name: "Dubai", code: "DXB", timezone: "Asia/Dubai", tzAbbr: "GST" },
  { name: "London", code: "LON", timezone: "Europe/London", tzAbbr: "GMT" },
  { name: "Bengaluru", code: "BLR", timezone: "Asia/Kolkata", tzAbbr: "IST" },
  { name: "New York", code: "NYC", timezone: "America/New_York", tzAbbr: "EST" },
  { name: "Singapore", code: "SIN", timezone: "Asia/Singapore", tzAbbr: "SGT" },
  { name: "Tokyo", code: "TYO", timezone: "Asia/Tokyo", tzAbbr: "JST" },
  { name: "Los Angeles", code: "LAX", timezone: "America/Los_Angeles", tzAbbr: "PST" },
];

/**
 * View 09: Global Studio Footprint & Synchronized Operations.
 * Solid pure white curtain (#ffffff) sliding over the living video background.
 * Swiss broadsheet layout with kinetic city typography and a quiet tabular operational rail.
 * Zero AI-slop pills, zero pulsing dots, zero radar animations.
 */
export function GlobalLocationsCloud() {
  const [hoveredCityIndex, setHoveredCityIndex] = useState<number | null>(null);
  const [timeStrings, setTimeStrings] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateTimes = () => {
      const times: Record<string, string> = {};
      const now = new Date();
      CITIES.forEach((c) => {
        try {
          times[c.code] = new Intl.DateTimeFormat("en-US", {
            timeZone: c.timezone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(now);
        } catch {
          times[c.code] = "--:--";
        }
      });
      setTimeStrings(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className={styles.locationsSection}
      id="network"
      aria-label="Global Studio Network"
      data-header-theme="light"
    >
      <div className={styles.gridContainer}>
        <aside className={styles.leftColumn}>
          <span className={styles.sectionLabel}>07 / Studio Footprint</span>
          <p className={styles.summaryText}>
            Operating across synchronized hubs to deliver continuous strategic, creative, and technical momentum.
          </p>
        </aside>

        <div className={styles.rightColumn}>
          <div className={styles.cloudWrapper}>
            {CITIES.map((city, index) => {
              const isSlashActive =
                hoveredCityIndex === index ||
                (hoveredCityIndex !== null && hoveredCityIndex === index + 1);

              return (
                <span key={city.code} className={styles.itemGroup}>
                  <button
                    type="button"
                    className={styles.cityButton}
                    onMouseEnter={() => setHoveredCityIndex(index)}
                    onMouseLeave={() => setHoveredCityIndex(null)}
                    aria-label={`${city.name} studio time`}
                  >
                    {city.name}
                  </button>

                  {index < CITIES.length - 1 && (
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
          <div className={styles.operationalRail} aria-label="Synchronized Studio Clocks">
            {CITIES.map((city, index) => {
              const isHovered = hoveredCityIndex === index;
              return (
                <span
                  key={`rail-${city.code}`}
                  className={`${styles.railNode} ${isHovered ? styles.railNodeActive : ""}`}
                >
                  <span className={styles.railCode}>{city.code}</span>
                  <span className={styles.railTime}>{timeStrings[city.code] || "12:00"}</span>
                  <span className={styles.railAbbr}>{city.tzAbbr}</span>
                  {index < CITIES.length - 1 && (
                    <span className={styles.railDivider} aria-hidden="true">
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
