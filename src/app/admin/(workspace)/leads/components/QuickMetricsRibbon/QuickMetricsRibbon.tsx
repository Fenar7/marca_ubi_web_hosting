import React from 'react';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import styles from './QuickMetricsRibbon.module.scss';

export interface QuickMetricsRibbonProps {
  totalInquiries: number;
  activeTriageCount: number;
  overdueCount: number;
  totalPipelineValue: number;
  canViewFinancials?: boolean;
}

export const QuickMetricsRibbon: React.FC<QuickMetricsRibbonProps> = ({
  totalInquiries,
  activeTriageCount,
  overdueCount,
  totalPipelineValue,
  canViewFinancials = true,
}) => {
  return (
    <div className={styles.ribbonContainer} aria-label="Inbound Lead Telemetry Overview">
      {/* Pod 1: Total Captured Inquiries */}
      <div className={`${styles.kpiPod} ${styles.podIndigo}`}>
        <span className={styles.kpiLabel}>Total Inquiries</span>
        <strong className={styles.kpiValue}>
          {totalInquiries.toLocaleString('en-IN')}
        </strong>
        <span className={styles.kpiSub}>All captured commercial leads</span>
      </div>

      {/* Pod 2: Active Triage */}
      <div className={`${styles.kpiPod} ${styles.podOrange}`}>
        <span className={styles.kpiLabel}>Active Triage</span>
        <strong className={styles.kpiValue}>
          {activeTriageCount.toLocaleString('en-IN')}
        </strong>
        <span className={styles.kpiSub}>Open &amp; potential opportunities</span>
      </div>

      {/* Pod 3: Overdue SLAs */}
      <div className={`${styles.kpiPod} ${styles.podCrimson} ${overdueCount > 0 ? styles.overdueActivePod : ''}`}>
        <span className={styles.kpiLabel}>Overdue Commitments</span>
        <strong className={`${styles.kpiValue} ${overdueCount > 0 ? styles.overdueText : ''}`}>
          {overdueCount.toLocaleString('en-IN')}
        </strong>
        <span className={styles.kpiSub}>
          {overdueCount > 0 ? 'Urgent attention required' : 'All SLA commitments on track'}
        </span>
      </div>

      {/* Pod 4: Active Pipeline Valuation */}
      <div className={`${styles.kpiPod} ${styles.podEmerald}`}>
        <span className={styles.kpiLabel}>Active Pipeline</span>
        <strong className={styles.kpiValue}>
          {canViewFinancials ? formatCrmCurrency(totalPipelineValue) : 'Restricted'}
        </strong>
        <span className={styles.kpiSub}>
          {canViewFinancials ? 'Unweighted portfolio valuation' : 'Financial scope hidden by role policy'}
        </span>
      </div>
    </div>
  );
};
