'use client';

/**
 * @file RevenueDynamicsCard.tsx
 * @description Revenue Dynamics & Commercial Velocity Card benchmarked against Stripe Scorecards and Ramp Obsidian HUD.
 *              Integrates an Executive Telemetry HUD ribbon (Cumulative Realized Cash, Target Quota, Attainment Rate,
 *              Net Period Variance), dual-state vertical bars with subtle architectural gradients, a Fritsch-Carlson
 *              monotone cubic Bézier spline curve in Marca Orange (#ff6100) ensuring C¹ continuity and zero overshoot,
 *              and an interactive obsidian glassmorphic inspection HUD with collision boundary clamping.
 *              Guarantees defensive inline SVG presentation fallbacks to eliminate W3C initial default black fills.
 * @module admin/components/Dashboard/RevenueDynamicsCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useId, useEffect, useMemo } from 'react';
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
 * Restricts Hermite derivatives (m_k) to guarantee monotonicity (zero overshoot)
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

function formatLakhsCurrency(valInLakhs: number): string {
  const rupees = Math.round(valInLakhs * 100000);
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export const RevenueDynamicsCard: React.FC<RevenueDynamicsCardProps> = ({
  dataPoints = SIX_MONTH_DATA,
  timeframe = 'Last 30 Days',
  selectedPeriod: initialPeriod = '6 Months',
  onPeriodChange,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriod);
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState<boolean>(false);
  const [showQuota, setShowQuota] = useState<boolean>(true);
  const [showCash, setShowCash] = useState<boolean>(true);
  const [showCurve, setShowCurve] = useState<boolean>(true);
  const [activeIdx, setActiveIdx] = useState<number>(dataPoints.length - 1);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const periodDropdownRef = useRef<HTMLDivElement>(null);

  // XML NCName sanitized identifier for React 19 gradient paint servers
  const rawId = useId();
  const safeId = useMemo(() => rawId.replace(/[^a-zA-Z0-9_-]/g, ''), [rawId]);
  const gradQuotaId = `rdc-grad-quota-${safeId}`;
  const gradCashId = `rdc-grad-cash-${safeId}`;
  const gradCashActiveId = `rdc-grad-cash-active-${safeId}`;
  const gradOrangeId = `rdc-grad-orange-${safeId}`;
  const glowFilterId = `rdc-glow-${safeId}`;

  // Keep active index clamped within bounds when dataset length updates
  useEffect(() => {
    setActiveIdx(dataPoints.length - 1);
  }, [dataPoints.length]);

  // Executive Telemetry Ribbon Calculations
  const { totalCashCollected, totalTargetQuota, cumulativeAttainment, netPeriodVariance } = useMemo(() => {
    const totalCash = dataPoints.reduce((acc, d) => acc + d.cashVal, 0);
    const totalQuota = dataPoints.reduce((acc, d) => acc + d.quotaVal, 0);
    const attainment = totalQuota > 0 ? (totalCash / totalQuota) * 100 : 100;
    const variance = totalCash - totalQuota;
    return {
      totalCashCollected: totalCash,
      totalTargetQuota: totalQuota,
      cumulativeAttainment: attainment,
      netPeriodVariance: variance,
    };
  }, [dataPoints]);

  // Cartesian SVG ViewBox geometry dimensions
  const svgWidth = 720;
  const svgHeight = 280;
  const chartLeft = 60;
  const chartRight = 690;
  const chartTop = 24;
  const chartBottom = 230;
  const chartHeight = chartBottom - chartTop;

  // Dynamic max ceiling calculation with 25% headroom
  const calculatedMax = Math.max(
    ...dataPoints.map((d) => Math.max(d.quotaVal, d.cashVal)),
    5
  );
  const maxMetricVal = Math.ceil(calculatedMax * 1.25);

  const totalPoints = dataPoints.length;
  const stepX = (chartRight - chartLeft) / totalPoints;

  // Cartesian coordinates for bars and spline curve nodes
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

  const curvePoints: Point2D[] = monthlySlots.map((s) => ({
    x: s.centerX,
    y: s.cashY,
  }));

  const bezierCurvePath = generateMonotoneBezierPath(curvePoints);
  const areaPath = curvePoints.length > 0
    ? `${bezierCurvePath} L ${curvePoints[curvePoints.length - 1].x.toFixed(2)} ${chartBottom} L ${curvePoints[0].x.toFixed(2)} ${chartBottom} Z`
    : '';

  const safeIdx = Math.max(0, Math.min(activeIdx, dataPoints.length - 1));
  const currentSlot = monthlySlots[safeIdx] || monthlySlots[monthlySlots.length - 1];
  const currentMetric = dataPoints[safeIdx] || dataPoints[dataPoints.length - 1];

  // Tooltip horizontal percentage clamped between 10% and 90%
  const rawLeftPercent = currentSlot ? (currentSlot.centerX / svgWidth) * 100 : 50;
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

  // Y-Axis reference grid line intervals
  const gridSteps = 5;
  const gridLines = Array.from({ length: gridSteps + 1 }).map((_, idx) => {
    const val = (maxMetricVal / gridSteps) * (gridSteps - idx);
    const yPos = chartTop + (idx * chartHeight) / gridSteps;
    return {
      val,
      y: yPos,
      label: val === 0 ? '₹0' : `₹${val.toFixed(1).replace(/\.0$/, '')}L`,
    };
  });

  const slotVarianceVal = currentMetric ? currentMetric.cashVal - currentMetric.quotaVal : 0;
  const isPositiveSlotVariance = slotVarianceVal >= 0;

  return (
    <div className={styles.chartCard}>
      {/* Header Bar */}
      <div className={styles.chartHeader}>
        <div className={styles.titleCluster}>
          <h2 className={styles.title}>Revenue Dynamics & Forecast</h2>
          <p className={styles.subtitle}>
            Quota baseline vs actual cash collection & growth velocity ({timeframe}).
          </p>
        </div>

        <div className={styles.headerControls}>
          {/* Interactive Legend Switches */}
          <div className={styles.legendCluster} role="group" aria-label="Toggle chart series">
            <div
              className={`${styles.legendItem} ${!showQuota ? styles.inactive : ''}`}
              onClick={() => setShowQuota((prev) => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowQuota((prev) => !prev);
                }
              }}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowCash((prev) => !prev);
                }
              }}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowCurve((prev) => !prev);
                }
              }}
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

      {/* Executive Header HUD Ribbon (Stripe Scorecards Benchmark) */}
      <div className={styles.hudRibbon} aria-label="Executive revenue performance metrics">
        <div className={styles.hudMetricItem}>
          <span className={styles.hudMetricLabel}>Cash Realized</span>
          <span className={styles.hudMetricValue}>{formatLakhsCurrency(totalCashCollected)}</span>
        </div>
        <div className={styles.hudMetricItem}>
          <span className={styles.hudMetricLabel}>Target Quota</span>
          <span className={styles.hudMetricSubValue}>{formatLakhsCurrency(totalTargetQuota)}</span>
        </div>
        <div className={styles.hudMetricItem}>
          <span className={styles.hudMetricLabel}>Attainment Rate</span>
          <span className={`${styles.hudAttainmentBadge} ${cumulativeAttainment >= 100 ? styles.positiveAttainment : styles.negativeAttainment}`}>
            <span className={styles.statusDot} />
            {cumulativeAttainment.toFixed(1)}% Attained
          </span>
        </div>
        <div className={styles.hudMetricItem}>
          <span className={styles.hudMetricLabel}>Net Variance</span>
          <div className={styles.hudVarianceCluster}>
            <span className={`${styles.hudVarianceToken} ${netPeriodVariance >= 0 ? styles.positiveVariance : styles.negativeVariance}`}>
              {netPeriodVariance >= 0 ? `+${formatLakhsCurrency(netPeriodVariance)}` : `-${formatLakhsCurrency(Math.abs(netPeriodVariance))}`}
            </span>
            <span className={`${styles.hudVarianceSubtitle} ${netPeriodVariance >= 0 ? styles.positiveSubtitle : styles.negativeSubtitle}`}>
              {netPeriodVariance >= 0 ? 'Over Quota' : 'Under Quota'}
            </span>
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
            {/* Quota Ghost Bar Gradient */}
            <linearGradient id={gradQuotaId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0.5" />
            </linearGradient>

            {/* Collected Cash Pillar Gradient (Midnight Obsidian) */}
            <linearGradient id={gradCashId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="1" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
            </linearGradient>

            {/* Active Hover Cash Pillar Gradient (Marca Orange Glow) */}
            <linearGradient id={gradCashActiveId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6100" stopOpacity="1" />
              <stop offset="100%" stopColor="#e05500" stopOpacity="1" />
            </linearGradient>

            {/* Specular Glow Filter for Marca Orange Curve */}
            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="3.5" floodColor="#ff6100" floodOpacity="0.42" />
            </filter>

            {/* Gradient under Curve */}
            <linearGradient id={gradOrangeId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6100" stopOpacity="0.16" />
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

          {/* Grouped Vertical Bars with Defensive Inline Fills */}
          {monthlySlots.map((slot, i) => {
            const barWidth = 14;
            const barGap = 4;
            const quotaBarX = slot.centerX - barWidth - barGap / 2;
            const cashBarX = slot.centerX + barGap / 2;
            const isHovered = i === safeIdx && isScrubbing;

            return (
              <g key={`bars-${i}`} className={isHovered ? styles.barGroupActive : styles.barGroup}>
                {/* Quota Bar (Muted Cool Lavender Slate #e2e8f0 with subtle hairline cap) */}
                {showQuota && (
                  <rect
                    x={quotaBarX}
                    y={slot.quotaY}
                    width={barWidth}
                    height={Math.max(2, slot.quotaHeight)}
                    rx={3}
                    fill={`url(#${gradQuotaId})`}
                    stroke="#cbd5e1"
                    strokeWidth={0.5}
                    className={styles.barQuota}
                  />
                )}

                {/* Actual Cash Bar (Crisp Slate Charcoal #0f172a, illuminates on hover) */}
                {showCash && (
                  <rect
                    x={cashBarX}
                    y={slot.cashY}
                    width={barWidth}
                    height={Math.max(2, slot.cashHeight)}
                    rx={3}
                    fill={isHovered ? `url(#${gradCashActiveId})` : `url(#${gradCashId})`}
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
                  {dataPoints[i]?.month}
                </text>
              </g>
            );
          })}

          {/* Area Wash under Cubic Bézier Spline */}
          {showCurve && areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradOrangeId})`}
              stroke="none"
              className={styles.splineArea}
            />
          )}

          {/* Fritsch-Carlson Monotone Cubic Bézier Spline Curve with Defensive Inline Stroke */}
          {showCurve && bezierCurvePath && (
            <path
              d={bezierCurvePath}
              fill="none"
              stroke="#ff6100"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowFilterId})`}
              className={styles.splineLine}
            />
          )}

          {/* Interactive Scrub Ray & Target Node */}
          {currentSlot && (
            <g className={styles.scrubGroup}>
              <line
                x1={currentSlot.centerX}
                y1={chartTop}
                x2={currentSlot.centerX}
                y2={chartBottom}
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                className={styles.scrubRay}
              />
              <circle
                cx={currentSlot.centerX}
                cy={currentSlot.cashY}
                r={6}
                fill="#ffffff"
                stroke="#ff6100"
                strokeWidth={2.5}
                className={styles.scrubNodeOuter}
              />
              <circle
                cx={currentSlot.centerX}
                cy={currentSlot.cashY}
                r={2.5}
                fill="#ff6100"
                className={styles.scrubNodeInner}
              />
            </g>
          )}
        </svg>

        {/* Hover / Scrub Inspection Tooltip (Positioned in Obsidian Glassmorphism) */}
        {currentMetric && currentSlot && (
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
              <span className={styles.tooltipMonth}>{currentMetric.fullPeriod}</span>
              <span
                className={`${styles.tooltipAttainmentPill} ${
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
                <span className={styles.tooltipValue}>{currentMetric.quotaFormatted}</span>
              </div>
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipLabel}>
                  <span className={styles.dotCash} /> Actual Cash:
                </span>
                <span className={styles.tooltipValue}>{currentMetric.cashFormatted}</span>
              </div>
              <div className={styles.tooltipVarianceRow}>
                <span className={styles.tooltipVarianceLabel}>Variance:</span>
                <span
                  className={`${styles.tooltipVarianceVal} ${
                    isPositiveSlotVariance ? styles.variancePositive : styles.varianceNegative
                  }`}
                >
                  {isPositiveSlotVariance ? '+' : ''}
                  {formatLakhsCurrency(slotVarianceVal)} ({isPositiveSlotVariance ? '+' : ''}
                  {(currentMetric.attainmentPct - 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
