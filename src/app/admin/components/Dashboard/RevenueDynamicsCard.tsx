'use client';

/**
 * @file RevenueDynamicsCard.tsx
 * @description Revenue Dynamics & Commercial Velocity Card benchmarked against MedTrackr Report & Analytics.
 *              Integrates dual-state grouped vertical bars (Quota vs Actual Cash) and a Fritsch-Carlson
 *              monotone cubic Bézier spline curve in Marca Orange (#ff6100) ensuring C¹ continuity and zero overshoot.
 *              Interactive SVG scrub ray reveals a dark obsidian glassmorphism inspection tooltip.
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

export const RevenueDynamicsCard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('6 Months');
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState<boolean>(false);
  const [activeIdx, setActiveIdx] = useState<number>(5);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [showQuota, setShowQuota] = useState<boolean>(true);
  const [showCash, setShowCash] = useState<boolean>(true);
  const [showCurve, setShowCurve] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const periodDropdownRef = useRef<HTMLDivElement>(null);

  const gradOrangeId = useId();
  const glowFilterId = useId();

  // SVG Geometry Dimensions
  const svgWidth = 720;
  const svgHeight = 280;
  const chartLeft = 60;
  const chartRight = 690;
  const chartTop = 24;
  const chartBottom = 230;
  const chartHeight = chartBottom - chartTop;
  const maxMetricVal = 25; // ₹25 Lakhs ceiling for clean headroom

  const dataPoints = SIX_MONTH_DATA;
  const totalMonths = dataPoints.length;
  const stepX = (chartRight - chartLeft) / totalMonths;

  // Compute cartesian coordinates for monthly markers
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
  const areaPath = `${bezierCurvePath} L ${curvePoints[curvePoints.length - 1].x.toFixed(2)} ${chartBottom} L ${curvePoints[0].x.toFixed(2)} ${chartBottom} Z`;

  // Active scrub point
  const currentSlot = monthlySlots[activeIdx] || monthlySlots[monthlySlots.length - 1];
  const currentMetric = dataPoints[activeIdx] || dataPoints[dataPoints.length - 1];

  // Tooltip dynamic left percentage
  const tooltipLeftPercent = ((currentSlot.centerX) / svgWidth) * 100;

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

  /**
   * Translates client pointer coordinate to relative SVG scrub index.
   */
  const handlePointerScrub = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const normalizedX = (relX / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDistance = Infinity;
    monthlySlots.forEach((slot, idx) => {
      const dist = Math.abs(slot.centerX - normalizedX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    setActiveIdx(closestIdx);
    setIsScrubbing(true);
  };

  return (
    <div className={styles.chartCard} aria-label="Revenue Dynamics and Forecast Card">
      {/* Header */}
      <div className={styles.chartHeader}>
        <div className={styles.titleCluster}>
          <h2 className={styles.title}>Revenue Dynamics & Forecast</h2>
          <p className={styles.subtitle}>
            Monthly quota baseline vs actual cash collection & growth velocity.
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

          {/* Period Dropdown */}
          <div className={styles.periodDropdownWrapper} ref={periodDropdownRef}>
            <button
              type="button"
              className={`${styles.periodPill} ${isPeriodMenuOpen ? styles.active : ''}`}
              onClick={() => setIsPeriodMenuOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isPeriodMenuOpen}
              aria-label={`Select timeframe. Currently ${selectedPeriod}`}
            >
              <span>{selectedPeriod}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isPeriodMenuOpen && (
              <div className={styles.periodMenu} role="menu">
                {PERIOD_OPTIONS.map((period) => (
                  <button
                    key={period}
                    type="button"
                    role="menuitem"
                    className={`${styles.periodMenuItem} ${
                      period === selectedPeriod ? styles.selected : ''
                    }`}
                    onClick={() => {
                      setSelectedPeriod(period);
                      setIsPeriodMenuOpen(false);
                    }}
                  >
                    {period}
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
          {[
            { label: '₹25L', y: chartBottom - (25 / maxMetricVal) * chartHeight },
            { label: '₹20L', y: chartBottom - (20 / maxMetricVal) * chartHeight },
            { label: '₹15L', y: chartBottom - (15 / maxMetricVal) * chartHeight },
            { label: '₹10L', y: chartBottom - (10 / maxMetricVal) * chartHeight },
            { label: '₹5L',  y: chartBottom - (5 / maxMetricVal) * chartHeight },
            { label: '₹0',    y: chartBottom },
          ].map((grid, idx) => (
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
            const isSelected = i === activeIdx;

            return (
              <g key={`month-bars-${i}`}>
                {/* Baseline Quota Bar */}
                {showQuota && (
                  <rect
                    x={slot.centerX - barWidth - barGap / 2}
                    y={slot.quotaY}
                    width={barWidth}
                    height={slot.quotaHeight}
                    rx={3}
                    fill="#e9ecef"
                    stroke="#cbd5e1"
                    strokeWidth={isSelected ? 1.5 : 1}
                    style={{ transition: 'opacity 0.2s ease' }}
                  />
                )}

                {/* Actual Cash Bar */}
                {showCash && (
                  <rect
                    x={slot.centerX + barGap / 2}
                    y={slot.cashY}
                    width={barWidth}
                    height={slot.cashHeight}
                    rx={3}
                    fill="#0f172a"
                    style={{
                      transition: 'opacity 0.2s ease, transform 0.15s ease',
                      opacity: isSelected ? 1 : 0.92,
                    }}
                  />
                )}

                {/* X-Axis Month Label */}
                <text
                  x={slot.centerX}
                  y={chartBottom + 22}
                  textAnchor="middle"
                  className={styles.axisText}
                  style={{
                    fontWeight: isSelected ? 700 : 500,
                    fill: isSelected ? '#0f172a' : '#64748b',
                  }}
                >
                  {dataPoints[i].month}
                </text>
              </g>
            );
          })}

          {/* Area Fill Under Monotone Spline */}
          {showCurve && (
            <path
              d={areaPath}
              fill={`url(#${gradOrangeId})`}
              style={{ transition: 'opacity 0.25s ease' }}
            />
          )}

          {/* Monotone Spline Curve (Fritsch-Carlson zero overshoot) */}
          {showCurve && (
            <path
              d={bezierCurvePath}
              fill="none"
              stroke="#ff6100"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowFilterId})`}
            />
          )}

          {/* Interactive Scrub Ray & Markers */}
          <line
            x1={currentSlot.centerX}
            y1={chartTop}
            x2={currentSlot.centerX}
            y2={chartBottom}
            className={styles.scrubRay}
          />

          {/* Active Node on Curve */}
          {showCurve && (
            <g transform={`translate(${currentSlot.centerX}, ${currentSlot.cashY})`}>
              <circle r="7" fill="#ffffff" stroke="#ff6100" strokeWidth="2.5" />
              <circle r="3" fill="#ff6100" />
            </g>
          )}
        </svg>

        {/* Dark Obsidian Glassmorphism Tooltip */}
        <div
          className={styles.obsidianTooltip}
          style={{
            left: `${tooltipLeftPercent}%`,
          }}
          role="status"
          aria-live="polite"
        >
          <div className={styles.tooltipHeader}>
            <span className={styles.tooltipMonth}>{currentMetric.fullPeriod}</span>
            <span className={styles.tooltipAttainmentPill}>
              {currentMetric.attainmentPct.toFixed(1)}% Attained
            </span>
          </div>

          <div className={styles.tooltipRows}>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>
                <span className={styles.legendSwatchQuota} />
                Quota Baseline
              </span>
              <span className={styles.tooltipValue}>{currentMetric.quotaFormatted}</span>
            </div>

            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>
                <span className={styles.legendSwatchCash} />
                Actual Cash
              </span>
              <span className={styles.tooltipValue}>{currentMetric.cashFormatted}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
