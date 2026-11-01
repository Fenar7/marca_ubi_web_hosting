"use client";

/**
 * @file PersonaHeader.tsx
 * @description The panel's identity bar. It carries the disclosure, which is the reason this header
 *              exists at all: the "not a person" line is permanently visible rather than confined to
 *              the opening message, so a visitor who scrolls past the greeting cannot lose the fact
 *              that they are talking to software.
 *
 *              There is no portrait. The persona is named and voiced, but giving a text lookup a face
 *              would imply a person behind it, and an AI-generated headshot is the one thing in this
 *              module that would be a lie.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { PERSONA } from "../knowledge/corpus";
import styles from "../ChatPod.module.scss";

interface Props {
  /** `aria-labelledby` target for the panel. Stable id, because the dialog attribute needs it. */
  titleId: string;
  onMenu: () => void;
  onClose: () => void;
  menuOpen: boolean;
}

export default function PersonaHeader({ titleId, onMenu, onClose, menuOpen }: Props) {
  return (
    <header className={styles.header}>
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

      <div className={styles.headerActions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onMenu}
          aria-expanded={menuOpen}
          aria-controls="mubi-pod-menu"
        >
          Menu
        </button>
        <button type="button" className={styles.iconButton} onClick={onClose}>
          Close
          <span className={styles.srOnly}>the assistant panel</span>
        </button>
      </div>
    </header>
  );
}
