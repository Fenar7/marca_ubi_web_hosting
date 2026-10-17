'use client';

/**
 * @file AdminMobileDrawer.tsx
 * @description Responsive off-canvas slide-out sheet for viewport widths < 1024px.
 * @architecture Provides full touch-optimized agency navigation, role gating, and focus containment.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CrmUserRole } from '@/types/crm';
import type { CurrentUserSession } from './UserProfileDropdown';
import styles from './AdminMobileDrawer.module.scss';

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUserSession;
}

interface MobileNavItem {
  label: string;
  href: string;
  icon: (props: { active: boolean }) => React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'orange' | 'emerald';
  requiredRoles?: CrmUserRole[];
}

interface MobileNavGroup {
  groupTitle: string;
  items: MobileNavItem[];
}

export function AdminMobileDrawer({
  isOpen,
  onClose,
  currentUser,
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

  const navigationGroups: MobileNavGroup[] = [
    {
      groupTitle: 'Commercial Pipeline',
      items: [
        {
          label: 'Command Center',
          href: '/admin',
          icon: ({ active }) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={active ? '2.2' : '1.8'}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          ),
        },
        {
          label: 'Pipeline Deals',
          href: '/admin/leads',
          icon: ({ active }) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={active ? '2.2' : '1.8'}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          ),
        },
        {
          label: 'Follow-up Tasks',
          href: '/admin/tasks',
          badge: '4 Due',
          badgeVariant: 'orange',
          icon: ({ active }) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={active ? '2.2' : '1.8'}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
        },
      ],
    },
    {
      groupTitle: 'Intelligence & Roster',
      items: [
        {
          label: 'Commercial Team',
          href: '/admin/team',
          requiredRoles: ['admin', 'sales_manager'],
          icon: ({ active }) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={active ? '2.2' : '1.8'}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          label: 'Executive Analytics',
          href: '/admin/analytics',
          icon: ({ active }) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={active ? '2.2' : '1.8'}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
        },
        {
          label: 'Ingestion Telemetry',
          href: '/admin/ingestion',
          icon: ({ active }) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={active ? '2.2' : '1.8'}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          ),
        },
      ],
    },
    {
      groupTitle: 'System & Governance',
      items: [
        {
          label: 'Security & Settings',
          href: '/admin/settings',
          requiredRoles: ['admin'],
          icon: ({ active }) => (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={active ? '2.2' : '1.8'}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          ),
        },
      ],
    },
  ];

  const isRouteActive = (href: string): boolean => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
        aria-label="Mobile Navigation Menu"
        aria-hidden={!isOpen}
      >
        <div className={styles.drawerHeader}>
          <Link href="/admin" onClick={onClose} className={styles.logoLink}>
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

        <nav className={styles.navScrollArea}>
          {navigationGroups.map((group) => {
            const authorizedItems = group.items.filter((item) => {
              if (!item.requiredRoles) return true;
              return item.requiredRoles.includes(currentUser.role);
            });

            if (authorizedItems.length === 0) return null;

            return (
              <div key={group.groupTitle} className={styles.navGroup}>
                <div className={styles.groupHeading}>{group.groupTitle}</div>
                <ul className={styles.navList}>
                  {authorizedItems.map((item) => {
                    const active = isRouteActive(item.href);
                    const badgeClass =
                      item.badgeVariant === 'emerald'
                        ? styles.badgeEmerald
                        : styles.badgeOrange;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                        >
                          <div className={styles.iconWrapper}>
                            {item.icon({ active })}
                          </div>
                          <div className={styles.itemContent}>
                            <span className={styles.itemLabel}>{item.label}</span>
                            {item.badge && (
                              <span className={`${styles.badge} ${badgeClass}`}>
                                {item.badge}
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

        <div className={styles.drawerFooter}>
          <div className={styles.systemStatusBlock}>
            <span className={styles.statusRadarDot} aria-hidden="true" />
            <div className={styles.statusText}>
              <span className={styles.statusLabel}>Supabase Cloud</span>
              <span className={styles.statusSub}>Production Node</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
