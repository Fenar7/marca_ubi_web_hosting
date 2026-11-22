"use client";

import React, { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";
import styles from "./AdminHeader.module.scss";

interface AdminHeaderProps {
  isMobileNavOpen: boolean;
  onOpenMobileNav: () => void;
}

const subscribePlatform = () => () => {};

/** Hydration starts with no shortcut hint. The client exposes the modifier its keyboard uses. */
function getSearchShortcut(): string {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘ K" : "Ctrl K";
}

/** Global search stays reachable while scrolling and shares the permission-aware workspace launcher. */
export function AdminHeader({ isMobileNavOpen, onOpenMobileNav }: AdminHeaderProps): React.ReactElement {
  const overview = usePathname() === "/admin";
  return (
    <header className={`${styles.executiveToolbar} ${overview ? styles.overview : ""}`}>
      <div className={styles.toolbarLeft}>
        <button type="button" className={styles.mobileMenuTrigger} onClick={onOpenMobileNav}
          aria-expanded={isMobileNavOpen} aria-label="Open navigation" aria-controls="commercial-navigation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M3 5.5h18M3 12h18M3 18.5h18" />
          </svg>
        </button>
        <AdminBreadcrumbs />
      </div>
      <WorkspaceSearchButton />
    </header>
  );
}

/** The overview rail and mobile toolbar expose the same launcher and keyboard shortcut. */
export function WorkspaceSearchButton({ compact = false }: { compact?: boolean }): React.ReactElement {
  const shortcut = useSyncExternalStore(subscribePlatform, getSearchShortcut, () => "");
  return (
      <button type="button" className={styles.searchPill} aria-label="Search workspace"
        title={compact ? "Search workspace" : undefined}
        aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K"
        onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.75" /><path d="m16 16 5 5" />
        </svg>
        {!compact && <span className={styles.searchPlaceholder}>Search workspace</span>}
        {!compact && shortcut && <kbd className={styles.shortcutTag} aria-hidden="true">{shortcut}</kbd>}
      </button>
  );
}
