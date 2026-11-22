"use client";

/**
 * @file AdminSidebar.tsx
 * @description Master navigation rail for Marca Ubi Commercial Desk (/admin).
 * @architecture
 *  - Brand lockup: Monogram 'M.' in Circular XX with signature red dot, 'MARCA UBI' typography,
 *    integrated ghost collapse trigger (⌘B).
 *  - In-sidebar search launcher capsule: '🔍 Search or navigate... ⌘K' triggering Command Palette.
 *  - Collapsible navigation groups with smooth micro-chevrons ('Work', 'Workspace').
 *  - Active state: Velvety Warm Alabaster (#f5f5f3) rounded pill, dark typography (#111111, weight 600),
 *    zero harsh left red border strip.
 *  - Refined follow-up badge: Soft neutral capsule (#ebebea, text #454542) or subtle brand crimson (zero neon pink).
 *  - Bottom identity: Integrated user profile card via UserProfileDropdown with avatar squircle and presence dot.
 *  - Breakpoint: Hidden at <= 1024px in favor of AdminMobileDrawer; adheres to prefers-reduced-motion.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MarcaUbiLogo } from "@/app/components/ui/MarcaUbiLogo/MarcaUbiLogo";
import {
  UserProfileDropdown,
  type CurrentUserSession,
} from "./UserProfileDropdown";
import { NAVIGATION_GROUPS, isTabAuthorized } from "./navigationConfig";
import styles from "./AdminSidebar.module.scss";

export interface AdminSidebarProps {
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
  const pathname = usePathname() || "/admin";
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupTitle: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const handleLaunchSearch = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-command-palette"));
    }
  };

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
      aria-label="Commercial Desk navigation"
    >
      {/* 1. Brand Lockup & Integrated Collapse Trigger (⌘B) */}
      <div className={styles.brandRow}>
        <Link
          href="/admin"
          className={styles.brandLockup}
          aria-label="Marca Ubi Commercial Desk"
        >
          {isCollapsed ? (
            <MarcaUbiLogo
              variant="monogram"
              width={26}
              height={22}
              color="#111111"
              accentColor="#ea002a"
            />
          ) : (
            <MarcaUbiLogo
              variant="full"
              width={128}
              height={26}
              color="#111111"
              accentColor="#ea002a"
            />
          )}
        </Link>

        <button
          type="button"
          className={styles.collapseButton}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand navigation (⌘B)" : "Collapse navigation (⌘B)"}
          title={isCollapsed ? "Expand navigation (⌘B)" : "Collapse navigation (⌘B)"}
        >
          <svg
            className={styles.collapseIcon}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
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
          <span className={styles.shortcutTag}>⌘B</span>
        </button>
      </div>

      {/* 2. In-Sidebar Search Capsule (AI Manager & Linear Standard) */}
      <div className={styles.searchSection}>
        {isCollapsed ? (
          <button
            type="button"
            className={styles.searchLauncherCollapsed}
            onClick={handleLaunchSearch}
            aria-label="Search workspace or navigate (⌘K)"
            title="Search workspace or navigate (⌘K)"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className={styles.searchLauncher}
            onClick={handleLaunchSearch}
            aria-label="Search workspace or navigate (⌘K)"
            title="Search workspace or navigate (⌘K)"
          >
            <svg
              className={styles.searchIcon}
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
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className={styles.searchText}>Search or navigate...</span>
            <kbd className={styles.searchKbd}>⌘K</kbd>
          </button>
        )}
      </div>

      {/* 3. Collapsible Navigation Groups (Work, Workspace) */}
      <nav className={styles.navigation} aria-label="Commercial Desk navigation sections">
        {NAVIGATION_GROUPS.map((group) => {
          const items = group.items.filter((item) =>
            isTabAuthorized(item.key, currentUser),
          );
          if (!items.length) return null;

          const isGroupCollapsed = Boolean(collapsedGroups[group.groupTitle]);

          return (
            <section
              key={group.groupTitle}
              className={styles.group}
              aria-label={group.groupTitle}
            >
              {!isCollapsed && (
                <button
                  type="button"
                  className={styles.groupHeaderBtn}
                  onClick={() => toggleGroup(group.groupTitle)}
                  aria-expanded={!isGroupCollapsed}
                  aria-label={`Toggle ${group.groupTitle} section`}
                >
                  <span className={styles.groupHeading}>{group.groupTitle}</span>
                  <svg
                    className={`${styles.groupChevron} ${isGroupCollapsed ? styles.groupChevronCollapsed : ""}`}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}

              {(!isGroupCollapsed || isCollapsed) && (
                <ul className={styles.itemList}>
                  {items.map((item) => {
                    const active =
                      item.href === "/admin"
                        ? pathname === item.href
                        : pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);
                    const badge = item.getBadge?.({ dueTasksCount });
                    const isFollowUp = item.key === "tasks";

                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          className={`${styles.item} ${active ? styles.active : ""}`}
                          aria-current={active ? "page" : undefined}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <span className={styles.itemIcon}>
                            {item.icon({ active })}
                          </span>
                          <span className={styles.itemLabel}>{item.label}</span>
                          {badge && (
                            <span
                              className={`${styles.counterBadge} ${isFollowUp ? styles.urgencyPill : ""}`}
                              aria-label={`${badge.text} follow-ups due`}
                            >
                              {badge.text}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </nav>

      {/* 4. Single User Profile Card */}
      <div className={styles.accountCardWrapper}>
        <UserProfileDropdown
          currentUser={currentUser}
          compact={isCollapsed}
          placement="above"
        />
      </div>
    </aside>
  );
}
