'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AnalyticsTimeframeSlug } from '@/app/lib/analytics-schemas';
import {
  AnalyticsMasthead,
  type AnalyticsMastheadMetrics,
} from './components/AnalyticsMasthead/AnalyticsMasthead';
import {
  FunnelVisualizer,
  type FunnelStageItem,
} from './components/FunnelVisualizer/FunnelVisualizer';
import {
  RevenueSpline,
  type RevenueSplinePoint,
} from './components/RevenueSpline/RevenueSpline';
import {
  PracticeMatrix,
  type PracticeCategoryItem,
} from './components/PracticeMatrix/PracticeMatrix';
import {
  StageDwellMatrix,
  type StageDwellRow,
} from './components/StageDwellMatrix/StageDwellMatrix';
import styles from './analytics.module.scss';

export type {
  AnalyticsMastheadMetrics,
  FunnelStageItem,
  RevenueSplinePoint,
  PracticeCategoryItem,
  StageDwellRow,
};

export interface AnalyticsWorkspaceClientProps {
  initialTimeframe: AnalyticsTimeframeSlug;
  periodLabel: string;
  mastheadMetrics: AnalyticsMastheadMetrics;
  funnelStages: FunnelStageItem[];
  totalIntake: number;
  revenueSplinePoints: RevenueSplinePoint[];
  totalConvertedRevenue: number;
  totalInboundPipeline: number;
  practiceCategories: PracticeCategoryItem[];
  stageDwellRows: StageDwellRow[];
}

export const AnalyticsWorkspaceClient: React.FC<AnalyticsWorkspaceClientProps> = ({
  initialTimeframe,
  periodLabel,
  mastheadMetrics,
  funnelStages,
  totalIntake,
  revenueSplinePoints,
  totalConvertedRevenue,
  totalInboundPipeline,
  practiceCategories,
  stageDwellRows,
}) => {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframeSlug>(initialTimeframe);
  const [isPending, startTransition] = useTransition();

  const handleTimeframeChange = (newTf: AnalyticsTimeframeSlug) => {
    setTimeframe(newTf);
    startTransition(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('timeframe', newTf);
      router.push(url.pathname + url.search);
    });
  };

  return (
    <div className={`${styles.workspaceContainer} ${isPending ? styles.isPending : ''}`}>
      {/* Tier 1: Executive Masthead & Timeframe Controller */}
      <AnalyticsMasthead
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        metrics={mastheadMetrics}
        periodLabel={periodLabel}
      />

      {/* Tier 2: Stepped Commercial Funnel & Stage Drop-off Visualizer */}
      <FunnelVisualizer stages={funnelStages} totalIntake={totalIntake} />

      {/* Tier 3: Revenue Realization Spline & Practice Allocation Breakdown (68% / 32% Layout) */}
      <div className={styles.middleTierGrid}>
        <div className={styles.splineCol}>
          <RevenueSpline
            points={revenueSplinePoints}
            totalConverted={totalConvertedRevenue}
            totalInbound={totalInboundPipeline}
          />
        </div>
        <div className={styles.practiceCol}>
          <PracticeMatrix
            categories={practiceCategories}
            totalPipelineValue={mastheadMetrics.totalPipelineValue}
          />
        </div>
      </div>

      {/* Tier 4: Stage Dwell Time & Velocity Bottleneck Matrix */}
      <StageDwellMatrix rows={stageDwellRows} />
    </div>
  );
};
