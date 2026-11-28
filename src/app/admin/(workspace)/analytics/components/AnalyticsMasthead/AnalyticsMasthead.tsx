import React from 'react';
import type { AnalyticsTimeframeSlug } from '@/app/lib/analytics-schemas';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import styles from './AnalyticsMasthead.module.scss';

/**
 * Aggregated executive metrics rendered across the top strip of `/admin/analytics`.
 */
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

/**
 * Props for the sales analytics page header, timeframe selector, and KPI strip.
 */
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

/**
 * Renders the Sales Analytics page header, interactive timeframe rail, and
 * 4-column summary strip with accessible 44px touch targets.
 */
export const AnalyticsMasthead: React.FC<AnalyticsMastheadProps> = ({
  timeframe,
  onTimeframeChange,
  metrics,
  periodLabel,
}) => {
  return (
    <header className={styles.mastheadContainer}>
      <div className={styles.topBar}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Sales Analytics</h1>
          <p className={styles.windowLabel}>
            Reporting period: <span>{periodLabel}</span>
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

      <dl className={styles.telemetryStrip} aria-label="Sales KPI summary">
        <div className={styles.telemetryCell}>
          <dt className={styles.cellLabelRow}>
            <span className={`${styles.cellIcon} ${styles.tintIndigo}`} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </span>
            <span className={styles.cellLabelText}>Open Pipeline</span>
          </dt>
          <dd className={`${styles.cellValue} ${styles.valueIndigo}`}>
            {formatCrmCurrency(metrics.totalPipelineValue)}
          </dd>
          <dd className={styles.cellMeta}>
            {metrics.activeDealsCount.toLocaleString('en-IN')} active deals
          </dd>
        </div>

        <div className={styles.telemetryCell}>
          <dt className={styles.cellLabelRow}>
            <span className={`${styles.cellIcon} ${styles.tintEmerald}`} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </span>
            <span className={styles.cellLabelText}>Won Revenue</span>
          </dt>
          <dd className={`${styles.cellValue} ${styles.valueEmerald}`}>
            {formatCrmCurrency(metrics.realizedRevenue)}
          </dd>
          <dd className={styles.cellMeta}>
            {metrics.convertedDealsCount.toLocaleString('en-IN')} closed won deals
          </dd>
        </div>

        <div className={styles.telemetryCell}>
          <dt className={styles.cellLabelRow}>
            <span className={`${styles.cellIcon} ${styles.tintTeal}`} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <span className={styles.cellLabelText}>Avg. Sales Cycle</span>
          </dt>
          <dd className={`${styles.cellValue} ${styles.valueTeal}`}>
            {metrics.averageCycleDays.toFixed(1)}
            <span className={styles.unitSuffix}> days</span>
          </dd>
          <dd className={styles.cellMeta}>
            {formatCrmCurrency(metrics.pipelineVelocityPerDay)} / day closed rate
          </dd>
        </div>

        <div className={styles.telemetryCell}>
          <dt className={styles.cellLabelRow}>
            <span className={`${styles.cellIcon} ${styles.tintRose}`} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </span>
            <span className={styles.cellLabelText}>Win Rate</span>
          </dt>
          <dd className={`${styles.cellValue} ${styles.valueCrimson}`}>
            {metrics.winRatePercentage.toFixed(1)}%
          </dd>
          <dd className={styles.cellMeta}>
            {metrics.wonCount.toLocaleString('en-IN')} won of{' '}
            {metrics.closedDecisionsCount.toLocaleString('en-IN')} closed
          </dd>
        </div>
      </dl>
    </header>
  );
};
