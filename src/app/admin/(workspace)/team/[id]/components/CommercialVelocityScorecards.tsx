'use client';

/**
 * @file CommercialVelocityScorecards.tsx
 * @description Stripe Scorecard KPI cards displaying Won Revenue, Active Pipeline,
 *              Win Rate %, and Rep Workload Capacity Meter against SALES_REP_CAPACITY_LIMIT.
 * @module app/admin/team/[id]/components/CommercialVelocityScorecards
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { PersonnelPerformanceKpis } from '@/types/crm';
import { formatRupees, formatNumber } from '@/app/lib/team-utils';
import styles from './CommercialVelocityScorecards.module.scss';

interface CommercialVelocityScorecardsProps {
  kpis: PersonnelPerformanceKpis;
}

export function CommercialVelocityScorecards({
  kpis,
}: CommercialVelocityScorecardsProps): React.ReactElement {
  const capacityPct = Math.min(100, Math.round((kpis.activeDealsCount / kpis.capacityLimit) * 100));
  const isAtCapacity = kpis.activeDealsCount >= kpis.capacityLimit;

  // Capacity color calculation: emerald below 75%, amber between 75-99%, red at 100%+
  const getCapacityColor = (): string => {
    if (capacityPct >= 100) return '#ef4444';
    if (capacityPct >= 75) return '#f59e0b';
    return '#10b981';
  };

  return (
    <section className={styles.scorecardsGrid} aria-label="Commercial Performance Scorecards">
      {/* 1. Won Revenue */}
      <div className={styles.scorecard}>
        <div className={styles.headerRow}>
          <span className={styles.cardLabel}>Won Revenue</span>
        </div>
        <div>
          <div className={`${styles.metricValue} ${styles.wonMetric}`}>
            {formatRupees(kpis.wonRevenue)}
          </div>
          <p className={styles.metaSubtitle}>
            {formatNumber(kpis.wonDealsCount)} deals converted
          </p>
        </div>
      </div>

      {/* 2. Active Pipeline */}
      <div className={styles.scorecard}>
        <div className={styles.headerRow}>
          <span className={styles.cardLabel}>Active Pipeline</span>
        </div>
        <div>
          <div className={styles.metricValue}>
            {formatRupees(kpis.activePipelineValue)}
          </div>
          <p className={styles.metaSubtitle}>
            {formatNumber(kpis.activeDealsCount)} active pipeline deals
          </p>
        </div>
      </div>

      {/* 3. Win Rate */}
      <div className={styles.scorecard}>
        <div className={styles.headerRow}>
          <span className={styles.cardLabel}>Win Rate</span>
        </div>
        <div>
          <div className={styles.metricValue}>
            {kpis.winRatePercentage}%
          </div>
          <p className={styles.metaSubtitle}>
            Out of {formatNumber(kpis.closedDealsCount)} closed deals
          </p>
        </div>
      </div>

      {/* 4. Capacity Meter */}
      <div className={styles.scorecard}>
        <div className={styles.headerRow}>
          <span className={styles.cardLabel}>Rep Workload</span>
          <span
            className={`${styles.capacityBadge} ${isAtCapacity ? styles.warning : styles.normal}`}
          >
            {isAtCapacity ? 'At Capacity' : 'Available'}
          </span>
        </div>
        <div>
          <div className={styles.metricValue}>
            {kpis.activeDealsCount}
            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748b' }}>
              {' '}/ {kpis.capacityLimit}
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${capacityPct}%`, backgroundColor: getCapacityColor() }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
