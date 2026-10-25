"use client";

import React from "react";
import Link from "next/link";
import styles from "./TestimonialsCutout.module.scss";

/**
 * View 07: Client Evidence & Validation Cutout.
 * Transparent cutout exposing the living background video layer with a dark cinematic scrim.
 * High-conviction executive quotation and partner attribution.
 * Marked with data-header-theme="dark" for white logo/header text.
 */
export function TestimonialsCutout() {
  return (
    <section
      className={styles.testimonialsSection}
      id="testimonials"
      aria-label="Client Testimonials and Validation"
      data-header-theme="dark"
    >
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <span className={styles.kicker}>05 / Client Evidence</span>
          <h2 className={styles.headline}>What Clients Value After Working With Marca Ubi</h2>

          {/* Monumental Quote Stage */}
          <blockquote className={styles.quoteBlock}>
            <p className={styles.quoteText}>
              &ldquo;Marca Ubi did not merely design an identity; they engineered an operational visual and digital language that redefined how our business communicates and scales. The precision and structural discipline they brought to our enterprise platform set an entirely new benchmark for our category.&rdquo;
            </p>
            <footer className={styles.quoteFooter}>
              <cite className={styles.authorName}>Executive Leadership</cite>
              <span className={styles.authorRole}>PrimeStay &amp; Enterprise Logistics Partners</span>
            </footer>
          </blockquote>

          {/* Architectural Action */}
          <div className={styles.actionWrap}>
            <Link href="/start-project" className={styles.architecturalButton}>
              <span>Start a Conversation</span>
              <span className={styles.arrow} aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsCutout;
