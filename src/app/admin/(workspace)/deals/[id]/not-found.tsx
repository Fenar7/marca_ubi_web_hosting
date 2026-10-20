/**
 * @file not-found.tsx
 * @description Dedicated 404 Not Found surface for missing or purged Pipeline Deal Dossiers.
 *              Adheres strictly to Marca Ubi Dark Luxury Brand Archetypes and provides
 *              instant return navigation to the Pipeline Deals workspace.
 * @module app/admin/(workspace)/deals/[id]/not-found
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import styles from './not-found.module.scss';

export default function DealNotFound(): React.ReactElement {
  return (
    <div className={styles.notFoundRoot} role="alert">
      <div className={styles.notFoundCard}>
        <div className={styles.statusPill}>404 • Deal Missing</div>

        <h1 className={styles.title}>Pipeline Deal Not Found</h1>

        <p className={styles.description}>
          The requested pipeline deal could not be located in the CRM records, may have been deleted,
          or has an invalid identifier. Please check the URL or navigate back to the pipeline board.
        </p>

        <div className={styles.actions}>
          <Link href="/admin/deals" className={styles.primaryBtn}>
            ← Back to Pipeline Deals
          </Link>
          <Link href="/admin" className={styles.secondaryBtn}>
            Executive Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
