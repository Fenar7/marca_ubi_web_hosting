'use client';

/**
 * @file AdminSidebar.tsx
 * @description Persistent Desktop Navigation Rail for the Marca Ubi CRM Workspace Shell.
 * @architecture Implements the Linear Fluid Card navigation paradigm with collapsible geometry (260px / 72px),
 *               active route matching, dynamic tab-level RBAC gating, live dynamic task counters,
 *               and authentic authenticated session telemetry.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
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

  const handleOpenNewLead = (): void => {
    window.dispatchEvent(new CustomEvent('open-new-lead-drawer'));
  };

  // Human-readable operational role formatter
  const formattedRole = currentUser.role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
      aria-label="Administrative Navigation Rail"
    >
      {/* Brand Header */}
      <div className={styles.brandContainer}>
        <Link href="/admin" className={styles.logoLink} title="Marca Ubi CRM Executive Overview">
          <img
            src="/hero/marca-ubi-logo.png"
            alt="Marca Ubi."
            className={styles.brandLogo}
          />
          {!isCollapsed && (
            <div className={styles.brandMeta}>
              <span className={styles.brandTitle}>Marca Ubi</span>
              <span className={styles.systemTag}>CRM Portal</span>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          className={styles.collapseToggle}
          title={isCollapsed ? 'Expand navigation rail (⌘B)' : 'Collapse navigation rail (⌘B)'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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

      {/* Quick Action Button: Gated against viewers */}
      {currentUser.role !== 'viewer' && (
        <div className={styles.quickActionBox}>
          <button
            type="button"
            onClick={handleOpenNewLead}
            className={styles.newLeadBtn}
            title="Log new prospective engagement"
            aria-label="New Lead"
          >
            <svg
              width="14"
              height="14"
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
            <span className={styles.newLeadBtnText}>New Lead</span>
          </button>
        </div>
      )}

      {/* Navigation Groups with Dynamic Tab Authorization */}
      <nav className={styles.navScrollArea}>
        {NAVIGATION_GROUPS.map((group) => {
          const authorizedItems = group.items.filter((item) =>
            isTabAuthorized(item.key, currentUser)
          );

          if (authorizedItems.length === 0) return null;

          return (
            <div key={group.groupTitle} className={styles.navGroup}>
              {!isCollapsed && (
                <div className={styles.groupHeading}>{group.groupTitle}</div>
              )}
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
                        title={isCollapsed ? item.label : undefined}
                        aria-current={active ? 'page' : undefined}
                      >
                        <div className={styles.iconWrapper}>
                          {item.icon({ active })}
                        </div>
                        {!isCollapsed && (
                          <div className={styles.itemContent}>
                            <span className={styles.itemLabel}>{item.label}</span>
                            {badgeInfo && (
                              <span className={`${styles.badge} ${badgeVariantClass}`}>
                                {badgeInfo.text}
                              </span>
                            )}
                          </div>
                        )}
                        {active && <span className={styles.activePill} />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer System Status: Real Authenticated Session Telemetry */}
      <div className={styles.sidebarFooter}>
        <div
          className={styles.systemStatusBlock}
          title={`Authenticated as ${currentUser.email} (${formattedRole})`}
        >
          <span className={styles.statusDot} aria-hidden="true" />
          {!isCollapsed && (
            <div className={styles.statusText}>
              <span className={styles.statusLabel}>{formattedRole}</span>
              <span className={styles.statusSub}>{currentUser.email}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
