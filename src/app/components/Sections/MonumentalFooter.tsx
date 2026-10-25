"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./MonumentalFooter.module.scss";

const NAV_LINKS = [
  { label: "Manifesto", href: "/#manifesto" },
  { label: "Selected Work", href: "/#work" },
  { label: "Capabilities", href: "/#capabilities" },
  { label: "Careers", href: "/#careers" },
  { label: "Global Network", href: "/#network" },
  { label: "Connect", href: "/#connect" },
];

/**
 * View 08: Deep Black Monumental Footer.
 * Solid Obsidian Black (#000000) monolithic anchor.
 * Anthem statement, giant vector wordmark, and 4-column operational directory.
 */
export function MonumentalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.monumentalFooter} role="contentinfo">
      <div className={styles.footerInner}>
        {/* Top Deck: Cultural Anthem */}
        <div className={styles.anthemBlock}>
          <h2 className={styles.anthemHeadline}>Feel something. Do something.</h2>
        </div>

        {/* Middle Deck: The Giant Vector Wordmark */}
        <div className={styles.brandmarkStage}>
          <Image
            src="/images/marca-ubi-red-png.svg"
            alt="Marca Ubi"
            width={1400}
            height={280}
            className={styles.giantWordmark}
          />
        </div>

        {/* Bottom Deck: 4-Column Directory Rail */}
        <div className={styles.directoryGrid}>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>01 / Identity &amp; Practice</h3>
            <p className={styles.columnText}>
              Marca Ubi Global Holdings.<br />
              Strategic Brand Architecture, Creative Technology, and High-Performance Digital Flagships.
            </p>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>02 / Navigation</h3>
            <ul className={styles.linksList}>
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.linkItem}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>03 / Direct Desks</h3>
            <ul className={styles.linksList}>
              <li>
                <Link href="/start-project" className={styles.linkItem}>
                  Initiate Partnership &rarr;
                </Link>
              </li>
              <li>
                <a href="mailto:partnerships@marcaubi.com" className={styles.linkItem}>
                  partnerships@marcaubi.com
                </a>
              </li>
              <li>
                <a href="mailto:careers@marcaubi.com" className={styles.linkItem}>
                  careers@marcaubi.com
                </a>
              </li>
              <li>
                <a href="mailto:press@marcaubi.com" className={styles.linkItem}>
                  press@marcaubi.com
                </a>
              </li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>04 / Hubs</h3>
            <p className={styles.columnText}>
              Gate Precinct 4, Level 5, DIFC, Dubai<br />
              Tea Building, Shoreditch, London<br />
              100 Feet Road, Indiranagar, Bengaluru<br />
              Mercer Street, SoHo, New York
            </p>
          </div>
        </div>

        {/* Legal & Copyright Bar */}
        <div className={styles.bottomLegalBar}>
          <span>&copy; {currentYear} Marca Ubi Enterprise Agency. All rights reserved.</span>

          <div className={styles.legalLinksCluster}>
            <Link href="/privacy" className={styles.legalLink}>
              Privacy Architecture
            </Link>
            <Link href="/terms" className={styles.legalLink}>
              Terms of Engagement
            </Link>
            <Link href="/security" className={styles.legalLink}>
              Security Protocol
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default MonumentalFooter;
