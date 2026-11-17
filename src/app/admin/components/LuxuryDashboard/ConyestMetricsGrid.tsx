
import React from 'react';
import styles from './ConyestMetricsGrid.module.scss';
import { ConyestKpiCard } from './ConyestKpiCard';
import { ConyestVirtualCard } from './ConyestVirtualCard';

export const ConyestMetricsGrid: React.FC = () => {
  return (
    <div className={styles.grid}>
      <ConyestVirtualCard />
      <ConyestKpiCard 
        label="Total Income" 
        metric="$42,560" 
        trend="↗ 2.84%" 
        trendDirection="up" 
        subtitle="Last month $38,568" 
      />
      <ConyestKpiCard 
        label="Total Expenses" 
        metric="$28,358" 
        trend="↘ 4.78%" 
        trendDirection="down" 
        subtitle="Last month $26,340" 
      />
      <ConyestKpiCard 
        label="Total Saving" 
        metric="$14,202" 
        trend="↗ 1.98%" 
        trendDirection="up" 
        subtitle="Last month $12,230" 
      />
    </div>
  );
};
