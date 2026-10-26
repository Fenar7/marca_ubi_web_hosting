"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import styles from "./KineticStage.module.scss";
import type { KineticStageProps } from "./types";

interface DisciplineNodeDef {
  readonly id: string;
  readonly label: string;
  readonly glyph: string;
  readonly xPct: number;
  readonly yPct: number;
  readonly isVertical?: boolean;
}

const DISCIPLINE_NODES: readonly DisciplineNodeDef[] = [
  { id: "arch", label: "Architecture", glyph: "✦", xPct: 50, yPct: 14 },
  { id: "infra", label: "Infrastructure", glyph: "◎", xPct: 84, yPct: 50, isVertical: true },
  { id: "systems", label: "Systems", glyph: "▲", xPct: 50, yPct: 86 },
  { id: "precision", label: "Precision", glyph: "⌘", xPct: 16, yPct: 50, isVertical: true },
  { id: "endure", label: "Endure", glyph: "✣", xPct: 50, yPct: 50 },
] as const;

interface ShockwaveInstance {
  readonly id: number;
  readonly x: number;
  readonly y: number;
}

/**
 * KineticStage — Right Panel Interactive Architectural CAD Stage.
 * Benchmark parity with 160/90 while asserting Marca Ubi's distinct architectural identity.
 * Features an autonomous precision CAD reticle that glides between studio disciplines, executes
 * tactile click pulses, and seamlessly yields to user pointer movements via GSAP quickTo.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function KineticStage({ isActive }: KineticStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const reticleRef = useRef<HTMLDivElement | null>(null);
  const isInteractingRef = useRef<boolean>(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const shockwaveCounterRef = useRef<number>(0);

  const [activeNodeId, setActiveNodeId] = useState<string>("endure");
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [coordsLabel, setCoordsLabel] = useState<string>("CADENCE: 60FPS");
  const [shockwaves, setShockwaves] = useState<readonly ShockwaveInstance[]>([]);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  // Spawn a tactile expanding shockwave ring at specified stage coordinates
  const triggerShockwave = useCallback((x: number, y: number) => {
    const id = ++shockwaveCounterRef.current;
    setShockwaves((prev) => [...prev.slice(-4), { id, x, y }]);

    // Self-cleaning pulse ring
    setTimeout(() => {
      setShockwaves((prev) => prev.filter((sw) => sw.id !== id));
    }, 700);
  }, []);

  // Initialize and run the autonomous CAD reticle navigation loop
  const startAutonomousLoop = useCallback(() => {
    if (!stageRef.current || !reticleRef.current || isReducedMotion) return;

    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const stageRect = stageRef.current.getBoundingClientRect();
    const tl = gsap.timeline({ repeat: -1 });

    DISCIPLINE_NODES.forEach((node) => {
      const targetX = (node.xPct / 100) * stageRect.width;
      const targetY = (node.yPct / 100) * stageRect.height;

      // Glide phase
      tl.to(reticleRef.current, {
        x: targetX,
        y: targetY,
        duration: 1.4,
        ease: "power2.inOut",
        onUpdate: () => {
          if (!isInteractingRef.current) {
            setCoordsLabel(`LOCKED: ${node.label.toUpperCase()}`);
          }
        },
      });

      // Arrival & Tactile Click phase
      tl.call(() => {
        if (isInteractingRef.current) return;
        setActiveNodeId(node.id);
        setIsClicking(true);
        triggerShockwave(targetX, targetY);

        setTimeout(() => setIsClicking(false), 140);
      });

      // Dwell phase for visual absorption
      tl.to({}, { duration: 0.85 });
    });

    timelineRef.current = tl;
  }, [isReducedMotion, triggerShockwave]);

  // Handle pointer enter & tracking override
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!stageRef.current || !reticleRef.current || isReducedMotion) return;

      isInteractingRef.current = true;
      if (timelineRef.current) {
        timelineRef.current.pause();
      }

      const rect = stageRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      gsap.to(reticleRef.current, {
        x: relativeX,
        y: relativeY,
        duration: 0.18,
        ease: "power3.out",
        overwrite: "auto",
      });

      setCoordsLabel(`X: ${Math.round(relativeX)}px | Y: ${Math.round(relativeY)}px`);

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

  // Handle stage clicks with tactile shockwave
  const handleStageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!stageRef.current || isReducedMotion) return;

      const rect = stageRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      setIsClicking(true);
      triggerShockwave(clickX, clickY);
      setTimeout(() => setIsClicking(false), 150);
    },
    [isReducedMotion, triggerShockwave]
  );

  // Lifecycle orchestrator: handles motion media queries and stage activation
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    motionQuery.addEventListener("change", handleMotionChange);

    if (isActive && !motionQuery.matches) {
      // Delay slightly to let layout settle after drawer expansion
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
      {/* Top Telemetry Bar */}
      <div className={styles.topTelemetry}>
        <span className={styles.statusIndicator} />
        <span>Studio Kinetic Telemetry</span>
      </div>

      {/* Centerpiece Constellation Stage */}
      <div className={styles.constellationStage}>
        <div className={styles.compassRing} />
        <div className={styles.compassRingInner} />
        <div className={styles.centerCrosshair} />

        {/* Studio Discipline Nodes arranged in architectural orbit */}
        {DISCIPLINE_NODES.map((node) => {
          const isActiveNode = activeNodeId === node.id;
          return (
            <div
              key={node.id}
              className={`${styles.disciplineNode} ${node.isVertical ? styles.nodeVertical : ""} ${
                isActiveNode ? styles.nodeActive : ""
              }`}
              style={{
                left: `${node.xPct}%`,
                top: `${node.yPct}%`,
                transform: `translate(-50%, -50%) ${node.isVertical ? "rotate(180deg)" : ""}`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveNodeId(node.id);
                if (stageRef.current) {
                  const rect = stageRef.current.getBoundingClientRect();
                  triggerShockwave(
                    (node.xPct / 100) * rect.width,
                    (node.yPct / 100) * rect.height
                  );
                }
              }}
            >
              <span className={styles.nodeGlyph}>{node.glyph}</span>
              <span className={styles.nodeLabel}>{node.label}</span>
            </div>
          );
        })}
      </div>

      {/* Autonomous / Interactive CAD Reticle Pointer */}
      <div
        ref={reticleRef}
        className={styles.reticleContainer}
        style={{
          left: isReducedMotion ? "50%" : 0,
          top: isReducedMotion ? "50%" : 0,
        }}
      >
        <svg
          viewBox="0 0 44 44"
          className={`${styles.reticleSvg} ${isClicking ? styles.isClicking : ""}`}
        >
          {/* Outer crosshairs */}
          <line x1="22" y1="2" x2="22" y2="12" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="22" y1="32" x2="22" y2="42" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="2" y1="22" x2="12" y2="22" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="32" y1="22" x2="42" y2="22" stroke="#ffffff" strokeWidth="1.5" />

          {/* Center precision ring */}
          <circle cx="22" cy="22" r="6" stroke="#ffffff" strokeWidth="1.5" fill="none" />

          {/* Central brand red reticle pip */}
          <circle cx="22" cy="22" r="2.5" fill="#ea002a" />
        </svg>

        <div className={styles.reticleChip}>{coordsLabel}</div>
      </div>

      {/* Shockwave Rings */}
      {shockwaves.map((sw) => (
        <span
          key={sw.id}
          className={styles.shockwave}
          style={{
            left: `${sw.x}px`,
            top: `${sw.y}px`,
          }}
        />
      ))}

      {/* Bottom Telemetry HUD */}
      <div className={styles.bottomTelemetry}>
        <span>KOZHIKODE &amp; TRIVANDRUM</span>
        <span className={styles.telemetryCoords}>11.2588&deg; N, 75.7804&deg; E</span>
      </div>
    </div>
  );
}

export default KineticStage;
