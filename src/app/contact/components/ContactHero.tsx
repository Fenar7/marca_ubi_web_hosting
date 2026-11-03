"use client";

import React from "react";
import styles from "../Contact.module.scss";

/**
 * 160/90 Reference Standard Hero Masthead.
 * Solid Obsidian Black (#000000) architectural anchor that ensures 100% crystal contrast
 * for ClientHeader's white brandmark and hamburger navigation before transitioning into
 * the Swiss Light Editorial white paper canvas below.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function ContactHero() {
  return (
    <section className={styles.heroMasthead} data-header-theme="dark">
      <div className={styles.heroContent}>
        <h1 className={styles.heroHeadline}>Contact Us</h1>
      </div>
    </section>
  );
}
