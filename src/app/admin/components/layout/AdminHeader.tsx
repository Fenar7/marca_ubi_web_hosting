"use client";
import React from "react";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";
import styles from "./AdminHeader.module.scss";

interface AdminHeaderProps {
  isMobileNavOpen: boolean;
  onOpenMobileNav: () => void;
  className?: string;
}

/** Keeps route context and global navigation controls available above every workspace page. */
export function AdminHeader({
  isMobileNavOpen,
  onOpenMobileNav,
  className,
}: AdminHeaderProps): React.ReactElement {
  return (
    <header className={`${styles.executiveToolbar} ${className || ""}`} role="banner">
      <div className={styles.toolbarLeft}>
        <button
          type="button"
          className={styles.mobileMenuTrigger}
          onClick={onOpenMobileNav}
          aria-expanded={isMobileNavOpen}
          aria-label="Open navigation"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className={styles.contextCluster}>
          <AdminBreadcrumbs />
        </div>
      </div>

      <div className={styles.toolbarRight}>
        <button
          type="button"
          className={styles.searchPill}
          onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
          aria-label="Search workspace"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="10.5" cy="10.5" r="7" />
            <path d="m16 16 5 5" />
          </svg>
          <span className={styles.searchPlaceholder}>Search workspace</span>
        </button>
      </div>
    </header>
  );
}
