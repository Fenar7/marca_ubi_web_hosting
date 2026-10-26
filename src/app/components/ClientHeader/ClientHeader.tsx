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
 * Adaptive Header HUD.
 * Tracks viewport position across alternating light curtains and dark cutouts
 * using an active IntersectionObserver sensor, switching between `.isDark` (white logo & text)
 * and `.isLight` (dark logo & text) with zero cyan color corruption.
 *
 * Integrates with the decoupled 160/90 benchmark split NavigationOverlay.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function ClientHeader({ defaultTheme = "dark" }: ClientHeaderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTheme, setHeaderTheme] = useState<"dark" | "light">(defaultTheme);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);

  // IntersectionObserver Theme Sensor: Monitors current intersecting section
  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      // Find the entry that intersects nearest to the top header zone
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
        className={`${styles.headerHost} ${headerTheme === "light" ? styles.isLight : styles.isDark}`}
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
