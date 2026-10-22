'use client';

/**
 * @file PipelineAllocationCard.tsx
 * @description Pipeline Stage Allocation card for Executive Overview benchmarked against MedTrackr Spending Overview.
 *              Displays headline active valuation with trend badge, multi-segment horizontal progress bar
 *              (Discovery Sky Blue #74c0fc, Proposal Lavender #b197fc, Negotiation Amber #ffd43b,
 *              Review Emerald #69db7c, Won Marca Orange #ff6100), and a 2-column key-value breakdown.
 * @module admin/components/Dashboard/PipelineAllocationCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { PipelineStageAllocationItem } from './types';
import styles from './PipelineAllocationCard.module.scss';

export interface StageAllocationItem {
  id: string;
  name: string;
  color: string;
  dealCount: number;
  amount: number;       // In integer Paise or Rupees
  formattedAmount: string;
  percentage: number;   // e.g. 24.0
}

export interface PipelineAllocationCardProps {
  /** Optional headline valuation in Rupees (defaults to ₹68,40,000) */
  totalValuation?: number;
  /** Total pipeline value alias matching domain contract */
  totalPipelineValue?: number;
  /** MoM delta percentage */
  momDeltaPercentage?: number;
  /** Custom stage allocation breakdown supporting both domain models */
  stages?: (StageAllocationItem | PipelineStageAllocationItem)[];
}

/**
 * Default stage allocation data calibrated to authentic boutique agency pipeline
 * totaling ₹68,40,000 across active operational milestones.
 */
const DEFAULT_STAGES: StageAllocationItem[] = [
  {
    id: 'stage-discovery',
    name: 'Discovery',
    color: '#74c0fc', // Sky Blue
    dealCount: 4,
    amount: 1420000,
    formattedAmount: '₹14,20,000',
    percentage: 20.8,
  },
  {
    id: 'stage-proposal',
    name: 'Proposal Sent',
    color: '#b197fc', // Lavender
    dealCount: 5,
    amount: 2250000,
    formattedAmount: '₹22,50,000',
    percentage: 32.9,
  },
  {
    id: 'stage-negotiation',
    name: 'Negotiation',
    color: '#ffd43b', // Amber
    dealCount: 3,
    amount: 1680000,
    formattedAmount: '₹16,80,000',
    percentage: 24.6,
  },
  {
    id: 'stage-review',
    name: 'Contract Review',
    color: '#69db7c', // Mint Emerald
    dealCount: 2,
    amount: 940000,
    formattedAmount: '₹9,40,000',
    percentage: 13.7,
  },
  {
    id: 'stage-won',
    name: 'Closed Won',
    color: '#ff6100', // Signature Marca Orange
    dealCount: 2,
    amount: 550000,
    formattedAmount: '₹5,50,000',
    percentage: 8.0,
  },
];

function formatRupees(amount: number): string {
  if (!amount || amount <= 0) return '₹0';
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export const PipelineAllocationCard: React.FC<PipelineAllocationCardProps> = ({
  totalValuation,
  totalPipelineValue,
  momDeltaPercentage = 12.4,
  stages = DEFAULT_STAGES,
}) => {
  const activeTotal = totalPipelineValue ?? totalValuation ?? 6840000;
  const formattedHeadline = formatRupees(activeTotal);

  // Normalize incoming stages regardless of whether they conform to StageAllocationItem or PipelineStageAllocationItem
  const normalizedStages: StageAllocationItem[] = (stages && stages.length > 0 ? stages : DEFAULT_STAGES).map((st) => {
    const isDomainModel = 'stageId' in st;
    const id = isDomainModel ? st.stageId : st.id;
    const name = isDomainModel ? st.stageName : st.name;
    const color = isDomainModel ? st.colorCode : st.color;
    const amount = isDomainModel ? st.totalValue : st.amount;
    const percentage = isDomainModel ? st.percentageOfPipeline : st.percentage;
    const formattedAmount = isDomainModel ? formatRupees(st.totalValue) : st.formattedAmount;
    return {
      id,
      name,
      color,
      dealCount: st.dealCount,
      amount,
      formattedAmount,
      percentage,
    };
  });

  return (
    <div className={styles.cardContainer} aria-label="Pipeline Stage Allocation Overview">
      {/* Header */}
      <div className={styles.cardHeader}>
        <h2 className={styles.title}>Pipeline Stage Allocation</h2>
        <p className={styles.subtitle}>Distribution across active conversion milestones</p>
      </div>

      {/* Headline Valuation */}
      <div className={styles.headlineBlock}>
        <span className={styles.headlineValuation}>{formattedHeadline}</span>
        <div className={styles.trendBadge} aria-label={`${momDeltaPercentage.toFixed(1)}% increase Month over Month`}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="18 15 12 9 6 15" />
          </svg>
          <span>+{momDeltaPercentage.toFixed(1)}% MoM</span>
        </div>
      </div>

      {/* Multi-Segment Horizontal Progress Bar */}
      <div
        className={styles.progressBarWrapper}
        role="progressbar"
        aria-label="Pipeline distribution by stage"
      >
        {normalizedStages.map((stage) => (
          <div
            key={stage.id}
            className={styles.barSegment}
            style={{
              width: `${stage.percentage}%`,
              backgroundColor: stage.color,
            }}
            title={`${stage.name}: ${stage.percentage}% (${stage.formattedAmount})`}
          />
        ))}
      </div>

      {/* 2-Column Key-Value Breakdown */}
      <div className={styles.breakdownGrid} role="list" aria-label="Pipeline stages detail list">
        {normalizedStages.map((stage) => (
          <div key={stage.id} className={styles.stageRow} role="listitem">
            <div className={styles.stageInfoLeft}>
              <span
                className={styles.stageDot}
                style={{ backgroundColor: stage.color }}
                aria-hidden="true"
              />
              <div className={styles.stageTitleCluster}>
                <span className={styles.stageName}>{stage.name}</span>
                <span className={styles.dealCountBadge}>
                  {stage.dealCount} deals
                </span>
              </div>
            </div>

            <div className={styles.stageFiguresRight}>
              <span className={styles.stageAmount}>{stage.formattedAmount}</span>
              <span className={styles.stageShare}>{stage.percentage.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
