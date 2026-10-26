"use client";

import React, { useRef, useEffect, useState } from "react";
import styles from "./BackgroundVideoEngine.module.scss";

interface BackgroundVideoEngineProps {
  isPausedByModal?: boolean;
}

/**
 * Single Persistent Living Video Engine.
 * Implements the 160over90 fixed background cinema pattern.
 * Remains mounted at z-index: -1 across the entire client session with GPU hardware acceleration.
 */
export function BackgroundVideoEngine({ isPausedByModal = false }: BackgroundVideoEngineProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    // Respect OS-level reduced motion accessibility preferences
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleMotionChange);
    return () => mediaQuery.removeEventListener("change", handleMotionChange);
  }, []);

  useEffect(() => {
    // Global event listeners to pause background video during showreel modal playback
    const handleReelOpen = () => {
      videoRef.current?.pause();
    };
    const handleReelClose = () => {
      if (!prefersReducedMotion && !isLowPowerMode) {
        videoRef.current?.play().catch(() => {});
      }
    };

    window.addEventListener("reel:open", handleReelOpen);
    window.addEventListener("reel:close", handleReelClose);
    return () => {
      window.removeEventListener("reel:open", handleReelOpen);
      window.removeEventListener("reel:close", handleReelClose);
    };
  }, [prefersReducedMotion, isLowPowerMode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion) return;

    if (isPausedByModal) {
      video.pause();
    } else {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err: DOMException) => {
          // If browser policy or mobile Low Power Mode blocks autoplay, fall back gracefully
          if (err.name === "NotAllowedError") {
            setIsLowPowerMode(true);
          }
        });
      }
    }
  }, [isPausedByModal, prefersReducedMotion]);

  if (prefersReducedMotion || isLowPowerMode) {
    return (
      <div
        className={styles.staticPosterFallback}
        aria-hidden="true"
        role="presentation"
      />
    );
  }

  return (
    <div className={styles.videoHostContainer} aria-hidden="true">
      <video
        ref={videoRef}
        className={`${styles.fixedVideoElement} ${isVideoLoaded ? styles.loaded : ""}`}
        src="/video/video-web.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onCanPlay={() => setIsVideoLoaded(true)}
      />
      <div className={styles.ambientScrim} />
    </div>
  );
}

export default BackgroundVideoEngine;
