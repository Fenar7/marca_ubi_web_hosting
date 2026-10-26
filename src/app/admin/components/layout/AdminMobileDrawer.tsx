'use client';

/**
 * @file AdminMobileDrawer.tsx
 * @description Responsive off-canvas slide-out sheet for viewport widths < 1024px.
 * @architecture Provides full touch-optimized agency navigation, dynamic tab-level RBAC gating,
 *               focus containment, and live task badge synchronization matching AdminSidebar.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CurrentUserSession } from './UserProfileDropdown';
import { NAVIGATION_GROUPS, isTabAuthorized } from './navigationConfig';
import styles from './AdminMobileDrawer.module.scss';

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUserSession;
  dueTasksCount?: number;
}

export function AdminMobileDrawer({
  isOpen,
  onClose,
  currentUser,
  dueTasksCount,
}: AdminMobileDrawerProps): React.ReactElement {
  const pathname = usePathname() || '/admin';

  // Lock body scroll and listen for Escape key when drawer is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Automatically dismiss drawer when pathname changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const isRouteActive = (href: string): boolean => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const formattedRole = currentUser.role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out drawer sheet */}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
        aria-label="Mobile Navigation Drawer"
        aria-hidden={!isOpen}
      >
        <div className={styles.drawerHeader}>
          <Link href="/admin" onClick={onClose} className={styles.brandLink}>
            <img
              src="/hero/marca-ubi-logo.png"
              alt="Marca Ubi."
              className={styles.brandLogo}
            />
            <span className={styles.systemTag}>CRM Portal</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close navigation drawer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Quick Action Button for Mobile: Gated against viewers */}
        {currentUser.role !== 'viewer' && (
          <div className={styles.quickActionBox}>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-new-lead-modal'));
                }
              }}
              className={styles.newLeadBtn}
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
              <span>New Lead</span>
            </button>
          </div>
        )}

        <nav className={styles.navScrollArea}>
          {NAVIGATION_GROUPS.map((group) => {
            const authorizedItems = group.items.filter((item) =>
              isTabAuthorized(item.key, currentUser)
            );

            if (authorizedItems.length === 0) return null;

            return (
              <div key={group.groupTitle} className={styles.navGroup}>
                <div className={styles.groupHeading}>{group.groupTitle}</div>
                <ul className={styles.navList}>
                  {authorizedItems.map((item) => {
                    const active = isRouteActive(item.href);
                    const badgeInfo = item.getBadge?.({ dueTasksCount });
                    const badgeClass =
                      badgeInfo?.variant === 'emerald'
                        ? styles.badgeEmerald
                        : badgeInfo?.variant === 'amber'
                        ? styles.badgeAmber
                        : styles.badgeOrange;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                          aria-current={active ? 'page' : undefined}
                        >
                          <div className={styles.iconWrapper}>
                            {item.icon({ active })}
                          </div>
                          <div className={styles.itemContent}>
                            <span className={styles.itemLabel}>{item.label}</span>
                            {badgeInfo && (
                              <span className={`${styles.badge} ${badgeClass}`}>
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
              </div>
            );
          })}
        </nav>

        {/* Footer Authenticated Session Telemetry */}
        <div className={styles.drawerFooter}>
          <div className={styles.systemStatusBlock}>
            <span className={styles.statusDot} aria-hidden="true" />
            <div className={styles.statusText}>
              <span className={styles.statusLabel}>{formattedRole}</span>
              <span className={styles.statusSub}>{currentUser.email}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
