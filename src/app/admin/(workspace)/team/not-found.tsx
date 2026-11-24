import React from 'react';
import Link from 'next/link';
import styles from './not-found.module.scss';

/**
 * 404 recovery view for nonexistent routes inside `/admin/team`.
 */
export default function TeamNotFound(): React.ReactElement {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconCircle} aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>

        <h1 className={styles.title}>Personnel Directory Record Unavailable</h1>
        <p className={styles.description}>
          The requested team workspace resource could not be located or you lack permission to view it.
        </p>

        <Link href="/admin/team" className={styles.ctaButton}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Return to Team Directory
        </Link>
      </div>
    </div>
  );
}
