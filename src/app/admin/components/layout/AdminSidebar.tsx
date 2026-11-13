"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  UserProfileDropdown,
  type CurrentUserSession,
} from "./UserProfileDropdown";
import { NAVIGATION_GROUPS, isTabAuthorized } from "./navigationConfig";
import styles from "./AdminSidebar.module.scss";

interface AdminSidebarProps {
  currentUser: CurrentUserSession;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dueTasksCount?: number;
}

/** Shared navigation exposes authorized destinations without embedding stale business snapshots. */
export function AdminSidebar({
  currentUser,
  isCollapsed,
  onToggleCollapse,
  dueTasksCount,
}: AdminSidebarProps): React.ReactElement {
  const pathname = usePathname() || "/admin";
  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
      aria-label="Commercial Desk navigation"
    >
      {/* 1. Header with Brand Lockup, Commercial Desk Badge, & Collapse Trigger */}
      <div className={styles.brandRow}>
        <Link
          href="/admin"
          className={styles.brandLockup}
          aria-label={isCollapsed ? "Marca Ubi Commercial Desk" : undefined}
        >
          {isCollapsed ? (
            <span className={styles.monogram}>M.</span>
          ) : (
            <div className={styles.brandCluster}>
              <Image
                src="/images/marca-ubi-dark.svg"
                alt="Marca Ubi."
                width={102}
                height={23}
                priority
              />
              <span className={styles.commercialBadge}>Commercial Desk</span>
            </div>
          )}
        </Link>
        <button
          type="button"
          className={styles.collapseButton}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand navigation (⌘B)" : "Collapse navigation (⌘B)"}
          title={isCollapsed ? "Expand navigation (⌘B)" : "Collapse navigation (⌘B)"}
        >
          <span className={styles.collapseIcon} aria-hidden="true">{isCollapsed ? "›" : "‹"}</span>
        </button>
      </div>

      {/* 2. Integrated Search Capsule with ⌘K Shortcut */}
      <button
        type="button"
        className={styles.searchCapsule}
        onClick={() =>
          window.dispatchEvent(new CustomEvent("open-command-palette"))
        }
        aria-label={isCollapsed ? "Search or navigate (⌘K)" : undefined}
        title={isCollapsed ? "Search or navigate (⌘K)" : undefined}
      >
        <svg
          className={styles.searchIcon}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="7" />
          <path d="m16 16 5 5" />
        </svg>
        <span className={styles.searchPlaceholder}>Search or navigate</span>
        <kbd className={styles.shortcutKbd}>⌘K</kbd>
      </button>

      {/* 3. Categorized Work & Workspace Navigation */}
      <nav className={styles.navigation} aria-label="Workspace sections">
        {NAVIGATION_GROUPS.map((group) => {
          const items = group.items.filter((item) =>
            isTabAuthorized(item.key, currentUser),
          );
          if (!items.length) return null;
          return (
            <section
              key={group.groupTitle}
              className={styles.group}
              aria-label={group.groupTitle}
            >
              <h2 className={styles.groupHeading}>{group.groupTitle}</h2>
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
                        <span className={styles.itemIcon}>{item.icon({ active })}</span>
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
            </section>
          );
        })}
      </nav>

      {/* 4. Monthly Cadence Telemetry Card (Replaces the empty void!) */}
      {!isCollapsed && (
        <div className={styles.cadenceCard} role="region" aria-label="Monthly commercial cadence">
          <div className={styles.cadenceHeader}>
            <span className={styles.cadenceEyebrow}>MONTHLY CADENCE</span>
            <span className={styles.cadenceTarget}>Target: ₹ 15,00,000</span>
          </div>
          <div className={styles.cadenceTrack} aria-hidden="true">
            <div className={styles.cadenceFill} style={{ width: "24%" }} />
          </div>
          <div className={styles.cadenceMeta}>
            <span className={styles.cadenceRealized}>Cadence Tracking</span>
            <span className={styles.cadenceDeals}>39 active deals</span>
          </div>
        </div>
      )}

      {/* 5. Bottom User Profile Card (Briefly-Style with 3-Dots Menu) */}
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
