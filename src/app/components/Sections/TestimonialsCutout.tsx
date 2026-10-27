"use client";

import React from "react";
import Link from "next/link";
import styles from "./TestimonialsCutout.module.scss";

/**
 * View 07: Client Evidence & Validation Cutout.
 * Solid pure white curtain (#ffffff) elevated above living background video cutouts.
 * Adheres to 160over90 typographic tension and Swiss editorial clarity.
 * High-conviction executive quotation and partner attribution.
 * Marked with data-header-theme="light" for white logo/header text.
 */
export function TestimonialsCutout() {
  return (
    <section
      className={styles.testimonialsSection}
      id="testimonials"
      aria-label="Client Testimonials and Validation"
      data-header-theme="light"
    >
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
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
