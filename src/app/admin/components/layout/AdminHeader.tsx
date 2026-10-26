'use client';

/**
 * @file AdminHeader.tsx
 * @description Notion-Caliber 48px top navigation rail for the Marca Ubi CRM Workspace Shell.
 * @architecture Encapsulates dynamic 3-tier breadcrumbs, responsive mobile drawer toggle,
 *               32px omni-search trigger, refined 32px sentence-case quick action triggers,
 *               and a minimalist 32px user identity popover.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { UserProfileDropdown, type CurrentUserSession } from './UserProfileDropdown';
import styles from './AdminHeader.module.scss';

interface AdminHeaderProps {
  currentUser: CurrentUserSession;
  onOpenMobileNav: () => void;
}

export function AdminHeader({ currentUser, onOpenMobileNav }: AdminHeaderProps): React.ReactElement {
  const canManageTeam = currentUser.role === 'admin';
  const canCreateLead = currentUser.role !== 'viewer';

  const handleOpenNewLead = (): void => {
    window.dispatchEvent(new CustomEvent('open-new-lead-drawer'));
  };

  const handleOpenAddMember = (): void => {
    window.dispatchEvent(new CustomEvent('open-add-member-drawer'));
  };

  const handleOpenSearch = (): void => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <header className={styles.header}>
      {/* Left: Mobile Toggle & Dynamic Hierarchical Breadcrumbs */}
      <div className={styles.headerLeft}>
        <button
          type="button"
          onClick={onOpenMobileNav}
          className={styles.mobileHamburger}
          aria-label="Open mobile navigation menu"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <AdminBreadcrumbs />
      </div>

      {/* Right: Search, Quick Actions & User Identity */}
      <div className={styles.headerRight}>
        {/* Omni Search Trigger */}
        <button
          type="button"
          onClick={handleOpenSearch}
          className={styles.omniSearchTrigger}
          title="Search deals, clients, or reps (⌘K)"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className={styles.searchPlaceholder}>Quick search...</span>
          <kbd className={styles.searchKbd}>⌘K</kbd>
        </button>

        {/* Quick Action Triggers */}
        <div className={styles.headerActionBtns}>
          {canCreateLead && (
            <button
              type="button"
              onClick={handleOpenNewLead}
              className={`${styles.quickActionBtn} ${styles.primaryAction}`}
              title="Log new prospective engagement"
            >
              <svg
                width="12"
                height="12"
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
              <span>New Lead</span>
            </button>
          )}

          {canManageTeam && (
            <button
              type="button"
              onClick={handleOpenAddMember}
              className={`${styles.quickActionBtn} ${styles.secondaryAction}`}
              title="Provision new commercial personnel"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              <span>Add Member</span>
            </button>
          )}
        </div>

        {/* User Identity Popover */}
        <UserProfileDropdown currentUser={currentUser} />
      </div>
    </header>
  );
}
