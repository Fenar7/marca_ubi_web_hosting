'use client';

/**
 * @file ExecutiveKpiGrid.tsx
 * @description Floating Luxury KPI Scorecards for the Marca Ubi Commercial Desk.
 *              Transforms flat bordered table into 4 independent elevated squircle cards
 *              featuring tabular currency formatting, trend pills, and micro-breakdowns.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

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

function comparison(value: number | null, cadence: string): { text: string; positive: boolean } | null {
  if (value === null || !Number.isFinite(value)) return null;
  const isPos = value >= 0;
  const prefix = isPos ? '↑ +' : '↓ ';
  return {
    text: `${prefix}${value.toFixed(1)}% vs prior ${cadence}`,
    positive: isPos,
  };
}

/** Groups current-state pipeline values separately from period-specific conversion outcomes. */
export function ExecutiveKpiGrid({ kpis, cadenceLabel, metricStatus }: ExecutiveKpiGridProps): React.ReactElement {
  const compData = metricStatus.revenue === 'ready' ? comparison(kpis.revenueDeltaPercentage, cadenceLabel) : null;

  const cards = [
    {
      id: 'pipeline',
      index: '01',
      label: 'Active pipeline',
      value: metricStatus.pipeline === 'ready' && kpis.totalPipelineValue !== null ? formatCrmCurrency(kpis.totalPipelineValue) : 'Unavailable',
      detail: metricStatus.pipeline === 'unavailable' ? 'Pipeline records could not be loaded' : kpis.weightedPipelineValue === null ? 'Weighted value unavailable' : `Weighted ${formatCrmCurrency(kpis.weightedPipelineValue)}`,
      badge: { text: 'In Motion', variant: 'slate' as const },
      href: '/admin/deals',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      ),
    },
    {
      id: 'revenue',
      index: '02',
      label: 'Converted contract value',
      value: metricStatus.revenue === 'ready' && kpis.convertedRevenueValue !== null ? formatCrmCurrency(kpis.convertedRevenueValue) : 'Unavailable',
      detail: metricStatus.revenue === 'unavailable' ? 'Conversion records could not be loaded' : `${(kpis.convertedDealsCount ?? 0).toLocaleString('en-IN')} conversions in ${cadenceLabel}`,
      trend: compData,
      href: '/admin/analytics',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      id: 'deals',
      index: '03',
      label: 'Active deals',
      value: metricStatus.pipeline === 'ready' && kpis.activeDealsCount !== null ? kpis.activeDealsCount.toLocaleString('en-IN') : 'Unavailable',
      detail: metricStatus.pipeline === 'unavailable' ? 'Pipeline records could not be loaded' : 'Open and potential records now',
      badge: { text: '39 Active', variant: 'amber' as const },
      href: '/admin/deals',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'cohort',
      index: '04',
      label: 'Lead conversion rate',
      value: metricStatus.cohort === 'ready' && kpis.conversionWinRate !== null ? `${kpis.conversionWinRate.toFixed(1)}%` : 'Unavailable',
      detail: metricStatus.cohort === 'unavailable'
        ? 'Lead cohort records could not be loaded'
        : kpis.conversionEligibleCount === 0
          ? `No eligible leads created in ${cadenceLabel}`
          : `${(kpis.conversionWonCount ?? 0).toLocaleString('en-IN')} won of ${(kpis.conversionEligibleCount ?? 0).toLocaleString('en-IN')} eligible leads`,
      badge: { text: 'Target: 15%', variant: 'emerald' as const },
      href: '/admin/analytics',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
    },
  ];

  return (
    <section className={styles.gridContainer} aria-label="Commercial performance snapshot">
      {cards.map((card) => (
        <Link href={card.href} key={card.id} className={styles.kpiCard}>
          <div className={styles.cardHeader}>
            <div className={styles.labelGroup}>
              <span className={styles.kpiIndex}>{card.index}</span>
              <span className={styles.kpiLabel}>{card.label}</span>
            </div>
            <div className={styles.iconBadge} aria-hidden="true">
              {card.icon}
            </div>
          </div>

          <strong className={styles.kpiValue}>{card.value}</strong>

          <div className={styles.cardFooter}>
            <span className={styles.detail}>{card.detail}</span>
            {card.trend && (
              <span
                className={`${styles.trendPill} ${
                  card.trend.positive ? styles.trendPositive : styles.trendNegative
                }`}
              >
                {card.trend.text}
              </span>
            )}
            {card.badge && (
              <span
                className={`${styles.statusBadge} ${
                  card.badge.variant === 'emerald'
                    ? styles.badgeEmerald
                    : card.badge.variant === 'amber'
                    ? styles.badgeAmber
                    : styles.badgeSlate
                }`}
              >
                {card.badge.text}
              </span>
            )}
          </div>
        </Link>
      ))}
    </section>
  );
}
