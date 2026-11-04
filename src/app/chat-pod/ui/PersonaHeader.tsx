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
 *              - Concierge Profile Avatar: Editorial photographic portrait of lady concierge
 *                (/avatars/sophia-sterling.jpg) inside an Apple HIG continuous squircle (rx=10px) with
 *                subtle specular border and an integrated active emerald radar beacon (#22c55e).
 *              - Controls: Retain visible text nodes ("Menu", "Close") alongside micro-SVG icons,
 *                guaranteeing full conformance with Playwright `getByText('Menu')` and WCAG AA 4.5:1.
 *
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { memo } from "react";
import Image from "next/image";
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
            <Image
              src="/avatars/sophia-sterling.jpg"
              alt="Ubi, Concierge"
              width={38}
              height={38}
              className={styles.avatarImg}
              priority
            />
            <span className={styles.statusBeacon} aria-hidden="true">
              <span className={styles.statusPulse} />
              <span className={styles.statusDot} />
            </span>
          </div>
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
