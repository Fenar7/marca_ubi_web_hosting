"use client";

import React, { useRef, useEffect, useState } from "react";
import styles from "./BackgroundVideoEngine.module.css";

interface BackgroundVideoEngineProps {
  isPausedByModal?: boolean;
}

/**
 * Single Persistent Living Video Engine.
 * Implements the 160over90 fixed background cinema pattern.
 * Remains mounted at z-index: -1 across the entire client session with GPU hardware acceleration.
 *
 * Performance enhancements:
 * Keeps the video element's first decoded frame visible during buffering, with
 * a neutral canvas for reduced-motion and autoplay-blocked environments.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function BackgroundVideoEngine({ isPausedByModal = false }: BackgroundVideoEngineProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);

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
      {/* 0ms Immediate High-Fidelity Luxury Poster to eliminate black void */}
      <div
        className={styles.videoCanvas}
        aria-hidden="true"
      />

      <video
        ref={videoRef}
        className={styles.fixedVideoElement}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/video/video-web-faststart.mp4" type="video/mp4" />
      </video>
      <div className={styles.ambientScrim} />
    </div>
  );
}

export default BackgroundVideoEngine;
