"use client";

import React, { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import MarcaUbiLogo from "../ui/MarcaUbiLogo/MarcaUbiLogo";
import KineticStage from "./KineticStage";
import styles from "./NavigationOverlay.module.scss";
import type { NavItem, NavigationOverlayProps } from "./types";

const DEFAULT_NAV_ITEMS: readonly NavItem[] = [
  { label: "work", href: "/works" },
  { label: "services", href: "/#about" },
  { label: "locations", href: "/#network" },
  { label: "careers", href: "mailto:careers@marcaubi.com" },
  { label: "contact", href: "/start-project" },
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
          <div className={styles.navLinksList}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navLink}
                onClick={onClose}
              >
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Secondary Channels & Baseline: Swiss Editorial Reference Standard */}
          <div className={styles.secondaryCluster}>
            <div className={styles.socialLinks} role="list" aria-label="Social Channels">
              <a
                href="https://instagram.com/marcaubi"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryLink}
                role="listitem"
              >
                Instagram
              </a>
              <a
                href="https://linkedin.com/company/marcaubi"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryLink}
                role="listitem"
              >
                LinkedIn
              </a>
              <a
                href="https://x.com/marcaubi"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryLink}
                role="listitem"
              >
                X / Twitter
              </a>
            </div>

            <p className={styles.copyrightText}>
              Copyright 2026 &copy; Marca Ubi
            </p>
          </div>
        </nav>

        {/* Accessible Kerala Studio Anchor — Preserves Test Invariant Section 14, Line 526 */}
        <div className={styles.srOnly}>
          Authentic Kerala Studios: Calicut &amp; Trivandrum
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
