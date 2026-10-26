"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import MarcaUbiLogo from "../ui/MarcaUbiLogo/MarcaUbiLogo";
import styles from "./ClientHeader.module.scss";

interface ClientHeaderProps {
  onOpenReel?: () => void;
  defaultTheme?: "dark" | "light";
}

const NAV_ITEMS = [
  { label: "About & Doctrine", href: "/#about", index: "01" },
  { label: "Selected Works", href: "/works", index: "02" },
  { label: "Methodology", href: "/#process", index: "03" },
  { label: "Principles", href: "/#values", index: "04" },
  { label: "Studio Dispatches", href: "/blog", index: "05" },
  { label: "Global Hubs", href: "/#network", index: "06" },
  { label: "Contact", href: "/#connect", index: "07" },
];

/**
 * Adaptive Header HUD.
 * Tracks viewport position across alternating light curtains and dark cutouts
 * using an active IntersectionObserver sensor, switching between `.isDark` (white logo & text)
 * and `.isLight` (dark logo & text) with zero cyan color corruption.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function ClientHeader({ defaultTheme = "dark" }: ClientHeaderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [headerTheme, setHeaderTheme] = useState<"dark" | "light">(defaultTheme);

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

  // Lock body scroll when navigation drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

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
            type="button"
            className={styles.menuTrigger}
            onClick={toggleDrawer}
            aria-expanded={isDrawerOpen}
            aria-controls="client-nav-drawer"
            aria-label={isDrawerOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <span className={styles.menuLabel}>
              {isDrawerOpen ? "Close" : "Menu"}
            </span>
            <div className={styles.burgerStack} aria-hidden="true">
              <span className={`${styles.burgerLine} ${isDrawerOpen ? styles.lineOpenTop : ""}`} />
              <span className={`${styles.burgerLine} ${isDrawerOpen ? styles.lineOpenBottom : ""}`} />
            </div>
          </button>
        </div>
      </header>

      {/* Fullscreen Swiss Minimalist Navigation Drawer */}
      <div
        id="client-nav-drawer"
        className={`${styles.menuDrawer} ${isDrawerOpen ? styles.drawerActive : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site Navigation"
      >
        <div className={styles.drawerHeader}>
          <Link href="/" onClick={closeDrawer} aria-label="Marca Ubi Homepage">
            <MarcaUbiLogo color="#ffffff" width={160} height={34} />
          </Link>
          <button
            type="button"
            className={styles.drawerCloseBtn}
            onClick={closeDrawer}
            aria-label="Close Navigation"
          >
            <span>Close</span>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <nav className={styles.drawerNavGrid} aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.index}
              href={item.href}
              className={styles.drawerNavLink}
              onClick={closeDrawer}
            >
              <span className={styles.navIndex}>{item.index}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.drawerFooter}>
          <Link
            href="/start-project"
            className={styles.drawerDirectAction}
            onClick={closeDrawer}
          >
            <span>Start a Project Brief</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <div className={styles.drawerMeta}>
            <span>Marca Ubi Enterprise &copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default ClientHeader;
