"use client";

import React from "react";
import styles from "../Contact.module.scss";

interface StudioLocation {
  city: string;
  subhead: string;
  lines: string[];
  directionsUrl: string;
}

const STUDIOS: StudioLocation[] = [
  {
    city: "Calicut",
    subhead: "Global Headquarters",
    lines: [
      "Level 4, HiLITE Business Park,",
      "Hilite City, Poovangal,",
      "Kozhikode, Kerala 673014",
    ],
    directionsUrl: "https://maps.google.com/?q=HiLITE+Business+Park+Calicut",
  },
  {
    city: "Trivandrum",
    subhead: "Creative Technology Studio",
    lines: [
      "Technopark Phase III, Kulathoor,",
      "Trivandrum, Kerala 695583",
    ],
    directionsUrl: "https://maps.google.com/?q=Technopark+Phase+III+Trivandrum",
  },
];

/**
 * Clean Studio Location Cards.
 * Implements Whoa Mama benchmark (Screenshot 155756):
 * Crisp, understated cards with city name, physical address, and underlined 'Get Directions'.
 * Completely purged of AI dashboard gimmicks (zero ticking clocks, zero pulsing status dots).
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function StudioCards() {
  return (
    <div className={styles.studioCardsStack}>
      {STUDIOS.map((studio) => (
        <div key={studio.city} className={styles.studioCard}>
          <h3 className={styles.studioCity}>{studio.city}</h3>
          <p className={styles.studioSubhead}>{studio.subhead}</p>
          <address className={styles.studioAddress}>
            {studio.lines.map((line, idx) => (
              <span key={idx} className={styles.addressLine}>
                {line}
              </span>
            ))}
          </address>
          <a
            href={studio.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.directionsLink}
          >
            Get Directions
          </a>
        </div>
      ))}

      {/* Direct Contact Desks */}
      <div className={styles.directDeskCard}>
        <h4 className={styles.directDeskTitle}>Direct Desks</h4>
        <div className={styles.directDeskLinks}>
          <a href="mailto:hello@marcaubi.com" className={styles.directLink}>
            hello@marcaubi.com
          </a>
          <a href="tel:+917012052472" className={styles.directLink}>
            +91 7012 052 472
          </a>
          <a href="mailto:press@marcaubi.com" className={styles.directLink}>
            press@marcaubi.com
          </a>
        </div>
      </div>
    </div>
  );
}
