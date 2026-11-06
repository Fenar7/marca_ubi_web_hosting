'use client';

import React from 'react';
import Link from 'next/link';
import type { ExecutiveDashboardKpis } from './types';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import styles from './ExecutiveKpiGrid.module.scss';

export interface ExecutiveKpiGridProps {
  kpis?: ExecutiveDashboardKpis | null;
  cadenceLabel?: string;
  dataStatus?: 'ready' | 'unavailable';
}

/** A comparison is shown only when its baseline is defined and positive. */
function comparison(value: number | null | undefined, cadence: string): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Comparison unavailable';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}% ${cadence}`;
}

export function ExecutiveKpiGrid({ kpis, cadenceLabel, dataStatus }: ExecutiveKpiGridProps): React.ReactElement {
  if (!kpis || dataStatus === 'unavailable') {
    return <section className={styles.unavailableState} role="status">Dashboard metrics could not be loaded. Refresh to try again.</section>;
  }
  const cadence = cadenceLabel || kpis.cadenceLabel || 'comparison';
  const cards = [
    { label: 'Active pipeline', value: formatCrmCurrency(kpis.totalPipelineValue), detail: kpis.weightedPipelineValue === null ? 'Weighted value unavailable' : `Weighted: ${formatCrmCurrency(kpis.weightedPipelineValue)}`, change: null, href: '/admin/deals' },
    { label: 'Converted contract value', value: formatCrmCurrency(kpis.convertedRevenueValue), detail: `${kpis.convertedDealsCount.toLocaleString('en-IN')} conversions in this period`, change: kpis.revenueDeltaPercentage, href: '/admin/analytics' },
    { label: 'Active deals', value: kpis.activeDealsCount.toLocaleString('en-IN'), detail: 'Current open and potential leads', change: null, href: '/admin/deals' },
    { label: 'Conversion rate', value: kpis.conversionWinRate === null ? 'Unavailable' : `${kpis.conversionWinRate.toFixed(1)}%`, detail: 'Current outcome of leads created in this period', change: kpis.winRateDeltaPercentage, href: '/admin/analytics' },
  ];
  return <section className={styles.gridContainer} aria-label="Executive key performance indicators">
    {cards.map((card) => <Link href={card.href} key={card.label} className={styles.kpiCard}>
      <span className={styles.kpiLabel}>{card.label}<span aria-hidden="true">↗</span></span>
      <strong className={styles.kpiValue}>{card.value}</strong>
      <span className={styles.detail}>{card.detail}</span>
      {card.change !== null && <span className={styles.comparison}>{comparison(card.change, cadence)}</span>}
    </Link>)}
  </section>;
}
