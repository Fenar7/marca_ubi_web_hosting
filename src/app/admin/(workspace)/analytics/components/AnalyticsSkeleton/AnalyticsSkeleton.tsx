import React from 'react';
import styles from './AnalyticsSkeleton.module.scss';

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className={styles.skeletonContainer} aria-hidden="true">
      <div className={styles.mastheadShimmer}>
        <div className={styles.topBarShimmer} />
        <div className={styles.cardsGridShimmer}>
          <div className={styles.cardShimmer} />
          <div className={styles.cardShimmer} />
          <div className={styles.cardShimmer} />
          <div className={styles.cardShimmer} />
        </div>
      </div>
      <div className={styles.funnelShimmer} />
      <div className={styles.middleGridShimmer}>
        <div className={styles.splineShimmer} />
        <div className={styles.practiceShimmer} />
      </div>
      <div className={styles.dwellShimmer} />
    </div>
  );
};
