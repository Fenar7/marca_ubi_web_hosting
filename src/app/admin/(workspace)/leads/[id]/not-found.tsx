/**
 * @file not-found.tsx
 * @description Dedicated 404 Not Found surface for missing or purged Lead Dossiers.
 *              Adheres strictly to Marca Ubi Dark Luxury Brand Archetypes and provides
 *              instant return navigation to the Inbound Leads queue.
 * @module app/admin/(workspace)/leads/[id]/not-found
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import styles from './not-found.module.scss';

export default function LeadNotFound(): React.ReactElement {
  return (
    <div className={styles.notFoundRoot} role="alert">
      <div className={styles.notFoundCard}>
        <div className={styles.statusPill}>404 • Dossier Missing</div>

        <h1 className={styles.title}>Commercial Inquiry Not Found</h1>

        <p className={styles.description}>
          The requested client record does not exist in the database, may have been deleted,
          or has an invalid identifier format. Please verify the link or return to the active leads workspace.
        </p>

        <div className={styles.actions}>
          <Link href="/admin/leads" className={styles.primaryBtn}>
            ← Back to Inbound Leads
          </Link>
          <Link href="/admin" className={styles.secondaryBtn}>
            Executive Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
