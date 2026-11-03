"use client";

import React from "react";
import Link from "next/link";
import styles from "../Contact.module.scss";

/**
 * Talent Diversion Callout Card.
 * Exact replication of user-mandated Screenshot 155749:
 * Soft blush pink container (#ffd6e7), gentle 16px radius, clean typography,
 * routing recruitment traffic to /careers to keep CRM deal pipelines clean.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function WantToWorkWithUs() {
  return (
    <div id="careers-callout" className={styles.wantToWorkCard}>
      <h2 className={styles.wantToWorkTitle}>Want to work with us?</h2>
      <p className={styles.wantToWorkSubtitle}>Careers &amp; Internships</p>
      <Link href="/careers" className={styles.wantToWorkLink}>
        View Current Openings
      </Link>
    </div>
  );
}
