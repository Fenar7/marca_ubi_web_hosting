/**
 * @file LeadsTableSkeleton.tsx
 * @description Zero Cumulative Layout Shift (CLS < 0.01) loading skeleton for the Commercial Deals Table.
 *              Guarantees identical spatial rhythm with 72px fixed row heights and hairline dark shimmers
 *              while React 19 Server Components stream commercial pipeline records.
 * @module app/admin/components/LeadsTable
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import styles from './LeadsTableSkeleton.module.scss';

export interface LeadsTableSkeletonProps {
  /** Number of placeholder rows to render (default: 8) */
  rowCount?: number;
  /** Optional custom class name */
  className?: string;
}

export function LeadsTableSkeleton({
  rowCount = 8,
  className,
}: LeadsTableSkeletonProps): React.ReactElement {
  const rows = Array.from({ length: rowCount }, (_, i) => i);

  return (
    <div
      className={`${styles.skeletonWrapper} ${className || ''}`}
      role="status"
      aria-label="Loading commercial pipeline deals"
      aria-busy="true"
    >
      {/* Table Head Skeleton */}
      <div className={styles.tableHeadSkeleton} aria-hidden="true">
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '60px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '110px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '80px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '70px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '90px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '85px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '75px' }} />
      </div>

      {/* Row Shimmer Skeletons (Fixed 72px Height) */}
      {rows.map((idx) => (
        <div key={idx} className={styles.skeletonRow} aria-hidden="true">
          {/* Column 1: Deal ID Pill */}
          <div>
            <div className={`${styles.shimmerBox} ${styles.dealIdPill}`} />
          </div>

          {/* Column 2: Client & Organization */}
          <div className={styles.clientMetaCol}>
            <div className={`${styles.shimmerBox} ${styles.clientNameBar}`} />
            <div className={`${styles.shimmerBox} ${styles.companyTitleBar}`} />
          </div>

          {/* Column 3: Service Category */}
          <div>
            <div className={`${styles.shimmerBox} ${styles.serviceBar}`} />
          </div>

          {/* Column 4: Funnel Stage Pill */}
          <div>
            <div className={`${styles.shimmerBox} ${styles.statusPill}`} />
          </div>

          {/* Column 5: Valuation Numerals */}
          <div>
            <div className={`${styles.shimmerBox} ${styles.dealValueBar}`} />
          </div>

          {/* Column 6: Assigned Representative */}
          <div className={styles.repBadge}>
            <div className={`${styles.shimmerBox} ${styles.repAvatarCircle}`} />
            <div className={`${styles.shimmerBox} ${styles.repNameBar}`} />
          </div>

          {/* Column 7: Next Touchpoint */}
          <div>
            <div className={`${styles.shimmerBox} ${styles.touchpointBar}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
