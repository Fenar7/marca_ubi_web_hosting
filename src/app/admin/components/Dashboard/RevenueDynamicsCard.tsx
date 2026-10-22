'use client';

/**
 * @file RevenueDynamicsCard.tsx
 * @description Revenue Dynamics & Commercial Velocity Card benchmarked against MedTrackr Report & Analytics.
 *              Integrates dual-state grouped vertical bars (Quota vs Actual Cash) and a Fritsch-Carlson
 *              monotone cubic Bézier spline curve in Marca Orange (#ff6100) ensuring C¹ continuity and zero overshoot.
 *              Interactive SVG scrub ray reveals a dark obsidian glassmorphism inspection tooltip.
 *              Dynamically adapts to incoming timeframe telemetry points (daily, weekly, monthly intervals).
 * @module admin/components/Dashboard/RevenueDynamicsCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useId, useEffect } from 'react';
import styles from './RevenueDynamicsCard.module.scss';

export interface MonthlyRevenueMetric {
  month: string;
  fullPeriod: string;
  quotaVal: number;       // In Lakhs (e.g. 12.0 = ₹12 Lakhs)
  cashVal: number;        // In Lakhs (e.g. 13.5 = ₹13.5 Lakhs)
  quotaFormatted: string;
  cashFormatted: string;
  attainmentPct: number;
}

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
 * 
 * Standard cubic spline interpolation produces unnatural oscillations and overshoot
 * between non-linear discrete financial milestones. The Fritsch-Carlson algorithm
 * restricts the Hermite derivatives (m_k) to guarantee monotonicity (zero overshoot)
 * and C¹ continuity, then converts Hermite segments to equivalent cubic Bézier control points:
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

export const RevenueDynamicsCard: React.FC<RevenueDynamicsCardProps> = ({
  dataPoints: dynamicData,
  timeframe,
  selectedPeriod: initialPeriod = '6 Months',
  onPeriodChange,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriod);
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState<boolean>(false);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [showQuota, setShowQuota] = useState<boolean>(true);
  const [showCash, setShowCash] = useState<boolean>(true);
  const [showCurve, setShowCurve] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const periodDropdownRef = useRef<HTMLDivElement>(null);

  const gradOrangeId = useId();
  const glowFilterId = useId();

  // Consume dynamic data points if provided; otherwise fallback to SIX_MONTH_DATA
  const dataPoints = dynamicData && dynamicData.length > 0 ? dynamicData : SIX_MONTH_DATA;
  const [activeIdx, setActiveIdx] = useState<number>(dataPoints.length - 1);

  // Keep activeIdx within range whenever dataPoints change
  useEffect(() => {
    setActiveIdx(dataPoints.length - 1);
  }, [dataPoints.length]);

  // SVG Geometry Dimensions
  const svgWidth = 720;
  const svgHeight = 280;
  const chartLeft = 60;
  const chartRight = 690;
  const chartTop = 24;
  const chartBottom = 230;
  const chartHeight = chartBottom - chartTop;

  // Dynamically compute max ceiling based on largest metric
  const calculatedMax = Math.max(
    ...dataPoints.map((d) => Math.max(d.quotaVal, d.cashVal)),
    5
  );
  const maxMetricVal = Math.ceil(calculatedMax * 1.25);

  const totalPoints = dataPoints.length;
  const stepX = (chartRight - chartLeft) / totalPoints;

  // Compute cartesian coordinates for markers
  const monthlySlots = dataPoints.map((item, i) => {
    const centerX = chartLeft + i * stepX + stepX / 2;
    const quotaY = chartBottom - (item.quotaVal / maxMetricVal) * chartHeight;
    const cashY = chartBottom - (item.cashVal / maxMetricVal) * chartHeight;
    return {
      centerX,
      quotaY,
      cashY,
      quotaHeight: chartBottom - quotaY,
      cashHeight: chartBottom - cashY,
    };
  });

  // Calculate curve points targeting the Actual Cash coordinates
  const curvePoints: Point2D[] = monthlySlots.map((s) => ({
    x: s.centerX,
    y: s.cashY,
  }));

  const bezierCurvePath = generateMonotoneBezierPath(curvePoints);
  const areaPath = curvePoints.length > 0
    ? `${bezierCurvePath} L ${curvePoints[curvePoints.length - 1].x.toFixed(2)} ${chartBottom} L ${curvePoints[0].x.toFixed(2)} ${chartBottom} Z`
    : '';

  // Active scrub point
  const safeIdx = Math.max(0, Math.min(activeIdx, dataPoints.length - 1));
  const currentSlot = monthlySlots[safeIdx] || monthlySlots[monthlySlots.length - 1];
  const currentMetric = dataPoints[safeIdx] || dataPoints[dataPoints.length - 1];

  // Tooltip dynamic left percentage
  const tooltipLeftPercent = currentSlot ? (currentSlot.centerX / svgWidth) * 100 : 50;

  // Handle outside click for period dropdown
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

  // Pointer scrubbing handler across the SVG horizontal axis
  const handlePointerScrub = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const svgRelX = (relX / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDistance = Number.POSITIVE_INFINITY;

    monthlySlots.forEach((slot, idx) => {
      const dist = Math.abs(slot.centerX - svgRelX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    setActiveIdx(closestIdx);
    setIsScrubbing(true);
  };

  // Generate 5 dynamic horizontal grid levels
  const gridFractions = [1, 0.8, 0.6, 0.4, 0.2, 0];
  const gridLines = gridFractions.map((frac) => {
    const val = Math.round(maxMetricVal * frac * 10) / 10;
    return {
      label: val === 0 ? '₹0' : `₹${val}L`,
      y: chartBottom - frac * chartHeight,
    };
  });

  return (
    <div className={styles.chartCard} aria-label="Revenue Dynamics and Forecast Card">
      {/* Header */}
      <div className={styles.chartHeader}>
        <div className={styles.titleCluster}>
          <h2 className={styles.title}>Revenue Dynamics & Forecast</h2>
          <p className={styles.subtitle}>
            Quota baseline vs actual cash collection & growth velocity{timeframe ? ` (${timeframe})` : ''}.
          </p>
        </div>

        <div className={styles.headerControls}>
          {/* Interactive Legend */}
          <div className={styles.legendCluster} role="group" aria-label="Toggle chart series">
            <div
              className={`${styles.legendItem} ${!showQuota ? styles.inactive : ''}`}
              onClick={() => setShowQuota((prev) => !prev)}
              role="button"
              tabIndex={0}
              aria-label="Toggle Target Quota series"
            >
              <span className={styles.legendSwatchQuota} />
              <span>Target Quota</span>
            </div>

            <div
              className={`${styles.legendItem} ${!showCash ? styles.inactive : ''}`}
              onClick={() => setShowCash((prev) => !prev)}
              role="button"
              tabIndex={0}
              aria-label="Toggle Collected Cash series"
            >
              <span className={styles.legendSwatchCash} />
              <span>Collected Cash</span>
            </div>

            <div
              className={`${styles.legendItem} ${!showCurve ? styles.inactive : ''}`}
              onClick={() => setShowCurve((prev) => !prev)}
              role="button"
              tabIndex={0}
              aria-label="Toggle Growth Curve overlay"
            >
              <span className={styles.legendSwatchCurve} />
              <span>Growth Curve</span>
            </div>
          </div>

          {/* Period Selector Dropdown */}
          <div className={styles.periodDropdownWrapper} ref={periodDropdownRef}>
            <button
              type="button"
              className={styles.periodDropdownTrigger}
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

      {/* SVG Canvas Area */}
      <div
        className={styles.chartCanvasContainer}
        ref={containerRef}
        onPointerMove={(e) => handlePointerScrub(e.clientX)}
        onPointerDown={(e) => handlePointerScrub(e.clientX)}
        onPointerLeave={() => setIsScrubbing(false)}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={styles.chartSvg}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/* Specular Glow Filter for Marca Orange Curve */}
            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="3.5" floodColor="#ff6100" floodOpacity="0.38" />
            </filter>

            {/* Gradient under Curve */}
            <linearGradient id={gradOrangeId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6100" stopOpacity="0.14" />
              <stop offset="90%" stopColor="#ff6100" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & Y-Axis Tabular Labels */}
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
                x={chartLeft - 10}
                y={grid.y + 4}
                textAnchor="end"
                className={styles.axisText}
              >
                {grid.label}
              </text>
            </g>
          ))}

          {/* Grouped Vertical Bars */}
          {monthlySlots.map((slot, i) => {
            const barWidth = 14;
            const barGap = 4;
            const quotaBarX = slot.centerX - barWidth - barGap / 2;
            const cashBarX = slot.centerX + barGap / 2;
            const isHovered = i === safeIdx && isScrubbing;

            return (
              <g key={`bars-${i}`} className={isHovered ? styles.barGroupActive : styles.barGroup}>
                {/* Quota Bar (Muted Cool Lavender Slate) */}
                {showQuota && (
                  <rect
                    x={quotaBarX}
                    y={slot.quotaY}
                    width={barWidth}
                    height={Math.max(2, slot.quotaHeight)}
                    rx={3}
                    className={styles.barQuota}
                  />
                )}

                {/* Actual Cash Bar (Crisp Slate Charcoal) */}
                {showCash && (
                  <rect
                    x={cashBarX}
                    y={slot.cashY}
                    width={barWidth}
                    height={Math.max(2, slot.cashHeight)}
                    rx={3}
                    className={styles.barCash}
                  />
                )}

                {/* X-Axis Milestone Label */}
                <text
                  x={slot.centerX}
                  y={chartBottom + 20}
                  textAnchor="middle"
                  className={`${styles.xAxisLabel} ${isHovered ? styles.activeLabel : ''}`}
                >
                  {dataPoints[i].month}
                </text>
              </g>
            );
          })}

          {/* Area Fill Under Spline Curve */}
          {showCurve && areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradOrangeId})`}
              className={styles.splineArea}
            />
          )}

          {/* Monotone Spline Curve Line */}
          {showCurve && bezierCurvePath && (
            <path
              d={bezierCurvePath}
              className={styles.splineLine}
              filter={`url(#${glowFilterId})`}
            />
          )}

          {/* Interactive Scrub Ray & Node */}
          {currentSlot && showCurve && (
            <g className={styles.scrubIndicator}>
              <line
                x1={currentSlot.centerX}
                y1={chartTop}
                x2={currentSlot.centerX}
                y2={chartBottom}
                className={styles.scrubRay}
              />
              <circle
                cx={currentSlot.centerX}
                cy={currentSlot.cashY}
                r={5.5}
                className={styles.scrubNodeOuter}
              />
              <circle
                cx={currentSlot.centerX}
                cy={currentSlot.cashY}
                r={2.5}
                className={styles.scrubNodeInner}
              />
            </g>
          )}
        </svg>

        {/* Hover / Scrub Inspection Tooltip */}
        {currentMetric && currentSlot && (
          <div
            className={styles.chartTooltip}
            style={{
              left: `${tooltipLeftPercent}%`,
              transform: tooltipLeftPercent > 75 ? 'translateX(-100%)' : tooltipLeftPercent < 25 ? 'translateX(0)' : 'translateX(-50%)',
            }}
          >
            <div className={styles.tooltipHeader}>
              <span className={styles.tooltipPeriod}>{currentMetric.fullPeriod}</span>
              <span
                className={`${styles.tooltipAttainment} ${
                  currentMetric.attainmentPct >= 100 ? styles.positiveAttainment : styles.negativeAttainment
                }`}
              >
                {currentMetric.attainmentPct.toFixed(1)}% Attainment
              </span>
            </div>

            <div className={styles.tooltipRows}>
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipLabel}>
                  <span className={styles.dotQuota} /> Target Quota:
                </span>
                <span className={styles.tooltipVal}>{currentMetric.quotaFormatted}</span>
              </div>
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipLabel}>
                  <span className={styles.dotCash} /> Actual Cash:
                </span>
                <span className={styles.tooltipVal}>{currentMetric.cashFormatted}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
