"use client";

import React, { useEffect, useRef, useCallback } from "react";
import styles from "./ProjectBriefModal.module.scss";
import ProjectForm from "../ProjectForm/ProjectForm";

export interface ProjectBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ProjectBriefModal: Accessible Dark Luxury Modal Overlay.
 * Houses the multi-page commercial project brief wizard.
 *
 * Implements:
 * - WAI-ARIA role="dialog" & aria-modal="true"
 * - Esc key dismiss with focus restoration
 * - Body scroll lock to prevent underlying page scroll leak
 * - Backdrop blur with Apple HIG vibrancy tokens
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function ProjectBriefModal({ isOpen, onClose }: ProjectBriefModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Focus preservation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus close button on mount
    const timer = setTimeout(() => {
      const closeBtn = modalRef.current?.querySelector<HTMLButtonElement>("button[data-brief-close='true']");
      closeBtn?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen]);

  // Keyboard navigation: Escape key dismiss
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdropOverlay}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className={styles.modalContainer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="brief-modal-title"
        onKeyDown={handleKeyDown}
      >
        {/* Modal Top Control Bar */}
        <header className={styles.modalHeader}>
          <div className={styles.headerMeta}>
            <span className={styles.modalKicker}>Commercial Desk</span>
            <span className={styles.headerSlash} aria-hidden="true">/</span>
            <h2 id="brief-modal-title" className={styles.modalTitle}>
              Start a Project Brief
            </h2>
          </div>

          <button
            type="button"
            data-brief-close="true"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close Project Brief Dialog"
          >
            <span className={styles.closeGlyph} aria-hidden="true">&times;</span>
          </button>
        </header>

        {/* Modal Scrollable Body */}
        <div className={styles.modalBody}>
          <ProjectForm />
        </div>
      </div>
    </div>
  );
}

export default ProjectBriefModal;
