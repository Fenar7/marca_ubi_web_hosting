"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ClientHeader.module.scss";

interface ClientHeaderProps {
  onOpenReel?: () => void;
}

const NAV_ITEMS = [
  { label: "Manifesto", href: "/#manifesto", index: "01" },
  { label: "Selected Work", href: "/#work", index: "02" },
  { label: "Capabilities", href: "/#capabilities", index: "03" },
  { label: "Careers", href: "/#careers", index: "04" },
  { label: "Global Network", href: "/#network", index: "05" },
  { label: "Connect", href: "/#connect", index: "06" },
];

/**
 * Adaptive Navigation Header.
 * Inverts dynamically over video and white curtains using mix-blend-mode: difference.
 * Features the authentic Marca Ubi vector logo and 160over90-style minimalist menu drawer.
 */
export function ClientHeader({ onOpenReel }: ClientHeaderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
      <header className={styles.headerHost} role="banner">
        <Link href="/" className={styles.logoAnchor} aria-label="Marca Ubi Homepage">
          <Image
            src="/images/marca-ubi-red-png.svg"
            alt="Marca Ubi"
            width={160}
            height={34}
            className={styles.brandLogo}
            priority
          />
        </Link>

        <div className={styles.navCluster}>
          <button
            type="button"
            className={styles.menuTrigger}
            onClick={toggleDrawer}
            aria-expanded={isDrawerOpen}
            aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
          >
            <span className={styles.hoverDot} aria-hidden="true" />
            <span>MENU</span>
            <div className={styles.menuLines} aria-hidden="true">
              <span className={styles.menuLine} />
              <span className={styles.menuLine} />
            </div>
          </button>
        </div>
      </header>

      {/* Fullscreen Minimalist Navigation Drawer */}
      <div
        className={`${styles.drawerOverlay} ${isDrawerOpen ? styles.open : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site Navigation"
      >
        <div className={styles.drawerHeader}>
          <Image
            src="/images/marca-ubi-red-png.svg"
            alt="Marca Ubi"
            width={140}
            height={30}
            className={styles.brandLogo}
          />
          <button
            type="button"
            className={styles.closeButton}
            onClick={closeDrawer}
            aria-label="Close navigation drawer"
          >
            <span>CLOSE</span>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <nav className={styles.navLinksGrid}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.index}
              href={item.href}
              className={styles.navItemAnchor}
              onClick={closeDrawer}
            >
              <span className={styles.navIndex}>{item.index}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.drawerFooter}>
          <span className={styles.footerCoordinates}>
            DUBAI • LONDON • BENGALURU • NEW YORK
          </span>
          <Link
            href="/start-project"
            className={styles.startProjectBtn}
            onClick={closeDrawer}
          >
            Initiate Project Brief &rarr;
          </Link>
        </div>
      </div>
    </>
  );
}

export default ClientHeader;
