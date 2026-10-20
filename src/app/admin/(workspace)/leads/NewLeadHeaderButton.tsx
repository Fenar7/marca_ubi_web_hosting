'use client';

/**
 * @file NewLeadHeaderButton.tsx
 * @description In-context primary CTA button for logging new commercial inquiries in the Inbound Discovery Workspace.
 *              Dispatches 'open-new-lead-modal' to trigger the Linear-style NewLeadModal with ⌘L keyboard shortcut support.
 * @module app/admin/(workspace)/leads/NewLeadHeaderButton
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useEffect, useState, useCallback } from 'react';
import styles from './leads.module.scss';

export interface NewLeadHeaderButtonProps {
  userRole?: string;
}

export function NewLeadHeaderButton({ userRole }: NewLeadHeaderButtonProps): React.ReactElement | null {
  const isViewer = userRole === 'viewer';
  const [shortcutText, setShortcutText] = useState('⌘L');

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || navigator.platform);
      setShortcutText(isMac ? '⌘L' : 'Ctrl+L');
    }
  }, []);

  const handleOpenModal = useCallback(() => {
    if (typeof window !== 'undefined' && !isViewer) {
      window.dispatchEvent(new CustomEvent('open-new-lead-modal'));
    }
  }, [isViewer]);

  if (isViewer) {
    return null;
  }

  return (
    <button
      type="button"
      className={styles.newLeadHeaderBtn}
      onClick={handleOpenModal}
      title={`Log New Lead (${shortcutText})`}
      aria-label="Log New Lead"
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
      <kbd className={styles.leadShortcutBadge}>{shortcutText}</kbd>
    </button>
  );
}
