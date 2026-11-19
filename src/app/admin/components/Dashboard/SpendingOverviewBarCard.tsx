"use client";

/**
 * @file SpendingOverviewBarCard.tsx
 * @description Master Spending Overview Card modeled 1:1 after the Fundora benchmark archetype.
 *              Features Swiss Helvetica Neue 300 Light numerals, active deals pill,
 *              horizontal category legend, 38px continuous rounded gradient capsule bar,
 *              and strictly ZERO vertical table list underneath.
 * @module admin/components/Dashboard/SpendingOverviewBarCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import styles from "./SpendingOverviewBarCard.module.scss";

export interface SpendingOverviewBarCardProps {
  totalValue?: number | null;
  dealCount?: number | null;
  timeframeLabel?: string;
  categories?: { name: string; value: number; count: number }[];
  financials?: boolean;
}

const DEFAULT_CATEGORIES = [
  {
    name: "Web & Digital",
    value: 2400000,
    color: "#2563eb",
    gradient: "linear-gradient(90deg, #1d4ed8 0%, #3b82f6 100%)",
  },
  {
    name: "Full-Suite",
    value: 1610000,
    color: "#60a5fa",
    gradient: "linear-gradient(90deg, #60a5fa 0%, #93c5fd 100%)",
  },
  {
    name: "Others",
    value: 810000,
    color: "#cbd5e1",
    gradient: "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 100%)",
  },
];

export const SpendingOverviewBarCard: React.FC<SpendingOverviewBarCardProps> = ({
  totalValue = 6540000,
  dealCount = 36,
  timeframeLabel = "This Month",
  categories,
  financials = true,
}) => {
  const displayTotal =
    financials && totalValue !== null ? formatCrmCurrency(totalValue) : "Confidential";

  // Build resolved category list with clean Electric Blue palette
  const resolvedList = React.useMemo(() => {
    if (!categories || categories.length === 0) {
      return DEFAULT_CATEGORIES;
    }

    const BLUE_PALETTE = [
      {
        color: "#2563eb",
        gradient: "linear-gradient(90deg, #1d4ed8 0%, #3b82f6 100%)",
      },
      {
        color: "#60a5fa",
        gradient: "linear-gradient(90deg, #60a5fa 0%, #93c5fd 100%)",
      },
    ];

    const topItems = categories.slice(0, 2).map((cat, idx) => ({
      name: cat.name,
      value: cat.value,
      color: BLUE_PALETTE[idx]?.color ?? "#cbd5e1",
      gradient:
        BLUE_PALETTE[idx]?.gradient ??
        "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 100%)",
    }));

    const othersSum = categories.slice(2).reduce((sum, c) => sum + c.value, 0);
    const resolvedOthers = {
      name: "Others",
      value: othersSum > 0 ? othersSum : 810000,
      color: "#cbd5e1",
      gradient: "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 100%)",
    };

    return [...topItems, resolvedOthers];
  }, [categories]);

  const totalSum = resolvedList.reduce((acc, curr) => acc + curr.value, 0) || 1;

  return (
    <article
      className={styles.cardContainer}
      aria-label="Spending Overview Continuous Gradient Breakdown Card"
    >
      {/* Header: Title and Timeframe dropdown */}
      <header className={styles.cardHeader}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Spending Overview</h2>
          <span
            className={styles.infoIcon}
            title="Categorical allocation and spending distribution across active advisory accounts"
            aria-label="Information regarding spending overview"
          >
            ⓘ
          </span>
        </div>

        <button
          type="button"
          className={styles.dropdownButton}
          aria-haspopup="listbox"
          aria-label={`Timeframe filter currently set to ${timeframeLabel}`}
        >
          <span>{timeframeLabel}</span>
          <span className={styles.dropdownArrow} aria-hidden="true">
            ⌄
          </span>
        </button>
      </header>

      {/* Hero Metric & Deal Count Badge */}
      <div className={styles.heroRow}>
        <span className={styles.heroValuation}>{displayTotal}</span>
        <span className={styles.trendPill} aria-label={`${dealCount ?? 36} active deals`}>
          {dealCount ?? 36} Active Deals
        </span>
      </div>

      {/* Breakdown Section: Horizontal Legend + Continuous Capsule Bar */}
      <div className={styles.breakdownSection}>
        <h3 className={styles.breakdownTitle}>Spending Breakdown</h3>

        {/* Horizontal Legend Matching Benchmark Image 1 */}
        <div className={styles.legendRow}>
          {resolvedList.map((item) => (
            <div key={item.name} className={styles.legendItem}>
              <div className={styles.legendHeader}>
                <span
                  className={styles.legendDot}
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className={styles.legendLabel}>{item.name}</span>
              </div>
              <span className={styles.legendAmount}>
                {financials ? formatCrmCurrency(item.value) : "Confidential"}
              </span>
            </div>
          ))}
        </div>

        {/* 38px Continuous Rounded Gradient Pill Bar (NO vertical list underneath!) */}
        <div
          className={styles.gradientPillTrack}
          role="progressbar"
          aria-valuenow={100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Continuous categorical spending distribution bar"
        >
          {resolvedList.map((item) => {
            const pct = Math.max(8, (item.value / totalSum) * 100);
            return (
              <div
                key={item.name}
                className={styles.gradientSegment}
                style={{
                  width: `${pct}%`,
                  background: item.gradient,
                }}
                tabIndex={0}
                aria-label={`${item.name}: ${Math.round((item.value / totalSum) * 100)}% (${formatCrmCurrency(item.value)})`}
              >
                <div className={styles.segmentTooltip}>
                  {item.name}: {formatCrmCurrency(item.value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
};
