import React from 'react';
import Link from 'next/link';
import styles from './StageDwellMatrix.module.scss';

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

export interface StageDwellMatrixProps {
  rows: StageDwellRow[];
}

export const StageDwellMatrix: React.FC<StageDwellMatrixProps> = ({ rows }) => {
  return (
    <section className={styles.dwellSection} aria-labelledby="dwell-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="dwell-heading" className={styles.sectionTitle}>
            Stage Velocity &amp; Bottleneck Diagnostics
          </h2>
          <p className={styles.sectionSubtitle}>
            Audits dwell duration across pipeline stages. Stalled deals (>14 days without movement) are flagged in crimson.
          </p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.dwellTable}>
          <thead>
            <tr>
              <th>Funnel Stage</th>
              <th>Sample Size</th>
              <th>Median Dwell</th>
              <th>Avg Dwell</th>
              <th>P90 Dwell</th>
              <th>Stalled Deals</th>
              <th>SLA Health</th>
              <th className={styles.actionCol}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isBottleneck = row.stalledDealsCount > 0 || row.medianDwellDays > 10;
              const isSlowing = !isBottleneck && row.medianDwellDays > 5;

              return (
                <tr key={row.stageId}>
                  <td>
                    <div className={styles.stageCell}>
                      <span
                        className={styles.stageDot}
                        style={{ backgroundColor: row.colorCode || '#111111' }}
                        aria-hidden="true"
                      />
                      <span className={styles.stageNameText}>{row.stageName}</span>
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
                      View deals <span>→</span>
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
