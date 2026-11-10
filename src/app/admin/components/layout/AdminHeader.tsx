"use client";
import React from "react";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";
import { UserProfileDropdown, type CurrentUserSession } from "./UserProfileDropdown";
import styles from "./AdminHeader.module.scss";

interface AdminHeaderProps {
  currentUser: CurrentUserSession;
  isMobileNavOpen: boolean;
  onOpenMobileNav: () => void;
  className?: string;
}

/** Conyest luxury header: breadcrumbs/context on left, pill search, notifications, and profile on right. */
export function AdminHeader({
  currentUser,
  isMobileNavOpen,
  onOpenMobileNav,
  className,
}: AdminHeaderProps): React.ReactElement {
  return (
    <header className={`${styles.header} ${className || ""}`}>
      <div className={styles.context}>
        <button
          type="button"
          className={styles.menu}
          onClick={onOpenMobileNav}
          aria-expanded={isMobileNavOpen}
          aria-haspopup="dialog"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
          <span>Menu</span>
        </button>
        <AdminBreadcrumbs />
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.searchPill}
          onClick={() =>
            window.dispatchEvent(new CustomEvent("open-command-palette"))
          }
          aria-label="Search leads, deals, clients"
        >
          <span className={styles.searchPlaceholder}>Search</span>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="7" />
            <path d="m16 16 5 5" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.notificationBtn}
          aria-label="Notifications"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("open-command-palette"))
          }
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className={styles.notificationDot} />
        </button>
        <div className={styles.profileChip}>
          <UserProfileDropdown
            currentUser={currentUser}
            placement="below"
          />
        </div>
      </div>
    </header>
  );
}
