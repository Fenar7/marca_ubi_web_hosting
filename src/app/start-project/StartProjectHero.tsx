"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./StartProject.module.scss";

/**
 * 35vh intake band carrying the studio's main film (video-web.mp4) as a muted
 * loop. Two independent failovers keep the headline legible without motion:
 * prefers-reduced-motion users and autoplay/decode failures both render the
 * static dark canvas instead of the <video>. Zero-jump reveal via onPlaying,
 * mirroring the ServicesAccordion crossfade pattern.
 */
export default function StartProjectHero() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Explicit play() guard: muted autoplay is still policy-blockable on some
  // low-power browsers; a rejection falls over to the static canvas.
  useEffect(() => {
    if (reducedMotion || videoUnavailable) return;
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => setVideoUnavailable(true));
  }, [reducedMotion, videoUnavailable]);

  const showVideo = !reducedMotion && !videoUnavailable;

  return (
    <section
      className={styles.heroBand}
      data-header-theme="dark"
      aria-label="Start a project introduction"
    >
      {showVideo && (
        <video
          ref={videoRef}
          className={`${styles.heroVideo} ${isPlaying ? styles.heroVideoPlaying : ""}`}
          src="/video/video-web.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          onPlaying={() => setIsPlaying(true)}
          onError={() => setVideoUnavailable(true)}
        />
      )}
      <div className={styles.heroScrim} aria-hidden="true" />
      <div className={styles.heroContent}>
        <span className={styles.kicker}>Studio intake</span>
        <h1 className={styles.headline}>Start a project.</h1>
        <p className={styles.lede}>
          Four short steps: what you need designed, who you are, when you need it,
          and a final read-back before the brief reaches our studio desk.
        </p>
      </div>
    </section>
  );
}
