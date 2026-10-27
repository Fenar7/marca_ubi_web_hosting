"use client";

import React, { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import MarcaUbiLogo from "../ui/MarcaUbiLogo/MarcaUbiLogo";
import KineticStage from "./KineticStage";
import styles from "./NavigationOverlay.module.scss";
import type { NavItem, NavigationOverlayProps } from "./types";

const DEFAULT_NAV_ITEMS: readonly NavItem[] = [
  { label: "Selected Works", href: "/works" },
  { label: "About", href: "/#about" },
  { label: "Methodology", href: "/#process" },
  { label: "Studio Dispatches", href: "/blog" },
  { label: "Direct Desks", href: "/start-project" },
] as const;

/**
 * NavigationOverlay — 160/90 Benchmark 50/50 Dual-Canvas Navigation Architecture.
 * Features a pure white left panel for Swiss editorial navigation and a solid obsidian
 * black right panel hosting the bespoke Graphic Kinetic Stage.
 *
 * Implements strict WAI-ARIA Dialog semantics, complete keyboard focus trapping,
 * scrollbar layout shift prevention, and clean route change teardown.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function NavigationOverlay({
  isOpen,
  onClose,
  triggerRef,
  navItems = DEFAULT_NAV_ITEMS,
}: NavigationOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const desktopCloseBtnRef = useRef<HTMLButtonElement | null>(null);
  const mobileCloseBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus trap & keyboard lifecycle
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        if (!overlayRef.current) return;

        const focusables = overlayRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex="0"]'
        );
        if (!focusables || focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [isOpen, onClose]
  );

  // Body scroll lock with scrollbar width compensation
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      // Shift focus into overlay
      const focusTarget =
        window.innerWidth > 1024
          ? desktopCloseBtnRef.current
          : mobileCloseBtnRef.current;
      focusTarget?.focus();

      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      // Restore focus to trigger
      if (triggerRef?.current) {
        triggerRef.current.focus();
      } else if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown, triggerRef]);

  return (
    <div
      ref={overlayRef}
      id="client-navigation-overlay"
      className={`${styles.overlayRoot} ${isOpen ? styles.isOpen : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Site Navigation"
      data-client-overlay="true"
    >
      {/* Left Panel: Pure Canvas White (#ffffff) */}
      <div className={styles.leftPanel}>
        {/* Panel Header */}
        <div className={styles.leftHeader}>
          <Link
            href="/"
            className={styles.brandLogoAnchor}
            onClick={onClose}
            aria-label="Marca Ubi Homepage"
          >
            <MarcaUbiLogo color="#0a0a0a" width={160} height={34} />
          </Link>

          {/* Mobile-Only Close Trigger */}
          <button
            ref={mobileCloseBtnRef}
            type="button"
            className={styles.mobileCloseBtn}
            onClick={onClose}
            aria-label="Close Navigation Menu"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              stroke="currentColor"
              strokeWidth="1.75"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Primary Navigation Cluster */}
        <nav className={styles.navCluster} aria-label="Primary Navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLink}
              onClick={onClose}
            >
              <span className={styles.navLabel}>{item.label}</span>
              <span className={styles.navArrow} aria-hidden="true">&rarr;</span>
            </Link>
          ))}
        </nav>

        {/* Panel Footer: Solid Black Social Badges & Studio Anchor */}
        <div className={styles.leftFooter}>
          <div className={styles.socialCluster} role="list" aria-label="Social Channels">
            {/* Instagram */}
            <a
              href="https://instagram.com/marcaubi"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Marca Ubi on Instagram"
              role="listitem"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com/company/marcaubi"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Marca Ubi on LinkedIn"
              role="listitem"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>

            {/* X / Twitter */}
            <a
              href="https://x.com/marcaubi"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Marca Ubi on X"
              role="listitem"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>

          <div className={styles.studioLocation} aria-label="Studio Corridors">
            <span>Kozhikode &amp; Trivandrum</span>
          </div>
        </div>
      </div>

      {/* Right Panel: Solid Obsidian Black (#000000) with Kinetic Stage */}
      <div className={styles.rightPanel}>
        <button
          ref={desktopCloseBtnRef}
          type="button"
          className={styles.framelessCloseBtn}
          onClick={onClose}
          aria-label="Close Navigation Menu"
        >
          <svg
            viewBox="0 0 24 24"
            className={styles.closeIconSvg}
            stroke="currentColor"
            strokeWidth="1.75"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <span className={styles.srOnly}>Close Navigation Menu</span>
        </button>

        <KineticStage isActive={isOpen} />
      </div>
    </div>
  );
}

export default NavigationOverlay;
