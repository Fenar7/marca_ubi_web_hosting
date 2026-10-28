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

export interface ConnectCutoutProps {
  onOpenBrief?: () => void;
}

/**
 * View 10: Connect & Commercial Desk Cutout.
 * Transparent viewport revealing the living background video layer.
 * Features authentic Kerala studio desks, direct phone/email channels,
 * and high-contrast architectural action triggers.
 * Marked with data-header-theme="dark" for white logo/header text.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function ConnectCutout({ onOpenBrief }: ConnectCutoutProps = {}) {
  return (
    <section
      className={styles.connectCutoutSection}
      id="connect"
      aria-label="Commercial Inquiries and Studio Coordinates"
      data-header-theme="dark"
    >
      <div className={styles.contentStage}>
        <h2 className={styles.displayHeadline}>Let&apos;s Build Something That Holds.</h2>
        <p className={styles.leadText}>
          For institutional branding, enterprise digital platforms, or global creative technology partnerships.
        </p>

        {/* Studio Desks Cluster with Kinetic Red Photon Beam */}
        <div className={styles.desksCluster}>
          {/* Luminous Brand Red Traveling Laser Rail */}
          <span className={styles.beamTracer} aria-hidden="true" />

          <div className={styles.deskItem}>
            <span className={styles.deskLabel}>
              <span className={styles.deskPulseIndicator} aria-hidden="true" />
              Contact
            </span>
            <a href="tel:+917012052472" className={styles.deskValue}>
              +91 7012 052 472
            </a>
          </div>

          <div className={styles.deskItem}>
            <span className={styles.deskLabel}>
              <span className={styles.deskPulseIndicator} aria-hidden="true" />
              General Inquiries
            </span>
            <a href="mailto:hello@marcaubi.com" className={styles.deskValue}>
              hello@marcaubi.com
            </a>
          </div>

          <div className={styles.deskItem}>
            <span className={styles.deskLabel}>
              <span className={styles.deskPulseIndicator} aria-hidden="true" />
              Kerala Studios
            </span>
            <span className={styles.deskValueText}>
              HiLITE Business Park, Calicut &bull; Trivandrum
            </span>
          </div>
        </div>

        {/* Architectural Actions */}
        <div className={styles.actionCluster}>
          {onOpenBrief ? (
            <button
              type="button"
              onClick={onOpenBrief}
              className={styles.primaryActionButton}
              aria-label="Start a Project Brief"
            >
              <span>Start a Project Brief</span>
              <span className={styles.arrowIcon} aria-hidden="true">&rarr;</span>
            </button>
          ) : (
            <Link href="/start-project" className={styles.primaryActionButton}>
              <span>Start a Project Brief</span>
              <span className={styles.arrowIcon} aria-hidden="true">&rarr;</span>
            </Link>
          )}

          <a href="mailto:press@marcaubi.com" className={styles.secondaryActionButton}>
            <span>Press &amp; Media</span>
          </a>
        </div>

        {/* Clean Editorial Social Rail */}
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
