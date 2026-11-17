
import React from 'react';
import styles from './ConyestKpiCard.module.scss';

interface ConyestKpiCardProps {
  label: string;
  metric: string;
  trend: string;
  trendDirection: 'up' | 'down';
  subtitle: string;
}

export const ConyestKpiCard: React.FC<ConyestKpiCardProps> = ({ 
  label, metric, trend, trendDirection, subtitle 
}) => {
  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      <span className={styles.metric}>{metric}</span>
      <div className={styles.footer}>
        <span className={`${styles.trend} ${styles[trendDirection]}`}>{trend}</span>
        <span className={styles.subtitle}>{subtitle}</span>
      </div>
    </div>
  );
};
