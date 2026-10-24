import React from 'react';
import Link from 'next/link';
import styles from './not-found.module.scss';

/**
 * 404 handler for nonexistent or deleted personnel dossiers (/admin/team/[id]).
 */
export default function PersonnelNotFound(): React.ReactElement {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="17" y1="8" x2="23" y2="14" />
            <line x1="23" y1="8" x2="17" y2="14" />
          </svg>
        </div>

        <h1 className={styles.title}>Personnel Record Not Found</h1>
        <p className={styles.description}>
          The requested team member dossier does not exist in the agency directory or may have been offboarded.
        </p>

        <Link href="/admin/team" className={styles.ctaButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Return to Team Directory
        </Link>
      </div>
    </div>
  );
}
