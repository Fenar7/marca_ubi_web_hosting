"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import styles from "./FloatingExploreButton.module.scss";

const exploreLogoImage = "/hero/marca-ubi-logo.png";
const exploreArrowImage = "/hero/explore-arrow.png";

export default function FloatingExploreButton() {
  const [isReady, setIsReady] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [isTopMode, setIsTopMode] = useState(false);
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const arrowRef = useRef<HTMLImageElement | null>(null);

  useLayoutEffect(() => {
    if ((window as Window & { __initialLoaderComplete?: boolean }).__initialLoaderComplete) {
      const frameId = window.requestAnimationFrame(() => {
        setIsReady(true);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    if (document.documentElement.getAttribute("data-loader-complete") === "true") {
      const frameId = window.requestAnimationFrame(() => {
        setIsReady(true);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    const loaderElement = document.querySelector<HTMLElement>("[data-initial-loader]");

    if (!loaderElement) {
      const frameId = window.requestAnimationFrame(() => {
        setIsReady(true);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    const setReady = () => {
      window.requestAnimationFrame(() => {
        setIsReady(true);
      });
      window.removeEventListener("initial-loader:complete", setReady);
      window.clearTimeout(fallbackId);
    };

    window.addEventListener("initial-loader:complete", setReady);
    const fallbackId = window.setTimeout(setReady, 12000);

    return () => {
      window.removeEventListener("initial-loader:complete", setReady);
      window.clearTimeout(fallbackId);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isReady) {
      return;
    }

    const card = cardRef.current;
    const label = labelRef.current;
    const arrow = arrowRef.current;

    if (!card || !label || !arrow) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let docked = false;
    let topMode = false;
    let lastScrollY = window.scrollY;
    let settleTimeoutId: number | null = null;
    const driftTo = gsap.quickTo(card, "y", { duration: 0.34, ease: "power2.out" });
    const tiltTo = gsap.quickTo(card, "rotation", { duration: 0.34, ease: "power2.out" });

    const animateDocked = (nextDocked: boolean) => {
      setIsDocked(nextDocked);

      if (reduceMotion) {
        return;
      }

      gsap.fromTo(
        card,
        { y: nextDocked ? 20 : -12, scale: nextDocked ? 0.95 : 1.02, autoAlpha: 0.96 },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 0.68,
          ease: "expo.out",
        },
      );
    };

    const animateTopMode = (nextTopMode: boolean) => {
      setIsTopMode(nextTopMode);
      const nextLabel = nextTopMode ? "Back to top" : "Explore";

      if (reduceMotion) {
        label.textContent = nextLabel;
        gsap.set(arrow, { rotate: nextTopMode ? -90 : 90 });
        return;
      }

      gsap.to(arrow, {
        rotate: nextTopMode ? -90 : 90,
        duration: 0.56,
        ease: "expo.inOut",
      });

      gsap.to(label, {
        autoAlpha: 0,
        y: -6,
        duration: 0.16,
        ease: "power2.in",
        onComplete: () => {
          label.textContent = nextLabel;
          gsap.to(label, {
            autoAlpha: 1,
            y: 0,
            duration: 0.24,
            ease: "power2.out",
          });
        },
      });
    };

    const updateState = () => {
      const scrollY = window.scrollY;
      const nearBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 140;
      const nextDocked = scrollY > 56;
      const nextTopMode = nearBottom || scrollY > Math.max(window.innerHeight * 0.95, 640);
      const delta = scrollY - lastScrollY;
      lastScrollY = scrollY;

      if (nextDocked !== docked) {
        docked = nextDocked;
        animateDocked(nextDocked);
      }

      if (nextTopMode !== topMode) {
        topMode = nextTopMode;
        animateTopMode(nextTopMode);
      }

      if (!reduceMotion) {
        const drift = Math.max(-5, Math.min(5, -delta * 0.25));
        const tilt = Math.max(-1.3, Math.min(1.3, delta * 0.08));
        driftTo(drift);
        tiltTo(tilt);

        if (settleTimeoutId) {
          window.clearTimeout(settleTimeoutId);
        }
        settleTimeoutId = window.setTimeout(() => {
          driftTo(0);
          tiltTo(0);
        }, 95);
      }
    };

    const onClick = () => {
      if (!reduceMotion) {
        gsap.to(card, {
          scale: 0.95,
          duration: 0.12,
          ease: "power1.inOut",
          repeat: 1,
          yoyo: true,
        });
      }

      if (topMode) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const aboutSection = document.querySelector<HTMLElement>("section[data-node-id='496:920']");
      const heroSection = document.querySelector<HTMLElement>("section[data-node-id='491:896']");
      const nextSection =
        aboutSection ??
        (heroSection?.nextElementSibling instanceof HTMLElement ? heroSection.nextElementSibling : null);

      if (!nextSection) {
        return;
      }

      const targetTop = nextSection.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    };

    gsap.set(arrow, { rotate: 90, transformOrigin: "50% 50%" });
    gsap.fromTo(
      card,
      { autoAlpha: 0, y: 34, scale: 0.9, filter: "blur(8px)" },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: reduceMotion ? 0.24 : 0.86,
        ease: "expo.out",
      },
    );
    updateState();
    window.addEventListener("scroll", updateState, { passive: true });
    window.addEventListener("resize", updateState);
    card.addEventListener("click", onClick);

    return () => {
      if (settleTimeoutId) {
        window.clearTimeout(settleTimeoutId);
      }
      window.removeEventListener("scroll", updateState);
      window.removeEventListener("resize", updateState);
      card.removeEventListener("click", onClick);
      gsap.killTweensOf([card, label, arrow]);
    };
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <button
      className={[
        styles.exploreCard,
        isDocked ? styles.isDocked : "",
        isTopMode ? styles.isTopMode : "",
      ]
        .filter(Boolean)
        .join(" ")}
      ref={cardRef}
      type="button"
      aria-label="Explore and navigate"
    >
      <span className={styles.exploreLabel} ref={labelRef}>
        Explore
      </span>
      <img className={styles.exploreLogo} src={exploreLogoImage} alt="Marca Ubi." />
      <img className={styles.exploreArrow} ref={arrowRef} src={exploreArrowImage} alt="" aria-hidden="true" />
    </button>
  );
}
