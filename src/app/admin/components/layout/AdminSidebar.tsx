'use client';

/**
 * @file AdminSidebar.tsx
 * @description Persistent grouped navigation for the Marca Ubi Commercial Desk.
 * @architecture Keeps route discovery separate from the horizontal context rail while preserving
 *               server-aligned tab visibility and a narrow icon mode for dense workspaces.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { CurrentUserSession } from './UserProfileDropdown';
import { NAVIGATION_GROUPS, isTabAuthorized } from './navigationConfig';
import styles from './AdminSidebar.module.scss';

interface AdminSidebarProps {
  currentUser: CurrentUserSession;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dueTasksCount?: number;
}

export function AdminSidebar({
  currentUser,
  isCollapsed,
  onToggleCollapse,
  dueTasksCount,
}: AdminSidebarProps): React.ReactElement {
  const pathname = usePathname() || '/admin';

  const isRouteActive = (href: string): boolean => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  // Human-readable operational role formatter
  const formattedRole = currentUser.role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
      aria-label="Commercial Desk navigation"
    >
      {/* Brand Header */}
      <div className={styles.brandContainer}>
        <Link href="/admin" className={styles.logoLink} title="Marca Ubi Commercial Desk overview">
          <Image
            src="/images/marca-ubi-dark.svg"
            alt="Marca Ubi."
            width={158}
            height={34}
            className={styles.brandLogo}
          />
          <span className={styles.brandMonogram} aria-hidden="true">M<span>.</span></span>
          <span className={styles.brandDescriptor}>COMMERCIAL DESK</span>
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          className={styles.collapseToggle}
          title={isCollapsed ? 'Expand navigation (Ctrl+B)' : 'Collapse navigation (Ctrl+B)'}
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!isCollapsed}
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
            {isCollapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation Groups with Dynamic Tab Authorization */}
      <nav className={styles.navScrollArea} aria-label="Workspace sections">
        {NAVIGATION_GROUPS.map((group) => {
          const authorizedItems = group.items.filter((item) =>
            isTabAuthorized(item.key, currentUser)
          );

          if (authorizedItems.length === 0) return null;

          return (
            <section key={group.groupTitle} className={styles.navGroup} aria-label={group.groupTitle}>
              <div className={styles.groupHeading}>{group.groupTitle}</div>
              <ul className={styles.navList}>
                {authorizedItems.map((item) => {
                  const active = isRouteActive(item.href);
                  const badgeInfo = item.getBadge?.({ dueTasksCount });
                  const badgeVariantClass =
                    badgeInfo?.variant === 'emerald'
                      ? styles.badgeEmerald
                      : badgeInfo?.variant === 'amber'
                      ? styles.badgeAmber
                      : styles.badgeOrange;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                        title={isCollapsed ? `${group.groupTitle}: ${item.label}` : undefined}
                        aria-label={isCollapsed ? `${group.groupTitle}: ${item.label}` : undefined}
                        aria-current={active ? 'page' : undefined}
                      >
                        <div className={styles.iconWrapper}>
                          {item.icon({ active })}
                        </div>
                        <div className={styles.itemContent}>
                          <span className={styles.itemLabel}>{item.label}</span>
                          {badgeInfo && (
                            <span className={`${styles.badge} ${badgeVariantClass}`}>
                              {badgeInfo.text}
                            </span>
                          )}
                        </div>
                        {active && <span className={styles.activePill} />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </nav>

      {/* Identity remains available in the navigation when the global header is scrolled. */}
      <div className={styles.sidebarFooter}>
        <div
          className={styles.systemStatusBlock}
          title={`Authenticated as ${currentUser.email} (${formattedRole})`}
        >
          <span className={styles.statusDot} aria-hidden="true" />
          <div className={styles.statusText}>
            <span className={styles.statusLabel}>{formattedRole}</span>
            <span className={styles.statusSub}>{currentUser.email}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
