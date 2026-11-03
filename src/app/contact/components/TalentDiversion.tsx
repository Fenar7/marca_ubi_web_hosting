'use client';

/**
 * @file TalentDiversion.tsx
 * @description Talent diversion callout for `/contact` adhering to the Whoa Mama design pattern.
 *              Redirects prospective applicants and creatives toward `/careers`, preventing CRM lead
 *              pollution and maintaining sales lead response velocity.
 * @module contact/components/TalentDiversion
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import Link from 'next/link';
import styles from '../Contact.module.scss';

export default function TalentDiversion() {
  return (
    <aside className={styles.talentBox} aria-label="Talent and Careers Notice">
      <h3 className={styles.talentKicker}>Seeking a Position at Marca Ubi?</h3>
      <p className={styles.talentText}>
        Our engineering, strategy, and design rosters are curated exclusively through our careers portal.
        Resumes or portfolios submitted via this commercial client contact form are automatically disqualified.
      </p>
      <Link href="/careers" className={styles.talentLink}>
        <span>Explore Open Studio Roles & Submit Portfolio</span>
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </aside>
  );
}
