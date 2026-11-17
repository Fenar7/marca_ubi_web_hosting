import React, { useMemo } from 'react';
import styles from './ConyestCashflowCard.module.scss';
import { computeVelocityChartLayout } from '../../lib/chartGeometry';

/**
 * ConyestCashflowCard: A dual-directional bar chart component visualizing monthly cashflow.
 */

export const ConyestCashflowCard: React.FC = () => {
  const data = useMemo(() => [
    { month: 'Jan', fullName: 'January', income: 8000, expense: 5000 },
    { month: 'Feb', fullName: 'February', income: 7000, expense: 6000 },
    { month: 'Mar', fullName: 'March', income: 9000, expense: 4000 },
    { month: 'Apr', fullName: 'April', income: 6000, expense: 7000 },
    { month: 'May', fullName: 'May', income: 8500, expense: 5500 },
    { month: 'Jun', fullName: 'June', income: 9500, expense: 4500 },
    { month: 'Jul', fullName: 'July', income: 7500, expense: 6500 },
    { month: 'Aug', fullName: 'August', income: 9540, expense: 8230 },
    { month: 'Sep', fullName: 'September', income: 8000, expense: 5000 },
    { month: 'Oct', fullName: 'October', income: 7000, expense: 6000 },
    { month: 'Nov', fullName: 'November', income: 9000, expense: 4000 },
    { month: 'Dec', fullName: 'December', income: 6000, expense: 7000 },
  ], []);

  const layout = useMemo(() => computeVelocityChartLayout(data, 7), [data]); // 7 is Aug (active)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>Cashflow</h3>
        <select className={styles.select}>
          <option>This Year</option>
        </select>
      </div>
      <svg className={styles.chart} viewBox={`0 0 ${layout.svgWidth} ${layout.svgHeight}`}>
        {layout.activeHalo && (
          <rect
            x={layout.activeHalo.x}
            y={layout.activeHalo.y}
            width={layout.activeHalo.width}
            height={layout.activeHalo.height}
            rx={12}
            fill="rgba(226, 242, 203, 0.45)"
            stroke="#b9e57d"
            strokeWidth={2}
          />
        )}
        {layout.clusters.map((c, i) => (
          <g key={i}>
            {c.intakePath && <path d={c.intakePath} fill="#94e622" />}
            {c.wonPath && <path d={c.wonPath} fill="#1f4843" />}
          </g>
        ))}
      </svg>
    </div>
  );
};
