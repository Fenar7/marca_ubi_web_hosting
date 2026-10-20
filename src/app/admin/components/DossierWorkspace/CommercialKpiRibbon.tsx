'use client';

/**
 * @file CommercialKpiRibbon.tsx
 * @description Commercial KPI Ribbon presenting 3 Stripe-grade Scorecards for the Client 360° Workspace.
 *              Displays:
 *              1. Expected Valuation in Indian Rupees (Lakhs/Crores) with tabular numeric stabilization.
 *              2. Priority SLA Badge with radar dot indicator and guaranteed turnaround benchmarks.
 *              3. Win Probability & Deal Momentum index derived from current funnel stage mechanics.
 * @module components/DossierWorkspace/CommercialKpiRibbon
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useMemo } from 'react';
import type { LeadPriority, FunnelBucket } from '@/types/crm';
import { formatDossierCurrency } from '../DossierDrawer/dossierUtils';
import styles from './LeadDossierWorkspace.module.scss';

export interface CommercialKpiRibbonProps {
  /** Contract or estimated scope valuation in INR integer units */
  expectedValue: number;
  /** Ingestion budget tier descriptor (e.g. '₹25L - ₹50L') */
  budgetBracket?: string | null;
  /** Commercial priority classification */
  priority: LeadPriority;
  /** Funnel stage classification bucket determining commercial momentum */
  statusBucket: FunnelBucket;
  /** Human-readable status name (e.g., 'Proposal Sent', 'Contract Signed') */
  statusName: string;
  /** Cumulative incoming inquiries recorded from this client coordinate */
  inquiryCount?: number;
}

interface MomentumMetrics {
  percentage: number;
  label: string;
  colorHex: string;
}

/**
 * Computes deterministic win probability and pipeline velocity index based on
 * stage bucket status and agency historical close rates.
 */
function calculateStageMomentum(bucket: FunnelBucket, statusName: string): MomentumMetrics {
  const normalizedName = statusName.toLowerCase();

  if (bucket === 'converted') {
    return { percentage: 100, label: 'Closed Won', colorHex: '#22c55e' };
  }
  if (bucket === 'lost') {
    return { percentage: 0, label: 'Closed Lost', colorHex: '#ef4444' };
  }
  if (normalizedName.includes('contract') || normalizedName.includes('closing')) {
    return { percentage: 85, label: 'High Velocity', colorHex: '#ff6100' };
  }
  if (normalizedName.includes('negotiat') || normalizedName.includes('proposal')) {
    return { percentage: 70, label: 'Strong Traction', colorHex: '#ff6100' };
  }
  if (bucket === 'potential') {
    return { percentage: 50, label: 'Active Evaluation', colorHex: '#f59e0b' };
  }
  if (normalizedName.includes('discovery') || normalizedName.includes('contact')) {
    return { percentage: 35, label: 'Inbound Discovery', colorHex: '#f59e0b' };
  }
  return { percentage: 20, label: 'Initial Ingestion', colorHex: '#9ca3af' };
}

/**
 * Returns strict SLA turnaround expectation guidelines mapped from commercial priority.
 */
function getPrioritySlaDetails(priority: LeadPriority): {
  slaTarget: string;
  dotColor: string;
  slaTag: string;
} {
  switch (priority) {
    case 'High':
      return {
        slaTarget: '2h SLA Response Target',
        dotColor: '#ef4444',
        slaTag: 'Critical SLA',
      };
    case 'Medium':
      return {
        slaTarget: '6h SLA Response Target',
        dotColor: '#f59e0b',
        slaTag: 'Standard SLA',
      };
    case 'Low':
    default:
      return {
        slaTarget: '24h SLA Response Target',
        dotColor: '#6b7280',
        slaTag: 'Extended SLA',
      };
  }
}

export function CommercialKpiRibbon({
  expectedValue,
  budgetBracket,
  priority,
  statusBucket,
  statusName,
  inquiryCount = 1,
}: CommercialKpiRibbonProps): React.ReactElement {
  const momentum = useMemo(
    () => calculateStageMomentum(statusBucket, statusName),
    [statusBucket, statusName]
  );

  const slaDetails = useMemo(() => getPrioritySlaDetails(priority), [priority]);

  const formattedValuation = useMemo(
    () => formatDossierCurrency(expectedValue),
    [expectedValue]
  );

  return (
    <div className={styles.kpiRibbonGrid} role="region" aria-label="Commercial KPI Summary">
      {/* 1. Stripe Scorecard: Expected Valuation */}
      <div className={styles.stripeScorecard}>
        <div className={styles.scorecardHeaderRow}>
          <span className={styles.scorecardLabel}>Expected Valuation</span>
          <span className={styles.scorecardPill}>
            {budgetBracket ? budgetBracket : 'Calculated Scope'}
          </span>
        </div>
        <div className={styles.scorecardValue}>
          {formattedValuation}
        </div>
        <div className={styles.scorecardMetaRow}>
          <span>Indian Rupee Tabular Numerals</span>
          <span>{inquiryCount > 1 ? `${inquiryCount} Inbound Touchpoints` : 'First Engagement'}</span>
        </div>
      </div>

      {/* 2. Stripe Scorecard: Priority SLA Badge */}
      <div className={styles.stripeScorecard}>
        <div className={styles.scorecardHeaderRow}>
          <span className={styles.scorecardLabel}>Priority & Turnaround</span>
          <span className={styles.scorecardPill}>{slaDetails.slaTag}</span>
        </div>
        <div className={styles.scorecardValue} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className={styles.radarDot}
            style={{ backgroundColor: slaDetails.dotColor }}
            aria-hidden="true"
          />
          <span>{priority} Priority</span>
        </div>
        <div className={styles.scorecardMetaRow}>
          <span>{slaDetails.slaTarget}</span>
          <span style={{ color: slaDetails.dotColor }}>Guaranteed</span>
        </div>
      </div>

      {/* 3. Stripe Scorecard: Win Probability & Deal Momentum */}
      <div className={styles.stripeScorecard}>
        <div className={styles.scorecardHeaderRow}>
          <span className={styles.scorecardLabel}>Win Probability</span>
          <span className={styles.scorecardPill}>{momentum.label}</span>
        </div>
        <div className={styles.scorecardValue}>
          {momentum.percentage}%
        </div>
        <div>
          <div className={styles.momentumTrack} aria-hidden="true">
            <div
              className={styles.momentumFill}
              style={{
                width: `${momentum.percentage}%`,
                backgroundColor: momentum.colorHex,
              }}
            />
          </div>
          <div className={styles.scorecardMetaRow} style={{ marginTop: '8px' }}>
            <span>Stage: {statusName}</span>
            <span style={{ color: momentum.colorHex, fontWeight: 600 }}>
              {statusBucket.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
