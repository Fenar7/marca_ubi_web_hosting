"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { shouldUseMobileMotion } from "@/app/lib/motion";
import PillButton from "../ui/PillButton/PillButton";
import CompanyProfileModal from "./CompanyProfileModal";
import styles from "./Hero.module.scss";

const heroBackgroundImage = "/images/bg-cover-image-3.png";
const ubiLogoImage = "/images/ubi.png";
const marcaLogoImage = "/images/marca.png";
const primaryArrowImage = "/hero/primary-arrow.png";
const titleLines = ["Engineering Brands", "That Are Meant", "to Be Felt."];
const topRightCalloutWords = ["The", "Brand", "Engineering", "Company"];

export default function Hero() {
  const [isCompanyProfileOpen, setIsCompanyProfileOpen] = useState(false);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const dividerRef = useRef<HTMLSpanElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const buttonWrapRef = useRef<HTMLDivElement | null>(null);
  const topRightRef = useRef<HTMLDivElement | null>(null);
  const topRightLineRef = useRef<HTMLSpanElement | null>(null);
  const topRightWordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const titleLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const logoSwitcherRef = useRef<HTMLDivElement | null>(null);
  const ubiLogoRef = useRef<HTMLImageElement | null>(null);
  const marcaLogoRef = useRef<HTMLImageElement | null>(null);
  const backgroundLayerRef = useRef<HTMLDivElement | null>(null);
  const heroImageRef = useRef<HTMLImageElement | null>(null);
  const gradientOverlayRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    const divider = dividerRef.current;
    const subtitle = subtitleRef.current;
    const buttonWrap = buttonWrapRef.current;
    const topRight = topRightRef.current;
    const topRightLine = topRightLineRef.current;
    const topRightWords = topRightWordRefs.current.filter(
      (word): word is HTMLSpanElement => word !== null,
    );
    const lines = titleLineRefs.current.filter((line): line is HTMLSpanElement => line !== null);

    if (!content || !divider || !subtitle || !buttonWrap || !topRight || !topRightLine || lines.length === 0) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let hasPlayed = false;
    let frameId: number | null = null;
    let fallbackId: number | null = null;
    const loaderElement = document.querySelector<HTMLElement>("[data-initial-loader]");

    const context = gsap.context(() => {
      gsap.set(content, { autoAlpha: 0 });
      gsap.set(lines, {
        autoAlpha: 0,
        yPercent: 118,
        rotateX: -44,
        transformOrigin: "50% 100%",
        filter: "blur(10px)",
      });
      gsap.set(divider, { autoAlpha: 0, scaleX: 0, transformOrigin: "left center" });
      gsap.set(subtitle, { autoAlpha: 0, y: 26, filter: "blur(7px)" });
      gsap.set(buttonWrap, { autoAlpha: 0, y: 28, scale: 0.96 });
      gsap.set(topRight, { autoAlpha: 1 });
      gsap.set(topRightWords, {
        autoAlpha: 0,
        yPercent: 120,
        rotateX: -28,
        filter: "blur(8px)",
        transformOrigin: "50% 100%",
      });
      gsap.set(topRightLine, {
        autoAlpha: 0,
        scaleY: 0,
        yPercent: -8,
        transformOrigin: "center top",
        boxShadow: "0 0 0 rgba(255, 255, 255, 0)",
      });
    }, content);

    const timeline = gsap.timeline({ paused: true });
    timeline
      .to(content, { autoAlpha: 1, duration: 0.2, ease: "power1.out" }, 0)
      .to(
        lines,
        {
          autoAlpha: 1,
          yPercent: 0,
          rotateX: 0,
          filter: "blur(0px)",
          duration: 1.06,
          ease: "expo.out",
          stagger: 0.13,
        },
        0.02,
      )
      .to(
        divider,
        {
          autoAlpha: 1,
          scaleX: 1,
          duration: 0.88,
          ease: "expo.out",
        },
        0.44,
      )
      .to(
        subtitle,
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.86,
          ease: "power3.out",
        },
        0.56,
      )
      .to(
        buttonWrap,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.86,
          ease: "back.out(1.26)",
        },
        0.78,
      )
      .to(
        topRightWords,
        {
          autoAlpha: 1,
          yPercent: 0,
          rotateX: 0,
          filter: "blur(0px)",
          duration: 0.92,
          ease: "expo.out",
          stagger: 0.08,
        },
        0.24,
      )
      .to(
        topRightLine,
        {
          autoAlpha: 1,
          scaleY: 1,
          yPercent: 0,
          boxShadow: "0 0 22px rgba(255, 255, 255, 0.18)",
          duration: 1.02,
          ease: "expo.out",
        },
        0.32,
      );

    const playIntro = () => {
      if (hasPlayed) {
        return;
      }
      hasPlayed = true;
      timeline.play(0);
    };

    const onLoaderComplete = () => {
      playIntro();
      window.removeEventListener("initial-loader:complete", onLoaderComplete);
    };

    window.addEventListener("initial-loader:complete", onLoaderComplete);

    if (!loaderElement) {
      frameId = window.requestAnimationFrame(playIntro);
    }

    fallbackId = window.setTimeout(playIntro, 4500);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      if (fallbackId !== null) {
        window.clearTimeout(fallbackId);
      }
      window.removeEventListener("initial-loader:complete", onLoaderComplete);
      timeline.kill();
      context.revert();
    };
  }, []);

  useLayoutEffect(() => {
    const heroSection = heroSectionRef.current;
    const backgroundLayer = backgroundLayerRef.current;
    const heroImage = heroImageRef.current;
    const overlay = gradientOverlayRef.current;

    if (!heroSection || !backgroundLayer || !heroImage || !overlay) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileMotion = shouldUseMobileMotion();
    const loaderElement = document.querySelector<HTMLElement>("[data-initial-loader]");

    let introPlayed = false;
    let introFinished = false;
    let scrollFrameId: number | null = null;
    let startFrameId: number | null = null;
    let fallbackId: number | null = null;
    const scrollLerp = reduceMotion ? 0.24 : mobileMotion ? 0.18 : 0.2;
    const scrollRange = Math.max(window.innerHeight * 0.46, 260);
    let targetProgress = Math.min(window.scrollY / scrollRange, 1);
    let currentProgress = targetProgress;

    const applyScrollMotion = (progress: number) => {
      if (mobileMotion) {
        gsap.set(backgroundLayer, {
          scale: 1 + progress * 0.035,
          y: progress * 10,
          force3D: true,
        });
        gsap.set(heroImage, {
          xPercent: -50,
          scale: 1 + progress * 0.08,
          y: progress * 38,
          rotationY: 0,
          rotationX: 0,
          force3D: true,
        });
        gsap.set(overlay, { opacity: 1 - progress * 0.12 });
        return;
      }

      gsap.set(backgroundLayer, {
        scale: 1 + progress * (reduceMotion ? 0.05 : 0.18),
        y: progress * (reduceMotion ? 10 : 46),
        force3D: true,
      });
      gsap.set(heroImage, {
        xPercent: -50,
        scale: 1 + progress * (reduceMotion ? 0.06 : 0.32),
        y: progress * (reduceMotion ? 14 : 92),
        rotationY: -progress * (reduceMotion ? 0.9 : 4.3),
        rotationX: progress * (reduceMotion ? 0.38 : 1.95),
        force3D: true,
      });
      gsap.set(overlay, { opacity: 1 - progress * (reduceMotion ? 0.05 : 0.28) });
    };

    const tickScrollMotion = () => {
      scrollFrameId = null;
      if (!introFinished) {
        return;
      }

      currentProgress += (targetProgress - currentProgress) * scrollLerp;
      if (Math.abs(targetProgress - currentProgress) < 0.0012) {
        currentProgress = targetProgress;
      }

      applyScrollMotion(currentProgress);
      if (currentProgress !== targetProgress) {
        scrollFrameId = window.requestAnimationFrame(tickScrollMotion);
      }
    };

    const queueScrollMotion = () => {
      targetProgress = Math.min(window.scrollY / scrollRange, 1);
      if (!introFinished || scrollFrameId !== null) {
        return;
      }
      scrollFrameId = window.requestAnimationFrame(tickScrollMotion);
    };

    const context = gsap.context(() => {
      gsap.set(heroSection, { perspective: 1200 });
      gsap.set(backgroundLayer, {
        scale: reduceMotion ? 1.04 : mobileMotion ? 1.03 : 1.14,
        y: reduceMotion ? -6 : mobileMotion ? -6 : -18,
        transformOrigin: "50% 50%",
      });
      gsap.set(heroImage, {
        xPercent: -50,
        scale: reduceMotion ? 1.06 : mobileMotion ? 1.08 : 1.22,
        y: reduceMotion ? -8 : mobileMotion ? -10 : -24,
        rotationX: reduceMotion ? 1.2 : mobileMotion ? 0 : 3.6,
        rotationY: reduceMotion ? -0.8 : mobileMotion ? 0 : -2.6,
        transformOrigin: "50% 50% -60px",
        filter:
          reduceMotion || mobileMotion
            ? "brightness(1.02) saturate(1.02)"
            : "brightness(1.1) saturate(1.08)",
      });
      gsap.set(overlay, { opacity: reduceMotion ? 0.93 : mobileMotion ? 0.94 : 0.84 });
    }, heroSection);

    const introTimeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        introFinished = true;
        currentProgress = targetProgress;
        applyScrollMotion(currentProgress);
      },
    });

    introTimeline
      .to(
        backgroundLayer,
        {
          scale: 1,
          y: 0,
          duration: reduceMotion ? 0.92 : mobileMotion ? 1.2 : 2.05,
          ease: "expo.out",
        },
        0,
      )
      .to(
        heroImage,
        {
          xPercent: -50,
          scale: 1,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          filter: mobileMotion ? "brightness(1.01) saturate(1.01)" : "brightness(1) saturate(1)",
          duration: reduceMotion ? 0.9 : mobileMotion ? 1.12 : 1.95,
          ease: "expo.out",
        },
        0,
      )
      .to(
        overlay,
        {
          opacity: 1,
          duration: reduceMotion ? 0.85 : mobileMotion ? 1.04 : 1.8,
          ease: "power2.out",
        },
        0.06,
      );

    const playIntro = () => {
      if (introPlayed) {
        return;
      }
      introPlayed = true;
      introTimeline.play(0);
    };

    const onLoaderComplete = () => {
      playIntro();
      window.removeEventListener("initial-loader:complete", onLoaderComplete);
    };

    window.addEventListener("initial-loader:complete", onLoaderComplete);
    window.addEventListener("scroll", queueScrollMotion, { passive: true });
    window.addEventListener("resize", queueScrollMotion);

    if (!loaderElement) {
      startFrameId = window.requestAnimationFrame(playIntro);
    }

    fallbackId = window.setTimeout(playIntro, 4500);

    return () => {
      if (scrollFrameId !== null) {
        window.cancelAnimationFrame(scrollFrameId);
      }
      if (startFrameId !== null) {
        window.cancelAnimationFrame(startFrameId);
      }
      if (fallbackId !== null) {
        window.clearTimeout(fallbackId);
      }
      window.removeEventListener("initial-loader:complete", onLoaderComplete);
      window.removeEventListener("scroll", queueScrollMotion);
      window.removeEventListener("resize", queueScrollMotion);
      introTimeline.kill();
      context.revert();
    };
  }, []);

  useLayoutEffect(() => {
    const logoSwitcher = logoSwitcherRef.current;
    const ubiLogo = ubiLogoRef.current;
    const marcaLogo = marcaLogoRef.current;

    if (!logoSwitcher || !ubiLogo || !marcaLogo) {
      return;
    }

    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const context = gsap.context(() => {
      gsap.set(ubiLogo, { yPercent: 0, autoAlpha: 1 });
      gsap.set(marcaLogo, { yPercent: 108, autoAlpha: 1 });
    }, logoSwitcher);

    if (!supportsHover || reduceMotion) {
      return () => {
        context.revert();
      };
    }

    const timeline = gsap.timeline({ paused: true });
    timeline
      .to(
        ubiLogo,
        {
          yPercent: -108,
          duration: 0.56,
          ease: "power3.inOut",
        },
        0,
      )
      .to(
        marcaLogo,
        {
          yPercent: 0,
          duration: 0.62,
          ease: "expo.out",
        },
        0.03,
      );

    const onPointerEnter = () => timeline.play();
    const onPointerLeave = () => timeline.reverse();

    logoSwitcher.addEventListener("pointerenter", onPointerEnter);
    logoSwitcher.addEventListener("pointerleave", onPointerLeave);

    return () => {
      logoSwitcher.removeEventListener("pointerenter", onPointerEnter);
      logoSwitcher.removeEventListener("pointerleave", onPointerLeave);
      timeline.kill();
      context.revert();
    };
  }, []);

  return (
    <section className={styles.heroSection} data-node-id="491:896" ref={heroSectionRef}>
      <div className={styles.backgroundLayer} ref={backgroundLayerRef} aria-hidden="true">
        <img className={styles.heroImage} ref={heroImageRef} src={heroBackgroundImage} alt="" />
        <div className={styles.gradientOverlay} ref={gradientOverlayRef} />
      </div>

      <div className={styles.contentContainer} ref={contentRef}>
        <h1 className={styles.title}>
          {titleLines.map((line, index) => (
            <span className={styles.titleLineMask} key={line}>
              <span
                className={styles.titleLine}
                ref={(element) => {
                  titleLineRefs.current[index] = element;
                }}
              >
                {line}
              </span>
            </span>
          ))}
        </h1>
        <span className={styles.divider} ref={dividerRef} />
        <p className={styles.subtitle} ref={subtitleRef}>
          Through strategy, art, and experience design, Marca Ubi builds brands with clear
          foundations, distinct expression, and digital presence that stays coherent everywhere it
          lives.
        </p>
        <div className={styles.heroButtonWrap} ref={buttonWrapRef}>
          <PillButton
            className={styles.heroButton}
            href="#contact"
            label="Start a Project"
            variant="brand"
            icon={<img className={styles.buttonIcon} src={primaryArrowImage} alt="" />}
          />
          <PillButton
            className={styles.heroButtonSecondary}
            label="Download Company Profile"
            onClick={() => setIsCompanyProfileOpen(true)}
            icon={<img className={styles.buttonIcon} src={primaryArrowImage} alt="" />}
          />
        </div>
      </div>

      <div className={styles.topRightCallout} ref={topRightRef}>
        <p className={styles.topRightText}>
          {topRightCalloutWords.map((word, index) => (
            <span className={styles.topRightWordMask} key={word}>
              <span
                className={styles.topRightWord}
                ref={(element) => {
                  topRightWordRefs.current[index] = element;
                }}
              >
                {word}
              </span>
            </span>
          ))}
        </p>
        <span className={styles.topRightLine} ref={topRightLineRef} aria-hidden="true" />
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.logoSwitcher} ref={logoSwitcherRef} aria-label="Brand logo">
          <img className={`${styles.switchLogo} ${styles.ubiLogo}`} ref={ubiLogoRef} src={ubiLogoImage} alt="Ubi." />
          <img
            className={`${styles.switchLogo} ${styles.marcaLogo}`}
            ref={marcaLogoRef}
            src={marcaLogoImage}
            alt=""
            aria-hidden="true"
          />
        </div>
      </div>

      <CompanyProfileModal
        isOpen={isCompanyProfileOpen}
        onClose={() => setIsCompanyProfileOpen(false)}
      />
    </section>
  );
}
