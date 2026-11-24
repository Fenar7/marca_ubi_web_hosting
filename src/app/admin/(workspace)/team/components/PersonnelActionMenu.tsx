'use client';

/**
 * @file PersonnelActionMenu.tsx
 * @description Contextual overflow action menu for table rows and personnel cards.
 *              Implements accessible ARIA menu navigation (ArrowUp/Down/Home/End/Escape),
 *              focus restoration, and 44px touch ergonomics.
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
  onInspectMember?: () => void;
  onOpenAvatarModal: () => void;
  onOpenPermissionsModal: () => void;
  onOpenRoleModal?: () => void;
  onOpenReassignmentModal: () => void;
  onOpenSuspendModal: () => void;
  onReactivateUser: () => void;
}

export function PersonnelActionMenu({
  member,
  canManageTeam,
  canEditAvatar,
  isSelf,
  onInspectMember,
  onOpenAvatarModal,
  onOpenPermissionsModal,
  onOpenRoleModal,
  onOpenReassignmentModal,
  onOpenSuspendModal,
  onReactivateUser,
}: PersonnelActionMenuProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    requestAnimationFrame(() => {
      const firstItem = dropdownRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
      firstItem?.focus();
    });

    const handleOutsideClick = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (!dropdownRef.current) return;
      const items = Array.from(
        dropdownRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]')
      );
      if (items.length === 0) return;

      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(currentIndex + 1) % items.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1]?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
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
    <div
      className={styles.menuContainer}
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.triggerButton}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`More actions for ${member.full_name}`}
        title="More actions"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={styles.popoverDropdown}
          role="menu"
          aria-label={`Actions for ${member.full_name}`}
        >
          {onInspectMember && (
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => handleAction(onInspectMember)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
              <span>Inspect Access</span>
            </button>
          )}

          <Link
            href={`/admin/team/${member.id}`}
            className={styles.menuItem}
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>{member.avatar_url ? 'Change Photo' : 'Upload Photo'}</span>
            </button>
          )}

          {canManageTeam && (
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => handleAction(onOpenPermissionsModal)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Configure Tabs</span>
            </button>
          )}

          {canManageTeam && onOpenRoleModal && !isSelf && (
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => handleAction(onOpenRoleModal)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Change Role</span>
            </button>
          )}

          {canManageTeam && member.active_deals_count > 0 && (
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => handleAction(onOpenReassignmentModal)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
              </svg>
              <span>Reassign Deals</span>
            </button>
          )}

          {canManageTeam && !isSelf && (
            <>
              <div className={styles.menuDivider} role="separator" />
              {isSuspended ? (
                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.activateItem}`}
                  role="menuitem"
                  onClick={() => handleAction(onReactivateUser)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
