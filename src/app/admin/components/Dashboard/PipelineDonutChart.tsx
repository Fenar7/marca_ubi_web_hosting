"use client";

/**
 * @file PipelineDonutChart.tsx
 * @description Master Pipeline Distribution Donut Gauge modeled 1:1 after the Finexy archetype.
 *              Features an expanded 134px interior aperture, bidirectional slice highlighting,
 *              dynamic central telemetry HUD, and ranked category cardlets with horizontal micro-bars.
 * @module admin/components/Dashboard/PipelineDonutChart
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useMemo, useState } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./PipelineDonutChart.module.scss";

export interface CategorySlice {
  name: string;
  value: number;
  percentage: number;
  color: string;
  count?: number;
}

export interface PipelineDonutChartProps {
  categories?: { name: string; value: number; count?: number }[];
  records?: OverviewRecord[];
  totalValue?: number | null;
  financials?: boolean;
}

const LUXURY_PALETTE = [
  "#111111", // Obsidian Ink (Lead Category)
  "#ea002a", // Marca Ubi Signature Crimson
  "#3f3f46", // Charcoal Zinc (WCAG AA > 7:1)
  "#52525b", // Medium Zinc (WCAG AA > 5.8:1)
];

export const PipelineDonutChart: React.FC<PipelineDonutChartProps> = ({
  categories: rawCategories = [],
  records = [],
  totalValue = null,
  financials = true,
}) => {
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);

  // Aggregate categories across active pipeline scope
  const categories = useMemo<CategorySlice[]>(() => {
    if (rawCategories && rawCategories.length > 0) {
      const validTotal =
        totalValue && totalValue > 0
          ? totalValue
          : rawCategories.reduce((sum, c) => sum + c.value, 0);

      const top4 = rawCategories.slice(0, 4);
      return top4.map((c, idx) => ({
        name: c.name,
        value: c.value,
        count: c.count,
        percentage:
          validTotal > 0 ? Math.max(1, Math.round((c.value / validTotal) * 100)) : 0,
        color: LUXURY_PALETTE[idx % LUXURY_PALETTE.length],
      }));
    }

    if (records && records.length > 0) {
      const catMap = new Map<string, { value: number; count: number }>();
      for (const r of records) {
        const cat = r.serviceCategory || "Advisory & Strategy";
        const val = r.expectedValue ?? 0;
        const existing = catMap.get(cat) ?? { value: 0, count: 0 };
        catMap.set(cat, {
          value: existing.value + val,
          count: existing.count + 1,
        });
      }

      const sortedEntries = [...catMap.entries()].sort((a, b) => b[1].value - a[1].value);
      const top4 = sortedEntries.slice(0, 4);
      const sumTop4 = top4.reduce((acc, curr) => acc + curr[1].value, 0);
      const validTotal = totalValue && totalValue > 0 ? totalValue : sumTop4;

      return top4.map(([name, data], idx) => ({
        name,
        value: data.value,
        count: data.count,
        percentage:
          validTotal > 0 ? Math.max(1, Math.round((data.value / validTotal) * 100)) : 0,
        color: LUXURY_PALETTE[idx % LUXURY_PALETTE.length],
      }));
    }

    return [];
  }, [rawCategories, records, totalValue]);

  // Stately Finexy Donut Geometry: 200x200 viewBox, R=78, W=13, Aperture=142.5px
  const radius = 78;
  const circumference = 2 * Math.PI * radius; // ~490.09

  let accumulatedPercent = 0;
  const slicesWithOffsets = categories.map((cat) => {
    const rawDash = (cat.percentage / 100) * circumference;
    const gap = categories.length > 1 ? 2.5 : 0;
    const strokeDasharray = `${Math.max(1, rawDash - gap)} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += cat.percentage;
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const totalDealsCount = useMemo(() => {
    const summedCounts = categories.reduce((acc, c) => acc + (c.count ?? 0), 0);
    return summedCounts > 0 ? summedCounts : records.length;
  }, [categories, records]);

  const displayValuation =
    financials && totalValue !== null
      ? totalValue >= 10000000
        ? `₹ ${(totalValue / 10000000).toFixed(1)}Cr`
        : `₹ ${(totalValue / 100000).toFixed(1)}L`
      : financials
        ? "₹ 0"
        : "Confidential";

  const activeSlice =
    activeHoverIndex !== null && categories[activeHoverIndex]
      ? categories[activeHoverIndex]
      : null;

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
          <p className={styles.subtitle}>
            Active deal capital allocation by service line
          </p>
        </div>

        <span className={styles.viewModePill}>By Category</span>
      </header>

      {/* Center Donut SVG Graphic with expanded 142.5px interior aperture */}
      <div className={styles.chartVisualWrapper}>
        <svg
          viewBox="0 0 200 200"
          className={styles.donutSvg}
          role="img"
          aria-label="Pipeline distribution donut ring by service category"
        >
          {/* Base track ring */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            className={styles.donutBackgroundTrack}
          />

          {/* Interactive Slices with Smooth Stroke Expansion on Hover */}
          {slicesWithOffsets.map((slice, idx) => {
            const isHovered = activeHoverIndex === idx;
            const isDimmed = activeHoverIndex !== null && !isHovered;

            return (
              <circle
                key={idx}
                cx="100"
                cy="100"
                r={radius}
                className={isHovered ? styles.donutSegmentActive : styles.donutSegment}
                style={{
                  stroke: slice.color,
                  strokeDasharray: slice.strokeDasharray,
                  strokeDashoffset: slice.strokeDashoffset,
                  opacity: isDimmed ? 0.35 : 1,
                }}
                onMouseEnter={() => setActiveHoverIndex(idx)}
                onMouseLeave={() => setActiveHoverIndex(null)}
              />
            );
          })}
        </svg>

        {/* Dynamic Central Telemetry HUD */}
        <div className={styles.centerTextWrapper}>
          <span className={styles.centerLabel}>
            {activeSlice ? activeSlice.name : "Total Pipeline"}
          </span>
          <span className={styles.centerValue}>
            {activeSlice
              ? financials
                ? formatCrmCurrency(activeSlice.value)
                : "Confidential"
              : displayValuation}
          </span>
          <span className={styles.centerSubtext}>
            {activeSlice
              ? `${activeSlice.percentage}% of allocation`
              : `${totalDealsCount} active deals`}
          </span>
        </div>
      </div>

      {/* Ranked Category Cardlets with Embedded Precision Gauges (Finexy / Linear Standard) */}
      {categories.length === 0 ? (
        <div className={styles.emptyCategories} role="status">
          <span>No pipeline categories recorded in this scope.</span>
        </div>
      ) : (
        <ul className={styles.categoryCardletList}>
          {categories.map((cat, idx) => {
            const isHovered = activeHoverIndex === idx;

            return (
              <li
                key={idx}
                className={isHovered ? styles.cardletItemActive : styles.cardletItem}
                onMouseEnter={() => setActiveHoverIndex(idx)}
                onMouseLeave={() => setActiveHoverIndex(null)}
              >
                <div className={styles.cardletTopLine}>
                  <div className={styles.cardletMetaLeft}>
                    <span
                      className={styles.colorSwatch}
                      style={{ backgroundColor: cat.color }}
                      aria-hidden="true"
                    />
                    <span className={styles.categoryName} title={cat.name}>
                      {cat.name}
                    </span>
                    {typeof cat.count === "number" && cat.count > 0 && (
                      <span className={styles.dealCountTag}>{cat.count} deals</span>
                    )}
                  </div>

                  <div className={styles.cardletMetaRight}>
                    <span className={styles.categoryAmount}>
                      {financials ? formatCrmCurrency(cat.value) : "Confidential"}
                    </span>
                    <span className={styles.percentagePill}>{cat.percentage}%</span>
                  </div>
                </div>

                {/* Embedded Precision Instrument Meter (Enclosed inside cardlet boundary) */}
                <div className={styles.cardletMeterTrack}>
                  <div
                    className={styles.cardletMeterFill}
                    style={{
                      width: `${Math.min(100, Math.max(3, cat.percentage))}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
};
