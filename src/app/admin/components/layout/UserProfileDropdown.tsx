'use client';

/**
 * @file UserProfileDropdown.tsx
 * @description Executive Notion-Caliber 32px user profile trigger and rich popover flyout.
 * @architecture Replaces cluttered, truncated pill capsules with an ultra-minimal 32px trigger
 *               and a high-density 260px popover containing credentials, workspace tier telemetry,
 *               self-service avatar photo updates, security audit access, and session termination.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { AvatarUploadModal } from '@/app/admin/(workspace)/team/components/AvatarUploadModal';
import type { CurrentUserSession } from '@/types/crm';
import styles from './UserProfileDropdown.module.scss';

export type { CurrentUserSession };

interface UserProfileDropdownProps {
  currentUser: CurrentUserSession;
}

export function UserProfileDropdown({ currentUser }: UserProfileDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser.avatarUrl || null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize internal state with server props
  useEffect(() => {
    setAvatarUrl(currentUser.avatarUrl || null);
  }, [currentUser.avatarUrl]);

  // Real-time synchronization across workspace windows
  useEffect(() => {
    const handleAvatarUpdated = (event: Event): void => {
      const customEvent = event as CustomEvent<{ userId: string; avatarUrl: string | null }>;
      if (customEvent.detail && customEvent.detail.userId === currentUser.id) {
        setAvatarUrl(customEvent.detail.avatarUrl);
      }
    };

    window.addEventListener('user-avatar-updated', handleAvatarUpdated);
    return () => window.removeEventListener('user-avatar-updated', handleAvatarUpdated);
  }, [currentUser.id]);

  const handleLogout = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // Purge modal/body scroll locks and admin route document flags before teardown
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.documentElement.removeAttribute('data-admin-route');
      }

      // Invalidate server-side Supabase session cookies
      const res = await logoutAction();

      // Force clean browser heap flush and router cache purge via hard navigation
      window.location.href = res?.redirectTo || '/admin/login';
    } catch {
      // Defensive fallback ensuring user is never stranded on network failure
      window.location.href = '/admin/login';
    }
  };

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

  const rawName = currentUser.name || currentUser.fullName || 'Admin';

  // Sanitize name for 32px trigger: remove redundant organizational prefix "Marca Ubi " if present
  const triggerName = rawName.replace(/^marca\s+ubi\s+/i, '').trim() || 'Admin';

  // Compute up to 2 uppercase monogram initials
  const initials =
    rawName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'MU';

  const roleFormatted = currentUser.role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const handleOpenCommandPalette = (): void => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={styles.userTrigger}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`Authenticated as ${rawName} (${roleFormatted})`}
      >
        <span className={styles.triggerAvatar} aria-hidden="true">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={26}
              height={26}
              className={styles.avatarImage}
              unoptimized
            />
          ) : (
            initials
          )}
        </span>
        <span className={styles.userName}>{triggerName}</span>
        <svg
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
          {/* User Identity Header */}
          <div className={styles.identityHeader}>
            <div
              className={styles.headerAvatar}
              aria-hidden="true"
              onClick={() => {
                setIsOpen(false);
                setIsAvatarModalOpen(true);
              }}
              title="Click to update profile photo"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={36}
                  height={36}
                  className={styles.avatarImage}
                  unoptimized
                />
              ) : (
                initials
              )}
              <div className={styles.avatarEditBadge} title="Change photo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>
            <div className={styles.headerMeta}>
              <div className={styles.fullNameRow}>
                <span className={styles.fullName} title={rawName}>
                  {rawName}
                </span>
                <span className={styles.roleBadge}>{roleFormatted}</span>
              </div>
              <span className={styles.userEmail} title={currentUser.email}>
                {currentUser.email}
              </span>
            </div>
          </div>

          {/* Workspace Status Row */}
          <div className={styles.workspaceStatusRow}>
            <span className={styles.workspaceName}>
              <span className={styles.statusDot} aria-hidden="true" />
              Marca Ubi Enterprise
            </span>
            <span className={styles.planBadge}>Titanium</span>
          </div>

          <div className={styles.divider} />

          {/* Core Navigation Items */}
          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              setIsAvatarModalOpen(true);
            }}
          >
            <span className={styles.menuItemContent}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Update Profile Photo</span>
            </span>
          </button>

          <Link
            href="/admin/settings"
            className={styles.menuItem}
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <span className={styles.menuItemContent}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Personal Profile</span>
            </span>
          </Link>

          <Link
            href="/admin/settings"
            className={styles.menuItem}
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <span className={styles.menuItemContent}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Workspace Settings</span>
            </span>
          </Link>

          <Link
            href="/admin/settings"
            className={styles.menuItem}
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <span className={styles.menuItemContent}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Security & Audit Logs</span>
            </span>
          </Link>

          {/* Quick Action Item */}
          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={handleOpenCommandPalette}
          >
            <span className={styles.menuItemContent}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Command Palette</span>
            </span>
            <span className={styles.hotkeyBadge}>⌘K</span>
          </button>

          <div className={styles.menuItemStatic}>
            <span className={styles.menuItemContent}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Release Notes</span>
            </span>
            <span className={styles.versionBadge}>v2.4</span>
          </div>

          <div className={styles.divider} />

          {/* Sign Out Action */}
          <form onSubmit={handleLogout} className={styles.logoutForm}>
            <button
              type="submit"
              disabled={isLoggingOut}
              aria-busy={isLoggingOut}
              className={styles.signOutButton}
              role="menuitem"
            >
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
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Self-Service Profile Photo Modal */}
      {isAvatarModalOpen && (
        <AvatarUploadModal
          isOpen={isAvatarModalOpen}
          targetMember={{
            id: currentUser.id,
            name: rawName,
            avatarUrl,
          }}
          onClose={() => setIsAvatarModalOpen(false)}
          onAvatarSaved={(newUrl) => setAvatarUrl(newUrl)}
        />
      )}
    </div>
  );
}
