"use client";

import React, { useState } from "react";
import { ServiceCategory, B2B_SERVICES, B2C_SERVICES } from "./types";
import styles from "./ServicesAccordion.module.scss";

/**
 * ServicesAccordion Component.
 * Full-width panoramic services showcase.
 * All cards divide space equally (strictly invariant width).
 * Hovering on a card smoothly overlays an obsidian backdrop, transitioning
 * the title from bottom to top and revealing the full descriptive copy and directional arrow.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function ServicesAccordion() {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("B2B");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const services = activeCategory === "B2B" ? B2B_SERVICES : B2C_SERVICES;

  const handleCategoryChange = (category: ServiceCategory) => {
    setActiveCategory(category);
    setHoveredId(null);
  };

  return (
    <div className={styles.servicesShowcase}>
      {/* Editorial Header Section with Swiss Grid Padding */}
      <div className={styles.headerContainer}>
        <div className={styles.kickerWrap}>
          <span className={styles.sectionKicker}>02 / Practice Spectrum</span>
          <h3 className={styles.sectionTitle}>Capabilities &amp; Strategic Delivery</h3>
        </div>

        {/* Segmented Architecture Pill Switch */}
        <div className={styles.segmentedSwitch} role="tablist" aria-label="Services Category Selection">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "B2B"}
            className={`${styles.toggleButton} ${activeCategory === "B2B" ? styles.active : ""}`}
            onClick={() => handleCategoryChange("B2B")}
          >
            <span>B2B Enterprise</span>
            <span className={styles.countBadge}>8</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "B2C"}
            className={`${styles.toggleButton} ${activeCategory === "B2C" ? styles.active : ""}`}
            onClick={() => handleCategoryChange("B2C")}
          >
            <span>B2C Consumer</span>
            <span className={styles.countBadge}>8</span>
          </button>
        </div>
      </div>

      {/* 100% Full-Width Edge-to-Edge Cards Strip */}
      <div className={styles.fullWidthStrip} role="region" aria-label={`${activeCategory} Services Grid`}>
        <div className={styles.cardsRow}>
          {services.map((service) => {
            const isHovered = hoveredId === service.id;

            return (
              <article
                key={service.id}
                tabIndex={0}
                role="region"
                aria-label={service.title}
                className={`${styles.cardColumn} ${isHovered ? styles.cardActive : ""}`}
                onMouseEnter={() => setHoveredId(service.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setHoveredId(service.id === hoveredId ? null : service.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setHoveredId(service.id === hoveredId ? null : service.id);
                  }
                }}
              >
                {/* Background Editorial Image */}
                <div className={styles.imageLayer}>
                  <img
                    src={service.imageUrl}
                    alt={service.alt}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {/* Resting Scrim (Dark gradient at bottom) */}
                <div className={styles.restingScrim} />

                {/* Resting Content (Visible when unhovered) */}
                <div className={styles.restingContent} aria-hidden={isHovered}>
                  <span className={styles.restingNumber}>{service.number}</span>
                  <h4 className={styles.restingTitle}>{service.title}</h4>
                </div>

                {/* Hover/Active Full Dark Overlay with Detailed Copy */}
                <div className={styles.hoverOverlay} aria-hidden={!isHovered}>
                  <div className={styles.overlayTop}>
                    <div className={styles.metaRow}>
                      <span className={styles.overlayNumber}>{service.number}</span>
                      <span className={styles.overlayCategory}>{activeCategory}</span>
                    </div>
                    <h4 className={styles.overlayTitle}>{service.title}</h4>
                    <div className={styles.accentBar} />
                    <p className={styles.overlayDesc}>{service.desc}</p>
                  </div>

                  <div className={styles.overlayBottom}>
                    <span className={styles.exploreCue}>Strategic Capability</span>
                    <span className={styles.redArrow} aria-hidden="true">&rarr;</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ServicesAccordion;
