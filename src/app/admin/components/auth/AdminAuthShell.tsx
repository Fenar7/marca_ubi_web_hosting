/**
 * @file AdminAuthShell.tsx
 * @description Enterprise Luxury Authentication Portal Shell for Marca Ubi Commercial Desk.
 *              Integrates dual-pane layout: Dark Luxury Brand Showcase with Live Telemetry (left)
 *              and Floating White Authentication Desk (right) per master design system.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './AdminAuthShell.module.scss';

export interface AdminAuthShellProps {
  eyebrow: string;
  headline: string;
  description: string;
  children: React.ReactNode;
}

export function AdminAuthShell({
  eyebrow,
  headline,
  description,
  children,
}: AdminAuthShellProps): React.ReactElement {
  return (
    <main className={styles.canvas}>
      <div className={styles.frame}>
        {/* Left: Luxury Editorial Brand Showcase */}
        <aside className={styles.brandPanel} aria-label="Marca Ubi workspace branding">
          <div className={styles.brandGlow} aria-hidden="true" />
          
          <div className={styles.panelTop}>
            <Link className={styles.brandLink} href="/" aria-label="Marca Ubi agency home">
              <Image
                src="/images/marca-ubi-dark.svg"
                alt="Marca Ubi."
                width={168}
                height={38}
                priority
                className={styles.brandLogo}
              />
            </Link>
          </div>

          <div className={styles.brandMessage}>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h1 className={styles.headline}>{headline}</h1>
            <p className={styles.description}>{description}</p>

            {/* Live Operational Telemetry Glance Card (Conyest / Linear Archetype) */}
            <div className={styles.telemetryCard} aria-label="Live Commercial Network Glance">
              <div className={styles.telemetryHeader}>
                <span className={styles.telemetryStatusDot} aria-hidden="true" />
                <span className={styles.telemetryStatusText}>Agency Commercial Network · Live</span>
              </div>
              <div className={styles.telemetryMetrics}>
                <div className={styles.telemetryCol}>
                  <span className={styles.telemetryLabel}>Active Pipeline</span>
                  <strong className={styles.telemetryValue}>₹ 65.4L</strong>
                </div>
                <div className={styles.telemetryDivider} aria-hidden="true" />
                <div className={styles.telemetryCol}>
                  <span className={styles.telemetryLabel}>Active Deals</span>
                  <strong className={styles.telemetryValue}>39 in motion</strong>
                </div>
                <div className={styles.telemetryDivider} aria-hidden="true" />
                <div className={styles.telemetryCol}>
                  <span className={styles.telemetryLabel}>Platform</span>
                  <strong className={styles.telemetryValue}>99.98% Uptime</strong>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.panelFooter}>
            <div className={styles.securityBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>End-to-End Enterprise Auth Guard</span>
            </div>
            <div className={styles.footerDeskTag}>
              <span>Commercial Desk</span>
              <span className={styles.tagDot}>·</span>
              <span>v2.4.0</span>
            </div>
          </div>
        </aside>

        {/* Right: Floating White Authentication Desk */}
        <section className={styles.formPanel} aria-label="Staff authentication form">
          <div className={styles.formInner}>
            {children}
            <div className={styles.formFooter}>
              <p className={styles.copyright}>© {new Date().getFullYear()} Marca Ubi Commercial Desk. All rights reserved.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
