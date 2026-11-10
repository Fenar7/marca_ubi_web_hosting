/**
 * @file AdminAuthShell.tsx
 * @description Master Full-Bleed Dual-Pane Authentication Shell for Marca Ubi Commercial Desk.
 *              True 100vw x 100vh split-screen viewport architecture:
 *              - Left (50vw): Deep Obsidian Showcase (#09090b) with authentic agency photography,
 *                crimson ambient accents (#ea002a), Swiss grotesque typography (Circular XX),
 *                and live commercial telemetry badges. Zero purple/magenta AI-slop.
 *              - Right (50vw): Minimal pure white desk (#ffffff) with centered 440px ergonomic form.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './AdminAuthShell.module.scss';

export interface AdminAuthShellProps {
  eyebrow?: string;
  headline?: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Generative SVG Fluid Silk Wave Artwork with authentic Marca Ubi signature crimson accent.
 * Retained for atmospheric luminosity and test suite invariant compatibility.
 */
function FluidSilkArtwork(): React.ReactElement {
  return (
    <svg
      className={styles.fluidSilkSvg}
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="silkGradCrimson" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ea002a" stopOpacity="0.32" />
          <stop offset="50%" stopColor="#800014" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0a0a0c" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="silkSpecular" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <filter id="silkBlurCrimson" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="36" result="blur" />
        </filter>
      </defs>

      {/* Atmospheric ambient deep background */}
      <rect width="100%" height="100%" fill="#09090b" />

      {/* Subtle crimson wave ribbon */}
      <path
        d="M-50,220 C120,80 320,380 650,140 L650,480 C380,680 180,320 -50,560 Z"
        fill="url(#silkGradCrimson)"
        filter="url(#silkBlurCrimson)"
        opacity="0.85"
      />

      {/* Hairline filament */}
      <path
        d="M-10,310 Q190,160 350,330 T640,230"
        fill="none"
        stroke="url(#silkSpecular)"
        strokeWidth="3"
        opacity="0.5"
      />
    </svg>
  );
}

export function AdminAuthShell({
  eyebrow = 'COMMERCIAL INTELLIGENCE',
  headline = 'Architecting Living Brand Systems',
  description = 'Enter your agency credentials to access the commercial desk workspace.',
  children,
}: AdminAuthShellProps): React.ReactElement {
  return (
    <main className={styles.canvas}>
      <div className={styles.frame}>
        {/* Left: 100vh Full-Bleed Obsidian Showcase Panel with Authentic Marca Ubi Imagery */}
        <aside className={styles.brandPanel} aria-label="Marca Ubi brand showcase">
          <div className={styles.artworkContainer} aria-hidden="true">
            <Image
              src="/images/hero-image.png"
              alt="Marca Ubi Brand Architecture"
              fill
              priority
              sizes="50vw"
              className={styles.heroBackground}
            />
            <FluidSilkArtwork />
            <div className={styles.vignetteOverlay} />
            <div className={styles.crimsonAtmosphere} />
          </div>

          <div className={styles.panelContent}>
            {/* Header: Brand Lockup & Quote Rule (Asset fallback reference: marca-ubi-dark.svg) */}
            <div className={styles.panelTop}>
              <div className={styles.brandRow}>
                <Link className={styles.brandLink} href="/" title="Return to agency home" aria-label="Marca Ubi agency home">
                  <Image
                    src="/images/marca-ubi-white.svg"
                    alt="Marca Ubi."
                    width={148}
                    height={32}
                    priority
                    className={styles.brandLogo}
                  />
                </Link>

                <div className={styles.statusBadge} aria-label="Commercial Desk Status">
                  <span className={styles.statusPulseDot} aria-hidden="true" />
                  <span className={styles.statusBadgeText}>COMMERCIAL DESK</span>
                </div>
              </div>

              <div className={styles.quoteRuleBlock}>
                <span className={styles.quoteEyebrow}>{eyebrow}</span>
                <span className={styles.quoteHairline} aria-hidden="true" />
              </div>
            </div>

            {/* Core Editorial Display Typography (Circular XX Bold & Graphik Regular) */}
            <div className={styles.editorialBlock}>
              <h1 className={styles.displayHeading}>{headline}</h1>
              <p className={styles.displayDescription}>{description}</p>
            </div>

            {/* Bottom Security Telemetry & Governance Notice */}
            <div className={styles.panelBottom}>
              <div className={styles.telemetryTokens} aria-hidden="true">
                <span className={styles.tokenPill}>ACCESS: ROLE-GUARDED</span>
                <span className={styles.tokenPill}>TLS 1.3 / 256-BIT</span>
                <span className={styles.tokenPill}>LOC: DEL • BLR • SGP</span>
              </div>
              <p className={styles.governanceNotice}>
                Restricted agency portal. Unauthorized access attempts are monitored and recorded.
              </p>
            </div>
          </div>
        </aside>

        {/* Right: 100vh Pure Paper-White Commercial Authentication Desk */}
        <section className={styles.formPanel} aria-label="Authentication form">
          <div className={styles.formInner}>
            {children}
            <footer className={styles.formFooter}>
              <p className={styles.copyright}>
                © {new Date().getFullYear()} Marca Ubi Commercial Desk. All rights reserved.
              </p>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
