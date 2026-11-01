import React from "react";
import Link from "next/link";
import styles from "./BlogPostComponents.module.scss";

/**
 * Studio Conversion CTA Banner for Editorial Dispatches.
 * Light editorial block (#fbfbfb wash, 3px red left rule, hairline sides)
 * mirroring the pull-quote anatomy, closed by an outline action that fills
 * to solid ink on hover. Zero pills, zero shadows.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function BlogCtaBanner() {
  return (
    <section className={styles.ctaBanner} aria-labelledby="cta-heading">
      <div className={styles.ctaContent}>
        <div className={styles.ctaTag}>
          <span>Commissions / Marca Ubi</span>
        </div>
        <h2 id="cta-heading" className={styles.ctaHeading}>
          Ready to engineer your brand identity?
        </h2>
        <p className={styles.ctaSubtext}>
          We define the strategic core, shape the visual language, and translate it into coherent digital experiences across India, the Gulf, and the UK.
        </p>
      </div>

      <div className={styles.ctaActions}>
        <Link href="/start-project" className={styles.ctaPrimaryButton}>
          <span>Start a Project Brief</span>
          <span className={styles.arrow} aria-hidden="true">&rarr;</span>
        </Link>
        <Link href="/#works" className={styles.ctaSecondaryLink}>
          <span>Explore Selected Works</span>
          <span className={styles.arrow} aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
