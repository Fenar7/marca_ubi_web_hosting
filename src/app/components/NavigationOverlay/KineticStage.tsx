"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import styles from "./KineticStage.module.scss";
import type { KineticStageProps } from "./types";

interface WordNode {
  readonly id: string;
  readonly label: string;
  readonly glyph?: string;
  readonly xPct: number;
  readonly yPct: number;
}

const STAGE_WORDS: readonly WordNode[] = [
  { id: "culture", label: "Culture", glyph: "✦", xPct: 24, yPct: 24 },
  { id: "design", label: "Design", glyph: "✌", xPct: 76, yPct: 22 },
  { id: "craft", label: "Craft", xPct: 50, yPct: 50 },
  { id: "tech", label: "Tech", glyph: "🌐", xPct: 24, yPct: 76 },
  { id: "impact", label: "Impact", glyph: "♡", xPct: 76, yPct: 78 },
] as const;

/**
 * KineticStage — 160/90 Benchmark Graphic Kinetic Stage.
 * Obsidian black canvas hosting an authentic vector arrow cursor that autonomously navigates
 * between studio ethos words (Culture, Design, Craft, Tech, Impact), executes tactile
 * click pulses with micro-spring reactions, and seamlessly yields to pointer interactions.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function KineticStage({ isActive }: KineticStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const isInteractingRef = useRef<boolean>(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [activeWordId, setActiveWordId] = useState<string>("craft");
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  // Autonomous animation loop: moves vector cursor between words with tactile clicks
  const startAutonomousLoop = useCallback(() => {
    if (!stageRef.current || !cursorRef.current || isReducedMotion) return;

    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const stageRect = stageRef.current.getBoundingClientRect();
    const tl = gsap.timeline({ repeat: -1 });

    STAGE_WORDS.forEach((word) => {
      const targetX = (word.xPct / 100) * stageRect.width;
      const targetY = (word.yPct / 100) * stageRect.height;

      // Glide phase
      tl.to(cursorRef.current, {
        x: targetX,
        y: targetY,
        duration: 1.35,
        ease: "power2.inOut",
      });

      // Arrival & Tactile Click phase
      tl.call(() => {
        if (isInteractingRef.current) return;
        setActiveWordId(word.id);
        setIsClicking(true);

        const wordEl = stageRef.current?.querySelector(`[data-word-id="${word.id}"]`);
        if (wordEl) {
          gsap.fromTo(
            wordEl,
            { scale: 1 },
            { scale: 1.1, duration: 0.22, yoyo: true, repeat: 1, ease: "back.out(2)" }
          );
        }

        setTimeout(() => setIsClicking(false), 130);
      });

      // Dwell phase for visual absorption
      tl.to({}, { duration: 0.85 });
    });

    timelineRef.current = tl;
  }, [isReducedMotion]);

  // Pointer move handler with smooth GSAP quickTo tracking
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!stageRef.current || !cursorRef.current || isReducedMotion) return;

      isInteractingRef.current = true;
      if (timelineRef.current) {
        timelineRef.current.pause();
      }

      const rect = stageRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      gsap.to(cursorRef.current, {
        x: relativeX,
        y: relativeY,
        duration: 0.16,
        ease: "power3.out",
        overwrite: "auto",
      });

      // Reset idle debounce timer to resume autonomous mode
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        isInteractingRef.current = false;
        startAutonomousLoop();
      }, 2500);
    },
    [isReducedMotion, startAutonomousLoop]
  );

  // Stage click handler with tactile pulse
  const handleStageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!stageRef.current || isReducedMotion) return;

      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 140);
    },
    [isReducedMotion]
  );

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
      }, 200);

      return () => {
        clearTimeout(initTimer);
        motionQuery.removeEventListener("change", handleMotionChange);
        if (timelineRef.current) timelineRef.current.kill();
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      };
    }

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      if (timelineRef.current) timelineRef.current.kill();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isActive, startAutonomousLoop]);

  return (
    <div
      ref={stageRef}
      className={styles.stageHost}
      onPointerMove={handlePointerMove}
      onClick={handleStageClick}
      role="presentation"
      aria-hidden="true"
    >
      {/* Words Constellation */}
      <div className={styles.wordsContainer}>
        {STAGE_WORDS.map((word) => {
          const isActiveWord = activeWordId === word.id;
          return (
            <button
              key={word.id}
              type="button"
              data-word-id={word.id}
              className={`${styles.wordNode} ${isActiveWord ? styles.wordActive : ""}`}
              style={{
                left: `${word.xPct}%`,
                top: `${word.yPct}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveWordId(word.id);
                setIsClicking(true);
                setTimeout(() => setIsClicking(false), 140);
              }}
              tabIndex={-1}
            >
              <span className={styles.wordLabel}>{word.label}</span>
              {word.glyph && <span className={styles.nodeGlyph}>{word.glyph}</span>}
              {isActiveWord && !word.glyph && <span className={styles.wordDot} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* Authentic Vector Arrow Pointer Cursor */}
      <div
        ref={cursorRef}
        className={styles.cursorWrapper}
        style={{
          left: isReducedMotion ? "50%" : 0,
          top: isReducedMotion ? "50%" : 0,
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
  );
}

export default KineticStage;
