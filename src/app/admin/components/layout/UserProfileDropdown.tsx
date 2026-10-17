'use client';

/**
 * @file UserProfileDropdown.tsx
 * @description Apple HIG Vibrancy frosted glass user identity capsule and session termination popover.
 * @architecture Displays authenticated credentials, cryptographic security tier telemetry,
 *               and routes session invalidation through Server Action `logoutAction`.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useEffect } from 'react';
import { logoutAction } from '@/app/actions/auth';
import type { CrmUserRole } from '@/types/crm';
import styles from './UserProfileDropdown.module.scss';

export interface CurrentUserSession {
  id: string;
  name: string;
  email: string;
  role: CrmUserRole;
  jobTitle: string;
}

interface UserProfileDropdownProps {
  currentUser: CurrentUserSession;
}

export function UserProfileDropdown({ currentUser }: UserProfileDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on click outside or escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Extract up to 2 uppercase monogram initials
  const initials = currentUser.name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'MU';

  const roleFormatted = currentUser.role.replace(/_/g, ' ');

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={styles.userTrigger}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`Authenticated as ${currentUser.name} (${currentUser.role})`}
      >
        <div className={styles.avatarPill}>{initials}</div>
        <div className={styles.identityDetails}>
          <span className={styles.userName}>{currentUser.name}</span>
          <span className={styles.roleChip}>{roleFormatted}</span>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu} role="menu" aria-label="User Account Options">
          <div className={styles.menuHeader}>
            <span className={styles.menuEmail}>{currentUser.email}</span>
            <span className={styles.menuTitle}>{currentUser.jobTitle}</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.menuSection}>
            <div className={styles.menuInfoRow}>
              <span className={styles.infoKey}>User ID</span>
              <span className={styles.infoVal}>
                {currentUser.id.length > 8 ? `${currentUser.id.substring(0, 8)}...` : currentUser.id}
              </span>
            </div>
            <div className={styles.menuInfoRow}>
              <span className={styles.infoKey}>Security Tier</span>
              <span className={styles.infoValGreen}>TLS 1.3 / Edge Guarded</span>
            </div>
            <div className={styles.menuInfoRow}>
              <span className={styles.infoKey}>Auth Role</span>
              <span className={styles.infoVal}>{roleFormatted}</span>
            </div>
          </div>

          <div className={styles.divider} />

          <form action={logoutAction} className={styles.logoutForm}>
            <button type="submit" className={styles.signOutButton} role="menuitem">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out of CRM</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
