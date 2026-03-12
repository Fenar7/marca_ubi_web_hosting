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
    const deferredTimerIds: number[] = [];
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const useNativeSmoothScroll = prefersReducedMotion || shouldUseMobileMotion();

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

    const clearDeferredTimers = () => {
      while (deferredTimerIds.length > 0) {
        const timerId = deferredTimerIds.pop();
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

    const getHeaderOffset = () => {
      const header = document.querySelector("header");

      if (!(header instanceof HTMLElement)) {
        return 96;
      }

      return Math.round(header.getBoundingClientRect().height + 20);
    };

    const getTargetOffset = (target: HTMLElement) => {
      const styles = window.getComputedStyle(target);
      const scrollMarginTop = Number.parseFloat(styles.scrollMarginTop || "0");
      const scrollMarginBlockStart = Number.parseFloat(styles.scrollMarginBlockStart || "0");
      const explicitOffset = Math.max(
        Number.isFinite(scrollMarginTop) ? scrollMarginTop : 0,
        Number.isFinite(scrollMarginBlockStart) ? scrollMarginBlockStart : 0,
      );

      return explicitOffset > 0 ? explicitOffset : getHeaderOffset();
    };

    const resolveHashTarget = (hash: string) => {
      const targetId = decodeURIComponent(hash.replace(/^#/, "").trim());

      if (!targetId) {
        return null;
      }

      const byId = document.getElementById(targetId);

      if (byId) {
        return byId;
      }

      const escapedId = typeof CSS !== "undefined" && "escape" in CSS ? CSS.escape(targetId) : targetId;

      return document.querySelector<HTMLElement>(`[name="${escapedId}"]`);
    };

    const updateAddressBar = (url: URL, isTopLink: boolean) => {
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const nextUrl = isTopLink
        ? `${window.location.pathname}${window.location.search}`
        : `${window.location.pathname}${window.location.search}${url.hash}`;

      if (nextUrl === currentUrl) {
        return;
      }

      if (isTopLink) {
        window.history.replaceState(null, "", nextUrl);
        return;
      }

      window.history.pushState(null, "", nextUrl);
    };

    const performSmoothScroll = (target: HTMLElement | null, url: URL, isTopLink: boolean) => {
      const offset = target ? -getTargetOffset(target) : 0;

      if (lenis) {
        lenis.scrollTo(target ?? 0, {
          offset,
          duration: 1.08,
          easing: (value: number) => 1 - Math.pow(1 - value, 3),
        });
      } else {
        const top = target ? window.scrollY + target.getBoundingClientRect().top + offset : 0;
        window.scrollTo({
          top: Math.max(0, top),
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }

      updateAddressBar(url, isTopLink);
    };

    const queueScrollAfterMenuClose = (callback: () => void) => {
      if (!document.body.classList.contains("menu-open")) {
        callback();
        return;
      }

      let hasRun = false;

      const run = () => {
        if (hasRun) {
          return;
        }

        hasRun = true;
        window.removeEventListener("menu:close", run);
        callback();
      };

      window.addEventListener("menu:close", run, { once: true });

      const timerId = window.setTimeout(run, 520);
      deferredTimerIds.push(timerId);
    };

    const handleAnchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const clickTarget = event.target;

      if (!(clickTarget instanceof Element)) {
        return;
      }

      const anchor = clickTarget.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const rawHref = anchor.getAttribute("href")?.trim();

      if (!rawHref || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      const isSamePageLink = url.origin === window.location.origin && url.pathname === window.location.pathname;
      const isHashTopLink = rawHref === "#" || (rawHref.startsWith("#") && url.hash.length === 0);
      const isHashLink = rawHref.startsWith("#") || (isSamePageLink && url.hash.length > 0);

      if (!isSamePageLink || !isHashLink) {
        return;
      }

      const target = isHashTopLink ? null : resolveHashTarget(url.hash);

      if (!isHashTopLink && !target) {
        return;
      }

      event.preventDefault();

      queueScrollAfterMenuClose(() => {
        performSmoothScroll(target, url, isHashTopLink);
      });
    };

    window.addEventListener("initial-loader:complete", handleInitialLoaderComplete);
    window.addEventListener("load", handleWindowLoad);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("orientationchange", scheduleRefreshBurst);
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("click", handleAnchorClick, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleRefreshBurst();

    const cleanupRefreshListeners = () => {
      if (resizeTimerId !== null) {
        window.clearTimeout(resizeTimerId);
      }
      clearBurstTimers();
      clearDeferredTimers();
      window.removeEventListener("initial-loader:complete", handleInitialLoaderComplete);
      window.removeEventListener("load", handleWindowLoad);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("orientationchange", scheduleRefreshBurst);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("click", handleAnchorClick, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };

    if (useNativeSmoothScroll) {
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
