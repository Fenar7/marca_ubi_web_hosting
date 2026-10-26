'use client';

/**
 * @file PersonnelActionMenu.tsx
 * @description Contextual flyout popover for card secondary actions.
 *              Guarantees boundary isolation and outside-click dismiss behavior.
 * @module app/admin/team/components/PersonnelActionMenu
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { TeamMemberRosterItem } from '@/types/crm';
import styles from './PersonnelActionMenu.module.scss';

interface PersonnelActionMenuProps {
  member: TeamMemberRosterItem;
  canManageTeam: boolean;
  canEditAvatar: boolean;
  isSelf: boolean;
  onOpenAvatarModal: () => void;
  onOpenPermissionsModal: () => void;
  onOpenReassignmentModal: () => void;
  onOpenSuspendModal: () => void;
  onReactivateUser: () => void;
}

export function PersonnelActionMenu({
  member,
  canManageTeam,
  canEditAvatar,
  isSelf,
  onOpenAvatarModal,
  onOpenPermissionsModal,
  onOpenReassignmentModal,
  onOpenSuspendModal,
  onReactivateUser,
}: PersonnelActionMenuProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleAction = (callback: () => void): void => {
    setIsOpen(false);
    callback();
  };

  const isSuspended = member.status === 'suspended';

  return (
    <div className={styles.menuContainer} ref={containerRef}>
      <button
        type="button"
        className={styles.triggerButton}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Actions for ${member.full_name}`}
        title="More actions"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.popoverDropdown} role="menu" aria-label="Personnel Actions">
          <Link
            href={`/admin/team/${member.id}`}
            className={styles.menuItem}
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>View Full Profile</span>
          </Link>

          {canEditAvatar && (
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => handleAction(onOpenAvatarModal)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>{member.avatar_url ? 'Change Photo' : 'Upload Photo'}</span>
            </button>
          )}

          {canManageTeam && !isSelf && (
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => handleAction(onOpenPermissionsModal)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Edit Role & Tabs</span>
            </button>
          )}

          {canManageTeam && member.role === 'sales_executive' && (
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => handleAction(onOpenReassignmentModal)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
              <span>Reassign Deals</span>
            </button>
          )}

          {canManageTeam && !isSelf && (
            <>
              <div className={styles.menuDivider} />
              {isSuspended ? (
                <button
                  type="button"
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => handleAction(onReactivateUser)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Reactivate Account</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.destructiveItem}`}
                  role="menuitem"
                  onClick={() => handleAction(onOpenSuspendModal)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  <span>Suspend Account</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
