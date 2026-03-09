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

    const handleScrollRefresh = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener("initial-loader:complete", handleScrollRefresh);
    requestAnimationFrame(handleScrollRefresh);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => {
        window.removeEventListener("initial-loader:complete", handleScrollRefresh);
      };
    }

    if (shouldUseMobileMotion()) {
      // On real mobile: iOS shrinks the viewport when address bar hides / shows.
      // The initial rAF refresh fires before layout settles → trigger positions are wrong.
      // Add a 600ms delayed refresh so everything recalibrates after fonts + images load.
      const mobileRefreshTimer = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 600);

      return () => {
        window.clearTimeout(mobileRefreshTimer);
        window.removeEventListener("initial-loader:complete", handleScrollRefresh);
      };
    }

    // Prevent GSAP from catching up missed frames — biggest single fix for scroll jank
    gsap.ticker.lagSmoothing(0);

    const lenis = new Lenis({
      duration: 1.1,
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
    });

    // Official Lenis + GSAP ScrollTrigger integration pattern
    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(onTick);
    gsap.ticker.fps(120);

    const handleLoaderComplete = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };

    window.addEventListener("initial-loader:complete", handleLoaderComplete);
    requestAnimationFrame(handleLoaderComplete);

    return () => {
      window.removeEventListener("initial-loader:complete", handleScrollRefresh);
      window.removeEventListener("initial-loader:complete", handleLoaderComplete);
      gsap.ticker.remove(onTick);
      lenis.off("scroll", ScrollTrigger.update);
      lenis.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}
