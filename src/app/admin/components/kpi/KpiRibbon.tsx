'use client';

/**
 * @file KpiRibbon.tsx
 * @description Master Executive KPI Ribbon container for the Marca Ubi CRM.
 *              Executes reactive filter synchronization against Next.js useSearchParams,
 *              manages AbortController request cancellation for race condition prevention,
 *              powers the dual-currency toggle (INR ₹ / USD $), and renders the 5 canonical
 *              Stripe Scorecard cards with zero layout shift.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PipelineRpcMetrics, KpiApiResponseEnvelope } from '@/types/crm';
import { KpiCard } from './KpiCard';
import { KpiSkeleton } from './KpiSkeleton';
import {
  extractKpiMetrics,
  formatKpiCurrency,
  formatFullCurrency,
  formatSyncTimestamp,
} from './kpiFormatters';
import styles from './KpiRibbon.module.scss';

export interface KpiRibbonProps {
  initialData?: PipelineRpcMetrics | null;
  syncWithUrlParams?: boolean;
  defaultCurrency?: 'INR' | 'USD';
  className?: string;
}

/**
 * Internal reactive component wired to Next.js URLSearchParams.
 */
function KpiRibbonContent({
  initialData,
  syncWithUrlParams = false,
  defaultCurrency = 'INR',
  className = '',
}: KpiRibbonProps): React.ReactElement {
  const searchParams = useSearchParams();

  // Internal reactive state
  const [data, setData] = useState<PipelineRpcMetrics | null>(initialData ?? null);
  const [currency, setCurrency] = useState<'INR' | 'USD'>(defaultCurrency);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => (initialData ? new Date() : null));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active in-flight request tracker for race condition cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFirstMountRef = useRef<boolean>(true);

  /**
   * Dispatches an asynchronous fetch to the KPI aggregation gateway.
   * Cancels prior in-flight requests via AbortController to prevent race condition overrides.
   */
  const fetchMetrics = useCallback(
    async (paramsToFetch?: URLSearchParams | null): Promise<void> => {
      // Abort any pending network requests before initiating a new query
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsRefreshing(true);
      setErrorMessage(null);

      try {
        const queryParams = new URLSearchParams();

        if (paramsToFetch) {
          // Forward recognized filter keys
          const allowedKeys = [
            'start_date',
            'end_date',
            'source_id',
            'assignee_id',
            'target_user_id',
            'assigned_to',
            'stage',
            'bucket',
          ];

          for (const key of allowedKeys) {
            const val = paramsToFetch.get(key);
            if (val && val.trim().length > 0) {
              if (key === 'assigned_to') {
                queryParams.set('assignee_id', val.trim());
              } else {
                queryParams.set(key, val.trim());
              }
            }
          }
        }

        const queryString = queryParams.toString();
        const requestUrl = queryString
          ? `/api/sales-funnel/kpis?${queryString}`
          : '/api/sales-funnel/kpis';

        const response = await fetch(requestUrl, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Analytics gateway error (HTTP ${response.status})`);
        }

        const envelope: KpiApiResponseEnvelope = await response.json();

        if (envelope.success && envelope.data) {
          setData(envelope.data);
          setLastUpdated(new Date());
        } else {
          throw new Error(envelope.error || 'Failed to aggregate executive pipeline metrics.');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Intentionally aborted due to rapid subsequent filter selection
          return;
        }
        console.error('[KPI_RIBBON_ERROR] Metric recalculation failed:', err);
        setErrorMessage(
          err instanceof Error ? err.message : 'Pipeline recalculation failed.'
        );
      } finally {
        if (abortControllerRef.current === controller) {
          setIsRefreshing(false);
          abortControllerRef.current = null;
        }
      }
    },
    []
  );

  // Synchronize on URL search parameter transitions
  useEffect(() => {
    if (!syncWithUrlParams) {
      return;
    }

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      // If initialData was already provided and no URL params exist, skip redundant first fetch
      if (initialData && (!searchParams || Array.from(searchParams.keys()).length === 0)) {
        return;
      }
    }

    fetchMetrics(searchParams);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [syncWithUrlParams, searchParams, fetchMetrics, initialData]);

  // Handle manual trigger refresh
  const handleManualRefresh = (): void => {
    fetchMetrics(syncWithUrlParams ? searchParams : null);
  };

  // Extract strongly-typed normalized metric attributes
  const metrics = extractKpiMetrics(data);

  // Compute active filter label if filters are applied
  const hasActiveFilters = Boolean(
    searchParams &&
      (searchParams.get('start_date') ||
        searchParams.get('end_date') ||
        searchParams.get('source_id') ||
        searchParams.get('assignee_id') ||
        searchParams.get('assigned_to') ||
        searchParams.get('stage') ||
        searchParams.get('bucket'))
  );

  return (
    <section
      className={`${styles.ribbonContainer} ${className}`}
      aria-label="Executive Commercial Performance Ribbon"
    >
      {/* Top Specular Toolbar & Interactive Controls */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarMeta}>
          <div className={styles.engineEyebrow}>
            <span className={styles.liveDot} />
            <span>Executive Pipeline Pulse</span>
          </div>

          <span className={styles.lastUpdatedLabel}>
            {formatSyncTimestamp(lastUpdated)}
          </span>

          {hasActiveFilters && (
            <span className={styles.filterBadge}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filters Active</span>
            </span>
          )}

          {errorMessage && (
            <span className={styles.urgentAlert} title={errorMessage}>
              ⚠️ Sync Error
            </span>
          )}
        </div>

        <div className={styles.toolbarActions}>
          {/* Dual-Currency Segmented Toggle */}
          <div
            className={styles.currencyToggle}
            role="radiogroup"
            aria-label="Select KPI currency presentation"
          >
            <button
              type="button"
              className={`${styles.currencyBtn} ${currency === 'INR' ? styles.currencyActive : ''}`}
              onClick={() => setCurrency('INR')}
              aria-checked={currency === 'INR'}
              role="radio"
              title="Display values in Indian Rupees (₹ Lakhs & Crores)"
            >
              ₹ INR
            </button>
            <button
              type="button"
              className={`${styles.currencyBtn} ${currency === 'USD' ? styles.currencyActive : ''}`}
              onClick={() => setCurrency('USD')}
              aria-checked={currency === 'USD'}
              role="radio"
              title="Display values in US Dollars ($ pegged at ₹83.50)"
            >
              $ USD
            </button>
          </div>

          {/* Manual Refresh Trigger */}
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            aria-label="Refresh pipeline metrics"
            title="Recalculate real-time pipeline aggregation"
          >
            <span
              className={`${styles.refreshIcon} ${isRefreshing ? styles.refreshSpin : ''}`}
              aria-hidden="true"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </span>
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 5 Canonical Stripe Scorecards Grid */}
      <div className={styles.kpiGrid}>
        {/* Card 1: Total Leads */}
        <KpiCard
          id="total-leads"
          label="Total Leads"
          value={metrics.totalLeads.toLocaleString()}
          subtext={
            <span className={styles.neutralSubtext}>
              {metrics.activeLeads} Active in Pipeline
            </span>
          }
          href="/admin/leads"
          titleTooltip={`Total Leads: ${metrics.totalLeads} inquiries recorded`}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          }
        />

        {/* Card 2: Potential Value */}
        <KpiCard
          id="potential-value"
          label="Potential Value"
          value={formatKpiCurrency(metrics.potentialValue, currency)}
          subtext={
            <span className={styles.neutralSubtext}>
              {metrics.potentialLeads} Active Negotiations
            </span>
          }
          secondaryBadge={
            metrics.stageWeightedValue > 0 ? (
              <span
                className={styles.weightedValuationBadge}
                title={`Stage-Weighted Valuation: ${formatFullCurrency(metrics.stageWeightedValue, currency)} (Win-rate weighted forecast)`}
              >
                W: {formatKpiCurrency(metrics.stageWeightedValue, currency)}
              </span>
            ) : undefined
          }
          href="/admin/leads?bucket=potential"
          titleTooltip={`Unweighted Potential Value: ${formatFullCurrency(metrics.potentialValue, currency)}`}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        {/* Card 3: Converted Revenue */}
        <KpiCard
          id="converted-revenue"
          label="Converted Revenue"
          value={formatKpiCurrency(metrics.convertedRevenue, currency)}
          subtext={
            <span className={styles.positiveTrend}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{metrics.convertedLeads} Closed Won</span>
            </span>
          }
          href="/admin/leads?bucket=converted"
          titleTooltip={`Cumulative Converted Revenue: ${formatFullCurrency(metrics.convertedRevenue, currency)}`}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          }
        />

        {/* Card 4: Conversion Rate */}
        <KpiCard
          id="conversion-rate"
          label="Conversion Rate"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          subtext={
            <span className={styles.neutralSubtext}>
              Studio Benchmark 12.0%
            </span>
          }
          href="/admin/leads?bucket=converted"
          titleTooltip={`Studio Conversion Rate: ${metrics.conversionRate.toFixed(1)}% (Excluding invalid submissions)`}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="5" x2="5" y2="19" />
              <circle cx="6.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
            </svg>
          }
        />

        {/* Card 5: Overdue Follow-ups */}
        <KpiCard
          id="overdue-followups"
          label="Overdue Follow-ups"
          value={metrics.overdueCount}
          subtext={
            metrics.overdueCount > 0 ? (
              <span className={styles.urgentAlert}>
                <span className={styles.radarDot} />
                <span>Action Required</span>
              </span>
            ) : (
              <span className={styles.positiveTrend}>
                <span>All touchpoints current</span>
              </span>
            )
          }
          isAlert={metrics.overdueCount > 0}
          href={metrics.overdueCount > 0 ? '/admin/leads?bucket=open' : '/admin/leads'}
          titleTooltip={
            metrics.overdueCount > 0
              ? `${metrics.overdueCount} overdue touchpoints require immediate attention`
              : 'Zero overdue follow-ups across the agency pipeline'
          }
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>
    </section>
  );
}

/**
 * Master Client Component container wrapping reactive URL parameters
 * inside a React 19 Suspense boundary to prevent App Router de-optimization.
 *
 * @param {KpiRibbonProps} props Container properties.
 * @returns {React.ReactElement} Suspended or hydrated Executive KPI Ribbon.
 */
export function KpiRibbon(props: KpiRibbonProps): React.ReactElement {
  return (
    <Suspense fallback={<KpiSkeleton className={props.className} />}>
      <KpiRibbonContent {...props} />
    </Suspense>
  );
}

export default KpiRibbon;
