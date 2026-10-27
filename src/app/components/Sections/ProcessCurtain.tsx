"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./ProcessCurtain.module.scss";

const DISCIPLINES = [
  "Brand Strategy",
  "Visual Identity Systems",
  "Creative Direction",
  "Culture Marketing",
  "Experiential Production",
  "Digital Infrastructure",
  "Creative Technology",
  "Motion & Cinema",
  "Campaign Architecture",
  "Editorial Systems",
  "High-Growth GTM",
  "Spatial Brand Design",
];

interface DeliveryStep {
  number: string;
  title: string;
  description: string;
}

const STEPS: DeliveryStep[] = [
  {
    number: "01",
    title: "Discovery & Foundation",
    description:
      "We begin by understanding the commercial reality, target audience, market context, and core outcomes required. This clarity prevents surface-level missteps from the start.",
  },
  {
    number: "02",
    title: "Strategy & Architecture",
    description:
      "We turn insight into operational structure by defining positioning, messaging, visual direction, and the living design systems that ensure cross-channel consistency.",
  },
  {
    number: "03",
    title: "Design & Build",
    description:
      "We shape the brand through bespoke typography, web platforms, cinematic content, and engineering, running rigorous quality gates before advancing.",
  },
  {
    number: "04",
    title: "Deliver & Rollout",
    description:
      "We prepare the work for real-world execution with clean handoff, deployment infrastructure, and launch-ready assets, built to endure long after launch.",
  },
];

/**
 * View 06: Strategy & Delivery Methodology Curtain.
 * Solid pure white curtain (#ffffff) sliding over the living background video.
 * Enforces the 160over90 Swiss 30/70 asymmetric editorial layout.
 * Houses the 12 practice disciplines kinetic cloud and the 4-phase delivery system.
 */
export function ProcessCurtain() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section
      className={styles.processSection}
      id="process"
      aria-label="Delivery Methodology and Capabilities"
      data-header-theme="light"
    >
      <div className={styles.gridContainer}>
        {/* Left Sticky Rail (30%) */}
        <aside className={styles.leftColumn}>
          <div className={styles.stickyRail}>
            <h2 className={styles.railHeadline}>
              Systems over isolated outputs.
            </h2>
            <p className={styles.railSummary}>
              A unified creative technology and brand engineering practice operating across 12 integrated disciplines with structured execution cycles.
            </p>
            <div className={styles.actionWrap}>
              <Link href="/start-project" className={styles.architecturalButton}>
                <span>Review Engagement Models</span>
                <span className={styles.arrow} aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Content Stream (70%) */}
        <div className={styles.rightColumn}>
          {/* 12 Practice Areas Kinetic Typographic Cloud */}
          <div className={styles.disciplinesBlock}>
            <span className={styles.subKicker}>Integrated Capabilities</span>
            <div className={styles.cloudWrapper}>
              {DISCIPLINES.map((discipline, index) => {
                const isSlashActive =
                  hoveredIndex === index || (hoveredIndex !== null && hoveredIndex === index + 1);

                return (
                  <span key={discipline} className={styles.itemGroup}>
                    <button
                      type="button"
                      className={styles.disciplineItem}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      aria-label={`Practice area: ${discipline}`}
                    >
                      {discipline}
                    </button>
                    {index < DISCIPLINES.length - 1 && (
                      <span
                        className={`${styles.slashDivider} ${isSlashActive ? styles.activeSlash : ""}`}
                        aria-hidden="true"
                      >
                        /
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* 4-Phase Delivery Process */}
          <div className={styles.processBlock}>
            <span className={styles.subKicker}>Delivery Methodology</span>
            <div className={styles.stepsList}>
              {STEPS.map((step) => (
                <article key={step.number} className={styles.stepCard}>
                  <div className={styles.stepHeader}>
                    <span className={styles.stepNumber}>{step.number}</span>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                  </div>
                  <p className={styles.stepDescription}>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProcessCurtain;
