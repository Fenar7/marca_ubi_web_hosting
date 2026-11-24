import React from 'react';
import Link from 'next/link';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
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

export const FunnelVisualizer: React.FC<FunnelVisualizerProps> = ({ stages, totalIntake }) => {
  return (
    <section className={styles.funnelSection} aria-labelledby="funnel-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="funnel-heading" className={styles.sectionTitle}>
            Commercial Conversion Funnel &amp; Drop-off Analysis
          </h2>
          <p className={styles.sectionSubtitle}>
            Full progression from Inbound Intake to Converted Contract. Evaluates stage transitions and leakage.
          </p>
        </div>
        <div className={styles.intakeBadge}>
          Intake Baseline: <strong>{totalIntake.toLocaleString('en-IN')}</strong> records
        </div>
      </div>

      <div className={styles.funnelRail} role="list" aria-label="Pipeline Stages">
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          const isWon = stage.bucket === 'converted';

          return (
            <React.Fragment key={stage.stageId}>
              <div
                className={`${styles.stagePod} ${isWon ? styles.wonStagePod : ''}`}
                role="listitem"
              >
                <div className={styles.podTop}>
                  <div className={styles.stageTitleRow}>
                    <span
                      className={styles.stageDot}
                      style={{ backgroundColor: stage.colorCode || '#111111' }}
                      aria-hidden="true"
                    />
                    <span className={styles.stageName}>{stage.stageName}</span>
                  </div>
                  <span className={styles.reachedPill}>
                    {stage.cumulativeReachedCount} reached
                  </span>
                </div>

                <div className={styles.podMetrics}>
                  <div className={styles.metricRow}>
                    <span className={styles.subLabel}>Current In Stage</span>
                    <strong className={styles.metricVal}>
                      {stage.leadsCurrentlyInStage.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.subLabel}>Step Conversion</span>
                    <span
                      className={`${styles.rateTag} ${
                        stage.stageConversionRate >= 60 ? styles.highRate : styles.midRate
                      }`}
                    >
                      {stage.stageConversionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {!isLast && (
                  <div className={styles.dropOffBar}>
                    <span className={styles.dropOffLabel}>Drop-off</span>
                    <span className={styles.dropOffVal}>
                      {stage.dropOffCount > 0 ? (
                        <>
                          -{stage.dropOffCount} ({stage.dropOffRate.toFixed(1)}%)
                        </>
                      ) : (
                        '0 (0.0%)'
                      )}
                    </span>
                  </div>
                )}

                <Link
                  href={`/admin/leads?stage=${encodeURIComponent(stage.stageId)}`}
                  className={styles.drillLink}
                  aria-label={`Inspect ${stage.stageName} records`}
                >
                  Inspect deals <span>→</span>
                </Link>
              </div>

              {!isLast && (
                <div className={styles.stepChevron} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};
