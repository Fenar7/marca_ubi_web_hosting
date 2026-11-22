"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MarcaUbiLogo } from "@/app/components/ui/MarcaUbiLogo/MarcaUbiLogo";
import {
  UserProfileDropdown,
  type CurrentUserSession,
} from "./UserProfileDropdown";
import { NAVIGATION_GROUPS, isTabAuthorized } from "./navigationConfig";
import { WorkspaceSearchButton } from "./AdminHeader";
import styles from "./AdminSidebar.module.scss";

export interface AdminSidebarProps {
  currentUser: CurrentUserSession;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dueTasksCount?: number;
}

/** The rail and mobile drawer share the same permission-filtered navigation and due count. */
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

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
      aria-label="Commercial Desk navigation"
    >
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
          aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!isCollapsed}
          aria-keyshortcuts="Control+B Meta+B"
          title={isCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          <svg
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
        </button>
      </div>

      {pathname === "/admin" && (
        <div className={styles.searchSection}>
          <WorkspaceSearchButton compact={isCollapsed} />
        </div>
      )}

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
                          aria-label={isCollapsed ? item.label : undefined}
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
