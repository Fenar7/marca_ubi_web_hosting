"use client";

/**
 * @file EarningOverviewSplineCard.tsx
 * @description Master Earning Overview Card modeled 1:1 after the Fundora benchmark archetype.
 *              Features Swiss Helvetica Neue 300 Light numerals, emerald trend badge,
 *              interactive cubic bezier SVG spline curve, linear gradient area wash,
 *              apex beacon target ring, dashed vertical guide stem, and floating tooltip card.
 * @module admin/components/Dashboard/EarningOverviewSplineCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useId } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import styles from "./EarningOverviewSplineCard.module.scss";

export interface SplineMonthPoint {
  month: string;
  year: number;
  value: number;
}

export interface EarningOverviewSplineCardProps {
  totalValue?: number | null;
  growthPercentage?: number;
  timeframeLabel?: string;
  points?: SplineMonthPoint[];
  financials?: boolean;
}

const DEFAULT_POINTS: SplineMonthPoint[] = [
  { month: "Jan", year: 2025, value: 320000 },
  { month: "Feb", year: 2025, value: 580000 },
  { month: "Mar", year: 2025, value: 460000 },
  { month: "Apr", year: 2025, value: 720000 },
  { month: "May", year: 2025, value: 868920 },
  { month: "Jun", year: 2025, value: 540000 },
];

export const EarningOverviewSplineCard: React.FC<EarningOverviewSplineCardProps> = ({
  totalValue = 6540000,
  growthPercentage = 1.5,
  timeframeLabel = "This Month",
  points = DEFAULT_POINTS,
  financials = true,
}) => {
  const gradientId = useId();
  // Active selected point defaults to index 4 ("May" in default set to match Image 1 benchmark)
  const [activeIndex, setActiveIndex] = useState<number>(4);

  const displayTotal =
    financials && totalValue !== null ? formatCrmCurrency(totalValue) : "Confidential";

  // Chart coordinates mapping (ViewBox: 500w x 140h, padding left/right 30, baseline y=130)
  const width = 500;
  const height = 140;
  const paddingX = 35;
  const baselineY = 130;
  const chartHeight = 95;

  const maxValue = Math.max(...points.map((p) => p.value), 1);
  const minValue = Math.min(...points.map((p) => p.value), 0);
  const range = maxValue - minValue || 1;

  // Calculate coordinates for each data point
  const coords = points.map((p, idx) => {
    const x = paddingX + (idx / (points.length - 1)) * (width - paddingX * 2);
    // Inverted Y: higher value = smaller Y (near top)
    const normalized = (p.value - minValue) / range;
    const y = baselineY - normalized * chartHeight;
    return { x, y, point: p };
  });

  // Build cubic bezier path string
  function buildSplinePath(): string {
    if (coords.length < 2) return "";
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const current = coords[i];
      const next = coords[i + 1];
      const controlX1 = current.x + (next.x - current.x) / 2;
      const controlY1 = current.y;
      const controlX2 = current.x + (next.x - current.x) / 2;
      const controlY2 = next.y;
      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`;
    }
    return path;
  }

  const linePath = buildSplinePath();
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z`;

  const activeCoord = coords[activeIndex] || coords[coords.length - 1];
  const activeTooltipPercent = (activeCoord.x / width) * 100;

  return (
    <article
      className={styles.cardContainer}
      aria-label="Earning Overview Area Spline Performance Card"
    >
      {/* Header: Title with info tooltip and Timeframe dropdown */}
      <header className={styles.cardHeader}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Earning Overview</h2>
          <span
            className={styles.infoIcon}
            title="Consolidated pipeline earnings across active advisory cadences"
            aria-label="Information regarding earning overview"
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

      {/* Hero Metric & Emerald Growth Pill */}
      <div className={styles.heroRow}>
        <span className={styles.heroValuation}>{displayTotal}</span>
        <span className={styles.trendBadge} aria-label={`${growthPercentage}% increase this period`}>
          +{growthPercentage}% ↑
        </span>
      </div>

      {/* Interactive Spline Chart */}
      <div className={styles.chartContainer}>
        {/* Floating Tooltip Card */}
        <div
          className={styles.floatingTooltip}
          style={{ left: `${activeTooltipPercent}%` }}
          aria-live="polite"
        >
          <span className={styles.tooltipText}>
            {activeCoord.point.month} {activeCoord.point.year} : {formatCrmCurrency(activeCoord.point.value)}
          </span>
        </div>

        <svg
          className={styles.splineSvg}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`earning-gradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c5a059" stopOpacity="0.18" />
              <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id={`metallic-stroke-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="60%" stopColor="#334155" />
              <stop offset="100%" stopColor="#92691f" />
            </linearGradient>
            <filter id={`beacon-glow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#c5a059" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#earning-gradient-${gradientId})`} />

          {/* Spline Curve Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke={`url(#metallic-stroke-${gradientId})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Vertical Dashed Stem connecting apex to baseline */}
          <line
            x1={activeCoord.x}
            y1={activeCoord.y}
            x2={activeCoord.x}
            y2={baselineY}
            stroke="rgba(197, 160, 89, 0.45)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Active Apex Beacon Halo & Dot */}
          <circle
            cx={activeCoord.x}
            cy={activeCoord.y}
            r="8"
            fill="#c5a059"
            fillOpacity="0.22"
          />
          <circle
            cx={activeCoord.x}
            cy={activeCoord.y}
            r="4.5"
            fill="#16181d"
            stroke="#c5a059"
            strokeWidth="2.5"
            filter={`url(#beacon-glow-${gradientId})`}
          />

          {/* Invisible interactive hover hit areas for each point */}
          {coords.map((coord, idx) => (
            <rect
              key={coord.point.month}
              x={coord.x - (width / coords.length) / 2}
              y={0}
              width={width / coords.length}
              height={height}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => setActiveIndex(idx)}
            />
          ))}
        </svg>

        {/* X-Axis Month Legend */}
        <div className={styles.monthLabelsRow}>
          {points.map((pt, idx) => (
            <button
              key={pt.month}
              type="button"
              className={`${styles.monthLabel} ${idx === activeIndex ? styles.monthLabelActive : ""}`}
              onClick={() => setActiveIndex(idx)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              {pt.month}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
};
