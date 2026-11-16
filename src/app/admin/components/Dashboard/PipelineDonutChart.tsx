"use client";

/**
 * @file PipelineDonutChart.tsx
 * @description Master Pipeline Breakdown Component synthesized 1:1 from the Fundora & Finlo Flash archetypes.
 *              Features Swiss thin headline valuation (300 weight, -0.035em letter spacing),
 *              interactive Perspective Dropdown ("By Category" | "By Stage" | "By Deal Size"),
 *              continuous 14px multi-segment horizontal capsule progress bar,
 *              and elegant hairline-separated ranked detail rows.
 * @module admin/components/Dashboard/PipelineDonutChart
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useMemo, useState, useRef, useEffect } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./PipelineDonutChart.module.scss";

export type BreakdownViewMode = "category" | "stage" | "deal_size";

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
  initialMode?: BreakdownViewMode;
  onViewModeChange?: (mode: BreakdownViewMode) => void;
}

interface ViewModeOption {
  mode: BreakdownViewMode;
  label: string;
  subtext: string;
}

const VIEW_MODE_OPTIONS: ViewModeOption[] = [
  { mode: "category", label: "By Category", subtext: "Service line distribution" },
  { mode: "stage", label: "By Stage", subtext: "Pipeline funnel progression" },
  { mode: "deal_size", label: "By Deal Size", subtext: "Capital tier classification" },
];

const LUXURY_PALETTE = [
  "#ea002a", // Marca Ubi Signature Crimson (Lead Offering)
  "#18181b", // Obsidian Ink (Strategic Advisory)
  "#64748b", // Slate Grey (Design & Creative)
  "#94a3b8", // Slate 400 (WCAG AA > 3:1 against canvas)
];

export const PipelineDonutChart: React.FC<PipelineDonutChartProps> = ({
  categories: rawCategories = [],
  records = [],
  totalValue = null,
  financials = true,
  initialMode = "category",
  onViewModeChange,
}) => {
  const [viewMode, setViewMode] = useState<BreakdownViewMode>(initialMode);
  const [isViewModeOpen, setIsViewModeOpen] = useState(false);
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Outside click listener for view mode dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsViewModeOpen(false);
      }
    }
    if (isViewModeOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isViewModeOpen]);

  // Aggregate slices dynamically based on selected view mode
  const slices = useMemo<CategorySlice[]>(() => {
    if (viewMode === "category") {
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
    }

    if (viewMode === "stage") {
      if (records && records.length > 0) {
        const stageMap = new Map<string, { value: number; count: number }>();
        for (const r of records) {
          const stageName = r.stage || "Discovery";
          const val = r.expectedValue ?? 0;
          const existing = stageMap.get(stageName) ?? { value: 0, count: 0 };
          stageMap.set(stageName, {
            value: existing.value + val,
            count: existing.count + 1,
          });
        }

        const sorted = [...stageMap.entries()].sort((a, b) => b[1].value - a[1].value);
        const top4 = sorted.slice(0, 4);
        const sumVal = top4.reduce((acc, curr) => acc + curr[1].value, 0);
        const validTotal = totalValue && totalValue > 0 ? totalValue : sumVal;

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
    }

    if (viewMode === "deal_size") {
      const tiers = [
        { name: "Enterprise (> ₹25L)", min: 2500000, max: Infinity, value: 0, count: 0 },
        { name: "Mid-Market (₹10L–₹25L)", min: 1000000, max: 2500000, value: 0, count: 0 },
        { name: "Growth (₹5L–₹10L)", min: 500000, max: 1000000, value: 0, count: 0 },
        { name: "Starter (< ₹5L)", min: 0, max: 500000, value: 0, count: 0 },
      ];

      for (const r of records) {
        const val = r.expectedValue ?? 0;
        const tier = tiers.find((t) => val >= t.min && val < t.max) || tiers[tiers.length - 1];
        tier.value += val;
        tier.count += 1;
      }

      const activeTiers = tiers.filter((t) => t.count > 0);
      const totalTierVal = activeTiers.reduce((acc, t) => acc + t.value, 0);
      const validTotal = totalValue && totalValue > 0 ? totalValue : totalTierVal;

      return activeTiers.map((t, idx) => ({
        name: t.name,
        value: t.value,
        count: t.count,
        percentage:
          validTotal > 0 ? Math.max(1, Math.round((t.value / validTotal) * 100)) : 0,
        color: LUXURY_PALETTE[idx % LUXURY_PALETTE.length],
      }));
    }

    return [];
  }, [viewMode, rawCategories, records, totalValue]);

  const totalValuation = useMemo(() => {
    if (totalValue !== null && totalValue > 0) return totalValue;
    return slices.reduce((sum, c) => sum + c.value, 0);
  }, [totalValue, slices]);

  const totalDealsCount = useMemo(() => {
    const summedCounts = slices.reduce((acc, c) => acc + (c.count ?? 0), 0);
    return summedCounts > 0 ? summedCounts : records.length;
  }, [slices, records]);

  const activeCategory =
    activeHoverIndex !== null && slices[activeHoverIndex]
      ? slices[activeHoverIndex]
      : null;

  const currentOption =
    VIEW_MODE_OPTIONS.find((opt) => opt.mode === viewMode) || VIEW_MODE_OPTIONS[0];

  const subtitleText =
    viewMode === "category"
      ? "Active deal value across services"
      : viewMode === "stage"
      ? "Active deal value across pipeline stages"
      : "Active deal value across transaction sizes";

  return (
    <article
      className={styles.cardContainer}
      aria-labelledby="pipeline-breakdown-title"
    >
      {/* Header: Fundora Stately Architecture with Functional Perspective Dropdown */}
      <header className={styles.breakdownHeader}>
        <div className={styles.titleAndValuation}>
          <div className={styles.titleRow}>
            <h2 className={styles.title} id="pipeline-breakdown-title">
              Pipeline Breakdown
            </h2>
            <span
              className={styles.infoIcon}
              title="Distribution of active deal capital across service offerings"
              aria-label="Information regarding pipeline breakdown"
            >
              ⓘ
            </span>
          </div>

          <div className={styles.valuationRow}>
            <span className={styles.heroValuation}>
              {financials ? formatCrmCurrency(totalValuation) : "Confidential"}
            </span>
            {totalDealsCount > 0 && (
              <span className={styles.dealCountBadge}>
                {totalDealsCount} Active Deals
              </span>
            )}
          </div>
          <p className={styles.subtitle}>{subtitleText}</p>
        </div>

        {/* Functional Perspective View Mode Dropdown */}
        <div className={styles.dropdownContainer} ref={dropdownRef}>
          <button
            type="button"
            className={`${styles.viewModeButton} ${
              isViewModeOpen ? styles.viewModeButtonActive : ""
            }`}
            onClick={() => setIsViewModeOpen((prev) => !prev)}
            aria-expanded={isViewModeOpen}
            aria-haspopup="listbox"
            aria-label="Select pipeline breakdown perspective"
          >
            <span>{currentOption.label}</span>
            <svg
              className={`${styles.chevron} ${
                isViewModeOpen ? styles.chevronOpen : ""
              }`}
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M1 1L5 5L9 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isViewModeOpen && (
            <ul
              className={styles.dropdownMenu}
              role="listbox"
              aria-label="Pipeline breakdown perspectives"
            >
              {VIEW_MODE_OPTIONS.map((opt) => {
                const isActive = opt.mode === viewMode;
                return (
                  <li key={opt.mode} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      className={`${styles.dropdownItem} ${
                        isActive ? styles.dropdownItemActive : ""
                      }`}
                      onClick={() => {
                        setViewMode(opt.mode);
                        setIsViewModeOpen(false);
                        onViewModeChange?.(opt.mode);
                      }}
                    >
                      <div className={styles.optionInfo}>
                        <span className={styles.optionLabel}>{opt.label}</span>
                        <span className={styles.optionSubtext}>{opt.subtext}</span>
                      </div>
                      {isActive && (
                        <span className={styles.activeCheck} aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </header>

      {/* Continuous Multi-Segment Horizontal Progress Bar (Fundora Archetype) */}
      <div className={styles.progressContainer}>
        {activeCategory && (
          <div className={styles.segmentTooltip}>
            <span>{activeCategory.name}: </span>
            <strong>
              {financials ? formatCrmCurrency(activeCategory.value) : "Confidential"}{" "}
              ({activeCategory.percentage}%)
            </strong>
          </div>
        )}

        <div
          className={styles.multiSegmentBar}
          role="progressbar"
          aria-valuenow={100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Allocation breakdown progress bar"
        >
          {slices.map((cat, idx) => {
            const isHovered = activeHoverIndex === idx;
            const isDimmed = activeHoverIndex !== null && !isHovered;

            return (
              <div
                key={idx}
                className={`${styles.barSegment} ${
                  isHovered ? styles.barSegmentHovered : ""
                } ${isDimmed ? styles.barSegmentDimmed : ""}`}
                style={{
                  flex: cat.percentage,
                  backgroundColor: cat.color,
                }}
                onMouseEnter={() => setActiveHoverIndex(idx)}
                onMouseLeave={() => setActiveHoverIndex(null)}
              />
            );
          })}
        </div>
      </div>

      {/* Ranked Detail Rows with Hairline Separators (No boxed cardlets) */}
      {slices.length === 0 ? (
        <div className={styles.emptyCategories} role="status">
          <span>No pipeline data recorded in this perspective.</span>
        </div>
      ) : (
        <ul className={styles.categoryDetailList}>
          {slices.map((cat, idx) => {
            const isHovered = activeHoverIndex === idx;

            return (
              <li
                key={idx}
                className={`${styles.detailRow} ${
                  isHovered ? styles.detailRowActive : ""
                }`}
                onMouseEnter={() => setActiveHoverIndex(idx)}
                onMouseLeave={() => setActiveHoverIndex(null)}
              >
                <div className={styles.detailMetaLeft}>
                  <span
                    className={styles.detailDot}
                    style={{ backgroundColor: cat.color }}
                    aria-hidden="true"
                  />
                  <span className={styles.detailCategoryName} title={cat.name}>
                    {cat.name}
                  </span>
                  {typeof cat.count === "number" && cat.count > 0 && (
                    <span className={styles.detailCountBadge}>
                      {cat.count} deals
                    </span>
                  )}
                </div>

                <div className={styles.detailMetaRight}>
                  <span className={styles.detailPercentagePill}>
                    {cat.percentage}%
                  </span>
                  <span className={styles.detailAmount}>
                    {financials ? formatCrmCurrency(cat.value) : "Confidential"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
};
