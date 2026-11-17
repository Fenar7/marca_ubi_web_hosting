"use client";

/**
 * @file PipelineDonutChart.tsx
 * @description Master Pipeline Breakdown Donut Component.
 *              Replaces legacy progress-bar layout with the high-precision Luxury Donut ("Cookie") Chart
 *              synthesized from Conyest, Finlo Flash, and Fundora archetypes.
 * @module admin/components/Dashboard/PipelineDonutChart
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from "react";
import type { OverviewRecord } from "./OverviewWorkspace";
import {
  LuxuryDonutCookieChart,
  type DonutCategorySlice,
} from "./LuxuryDonutCookieChart";

export type BreakdownViewMode = "category" | "stage" | "deal_size";
export type CategorySlice = DonutCategorySlice;

export interface PipelineDonutChartProps {
  categories?: { name: string; value: number; count?: number }[];
  records?: OverviewRecord[];
  totalValue?: number | null;
  financials?: boolean;
  initialMode?: BreakdownViewMode;
  onViewModeChange?: (mode: BreakdownViewMode) => void;
}

export const PipelineDonutChart: React.FC<PipelineDonutChartProps> = ({
  categories = [],
  records = [],
  totalValue = null,
  financials = true,
}) => {
  return (
    <LuxuryDonutCookieChart
      categories={categories}
      records={records}
      totalValue={totalValue}
      financials={financials}
    />
  );
};
