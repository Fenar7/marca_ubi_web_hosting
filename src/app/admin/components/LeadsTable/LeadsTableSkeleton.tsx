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
      {/* Table Head Skeleton (10 Dedicated Columns) */}
      <div className={styles.tableHeadSkeleton} aria-hidden="true">
        <div className={`${styles.shimmerBox} ${styles.checkboxSkeleton}`} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '45px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '100px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '80px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '75px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '80px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '85px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '55px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '60px' }} />
        <div className={`${styles.shimmerBox} ${styles.headLabelSkeleton}`} style={{ width: '50px' }} />
      </div>

      {/* Row Shimmer Skeletons (Fixed 72px Height across 10 Columns) */}
      {rows.map((idx) => (
        <div key={idx} className={styles.skeletonRow} aria-hidden="true">
          {/* Col 0: Checkbox */}
          <div>
            <div className={`${styles.shimmerBox} ${styles.checkboxSkeleton}`} />
          </div>

          {/* Col 1: Lead ID Pill */}
          <div>
            <div className={`${styles.shimmerBox} ${styles.dealIdPill}`} />
          </div>

          {/* Col 2: Client Monogram Avatar + Org Text */}
          <div className={styles.clientMetaCol}>
            <div className={`${styles.shimmerBox} ${styles.avatarSkeleton}`} />
            <div className={styles.clientTextCol}>
              <div className={`${styles.shimmerBox} ${styles.clientNameBar}`} />
              <div className={`${styles.shimmerBox} ${styles.companyTitleBar}`} />
            </div>
          </div>

          {/* Col 3: Service Category */}
          <div>
            <div className={`${styles.shimmerBox} ${styles.scopePill}`} />
          </div>

          {/* Col 4: Funnel Status Dropdown */}
          <div>
            <div className={`${styles.shimmerBox} ${styles.stageSelectPill}`} />
          </div>

          {/* Col 5: Valuation Numerals */}
          <div>
            <div className={`${styles.shimmerBox} ${styles.valueBar}`} />
          </div>

          {/* Col 6: Representative Pill */}
          <div className={styles.repCol}>
            <div className={`${styles.shimmerBox} ${styles.repAvatarSkeleton}`} />
            <div className={`${styles.shimmerBox} ${styles.repNameBar}`} />
          </div>

          {/* Col 7: Priority Badge */}
          <div>
            <div className={`${styles.shimmerBox} ${styles.priorityBadgeSkeleton}`} />
          </div>

          {/* Col 8: Next SLA */}
          <div className={styles.slaColSkeleton}>
            <div className={`${styles.shimmerBox} ${styles.touchpointBar}`} />
            <div className={`${styles.shimmerBox} ${styles.overdueTagSkeleton}`} />
          </div>

          {/* Col 9: Actions Controls Strip */}
          <div className={styles.actionsSkeleton}>
            <div className={`${styles.shimmerBox} ${styles.inspectBtnSkeleton}`} />
            <div className={`${styles.shimmerBox} ${styles.directLinkSkeleton}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
