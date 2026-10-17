'use client';

/**
 * @file AdminSidebar.tsx
 * @description Persistent Desktop Navigation Rail for the Marca Ubi CRM Workspace Shell.
 * @architecture Implements the Linear Fluid Card navigation paradigm with collapsible geometry (260px / 72px),
 *               active route matching, role-based governance gating, and live Supabase Cloud status indicator.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CrmUserRole } from '@/types/crm';
import type { CurrentUserSession } from './UserProfileDropdown';
import styles from './AdminSidebar.module.scss';

interface AdminSidebarProps {
  currentUser: CurrentUserSession;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: (props: { active: boolean }) => React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'orange' | 'emerald' | 'amber';
  requiredRoles?: CrmUserRole[];
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export function AdminSidebar({
  currentUser,
  isCollapsed,
  onToggleCollapse,
}: AdminSidebarProps): React.ReactElement {
  const pathname = usePathname() || '/admin';

  const navigationGroups: NavGroup[] = [
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

  const handleOpenNewLead = (): void => {
    window.dispatchEvent(new CustomEvent('open-new-lead-drawer'));
  };

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
      aria-label="Administrative Navigation Rail"
    >
      {/* Brand Header */}
      <div className={styles.brandContainer}>
        <Link href="/admin" className={styles.logoLink} title="Marca Ubi CRM Command Center">
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
            {!isCollapsed && <span>New Lead</span>}
          </button>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className={styles.navScrollArea}>
        {navigationGroups.map((group) => {
          const authorizedItems = group.items.filter((item) => {
            if (!item.requiredRoles) return true;
            return item.requiredRoles.includes(currentUser.role);
          });

          if (authorizedItems.length === 0) return null;

          return (
            <div key={group.groupTitle} className={styles.navGroup}>
              {!isCollapsed && (
                <div className={styles.groupHeading}>{group.groupTitle}</div>
              )}
              <ul className={styles.navList}>
                {authorizedItems.map((item) => {
                  const active = isRouteActive(item.href);
                  const badgeVariantClass =
                    item.badgeVariant === 'emerald'
                      ? styles.badgeEmerald
                      : item.badgeVariant === 'amber'
                      ? styles.badgeAmber
                      : styles.badgeOrange;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className={styles.iconWrapper}>
                          {item.icon({ active })}
                        </div>
                        {!isCollapsed && (
                          <div className={styles.itemContent}>
                            <span className={styles.itemLabel}>{item.label}</span>
                            {item.badge && (
                              <span className={`${styles.badge} ${badgeVariantClass}`}>
                                {item.badge}
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

      {/* Footer System Status Radar */}
      <div className={styles.sidebarFooter}>
        <div className={styles.systemStatusBlock}>
          <span className={styles.statusRadarDot} aria-hidden="true" />
          {!isCollapsed && (
            <div className={styles.statusText}>
              <span className={styles.statusLabel}>Supabase Cloud</span>
              <span className={styles.statusSub}>Production Node</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
