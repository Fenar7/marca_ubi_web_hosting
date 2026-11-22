"use client";

/**
 * @file AdminMobileDrawer.tsx
 * @description Focus-managed mobile navigation drawer for the Commercial Desk.
 * @architecture Provides full touch-optimized agency navigation, dynamic tab-level RBAC gating,
 *               focus containment, and live task badge synchronization matching AdminSidebar.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  UserProfileDropdown,
  type CurrentUserSession,
} from "./UserProfileDropdown";
import { NAVIGATION_GROUPS, isTabAuthorized } from "./navigationConfig";
import styles from "./AdminMobileDrawer.module.scss";

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
  const pathname = usePathname() || "/admin";
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /** Keep focus inside the navigation while it is open, and return it to the trigger on close. */
  useEffect(() => {
    if (isOpen) {
      const previousFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      closeRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent): void => {
        // A body-portaled account dialog owns focus and Escape until it closes.
        if (document.querySelector('[data-account-avatar-layer="true"]'))
          return;
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        } else if (e.key === "Tab" && drawerRef.current) {
          const controls = Array.from(
            drawerRef.current.querySelectorAll<HTMLElement>(
              "a[href], button:not([disabled])",
            ),
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (!first || !last) return;
          if (
            e.shiftKey &&
            (document.activeElement === first ||
              !drawerRef.current.contains(document.activeElement))
          ) {
            e.preventDefault();
            last.focus();
          } else if (
            !e.shiftKey &&
            (document.activeElement === last ||
              !drawerRef.current.contains(document.activeElement))
          ) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener("keydown", handleKeyDown);
        if (previousFocus?.isConnected) previousFocus.focus();
      };
    }
  }, [isOpen, onClose]);

  // Automatically dismiss drawer when pathname changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const isRouteActive = (href: string): boolean => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out drawer sheet */}
      <aside
        ref={drawerRef}
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}
        aria-label="Commercial Desk navigation"
        aria-hidden={!isOpen}
        aria-modal={isOpen ? true : undefined}
        role="dialog"
        inert={!isOpen}
      >
        <div className={styles.drawerHeader}>
          <Link href="/admin" onClick={onClose} className={styles.brandLink}>
            <Image
              src="/images/marca-ubi-dark.svg"
              alt="Marca Ubi."
              width={158}
              height={34}
              className={styles.brandLogo}
            />
            <span className={styles.systemTag}>COMMERCIAL DESK</span>
          </Link>
          <button
            ref={closeRef}
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

        <nav className={styles.navScrollArea} aria-label="Workspace sections">
          {NAVIGATION_GROUPS.map((group) => {
            const authorizedItems = group.items.filter((item) =>
              isTabAuthorized(item.key, currentUser),
            );

            if (authorizedItems.length === 0) return null;

            return (
              <section
                key={group.groupTitle}
                className={styles.navGroup}
                aria-label={group.groupTitle}
              >
                <div className={styles.groupHeading}>{group.groupTitle}</div>
                <ul className={styles.navList}>
                  {authorizedItems.map((item) => {
                    const active = isRouteActive(item.href);
                    const badgeInfo = item.getBadge?.({ dueTasksCount });
                    const badgeClass =
                      badgeInfo?.variant === "emerald"
                        ? styles.badgeEmerald
                        : badgeInfo?.variant === "amber"
                          ? styles.badgeAmber
                          : styles.badgeOrange;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                          aria-current={active ? "page" : undefined}
                        >
                          <div className={styles.iconWrapper}>
                            {item.icon({ active })}
                          </div>
                          <div className={styles.itemContent}>
                            <span className={styles.itemLabel}>
                              {item.label}
                            </span>
                            {badgeInfo && (
                              <span className={`${styles.badge} ${badgeClass}`}>
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

        <div className={styles.drawerFooter}>
          <UserProfileDropdown currentUser={currentUser} placement="above" />
        </div>
      </aside>
    </>
  );
}
