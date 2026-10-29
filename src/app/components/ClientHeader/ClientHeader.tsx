"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import MarcaUbiLogo from "../ui/MarcaUbiLogo/MarcaUbiLogo";
import { NavigationOverlay } from "../NavigationOverlay";
import styles from "./ClientHeader.module.scss";

export const BRAND_STATEMENTS = [
  "The Brand Engineering Company",
  "The Brand Transformation Company",
  "The Identity & Art Systems Company",
  "The Digital Experience Design Company",
  "The Communication and Growth Company",
] as const;

export const HEADER_DISCIPLINES = [
  "Brand Strategy",
  "Visual Identity Systems",
  "Creative Direction",
  "Culture Marketing",
  "Experiential Production",
  "Digital Infrastructure",
  "Creative Technology",
  "Motion & Cinema",
  "Campaign Architecture",
  "Editorial Systems",
  "High-Growth GTM",
  "Spatial Brand Design",
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
          setIsScrolled((prev) => {
            if (!prev && window.scrollY > 50) return true;
            if (prev && window.scrollY <= 30) return false;
            return prev;
          });
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

  // 3. Anchored Scrolled Disciplines Station (Stationary in-place vertical morph)
  // Anchored directly after the logo on the left side of the capsule.
  // Zero horizontal travel; in-place vertical blur/fade cross-morph across the 12 core disciplines.
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
        gsap.set(carrierA, { x: 0, y: 0, autoAlpha: 1 });
        gsap.set(carrierB, { autoAlpha: 0 });
        textA.textContent = HEADER_DISCIPLINES[0];
        return;
      }

      const activeAnimations = new Set<gsap.core.Animation>();
      let disciplineIndex = 0;
      let activeCarrier = carrierA;
      let nextCarrier = carrierB;
      let activeText = textA;
      let nextText = textB;
      let isPaused = false;
      let isCleanedUp = false;

      // Morphing Timing Parameters:
      // HOLD_DURATION (2.5s): Comfortable readability window per discipline
      // MORPH_DURATION (0.42s): Fluid vertical roll-up cross-fade with optical diffusion
      const HOLD_DURATION = 2.8;
      const MORPH_DURATION = 0.46;
      const TRAVEL_Y = 14;

      // Initial state: Carrier A displayed in place, Carrier B primed below
      activeText.textContent = HEADER_DISCIPLINES[0];
      gsap.set(activeCarrier, { x: 0, y: 0, autoAlpha: 1 });
      gsap.set(nextCarrier, { x: 0, y: TRAVEL_Y, autoAlpha: 0 });

      const cycleNextDiscipline = () => {
        if (isCleanedUp) return;

        disciplineIndex = (disciplineIndex + 1) % HEADER_DISCIPLINES.length;
        const upcomingDiscipline = HEADER_DISCIPLINES[disciplineIndex];

        // Populate next carrier
        nextText.textContent = upcomingDiscipline;
        gsap.set(nextCarrier, { x: 0, y: TRAVEL_Y, autoAlpha: 0 });

        const morphTl = gsap.timeline({
          onComplete: () => {
            activeAnimations.delete(morphTl);
            gsap.set(activeCarrier, { y: TRAVEL_Y, autoAlpha: 0 });

            // Swap roles
            const tempCarrier = activeCarrier;
            activeCarrier = nextCarrier;
            nextCarrier = tempCarrier;

            const tempText = activeText;
            activeText = nextText;
            nextText = tempText;

            // Schedule subsequent morph
            const nextCall = gsap.delayedCall(HOLD_DURATION, () => {
              activeAnimations.delete(nextCall);
              cycleNextDiscipline();
            });
            activeAnimations.add(nextCall);
            if (isPaused) {
              nextCall.pause();
            }
          },
        });

        // Symmetrical 14px slot-machine roll with smooth power2.inOut
        morphTl.to(
          activeCarrier,
          {
            y: -TRAVEL_Y,
            autoAlpha: 0,
            duration: MORPH_DURATION,
            ease: "power2.inOut",
          },
          0
        );

        morphTl.to(
          nextCarrier,
          {
            y: 0,
            autoAlpha: 1,
            duration: MORPH_DURATION,
            ease: "power2.inOut",
          },
          0
        );

        activeAnimations.add(morphTl);
        if (isPaused) {
          morphTl.pause();
        }
      };

      // Delay initial cycle to give user time to read the opening discipline
      const initialTimer = gsap.delayedCall(HOLD_DURATION, () => {
        activeAnimations.delete(initialTimer);
        cycleNextDiscipline();
      });
      activeAnimations.add(initialTimer);

      // Micro-interaction: Hover over text pauses morphing for effortless reading
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

      return () => {
        isCleanedUp = true;
        activeAnimations.forEach((anim) => anim.kill());
        activeAnimations.clear();
        gsap.killTweensOf([carrierA, carrierB]);
        aperture.removeEventListener("mouseenter", onEnter);
        aperture.removeEventListener("mouseleave", onLeave);
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
        {/* Left Cluster: Brand Logo + Scrolled In-Place Disciplines Station */}
        <div className={styles.leftCluster}>
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

          {/* Dynamic In-Place Disciplines Station (Stationary adjacent to logo inside floating capsule) */}
          <div
            ref={apertureRef}
            className={`${styles.streamAperture} ${isScrolled ? styles.streamVisible : ""}`}
            aria-hidden={!isScrolled}
            role="region"
            aria-label="Brand Disciplines Ticker"
          >
            <div ref={trackRef} className={styles.streamTrack}>
              {/* Structural ghost spacer matching maximum discipline width to eliminate CLS */}
              <div className={styles.textRotator} aria-hidden="true">
                <span className={styles.streamGhost}>
                  Experiential Production
                </span>
              </div>

              {/* Carrier Alpha */}
              <div
                ref={carrierARef}
                className={`${styles.kineticItem} ${styles.kineticCarrier} ${styles.carrierAlpha}`}
                aria-hidden="false"
              >
                <div className={styles.textRotator}>
                  <span ref={textARef} className={styles.streamText}>
                    {HEADER_DISCIPLINES[0]}
                  </span>
                </div>
              </div>

              {/* Carrier Beta */}
              <div
                ref={carrierBRef}
                className={`${styles.kineticItem} ${styles.kineticCarrier} ${styles.carrierBeta}`}
                aria-hidden="true"
              >
                <div className={styles.textRotator}>
                  <span ref={textBRef} className={styles.streamText}>
                    {HEADER_DISCIPLINES[1]}
                  </span>
                </div>
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
