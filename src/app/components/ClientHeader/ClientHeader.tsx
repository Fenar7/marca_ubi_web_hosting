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
  const carrierARef = useRef<HTMLDivElement | null>(null);
  const carrierBRef = useRef<HTMLDivElement | null>(null);
  const textARef = useRef<HTMLSpanElement | null>(null);
  const textBRef = useRef<HTMLSpanElement | null>(null);

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

  // 3. Dynamic Scrolled Kinetic Stream Engine (Dual-Carrier Staggered Overlapping Relay)
  // Continuous handoff: As one statement approaches the right boundary, the next statement
  // simultaneously launches from the left boundary (right after the logo), cycling indefinitely.
  useGSAP(
    () => {
      if (
        !isScrolled ||
        !apertureRef.current ||
        !carrierARef.current ||
        !carrierBRef.current ||
        !textARef.current ||
        !textBRef.current
      ) {
        return;
      }

      const aperture = apertureRef.current;
      const carrierA = carrierARef.current;
      const carrierB = carrierBRef.current;
      const textA = textARef.current;
      const textB = textBRef.current;

      // Accessibility: Honor reduced motion preference with static elegant display
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(carrierA, { x: 0, opacity: 0.95, visibility: "visible" });
        gsap.set(carrierB, { opacity: 0, visibility: "hidden" });
        textA.textContent = BRAND_STATEMENTS[0];
        return;
      }

      // Initial resting state: hide carriers until dispatched
      gsap.set([carrierA, carrierB], { x: 0, opacity: 0, visibility: "hidden" });

      const activeAnimations = new Set<gsap.core.Animation>();
      let statementIndex = 0;
      let carrierTurn = 0; // Alternates: 0 for Carrier Alpha, 1 for Carrier Beta
      let isPaused = false;
      let isCleanedUp = false;

      // Motion Timing Parameters:
      // GLIDE_DURATION (9.2s): Smooth, calm velocity across the full horizontal runway
      // STAGGER_INTERVAL (7.2s): Dispatches next carrier when current carrier enters right mask dissolve (~78% transit)
      const GLIDE_DURATION = 9.2;
      const STAGGER_INTERVAL = 7.2;

      const computeDistance = (carrierEl: HTMLElement) => {
        const apertureWidth = aperture.clientWidth;
        const carrierWidth = carrierEl.offsetWidth || 280;
        return Math.max(0, apertureWidth - carrierWidth - 12);
      };

      const dispatchCarrier = () => {
        if (isCleanedUp) return;

        const carrier = carrierTurn === 0 ? carrierA : carrierB;
        const textEl = carrierTurn === 0 ? textA : textB;
        const statement = BRAND_STATEMENTS[statementIndex % BRAND_STATEMENTS.length];

        statementIndex++;
        carrierTurn = 1 - carrierTurn;

        // Populate statement text dynamically
        textEl.textContent = statement;

        const travelDistance = computeDistance(carrier);

        // Orchestrate master carrier flight timeline
        const carrierTl = gsap.timeline({
          onComplete: () => {
            activeAnimations.delete(carrierTl);
            gsap.set(carrier, { x: 0, opacity: 0, visibility: "hidden" });
          },
        });

        // Step 1: Position carrier at left boundary (immediately after logo)
        carrierTl.set(carrier, { x: 0, opacity: 0, visibility: "visible" }, 0);

        // Step 2: Linear glide from left boundary towards hamburger menu
        carrierTl.to(
          carrier,
          {
            x: travelDistance,
            duration: GLIDE_DURATION,
            ease: "none",
          },
          0
        );

        // Step 3: Edge Mask Dissolves - Emerge smoothly from left edge mask (1.0s)
        carrierTl.to(
          carrier,
          {
            opacity: 1,
            duration: 1.0,
            ease: "power2.out",
          },
          0
        );

        // Step 4: Melt smoothly into right edge mask before hamburger menu (1.3s dissolve)
        carrierTl.to(
          carrier,
          {
            opacity: 0,
            duration: 1.3,
            ease: "power2.in",
          },
          GLIDE_DURATION - 1.3
        );

        activeAnimations.add(carrierTl);
        if (isPaused) {
          carrierTl.pause();
        }

        // Seamless Relay: Dispatch next carrier when current carrier enters the right edge dissolve zone
        const nextTimer = gsap.delayedCall(STAGGER_INTERVAL, () => {
          activeAnimations.delete(nextTimer);
          dispatchCarrier();
        });

        activeAnimations.add(nextTimer);
        if (isPaused) {
          nextTimer.pause();
        }
      };

      // Delay initial dispatch by 400ms to allow CSS capsule expansion transition to settle
      const initTimer = gsap.delayedCall(0.4, () => {
        activeAnimations.delete(initTimer);
        dispatchCarrier();
      });
      activeAnimations.add(initTimer);

      // Micro-interaction: Hover over stream pauses flight for effortless reading
      const onEnter = () => {
        isPaused = true;
        activeAnimations.forEach((anim) => anim.pause());
      };

      const onLeave = () => {
        isPaused = false;
        activeAnimations.forEach((anim) => anim.resume());
      };

      aperture.addEventListener("mouseenter", onEnter);
      aperture.addEventListener("mouseleave", onLeave);

      const onResize = () => {
        // Subsequent carrier dispatches re-measure aperture width dynamically
      };
      window.addEventListener("resize", onResize);

      return () => {
        isCleanedUp = true;
        activeAnimations.forEach((anim) => anim.kill());
        activeAnimations.clear();
        gsap.killTweensOf([carrierA, carrierB]);
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
            {/* Structural ghost spacer matching maximum statement width to eliminate CLS */}
            <div className={styles.textRotator} aria-hidden="true">
              <span className={styles.streamGhost}>
                The Digital Experience Design Company
              </span>
            </div>

            {/* Carrier Alpha */}
            <div
              ref={carrierARef}
              className={`${styles.kineticItem} ${styles.kineticCarrier}`}
              aria-hidden="false"
            >
              <div className={styles.textRotator}>
                <span ref={textARef} className={styles.streamText}>
                  {BRAND_STATEMENTS[0]}
                </span>
              </div>
            </div>

            {/* Carrier Beta */}
            <div
              ref={carrierBRef}
              className={`${styles.kineticItem} ${styles.kineticCarrier}`}
              aria-hidden="true"
            >
              <div className={styles.textRotator}>
                <span ref={textBRef} className={styles.streamText}>
                  {BRAND_STATEMENTS[1]}
                </span>
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
