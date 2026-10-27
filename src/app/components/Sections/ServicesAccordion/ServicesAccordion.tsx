"use client";

import React, { useState } from "react";
import { ServiceCategory, B2B_SERVICES, B2C_SERVICES } from "./types";
import styles from "./ServicesAccordion.module.scss";

/**
 * ServicesAccordion Component.
 * Implements a dynamic, responsive horizontal multi-column accordion for Marca Ubi services.
 * Features a segmented toggle between B2B Enterprise and B2C Consumer streams.
 * Hovering on any card smoothly expands its column with a dark scrim, top-aligned title,
 * full editorial description, and brand red directional arrow.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function ServicesAccordion() {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("B2B");
  const [activeItemId, setActiveItemId] = useState<string | null>("b2b-demand-generation");

  const services = activeCategory === "B2B" ? B2B_SERVICES : B2C_SERVICES;

  const handleCategoryChange = (category: ServiceCategory) => {
    setActiveCategory(category);
    const nextServices = category === "B2B" ? B2B_SERVICES : B2C_SERVICES;
    setActiveItemId(nextServices[0].id);
  };

  return (
    <div className={styles.servicesShowcase}>
      {/* Top Header Row with Segmented Pill Toggle */}
      <div className={styles.headerRow}>
        <div className={styles.kickerWrap}>
          <span className={styles.sectionKicker}>02 / Practice Spectrum</span>
          <h3 className={styles.sectionTitle}>Capabilities &amp; Strategic Delivery</h3>
        </div>

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

      {/* Horizontal Multi-Column Accordion Strip */}
      <div className={styles.accordionStrip} role="region" aria-label={`${activeCategory} Services Grid`}>
        {services.map((service) => {
          const isExpanded = activeItemId === service.id;

          return (
            <article
              key={service.id}
              tabIndex={0}
              role="region"
              aria-label={service.title}
              aria-expanded={isExpanded}
              className={`${styles.accordionCard} ${isExpanded ? styles.expanded : ""}`}
              onMouseEnter={() => setActiveItemId(service.id)}
              onClick={() => setActiveItemId(service.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveItemId(service.id);
                }
              }}
            >
              {/* Background Image Layer */}
              <div className={styles.imageLayer}>
                <img
                  src={service.imageUrl}
                  alt={service.alt}
                  loading={service.number === "01" ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>

              {/* Scrim Gradient Overlay */}
              <div className={styles.imageScrim} />

              {/* Resting View (Visible when collapsed) */}
              <div className={styles.restingView} aria-hidden={isExpanded}>
                <div className={styles.restingTop}>
                  <span className={styles.restingIndex}>{service.number}</span>
                </div>
                <div className={styles.restingBottom}>
                  <h4 className={styles.restingTitle}>{service.title}</h4>
                </div>
              </div>

              {/* Expanded View (Visible when hovered/active) */}
              <div className={styles.expandedView} aria-hidden={!isExpanded}>
                <div className={styles.expandedTop}>
                  <div className={styles.expandedHeader}>
                    <div className={styles.expandedMeta}>
                      <span className={styles.expandedIndex}>{service.number}</span>
                      <span className={styles.expandedCategory}>{activeCategory} Specialization</span>
                    </div>
                    <h4 className={styles.expandedTitle}>{service.title}</h4>
                    <div className={styles.accentBar} />
                  </div>
                  <p className={styles.expandedDesc}>{service.desc}</p>
                </div>

                <div className={styles.expandedBottom}>
                  <span className={styles.actionTagline}>Strategic Engagement</span>
                  <span className={styles.expandedArrow} aria-hidden="true">&rarr;</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default ServicesAccordion;
