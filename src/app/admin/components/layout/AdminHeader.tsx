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

/**
 * Single-Tier 56px Executive Toolbar:
 * - Left: Route breadcrumbs via dynamic <AdminBreadcrumbs />, route context, and real-time live pulse.
 * - Right: Global command search (⌘K) and notification trigger.
 * - Invariant: Keeps header strictly contextual; creation modals belong to workspace surfaces and command palette.
 * - Invariant: User profile exclusively lives in the sidebar card, eliminating visual duplication.
 */
export function AdminHeader({
  currentUser,
  isMobileNavOpen,
  onOpenMobileNav,
  className,
}: AdminHeaderProps): React.ReactElement {
  return (
    <header className={`${styles.executiveToolbar} ${className || ""}`} role="banner">
      {/* Left: Mobile Trigger + Contextual Dynamic Breadcrumbs */}
      <div className={styles.toolbarLeft}>
        <button
          type="button"
          className={styles.mobileMenuTrigger}
          onClick={onOpenMobileNav}
          aria-expanded={isMobileNavOpen}
          aria-label="Toggle navigation drawer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className={styles.contextCluster}>
          <AdminBreadcrumbs />
        </div>
      </div>

      {/* Right: Search Capsule + Notification Bell */}
      <div className={styles.toolbarRight}>
        <button
          type="button"
          className={styles.searchPill}
          onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
          aria-label="Search leads, deals, clients (⌘K)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="10.5" cy="10.5" r="7" />
            <path d="m16 16 5 5" />
          </svg>
          <span className={styles.searchPlaceholder}>Search...</span>
          <kbd className={styles.shortcutTag}>⌘K</kbd>
        </button>

        <button
          type="button"
          className={styles.notificationBtn}
          onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
          aria-label="Notifications"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className={styles.notificationDot} />
        </button>
      </div>
    </header>
  );
}
