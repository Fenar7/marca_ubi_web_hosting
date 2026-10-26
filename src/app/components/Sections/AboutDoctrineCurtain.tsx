"use client";

import React from "react";
import Link from "next/link";
import styles from "./AboutDoctrineCurtain.module.scss";

interface CoreService {
  number: string;
  title: string;
  desc: string;
}

const SERVICES: CoreService[] = [
  {
    number: "01",
    title: "Brand Engineering",
    desc: "Strategic core definition, brand positioning, and cultural architecture.",
  },
  {
    number: "02",
    title: "Identity & Art Systems",
    desc: "Visual language, responsive typography, and tactile physical collateral.",
  },
  {
    number: "03",
    title: "Digital Experience Design",
    desc: "Enterprise web platforms, immersive interactions, and high-velocity systems.",
  },
  {
    number: "04",
    title: "Communication & Growth",
    desc: "Multi-channel narrative systems, campaign art direction, and launch execution.",
  },
];

interface MetricItem {
  value: string;
  title: string;
  desc: string;
}

const METRICS: MetricItem[] = [
  {
    value: "100+",
    title: "Brands Served",
    desc: "Across strategy, identity, digital platforms, and communication systems.",
  },
  {
    value: "12+",
    title: "Core Disciplines",
    desc: "From positioning and messaging to identity systems and digital direction.",
  },
  {
    value: "3*",
    title: "Integrated Pillars",
    desc: "Brand engineering, art direction, and experience systems working as one.",
  },
  {
    value: "360°",
    title: "Application Scope",
    desc: "End-to-end execution across digital platforms and physical touchpoints.",
  },
];

/**
 * View 02: About & Doctrine Curtain.
 * Solid pure white curtain (#ffffff) sliding over the fixed background video.
 * Enforces the 160over90 Swiss 30/70 asymmetric editorial layout.
 * Houses 100% of authentic production content: Doctrine, 4 Services, 4 Metric Odometers.
 */
export function AboutDoctrineCurtain() {
  return (
    <section
      className={styles.aboutSection}
      id="about"
      aria-label="About and Agency Doctrine"
      data-header-theme="light"
    >
      <div className={styles.gridContainer}>
        {/* Left Sticky/Anchor Rail (30%) */}
        <aside className={styles.leftColumn}>
          <div className={styles.stickyRail}>
            <span className={styles.sectionLabel}>01 / About &amp; Doctrine</span>
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

          {/* Core Doctrine Narrative */}
          <div className={styles.doctrineBlock}>
            <p className={styles.doctrineLead}>
              Marca Ubi brings together brand engineering, artistic direction, and experience design to build brands as complete systems rather than disconnected outputs. We define the strategic core, shape the visual and emotional language, and translate it into digital environments people can understand, engage with, and remember.
            </p>
            <p className={styles.doctrineSupport}>
              Every layer is designed to work with the next, so the brand is not only well designed, but well built. In an era of synthetic sameness, enduring resonance must be deliberately engineered.
            </p>
          </div>

          {/* 4 Core Services Flex Strip */}
          <div className={styles.servicesContainer}>
            <span className={styles.subKicker}>Practice Areas</span>
            <div className={styles.servicesGrid}>
              {SERVICES.map((service) => (
                <div key={service.number} className={styles.serviceItem}>
                  <div className={styles.serviceHeader}>
                    <span className={styles.serviceNumber}>{service.number}</span>
                    <h3 className={styles.serviceTitle}>{service.title}</h3>
                  </div>
                  <p className={styles.serviceDesc}>{service.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Metric Odometers with Tabular Numerals */}
          <div className={styles.metricsContainer}>
            <span className={styles.subKicker}>Quantified Delivery Scope</span>
            <div className={styles.metricsGrid}>
              {METRICS.map((metric) => (
                <div key={metric.title} className={styles.metricItem}>
                  <span className={styles.metricValue}>{metric.value}</span>
                  <h4 className={styles.metricTitle}>{metric.title}</h4>
                  <p className={styles.metricDesc}>{metric.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutDoctrineCurtain;
