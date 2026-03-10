"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { shouldUseMobileMotion } from "@/app/lib/motion";

type SmoothScrollProviderProps = Readonly<{
  children: React.ReactNode;
}>;

export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Skip Lenis entirely in Sanity Studio — let the browser handle scroll
    if (pathname?.startsWith("/studio")) return;

    gsap.registerPlugin(ScrollTrigger);
    let lenis: Lenis | null = null;
    let resizeTimerId: number | null = null;
    const burstTimerIds: number[] = [];

    const handleScrollRefresh = () => {
      lenis?.resize();
      ScrollTrigger.refresh();
    };

    const clearBurstTimers = () => {
      while (burstTimerIds.length > 0) {
        const timerId = burstTimerIds.pop();
        if (timerId !== undefined) {
          window.clearTimeout(timerId);
        }
      }
    };

    const scheduleRefreshBurst = () => {
      clearBurstTimers();
      handleScrollRefresh();
      window.requestAnimationFrame(handleScrollRefresh);

      [180, 600, 1200].forEach((delay) => {
        const timerId = window.setTimeout(handleScrollRefresh, delay);
        burstTimerIds.push(timerId);
      });
    };

    const handleInitialLoaderComplete = () => {
      scheduleRefreshBurst();
    };

    const handleWindowLoad = () => {
      scheduleRefreshBurst();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        scheduleRefreshBurst();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleRefreshBurst();
      }
    };

    const handleResize = () => {
      if (resizeTimerId !== null) {
        window.clearTimeout(resizeTimerId);
      }
      resizeTimerId = window.setTimeout(() => {
        scheduleRefreshBurst();
      }, 160);
    };

    window.addEventListener("initial-loader:complete", handleInitialLoaderComplete);
    window.addEventListener("load", handleWindowLoad);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("orientationchange", scheduleRefreshBurst);
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleRefreshBurst();

    const cleanupRefreshListeners = () => {
      if (resizeTimerId !== null) {
        window.clearTimeout(resizeTimerId);
      }
      clearBurstTimers();
      window.removeEventListener("initial-loader:complete", handleInitialLoaderComplete);
      window.removeEventListener("load", handleWindowLoad);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("orientationchange", scheduleRefreshBurst);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => {
        cleanupRefreshListeners();
      };
    }

    if (shouldUseMobileMotion()) {
      return () => {
        cleanupRefreshListeners();
      };
    }

    // Prevent GSAP from catching up missed frames — biggest single fix for scroll jank
    gsap.ticker.lagSmoothing(0);

    const lenisInstance = new Lenis({
      duration: 1.1,
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
    });
    lenis = lenisInstance;

    // Official Lenis + GSAP ScrollTrigger integration pattern
    lenisInstance.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => {
      lenisInstance.raf(time * 1000);
    };

    gsap.ticker.add(onTick);
    gsap.ticker.fps(120);

    const handleMenuOpen = () => {
      lenisInstance.stop();
    };

    const handleMenuClose = () => {
      lenisInstance.start();
      scheduleRefreshBurst();
    };

    window.addEventListener("menu:open", handleMenuOpen);
    window.addEventListener("menu:close", handleMenuClose);

    if (document.body.classList.contains("menu-open")) {
      handleMenuOpen();
    }

    scheduleRefreshBurst();

    return () => {
      cleanupRefreshListeners();
      window.removeEventListener("menu:open", handleMenuOpen);
      window.removeEventListener("menu:close", handleMenuClose);
      gsap.ticker.remove(onTick);
      lenisInstance.off("scroll", ScrollTrigger.update);
      lenisInstance.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}
