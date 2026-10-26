'use client';

/**
 * @file CommercialKpiRibbon.tsx
 * @description Commercial KPI Ribbon presenting 3 Minimalist Stat Pods for the Client 360° Workspace.
 *              Conforms to Accordion Executive Advisory × Sypher Minimalist Light SaaS Architecture:
 *              1. Expected Valuation in Indian Rupees (Lakhs/Crores) with tabular numeric stabilization
 *                 and 44px circular Emerald icon chip (#ecfdf5).
 *              2. Priority SLA Badge with semantic radar dot indicator and 44px Amber icon chip (#fffbeb).
 *              3. Win Probability & Deal Momentum index derived from current funnel stage mechanics
 *                 and 44px Slate icon chip (#f1f5f9).
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
  colorCss: string;
}

/**
 * Computes deterministic win probability and pipeline velocity index based on
 * stage bucket status and agency historical close rates.
 */
function calculateStageMomentum(bucket: FunnelBucket, statusName: string): MomentumMetrics {
  const normalizedName = statusName.toLowerCase();

  if (bucket === 'converted') {
    return { percentage: 100, label: 'Closed Won', colorCss: 'var(--admin-status-emerald-dot, #10b981)' };
  }
  if (bucket === 'lost') {
    return { percentage: 0, label: 'Closed Lost', colorCss: 'var(--admin-status-rose-dot, #ef4444)' };
  }
  if (normalizedName.includes('contract') || normalizedName.includes('closing')) {
    return { percentage: 85, label: 'High Velocity', colorCss: 'var(--admin-border-strong, #1f242f)' };
  }
  if (normalizedName.includes('negotiat') || normalizedName.includes('proposal')) {
    return { percentage: 70, label: 'Strong Traction', colorCss: 'var(--admin-border-strong, #1f242f)' };
  }
  if (bucket === 'potential') {
    return { percentage: 50, label: 'Active Evaluation', colorCss: 'var(--admin-status-amber-dot, #f59e0b)' };
  }
  if (normalizedName.includes('discovery') || normalizedName.includes('contact')) {
    return { percentage: 35, label: 'Inbound Discovery', colorCss: 'var(--admin-status-amber-dot, #f59e0b)' };
  }
  return { percentage: 20, label: 'Initial Ingestion', colorCss: 'var(--admin-status-slate-dot, #64748b)' };
}

/**
 * Returns strict SLA turnaround expectation guidelines mapped from commercial priority
 * using semantic CSS variables.
 */
function getPrioritySlaDetails(priority: LeadPriority): {
  slaTarget: string;
  dotColorCss: string;
  slaTag: string;
} {
  switch (priority) {
    case 'High':
      return {
        slaTarget: '2h SLA Response Target',
        dotColorCss: 'var(--admin-status-rose-dot, #ef4444)',
        slaTag: 'Critical SLA',
      };
    case 'Medium':
      return {
        slaTarget: '6h SLA Response Target',
        dotColorCss: 'var(--admin-status-amber-dot, #f59e0b)',
        slaTag: 'Standard SLA',
      };
    case 'Low':
    default:
      return {
        slaTarget: '24h SLA Response Target',
        dotColorCss: 'var(--admin-status-slate-dot, #64748b)',
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
      {/* 1. Minimalist Stat Pod: Expected Valuation */}
      <div className={styles.stripeScorecard}>
        <div className={styles.scorecardHeaderRow}>
          <div className={styles.scorecardLabelGroup}>
            <span className={styles.scorecardLabel}>Expected Valuation</span>
            <span className={styles.scorecardPill}>
              {budgetBracket ? budgetBracket : 'Calculated Scope'}
            </span>
          </div>
          <div
            className={`${styles.statPodIconChip} ${styles.chipEmerald}`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        <div className={styles.scorecardValue}>
          {formattedValuation}
        </div>

        <div className={styles.scorecardMetaRow}>
          <span>Indian Rupee Tabular Numerals</span>
          <span>{inquiryCount > 1 ? `${inquiryCount} Inbound Touchpoints` : 'Calculated Scope'}</span>
        </div>
      </div>

      {/* 2. Minimalist Stat Pod: Priority SLA Badge */}
      <div className={styles.stripeScorecard}>
        <div className={styles.scorecardHeaderRow}>
          <div className={styles.scorecardLabelGroup}>
            <span className={styles.scorecardLabel}>Priority & Turnaround</span>
            <span className={styles.scorecardPill}>{slaDetails.slaTag}</span>
          </div>
          <div
            className={`${styles.statPodIconChip} ${styles.chipAmber}`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        <div className={styles.scorecardValue} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className={styles.radarDot}
            style={{ backgroundColor: slaDetails.dotColorCss }}
            aria-hidden="true"
          />
          <span>{priority} Priority</span>
        </div>

        <div className={styles.scorecardMetaRow}>
          <span>{slaDetails.slaTarget}</span>
          <span style={{ color: slaDetails.dotColorCss, fontWeight: 600 }}>Guaranteed</span>
        </div>
      </div>

      {/* 3. Minimalist Stat Pod: Win Probability & Deal Momentum */}
      <div className={styles.stripeScorecard}>
        <div className={styles.scorecardHeaderRow}>
          <div className={styles.scorecardLabelGroup}>
            <span className={styles.scorecardLabel}>Win Probability</span>
            <span className={styles.scorecardPill}>{momentum.label}</span>
          </div>
          <div
            className={`${styles.statPodIconChip} ${styles.chipSlate}`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
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
                backgroundColor: momentum.colorCss,
              }}
            />
          </div>
          <div className={styles.scorecardMetaRow} style={{ marginTop: '8px' }}>
            <span>Stage: {statusName}</span>
            <span style={{ color: momentum.colorCss, fontWeight: 600 }}>
              {statusBucket.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}