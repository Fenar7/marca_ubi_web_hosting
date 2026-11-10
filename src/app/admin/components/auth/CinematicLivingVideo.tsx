'use client';

/**
 * @file CinematicLivingVideo.tsx
 * @description Master Living Cinema Video Engine for Marca Ubi Commercial Auth Stage.
 *              Consumes the flagship studio film (/video/video-web-faststart.mp4 / /video/video-web.mp4)
 *              with 0ms glitch mitigation, GPU hardware acceleration, tab visibility throttling,
 *              and prefers-reduced-motion / battery-saver static poster fallback.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useRef, useState, useEffect } from 'react';
import styles from './AdminAuthShell.module.scss';

export function CinematicLivingVideo(): React.ReactElement | null {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [isLowPowerMode, setIsLowPowerMode] = useState<boolean>(false);

  useEffect(() => {
    // Respect OS-level reduced motion accessibility preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isLowPowerMode) return;

    const video = videoRef.current;
    if (!video) return;

    // Pause video decode when tab is hidden to conserve GPU/battery
    const handleVisibility = () => {
      if (document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err: DOMException) => {
        // Fall back gracefully if browser policy or mobile Low Power Mode blocks autoplay
        if (err.name === 'NotAllowedError') {
          setIsLowPowerMode(true);
        }
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [prefersReducedMotion, isLowPowerMode]);

  if (prefersReducedMotion || isLowPowerMode) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      className={`${styles.showcaseVideo} ${isVideoLoaded ? styles.videoLoaded : ''}`}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onCanPlay={() => setIsVideoLoaded(true)}
      onError={() => setIsLowPowerMode(true)}
      suppressHydrationWarning
      aria-hidden="true"
    >
      <source src="/video/video-web-faststart.mp4" type="video/mp4" />
      <source src="/video/video-web.mp4" type="video/mp4" />
    </video>
  );
}
