'use client';

/**
 * @file RevenueDynamicsCard.tsx
 * @description Revenue Dynamics & Performance Engine benchmarked against the Logip luxury dashboard.
 *              Eliminates noisy HUD ribbon boxes and clashing vertical pillar bars in favor of
 *              pure dual-spline continuous Bézier geometry, translucent area wash, minimalist
 *              Cartesian gridlines, and a sleek dark obsidian floating inspection tooltip.
 *              Strictly enforces Fritsch-Carlson C¹ continuity with zero polynomial overshoot.
 * @module admin/components/Dashboard/RevenueDynamicsCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useId, useEffect, useMemo, useCallback } from 'react';
import type { MonthlyRevenueMetric } from './types';
export type { MonthlyRevenueMetric } from './types';
import styles from './RevenueDynamicsCard.module.scss';

export interface RevenueDynamicsCardProps {
  /** Dynamic time-series milestone points matching active timeframe */
  dataPoints?: MonthlyRevenueMetric[];
  /** Active timeframe window slug or label */
  timeframe?: string;
  /** Active period dropdown label */
  selectedPeriod?: string;
  /** Notification hook on period change */
  onPeriodChange?: (period: string) => void;
}

interface Point2D {
  x: number;
  y: number;
}

const SIX_MONTH_DATA: MonthlyRevenueMetric[] = [
  {
    month: 'May',
    fullPeriod: 'May 2026',
    quotaVal: 12.0,
    cashVal: 13.5,
    quotaFormatted: '₹12,00,000',
    cashFormatted: '₹13,50,000',
    attainmentPct: 112.5,
  },
  {
    month: 'Jun',
    fullPeriod: 'Jun 2026',
    quotaVal: 14.0,
    cashVal: 13.8,
    quotaFormatted: '₹14,00,000',
    cashFormatted: '₹13,80,000',
    attainmentPct: 98.6,
  },
  {
    month: 'Jul',
    fullPeriod: 'Jul 2026',
    quotaVal: 15.0,
    cashVal: 17.2,
    quotaFormatted: '₹15,00,000',
    cashFormatted: '₹17,20,000',
    attainmentPct: 114.7,
  },
  {
    month: 'Aug',
    fullPeriod: 'Aug 2026',
    quotaVal: 16.0,
    cashVal: 19.5,
    quotaFormatted: '₹16,00,000',
    cashFormatted: '₹19,50,000',
    attainmentPct: 121.9,
  },
  {
    month: 'Sep',
    fullPeriod: 'Sep 2026',
    quotaVal: 16.5,
    cashVal: 17.4,
    quotaFormatted: '₹16,50,000',
    cashFormatted: '₹17,40,000',
    attainmentPct: 105.5,
  },
  {
    month: 'Oct',
    fullPeriod: 'Oct 2026',
    quotaVal: 18.0,
    cashVal: 20.5,
    quotaFormatted: '₹18,00,000',
    cashFormatted: '₹20,50,000',
    attainmentPct: 113.9,
  },
];

const PERIOD_OPTIONS = ['3 Months', '6 Months', '12 Months', 'YTD'];

/**
 * Fritsch-Carlson Monotone Cubic Spline to Bézier Path Generator.
 * Computes monotonic Hermite derivatives to eliminate artificial polynomial oscillation,
 * then maps Hermite tangents directly to cubic Bézier control points:
 *   CP1 = (x_k + h_k / 3, y_k + (m_k * h_k) / 3)
 *   CP2 = (x_{k+1} - h_k / 3, y_{k+1} - (m_{k+1} * h_k) / 3)
 */
function generateMonotoneBezierPath(points: Point2D[]): string {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  const dx: number[] = new Array(n - 1);
  const dy: number[] = new Array(n - 1);
  const secants: number[] = new Array(n - 1);

  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x;
    dy[i] = points[i + 1].y - points[i].y;
    secants[i] = dx[i] !== 0 ? dy[i] / dx[i] : 0;
  }

  const m: number[] = new Array(n);
  m[0] = secants[0];
  for (let i = 1; i < n - 1; i++) {
    if (secants[i - 1] * secants[i] <= 0) {
      m[i] = 0;
    } else {
      m[i] = (secants[i - 1] + secants[i]) / 2;
    }
  }
  m[n - 1] = secants[n - 2];

  for (let i = 0; i < n - 1; i++) {
    if (dy[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }

    const alpha = m[i] / secants[i];
    const beta = m[i + 1] / secants[i];

    if (alpha < 0) m[i] = 0;
    if (beta < 0) m[i + 1] = 0;

    const hyp = Math.hypot(alpha, beta);
    if (hyp > 3) {
      const tau = 3 / hyp;
      m[i] = tau * alpha * secants[i];
      m[i + 1] = tau * beta * secants[i];
    }
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const h = dx[i];

    const cp1x = p0.x + h / 3;
    const cp1y = p0.y + (m[i] * h) / 3;
    const cp2x = p1.x - h / 3;
    const cp2y = p1.y - (m[i + 1] * h) / 3;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }

  return path;
}

function formatLakhsCurrency(valInLakhs: number): string {
  const absoluteRupees = Math.round(valInLakhs * 100000);
  return `₹${absoluteRupees.toLocaleString('en-IN')}`;
}

export const RevenueDynamicsCard: React.FC<RevenueDynamicsCardProps> = ({
  dataPoints = SIX_MONTH_DATA,
  timeframe = 'Last 30 Days',
  selectedPeriod: initialPeriod = '6 Months',
  onPeriodChange,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriod);
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState<boolean>(false);
  const [showCash, setShowCash] = useState<boolean>(true);
  const [showQuota, setShowQuota] = useState<boolean>(true);
  const [activeIdx, setActiveIdx] = useState<number>(dataPoints.length - 1);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const periodDropdownRef = useRef<HTMLDivElement>(null);

  // Sanitize React 19 useId() tokens into valid W3C XML NCName strings
  const rawId = useId();
  const safeId = useMemo(() => rawId.replace(/[^a-zA-Z0-9_-]/g, ''), [rawId]);
  const primaryAreaGradId = `rdc-area-grad-${safeId}`;
  const pulseFilterId = `rdc-glow-${safeId}`;

  // Palette tokens calibrated for dark luxury & high contrast
  const cashColor = '#0284c7'; // Deep Ocean Sky (WCAG AA 4.54:1)
  const quotaColor = '#f97316'; // Warm Coral / Amber baseline

  // Cumulative performance telemetry
  const totalCashCollected = useMemo(
    () => dataPoints.reduce((acc, curr) => acc + curr.cashVal, 0),
    [dataPoints]
  );
  const totalTargetQuota = useMemo(
    () => dataPoints.reduce((acc, curr) => acc + curr.quotaVal, 0),
    [dataPoints]
  );
  const cumulativeAttainment = totalTargetQuota > 0
    ? (totalCashCollected / totalTargetQuota) * 100
    : 0;

  // SVG Cartesian Geometry Dimensions
  const svgWidth = 720;
  const svgHeight = 260;
  const chartLeft = 56;
  const chartRight = 684;
  const chartTop = 28;
  const chartBottom = 210;
  const chartHeight = chartBottom - chartTop;

  const maxVal = useMemo(() => {
    const highest = Math.max(
      ...dataPoints.map((d) => Math.max(d.cashVal, d.quotaVal)),
      5
    );
    return Math.ceil(highest * 1.25);
  }, [dataPoints]);

  const stepX = (chartRight - chartLeft) / Math.max(dataPoints.length - 1, 1);

  const cashCoords: Point2D[] = dataPoints.map((d, i) => ({
    x: chartLeft + i * stepX,
    y: chartBottom - (d.cashVal / maxVal) * chartHeight,
  }));

  const quotaCoords: Point2D[] = dataPoints.map((d, i) => ({
    x: chartLeft + i * stepX,
    y: chartBottom - (d.quotaVal / maxVal) * chartHeight,
  }));

  const cashSplinePath = generateMonotoneBezierPath(cashCoords);
  const quotaSplinePath = generateMonotoneBezierPath(quotaCoords);

  const cashAreaPath = cashCoords.length > 0
    ? `${cashSplinePath} L ${cashCoords[cashCoords.length - 1].x.toFixed(2)} ${chartBottom} L ${cashCoords[0].x.toFixed(2)} ${chartBottom} Z`
    : '';

  const safeIdx = Math.max(0, Math.min(activeIdx, dataPoints.length - 1));
  const activeCashPoint = cashCoords[safeIdx];
  const activeQuotaPoint = quotaCoords[safeIdx];
  const activeData = dataPoints[safeIdx];

  // Tooltip horizontal coordinate clamped between 10% and 90%
  const rawLeftPercent = activeCashPoint ? (activeCashPoint.x / svgWidth) * 100 : 50;
  const clampedTooltipLeft = Math.max(10, Math.min(90, rawLeftPercent));

  // Dismiss period dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        periodDropdownRef.current &&
        !periodDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPeriodMenuOpen(false);
      }
    }
    if (isPeriodMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPeriodMenuOpen]);

  // Pointer scrubbing handler across horizontal axis
  const handlePointerScrub = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const svgRelX = (relX / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDistance = Number.POSITIVE_INFINITY;
    cashCoords.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - svgRelX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    setActiveIdx(closestIdx);
    setIsHovered(true);
  }, [cashCoords, svgWidth]);

  // Horizontal Gridlines & Y-Axis Tabular Labels
  const gridSteps = 4;
  const gridLines = Array.from({ length: gridSteps + 1 }).map((_, idx) => {
    const val = (maxVal / gridSteps) * (gridSteps - idx);
    const yPos = chartTop + (idx * chartHeight) / gridSteps;
    return {
      val,
      y: yPos,
      label: val === 0 ? '₹0' : `₹${val.toFixed(1).replace(/\.0$/, '')}L`,
    };
  });

  const slotVariance = activeData ? activeData.cashVal - activeData.quotaVal : 0;
  const isPositiveVariance = slotVariance >= 0;

  return (
    <div className={styles.performanceCard}>
      {/* Header Bar: Clean Title & Refined Controls */}
      <div className={styles.cardHeader}>
        <div className={styles.titleCluster}>
          <h2 className={styles.title}>Performance</h2>
          <p className={styles.subtitle}>
            Cash collections vs target quota trajectory ({timeframe}).
          </p>
        </div>

        <div className={styles.headerControls}>
          {/* Minimalist Legend Swatches */}
          <div className={styles.legendCluster} role="group" aria-label="Toggle chart series">
            <button
              type="button"
              className={`${styles.legendPill} ${!showCash ? styles.legendInactive : ''}`}
              onClick={() => setShowCash((prev) => !prev)}
              aria-label="Toggle Realized Cash series"
            >
              <span className={styles.swatchCash} style={{ backgroundColor: cashColor }} />
              <span>Realized Cash</span>
            </button>

            <button
              type="button"
              className={`${styles.legendPill} ${!showQuota ? styles.legendInactive : ''}`}
              onClick={() => setShowQuota((prev) => !prev)}
              aria-label="Toggle Target Quota series"
            >
              <span className={styles.swatchQuota} style={{ backgroundColor: quotaColor }} />
              <span>Target Quota</span>
            </button>
          </div>

          {/* Period Selector Dropdown Pill */}
          <div className={styles.periodDropdownWrapper} ref={periodDropdownRef}>
            <button
              type="button"
              className={styles.periodPill}
              onClick={() => setIsPeriodMenuOpen(!isPeriodMenuOpen)}
              aria-expanded={isPeriodMenuOpen}
              aria-haspopup="menu"
              aria-label="Select revenue display period"
            >
              <span>{selectedPeriod}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isPeriodMenuOpen && (
              <div className={styles.periodMenu} role="menu">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    role="menuitem"
                    className={`${styles.periodMenuItem} ${opt === selectedPeriod ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedPeriod(opt);
                      setIsPeriodMenuOpen(false);
                      onPeriodChange?.(opt);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integrated Performance Headline (Clean, Zero Clutter) */}
      <div className={styles.headlineRow}>
        <div className={styles.headlineMetrics}>
          <span className={styles.headlineCash}>{formatLakhsCurrency(totalCashCollected)}</span>
          <span className={styles.deltaPill}>
            ▲ {cumulativeAttainment.toFixed(1)}% Attained
          </span>
        </div>
        <div className={styles.headlineBaseline}>
          <span>Target Quota: <strong>{formatLakhsCurrency(totalTargetQuota)}</strong></span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        className={styles.canvasContainer}
        ref={containerRef}
        onPointerMove={(e) => handlePointerScrub(e.clientX)}
        onPointerDown={(e) => handlePointerScrub(e.clientX)}
        onPointerLeave={() => setIsHovered(false)}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={styles.chartSvg}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/* Translucent Area Wash Gradient */}
            <linearGradient id={primaryAreaGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cashColor} stopOpacity="0.12" />
              <stop offset="100%" stopColor={cashColor} stopOpacity="0.00" />
            </linearGradient>

            {/* Specular Pulse Filter */}
            <filter id={pulseFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={cashColor} floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Minimalist Horizontal Dotted Gridlines & Y-Axis Labels */}
          {gridLines.map((grid, idx) => (
            <g key={`grid-${idx}`}>
              <line
                x1={chartLeft}
                y1={grid.y}
                x2={chartRight}
                y2={grid.y}
                className={styles.gridLine}
              />
              <text
                x={chartLeft - 12}
                y={grid.y + 4}
                textAnchor="end"
                className={styles.yAxisText}
              >
                {grid.label}
              </text>
            </g>
          ))}

          {/* Translucent Area Wash beneath Realized Cash Spline */}
          {showCash && cashAreaPath && (
            <path
              d={cashAreaPath}
              fill={`url(#${primaryAreaGradId})`}
              stroke="none"
              className={styles.areaWashPath}
            />
          )}

          {/* Baseline Curve: Target Quota Spline */}
          {showQuota && quotaSplinePath && (
            <path
              d={quotaSplinePath}
              fill="none"
              stroke={quotaColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.quotaSpline}
            />
          )}

          {/* Primary Curve: Realized Cash Spline */}
          {showCash && cashSplinePath && (
            <path
              d={cashSplinePath}
              fill="none"
              stroke={cashColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.cashSpline}
            />
          )}

          {/* X-Axis Milestone Labels */}
          {dataPoints.map((item, i) => (
            <text
              key={`x-${i}`}
              x={cashCoords[i]?.x}
              y={chartBottom + 22}
              textAnchor="middle"
              className={`${styles.xAxisText} ${i === safeIdx && isHovered ? styles.activeX : ''}`}
            >
              {item.month}
            </text>
          ))}

          {/* Dotted Vertical Crosshair Scrubber with Concentric Pulse Ring */}
          {isHovered && activeCashPoint && (
            <g className={styles.scrubberGroup}>
              {/* Hairline Dotted Guideline */}
              <line
                x1={activeCashPoint.x}
                y1={chartTop}
                x2={activeCashPoint.x}
                y2={chartBottom}
                className={styles.crosshairGuide}
              />

              {/* Target Quota Node */}
              {showQuota && activeQuotaPoint && (
                <circle
                  cx={activeQuotaPoint.x}
                  cy={activeQuotaPoint.y}
                  r={4}
                  fill="#ffffff"
                  stroke={quotaColor}
                  strokeWidth={2}
                />
              )}

              {/* Realized Cash Concentric Pulse Aura */}
              {showCash && (
                <>
                  <circle
                    cx={activeCashPoint.x}
                    cy={activeCashPoint.y}
                    r={12}
                    fill="rgba(2, 132, 199, 0.15)"
                    stroke="rgba(2, 132, 199, 0.40)"
                    strokeWidth={1.5}
                    className={styles.pulseAura}
                  />
                  <circle
                    cx={activeCashPoint.x}
                    cy={activeCashPoint.y}
                    r={5.5}
                    fill="#ffffff"
                    stroke={cashColor}
                    strokeWidth={2.5}
                  />
                  <circle
                    cx={activeCashPoint.x}
                    cy={activeCashPoint.y}
                    r={2.5}
                    fill={cashColor}
                  />
                </>
              )}
            </g>
          )}
        </svg>

        {/* Sleek Logip Obsidian Dark Tooltip Card */}
        {isHovered && activeData && activeCashPoint && (
          <div
            className={styles.obsidianTooltip}
            style={{
              left: `${clampedTooltipLeft}%`,
              transform:
                clampedTooltipLeft > 75
                  ? 'translateX(-100%)'
                  : clampedTooltipLeft < 25
                  ? 'translateX(0)'
                  : 'translateX(-50%)',
            }}
            role="tooltip"
            aria-live="polite"
          >
            <div className={styles.tooltipHeader}>
              <span className={styles.tooltipPeriod}>{activeData.fullPeriod}</span>
              <span className={`${styles.tooltipAttainmentPill} ${activeData.attainmentPct >= 100 ? styles.pillPositive : styles.pillNegative}`}>
                {activeData.attainmentPct.toFixed(1)}% Attained
              </span>
            </div>

            <div className={styles.tooltipBody}>
              <div className={styles.tooltipRow}>
                <div className={styles.tooltipLabelCluster}>
                  <span className={styles.accentBarCash} style={{ backgroundColor: cashColor }} />
                  <span>Realized Cash</span>
                </div>
                <span className={styles.tooltipVal}>{activeData.cashFormatted}</span>
              </div>

              <div className={styles.tooltipRow}>
                <div className={styles.tooltipLabelCluster}>
                  <span className={styles.accentBarQuota} style={{ backgroundColor: quotaColor }} />
                  <span>Target Quota</span>
                </div>
                <span className={styles.tooltipVal}>{activeData.quotaFormatted}</span>
              </div>
            </div>

            <div className={styles.tooltipFooter}>
              <span className={styles.varianceLabel}>Net Period Variance:</span>
              <span className={`${styles.varianceValue} ${isPositiveVariance ? styles.variancePositive : styles.varianceNegative}`}>
                {isPositiveVariance ? `+${formatLakhsCurrency(slotVariance)}` : `-${formatLakhsCurrency(Math.abs(slotVariance))}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
