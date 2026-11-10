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
import { ShortcutHint } from "./ShortcutHint";

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
      <div className={styles.brandRow}>
        <Link
          href="/admin"
          className={styles.brand}
          aria-label={isCollapsed ? "Marca Ubi workspace" : undefined}
        >
          {isCollapsed ? (
            <span className={styles.monogram}>M.</span>
          ) : (
            <>
              <Image
                src="/images/marca-ubi-dark.svg"
                alt="Marca Ubi."
                width={113}
                height={26}
                priority
              />
              <span>Commercial desk</span>
            </>
          )}
        </Link>
        <button
          type="button"
          className={styles.collapse}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
          title={isCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {isCollapsed ? "›" : "‹"}
        </button>
      </div>
      <button
        type="button"
        className={styles.search}
        onClick={() =>
          window.dispatchEvent(new CustomEvent("open-command-palette"))
        }
        aria-label={isCollapsed ? "Search or navigate" : undefined}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="7" />
          <path d="m16 16 5 5" />
        </svg>
        <span>Search or navigate</span>
        <ShortcutHint />
      </button>
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
              <h2>{group.groupTitle}</h2>
              <ul>
                {items.map((item) => {
                  const active =
                    item.href === "/admin"
                      ? pathname === item.href
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  const badge = item.getBadge?.({ dueTasksCount });
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        className={`${styles.item} ${active ? styles.active : ""}`}
                        aria-current={active ? "page" : undefined}
                        title={isCollapsed ? item.label : undefined}
                        aria-label={isCollapsed ? item.label : undefined}
                      >
                        {item.icon({ active })}
                        <span>{item.label}</span>
                        {badge && (
                          <small aria-label={`${badge.text} follow-ups due`}>
                            {badge.text}
                          </small>
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
      {!isCollapsed && (
        <div className={styles.sidebarPromoCard}>
          <svg
            className={styles.promoWatermark}
            viewBox="0 0 160 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="150" cy="10" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            <circle cx="150" cy="10" r="70" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            <circle cx="150" cy="10" r="100" stroke="rgba(148,230,34,0.15)" strokeWidth="1.5" />
          </svg>
          <p className={styles.promoText}>
            Analyze pipeline,
            <br />
            gain commercial
            <br />
            control.
          </p>
          <button
            type="button"
            className={styles.promoButton}
            onClick={() => window.dispatchEvent(new CustomEvent("open-new-lead-modal"))}
          >
            New Lead +
          </button>
        </div>
      )}
      <div className={styles.account}>
        <UserProfileDropdown
          currentUser={currentUser}
          compact={isCollapsed}
          placement="above"
        />
      </div>
    </aside>
  );
}
