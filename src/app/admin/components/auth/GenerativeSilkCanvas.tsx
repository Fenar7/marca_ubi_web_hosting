'use client';

/**
 * @file GenerativeSilkCanvas.tsx
 * @description Interactive Generative Mathematical Silk Simulation Engine for Marca Ubi.
 *              Replaces rigid 2D vector translations with true multi-harmonic travelling wave
 *              mechanics where waves ripple through the fabric horizontally (via phase velocity c_k),
 *              dynamic specular light refractions, and organic cursor-reactive fluid physics.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useEffect, useRef } from 'react';
import styles from './AdminAuthShell.module.scss';

interface WaveHarmonic {
  freq: number;
  speed: number;
  amp: number;
  phase: number;
}

export function GenerativeSilkCanvas(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let isVisible = true;

    // Interactive mouse coordinates with smooth exponential dampening
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      intensity: 0,
      targetIntensity: 0,
    };

    // Responsive Canvas Resize Observer with Retina Display DPR Scaling
    const updateDimensions = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.scale(dpr, dpr);
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Visibility observer to pause animation loop when tab is hidden or offscreen
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Mouse wake interaction handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.targetIntensity = 1;
    };

    const handleMouseLeave = () => {
      mouse.targetIntensity = 0;
    };

    const parentElem = canvas.parentElement;
    if (parentElem) {
      parentElem.addEventListener('mousemove', handleMouseMove, { passive: true });
      parentElem.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    }

    // Check for user reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Multi-Harmonic Travelling Wave Definitions
    // Notice: Waves travel through space via (u * freq - time * speed)
    const dominantHarmonics: WaveHarmonic[] = [
      { freq: 3.8, speed: 1.6, amp: 34, phase: 0.0 },
      { freq: 7.2, speed: 2.4, amp: 18, phase: 1.4 },
      { freq: 11.5, speed: 3.2, amp: 9, phase: 2.8 },
    ];

    const counterHarmonics: WaveHarmonic[] = [
      { freq: 4.2, speed: -1.2, amp: 40, phase: 0.8 },
      { freq: 8.6, speed: -1.9, amp: 22, phase: 2.1 },
      { freq: 13.0, speed: -2.8, amp: 11, phase: 3.4 },
    ];

    const upperHarmonics: WaveHarmonic[] = [
      { freq: 3.2, speed: 1.1, amp: 24, phase: 0.5 },
      { freq: 6.8, speed: 1.8, amp: 14, phase: 1.9 },
    ];

    // Compute travelling wave displacement at relative coordinate u in [0, 1]
    const computeWaveDisplacement = (
      u: number,
      t: number,
      harmonics: WaveHarmonic[],
      xPos: number,
      yBase: number
    ): number => {
      let wave = 0;
      for (let i = 0; i < harmonics.length; i++) {
        const h = harmonics[i];
        wave += Math.sin(u * h.freq - t * h.speed + h.phase) * h.amp;
      }

      // Add interactive mouse cursor ripple when cursor is near
      if (mouse.intensity > 0.01) {
        const dx = xPos - mouse.x;
        const dy = yBase - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 200;

        if (dist < maxDist) {
          const factor = (1 - dist / maxDist) * mouse.intensity;
          const ripple = Math.sin(dist * 0.06 - t * 4) * 32 * factor;
          wave += ripple;
        }
      }

      return wave;
    };

    // Draw single organic continuous silk ribbon with volumetric gradient
    const drawSilkRibbon = (
      width: number,
      height: number,
      baseYFunc: (u: number) => number,
      thicknessFunc: (u: number) => number,
      harmonics: WaveHarmonic[],
      colorStops: { stop: number; color: string }[],
      drawSpecularFilament: boolean,
      filamentWidth = 1.5
    ) => {
      const steps = 70;
      const topPoints: { x: number; y: number }[] = [];
      const bottomPoints: { x: number; y: number }[] = [];

      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const x = u * width;
        const yBase = baseYFunc(u);
        const thickness = thicknessFunc(u);
        const displacement = computeWaveDisplacement(u, time, harmonics, x, yBase);

        const yTop = yBase + displacement;
        const yBottom = yTop + thickness;

        topPoints.push({ x, y: yTop });
        bottomPoints.push({ x, y: yBottom });
      }

      // Construct fluid closed ribbon polygon
      ctx.beginPath();
      ctx.moveTo(topPoints[0].x, topPoints[0].y);

      for (let i = 1; i < topPoints.length; i++) {
        const p0 = topPoints[i - 1];
        const p1 = topPoints[i];
        const cx = (p0.x + p1.x) / 2;
        const cy = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, cx, cy);
      }
      ctx.lineTo(topPoints[topPoints.length - 1].x, topPoints[topPoints.length - 1].y);

      // Wrap around bottom edge in reverse
      for (let i = bottomPoints.length - 1; i >= 0; i--) {
        const p = bottomPoints[i];
        if (i === bottomPoints.length - 1) {
          ctx.lineTo(p.x, p.y);
        } else {
          const pNext = bottomPoints[i + 1];
          const cx = (p.x + pNext.x) / 2;
          const cy = (p.y + pNext.y) / 2;
          ctx.quadraticCurveTo(pNext.x, pNext.y, cx, cy);
        }
      }

      ctx.closePath();

      // Dynamic vertical gradient tailored to wave height
      const grad = ctx.createLinearGradient(0, height * 0.15, width, height * 0.85);
      for (const stop of colorStops) {
        grad.addColorStop(stop.stop, stop.color);
      }

      ctx.fillStyle = grad;
      ctx.fill();

      // Draw high-tension specular crest filament tracking the upper ridge
      if (drawSpecularFilament) {
        ctx.beginPath();
        ctx.moveTo(topPoints[0].x, topPoints[0].y);

        for (let i = 1; i < topPoints.length; i++) {
          const p0 = topPoints[i - 1];
          const p1 = topPoints[i];
          const cx = (p0.x + p1.x) / 2;
          const cy = (p0.y + p1.y) / 2;
          ctx.quadraticCurveTo(p0.x, p0.y, cx, cy);
        }
        ctx.lineTo(topPoints[topPoints.length - 1].x, topPoints[topPoints.length - 1].y);

        const filamentGrad = ctx.createLinearGradient(0, 0, width, height);
        filamentGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        filamentGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
        filamentGrad.addColorStop(0.55, 'rgba(255, 175, 190, 0.95)');
        filamentGrad.addColorStop(0.85, 'rgba(234, 0, 42, 0.6)');
        filamentGrad.addColorStop(1, 'rgba(234, 0, 42, 0)');

        ctx.strokeStyle = filamentGrad;
        ctx.lineWidth = filamentWidth;
        ctx.stroke();
      }
    };

    // Master Render Loop
    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Smooth mouse coordinate interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;
      mouse.intensity += (mouse.targetIntensity - mouse.intensity) * 0.05;

      // Advance wave time
      time += 0.016;

      ctx.clearRect(0, 0, width, height);

      // Layer 1: Ribbon Upper (Framing top-left brand area)
      drawSilkRibbon(
        width,
        height,
        (u) => height * (0.12 + 0.16 * u - 0.14 * Math.sin(u * Math.PI)),
        (u) => 110 + 60 * Math.sin(u * Math.PI),
        upperHarmonics,
        [
          { stop: 0.0, color: 'rgba(80, 0, 14, 0.65)' },
          { stop: 0.45, color: 'rgba(180, 0, 32, 0.78)' },
          { stop: 0.85, color: 'rgba(234, 0, 42, 0.65)' },
          { stop: 1.0, color: 'rgba(40, 0, 8, 0.45)' },
        ],
        true,
        1.0
      );

      // Layer 2: Ribbon Counter (Volumetric garnet under-fold creating 3D shadow depth)
      drawSilkRibbon(
        width,
        height,
        (u) => height * (0.42 + 0.28 * u - 0.18 * Math.sin(u * Math.PI)),
        (u) => 160 + 120 * Math.sin(u * Math.PI),
        counterHarmonics,
        [
          { stop: 0.0, color: 'rgba(30, 0, 5, 0.95)' },
          { stop: 0.35, color: 'rgba(85, 0, 15, 0.98)' },
          { stop: 0.7, color: 'rgba(138, 0, 23, 0.92)' },
          { stop: 1.0, color: 'rgba(25, 0, 4, 0.85)' },
        ],
        true,
        1.2
      );

      // Layer 3: Ribbon Dominant (Signature Marca Ubi crimson silk body with carmine specular crest)
      drawSilkRibbon(
        width,
        height,
        (u) => height * (0.26 + 0.36 * u - 0.22 * Math.sin(u * Math.PI)),
        (u) => 140 + 90 * Math.sin(u * Math.PI),
        dominantHarmonics,
        [
          { stop: 0.0, color: 'rgba(110, 0, 18, 0.95)' },
          { stop: 0.28, color: 'rgba(185, 0, 32, 0.98)' },
          { stop: 0.55, color: 'rgba(234, 0, 42, 1.0)' },
          { stop: 0.78, color: 'rgba(255, 59, 92, 0.98)' },
          { stop: 1.0, color: 'rgba(140, 0, 24, 0.92)' },
        ],
        true,
        2.0
      );

      // If user prefers reduced motion, render a single frame and halt
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (parentElem) {
        parentElem.removeEventListener('mousemove', handleMouseMove);
        parentElem.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={styles.generativeCanvas}
      aria-hidden="true"
    />
  );
}
