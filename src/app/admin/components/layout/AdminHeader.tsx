"use client";
import React from "react";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";
import type { CurrentUserSession } from "./UserProfileDropdown";
import styles from "./AdminHeader.module.scss";

interface AdminHeaderProps {
  currentUser: CurrentUserSession;
  isMobileNavOpen: boolean;
  onOpenMobileNav: () => void;
  className?: string;
}

/** A quiet context rail leaves page-specific creation and reporting controls with their owning page. */
export function AdminHeader({
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
      <button
        type="button"
        className={styles.search}
        onClick={() =>
          window.dispatchEvent(new CustomEvent("open-command-palette"))
        }
        aria-label="Search or navigate"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="7" />
          <path d="m16 16 5 5" />
        </svg>
        <span>Search</span>
      </button>
    </header>
  );
}
