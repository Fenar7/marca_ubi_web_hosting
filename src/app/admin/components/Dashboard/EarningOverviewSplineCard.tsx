"use client";

/**
 * @file EarningOverviewSplineCard.tsx
 * @description Master Earning Overview Card modeled 1:1 after the Fundora benchmark archetype.
 *              Features Swiss Helvetica Neue 300 Light numerals, emerald trend badge,
 *              interactive cubic bezier SVG spline curve, luxury brand crimson area wash,
 *              apex beacon target ring, vertical guide stem, and accessible timeframe dropdown.
 * @module admin/components/Dashboard/EarningOverviewSplineCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useId, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import {
  type CardTimeframe,
  CARD_TIMEFRAME_OPTIONS,
  type SplineDataPoint,
  type TimeframeSlug,
  type DynamicRevenueSplinePoint,
} from "@/app/admin/lib/timeframeUtils";
import styles from "./EarningOverviewSplineCard.module.scss";

/** Backward-compatible alias for barrel consumers */
export type SplineMonthPoint = SplineDataPoint;
export type { SplineDataPoint };

function toCardTimeframe(slug?: TimeframeSlug): CardTimeframe | undefined {
  switch (slug) {
    case "7d":
      return "this_week";
    case "30d":
      return "this_month";
    case "quarter":
      return "this_quarter";
    case "year":
      return "this_year";
    default:
      return undefined;
  }
}

export interface EarningOverviewSplineCardProps {
  totalValue?: number | null;
  growthPercentage?: number | null;
  timeframe?: TimeframeSlug;
  timeframeLabel?: string;
  points?: SplineDataPoint[] | DynamicRevenueSplinePoint[];
  financials?: boolean;
  onTimeframeChange?: (timeframe: CardTimeframe) => void;
}

export const EarningOverviewSplineCard: React.FC<EarningOverviewSplineCardProps> = ({
  totalValue = null,
  growthPercentage: externalGrowth = null,
  timeframe,
  financials = true,
  points: incomingPoints,
  onTimeframeChange,
}) => {
  const gradientId = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [localTimeframe, setLocalTimeframe] = useState<CardTimeframe>("this_month");
  const selectedTimeframe = toCardTimeframe(timeframe) ?? localTimeframe;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Active selected point defaults to peak or current
  const [activeIndex, setActiveIndex] = useState<number>(4);

  // Click outside and keyboard event handlers
  useEffect(() => {
    if (!isDropdownOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Handle timeframe change
  const handleSelectTimeframe = (slug: CardTimeframe) => {
    setLocalTimeframe(slug);
    setIsDropdownOpen(false);
    triggerRef.current?.focus();
    if (onTimeframeChange) {
      onTimeframeChange(slug);
    }
  };

  // Resolve real spline telemetry without fabricating synthetic series when empty
  const { points, activeTotal, growthPercentage } = useMemo(() => {
    const resolvedDelta =
      typeof externalGrowth === "number" && Number.isFinite(externalGrowth) ? externalGrowth : null;
    if (incomingPoints && incomingPoints.length > 0) {
      const realPoints: SplineDataPoint[] = incomingPoints.map((p) => {
        const cashVal = "cashVal" in p ? p.cashVal : p.value;
        const yr = "year" in p && typeof (p as { year?: number }).year === "number" ? (p as { year: number }).year : new Date().getFullYear();
        const fullPeriod = "fullPeriod" in p && p.fullPeriod ? p.fullPeriod : `${p.month} ${yr}`;
        return {
          month: p.month,
          year: yr,
          value: cashVal,
          fullPeriod,
        };
      });
      return {
        points: realPoints,
        activeTotal: typeof totalValue === "number" ? totalValue : realPoints.reduce((s, p) => s + p.value, 0),
        growthPercentage: resolvedDelta,
      };
    }
    const rawTotal = typeof totalValue === "number" ? totalValue : 0;
    return {
      points: [],
      activeTotal: rawTotal,
      growthPercentage: resolvedDelta,
    };
  }, [totalValue, incomingPoints, externalGrowth]);

  // Clamp activeIndex within points bounds to prevent runtime coordinate crashes
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, points.length - 1));

  const displayTotal =
    financials && activeTotal !== null ? formatCrmCurrency(activeTotal) : "Confidential";

  // Chart coordinates mapping (ViewBox: 500w x 120h, padding left/right 35, baseline y=105)
  const width = 500;
  const height = 120;
  const paddingX = 35;
  const baselineY = 105;
  const chartHeight = 85;

  const maxValue = Math.max(...points.map((p) => p.value), 1);
  const minValue = Math.min(...points.map((p) => p.value), 0);
  const range = maxValue - minValue || 1;

  // Calculate coordinates for each data point
  const coords = points.map((p, idx) => {
    const x = paddingX + (idx / Math.max(1, points.length - 1)) * (width - paddingX * 2);
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
  const areaPath = coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z`
    : "";

  const activeCoord = coords[safeActiveIndex] || coords[0] || { x: paddingX, y: baselineY, point: points[0] };
  const activeTooltipPercent = (activeCoord.x / width) * 100;

  const currentOption =
    CARD_TIMEFRAME_OPTIONS.find((opt) => opt.slug === selectedTimeframe) ||
    CARD_TIMEFRAME_OPTIONS[1];

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
            title="Consolidated closed revenue across advisory cadences"
            aria-label="Information regarding earning overview"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </span>
          <Link
            href="/admin/analytics"
            className={styles.viewAnalyticsLink}
            aria-label="View detailed revenue analytics"
          >
            <span>View Analytics</span>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        <div className={styles.dropdownContainer} ref={dropdownRef}>
          <button
            ref={triggerRef}
            type="button"
            id="earning-timeframe-trigger"
            className={`${styles.dropdownButton} ${isDropdownOpen ? styles.dropdownButtonActive : ""}`}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
            aria-controls="earning-timeframe-menu"
            aria-label={`Timeframe filter, currently set to ${currentOption.label}`}
          >
            <span>{currentOption.label}</span>
            <svg
              className={`${styles.dropdownArrow} ${isDropdownOpen ? styles.dropdownArrowOpen : ""}`}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isDropdownOpen && (
            <ul
              id="earning-timeframe-menu"
              className={styles.dropdownMenu}
              role="listbox"
              aria-labelledby="earning-timeframe-trigger"
            >
              {CARD_TIMEFRAME_OPTIONS.map((opt) => (
                <li key={opt.slug} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedTimeframe === opt.slug}
                    className={`${styles.dropdownItem} ${
                      selectedTimeframe === opt.slug ? styles.dropdownItemActive : ""
                    }`}
                    onClick={() => handleSelectTimeframe(opt.slug)}
                  >
                    <div>
                      <span className={styles.optionLabel}>{opt.label}</span>
                      <span className={styles.optionSubtext}>{opt.subLabel}</span>
                    </div>
                    {selectedTimeframe === opt.slug && (
                      <svg className={styles.activeCheck} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {/* Hero Metric & Emerald Growth Pill */}
      <div className={styles.heroRow}>
        <span className={styles.heroValuation}>{displayTotal}</span>
        {growthPercentage !== null && (
          <span
            className={styles.trendBadge}
            aria-label={`${growthPercentage >= 0 ? "+" : ""}${growthPercentage}% change this period`}
          >
            {growthPercentage > 0 ? (
              <>
                <span>+{growthPercentage}%</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </>
            ) : growthPercentage < 0 ? (
              <>
                <span>{growthPercentage}%</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </>
            ) : (
              "0.0%"
            )}
          </span>
        )}
      </div>

      {/* Interactive Spline Chart or Honest Empty State */}
      {points.length === 0 ? (
        <div className={styles.emptyChartState} role="status">
          No closed conversions recorded in this cadence window.
        </div>
      ) : (
      <div className={styles.chartContainer}>
        {/* Floating Tooltip Card */}
        {activeCoord && activeCoord.point && (
          <div
            className={styles.floatingTooltip}
            style={{ left: `${Math.max(12, Math.min(88, activeTooltipPercent))}%` }}
            aria-live="polite"
          >
            <span className={styles.tooltipText}>
              {activeCoord.point.fullPeriod || `${activeCoord.point.month} ${activeCoord.point.year}`} :{" "}
              {financials ? formatCrmCurrency(activeCoord.point.value) : "Confidential"}
            </span>
          </div>
        )}

        <div className={styles.svgWrapper}>
          <svg
            className={styles.splineSvg}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              {/* Restored Electric Blue Gradient Area Fill */}
              <linearGradient id={`earning-gradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.20" />
                <stop offset="60%" stopColor="#fb923c" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#fb923c" stopOpacity="0.00" />
              </linearGradient>
              <filter id={`beacon-glow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f97316" floodOpacity="0.4" />
              </filter>
            </defs>

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill={`url(#earning-gradient-${gradientId})`} />}

            {/* Spline Curve Stroke - Restored Electric Blue */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Vertical Dashed Stem connecting apex to baseline in Sky Blue */}
            {activeCoord && (
              <line
                x1={activeCoord.x}
                y1={activeCoord.y}
                x2={activeCoord.x}
                y2={baselineY}
                stroke="#fdba74"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Active Apex Beacon Halo & Dot */}
            {activeCoord && (
              <>
                <circle
                  cx={activeCoord.x}
                  cy={activeCoord.y}
                  r="8"
                  fill="#f97316"
                  fillOpacity="0.18"
                />
                <circle
                  cx={activeCoord.x}
                  cy={activeCoord.y}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  filter={`url(#beacon-glow-${gradientId})`}
                />
              </>
            )}

            {/* Invisible interactive hover hit areas for each point */}
            {coords.map((coord, idx) => (
              <rect
                key={`${coord.point.month}-${idx}`}
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
        </div>

        {/* X-Axis Month Legend - Aligned 1:1 with SVG paddingX (35/500 = 7.0%) */}
        <div className={styles.monthLabelsRow}>
          {points.map((pt, idx) => (
            <button
              key={`${pt.month}-${idx}`}
              type="button"
              className={`${styles.monthLabel} ${idx === safeActiveIndex ? styles.monthLabelActive : ""}`}
              onClick={() => setActiveIndex(idx)}
              onMouseEnter={() => setActiveIndex(idx)}
              aria-label={`View earnings for ${pt.month}`}
            >
              {pt.month}
            </button>
          ))}
        </div>
      </div>
      )}
    </article>
  );
};
