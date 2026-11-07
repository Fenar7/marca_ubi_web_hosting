'use client';

import React from 'react';
import Link from 'next/link';
import type { ExecutiveDashboardKpis } from './types';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import styles from './ExecutiveKpiGrid.module.scss';

export interface ExecutiveKpiGridProps {
  kpis: ExecutiveDashboardKpis;
  cadenceLabel: string;
  metricStatus: {
    pipeline: 'ready' | 'unavailable';
    revenue: 'ready' | 'unavailable';
    cohort: 'ready' | 'unavailable';
  };
}

function comparison(value: number | null, cadence: string): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}% vs prior ${cadence}`;
}

/** Groups current-state pipeline values separately from period-specific conversion outcomes. */
export function ExecutiveKpiGrid({ kpis, cadenceLabel, metricStatus }: ExecutiveKpiGridProps): React.ReactElement {
  const cards = [
    {
      label: 'Active pipeline',
      value: metricStatus.pipeline === 'ready' && kpis.totalPipelineValue !== null ? formatCrmCurrency(kpis.totalPipelineValue) : 'Unavailable',
      detail: metricStatus.pipeline === 'unavailable' ? 'Pipeline records could not be loaded' : kpis.weightedPipelineValue === null ? 'Weighted value unavailable' : `Weighted ${formatCrmCurrency(kpis.weightedPipelineValue)}`,
      href: '/admin/deals',
    },
    {
      label: 'Converted contract value',
      value: metricStatus.revenue === 'ready' && kpis.convertedRevenueValue !== null ? formatCrmCurrency(kpis.convertedRevenueValue) : 'Unavailable',
      detail: metricStatus.revenue === 'unavailable' ? 'Conversion records could not be loaded' : `${(kpis.convertedDealsCount ?? 0).toLocaleString('en-IN')} conversions in ${cadenceLabel}`,
      comparison: metricStatus.revenue === 'ready' ? comparison(kpis.revenueDeltaPercentage, cadenceLabel) : null,
      href: '/admin/analytics',
    },
    {
      label: 'Active deals',
      value: metricStatus.pipeline === 'ready' && kpis.activeDealsCount !== null ? kpis.activeDealsCount.toLocaleString('en-IN') : 'Unavailable',
      detail: metricStatus.pipeline === 'unavailable' ? 'Pipeline records could not be loaded' : 'Open and potential records now',
      href: '/admin/deals',
    },
    {
      label: 'Lead conversion rate',
      value: metricStatus.cohort === 'ready' && kpis.conversionWinRate !== null ? `${kpis.conversionWinRate.toFixed(1)}%` : 'Unavailable',
      detail: metricStatus.cohort === 'unavailable'
        ? 'Lead cohort records could not be loaded'
        : kpis.conversionEligibleCount === 0
          ? `No eligible leads created in ${cadenceLabel}`
          : `${(kpis.conversionWonCount ?? 0).toLocaleString('en-IN')} closed won of ${(kpis.conversionEligibleCount ?? 0).toLocaleString('en-IN')} eligible leads created in ${cadenceLabel}`,
      href: '/admin/analytics',
    },
  ];

  return (
    <section className={styles.gridContainer} aria-label="Commercial performance snapshot">
      {cards.map((card, index) => (
        <Link href={card.href} key={card.label} className={styles.kpiCard}>
          <span className={styles.kpiIndex}>{String(index + 1).padStart(2, '0')}</span>
          <span className={styles.kpiLabel}>{card.label}</span>
          <strong className={styles.kpiValue}>{card.value}</strong>
          <span className={styles.detail}>{card.detail}</span>
          {'comparison' in card && card.comparison && <span className={styles.comparison}>{card.comparison}</span>}
        </Link>
      ))}
    </section>
  );
}
