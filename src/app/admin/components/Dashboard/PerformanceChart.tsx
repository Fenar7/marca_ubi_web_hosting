'use client';

/**
 * @file PerformanceChart.tsx
 * @description Interactive Dual-Month Commercial Performance Area Chart for Executive Overview.
 *              Benchmarked against Logip executive analytics and Apple HIG precision standards.
 *              Implements Fritsch-Carlson monotonic cubic Bézier curves (C¹ continuity, zero overshoot),
 *              high-density tabular typography, and accessible keyboard and touch scrubbing.
 * @module app/admin/components/Dashboard/PerformanceChart
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useId, useCallback } from 'react';
import styles from './PerformanceChart.module.scss';

interface DataPoint {
  day: string;
  weekday: string;
  fullDate: string;
  thisMonthVal: number;
  lastMonthVal: number;
  thisMonthFormatted: string;
  lastMonthFormatted: string;
}

interface Point2D {
  x: number;
  y: number;
}

const PERFORMANCE_DATA: DataPoint[] = [
  { day: '01', weekday: 'Thu', fullDate: 'Thu, 01 Oct 2026', thisMonthVal: 65, lastMonthVal: 48, thisMonthFormatted: '₹ 1.15 Cr', lastMonthFormatted: '₹ 82 L' },
  { day: '02', weekday: 'Fri', fullDate: 'Fri, 02 Oct 2026', thisMonthVal: 82, lastMonthVal: 55, thisMonthFormatted: '₹ 1.48 Cr', lastMonthFormatted: '₹ 95 L' },
  { day: '03', weekday: 'Sat', fullDate: 'Sat, 03 Oct 2026', thisMonthVal: 110, lastMonthVal: 72, thisMonthFormatted: '₹ 1.92 Cr', lastMonthFormatted: '₹ 1.25 Cr' },
  { day: '04', weekday: 'Sun', fullDate: 'Sun, 04 Oct 2026', thisMonthVal: 95, lastMonthVal: 80, thisMonthFormatted: '₹ 1.65 Cr', lastMonthFormatted: '₹ 1.38 Cr' },
  { day: '05', weekday: 'Mon', fullDate: 'Mon, 05 Oct 2026', thisMonthVal: 135, lastMonthVal: 90, thisMonthFormatted: '₹ 2.41 Cr', lastMonthFormatted: '₹ 1.55 Cr' },
  { day: '06', weekday: 'Tue', fullDate: 'Tue, 06 Oct 2026', thisMonthVal: 120, lastMonthVal: 78, thisMonthFormatted: '₹ 2.12 Cr', lastMonthFormatted: '₹ 1.32 Cr' },
  { day: '07', weekday: 'Wed', fullDate: 'Wed, 07 Oct 2026', thisMonthVal: 145, lastMonthVal: 88, thisMonthFormatted: '₹ 2.65 Cr', lastMonthFormatted: '₹ 1.50 Cr' },
];

/**
 * Fritsch-Carlson Monotone Cubic Spline to Bézier Path Generator.
 * 
 * Standard cubic spline interpolation produces unnatural oscillations and overshoot
 * between non-linear discrete financial milestones. The Fritsch-Carlson algorithm
 * restricts the Hermite derivatives (m_k) to guarantee monotonicity (zero overshoot)
 * and C¹ continuity, then converts Hermite segments to equivalent cubic Bézier control points:
 *   CP1 = (x_k + h_k / 3, y_k + (m_k * h_k) / 3)
 *   CP2 = (x_{k+1} - h_k / 3, y_{k+1} - (m_{k+1} * h_k) / 3)
 * 
 * @param points Discrete cartesian coordinates ordered strictly along the x-axis
 * @returns SVG cubic Bézier path definition string ('M ... C ...')
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

export const PerformanceChart: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number>(5);
  const [isHovered, setIsHovered] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7D');
  const svgRef = useRef<SVGSVGElement>(null);
  const gradIdOrange = useId();
  const gradIdSlate = useId();

  const totalCanvasWidth = 640;
  const chartWidth = 552;
  const chartHeight = 150;
  const originX = 64;
  const originY = 24;
  const baselineY = 174;
  const maxVal = 160;

  const pointsCount = PERFORMANCE_DATA.length;
  const stepX = chartWidth / (pointsCount - 1);

  const coordsThisMonth: Point2D[] = PERFORMANCE_DATA.map((p, i) => {
    const x = originX + i * stepX;
    const y = originY + chartHeight - (p.thisMonthVal / maxVal) * chartHeight;
    return { x, y };
  });

  const coordsLastMonth: Point2D[] = PERFORMANCE_DATA.map((p, i) => {
    const x = originX + i * stepX;
    const y = originY + chartHeight - (p.lastMonthVal / maxVal) * chartHeight;
    return { x, y };
  });

  const linePathThisMonth = generateMonotoneBezierPath(coordsThisMonth);
  const linePathLastMonth = generateMonotoneBezierPath(coordsLastMonth);

  const areaPathThisMonth = `${linePathThisMonth} L ${coordsThisMonth[coordsThisMonth.length - 1].x.toFixed(2)} ${baselineY} L ${coordsThisMonth[0].x.toFixed(2)} ${baselineY} Z`;
  const areaPathLastMonth = `${linePathLastMonth} L ${coordsLastMonth[coordsLastMonth.length - 1].x.toFixed(2)} ${baselineY} L ${coordsLastMonth[0].x.toFixed(2)} ${baselineY} Z`;

  const activePoint = PERFORMANCE_DATA[activeIdx];
  const activeCoordOrange = coordsThisMonth[activeIdx];
  const activeCoordSlate = coordsLastMonth[activeIdx];

  const updateActiveFromCanvasX = useCallback((canvasX: number) => {
    let closestIdx = 0;
    let minDist = Infinity;
    coordsThisMonth.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - canvasX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });
    setActiveIdx(closestIdx);
    setIsHovered(true);
  }, [coordsThisMonth]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const mouseX = ((e.clientX - rect.left) / rect.width) * totalCanvasWidth;
    updateActiveFromCanvasX(mouseX);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current || e.touches.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const touchX = ((e.touches[0].clientX - rect.left) / rect.width) * totalCanvasWidth;
    updateActiveFromCanvasX(touchX);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(prev + 1, pointsCount - 1));
      setIsHovered(true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(prev - 1, 0));
      setIsHovered(true);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIdx(0);
      setIsHovered(true);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIdx(pointsCount - 1);
      setIsHovered(true);
    }
  };

  const tooltipLeftPercent = (activeCoordOrange.x / totalCanvasWidth) * 100;

  // Dynamic vertical clearance: flip tooltip below marker if in upper 40% (y < 85)
  const isPeakInUpperRange = activeCoordOrange.y < 85;
  const tooltipTopStyle = isPeakInUpperRange
    ? `${((activeCoordOrange.y + 18) / 220) * 100}%`
    : '14px';

  const variancePct = activePoint.lastMonthVal > 0
    ? ((activePoint.thisMonthVal - activePoint.lastMonthVal) / activePoint.lastMonthVal) * 100
    : 0;
  const isVariancePositive = variancePct >= 0;
  const formattedVariance = `${isVariancePositive ? '+' : ''}${variancePct.toFixed(1)}% vs last month`;

  const yAxisTicks = [
    { y: originY, label: '₹ 2.50 Cr' },
    { y: originY + chartHeight * 0.28, label: '₹ 1.80 Cr' },
    { y: originY + chartHeight * 0.60, label: '₹ 1.00 Cr' },
    { y: baselineY, label: '₹ 0.00' },
  ];

  return (
    <div className={styles.chartCard} aria-label="Commercial Performance Trends">
      <div className={styles.chartHeader}>
        <div className={styles.headerPrimaryInfo}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.chartTitle}>Performance</h2>
            <span className={styles.headerVelocityBadge} aria-label={`Performance velocity: ${formattedVariance}`}>
              ▲ {formattedVariance}
            </span>
          </div>
          <div className={styles.headerMetricHeadline}>
            <span className={styles.metricVal}>{activePoint.thisMonthFormatted}</span>
            <span className={styles.metricContext}>Inspection: {activePoint.fullDate}</span>
          </div>
        </div>

        <div className={styles.headerControlsGroup}>
          <div className={styles.segmentedControl} role="group" aria-label="Time range selector">
            {(['7D', '30D', '90D', '1Y'] as const).map((period) => (
              <button
                key={period}
                type="button"
                className={`${styles.segmentBtn} ${styles.filterSelect} ${
                  selectedPeriod === period ? styles.segmentActive : ''
                }`}
                onClick={() => setSelectedPeriod(period)}
                aria-pressed={selectedPeriod === period}
                aria-label={`Filter range ${period}`}
              >
                {period}
              </button>
            ))}
          </div>

          <div className={styles.legendCapsules}>
            <div className={`${styles.legendCapsule} ${styles.legendItem}`}>
              <span className={styles.luminousDotOrange} />
              <span className={styles.legendText}>This Month:</span>
              <span className={styles.legendValue}>{activePoint.thisMonthFormatted}</span>
            </div>
            <div className={`${styles.legendCapsule} ${styles.legendItem}`}>
              <span className={styles.dashedDotSlate} />
              <span className={styles.legendText}>Last Month:</span>
              <span className={styles.legendValue}>{activePoint.lastMonthFormatted}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={styles.svgWrapper}
        tabIndex={0}
        role="region"
        aria-label="Commercial Performance Trends interactive chart. Use horizontal arrow keys to inspect milestone days."
        onKeyDown={handleKeyDown}
      >
        <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
          {activePoint.fullDate}: This month {activePoint.thisMonthFormatted}, Last month {activePoint.lastMonthFormatted}, variance {formattedVariance}
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 640 220"
          className={styles.chartSvg}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onTouchStart={handleTouchMove}
          onTouchMove={handleTouchMove}
        >
          <defs>
            <filter id="orangeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ff6100" floodOpacity="0.5" />
            </filter>
            <linearGradient id={gradIdOrange} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6100" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#ff6100" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={gradIdSlate} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.005" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {yAxisTicks.map((tick) => (
            <React.Fragment key={tick.label}>
              <line
                x1={originX}
                y1={tick.y}
                x2={originX + chartWidth}
                y2={tick.y}
                className={styles.gridLine}
              />
              <text
                x="54"
                y={tick.y + 4}
                textAnchor="end"
                className={styles.axisText}
              >
                {tick.label}
              </text>
            </React.Fragment>
          ))}

          {isHovered && activeCoordOrange && (
            <rect
              x={activeCoordOrange.x - 26}
              y={originY - 6}
              width={52}
              height={chartHeight + 12}
              rx={6}
              fill="rgba(241, 245, 249, 0.6)"
              className={styles.activeColumnBackdrop}
            />
          )}

          <path d={areaPathLastMonth} fill={`url(#${gradIdSlate})`} />
          <path
            d={linePathLastMonth}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.75"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            shapeRendering="geometricPrecision"
          />

          <path d={areaPathThisMonth} fill={`url(#${gradIdOrange})`} />
          <path
            d={linePathThisMonth}
            fill="none"
            stroke="#ff6100"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            shapeRendering="geometricPrecision"
            filter="url(#orangeGlow)"
          />

          {PERFORMANCE_DATA.map((p, idx) => {
            const x = originX + idx * stepX;
            const isActive = isHovered && idx === activeIdx;
            return (
              <text
                key={p.day}
                x={x}
                y={baselineY + 20}
                textAnchor="middle"
                className={`${styles.axisText} ${isActive ? styles.axisTextActive : ''}`}
                fill={isActive ? '#ff6100' : undefined}
                fontWeight={isActive ? 700 : undefined}
              >
                {`${p.weekday} ${p.day}`}
              </text>
            );
          })}

          {isHovered && activeCoordOrange && (
            <>
              <line
                x1={activeCoordOrange.x}
                y1={originY}
                x2={activeCoordOrange.x}
                y2={baselineY}
                className={styles.activeLine}
              />
              <circle
                cx={activeCoordSlate.x}
                cy={activeCoordSlate.y}
                r="4.5"
                className={styles.activeCircleSlate}
              />
              <circle
                cx={activeCoordOrange.x}
                cy={activeCoordOrange.y}
                r="12"
                className={styles.activeHaloOrange}
              />
              <circle
                cx={activeCoordOrange.x}
                cy={activeCoordOrange.y}
                r="5.5"
                className={styles.activeCircleOrange}
              />
            </>
          )}
        </svg>

        {isHovered && activePoint && (
          <div
            className={styles.tooltipCapsule}
            style={{
              left: `${tooltipLeftPercent}%`,
              transform: `translateX(-${tooltipLeftPercent}%)`,
              top: tooltipTopStyle,
            }}
          >
            <span className={styles.tooltipDate}>{activePoint.fullDate}</span>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>
                <span className={`${styles.legendDot} ${styles.orange}`} />
                This month:
              </span>
              <span className={styles.tooltipValue}>{activePoint.thisMonthFormatted}</span>
            </div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>
                <span className={`${styles.legendDot} ${styles.slate}`} />
                Last month:
              </span>
              <span className={styles.tooltipValue}>{activePoint.lastMonthFormatted}</span>
            </div>
            <div
              className={`${styles.tooltipVariance} ${
                isVariancePositive ? styles.variancePositive : styles.varianceNegative
              }`}
            >
              <span>{formattedVariance}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
