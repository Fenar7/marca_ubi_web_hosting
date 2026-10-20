'use client';

/**
 * @file PerformanceChart.tsx
 * @description Interactive Dual-Month Performance Area Chart for the Executive Overview Dashboard.
 *              Directly benchmarked against Logip (original-f0a51857256dd5802cfc7a47a6f070a2.webp).
 *              Renders smooth Bézier area curves, interactive hover tracking, and a floating dark tooltip capsule.
 * @module app/admin/components/Dashboard/PerformanceChart
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useId } from 'react';
import styles from './PerformanceChart.module.scss';

interface DataPoint {
  day: string;
  fullDate: string;
  thisMonthVal: number;
  lastMonthVal: number;
  thisMonthFormatted: string;
  lastMonthFormatted: string;
}

const PERFORMANCE_DATA: DataPoint[] = [
  { day: '01', fullDate: '01 Oct 2026', thisMonthVal: 65, lastMonthVal: 48, thisMonthFormatted: '₹1.15 Cr', lastMonthFormatted: '₹82L' },
  { day: '02', fullDate: '02 Oct 2026', thisMonthVal: 82, lastMonthVal: 55, thisMonthFormatted: '₹1.48 Cr', lastMonthFormatted: '₹95L' },
  { day: '03', fullDate: '03 Oct 2026', thisMonthVal: 110, lastMonthVal: 72, thisMonthFormatted: '₹1.92 Cr', lastMonthFormatted: '₹1.25 Cr' },
  { day: '04', fullDate: '04 Oct 2026', thisMonthVal: 95, lastMonthVal: 80, thisMonthFormatted: '₹1.65 Cr', lastMonthFormatted: '₹1.38 Cr' },
  { day: '05', fullDate: '05 Oct 2026', thisMonthVal: 135, lastMonthVal: 90, thisMonthFormatted: '₹2.41 Cr', lastMonthFormatted: '₹1.55 Cr' },
  { day: '06', fullDate: '06 Oct 2026', thisMonthVal: 120, lastMonthVal: 78, thisMonthFormatted: '₹2.12 Cr', lastMonthFormatted: '₹1.32 Cr' },
  { day: '07', fullDate: '07 Oct 2026', thisMonthVal: 145, lastMonthVal: 88, thisMonthFormatted: '₹2.65 Cr', lastMonthFormatted: '₹1.50 Cr' },
];

export const PerformanceChart: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number>(2); // Default to day 03 matching Logip screenshot
  const [isHovered, setIsHovered] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('01-07 Oct');
  const svgRef = useRef<SVGSVGElement>(null);
  const gradIdOrange = useId();
  const gradIdSlate = useId();

  // SVG Coordinates calculation
  // Total canvas width: 600, height: 200, padding left: 45, right: 20, top: 20, bottom: 35
  const chartWidth = 535;
  const chartHeight = 145;
  const originX = 45;
  const originY = 20;

  const pointsCount = PERFORMANCE_DATA.length;
  const stepX = chartWidth / (pointsCount - 1);
  const maxVal = 160;

  const coordsThisMonth = PERFORMANCE_DATA.map((p, i) => {
    const x = originX + i * stepX;
    const y = originY + chartHeight - (p.thisMonthVal / maxVal) * chartHeight;
    return { x, y };
  });

  const coordsLastMonth = PERFORMANCE_DATA.map((p, i) => {
    const x = originX + i * stepX;
    const y = originY + chartHeight - (p.lastMonthVal / maxVal) * chartHeight;
    return { x, y };
  });

  // Generate smooth cubic Bézier curve SVG path
  const generatePath = (points: Array<{ x: number; y: number }>): string => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) / 2;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) / 2;
      const cy2 = p1.y;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const linePathThisMonth = generatePath(coordsThisMonth);
  const linePathLastMonth = generatePath(coordsLastMonth);

  const baselineY = originY + chartHeight;
  const areaPathThisMonth = `${linePathThisMonth} L ${coordsThisMonth[coordsThisMonth.length - 1].x} ${baselineY} L ${coordsThisMonth[0].x} ${baselineY} Z`;
  const areaPathLastMonth = `${linePathLastMonth} L ${coordsLastMonth[coordsLastMonth.length - 1].x} ${baselineY} L ${coordsLastMonth[0].x} ${baselineY} Z`;

  const activePoint = PERFORMANCE_DATA[activeIdx];
  const activeCoordOrange = coordsThisMonth[activeIdx];
  const activeCoordSlate = coordsLastMonth[activeIdx];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 600;
    
    // Find closest index
    let closestIdx = 0;
    let minDist = Infinity;
    coordsThisMonth.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });

    setActiveIdx(closestIdx);
    setIsHovered(true);
  };

  // Compute percentage left for tooltip capsule
  const tooltipLeftPercent = ((activeCoordOrange.x) / 600) * 100;

  return (
    <div className={styles.chartCard} aria-label="Commercial Performance Trends">
      {/* Chart Header */}
      <div className={styles.chartHeader}>
        <div className={styles.headerTitleGroup}>
          <h2 className={styles.chartTitle}>Performance</h2>
          <div className={styles.legendGroup}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.orange}`} />
              <span>This month</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.slate}`} />
              <span>Last month</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={styles.filterSelect}
          onClick={() => setSelectedPeriod((prev) => (prev === '01-07 Oct' ? 'Last 30 Days' : '01-07 Oct'))}
          aria-label="Filter performance date range"
        >
          <span>{selectedPeriod}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* SVG Canvas Container */}
      <div className={styles.svgWrapper}>
        <svg
          ref={svgRef}
          viewBox="0 0 600 200"
          className={styles.chartSvg}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
        >
          <defs>
            <linearGradient id={gradIdOrange} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6100" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#ff6100" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={gradIdSlate} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          <line x1={originX} y1={originY} x2={originX + chartWidth} y2={originY} className={styles.gridLine} />
          <text x="35" y={originY + 4} textAnchor="end" className={styles.axisText}>₹2.5Cr</text>

          <line x1={originX} y1={originY + chartHeight * 0.33} x2={originX + chartWidth} y2={originY + chartHeight * 0.33} className={styles.gridLine} />
          <text x="35" y={originY + chartHeight * 0.33 + 4} textAnchor="end" className={styles.axisText}>₹1.6Cr</text>

          <line x1={originX} y1={originY + chartHeight * 0.66} x2={originX + chartWidth} y2={originY + chartHeight * 0.66} className={styles.gridLine} />
          <text x="35" y={originY + chartHeight * 0.66 + 4} textAnchor="end" className={styles.axisText}>₹80L</text>

          <line x1={originX} y1={baselineY} x2={originX + chartWidth} y2={baselineY} className={styles.gridLine} />
          <text x="35" y={baselineY + 4} textAnchor="end" className={styles.axisText}>0</text>

          {/* Last Month Area & Stroke */}
          <path d={areaPathLastMonth} fill={`url(#${gradIdSlate})`} />
          <path d={linePathLastMonth} fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* This Month Area & Stroke (Marca Orange) */}
          <path d={areaPathThisMonth} fill={`url(#${gradIdOrange})`} />
          <path d={linePathThisMonth} fill="none" stroke="#ff6100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* X-Axis Day Labels */}
          {PERFORMANCE_DATA.map((p, idx) => {
            const x = originX + idx * stepX;
            return (
              <text key={p.day} x={x} y={baselineY + 18} textAnchor="middle" className={styles.axisText}>
                {p.day}
              </text>
            );
          })}

          {/* Active Hover Indicators */}
          {isHovered && activeCoordOrange && (
            <>
              <line
                x1={activeCoordOrange.x}
                y1={originY}
                x2={activeCoordOrange.x}
                y2={baselineY}
                className={styles.activeLine}
              />
              <circle cx={activeCoordSlate.x} cy={activeCoordSlate.y} r="5" className={styles.activeCircleSlate} />
              <circle cx={activeCoordOrange.x} cy={activeCoordOrange.y} r="6" className={styles.activeCircleOrange} />
            </>
          )}
        </svg>

        {/* Floating Dark Obsidian Tooltip Capsule (Logip Matching) */}
        {isHovered && activePoint && (
          <div
            className={styles.tooltipCapsule}
            style={{ left: `${tooltipLeftPercent}%` }}
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
          </div>
        )}
      </div>
    </div>
  );
};
