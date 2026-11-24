'use client';

import React, { useState, useMemo, useRef } from 'react';
import { formatCrmCurrency, formatCompactInr } from '@/app/admin/lib/currency';
import styles from './RevenueSpline.module.scss';

export interface RevenueSplinePoint {
  bucketIndex: number;
  periodLabel: string;
  fullPeriodRange: string;
  convertedRevenue: number;
  convertedDealsCount: number;
  inboundPipelineValue: number;
  inboundDealsCount: number;
}

export interface RevenueSplineProps {
  points: RevenueSplinePoint[];
  totalConverted: number;
  totalInbound: number;
}

export const RevenueSpline: React.FC<RevenueSplineProps> = ({
  points,
  totalConverted,
  totalInbound,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxVal = useMemo(() => {
    let max = 0;
    for (const pt of points) {
      if (pt.convertedRevenue > max) max = pt.convertedRevenue;
      if (pt.inboundPipelineValue > max) max = pt.inboundPipelineValue;
    }
    return max > 0 ? max * 1.15 : 1000000;
  }, [points]);

  const width = 640;
  const height = 240;
  const paddingX = 40;
  const paddingY = 24;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const coords = useMemo(() => {
    if (points.length === 0) return { converted: [], inbound: [] };
    const step = points.length > 1 ? chartW / (points.length - 1) : chartW;

    const convPts = points.map((p, idx) => ({
      x: paddingX + idx * step,
      y: height - paddingY - (p.convertedRevenue / maxVal) * chartH,
      data: p,
    }));

    const inbPts = points.map((p, idx) => ({
      x: paddingX + idx * step,
      y: height - paddingY - (p.inboundPipelineValue / maxVal) * chartH,
      data: p,
    }));

    return { converted: convPts, inbound: inbPts };
  }, [points, chartW, chartH, maxVal]);

  const generateSmoothPath = (pts: { x: number; y: number }[]): string => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const convertedPath = useMemo(() => generateSmoothPath(coords.converted), [coords.converted]);
  const inboundPath = useMemo(() => generateSmoothPath(coords.inbound), [coords.inbound]);

  const areaPath = useMemo(() => {
    if (coords.converted.length < 2) return '';
    const last = coords.converted[coords.converted.length - 1];
    const first = coords.converted[0];
    return `${convertedPath} L ${last.x} ${height - paddingY} L ${first.x} ${height - paddingY} Z`;
  }, [convertedPath, coords.converted, height, paddingY]);

  const activePoint = hoverIndex !== null && coords.converted[hoverIndex] ? coords.converted[hoverIndex] : null;

  return (
    <div className={styles.splineContainer} ref={containerRef}>
      <div className={styles.splineHeader}>
        <div>
          <h3 className={styles.splineTitle}>Revenue Realization Spline</h3>
          <p className={styles.splineSubtitle}>
            Realized Closed Won vs. Inbound Pipeline Velocity over time.
          </p>
        </div>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.solidLine} aria-hidden="true" />
            <span>Won Contracts ({formatCrmCurrency(totalConverted)})</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dashedLine} aria-hidden="true" />
            <span>Inbound Pipeline ({formatCrmCurrency(totalInbound)})</span>
          </div>
        </div>
      </div>

      <div className={styles.svgWrapper}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={styles.splineSvg}
          onMouseLeave={() => setHoverIndex(null)}
          aria-label="Revenue spline visualizer"
        >
          <defs>
            <linearGradient id="wonAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ea002a" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ea002a" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Hairline Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = height - paddingY - pct * chartH;
            return (
              <g key={pct} className={styles.gridGroup}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  className={styles.gridLine}
                />
                <text x={paddingX - 8} y={y + 4} className={styles.axisText}>
                  {formatCompactInr(Math.round(pct * maxVal))}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#wonAreaGrad)" />}

          {/* Spline Lines */}
          {inboundPath && (
            <path
              d={inboundPath}
              className={styles.inboundStroke}
              fill="none"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {convertedPath && (
            <path
              d={convertedPath}
              className={styles.convertedStroke}
              fill="none"
              strokeWidth="2.5"
            />
          )}

          {/* Interactive Coordinates */}
          {coords.converted.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoverIndex === idx ? '6' : '3.5'}
                className={styles.coordDot}
                onMouseEnter={() => setHoverIndex(idx)}
              />
              <rect
                x={pt.x - chartW / (points.length * 2)}
                y={0}
                width={chartW / points.length}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(idx)}
              />
            </g>
          ))}

          {/* Crosshair Cursor */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={paddingY}
              x2={activePoint.x}
              y2={height - paddingY}
              className={styles.crosshair}
            />
          )}
        </svg>

        {/* Floating Tooltip */}
        {activePoint && (
          <div
            className={styles.tooltip}
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100}%`,
            }}
          >
            <p className={styles.tooltipDate}>{activePoint.data.fullPeriodRange}</p>
            <div className={styles.tooltipRow}>
              <span>Won:</span>
              <strong>{formatCrmCurrency(activePoint.data.convertedRevenue)}</strong>
              <em>({activePoint.data.convertedDealsCount} contracts)</em>
            </div>
            <div className={styles.tooltipRow}>
              <span>Inbound:</span>
              <strong>{formatCrmCurrency(activePoint.data.inboundPipelineValue)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
