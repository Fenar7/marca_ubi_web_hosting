"use client";

/**
 * @file LuxuryDonutCookieChart.tsx
 * @description Master Luxury Donut ("Cookie") Chart Component synthesized 1:1 from the Conyest/Finlo/Fundora archetypes.
 *              Features precision SVG donut arcs with 146px inner clearance, hollow center valuation hero,
 *              interactive category/stage perspective toggles, and colored square percentage chips.
 *              Replaces the deprecated progress bar and cluttered vertical list.
 * @module admin/components/Dashboard/LuxuryDonutCookieChart
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useMemo, useState } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import { computeDonutLayout } from "@/app/admin/lib/chartGeometry";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./LuxuryDonutCookieChart.module.scss";

export type DonutPerspectiveMode = "category" | "stage";

export interface DonutCategorySlice {
  label: string;
  value: number;
  count?: number;
  percentage: number;
  color: string;
}

export interface LuxuryDonutCookieChartProps {
  categories?: { name: string; value: number; count?: number }[];
  records?: OverviewRecord[];
  totalValue?: number | null;
  financials?: boolean;
}

const LUXURY_PALETTE = [
  "#111827", // Obsidian Ink (Dominant / Primary Service)
  "#ea002a", // Marca Ubi Signature Crimson (Flagship Advisory)
  "#2563eb", // Royal Navy (Design & Digital Architecture)
  "#d97706", // Warm Amber (Brand Strategy)
  "#64748b", // Slate Grey (Technology & Media)
  "#94a3b8", // Soft Slate (Ancillary)
];

export const LuxuryDonutCookieChart: React.FC<LuxuryDonutCookieChartProps> = ({
  categories: rawCategories = [],
  records = [],
  totalValue = null,
  financials = true,
}) => {
  const [perspective, setPerspective] = useState<DonutPerspectiveMode>("category");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute aggregated slices based on active perspective
  const slices = useMemo<DonutCategorySlice[]>(() => {
    if (perspective === "category") {
      if (rawCategories && rawCategories.length > 0) {
        const sum =
          totalValue && totalValue > 0
            ? totalValue
            : rawCategories.reduce((acc, c) => acc + c.value, 0);

        return rawCategories.slice(0, 5).map((c, idx) => ({
          label: c.name,
          value: c.value,
          count: c.count,
          percentage: sum > 0 ? Math.max(1, Math.round((c.value / sum) * 100)) : 0,
          color: LUXURY_PALETTE[idx % LUXURY_PALETTE.length],
        }));
      }

      if (records && records.length > 0) {
        const catMap = new Map<string, { value: number; count: number }>();
        for (const r of records) {
          const cat = r.serviceCategory || "Advisory & Strategy";
          const val = r.expectedValue ?? 0;
          const curr = catMap.get(cat) ?? { value: 0, count: 0 };
          catMap.set(cat, { value: curr.value + val, count: curr.count + 1 });
        }
        const sorted = [...catMap.entries()].sort((a, b) => b[1].value - a[1].value);
        const sum =
          totalValue && totalValue > 0
            ? totalValue
            : sorted.reduce((acc, curr) => acc + curr[1].value, 0);

        return sorted.slice(0, 5).map(([name, data], idx) => ({
          label: name,
          value: data.value,
          count: data.count,
          percentage: sum > 0 ? Math.max(1, Math.round((data.value / sum) * 100)) : 0,
          color: LUXURY_PALETTE[idx % LUXURY_PALETTE.length],
        }));
      }
    }

    if (perspective === "stage" && records && records.length > 0) {
      const stageMap = new Map<string, { value: number; count: number }>();
      for (const r of records) {
        const stage = r.stage || "Discovery";
        const val = r.expectedValue ?? 0;
        const curr = stageMap.get(stage) ?? { value: 0, count: 0 };
        stageMap.set(stage, { value: curr.value + val, count: curr.count + 1 });
      }
      const sorted = [...stageMap.entries()].sort((a, b) => b[1].value - a[1].value);
      const sum =
        totalValue && totalValue > 0
          ? totalValue
          : sorted.reduce((acc, curr) => acc + curr[1].value, 0);

      return sorted.slice(0, 5).map(([name, data], idx) => ({
        label: name,
        value: data.value,
        count: data.count,
        percentage: sum > 0 ? Math.max(1, Math.round((data.value / sum) * 100)) : 0,
        color: LUXURY_PALETTE[idx % LUXURY_PALETTE.length],
      }));
    }

    return [];
  }, [perspective, rawCategories, records, totalValue]);

  // Donut geometry computed using chartGeometry utility
  const donutLayout = useMemo(() => {
    return computeDonutLayout(
      slices.map((s) => ({
        label: s.label,
        percentage: s.percentage,
        color: s.color,
      })),
      76, // radius
      22, // strokeWidth
      3.0, // gapPx
    );
  }, [slices]);

  const totalCalculated = useMemo(() => {
    if (totalValue !== null && totalValue !== undefined) return totalValue;
    return slices.reduce((sum, s) => sum + s.value, 0);
  }, [totalValue, slices]);

  const activeFocus = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <article
      className={styles.donutCard}
      aria-label="Commercial pipeline stage and category allocation donut chart"
    >
      {/* Header: Title with info icon and perspective switch */}
      <header className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.titleRow}>
            <h2 className={styles.cardTitle}>Pipeline Allocation</h2>
            <button
              type="button"
              className={styles.infoButton}
              aria-label="About Pipeline Allocation telemetry"
              title="Pipeline Allocation distribution by service category or funnel stage"
            >
              ⓘ
            </button>
          </div>
          <span className={styles.cardSubtitle}>Active deal value distribution</span>
        </div>

        {/* Perspective Toggle Pills: [By Category] vs [By Stage] */}
        <div className={styles.perspectiveSwitch} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={perspective === "category"}
            onClick={() => {
              setPerspective("category");
              setHoveredIndex(null);
            }}
            className={`${styles.tabPill} ${
              perspective === "category" ? styles.tabPillActive : ""
            }`}
          >
            Category
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={perspective === "stage"}
            onClick={() => {
              setPerspective("stage");
              setHoveredIndex(null);
            }}
            className={`${styles.tabPill} ${
              perspective === "stage" ? styles.tabPillActive : ""
            }`}
          >
            Stage
          </button>
        </div>
      </header>

      {/* Center Donut ("Cookie") Stage */}
      <div className={styles.donutStage}>
        <div className={styles.svgWrapper}>
          <svg
            viewBox="0 0 220 220"
            className={styles.donutSvg}
            role="img"
            aria-label="Multi-segment circular pipeline donut chart"
          >
            {/* Background Track Circle */}
            <circle
              cx={donutLayout.cx}
              cy={donutLayout.cy}
              r={donutLayout.radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={donutLayout.strokeWidth}
            />

            {/* Dynamic Slices */}
            {donutLayout.segments.map((seg, idx) => {
              const isHovered = hoveredIndex === idx;
              const isDimmed = hoveredIndex !== null && !isHovered;

              return (
                <circle
                  key={idx}
                  cx={donutLayout.cx}
                  cy={donutLayout.cy}
                  r={donutLayout.radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isHovered ? donutLayout.strokeWidth + 4 : donutLayout.strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  transform={`rotate(-90 ${donutLayout.cx} ${donutLayout.cy})`}
                  className={`${styles.donutSegment} ${
                    isHovered ? styles.donutSegmentHovered : ""
                  } ${isDimmed ? styles.donutSegmentDimmed : ""}`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Hollow Center Valuation Hero */}
          <div className={styles.centerHero} aria-live="polite">
            <span className={styles.centerMetric}>
              {activeFocus
                ? financials
                  ? formatCrmCurrency(activeFocus.value)
                  : "Confidential"
                : financials
                  ? formatCrmCurrency(totalCalculated)
                  : "Confidential"}
            </span>
            <span className={styles.centerSubtext}>
              {activeFocus
                ? `${activeFocus.label} (${activeFocus.percentage}%)`
                : `${records.length > 0 ? records.length : 36} Active Deals`}
            </span>
          </div>
        </div>
      </div>

      {/* Segment Breakdown Rows with Colored Square Percentage Chips */}
      <ul className={styles.breakdownList} role="list">
        {slices.map((slice, idx) => {
          const isHovered = hoveredIndex === idx;

          return (
            <li
              key={idx}
              className={`${styles.breakdownItem} ${
                isHovered ? styles.breakdownItemActive : ""
              }`}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className={styles.itemLeft}>
                {/* Colored Square Percentage Chip */}
                <span
                  className={styles.percentChip}
                  style={{ backgroundColor: slice.color }}
                  aria-hidden="true"
                >
                  {slice.percentage}%
                </span>
                <span className={styles.itemLabel} title={slice.label}>
                  {slice.label}
                </span>
                {typeof slice.count === "number" && slice.count > 0 && (
                  <span className={styles.countTag}>{slice.count}d</span>
                )}
              </div>

              <div className={styles.itemRight}>
                <span className={styles.itemAmount}>
                  {financials ? formatCrmCurrency(slice.value) : "Confidential"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
};
