"use client";

/**
 * @file AdminSidebar.tsx
 * @description Master navigation rail for Marca Ubi Commercial Desk (/admin).
 * @architecture
 *  - Brand lockup: Monogram 'M.' in Circular XX, 'MARCA UBI' typography, sleek collapse trigger (⌘B).
 *    Completely eliminates the awkward bordered 'COMMERCIAL DESK' pill badge.
 *  - Zero duplicate search capsule (search lives strictly in the top header ⌘K).
 *  - 3 structured sections: 'COMMERCIAL', 'OPERATIONS', and 'WORKSPACE'.
 *  - Active state: Warm Alabaster (#f5f5f3) background pill, dark typography (#111111), and a 3px signature red (#ea002a) pip.
 *  - Follow-up badge: Refined soft neutral or subtle soft crimson pill (zero neon pink).
 *  - Bottom telemetry: 1-line integrated micro-telemetry rail for Monthly Cadence (3px hairline progress track, NO boxy card).
 *  - Bottom identity: Single integrated user profile card via UserProfileDropdown.
 *  - Breakpoint: Hidden at <= 1024px in favor of AdminMobileDrawer; adheres to prefers-reduced-motion.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from "react";
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
  /** Optional cadence overrides (defaults to current commercial pacing) */
  monthlyCadenceCurrent?: number;
  monthlyCadenceTarget?: number;
}

function formatCompactInr(value: number): string {
  if (value >= 100000) {
    const inLakhs = value / 100000;
    return `₹${Number.isInteger(inLakhs) ? inLakhs : inLakhs.toFixed(2).replace(/\.?0+$/, "")}L`;
  }
  if (value >= 1000) {
    const inThousands = value / 1000;
    return `₹${Number.isInteger(inThousands) ? inThousands : inThousands.toFixed(1)}k`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

export function AdminSidebar({
  currentUser,
  isCollapsed,
  onToggleCollapse,
  dueTasksCount,
  monthlyCadenceCurrent = 445000,
  monthlyCadenceTarget = 1500000,
}: AdminSidebarProps): React.ReactElement {
  const pathname = usePathname() || "/admin";

  // Calculate cadence percentage bounded between 0% and 100%
  const cadencePercent = Math.min(
    100,
    Math.max(
      0,
      Math.round((monthlyCadenceCurrent / (monthlyCadenceTarget || 1)) * 100),
    ),
  );

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
      aria-label="Commercial Desk navigation"
    >
      {/* 1. Brand Lockup & Sleek Collapse Trigger (Zero Awkward Desk Badge) */}
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
              width={132}
              height={28}
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

      {/* 2. Structured 3-Tier Navigation (COMMERCIAL, OPERATIONS, WORKSPACE) */}
      <nav className={styles.navigation} aria-label="Commercial Desk navigation sections">
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
              {!isCollapsed && (
                <h2 className={styles.groupHeading}>{group.groupTitle}</h2>
              )}

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
            </section>
          );
        })}
      </nav>

      {/* 3. 1-Line Integrated Micro-Telemetry Rail (NO Boxy Card, Pure Editorial Hairline) */}
      {!isCollapsed && (
        <div
          className={styles.cadenceMicroRail}
          role="region"
          aria-label="Monthly commercial cadence"
        >
          <div className={styles.cadenceHeader}>
            <span className={styles.cadenceCaption}>Monthly Cadence</span>
            <span className={styles.cadenceNumbers}>
              {formatCompactInr(monthlyCadenceCurrent)} / {formatCompactInr(monthlyCadenceTarget)}{" "}
              <span className={styles.cadenceSeparator}>•</span> {cadencePercent}%
            </span>
          </div>
          <div className={styles.cadenceTrack} aria-hidden="true">
            <div
              className={styles.cadenceFill}
              style={{ width: `${cadencePercent}%` }}
            />
          </div>
        </div>
      )}

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
