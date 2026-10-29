"use client";

import React from "react";
import Link from "next/link";
import MarcaUbiLogo from "../ui/MarcaUbiLogo/MarcaUbiLogo";
import styles from "./MonumentalFooter.module.scss";

const NAV_LINKS = [
  { label: "About", href: "/#about" },
  { label: "Selected Works", href: "/works" },
  { label: "Methodology", href: "/#process" },
  { label: "Guiding Principles", href: "/#values" },
  { label: "Studio Dispatches", href: "/blog" },
  { label: "Studio Corridors", href: "/#network" },
  { label: "Initiate Brief", href: "/start-project" },
];

/**
 * View 11: Deep Obsidian Black Monumental Footer.
 * Solid Obsidian Black (#000000) monolithic anchor.
 * Features the cultural anthem, vector brandmark, authentic Kerala desks,
 * and 4-column operational directory.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function MonumentalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.monumentalFooter} role="contentinfo" data-header-theme="dark">
      <div className={styles.footerInner}>
        {/* Top Deck: Cultural Anthem */}
        <div className={styles.anthemBlock}>
          <h2 className={styles.anthemHeadline}>
            Imagine limitless<span className={styles.accentDot}>.</span> Create limitless<span className={styles.accentDot}>.</span>
          </h2>
        </div>

        {/* Middle Deck: The Giant Vector Wordmark */}
        <div className={styles.brandmarkStage}>
          <MarcaUbiLogo
            color="#ffffff"
            width="100%"
            height="auto"
            className={styles.giantWordmark}
          />
        </div>

        {/* Bottom Deck: 4-Column Directory Rail */}
        <div className={styles.directoryGrid}>
          <div className={styles.column}>
            <p className={styles.columnText}>
              The Brand Engineering Company
            </p>
          </div>

          <div className={styles.column}>
            <nav aria-label="Footer Navigation">
              <ul className={styles.linksList}>
                {NAV_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={styles.linkItem}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className={styles.column}>
            <nav aria-label="Direct Desks">
              <ul className={styles.linksList}>
                <li>
                  <Link href="/start-project" className={styles.linkItem}>
                    Start a Project Brief &rarr;
                  </Link>
                </li>
                <li>
                  <a href="tel:+917012052472" className={styles.linkItem}>
                    +91 7012 052 472
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@marcaubi.com" className={styles.linkItem}>
                    hello@marcaubi.com
                  </a>
                </li>
                <li>
                  <a href="mailto:careers@marcaubi.com" className={styles.linkItem}>
                    careers@marcaubi.com
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className={styles.column}>
            <p className={styles.columnText}>
              HiLITE Business Park, Hilite City, Calicut, Kerala 673014<br />
              Trivandrum Creative Studio, Kerala
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
