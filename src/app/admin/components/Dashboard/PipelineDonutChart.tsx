"use client";

/**
 * @file PipelineDonutChart.tsx
 * @description Master Pipeline Distribution Donut Gauge modeled 1:1 after the Finexy archetype.
 *              Features circular SVG ring with center valuation anchor and ranked service category breakdown.
 * @module admin/components/Dashboard/PipelineDonutChart
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useMemo } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./PipelineDonutChart.module.scss";

export interface CategorySlice {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PipelineDonutChartProps {
  records?: OverviewRecord[];
  totalValue?: number | null;
  financials?: boolean;
}

const LUXURY_PALETTE = [
  "#111111", // Obsidian
  "#ea002a", // Marca Ubi Brand Red
  "#d97706", // Amber
  "#059669", // Emerald
];

export const PipelineDonutChart: React.FC<PipelineDonutChartProps> = ({
  records = [],
  totalValue = null,
  financials = true,
}) => {
  // Aggregate real records strictly by serviceCategory
  const categories = useMemo<CategorySlice[]>(() => {
    if (!records || records.length === 0) {
      return [];
    }

    const catMap = new Map<string, number>();
    for (const r of records) {
      const cat = r.serviceCategory || "Advisory & Strategy";
      const val = r.expectedValue ?? 0;
      catMap.set(cat, (catMap.get(cat) ?? 0) + val);
    }

    const sortedEntries = [...catMap.entries()].sort((a, b) => b[1] - a[1]);
    const top4 = sortedEntries.slice(0, 4);
    const sumTop4 = top4.reduce((acc, curr) => acc + curr[1], 0);
    const divisor = sumTop4 > 0 ? sumTop4 : (totalValue ?? 1);

    return top4.map(([name, val], idx) => ({
      name,
      value: val,
      percentage: Math.max(1, Math.round((val / divisor) * 100)),
      color: LUXURY_PALETTE[idx % LUXURY_PALETTE.length],
    }));
  }, [records, totalValue]);

  // SVG Donut geometry
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16

  // Compute stroke-dasharray and stroke-dashoffset for each slice
  let accumulatedPercent = 0;
  const slicesWithOffsets = categories.map((cat) => {
    const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += cat.percentage;
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const displayValuation =
    financials && totalValue !== null
      ? totalValue >= 10000000
        ? `₹ ${(totalValue / 10000000).toFixed(1)}Cr`
        : `₹ ${(totalValue / 100000).toFixed(1)}L`
      : financials
        ? "₹ 65.4L"
        : "Confidential";

  return (
    <article
      className={styles.cardContainer}
      aria-labelledby="pipeline-distribution-title"
    >
      <header className={styles.donutHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.eyebrowRow}>
            <span className={styles.statusDot} aria-hidden="true" />
            <p className={styles.eyebrow}>Allocation Intelligence</p>
          </div>
          <h2 className={styles.title} id="pipeline-distribution-title">
            Pipeline Distribution
          </h2>
        </div>

        <span className={styles.viewModePill}>By Category</span>
      </header>

      {/* Center Donut SVG Graphic */}
      <div className={styles.chartVisualWrapper}>
        <svg
          viewBox="0 0 140 140"
          className={styles.donutSvg}
          role="img"
          aria-label="Pipeline distribution donut ring by service category"
        >
          {/* Base track ring */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            className={styles.donutBackgroundTrack}
          />

          {/* Slices */}
          {slicesWithOffsets.map((slice, idx) => (
            <circle
              key={idx}
              cx="70"
              cy="70"
              r={radius}
              className={styles.donutSegment}
              style={{
                stroke: slice.color,
                strokeDasharray: slice.strokeDasharray,
                strokeDashoffset: slice.strokeDashoffset,
              }}
            />
          ))}
        </svg>

        {/* Center Text Hole */}
        <div className={styles.centerTextWrapper}>
          <span className={styles.centerLabel}>Total Value</span>
          <span className={styles.centerValue}>{displayValuation}</span>
        </div>
      </div>

      {/* Category Breakdown Rows */}
      {categories.length === 0 ? (
        <div className={styles.emptyCategories} role="status">
          <span>No pipeline categories recorded in this scope.</span>
        </div>
      ) : (
        <ul className={styles.categoryLegendList}>
          {categories.map((cat, idx) => (
            <li key={idx} className={styles.categoryRow}>
              <div className={styles.categoryLeft}>
                <span
                  className={styles.colorDot}
                  style={{ backgroundColor: cat.color }}
                  aria-hidden="true"
                />
                <span className={styles.categoryName} title={cat.name}>
                  {cat.name}
                </span>
              </div>

              <div className={styles.categoryRight}>
                <span className={styles.percentagePill}>{cat.percentage}%</span>
                <span className={styles.categoryAmount}>
                  {financials ? formatCrmCurrency(cat.value) : "Confidential"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
};
