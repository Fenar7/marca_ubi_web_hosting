import React from 'react';
import type { AnalyticsTimeframeSlug } from '@/app/lib/analytics-schemas';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import styles from './AnalyticsMasthead.module.scss';

export interface AnalyticsMastheadMetrics {
  totalPipelineValue: number;
  activeDealsCount: number;
  realizedRevenue: number;
  convertedDealsCount: number;
  averageCycleDays: number;
  pipelineVelocityPerDay: number;
  winRatePercentage: number;
  wonCount: number;
  closedDecisionsCount: number;
}

export interface AnalyticsMastheadProps {
  timeframe: AnalyticsTimeframeSlug;
  onTimeframeChange: (tf: AnalyticsTimeframeSlug) => void;
  metrics: AnalyticsMastheadMetrics;
  periodLabel: string;
}

const TIMEFRAME_OPTIONS: { slug: AnalyticsTimeframeSlug; label: string }[] = [
  { slug: '7d', label: '7D' },
  { slug: '30d', label: '30D' },
  { slug: '90d', label: '90D' },
  { slug: 'q1', label: 'Q1' },
  { slug: 'q2', label: 'Q2' },
  { slug: 'q3', label: 'Q3' },
  { slug: 'q4', label: 'Q4' },
  { slug: 'ytd', label: 'YTD' },
];

export const AnalyticsMasthead: React.FC<AnalyticsMastheadProps> = ({
  timeframe,
  onTimeframeChange,
  metrics,
  periodLabel,
}) => {
  return (
    <div className={styles.mastheadContainer}>
      <div className={styles.topBar}>
        <div className={styles.headerInfo}>
          <p className={styles.eyebrow}>Commercial Intelligence &amp; Telemetry</p>
          <h1 className={styles.title}>Revenue &amp; Pipeline Analytics</h1>
          <p className={styles.windowLabel}>
            Window: <span>{periodLabel}</span> · Excludes synthetic benchmark entries
          </p>
        </div>

        <nav className={styles.timeframeRail} aria-label="Timeframe selector">
          {TIMEFRAME_OPTIONS.map((opt) => (
            <button
              key={opt.slug}
              type="button"
              className={`${styles.timeframePill} ${timeframe === opt.slug ? styles.activePill : ''}`}
              onClick={() => onTimeframeChange(opt.slug)}
              aria-pressed={timeframe === opt.slug}
            >
              {opt.label}
            </button>
          ))}
        </nav>
      </div>

      <div className={styles.scorecardsGrid} aria-label="Executive KPI Telemetry">
        {/* Pod 1: Active Pipeline */}
        <div className={styles.scorecard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Active Pipeline</span>
            <span className={styles.neutralBadge}>Open Scope</span>
          </div>
          <strong className={styles.primaryMetric}>
            {formatCrmCurrency(metrics.totalPipelineValue)}
          </strong>
          <p className={styles.cardDetail}>
            <span>{metrics.activeDealsCount.toLocaleString('en-IN')}</span> active opportunities across open stages
          </p>
        </div>

        {/* Pod 2: Realized Converted Revenue */}
        <div className={styles.scorecard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Realized Revenue</span>
            <span className={styles.successBadge}>Closed Won</span>
          </div>
          <strong className={styles.primaryMetric}>
            {formatCrmCurrency(metrics.realizedRevenue)}
          </strong>
          <p className={styles.cardDetail}>
            <span>{metrics.convertedDealsCount.toLocaleString('en-IN')}</span> contracts signed in selected window
          </p>
        </div>

        {/* Pod 3: Sales Cycle & Velocity */}
        <div className={styles.scorecard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Average Sales Cycle</span>
            <span className={styles.neutralBadge}>Velocity</span>
          </div>
          <strong className={styles.primaryMetric}>
            {metrics.averageCycleDays.toFixed(1)} <span className={styles.metricUnit}>Days</span>
          </strong>
          <p className={styles.cardDetail}>
            Throughput: <span>{formatCrmCurrency(metrics.pipelineVelocityPerDay)}</span> / day
          </p>
        </div>

        {/* Pod 4: Commercial Win Rate */}
        <div className={styles.scorecard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Commercial Win Rate</span>
            <span className={styles.accentBadge}>Win/Loss</span>
          </div>
          <strong className={styles.primaryMetric}>
            {metrics.winRatePercentage.toFixed(1)}<span className={styles.metricUnit}>%</span>
          </strong>
          <p className={styles.cardDetail}>
            <span>{metrics.wonCount}</span> won of {metrics.closedDecisionsCount} closed decisions
          </p>
        </div>
      </div>
    </div>
  );
};
