'use client';

/**
 * @file AdminSidebar.tsx
 * @description Master Luxury Grouped Sidebar for Marca Ubi Commercial Desk.
 *              Integrates horizontal Brand Header with User Switcher, dedicated 36px Omni-Search trigger,
 *              tactile active pill navigation with 3px Crimson indicators, and real-time agency telemetry.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserProfileDropdown, type CurrentUserSession } from './UserProfileDropdown';
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

  const handleOpenSearch = (): void => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
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
      {/* Brand & Compact User Switcher Header (User Selected Spec) */}
      <div className={styles.brandContainer}>
        <div className={styles.brandExpanded}>
          <div className={styles.brandLockup}>
            <Link href="/admin" className={styles.logoLink} title="Marca Ubi Commercial Desk overview">
              <Image
                src="/images/marca-ubi-dark.svg"
                alt="Marca Ubi."
                width={124}
                height={28}
                className={styles.brandLogo}
                priority
              />
              <span className={styles.brandDescriptor}>COMMERCIAL DESK</span>
            </Link>
          </div>
          <div className={styles.headerUserControl}>
            <UserProfileDropdown currentUser={currentUser} />
          </div>
        </div>
        <div className={styles.brandCollapsed}>
          <Link href="/admin" className={styles.collapsedLogoLink} title="Marca Ubi Commercial Desk">
            <span className={styles.brandMonogram}>M<span>.</span></span>
          </Link>
          <div className={styles.collapsedUserControl}>
            <UserProfileDropdown currentUser={currentUser} />
          </div>
        </div>
      </div>

      {/* Omni-Search Trigger Rail (⌘K) */}
      <div className={styles.searchSection}>
        <button
          type="button"
          onClick={handleOpenSearch}
          className={styles.sidebarSearchBtn}
          aria-label="Search clients, leads, deals, and team members (⌘K)"
          title="Search deals, clients, or reps (⌘K)"
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
            className={styles.searchIcon}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className={styles.searchPlaceholder}>Quick search...</span>
          <kbd className={styles.searchKbd}>⌘K</kbd>
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
                        {active && <span className={styles.activePill} aria-hidden="true" />}
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
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </nav>

      {/* Conyest / Amirul Dark Luxury Telemetry Card */}
      <div className={styles.sidebarPromoCard}>
        <div className={styles.promoHeader}>
          <span className={styles.promoBadge}>
            <span className={styles.promoPulse} />
            AGENCY INTELLIGENCE
          </span>
        </div>
        <div className={styles.promoTitle}>Pipeline Velocity</div>
        <div className={styles.promoMetrics}>
          <span className={styles.promoValue}>₹65.4L Active</span>
          <span className={styles.promoSub}>39 Commercial Deals</span>
        </div>
        <Link href="/admin/deals" className={styles.promoAction} title="Inspect active commercial pipeline">
          View Pipeline Dynamics →
        </Link>
      </div>

      {/* Agency Telemetry Footer & Collapse Toggle */}
      <div className={styles.sidebarFooter}>
        <div className={styles.footerExpanded}>
          <div className={styles.telemetryStatusBlock} title={`Authenticated as ${currentUser.email} (${formattedRole})`}>
            <span className={styles.statusDot} aria-hidden="true" />
            <div className={styles.statusText}>
              <span className={styles.statusLabel}>Supabase SSR · Live</span>
              <span className={styles.statusSub}>{formattedRole}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className={styles.collapseToggle}
            title={isCollapsed ? 'Expand navigation (Ctrl+B)' : 'Collapse navigation (Ctrl+B)'}
            aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {isCollapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
