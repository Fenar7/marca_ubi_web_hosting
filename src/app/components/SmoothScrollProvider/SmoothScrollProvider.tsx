"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { shouldUseMobileMotion } from "@/app/lib/motion";
import { isOverlayScrollLocked, onOverlayScrollLockChange } from "@/app/lib/overlayScrollLock";

type SmoothScrollProviderProps = Readonly<{
  children: React.ReactNode;
}>;

export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Skip Lenis entirely in Sanity Studio and Admin Workspace panels — let browser handle standard native scroll
    if (pathname?.startsWith("/studio") || pathname?.startsWith("/admin")) {
      document.documentElement.classList.remove("lenis", "lenis-smooth", "lenis-scrolling", "lenis-stopped");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    let lenis: Lenis | null = null;
    let resizeTimerId: number | null = null;
    const burstTimerIds: number[] = [];
    const deferredTimerIds: number[] = [];
    /** One-shot subscriptions a queued anchor scroll is still waiting on when the page unmounts. */
    const lockSubscriptions: (() => void)[] = [];
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
      while (lockSubscriptions.length > 0) {
        lockSubscriptions.pop()?.();
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

    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // The loader finishing is not the page being free: if a dialog owns the viewport at that moment,
    // starting the scroll-hijack here is what makes the page behind it move under a closed lid.
    const handleInitialLoaderLift = () => {
      if (!isOverlayScrollLocked()) {
        lenis?.start();
      }
    };

    const handleInitialLoaderComplete = () => {
      if (!isOverlayScrollLocked()) {
        lenis?.start();
      }
      scheduleRefreshBurst();
      if (window.location.hash) {
        scrollToCurrentHash(100);
      }
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

    const scrollToCurrentHash = (delayMs = 0) => {
      const rawHash = window.location.hash;
      if (!rawHash || rawHash === "#") {
        return;
      }

      const runScroll = () => {
        const target = resolveHashTarget(rawHash);
        if (!target) {
          return;
        }
        performSmoothScroll(target, new URL(window.location.href), false);
      };

      if (delayMs > 0) {
        const timerId = window.setTimeout(runScroll, delayMs);
        deferredTimerIds.push(timerId);
      } else {
        window.requestAnimationFrame(runScroll);
      }
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

    // An anchor inside the navigation has to be scrolled to after the overlay is off the screen, not
    // while it is still covering the page. The wait is on the lock, not on a body class or a bespoke
    // event: the lock is the thing that says a surface is on top of the page, and the timer only exists
    // so a hold that never releases cannot swallow the visitor's click forever.
    const queueScrollAfterMenuClose = (callback: () => void) => {
      if (!isOverlayScrollLocked()) {
        callback();
        return;
      }

      let hasRun = false;
      let unsubscribe: (() => void) | null = null;

      const run = () => {
        if (hasRun) {
          return;
        }

        hasRun = true;
        unsubscribe?.();
        callback();
      };

      unsubscribe = onOverlayScrollLockChange((locked) => {
        if (!locked) {
          run();
        }
      });

      // A subscription handed out on a click is a subscription that must not survive the page it was
      // queued on, so it is registered for teardown as well as for the release it is waiting on.
      lockSubscriptions.push(() => {
        hasRun = true;
        unsubscribe?.();
      });

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
      const isHashTopLink =
        (isSamePageLink && (rawHref === "/" || rawHref === window.location.pathname)) ||
        rawHref === "#" ||
        (rawHref.startsWith("#") && url.hash.length === 0);
      const isHashLink = isHashTopLink || rawHref.startsWith("#") || (isSamePageLink && url.hash.length > 0);

      if (!isSamePageLink || !isHashLink) {
        return;
      }

      const target = isHashTopLink
        ? (resolveHashTarget("#project-form") ?? resolveHashTarget("#home") ?? null)
        : resolveHashTarget(url.hash);

      if (!isHashTopLink && !target) {
        return;
      }

      event.preventDefault();

      queueScrollAfterMenuClose(() => {
        performSmoothScroll(target, url, isHashTopLink);
      });
    };

    const handleHashChange = () => {
      scrollToCurrentHash(0);
    };

    const handlePopState = () => {
      if (window.location.hash) {
        scrollToCurrentHash(20);
      }
    };

    window.addEventListener("initial-loader:lift", handleInitialLoaderLift);
    window.addEventListener("initial-loader:complete", handleInitialLoaderComplete);
    window.addEventListener("load", handleWindowLoad);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("orientationchange", scheduleRefreshBurst);
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleAnchorClick, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleRefreshBurst();

    const isLoaderActive =
      Boolean(document.querySelector("[data-initial-loader]")) &&
      document.documentElement.getAttribute("data-loader-complete") !== "true";

    if (!isLoaderActive) {
      if (window.location.hash) {
        scrollToCurrentHash(140);
      } else {
        window.scrollTo(0, 0);
      }
    }

    const cleanupRefreshListeners = () => {
      if (resizeTimerId !== null) {
        window.clearTimeout(resizeTimerId);
      }
      clearBurstTimers();
      clearDeferredTimers();
      window.removeEventListener("initial-loader:lift", handleInitialLoaderLift);
      window.removeEventListener("initial-loader:complete", handleInitialLoaderComplete);
      window.removeEventListener("load", handleWindowLoad);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("orientationchange", scheduleRefreshBurst);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handlePopState);
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

    // Lenis answers to the lock, not to a class somebody remembered to set.
    //
    // This used to be four window events plus a read of `document.body.classList`, which is a promise
    // the surfaces on top of the page never actually made: the header released its hold from a GSAP
    // `onReverseComplete` that an interrupted reverse never reaches, and the pod's close dispatched
    // into the same channel the navigation uses, so whichever of them closed second decided whether the
    // page could scroll. A subscriber that is told the current truth on mount cannot get out of step, and
    // it costs the five surfaces nothing to be correct, because the lock they already hold is the source.
    const releaseLockSubscription = onOverlayScrollLockChange((locked) => {
      if (locked) {
        lenisInstance.stop();
        return;
      }
      lenisInstance.start();
      scheduleRefreshBurst();
    });

    // The opening page holds the scroll while the loader is still up, on its own account: the lock says
    // nothing about it, and the loader's own completion event is what hands the page back.
    if (isLoaderActive) {
      lenisInstance.stop();
    }

    scheduleRefreshBurst();

    if (!isLoaderActive && !window.location.hash) {
      lenisInstance.scrollTo(0, { immediate: true });
    }

    return () => {
      cleanupRefreshListeners();
      releaseLockSubscription();
      gsap.ticker.remove(onTick);
      lenisInstance.off("scroll", ScrollTrigger.update);
      lenisInstance.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}
