"use client";

import React from "react";
import Link from "next/link";
import styles from "./ConnectCutout.module.scss";

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com/marcaubi" },
  { label: "LinkedIn", href: "https://linkedin.com/company/marcaubi" },
  { label: "Twitter (X)", href: "https://x.com/marcaubi" },
  { label: "Vimeo", href: "https://vimeo.com/marcaubi" },
  { label: "Substack", href: "https://marcaubi.substack.com" },
];

/**
 * View 07: Client Inquiries & Socials Cutout.
 * Transparent viewport revealing the fixed background video.
 * Monumental headline with dual high-impact pill actions and an editorial social rail.
 */
export function ConnectCutout() {
  return (
    <section className={styles.connectCutoutSection} id="connect" aria-label="Commercial Inquiries and Social Channels">
      <div className={styles.contentStage}>
        <span className={styles.kicker}>New Ventures &amp; Commissions</span>
        <h2 className={styles.displayHeadline}>Connect with us.</h2>
        <p className={styles.leadText}>
          For new business mandates, institutional branding, or global creative technology partnerships.
        </p>

        <div className={styles.actionCluster}>
          <Link href="/start-project" className={styles.newBusinessButton}>
            <span>New Business</span>
            <span className={styles.arrowIcon} aria-hidden="true">&nearr;</span>
          </Link>

          <Link href="mailto:press@marcaubi.com" className={styles.pressButton}>
            <span>Press &amp; Media</span>
          </Link>
        </div>

        <nav className={styles.socialRail} aria-label="Social Channels">
          {SOCIAL_LINKS.map((item, index) => (
            <React.Fragment key={item.label}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                {item.label}
              </a>
              {index < SOCIAL_LINKS.length - 1 && (
                <span className={styles.slash} aria-hidden="true">
                  /
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </section>
  );
}

export default ConnectCutout;
