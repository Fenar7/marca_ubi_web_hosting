'use client';

import React from 'react';
import Link from 'next/link';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import type { StageAllocationItem } from './types';
import styles from './PipelineAllocationCard.module.scss';

export type { StageAllocationItem } from './types';

export interface PipelineAllocationCardProps {
  totalValuation: number | null;
  stages: StageAllocationItem[];
  dataStatus?: 'ready' | 'unavailable';
}

export function PipelineAllocationCard({ totalValuation, stages, dataStatus = 'ready' }: PipelineAllocationCardProps): React.ReactElement {
  const totalDeals = stages.reduce((total, stage) => total + stage.dealCount, 0);

  return (
    <section className={styles.pipelineCard} aria-labelledby="pipeline-heading">
      <header className={styles.headerBlock}>
        <div className={styles.titleCluster}>
          <p className={styles.eyebrow}>How work advances</p>
          <h2 id="pipeline-heading" className={styles.title}>Pipeline by stage</h2>
          <p className={styles.subtitle}>Select a stage to open its active deals.</p>
        </div>
        <div className={styles.headlineCluster}>
          <span className={styles.valuationLabel}>Active pipeline</span>
          <strong className={styles.valuationBadge}>{dataStatus === 'ready' && totalValuation !== null ? formatCrmCurrency(totalValuation) : 'Unavailable'}</strong>
          {dataStatus === 'ready' && <span className={styles.dealCountMuted}>{totalDeals.toLocaleString('en-IN')} active deals</span>}
        </div>
      </header>

      {dataStatus === 'unavailable' ? (
        <p className={styles.emptyState} role="status">Pipeline stages could not be loaded. Other dashboard sections remain available.</p>
      ) : stages.length === 0 ? (
        <p className={styles.emptyState} role="status">No open or potential stages are configured.</p>
      ) : totalDeals === 0 ? (
        <p className={styles.emptyState} role="status">The pipeline has no active deals. New qualified work will appear here.</p>
      ) : (
        <>
          <div className={styles.segmentedBarTrack} role="img" aria-label="Pipeline value distribution by stage">
            {stages.map((stage) => stage.amount > 0 ? (
              <span key={stage.id} className={styles.segmentedBarSlice} style={{ flexGrow: stage.amount, backgroundColor: stage.color }} />
            ) : null)}
          </div>
          <ol className={styles.stageLedgerList}>
            {stages.map((stage, index) => (
              <li key={stage.id}>
                <Link href={`/admin/deals?stage=${encodeURIComponent(stage.id)}`} className={styles.stageLedgerRow}>
                  <span className={styles.stageIndex}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={styles.stageMark} style={{ backgroundColor: stage.color }} aria-hidden="true" />
                  <span className={styles.stageName}>{stage.name}</span>
                  <span className={styles.stageCount}>{stage.dealCount.toLocaleString('en-IN')} {stage.dealCount === 1 ? 'deal' : 'deals'}</span>
                  <span className={styles.stageShare}>
                    <span className={styles.microProgressTrack} aria-hidden="true"><span className={styles.microProgressFill} style={{ width: `${Math.min(100, Math.max(0, stage.percentage))}%`, backgroundColor: stage.color }} /></span>
                    {stage.percentage.toFixed(1)}%
                  </span>
                  <strong className={styles.stageValuation}>{formatCrmCurrency(stage.amount)}</strong>
                  <span className={styles.rowArrow} aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
