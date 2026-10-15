import Link from "next/link";
import PillButton from "@/app/components/ui/PillButton/PillButton";
import styles from "./BlogPostComponents.module.scss";

export default function BlogCtaBanner() {
  return (
    <section className={styles.ctaBanner} aria-labelledby="cta-heading">
      <div className={styles.ctaContent}>
        <div className={styles.ctaTag}>
          <img src="/images/asterisk.png" alt="" className={styles.ctaAsterisk} width={14} height={14} aria-hidden="true" />
          <span>Work With Us / Marca Ubi</span>
        </div>
        <h2 id="cta-heading" className={styles.ctaHeading}>
          Ready to engineer your brand identity?
        </h2>
        <p className={styles.ctaSubtext}>
          We define the strategic core, shape the visual language, and translate it into coherent digital experiences across India, the Gulf, and the UK.
        </p>
      </div>

      <div className={styles.ctaActions}>
        <PillButton
          href="/start-project"
          label="Start a Project Brief"
          variant="brand"
          icon={<img src="/hero/primary-arrow.png" alt="" width={16} height={16} />}
        />
        <Link href="/#works" className={styles.ctaSecondaryLink}>
          Explore Selected Works ↗
        </Link>
      </div>
    </section>
  );
}
