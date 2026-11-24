'use client';

/**
 * @file CommercialVelocityScorecards.tsx
 * @description Multi-color Editorial Commercial Performance Matrix displaying Won Revenue,
 *              Active Pipeline & Capacity, Win Rate & Avg Deal Size, Activity Touchpoints &
 *              Client Works, plus the Funnel Stage Distribution breakdown.
 */

import React from 'react';
import type { PersonnelPerformanceKpis } from '@/types/crm';
import { formatRupees, formatNumber } from '@/app/lib/team-utils';
import styles from './CommercialVelocityScorecards.module.scss';

interface CommercialVelocityScorecardsProps {
  kpis: PersonnelPerformanceKpis;
  canViewFinancials?: boolean;
}

function getBucketAccentColor(bucket: string): string {
  switch (bucket) {
    case 'converted':
      return '#059669';
    case 'potential':
      return '#d97706';
    case 'lost':
      return '#ea002a';
    default:
      return '#4338ca';
  }
}

function getBucketChipClass(bucket: string): string {
  switch (bucket) {
    case 'converted':
      return styles.bucketConverted;
    case 'potential':
      return styles.bucketPotential;
    case 'lost':
      return styles.bucketLost;
    default:
      return styles.bucketOpen;
  }
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
    return '#059669';
  };

  const stages = kpis.stageBreakdown || [];
  const totalStageDeals = Math.max(
    1,
    stages.reduce((acc, s) => acc + s.deal_count, 0)
  );

  return (
    <section className={styles.matrixWrapper} aria-label="Commercial Performance Matrix">
      <div className={styles.scorecardsGrid}>
        {/* 1. Revenue Generated (Emerald) */}
        <div className={`${styles.scorecard} ${styles.accentEmerald}`}>
          <div className={styles.headerRow}>
            <span className={styles.cardLabel}>Revenue Generated</span>
          </div>
          <div>
            <div className={`${styles.metricValue} ${styles.wonMetric}`}>
              {canViewFinancials ? formatRupees(kpis.wonRevenue) : 'Restricted'}
            </div>
            <p className={styles.metaSubtitle}>
              {formatNumber(kpis.wonDealsCount)} won · {formatNumber(kpis.lostDealsCount || 0)} lost
            </p>
          </div>
        </div>

        {/* 2. Active Pipeline & Rep Capacity (Editorial Indigo) */}
        <div className={`${styles.scorecard} ${styles.accentIndigo}`}>
          <div className={styles.headerRow}>
            <span className={styles.cardLabel}>Active Pipeline</span>
            <span
              className={`${styles.capacityBadge} ${isAtCapacity ? styles.warning : styles.normal}`}
            >
              {kpis.activeDealsCount}/{kpis.capacityLimit} {isAtCapacity ? 'Full' : 'Cap'}
            </span>
          </div>
          <div>
            <div className={`${styles.metricValue} ${styles.indigoMetric}`}>
              {canViewFinancials ? formatRupees(kpis.activePipelineValue) : 'Restricted'}
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

        {/* 3. Win Rate & Avg Won Value (Marca Red) */}
        <div className={`${styles.scorecard} ${styles.accentCrimson}`}>
          <div className={styles.headerRow}>
            <span className={styles.cardLabel}>Win Rate</span>
          </div>
          <div>
            <div className={`${styles.metricValue} ${styles.crimsonMetric}`}>
              {kpis.winRatePercentage}%
            </div>
            <p className={styles.metaSubtitle}>
              {canViewFinancials && (kpis.avgWonDealValue || 0) > 0
                ? `Avg won ${formatRupees(kpis.avgWonDealValue || 0)}`
                : `${formatNumber(kpis.closedDealsCount)} closed`}
              {kpis.avgSalesCycleDays !== null && kpis.avgSalesCycleDays !== undefined
                ? ` · ${kpis.avgSalesCycleDays}d cycle`
                : ''}
            </p>
          </div>
        </div>

        {/* 4. Activity & Delivery (Teal) */}
        <div className={`${styles.scorecard} ${styles.accentTeal}`}>
          <div className={styles.headerRow}>
            <span className={styles.cardLabel}>Activity (30d)</span>
          </div>
          <div>
            <div className={`${styles.metricValue} ${styles.tealMetric}`}>
              {formatNumber(kpis.touchpoints30d || 0)}
              <span className={styles.capacityDenominator}> touches</span>
            </div>
            <p className={styles.metaSubtitle}>
              {formatNumber(kpis.clientWorksCount || 0)} client works ·{' '}
              {formatNumber(kpis.overdueFollowUpsCount || 0)} overdue
            </p>
          </div>
        </div>
      </div>

      {/* Funnel Stage Distribution Strip */}
      {stages.length > 0 && (
        <div className={styles.stageBreakdownCard}>
          <div className={styles.stageHeader}>
            <h2 className={styles.stageTitle}>Pipeline Stage Distribution</h2>
            <span className={styles.stageSummaryMeta}>
              {formatNumber(kpis.totalDealsAssigned)} total assigned ·{' '}
              {formatNumber(kpis.totalTouchpoints || 0)} logged interactions all-time
            </span>
          </div>

          <div className={styles.stageBarTrack} aria-hidden="true">
            {stages.map((stage) => {
              const pct = Math.max(4, Math.round((stage.deal_count / totalStageDeals) * 100));
              return (
                <div
                  key={stage.status_id}
                  className={styles.stageBarSegment}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: getBucketAccentColor(stage.bucket),
                  }}
                  title={`${stage.status_name}: ${stage.deal_count}`}
                />
              );
            })}
          </div>

          <div className={styles.stageChipsRow}>
            {stages.map((stage) => (
              <div
                key={stage.status_id}
                className={`${styles.stageChip} ${getBucketChipClass(stage.bucket)}`}
              >
                <span className={styles.stageName}>{stage.status_name}</span>
                <span className={styles.stageCount}>
                  {formatNumber(stage.deal_count)}
                  {canViewFinancials && stage.total_value > 0
                    ? ` · ${formatRupees(stage.total_value)}`
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
