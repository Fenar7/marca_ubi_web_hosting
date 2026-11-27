import React from 'react';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import styles from './QuickMetricsRibbon.module.scss';

/**
 * Props for the top-level lead summary strip on `/admin/leads`.
 * Financial fields may be masked by the server when `canViewFinancials` is false.
 */
export interface QuickMetricsRibbonProps {
  totalInquiries: number;
  activeTriageCount: number;
  overdueCount: number;
  totalPipelineValue: number;
  canViewFinancials?: boolean;
}

/**
 * Displays the four summary KPIs for the leads workspace using tabular numerals
 * and soft-tinted icon badges instead of colored border stripes.
 */
export const QuickMetricsRibbon: React.FC<QuickMetricsRibbonProps> = ({
  totalInquiries,
  activeTriageCount,
  overdueCount,
  totalPipelineValue,
  canViewFinancials = true,
}) => {
  const hasOverdue = overdueCount > 0;

  return (
    <div className={styles.ribbonContainer} aria-label="Lead summary metrics">
      <div className={styles.kpiPod}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>All Leads</span>
          <span className={`${styles.iconBadge} ${styles.iconIndigo}`} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
        </div>
        <strong className={styles.kpiValue}>
          {totalInquiries.toLocaleString('en-IN')}
        </strong>
        <span className={styles.kpiSub}>Total saved leads</span>
      </div>

      <div className={styles.kpiPod}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Open Leads</span>
          <span className={`${styles.iconBadge} ${styles.iconAmber}`} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          </span>
        </div>
        <strong className={styles.kpiValue}>
          {activeTriageCount.toLocaleString('en-IN')}
        </strong>
        <span className={styles.kpiSub}>Currently in progress</span>
      </div>

      <div className={`${styles.kpiPod} ${hasOverdue ? styles.overdueActivePod : ''}`}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Overdue Follow-ups</span>
          <span className={`${styles.iconBadge} ${styles.iconRose}`} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
        </div>
        <strong className={`${styles.kpiValue} ${hasOverdue ? styles.overdueText : ''}`}>
          {overdueCount.toLocaleString('en-IN')}
        </strong>
        <span className={styles.kpiSub}>
          {hasOverdue ? 'Needs immediate follow-up' : 'All follow-ups on track'}
        </span>
      </div>

      <div className={styles.kpiPod}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>Pipeline Value</span>
          <span className={`${styles.iconBadge} ${styles.iconEmerald}`} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
              <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
            </svg>
          </span>
        </div>
        <strong className={styles.kpiValue}>
          {canViewFinancials ? formatCrmCurrency(totalPipelineValue) : 'Restricted'}
        </strong>
        <span className={styles.kpiSub}>
          {canViewFinancials ? 'Total value of open deals' : 'Financial values hidden by role'}
        </span>
      </div>
    </div>
  );
};
