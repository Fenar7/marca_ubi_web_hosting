import React from 'react';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import styles from './QuickMetricsRibbon.module.scss';

export interface QuickMetricsRibbonProps {
  totalInquiries: number;
  activeTriageCount: number;
  overdueCount: number;
  totalPipelineValue: number;
}

export const QuickMetricsRibbon: React.FC<QuickMetricsRibbonProps> = ({
  totalInquiries,
  activeTriageCount,
  overdueCount,
  totalPipelineValue,
}) => {
  return (
    <div className={styles.ribbonContainer} aria-label="Inbound Lead Telemetry Overview">
      {/* Pod 1: Total Captured Inquiries */}
      <div className={styles.kpiPod}>
        <span className={styles.kpiLabel}>Total Inquiries</span>
        <strong className={styles.kpiValue}>
          {totalInquiries.toLocaleString('en-IN')}
        </strong>
        <span className={styles.kpiSub}>All captured commercial leads</span>
      </div>

      {/* Pod 2: Active Triage */}
      <div className={styles.kpiPod}>
        <span className={styles.kpiLabel}>Active Triage</span>
        <strong className={styles.kpiValue}>
          {activeTriageCount.toLocaleString('en-IN')}
        </strong>
        <span className={styles.kpiSub}>Open &amp; potential opportunities</span>
      </div>

      {/* Pod 3: Overdue SLAs */}
      <div className={`${styles.kpiPod} ${overdueCount > 0 ? styles.overdueActivePod : ''}`}>
        <span className={styles.kpiLabel}>Overdue Commitments</span>
        <strong className={`${styles.kpiValue} ${overdueCount > 0 ? styles.overdueText : ''}`}>
          {overdueCount.toLocaleString('en-IN')}
        </strong>
        <span className={styles.kpiSub}>
          {overdueCount > 0 ? 'Urgent attention required' : 'All SLA commitments on track'}
        </span>
      </div>

      {/* Pod 4: Active Pipeline Valuation */}
      <div className={styles.kpiPod}>
        <span className={styles.kpiLabel}>Active Pipeline</span>
        <strong className={styles.kpiValue}>
          {formatCrmCurrency(totalPipelineValue)}
        </strong>
        <span className={styles.kpiSub}>Unweighted portfolio valuation</span>
      </div>
    </div>
  );
};
