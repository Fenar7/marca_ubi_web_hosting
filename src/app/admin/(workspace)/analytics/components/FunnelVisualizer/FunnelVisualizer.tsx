import React from 'react';
import Link from 'next/link';
import styles from './FunnelVisualizer.module.scss';

export interface FunnelStageItem {
  stageId: string;
  stageName: string;
  sortOrder: number;
  colorCode: string;
  bucket: string;
  leadsEnteredCount: number;
  leadsCurrentlyInStage: number;
  cumulativeReachedCount: number;
  dropOffCount: number;
  stageConversionRate: number;
  dropOffRate: number;
  overallConversionRate: number;
}

export interface FunnelVisualizerProps {
  stages: FunnelStageItem[];
  totalIntake: number;
}

function resolveStageBarColor(stage: FunnelStageItem): string {
  if (stage.bucket === 'converted') return '#059669';
  if (stage.bucket === 'potential') return '#d97706';
  if (stage.bucket === 'lost') return '#ea002a';
  return stage.colorCode && stage.colorCode !== '#ffffff' ? stage.colorCode : '#4338ca';
}

export const FunnelVisualizer: React.FC<FunnelVisualizerProps> = ({ stages, totalIntake }) => {
  const maxStageVolume = Math.max(
    1,
    totalIntake,
    ...stages.map((s) => Math.max(s.cumulativeReachedCount, s.leadsCurrentlyInStage))
  );

  return (
    <section className={styles.funnelSection} aria-labelledby="funnel-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="funnel-heading" className={styles.sectionTitle}>
            Commercial Conversion Funnel
          </h2>
          <p className={styles.sectionSubtitle}>
            Stage-by-stage progression across active opportunities and closed contracts.
          </p>
        </div>
        <div className={styles.intakeReadout}>
          Intake Baseline: <strong>{totalIntake.toLocaleString('en-IN')}</strong> records
        </div>
      </div>

      {stages.length === 0 ? (
        <div className={styles.emptyFunnel}>
          No active funnel stages available for the selected timeframe.
        </div>
      ) : (
        <div className={styles.funnelList} role="list" aria-label="Pipeline Stages">
          <div className={styles.listHeaderRow} aria-hidden="true">
            <span>Stage</span>
            <span>Pipeline Distribution</span>
            <span className={styles.alignRight}>In Stage</span>
            <span className={styles.alignRight}>Reached</span>
            <span className={styles.alignRight}>Step Conv.</span>
            <span className={styles.alignRight}>Drop-off</span>
          </div>

          {stages.map((stage) => {
            const isWon = stage.bucket === 'converted';
            const barColor = resolveStageBarColor(stage);
            const barCount = Math.max(stage.cumulativeReachedCount, stage.leadsCurrentlyInStage);
            const barPct = barCount > 0 ? Math.max(3, Math.round((barCount / maxStageVolume) * 100)) : 0;

            return (
              <Link
                key={stage.stageId}
                href={`/admin/leads?stage=${encodeURIComponent(stage.stageId)}`}
                className={`${styles.stageRow} ${isWon ? styles.wonStageRow : ''}`}
                role="listitem"
                style={{ borderLeftColor: barColor }}
              >
                <div className={styles.stageNameCell}>
                  <span className={styles.stageName}>{stage.stageName}</span>
                  {isWon && <span className={styles.wonTag}>Won</span>}
                </div>

                <div className={styles.barCell}>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${barPct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>

                <div className={`${styles.metricCell} ${styles.alignRight}`}>
                  <span className={styles.mobileMetricLabel}>In Stage</span>
                  <strong className={styles.metricVal}>
                    {stage.leadsCurrentlyInStage.toLocaleString('en-IN')}
                  </strong>
                </div>

                <div className={`${styles.metricCell} ${styles.alignRight}`}>
                  <span className={styles.mobileMetricLabel}>Reached</span>
                  <span className={styles.metricSubVal}>
                    {stage.cumulativeReachedCount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className={`${styles.metricCell} ${styles.alignRight}`}>
                  <span className={styles.mobileMetricLabel}>Conv.</span>
                  <span
                    className={`${styles.rateValue} ${
                      stage.stageConversionRate >= 60 ? styles.highRate : ''
                    }`}
                  >
                    {stage.stageConversionRate.toFixed(1)}%
                  </span>
                </div>

                <div className={`${styles.metricCell} ${styles.alignRight} ${styles.dropOffCell}`}>
                  <span className={styles.mobileMetricLabel}>Drop-off</span>
                  <span className={stage.dropOffCount > 0 ? styles.dropOffWarn : styles.dropOffNeutral}>
                    {stage.dropOffCount > 0
                      ? `-${stage.dropOffCount} (${stage.dropOffRate.toFixed(1)}%)`
                      : '0'}
                  </span>
                  <svg
                    className={styles.rowChevron}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};
