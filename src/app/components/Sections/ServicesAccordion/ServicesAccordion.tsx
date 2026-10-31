"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { ServiceCategory, B2B_SERVICES, B2C_SERVICES } from "./types";
import styles from "./ServicesAccordion.module.scss";

/**
 * ServicesAccordion Component.
 * Full-width panoramic services showcase.
 * Preserves the two eight-item service groups while expanding the active panel,
 * revealing its copy, and loading only that panel's muted loop.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function ServicesAccordion() {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("B2B");
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  const services = activeCategory === "B2B" ? B2B_SERVICES : B2C_SERVICES;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  /**
   * Evaluates horizontal scroll metrics and manages navigation arrow visibility.
   */
  const updateScrollBounds = useCallback(() => {
    if (!stripRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = stripRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  /**
   * Advances the horizontal strip smoothly in the requested direction.
   */
  const scrollStrip = (direction: "left" | "right") => {
    if (!stripRef.current) return;
    const delta = direction === "right" ? 360 : -360;
    stripRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  const handleCategoryChange = (category: ServiceCategory) => {
    activeVideoRef.current?.pause();
    activeVideoRef.current = null;
    setActiveCategory(category);
    setActiveServiceId(null);
    if (stripRef.current) {
      stripRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    updateScrollBounds();
    const el = stripRef.current;
    if (!el) return;

    const handleResize = () => updateScrollBounds();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollBounds, activeCategory]);

  return (
    <div className={styles.servicesShowcase}>
      <div className={styles.headerContainer}>
        <div className={styles.kickerWrap}>
          <span className={styles.sectionLabel}>SERVICES</span>
          <h3 className={styles.sectionTitle}>Capabilities &amp; Strategic Delivery</h3>
        </div>

        {/* Segmented Architecture Pill Switch */}
        <div className={styles.segmentedSwitch} role="tablist" aria-label="Services Category Selection">
          <button
            type="button"
            role="tab"
            id="services-tab-b2b"
            aria-controls="services-panel"
            aria-selected={activeCategory === "B2B"}
            tabIndex={activeCategory === "B2B" ? 0 : -1}
            className={`${styles.toggleButton} ${activeCategory === "B2B" ? styles.active : ""}`}
            onClick={() => handleCategoryChange("B2B")}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                handleCategoryChange("B2C");
                document.getElementById("services-tab-b2c")?.focus();
              }
            }}
          >
            <span>B2B Enterprise</span>
            <span className={styles.countBadge}>8</span>
          </button>
          <button
            type="button"
            role="tab"
            id="services-tab-b2c"
            aria-controls="services-panel"
            aria-selected={activeCategory === "B2C"}
            tabIndex={activeCategory === "B2C" ? 0 : -1}
            className={`${styles.toggleButton} ${activeCategory === "B2C" ? styles.active : ""}`}
            onClick={() => handleCategoryChange("B2C")}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                handleCategoryChange("B2B");
                document.getElementById("services-tab-b2b")?.focus();
              }
            }}
          >
            <span>B2C Consumer</span>
            <span className={styles.countBadge}>8</span>
          </button>
        </div>
      </div>

      <div className={styles.stripWrapper}>
        {canScrollLeft && (
          <button
            type="button"
            className={`${styles.navScrollBtn} ${styles.navScrollLeft}`}
            onClick={() => scrollStrip("left")}
            aria-label="Scroll services left"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        <div
          id="services-panel"
          role="region"
          aria-labelledby={activeCategory === "B2B" ? "services-tab-b2b" : "services-tab-b2c"}
          tabIndex={0}
          ref={stripRef}
          onScroll={updateScrollBounds}
          className={styles.fullWidthStrip}
          aria-label={`${activeCategory} Services`}
        >
        <div className={styles.cardsRow}>
          {services.map((service) => {
            const isActive = activeServiceId === service.id;

            return (
              <article
                key={service.id}
                className={`${styles.cardColumn} ${isActive ? styles.cardActive : ""}`}
                data-active={isActive}
                onMouseEnter={() => setActiveServiceId(service.id)}
                onTouchStart={() => setActiveServiceId(service.id)}
                onMouseLeave={(event) => {
                  if (event.currentTarget.contains(document.activeElement)) {
                    return;
                  }
                  if (event.currentTarget.matches(":hover")) {
                    return;
                  }
                  if (activeServiceId === service.id) {
                    activeVideoRef.current?.pause();
                    activeVideoRef.current = null;
                    setActiveServiceId((current) => current === service.id ? null : current);
                  }
                }}
              >
                <button
                  type="button"
                  className={styles.cardTrigger}
                  aria-expanded={isActive}
                  aria-controls={`service-details-${service.id}`}
                  onFocus={() => setActiveServiceId(service.id)}
                  onClick={() => setActiveServiceId((current) => current === service.id ? null : service.id)}
                  onBlur={(event) => {
                    if (!event.currentTarget.parentElement?.matches(":hover")) {
                      activeVideoRef.current?.pause();
                      activeVideoRef.current = null;
                      setActiveServiceId((current) => current === service.id ? null : current);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      activeVideoRef.current?.pause();
                      activeVideoRef.current = null;
                      setActiveServiceId(null);
                      event.currentTarget.blur();
                    }
                  }}
                />
                <div className={styles.imageLayer} aria-hidden="true">
                  <Image
                    src={service.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 76vw, 20vw"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                {isActive && !reducedMotion ? (
                  <video
                    ref={(video) => {
                      if (!video) return;
                      activeVideoRef.current = video;
                      void video.play().catch(() => video.pause());
                    }}
                    className={styles.serviceVideo}
                    src={service.videoSrc}
                    poster={service.videoPoster}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="none"
                    aria-hidden="true"
                  />
                ) : null}

                <div className={styles.restingScrim} />
                <div className={styles.restingContent} aria-hidden={isActive}>
                  <span className={styles.restingNumber}>{service.number}</span>
                  <h4 className={styles.restingTitle}>{service.title}</h4>
                </div>

                <div id={`service-details-${service.id}`} className={styles.hoverOverlay} aria-hidden={!isActive}>
                  <div className={styles.overlayTop}>
                    <div className={styles.metaRow}>
                      <span className={styles.overlayNumber}>{service.number}</span>
                      <span className={styles.overlayCategory}>{activeCategory}</span>
                    </div>
                    <p className={styles.overlayDesc}>{service.desc}</p>
                  </div>

                  <div className={styles.overlayServices}>
                    <span className={styles.exploreCue}>WHAT WE DO</span>
                    <ul>
                      {service.services.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <h4 className={styles.overlayTitle}>{service.title}</h4>
                </div>
              </article>
            );
          })}
        </div>
        </div>

        {/* Right Scroll Indicator & Navigation Button */}
        {canScrollRight && (
          <button
            type="button"
            className={`${styles.navScrollBtn} ${styles.navScrollRight}`}
            onClick={() => scrollStrip("right")}
            aria-label="Scroll services right"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default ServicesAccordion;
