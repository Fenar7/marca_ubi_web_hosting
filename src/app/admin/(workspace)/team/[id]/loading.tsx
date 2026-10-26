import React from 'react';
import styles from './loading.module.scss';

/**
 * Next.js App Router Suspense boundary skeleton for the Personnel Workspace.
 * Preserves exact 8:4 spatial geometry to guarantee Cumulative Layout Shift (CLS) < 0.01.
 */
export default function PersonnelWorkspaceLoading(): React.ReactElement {
  return (
    <div className={styles.skeletonContainer} aria-busy="true" aria-label="Loading personnel workspace">
      <div className={styles.skeletonTopBar}>
        <div className={styles.skeletonPill} />
        <div className={styles.skeletonPill} style={{ width: '90px' }} />
      </div>

      <div className={styles.skeletonGrid}>
        <div className={styles.skeletonMain}>
          <div className={styles.skeletonMasthead} />
          <div className={styles.skeletonKpis}>
            <div className={styles.skeletonKpiCard} />
            <div className={styles.skeletonKpiCard} />
            <div className={styles.skeletonKpiCard} />
            <div className={styles.skeletonKpiCard} />
          </div>
          <div className={styles.skeletonTable} />
        </div>

        <div className={styles.skeletonSide}>
          <div className={styles.skeletonSideCard} />
          <div className={styles.skeletonSideCard} />
          <div className={styles.skeletonSideCard} />
        </div>
      </div>
    </div>
  );
}
