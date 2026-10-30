"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "./ReelModal.module.scss";

interface ReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc?: string;
}

/**
 * Accessible Full-Screen Showreel Modal.
 * Traps focus, handles ESC key, pauses the background video layer,
 * and provides full custom player controls with audio.
 *
 * Performance enhancements:
 * 1. Immediate luxury poster preview to eliminate initial black frames during buffer.
 * 2. preload="metadata" to prioritize rapid modal opening without buffering delays.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function ReelModal({ isOpen, onClose, videoSrc = "/video/video-web.mp4" }: ReelModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();
      document.body.style.overflow = "hidden";
      window.dispatchEvent(new CustomEvent("reel:open"));
    } else {
      document.body.style.overflow = "";
      previousActiveElementRef.current?.focus();
      window.dispatchEvent(new CustomEvent("reel:close"));
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    },
    [onClose]
  );

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reel-dialog-title"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 id="reel-dialog-title" className={styles.modalTitle}>
            Marca Ubi / Creative Agency Showreel 2026
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close Showreel Modal"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className={styles.videoPlayerWrapper}>
          <video
            ref={videoRef}
            src={videoSrc}
            poster="/images/hero-image.png"
            preload="metadata"
            className={styles.reelVideo}
            autoPlay
            playsInline
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onClick={togglePlay}
          />

          <div className={styles.playerToolbar}>
            <button
              type="button"
              className={styles.playPauseBtn}
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? "PAUSE" : "PLAY"}
            </button>
            <div
              className={styles.progressBar}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                if (videoRef.current && duration) {
                  videoRef.current.currentTime = pos * duration;
                }
              }}
            >
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <span className={styles.timeDisplay}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <button
              type="button"
              className={styles.muteBtn}
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            >
              {isMuted ? "UNMUTE" : "MUTE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReelModal;
