"use client";

import React from "react";
import Link from "next/link";
import { ServicesAccordion } from "./ServicesAccordion/ServicesAccordion";
import styles from "./AboutCurtain.module.scss";

interface MetricItem {
  number: string;
  symbol: string;
  title: string;
  desc: string;
}

const METRICS: MetricItem[] = [
  {
    number: "100",
    symbol: "+",
    title: "Brands Served",
    desc: "Across strategy, identity, digital platforms, and communication systems.",
  },
  {
    number: "12",
    symbol: "+",
    title: "Core Disciplines",
    desc: "From positioning and messaging to identity systems and digital direction.",
  },
  {
    number: "3",
    symbol: "*",
    title: "Integrated Pillars",
    desc: "Brand engineering, art direction, and experience systems working as one.",
  },
  {
    number: "360",
    symbol: "°",
    title: "Application Scope",
    desc: "End-to-end execution across digital platforms and physical touchpoints.",
  },
];

/**
 * View 02: About Curtain.
 * Solid pure white curtain (#ffffff) sliding over the fixed background video.
 * Enforces the 160over90 Swiss 30/70 asymmetric editorial layout.
 * Houses authentic production content: Studio Narrative, 4 Metric Odometers, and Full-Width Services Showcase.
 */
export function AboutCurtain() {
  return (
    <section
      className={styles.aboutSection}
      id="about"
      aria-label="About Marca Ubi"
      data-header-theme="light"
    >
      <div className={styles.gridContainer}>
        {/* Left Sticky/Anchor Rail (30%) */}
        <aside className={styles.leftColumn}>
          <div className={styles.stickyRail}>
            <p className={styles.railTagline}>
              Engineering brands as complete living systems rather than disconnected outputs.
            </p>
            <div className={styles.actionWrap}>
              <Link href="/start-project" className={styles.architecturalButton}>
                <span>Start a Project Brief</span>
                <span className={styles.arrow} aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Content Stream (70%) */}
        <div className={styles.rightColumn}>
          {/* Statement Headline */}
          <h2 className={styles.statementHeadline}>
            We live at the collision of culture and commerce. Where brand identity ceases to be decoration and becomes an operating system for commercial influence.
          </h2>

          {/* Core Studio Narrative */}
          <div className={styles.narrativeBlock}>
            <p className={styles.narrativeLead}>
              Marca Ubi brings together brand engineering, artistic direction, and experience design to build brands as complete systems rather than disconnected outputs. We define the strategic core, shape the visual and emotional language, and translate it into digital environments people can understand, engage with, and remember.
            </p>
            <p className={styles.narrativeSupport}>
              Every layer is designed to work with the next, so the brand is not only well designed, but well built. In an era of synthetic sameness, enduring resonance must be deliberately engineered.
            </p>
          </div>

          {/* 4 Metric Odometers with Tabular Numerals */}
          <div className={styles.metricsContainer}>
            <span className={styles.subKicker}>Quantified Delivery Scope</span>
            <div className={styles.metricsGrid}>
              {METRICS.map((metric) => (
                <div key={metric.title} className={styles.metricItem}>
                  <span className={styles.metricValue}>
                    {metric.number}
                    <span className={styles.metricSymbol}>{metric.symbol}</span>
                  </span>
                  <h4 className={styles.metricTitle}>{metric.title}</h4>
                  <p className={styles.metricDesc}>{metric.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Panoramic Practice Spectrum & Services Showcase */}
      <ServicesAccordion />
    </section>
  );
}

export default AboutCurtain;
