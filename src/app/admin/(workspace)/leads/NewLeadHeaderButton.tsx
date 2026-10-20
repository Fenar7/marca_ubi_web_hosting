'use client';

/**
 * @file NewLeadHeaderButton.tsx
 * @description In-context primary CTA button for logging new commercial inquiries in the Inbound Discovery Workspace.
 *              Dispatches 'open-new-lead-modal' to trigger the Linear-style NewLeadModal with ⌘L keyboard shortcut support.
 * @module app/admin/(workspace)/leads/NewLeadHeaderButton
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useEffect, useCallback } from 'react';
import styles from './leads.module.scss';

export interface NewLeadHeaderButtonProps {
  userRole?: string;
}

export function NewLeadHeaderButton({ userRole }: NewLeadHeaderButtonProps): React.ReactElement | null {
  const isViewer = userRole === 'viewer';

  const handleOpenModal = useCallback(() => {
    if (typeof window !== 'undefined' && !isViewer) {
      window.dispatchEvent(new CustomEvent('open-new-lead-modal'));
    }
  }, [isViewer]);

  // Global ⌘L / Ctrl+L keyboard shortcut listener for instantaneous intake
  useEffect(() => {
    if (isViewer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l' && !e.shiftKey && !e.altKey) {
        // Only intercept if not currently typing in an input/textarea
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;

        e.preventDefault();
        handleOpenModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewer, handleOpenModal]);

  if (isViewer) {
    return null;
  }

  return (
    <button
      type="button"
      className={styles.newLeadHeaderBtn}
      onClick={handleOpenModal}
      title="Log new prospective engagement (⌘L)"
      aria-label="Log new prospective engagement"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span>+ Log New Lead</span>
      <kbd className={styles.leadShortcutBadge}>⌘L</kbd>
    </button>
  );
}
