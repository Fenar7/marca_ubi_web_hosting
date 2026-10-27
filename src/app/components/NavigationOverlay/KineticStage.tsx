"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import styles from "./KineticStage.module.scss";
import type { KineticStageProps, WordNode } from "./types";

/**
 * 5 Core Capability Practice Areas + Center Nexus Hub with Iconic Glyphs.
 * Strictly maps to Marca Ubi capabilities with benchmark tactile glyphs.
 */
export const DEFAULT_STAGE_WORDS: readonly WordNode[] = [
  {
    id: "brand-engineering",
    label: "Brand Engineering",
    glyph: "✦",
    xPct: 24,
    yPct: 22,
  },
  {
    id: "identity-art-systems",
    label: "Identity & Art Systems",
    glyph: "✌",
    xPct: 76,
    yPct: 22,
  },
  {
    id: "brand-transformation",
    label: "Brand Transformation",
    xPct: 50,
    yPct: 50,
    isCenterHub: true,
  },
  {
    id: "digital-experience-design",
    label: "Digital Experience Design",
    glyph: "🌐",
    xPct: 24,
    yPct: 78,
  },
  {
    id: "communication-growth",
    label: "Communication & Growth",
    glyph: "♡",
    xPct: 76,
    yPct: 78,
  },
] as const;

/**
 * KineticStage — 160/90 Benchmark Graphic Kinetic Constellation Stage.
 * Obsidian black canvas hosting an authentic vector arrow cursor that autonomously navigates
 * between studio practice areas (with iconic glyphs ✦, ✌, 🌐, ♡), culminating at the
 * Brand Transformation center hub (with red dot), in a continuous uninterrupted flight loop.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function KineticStage({
  isActive,
  words = DEFAULT_STAGE_WORDS,
  onWordChange,
}: KineticStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const wordsContainerRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [activeWordId, setActiveWordId] = useState<string>("brand-transformation");
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  /**
   * Executes a micro-spring scale pulse on the target node's inner container.
   */
  const triggerNodePulse = useCallback((wordId: string) => {
    if (!wordsContainerRef.current) return;
    const wordEl = wordsContainerRef.current.querySelector<HTMLElement>(`[data-word-id="${wordId}"]`);
    if (!wordEl) return;

    const innerEl = wordEl.querySelector<HTMLElement>(`.${styles.wordInner}`) ?? wordEl;
    gsap.fromTo(
      innerEl,
      { scale: 1 },
      {
        scale: 1.08,
        duration: 0.22,
        yoyo: true,
        repeat: 1,
        ease: "back.out(2)",
        overwrite: "auto",
      }
    );
  }, []);

  /**
   * Continuous, uninterrupted autonomous animation loop.
   * Percentage coordinates guarantee bulletproof alignment without DOM getBoundingClientRect failure.
   */
  const startAutonomousLoop = useCallback(() => {
    if (!cursorRef.current || isReducedMotion) return;

    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const tl = gsap.timeline({ repeat: -1 });

    words.forEach((word) => {
      // 1. Fluid flight glide to the target node percentage coordinates
      tl.to(cursorRef.current, {
        left: `${word.xPct}%`,
        top: `${word.yPct}%`,
        duration: 1.25,
        ease: "power2.inOut",
      });

      // 2. Arrival & Tactile Click phase
      tl.call(() => {
        setActiveWordId(word.id);
        setIsClicking(true);
        triggerNodePulse(word.id);
        onWordChange?.(word.id);

        setTimeout(() => setIsClicking(false), 130);
      });

      // 3. Dwell phase for visual absorption
      tl.to({}, { duration: 0.85 });
    });

    timelineRef.current = tl;
  }, [isReducedMotion, words, triggerNodePulse, onWordChange]);

  // Motion preference and activation lifecycle
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    motionQuery.addEventListener("change", handleMotionChange);

    if (isActive && !motionQuery.matches) {
      const initTimer = setTimeout(() => {
        startAutonomousLoop();
      }, 150);

      return () => {
        clearTimeout(initTimer);
        motionQuery.removeEventListener("change", handleMotionChange);
        if (timelineRef.current) timelineRef.current.kill();
      };
    }

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      if (timelineRef.current) timelineRef.current.kill();
    };
  }, [isActive, startAutonomousLoop]);

  return (
    <div
      ref={stageRef}
      className={styles.stageHost}
      role="presentation"
      aria-hidden="true"
    >
      {/* Words Constellation */}
      <div ref={wordsContainerRef} className={styles.wordsContainer}>
        {words.map((word) => {
          const isActiveWord = activeWordId === word.id;
          return (
            <button
              key={word.id}
              type="button"
              data-word-id={word.id}
              className={`${styles.wordNode} ${isActiveWord ? styles.wordActive : ""} ${
                word.isCenterHub ? styles.isCenterHub : ""
              }`}
              style={{
                left: `${word.xPct}%`,
                top: `${word.yPct}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveWordId(word.id);
                setIsClicking(true);
                triggerNodePulse(word.id);
                onWordChange?.(word.id);
                setTimeout(() => setIsClicking(false), 140);
              }}
              tabIndex={-1}
              aria-label={word.label}
            >
              <span className={styles.wordInner}>
                {word.isCenterHub && (
                  <span className={styles.hubDot} aria-hidden="true">
                    <span className={styles.hubDotPing} />
                  </span>
                )}
                <span className={styles.wordLabel}>{word.label}</span>
                {word.glyph && <span className={styles.nodeGlyph}>{word.glyph}</span>}
              </span>
            </button>
          );
        })}

        {/* Authentic Vector Arrow Pointer Cursor: Located inside container for percentage sync */}
        <div
          ref={cursorRef}
          className={styles.cursorWrapper}
          style={{
            left: "50%",
            top: "50%",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            className={`${styles.vectorCursor} ${isClicking ? styles.isClicking : ""}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 3L10.5 21L14 13.5L21.5 10L3 3Z"
              fill="#ffffff"
              stroke="#000000"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default KineticStage;
