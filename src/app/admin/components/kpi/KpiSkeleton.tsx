/**
 * @file KpiSkeleton.tsx
 * @description Dark shimmer skeleton loading state matching exact card geometry (130px height,
 *              hairline grid separation) to enforce Zero Cumulative Layout Shift (CLS < 0.01).
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import styles from './KpiRibbon.module.scss';

interface KpiSkeletonProps {
  cardCount?: number;
  className?: string;
}

/**
 * Renders an exact-geometry skeleton placeholder for the Executive KPI Ribbon.
 * Preserves structural dimensions to prevent Cumulative Layout Shift during initial
 * SSR loads and reactive filter recalculations.
 *
 * @param {KpiSkeletonProps} props Skeleton layout properties.
 * @returns {React.ReactElement} Structured dark shimmer skeleton.
 */
export function KpiSkeleton({
  cardCount = 5,
  className = '',
}: KpiSkeletonProps): React.ReactElement {
  const cards = Array.from({ length: cardCount }, (_, i) => i);

  return (
    <div
      className={`${styles.ribbonContainer} ${className}`}
      aria-hidden="true"
      data-testid="kpi-skeleton-container"
    >
      <div className={styles.toolbar}>
        <div className={styles.toolbarMeta}>
          <span className={styles.engineEyebrow}>
            <span className={styles.liveDot} />
            <span>Recalculating Pipeline Pulse</span>
          </span>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        {cards.map((index) => (
          <div key={index} className={styles.skeletonCard}>
            <div className={styles.skeletonHeader}>
              <div className={styles.skeletonLabel} />
              <div className={styles.skeletonIcon} />
            </div>
            <div className={styles.skeletonValue} />
            <div className={styles.skeletonSubtext} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default KpiSkeleton;
