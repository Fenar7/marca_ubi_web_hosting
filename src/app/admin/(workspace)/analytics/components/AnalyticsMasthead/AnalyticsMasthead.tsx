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
    <header className={styles.mastheadContainer}>
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

      {/* Unified 4-cell semantic telemetry strip (replaces boxed equal-card grid) */}
      <dl className={styles.telemetryStrip} aria-label="Executive KPI Telemetry">
        <div className={`${styles.telemetryCell} ${styles.accentIndigo}`}>
          <dt className={styles.cellLabel}>Active Pipeline</dt>
          <dd className={`${styles.cellValue} ${styles.valueIndigo}`}>
            {formatCrmCurrency(metrics.totalPipelineValue)}
          </dd>
          <dd className={styles.cellMeta}>
            {metrics.activeDealsCount.toLocaleString('en-IN')} active opportunities
          </dd>
        </div>

        <div className={`${styles.telemetryCell} ${styles.accentEmerald}`}>
          <dt className={styles.cellLabel}>Realized Revenue</dt>
          <dd className={`${styles.cellValue} ${styles.valueEmerald}`}>
            {formatCrmCurrency(metrics.realizedRevenue)}
          </dd>
          <dd className={styles.cellMeta}>
            {metrics.convertedDealsCount.toLocaleString('en-IN')} closed won contracts
          </dd>
        </div>

        <div className={`${styles.telemetryCell} ${styles.accentTeal}`}>
          <dt className={styles.cellLabel}>Average Sales Cycle</dt>
          <dd className={`${styles.cellValue} ${styles.valueTeal}`}>
            {metrics.averageCycleDays.toFixed(1)}
            <span className={styles.unitSuffix}> days</span>
          </dd>
          <dd className={styles.cellMeta}>
            Throughput {formatCrmCurrency(metrics.pipelineVelocityPerDay)} / day
          </dd>
        </div>

        <div className={`${styles.telemetryCell} ${styles.accentCrimson}`}>
          <dt className={styles.cellLabel}>Commercial Win Rate</dt>
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
