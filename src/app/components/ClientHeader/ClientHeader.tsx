"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MarcaUbiLogo from "../ui/MarcaUbiLogo/MarcaUbiLogo";
import { NavigationOverlay } from "../NavigationOverlay";
import styles from "./ClientHeader.module.scss";

interface ClientHeaderProps {
  onOpenReel?: () => void;
  defaultTheme?: "dark" | "light";
}

/**
 * Adaptive Header HUD with Scroll-Activated Frosted Glass.
 *
 * Implements:
 * 1. IntersectionObserver Theme Sensor: Monitors current intersecting section
 *    switching between `.isDark` (white logo & text) and `.isLight` (dark logo & text).
 * 2. Scroll-Activated Frosted Glass:
 *    - In pristine top state (scrollY <= 50px, e.g. HeroCutout), header is 100% transparent.
 *    - When scrolled past 50px, smoothly transitions via Apple HIG cubic-bezier
 *      into 16px frosted glass blur with adaptive light/dark glassmorphism,
 *      preventing page text from colliding with the logo and hamburger trigger.
 * 3. Passive rAF-throttled scroll listener for 60fps performance.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function ClientHeader({ defaultTheme = "dark" }: ClientHeaderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTheme, setHeaderTheme] = useState<"dark" | "light">(defaultTheme);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);

  // 1. Scroll-Activated Frosted Glass Sensor (Passive + rAF throttled)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 50;
          setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };

    // Evaluate immediately on mount for deep-linked / refreshed states
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 2. IntersectionObserver Theme Sensor: Monitors current intersecting section
  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const theme = entry.target.getAttribute("data-header-theme") as "dark" | "light" | null;
          if (theme) {
            setHeaderTheme(theme);
          }
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px 0px -85% 0px", // Trigger when section hits the top 15% viewport band
      threshold: 0,
    });

    const themedSections = document.querySelectorAll("[data-header-theme]");
    themedSections.forEach((section) => observer.observe(section));

    return () => {
      themedSections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, []);

  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <>
      <header
        className={`${styles.headerHost} ${headerTheme === "light" ? styles.isLight : styles.isDark} ${
          isScrolled ? styles.isScrolled : ""
        }`}
        role="banner"
      >
        <Link href="/" className={styles.logoAnchor} aria-label="Marca Ubi Homepage" onClick={closeDrawer}>
          <MarcaUbiLogo
            width={160}
            height={34}
            className={styles.brandLogo}
          />
        </Link>

        <div className={styles.navCluster}>
          <button
            ref={menuTriggerRef}
            type="button"
            className={styles.menuTrigger}
            onClick={toggleDrawer}
            aria-expanded={isDrawerOpen}
            aria-controls="client-navigation-overlay"
            aria-label={isDrawerOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <span className={styles.srOnly}>
              {isDrawerOpen ? "Close navigation menu" : "Open navigation menu"}
            </span>
            <div className={styles.burgerStack} aria-hidden="true">
              <span className={`${styles.burgerLine} ${isDrawerOpen ? styles.lineOpenTop : ""}`} />
              <span className={`${styles.burgerLine} ${isDrawerOpen ? styles.lineOpenMiddle : ""}`} />
              <span className={`${styles.burgerLine} ${isDrawerOpen ? styles.lineOpenBottom : ""}`} />
            </div>
          </button>
        </div>
      </header>

      {/* 160/90 Benchmark Split Navigation Overlay */}
      <NavigationOverlay
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        triggerRef={menuTriggerRef}
      />
    </>
  );
}

export default ClientHeader;
