import React from 'react';
import styles from './loading.module.scss';

/**
 * Zero-CLS Editorial Luxury skeleton matching the Team directory Masthead,
 * 3-cell Summary Strip, Filter Toolbar, and 68px Roster Rows.
 */
export default function AdminTeamLoading(): React.ReactElement {
  return (
    <div className={styles.skeletonWorkspace} aria-busy="true" aria-label="Loading team directory">
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonTitleGroup}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonSubtitle} />
        </div>
        <div className={styles.skeletonPrimaryBtn} />
      </div>

      <div className={styles.skeletonSummaryStrip}>
        <div className={styles.skeletonSummaryCell} />
        <div className={styles.skeletonSummaryCell} />
        <div className={styles.skeletonSummaryCell} />
      </div>

      <div className={styles.skeletonDirectoryCard}>
        <div className={styles.skeletonTabsRow}>
          <div className={styles.skeletonTabItem} />
          <div className={styles.skeletonTabItem} />
          <div className={styles.skeletonTabItem} />
          <div className={styles.skeletonTabItem} />
        </div>
        <div className={styles.skeletonToolbar}>
          <div className={styles.skeletonSearch} />
          <div className={styles.skeletonSelect} />
          <div className={styles.skeletonSelect} />
        </div>
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className={styles.skeletonRow}>
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonLines}>
              <div className={styles.skeletonLinePrimary} />
              <div className={styles.skeletonLineSecondary} />
            </div>
            <div className={styles.skeletonColChip} />
            <div className={styles.skeletonColMetric} />
            <div className={styles.skeletonColAction} />
          </div>
        ))}
      </div>
    </div>
  );
}
