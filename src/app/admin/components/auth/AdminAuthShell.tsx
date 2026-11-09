/**
 * @file AdminAuthShell.tsx
 * @description Master Luxury Authentication Gateway Shell for Marca Ubi Commercial Desk.
 *              Emulates the Cogie & Pixelcot design archetypes: dual-pane floating card with
 *              generative fluid chromatic artwork (left) and clean minimal auth desk (right).
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
 * Generative SVG Fluid Silk Wave Artwork for the luxury left showcase panel.
 * Blends Marca Ubi crimson (#ea002a) with rich royal violet (#7c3aed) and warm specular
 * highlights without loading heavy external raster assets or AI-slop graphics.
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
        <linearGradient id="silkGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ea002a" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#d946ef" stopOpacity="0.65" />
          <stop offset="75%" stopColor="#7c3aed" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
        </linearGradient>

        <linearGradient id="silkGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff0055" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#9333ea" stopOpacity="0.55" />
          <stop offset="85%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="specularGlow" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <filter id="silkBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="32" result="blur" />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
          />
        </filter>
      </defs>

      {/* Atmospheric ambient deep background */}
      <rect width="100%" height="100%" fill="#0a0a0c" />

      {/* Primary fluid wave ribbons */}
      <path
        d="M-50,220 C120,80 320,380 650,140 L650,480 C380,680 180,320 -50,560 Z"
        fill="url(#silkGrad1)"
        filter="url(#silkBlur)"
        opacity="0.85"
      />
      <path
        d="M-40,380 C160,200 380,520 660,310 L660,620 C420,780 120,460 -40,680 Z"
        fill="url(#silkGrad2)"
        filter="url(#silkBlur)"
        opacity="0.75"
      />

      {/* Crisp undulating ribbon filaments */}
      <path
        d="M-20,260 Q180,120 340,290 T640,190"
        fill="none"
        stroke="url(#silkGrad1)"
        strokeWidth="38"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M-30,340 Q210,180 360,370 T650,270"
        fill="none"
        stroke="url(#silkGrad2)"
        strokeWidth="32"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M-10,310 Q190,160 350,330 T640,230"
        fill="none"
        stroke="url(#specularGlow)"
        strokeWidth="6"
        opacity="0.6"
      />
    </svg>
  );
}

export function AdminAuthShell({
  eyebrow = 'A WISE QUOTE',
  headline = 'Get Everything You Want',
  description = 'You can get everything you want if you work hard, trust the process, and stick to the plan.',
  children,
}: AdminAuthShellProps): React.ReactElement {
  return (
    <main className={styles.canvas}>
      {/* Ambient atmospheric backdrop */}
      <div className={styles.ambientAtmosphere} aria-hidden="true" />

      <div className={styles.frame}>
        {/* Left: Cogie-Inspired Luxury Editorial Showcase */}
        <aside className={styles.brandPanel} aria-label="Marca Ubi brand showcase">
          <div className={styles.artworkContainer} aria-hidden="true">
            <FluidSilkArtwork />
            <div className={styles.vignetteOverlay} />
          </div>

          <div className={styles.panelContent}>
            {/* Header: Brand Lockup & Quote Rule (Asset fallback reference: marca-ubi-dark.svg) */}
            <div className={styles.panelTop}>
              <Link className={styles.brandLink} href="/" title="Return to agency home" aria-label="Marca Ubi agency home">
                <Image
                  src="/images/marca-ubi-white.svg"
                  alt="Marca Ubi."
                  width={142}
                  height={32}
                  priority
                  className={styles.brandLogo}
                />
              </Link>

              <div className={styles.quoteRuleBlock}>
                <span className={styles.quoteEyebrow}>{eyebrow}</span>
                <span className={styles.quoteHairline} aria-hidden="true" />
              </div>
            </div>

            {/* Core Editorial Display Typography */}
            <div className={styles.editorialBlock}>
              <h1 className={styles.displayHeading}>{headline}</h1>
              <p className={styles.displayDescription}>{description}</p>
            </div>

            {/* Bottom Status & Security Coordinates */}
            <div className={styles.panelFooter}>
              <div className={styles.telemetryTag}>
                <span className={styles.pulseDot} aria-hidden="true" />
                <span>Commercial Intelligence · Active Telemetry</span>
              </div>
              <div className={styles.deskVersion}>
                <span>Desk</span>
                <span className={styles.dotDivider}>·</span>
                <span>v2.4.0</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Pixelcot & Cogie Minimal White Authentication Desk */}
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
