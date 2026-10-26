/**
 * @file loading.tsx
 * @description Zero Cumulative Layout Shift (CLS < 0.01) Suspense fallback for the Lead 360° Dossier.
 *              Replicates the exact 7:5 asymmetric geometry and sticky header layout with hairline shimmers.
 * @module app/admin/(workspace)/leads/[id]/loading
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import styles from './loading.module.scss';

export default function LeadDossierLoading(): React.ReactElement {
  return (
    <div
      className={styles.workspaceLoading}
      role="status"
      aria-label="Loading Client 360° Lead Dossier"
      aria-busy="true"
    >
      {/* 1. Header Skeleton */}
      <div className={styles.headerSkeleton}>
        <div className={styles.breadcrumbRow}>
          <div className={styles.skeletonBox} style={{ width: '280px', height: '16px' }} />
          <div className={styles.skeletonBox} style={{ width: '150px', height: '36px', borderRadius: '8px' }} />
        </div>

        <div className={styles.titleRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className={styles.skeletonBox} style={{ width: '320px', height: '32px' }} />
            <div className={styles.skeletonBox} style={{ width: '100px', height: '24px', borderRadius: '9999px' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <div className={styles.skeletonBox} style={{ width: '120px', height: '42px', borderRadius: '8px' }} />
            <div className={styles.skeletonBox} style={{ width: '130px', height: '42px', borderRadius: '8px' }} />
          </div>
        </div>
      </div>

      {/* 2. 7:5 Asymmetric Grid Skeleton */}
      <div className={styles.gridSkeleton}>
        {/* Left Rail (7 cols, 60%) */}
        <div className={styles.leftRailSkeleton}>
          {/* 3 Stripe Scorecards */}
          <div className={styles.kpiRibbonSkeleton}>
            <div className={styles.cardSkeleton} style={{ height: '110px' }}>
              <div className={styles.skeletonBox} style={{ width: '90px', height: '12px' }} />
              <div className={styles.skeletonBox} style={{ width: '140px', height: '28px' }} />
              <div className={styles.skeletonBox} style={{ width: '80px', height: '12px' }} />
            </div>

            <div className={styles.cardSkeleton} style={{ height: '110px' }}>
              <div className={styles.skeletonBox} style={{ width: '100px', height: '12px' }} />
              <div className={styles.skeletonBox} style={{ width: '120px', height: '24px', borderRadius: '4px' }} />
              <div className={styles.skeletonBox} style={{ width: '90px', height: '12px' }} />
            </div>

            <div className={styles.cardSkeleton} style={{ height: '110px' }}>
              <div className={styles.skeletonBox} style={{ width: '110px', height: '12px' }} />
              <div className={styles.skeletonBox} style={{ width: '130px', height: '28px' }} />
              <div className={styles.skeletonBox} style={{ width: '100px', height: '12px' }} />
            </div>
          </div>

          {/* Large Organization Dossier Card */}
          <div className={styles.cardSkeleton} style={{ minHeight: '380px' }}>
            <div className={styles.skeletonBox} style={{ width: '180px', height: '20px' }} />
            <div className={styles.skeletonBox} style={{ width: '100%', height: '80px' }} />
            <div className={styles.skeletonBox} style={{ width: '100%', height: '100px' }} />
            <div className={styles.skeletonBox} style={{ width: '100%', height: '100px' }} />
          </div>
        </div>

        {/* Right Rail (5 cols, 40%) */}
        <div className={styles.rightRailSkeleton}>
          {/* Quick Action Composer Skeleton */}
          <div className={styles.cardSkeleton} style={{ height: '280px' }}>
            <div className={styles.skeletonBox} style={{ width: '100%', height: '40px' }} />
            <div className={styles.skeletonBox} style={{ width: '100%', height: '80px' }} />
            <div className={styles.skeletonBox} style={{ width: '140px', height: '42px', alignSelf: 'flex-end', borderRadius: '8px' }} />
          </div>

          {/* Schedule Coordinates Skeleton */}
          <div className={styles.cardSkeleton} style={{ height: '140px' }}>
            <div className={styles.skeletonBox} style={{ width: '160px', height: '18px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className={styles.skeletonBox} style={{ height: '40px' }} />
              <div className={styles.skeletonBox} style={{ height: '40px' }} />
            </div>
          </div>

          {/* Activity Timeline Skeleton */}
          <div className={styles.cardSkeleton} style={{ minHeight: '300px' }}>
            <div className={styles.skeletonBox} style={{ width: '150px', height: '18px' }} />
            <div className={styles.skeletonBox} style={{ width: '100%', height: '60px' }} />
            <div className={styles.skeletonBox} style={{ width: '100%', height: '60px' }} />
            <div className={styles.skeletonBox} style={{ width: '100%', height: '60px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
