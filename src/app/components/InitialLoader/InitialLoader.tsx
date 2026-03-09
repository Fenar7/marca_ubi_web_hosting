"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import styles from "./InitialLoader.module.scss";

const conceptWords = ["Design", "Direction", "Concept"];
const LOADING_SECONDS = 3;
const WORD_SHIFT_DURATION = 0.42;
const FIRST_SHIFT_AT = 1.15;
const SECOND_SHIFT_AT = 2.08;

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

    document.body.classList.add(styles.loadingLocked);

    const finish = () => {
      document.documentElement.setAttribute("data-loader-complete", "true");
      (window as Window & { __initialLoaderComplete?: boolean }).__initialLoaderComplete = true;
      gsap.set(appShell, { clearProps: "transform,filter,opacity,visibility" });
      document.body.classList.remove(styles.loadingLocked);
      window.dispatchEvent(new Event("initial-loader:complete"));
      setIsVisible(false);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(logoFill, { clipPath: "inset(0 0% 0 0)" });
      gsap.set(wordsTrack, { yPercent: -200 });
      gsap.set(appShell, { autoAlpha: 0, y: 0, filter: "blur(0px)", scale: 1 });

      const reducedTimeline = gsap.timeline({
        defaults: { ease: "power1.out" },
        onComplete: finish,
      });

      reducedTimeline
        .to(progress, { scaleX: 1, duration: 1.1 }, 0)
        .to(loader, { autoAlpha: 0, duration: 0.42 }, 0.92)
        .to(appShell, { autoAlpha: 1, duration: 0.5 }, 1.02);

      return () => {
        reducedTimeline.kill();
        document.body.classList.remove(styles.loadingLocked);
      };
    }

    const context = gsap.context(() => {
      gsap.set(appShell, {
        autoAlpha: 0,
        y: 28,
        filter: "blur(10px)",
        scale: 0.985,
        transformOrigin: "50% 40%",
      });
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

    const timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: finish,
    });

    timeline
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
          scaleX: 1,
          duration: LOADING_SECONDS,
          ease: "none",
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
          autoAlpha: 0,
          y: -(rowStep * 2.2),
          duration: 0.18,
          ease: "power2.in",
        },
        2.88,
      )
      .to(
        loader,
        {
          yPercent: -100,
          duration: 1.08,
          ease: "expo.inOut",
        },
        LOADING_SECONDS,
      )
      .to(
        appShell,
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          scale: 1,
          duration: 0.9,
          ease: "power4.out",
        },
        LOADING_SECONDS + 0.14,
      );

    return () => {
      timeline.kill();
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
