"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import MarcaUbiLogo from "../ui/MarcaUbiLogo/MarcaUbiLogo";
import { NavigationOverlay } from "../NavigationOverlay";
import styles from "./ClientHeader.module.scss";

const BRAND_STATEMENTS = [
  "The Brand Engineering Company",
  "The Brand Transformation Company",
  "The Identity & Art Systems Company",
  "The Digital Experience Design Company",
  "The Communication and Growth Company",
] as const;

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
  const apertureRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const kineticItemRef = useRef<HTMLDivElement | null>(null);
  const statementRefs = useRef<Array<HTMLSpanElement | null>>([]);

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

  // 3. Dynamic Scrolled Kinetic Stream Engine (GSAP Master Timeline Loop)
  useGSAP(
    () => {
      if (!isScrolled || !apertureRef.current || !kineticItemRef.current) return;

      const aperture = apertureRef.current;
      const carrier = kineticItemRef.current;
      const statements = statementRefs.current.filter((el): el is HTMLSpanElement => Boolean(el));

      if (statements.length < BRAND_STATEMENTS.length) return;

      // Accessibility: Graceful fallback for reduced motion preference
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(carrier, { x: 0, opacity: 0.92 });
        gsap.set(statements[0], { opacity: 1, visibility: "visible", y: 0 });
        return;
      }

      const computeDistance = () => {
        const apertureWidth = aperture.clientWidth;
        const carrierWidth = carrier.clientWidth || 260;
        return Math.max(0, apertureWidth - carrierWidth - 12);
      };

      const tl = gsap.timeline({
        repeat: -1,
        defaults: { ease: "none" },
      });

      // A. Continuous horizontal glide from left boundary towards hamburger
      tl.fromTo(
        carrier,
        { x: 0 },
        {
          x: () => computeDistance(),
          duration: 12,
          ease: "none",
        },
        0
      );

      // B. Edge Mask Dissolves: Emerge from left mask, melt into right mask
      tl.fromTo(carrier, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power2.out" }, 0);
      tl.to(carrier, { opacity: 0, duration: 0.8, ease: "power2.in" }, 11.2);

      // C. Deterministic initialization of all statement layers at t = 0
      tl.set(statements[0], { y: 0, opacity: 1, filter: "blur(0px)", visibility: "visible" }, 0);
      for (let i = 1; i < statements.length; i++) {
        tl.set(statements[i], { y: 8, opacity: 0, filter: "blur(3px)", visibility: "hidden" }, 0);
      }

      // D. In-flight dynamic morphing across the 5 canonical statements during transit
      const morphTimes = [2.2, 4.5, 6.8, 9.1];
      for (let i = 0; i < morphTimes.length; i++) {
        const t = morphTimes[i];
        const outgoing = statements[i];
        const incoming = statements[i + 1];

        // Outgoing statement rolls upward with optical diffusion blur
        tl.to(
          outgoing,
          {
            y: -8,
            opacity: 0,
            filter: "blur(3px)",
            duration: 0.35,
            ease: "power2.in",
          },
          t
        );

        // Incoming statement elevates from below into pristine baseline lock
        tl.fromTo(
          incoming,
          { y: 8, opacity: 0, filter: "blur(3px)", visibility: "visible" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.45,
            ease: "power3.out",
          },
          t + 0.12
        );
      }

      // Micro-interaction: Hover to pause for effortless reading
      const onEnter = () => tl.pause();
      const onLeave = () => tl.play();
      aperture.addEventListener("mouseenter", onEnter);
      aperture.addEventListener("mouseleave", onLeave);

      // Adaptive window resize recalculation
      const onResize = () => {
        tl.invalidate();
      };
      window.addEventListener("resize", onResize);

      return () => {
        tl.kill();
        aperture.removeEventListener("mouseenter", onEnter);
        aperture.removeEventListener("mouseleave", onLeave);
        window.removeEventListener("resize", onResize);
      };
    },
    { dependencies: [isScrolled], scope: apertureRef }
  );

  return (
    <>
      <header
        className={`${styles.headerHost} ${headerTheme === "light" ? styles.isLight : styles.isDark} ${
          isScrolled ? styles.isScrolled : ""
        }`}
        role="banner"
      >
        <div className={styles.brandLockup}>
          <Link href="/" className={styles.logoAnchor} aria-label="Marca Ubi Homepage" onClick={closeDrawer}>
            <MarcaUbiLogo
              width={160}
              height={34}
              className={styles.brandLogo}
            />
          </Link>
          <span className={`${styles.brandSubtitle} ${isScrolled ? styles.subtitleScrolled : ""}`}>
            The Brand Engineering Company
          </span>
        </div>

        {/* Dynamic Kinetic Stream Aperture (Active when scrolled inside floating capsule) */}
        <div
          ref={apertureRef}
          className={`${styles.streamAperture} ${isScrolled ? styles.streamVisible : ""}`}
          aria-hidden={!isScrolled}
          role="region"
          aria-label="Brand Statements Ticker"
        >
          <div ref={trackRef} className={styles.streamTrack}>
            <div ref={kineticItemRef} className={styles.kineticItem}>
              <div className={styles.textRotator}>
                {/* Structural spacer matching the longest statement to lock container geometry */}
                <span className={styles.streamGhost} aria-hidden="true">
                  The Digital Experience Design Company
                </span>
                {BRAND_STATEMENTS.map((statement, idx) => (
                  <span
                    key={statement}
                    ref={(el) => {
                      statementRefs.current[idx] = el;
                    }}
                    className={styles.streamText}
                  >
                    {statement}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

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
