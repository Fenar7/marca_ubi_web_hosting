'use client';

/**
 * @file CommercialVelocityScorecards.tsx
 * @description Commercial KPI strip displaying Won Revenue, Active Pipeline,
 *              Win Rate %, and Rep Workload Capacity Meter against SALES_REP_CAPACITY_LIMIT.
 */

import React from 'react';
import type { PersonnelPerformanceKpis } from '@/types/crm';
import { formatRupees, formatNumber } from '@/app/lib/team-utils';
import styles from './CommercialVelocityScorecards.module.scss';

interface CommercialVelocityScorecardsProps {
  kpis: PersonnelPerformanceKpis;
  canViewFinancials?: boolean;
}

export function CommercialVelocityScorecards({
  kpis,
  canViewFinancials = true,
}: CommercialVelocityScorecardsProps): React.ReactElement {
  const safeLimit = Math.max(1, kpis.capacityLimit || 1);
  const capacityPct = Math.min(100, Math.round((kpis.activeDealsCount / safeLimit) * 100));
  const isAtCapacity = kpis.activeDealsCount >= kpis.capacityLimit;

  const getCapacityColor = (): string => {
    if (capacityPct >= 100) return '#9c001e';
    if (capacityPct >= 75) return '#b45309';
    return '#065f46';
  };

  return (
    <section className={styles.scorecardsGrid} aria-label="Commercial Performance Scorecards">
      <div className={styles.scorecard}>
        <div className={styles.headerRow}>
          <span className={styles.cardLabel}>Won Revenue</span>
        </div>
        <div>
          <div className={`${styles.metricValue} ${styles.wonMetric}`}>
            {canViewFinancials ? formatRupees(kpis.wonRevenue) : 'Restricted'}
          </div>
          <p className={styles.metaSubtitle}>
            {formatNumber(kpis.wonDealsCount)} deals converted
          </p>
        </div>
      </div>

      <div className={styles.scorecard}>
        <div className={styles.headerRow}>
          <span className={styles.cardLabel}>Active Pipeline</span>
        </div>
        <div>
          <div className={styles.metricValue}>
            {canViewFinancials ? formatRupees(kpis.activePipelineValue) : 'Restricted'}
          </div>
          <p className={styles.metaSubtitle}>
            {formatNumber(kpis.activeDealsCount)} active pipeline deals
          </p>
        </div>
      </div>

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
            <span className={styles.capacityDenominator}>
              {' '}/ {kpis.capacityLimit}
            </span>
          </div>
          <div
            className={styles.progressBarTrack}
            role="progressbar"
            aria-valuenow={capacityPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Representative workload capacity"
          >
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
