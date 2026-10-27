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
 * - Escape key dismiss with focus restoration
 * - Strict scroll isolation: locks document body and captures wheel bubbling
 * - Clean minimal header without AI-slop metadata
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
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    // Focus close button on mount
    const timer = setTimeout(() => {
      const closeBtn = modalRef.current?.querySelector<HTMLButtonElement>("button[data-brief-close='true']");
      closeBtn?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
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

  // Scroll event isolation to prevent website background from scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdropOverlay}
      role="presentation"
      onWheel={handleWheel}
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
        onWheel={handleWheel}
      >
        {/* Clean Architectural Header without AI slop metadata */}
        <header className={styles.modalHeader}>
          <div className={styles.headerMeta}>
            <h2 id="brief-modal-title" className={styles.modalTitle}>
              Start a Project
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
