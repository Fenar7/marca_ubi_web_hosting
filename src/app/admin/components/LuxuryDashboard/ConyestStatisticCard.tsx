import React, { useMemo } from 'react';
import styles from './ConyestStatisticCard.module.scss';
import { computeDonutLayout } from '../../lib/chartGeometry';

/**
 * ConyestStatisticCard: Donut chart component visualizing stage distribution.
 */

export const ConyestStatisticCard: React.FC = () => {
  const data = useMemo(() => [
    { label: 'Rent & Living', percentage: 60, color: '#1f4843' },
    { label: 'Groceries', percentage: 15, color: '#9dd980' },
    { label: 'Transportation', percentage: 12, color: '#8bdf1d' },
    { label: 'Utilities', percentage: 8, color: '#d6f7c7' },
    { label: 'Entertainment', percentage: 5, color: '#e6f9d8' },
  ], []);

  const layout = useMemo(() => computeDonutLayout(data), [data]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>Statistic</h3>
        <select className={styles.select}>
          <option>This Month</option>
        </select>
      </div>
      <div className={styles.donutContainer}>
        <svg viewBox="0 0 220 220" width={layout.radius * 2} height={layout.radius * 2}>
          <circle cx={layout.cx} cy={layout.cy} r={layout.radius} fill="none" strokeWidth={layout.strokeWidth} stroke="#f1f5f9" />
          {layout.segments.map((s, i) => (
            <circle
              key={i}
              cx={layout.cx}
              cy={layout.cy}
              r={layout.radius}
              fill="none"
              stroke={s.color}
              strokeWidth={layout.strokeWidth}
              strokeDasharray={s.strokeDasharray}
              strokeDashoffset={s.strokeDashoffset}
              transform={`rotate(-90 ${layout.cx} ${layout.cy})`}
            />
          ))}
        </svg>
      </div>
      <ul className={styles.breakdown}>
        {data.map((d, i) => (
          <li key={i}>{d.label}: {d.percentage}%</li>
        ))}
      </ul>
    </div>
  );
};
