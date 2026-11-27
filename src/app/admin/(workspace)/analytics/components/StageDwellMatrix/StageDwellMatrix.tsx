import React from 'react';
import Link from 'next/link';
import styles from './StageDwellMatrix.module.scss';

/**
 * Per-stage dwell duration statistics returned by `get_stage_dwell_time_metrics`.
 * Deals exceeding 14 days without progression are counted in `stalledDealsCount`.
 */
export interface StageDwellRow {
  stageId: string;
  stageName: string;
  sortOrder: number;
  colorCode: string;
  sampleSize: number;
  avgDwellDays: number;
  medianDwellDays: number;
  p90DwellDays: number;
  stalledDealsCount: number;
}

/**
 * Props for the stage dwell and bottleneck diagnostics table.
 */
export interface StageDwellMatrixProps {
  rows: StageDwellRow[];
}

/**
 * Renders stage dwell times (median, average, P90) and flags stalled deals
 * so managers can identify bottlenecks without decorative border stripes.
 */
export const StageDwellMatrix: React.FC<StageDwellMatrixProps> = ({ rows }) => {
  return (
    <section className={styles.dwellSection} aria-labelledby="dwell-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="dwell-heading" className={styles.sectionTitle}>
            Time in Stage
          </h2>
          <p className={styles.sectionSubtitle}>
            Shows how long deals stay in each stage. Deals stalled over 14 days are flagged.
          </p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.dwellTable}>
          <thead>
            <tr>
              <th>Stage</th>
              <th>Sample Size</th>
              <th>Median Dwell</th>
              <th>Avg Dwell</th>
              <th>P90 Dwell</th>
              <th>Stalled Deals</th>
              <th>Health</th>
              <th className={styles.actionCol}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isBottleneck = row.stalledDealsCount > 0 || row.medianDwellDays > 10;
              const isSlowing = !isBottleneck && row.medianDwellDays > 5;
              const stageColor = row.colorCode && row.colorCode !== '#ffffff' ? row.colorCode : '#4338ca';

              return (
                <tr key={row.stageId}>
                  <td>
                    <div className={styles.stageCell}>
                      <span
                        className={styles.stagePill}
                        style={{ borderColor: stageColor }}
                      >
                        <span
                          className={styles.stageSwatch}
                          style={{ backgroundColor: stageColor }}
                          aria-hidden="true"
                        />
                        <span className={styles.stageNameText}>{row.stageName}</span>
                      </span>
                    </div>
                  </td>
                  <td className={styles.numericCell}>
                    {row.sampleSize.toLocaleString('en-IN')} deals
                  </td>
                  <td className={styles.numericCell}>
                    <strong>{row.medianDwellDays.toFixed(1)}</strong> d
                  </td>
                  <td className={styles.numericCell}>
                    {row.avgDwellDays.toFixed(1)} d
                  </td>
                  <td className={styles.numericCell}>
                    {row.p90DwellDays.toFixed(1)} d
                  </td>
                  <td>
                    {row.stalledDealsCount > 0 ? (
                      <span className={styles.stalledBadge}>
                        {row.stalledDealsCount} stalled
                      </span>
                    ) : (
                      <span className={styles.zeroStalled}>0</span>
                    )}
                  </td>
                  <td>
                    {isBottleneck ? (
                      <span className={styles.bottleneckChip}>Bottleneck</span>
                    ) : isSlowing ? (
                      <span className={styles.slowingChip}>Slowing</span>
                    ) : (
                      <span className={styles.healthyChip}>Healthy</span>
                    )}
                  </td>
                  <td className={styles.actionCol}>
                    <Link
                      href={`/admin/leads?stage=${encodeURIComponent(row.stageId)}`}
                      className={styles.inspectBtn}
                    >
                      <span>View deals</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
