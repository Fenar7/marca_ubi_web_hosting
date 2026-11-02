"use client";

/**
 * @file PersonaHeader.tsx
 * @description The panel's identity bar and primary disclosure boundary.
 *
 *              Architectural Rationale:
 *              - The disclosure line ("DIGITAL ASSISTANT · NOT A PERSON") is permanently visible
 *                in the identity stack rather than ephemeral in an introductory bubble. This ensures
 *                the visitor is continuously informed they are interacting with software regardless
 *                of transcript scroll depth, strictly satisfying Anti-Slop Rule R-16/R-36 and
 *                Playwright E2E line 666.
 *              - Concierge Profile Avatar: Bespoke Swiss digital concierge vector silhouette inside
 *                an Apple HIG continuous squircle with an integrated active emerald radar beacon (#22c55e),
 *                protective isolation ring, and specular lens gleam.
 *              - Controls: Retain visible text nodes ("Menu", "Close") alongside micro-SVG icons,
 *                guaranteeing full conformance with Playwright `getByText('Menu')` and WCAG AA 4.5:1.
 *
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { memo } from "react";
import { PERSONA } from "../knowledge/corpus";
import styles from "../ChatPod.module.scss";

interface Props {
  /** `aria-labelledby` target for the panel. Stable id, because the dialog attribute needs it. */
  titleId: string;
  onMenu: () => void;
  onClose: () => void;
  menuOpen: boolean;
}

function PersonaHeader({ titleId, onMenu, onClose, menuOpen }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.headerMain}>
        <div className={styles.avatarWrap} aria-hidden="true">
          <div className={styles.avatar}>
            <svg
              className={styles.avatarSvg}
              width="38"
              height="38"
              viewBox="0 0 38 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              role="img"
            >
              <defs>
                <linearGradient id="conciergeSurface" x1="4" y1="4" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#24242b" />
                  <stop offset="50%" stopColor="#141418" />
                  <stop offset="100%" stopColor="#0a0a0c" />
                </linearGradient>
                <linearGradient id="conciergeSpecular" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.22)" />
                  <stop offset="40%" stopColor="rgba(255, 255, 255, 0.06)" />
                  <stop offset="100%" stopColor="rgba(0, 0, 0, 0.8)" />
                </linearGradient>
                <linearGradient id="conciergeGlyph" x1="19" y1="9" x2="19" y2="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="70%" stopColor="#EDEDF0" />
                  <stop offset="100%" stopColor="#B8B8C2" />
                </linearGradient>
              </defs>

              {/* Base Continuous Squircle Container (38x38, rx=10) */}
              <rect
                x="0.75"
                y="0.75"
                width="36.5"
                height="36.5"
                rx="10"
                fill="url(#conciergeSurface)"
                stroke="url(#conciergeSpecular)"
                strokeWidth="1.25"
              />

              {/* Specular Top Sheen Arc */}
              <path
                d="M 5 13 C 5 7.5 8 5 13 5 L 25 5 C 30 5 33 7.5 33 13"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1"
                strokeLinecap="round"
              />

              {/* Concierge Head */}
              <circle cx="19" cy="13.2" r="4.8" fill="url(#conciergeGlyph)" />

              {/* Concierge Shoulders & Tailored Bust */}
              <path
                d="M 9.5 28.5 C 9.5 23.2 13.5 19.8 19 19.8 C 24.5 19.8 28.5 23.2 28.5 28.5 C 28.5 28.9 28.1 29.2 27.7 29.2 L 10.3 29.2 C 9.9 29.2 9.5 28.9 9.5 28.5 Z"
                fill="url(#conciergeGlyph)"
              />

              {/* Swiss Tailored Lapel V-Notch (Precision Negative Space) */}
              <path
                d="M 15.8 20.2 L 19 24.6 L 22.2 20.2"
                stroke="#141418"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className={styles.statusBeacon}>
            <span className={styles.statusPulse} />
            <span className={styles.statusDot} />
          </span>
        </div>

        <div className={styles.identity}>
          <span id={titleId} className={styles.name}>
            {PERSONA.name}
          </span>
          <span className={styles.badge}>
            {PERSONA.identityLine}
            <span className={styles.srOnly}>
              . Marca Ubi built this assistant to answer only from what the site already publishes.
            </span>
          </span>
        </div>
      </div>

      <div className={styles.headerActions}>
        <button
          type="button"
          className={`${styles.headerBtn} ${styles.iconButton}`}
          onClick={onMenu}
          aria-expanded={menuOpen}
          aria-controls="mubi-pod-menu"
        >
          <svg
            className={styles.headerBtnIcon}
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="2.5" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="13.5" cy="8" r="1.5" />
          </svg>
          <span>Menu</span>
        </button>
        <button
          type="button"
          className={`${styles.headerBtn} ${styles.iconButton}`}
          onClick={onClose}
          aria-label="Close the assistant panel"
        >
          <svg
            className={styles.headerBtnIcon}
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="3.5" y1="3.5" x2="12.5" y2="12.5" />
            <line x1="12.5" y1="3.5" x2="3.5" y2="12.5" />
          </svg>
          <span>Close</span>
          <span className={styles.srOnly}>the assistant panel</span>
        </button>
      </div>
    </header>
  );
}

export default memo(PersonaHeader);
