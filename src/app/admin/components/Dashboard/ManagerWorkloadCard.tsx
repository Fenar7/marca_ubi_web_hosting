'use client';

/**
 * @file ManagerWorkloadCard.tsx
 * @description Sales Representative Workload Balancing & SLA Oversight Card for /admin.
 *              Displays real-time capacity metrics per commercial representative:
 *              - Active deal counts and total pipeline valuation
 *              - Conversion rate percentage
 *              - Overdue touchpoints partitioned into <24h, 24-72h, and >72h urgency tiers
 *              - Direct trigger launching the BatchReassignModal for stalled lead reallocation
 * @module admin/components/Dashboard/ManagerWorkloadCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useTransition } from 'react';
import {
  getManagerWorkloadDataAction,
  type ManagerWorkloadData,
  type OverdueLeadSummary,
} from '@/app/actions/workloadActions';
import { BatchReassignModal } from '@/app/admin/components/modals';
import styles from './ManagerWorkloadCard.module.scss';

export interface ManagerWorkloadCardProps {
  /** Optional pre-fetched workload telemetry from server component */
  initialData?: ManagerWorkloadData | null;
  /** Optional custom CSS class name */
  className?: string;
}

function formatCurrency(amount: number): string {
  if (!amount || amount <= 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ManagerWorkloadCard({
  initialData,
  className = '',
}: ManagerWorkloadCardProps): React.ReactElement {
  const [data, setData] = useState<ManagerWorkloadData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const loadTelemetry = (): void => {
    startTransition(async () => {
      const result = await getManagerWorkloadDataAction();
      if (result.success && result.data) {
        setData(result.data);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    if (!initialData) {
      loadTelemetry();
    }
  }, [initialData]);

  // Aggregate all overdue leads across all representatives
  const allOverdueLeads: OverdueLeadSummary[] = React.useMemo(() => {
    if (!data?.reps) return [];
    return data.reps.flatMap((r) => r.overdueLeads);
  }, [data?.reps]);

  const handleOpenBatchAll = (): void => {
    setSelectedRepId(null);
    setIsModalOpen(true);
  };

  const handleOpenRepReassign = (repUserId: string): void => {
    setSelectedRepId(repUserId);
    setIsModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setSelectedRepId(null);
  };

  const handleReassignSuccess = (): void => {
    loadTelemetry();
  };

  const totals = data?.totals || {
    totalActiveReps: 0,
    totalActiveDeals: 0,
    totalPipelineValue: 0,
    totalOverdueDeals: 0,
    totalCriticalOverdue: 0,
  };

  return (
    <section className={`${styles.container} ${className}`.trim()} aria-label="Commercial Workload and SLA Oversight">
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Team Capacity & SLA Tracking</span>
          <h2 className={styles.title}>Representative Workload Oversight</h2>
          <p className={styles.subtitle}>
            Active deal quotas, conversion velocities, and overdue touchpoint escalation monitoring.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.batchButton}
            onClick={handleOpenBatchAll}
            disabled={allOverdueLeads.length === 0}
            title={
              allOverdueLeads.length === 0
                ? 'No overdue accounts requiring reassignment'
                : `Reassign ${allOverdueLeads.length} overdue deals`
            }
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span>Batch Reassign Overdue ({allOverdueLeads.length})</span>
          </button>
        </div>
      </header>

      {/* Global Card Metrics Ribbon */}
      <div className={styles.kpiSummaryRow}>
        <div className={styles.summaryMetric}>
          <span className={styles.metricLabel}>Active Representatives</span>
          <span className={styles.metricValue}>{totals.totalActiveReps}</span>
        </div>

        <div className={styles.summaryMetric}>
          <span className={styles.metricLabel}>Managed Active Pipeline</span>
          <span className={styles.metricValue}>
            {formatCurrency(totals.totalPipelineValue)}
          </span>
        </div>

        <div className={styles.summaryMetric}>
          <span className={styles.metricLabel}>Total Overdue Deals</span>
          <span className={styles.metricValue}>
            {totals.totalOverdueDeals}
          </span>
        </div>

        <div className={styles.summaryMetric}>
          <span className={styles.metricLabel}>Critical Overdue (&gt;72h)</span>
          <span className={`${styles.metricValue} ${totals.totalCriticalOverdue > 0 ? styles.criticalAlert : ''}`}>
            {totals.totalCriticalOverdue > 0 && <span className={styles.pulseDot} aria-hidden="true" />}
            {totals.totalCriticalOverdue}
          </span>
        </div>
      </div>

      {/* Representatives Workload Rows */}
      <div className={styles.repsList} role="list" aria-label="Sales Representatives Workload">
        {isLoading ? (
          <div className={styles.emptyState}>Loading representative workload metrics...</div>
        ) : !data?.reps || data.reps.length === 0 ? (
          <div className={styles.emptyState}>No commercial representatives found in directory.</div>
        ) : (
          data.reps.map((rep) => (
            <div key={rep.userId} className={styles.repRow} role="listitem">
              {/* Rep Identity */}
              <div className={styles.repProfileCol}>
                <div className={styles.avatar} aria-hidden="true">
                  {rep.avatarInitials}
                </div>
                <div className={styles.repMeta}>
                  <div className={styles.repName}>
                    <span>{rep.fullName}</span>
                    <span className={styles.roleBadge}>{rep.role.replace('_', ' ')}</span>
                  </div>
                  <span className={styles.repEmail}>{rep.email}</span>
                </div>
              </div>

              {/* Rep Telemetry Stats */}
              <div className={styles.repStatsCol}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Active Deals</span>
                  <span className={styles.statValue}>
                    {rep.activeDealsCount} ({formatCurrency(rep.totalPipelineValue)})
                  </span>
                </div>

                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Win Velocity</span>
                  <span className={styles.statValue}>{rep.conversionRatePercentage}%</span>
                </div>

                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Overdue Tasks</span>
                  <div className={styles.overdueBadgesGroup}>
                    {rep.overdueTasksCount === 0 ? (
                      <span className={styles.pillClear}>All Current</span>
                    ) : (
                      <>
                        {rep.amberCount > 0 && (
                          <span className={styles.pillAmber} title={`${rep.amberCount} deal(s) overdue <24h`}>
                            {rep.amberCount} &lt;24h
                          </span>
                        )}
                        {rep.orangeCount > 0 && (
                          <span className={styles.pillOrange} title={`${rep.orangeCount} deal(s) overdue 24-72h`}>
                            {rep.orangeCount} 1-3d
                          </span>
                        )}
                        {rep.criticalCount > 0 && (
                          <span className={styles.pillRed} title={`${rep.criticalCount} deal(s) critical >72h`}>
                            {rep.criticalCount} &gt;3d
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Rep Action */}
                <button
                  type="button"
                  className={styles.reassignRepButton}
                  onClick={() => handleOpenRepReassign(rep.userId)}
                  disabled={rep.overdueTasksCount === 0}
                  title={
                    rep.overdueTasksCount === 0
                      ? 'No overdue accounts for this representative'
                      : `Reassign ${rep.overdueTasksCount} overdue account(s) from ${rep.fullName}`
                  }
                >
                  Reassign ({rep.overdueTasksCount})
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Batch Reassign Modal */}
      {isModalOpen && (
        <BatchReassignModal
          isOpen={isModalOpen}
          overdueLeads={allOverdueLeads}
          availableReps={data?.availableReps || []}
          preselectedSourceRepId={selectedRepId}
          onClose={handleCloseModal}
          onSuccess={handleReassignSuccess}
        />
      )}
    </section>
  );
}
