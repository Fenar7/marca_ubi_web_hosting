"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { preloadCriticalAssets } from "@/app/lib/assetPreloader";
import styles from "./InitialLoader.module.scss";

const conceptWords = ["Design", "Art", "Architecture", "Brand architecture"];
const WORD_SHIFT_DURATION = 0.42;
const FIRST_SHIFT_AT = 0.8;
const SECOND_SHIFT_AT = 1.5;
const THIRD_SHIFT_AT = 2.2;
const MIN_BRAND_TIME_MS = 2200;
const SESSION_STORAGE_KEY = "marca_ubi_initial_loader_shown";

export default function InitialLoader() {
  const [isVisible, setIsVisible] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const logoFillRef = useRef<HTMLImageElement | null>(null);
  const wordsTrackRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLSpanElement | null>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useLayoutEffect(() => {
    const loader = loaderRef.current;
    const logoFill = logoFillRef.current;
    const wordsTrack = wordsTrackRef.current;
    const progress = progressRef.current;
    const words = wordRefs.current.filter((word): word is HTMLSpanElement => word !== null);
    const appShell = document.querySelector<HTMLElement>("[data-app-shell]");

    if (!loader || !logoFill || !wordsTrack || !appShell) {
      return;
    }

    let isAlreadyShown = false;
    try {
      isAlreadyShown = window.sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
    } catch {
      isAlreadyShown = false;
    }

    if (isAlreadyShown) {
      loader.style.display = "none";
      document.documentElement.setAttribute("data-loader-complete", "true");
      (window as Window & { __initialLoaderComplete?: boolean }).__initialLoaderComplete = true;
      gsap.set(appShell, { clearProps: "opacity,visibility" });
      document.body.classList.remove(styles.loadingLocked);
      window.dispatchEvent(new Event("initial-loader:lift"));
      window.dispatchEvent(new Event("initial-loader:complete"));
      setIsVisible(false);
      return;
    }

    let isCancelled = false;
    document.body.classList.add(styles.loadingLocked);

    const finish = () => {
      if (isCancelled) return;
      document.documentElement.setAttribute("data-loader-complete", "true");
      (window as Window & { __initialLoaderComplete?: boolean }).__initialLoaderComplete = true;
      try {
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
      } catch {
        // Safe fallback for restricted storage environments
      }
      gsap.set(appShell, { clearProps: "opacity,visibility" });
      document.body.classList.remove(styles.loadingLocked);
      window.dispatchEvent(new Event("initial-loader:complete"));
      setIsVisible(false);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(logoFill, { clipPath: "inset(0 0% 0 0)" });
      gsap.set(wordsTrack, { yPercent: -200 });
      gsap.set(appShell, { autoAlpha: 0 });

      const reducedTimeline = gsap.timeline({
        defaults: { ease: "power1.out" },
        onComplete: finish,
      });

      reducedTimeline
        .to(progress, { scaleX: 1, duration: 0.8 }, 0)
        .add(() => {
          window.dispatchEvent(new Event("initial-loader:lift"));
        }, 0.6)
        .to(loader, { autoAlpha: 0, duration: 0.35 }, 0.6)
        .to(appShell, { autoAlpha: 1, duration: 0.35 }, 0.6);

      return () => {
        isCancelled = true;
        reducedTimeline.kill();
        document.body.classList.remove(styles.loadingLocked);
      };
    }

    const context = gsap.context(() => {
      // NOTE: We only animate opacity on appShell.
      // We explicitly avoid filter: blur() and scale() which cause expensive full-screen
      // shader recalculations and break ScrollTrigger coordinate offsets.
      gsap.set(appShell, { autoAlpha: 0 });
      gsap.set(logoFill, { clipPath: "inset(0 100% 0 0)" });
      gsap.set(words, { autoAlpha: 1, yPercent: 0 });
      gsap.set(wordsTrack, { y: 0, autoAlpha: 1 });
      if (progress) {
        gsap.set(progress, { scaleX: 0, transformOrigin: "left center" });
      }
    }, loader);

    const wordHeight = words[0]?.getBoundingClientRect().height ?? 0;
    const trackStyles = window.getComputedStyle(wordsTrack);
    const rowGap = Number.parseFloat(trackStyles.rowGap || trackStyles.gap || "0") || 0;
    const rowStep = wordHeight + rowGap;

    // Phase 1: Brand story sequence (logo reveal + concept words + progress to 92%)
    const phase1Timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
    });

    phase1Timeline
      .to(
        logoFill,
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 1.1,
          ease: "expo.out",
        },
        0,
      )
      .to(
        progress,
        {
          scaleX: 0.92,
          duration: 2.2,
          ease: "power1.out",
        },
        0,
      )
      .to(
        wordsTrack,
        {
          y: -rowStep,
          duration: WORD_SHIFT_DURATION,
          ease: "power2.inOut",
        },
        FIRST_SHIFT_AT,
      )
      .to(
        wordsTrack,
        {
          y: -(rowStep * 2),
          duration: WORD_SHIFT_DURATION,
          ease: "power2.inOut",
        },
        SECOND_SHIFT_AT,
      )
      .to(
        wordsTrack,
        {
          y: -(rowStep * 3),
          duration: WORD_SHIFT_DURATION,
          ease: "power2.inOut",
        },
        THIRD_SHIFT_AT,
      );

    let phase2Timeline: gsap.core.Timeline | null = null;

    // Gate: Wait for critical visual assets + minimum brand storytelling duration
    const minTimePromise = new Promise<void>((resolve) => {
      window.setTimeout(resolve, MIN_BRAND_TIME_MS);
    });

    Promise.all([preloadCriticalAssets(3800), minTimePromise]).then(() => {
      if (isCancelled) return;

      // Phase 2: Complete progress bar, signal lift, slide curtain up
      phase2Timeline = gsap.timeline({
        onComplete: finish,
      });

      phase2Timeline
        .to(
          wordsTrack,
          {
            autoAlpha: 0,
            y: -(rowStep * 3.2),
            duration: 0.2,
            ease: "power2.in",
          },
          0,
        )
        .to(
          progress,
          {
            scaleX: 1,
            duration: 0.22,
            ease: "power2.out",
          },
          0,
        )
        .add(() => {
          // Fire lift event right as the curtain begins rolling up so Hero animates concurrently
          window.dispatchEvent(new Event("initial-loader:lift"));
        }, 0.22)
        .to(
          loader,
          {
            yPercent: -100,
            duration: 0.96,
            ease: "expo.inOut",
          },
          0.22,
        )
        .to(
          appShell,
          {
            autoAlpha: 1,
            duration: 0.45,
            ease: "power2.out",
          },
          0.28,
        );
    });

    return () => {
      isCancelled = true;
      phase1Timeline.kill();
      if (phase2Timeline) {
        phase2Timeline.kill();
      }
      context.revert();
      document.body.classList.remove(styles.loadingLocked);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.loaderRoot} ref={loaderRef} aria-hidden="true" data-initial-loader>
      <div className={styles.backdrop} />
      <div className={styles.gridOverlay} />

      <div className={styles.contentWrap}>
        <div className={styles.logoWrap}>
          <img className={styles.logoBase} src="/hero/marca-ubi-logo.png" alt="" />
          <img className={styles.logoFill} ref={logoFillRef} src="/hero/marca-ubi-logo.png" alt="" />
          <span className={styles.logoGlow} />
        </div>

        <span className={styles.progressTrack}>
          <span className={styles.progressFill} ref={progressRef} />
        </span>

        <div className={styles.wordsViewport}>
          <div className={styles.wordsTrack} ref={wordsTrackRef}>
            {conceptWords.map((word, index) => (
              <span
                className={styles.word}
                key={word}
                ref={(element) => {
                  wordRefs.current[index] = element;
                }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
