"use client";

import React, { useMemo, useRef, useState, useId } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { MonthlyRevenueMetric } from "./types";
import styles from "./RevenueDynamicsCard.module.scss";

export type { MonthlyRevenueMetric } from "./types";

export interface RevenueDynamicsCardProps {
  dataPoints: MonthlyRevenueMetric[];
  timeframe: string;
  conversionCount: number | null;
  dataStatus?: "ready" | "unavailable";
}

interface Point2D {
  x: number;
  y: number;
}

/** Builds a monotone cubic path so sparse revenue observations do not imply false peaks. */
function generateMonotoneBezierPath(points: Point2D[]): string {
  if (points.length === 0) return "";
  if (points.length === 1)
    return "M " + points[0].x.toFixed(2) + " " + points[0].y.toFixed(2);

  const slopes: number[] = [];
  const intervals: number[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const dx = points[index + 1].x - points[index].x;
    const dy = points[index + 1].y - points[index].y;
    intervals.push(dx);
    slopes.push(dx === 0 ? 0 : dy / dx);
  }

  const tangents = new Array<number>(points.length);
  tangents[0] = slopes[0];
  tangents[points.length - 1] = slopes[slopes.length - 1];

  for (let index = 1; index < points.length - 1; index += 1) {
    if (slopes[index - 1] * slopes[index] <= 0) {
      tangents[index] = 0;
    } else {
      tangents[index] = (slopes[index - 1] + slopes[index]) / 2;
    }
  }

  for (let index = 0; index < slopes.length; index += 1) {
    if (slopes[index] === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      continue;
    }

    const alpha = tangents[index] / slopes[index];
    const beta = tangents[index + 1] / slopes[index];
    const magnitude = Math.hypot(alpha, beta);
    if (magnitude > 3) {
      const scale = 3 / magnitude;
      tangents[index] = scale * alpha * slopes[index];
      tangents[index + 1] = scale * beta * slopes[index];
    }
  }

  let path = "M " + points[0].x.toFixed(2) + " " + points[0].y.toFixed(2);
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const interval = intervals[index];
    const firstControl = {
      x: start.x + interval / 3,
      y: start.y + (tangents[index] * interval) / 3,
    };
    const secondControl = {
      x: end.x - interval / 3,
      y: end.y - (tangents[index + 1] * interval) / 3,
    };

    path +=
      " C " +
      firstControl.x.toFixed(2) +
      " " +
      firstControl.y.toFixed(2) +
      ", " +
      secondControl.x.toFixed(2) +
      " " +
      secondControl.y.toFixed(2) +
      ", " +
      end.x.toFixed(2) +
      " " +
      end.y.toFixed(2);
  }
  return path;
}

function formatCurrency(amount: number): string {
  return formatCrmCurrency(amount);
}

function formatAxis(amount: number): string {
  return formatCurrency(amount);
}

export const RevenueDynamicsCard: React.FC<RevenueDynamicsCardProps> = ({
  dataPoints,
  timeframe,
  conversionCount,
  dataStatus = "ready",
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const svgWidth = 720;
  const svgHeight = 260;
  const chartLeft = 56;
  const chartRight = 684;
  const chartTop = 28;
  const chartBottom = 210;
  const chartHeight = chartBottom - chartTop;

  const totalConvertedValue = useMemo(
    () => dataPoints.reduce((total, point) => total + point.cashVal, 0),
    [dataPoints],
  );
  const maxValue = useMemo(() => {
    const highest = Math.max(0, ...dataPoints.map((point) => point.cashVal));
    return highest === 0 ? 1 : highest * 1.15;
  }, [dataPoints]);

  const coordinates = dataPoints.map((point, index) => {
    const x =
      dataPoints.length <= 1
        ? (chartLeft + chartRight) / 2
        : chartLeft +
          (index / (dataPoints.length - 1)) * (chartRight - chartLeft);
    return {
      x,
      y: chartBottom - (point.cashVal / maxValue) * chartHeight,
    };
  });

  const curvePath = generateMonotoneBezierPath(coordinates);
  const areaPath =
    coordinates.length > 0
      ? curvePath +
        " L " +
        coordinates[coordinates.length - 1].x.toFixed(2) +
        " " +
        chartBottom +
        " L " +
        coordinates[0].x.toFixed(2) +
        " " +
        chartBottom +
        " Z"
      : "";
  const safeIdx =
    activeIdx === null
      ? null
      : Math.max(0, Math.min(activeIdx, dataPoints.length - 1));
  const activePoint = safeIdx === null ? null : coordinates[safeIdx];
  const activeData = safeIdx === null ? null : dataPoints[safeIdx];
  const rawLeftPercent = activePoint ? (activePoint.x / svgWidth) * 100 : 50;
  const tooltipLeft = Math.max(10, Math.min(90, rawLeftPercent));
  const gridLines = Array.from({ length: 5 }, (_, index) => {
    const value = (maxValue / 4) * (4 - index);
    return {
      value,
      y: chartTop + (index * chartHeight) / 4,
    };
  });

  function handlePointer(clientX: number): void {
    if (!containerRef.current || coordinates.length === 0) return;
    const bounds = containerRef.current.getBoundingClientRect();
    const viewX = ((clientX - bounds.left) / bounds.width) * svgWidth;
    let nearest = 0;
    for (let index = 1; index < coordinates.length; index += 1) {
      if (
        Math.abs(coordinates[index].x - viewX) <
        Math.abs(coordinates[nearest].x - viewX)
      ) {
        nearest = index;
      }
    }
    setActiveIdx(nearest);
  }

  function handleChartKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (dataPoints.length === 0) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveIdx((current) => {
        const base = current ?? 0;
        const direction = event.key === "ArrowRight" ? 1 : -1;
        return Math.max(0, Math.min(dataPoints.length - 1, base + direction));
      });
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIdx(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIdx(dataPoints.length - 1);
    }
  }

  return (
    <div className={styles.performanceCard}>
      <div className={styles.cardHeader}>
        <div className={styles.titleCluster}>
          <h2 className={styles.title}>Performance</h2>
          <p className={styles.subtitle}>
            Converted contract value during {timeframe}.
          </p>
        </div>
        {dataStatus === "ready" && (
          <div className={styles.legendCluster} aria-label="Chart series">
            <span className={styles.legendPill}>
              <span className={styles.swatchCash} aria-hidden="true" />
              Converted contract value
            </span>
          </div>
        )}
      </div>

      {dataStatus === "unavailable" ? (
        <p className={styles.emptyState} role="status">
          Revenue data is unavailable. The source query did not complete.
        </p>
      ) : conversionCount === 0 ? (
        <p className={styles.emptyState} role="status">
          <strong>No conversions recorded</strong>
          <span>Closed deals dated in {timeframe} appear here.</span>
        </p>
      ) : dataPoints.length === 0 || dataPoints.every((point) => point.cashVal === 0) ? (
        <p className={styles.emptyState} role="status">
          <strong>Converted deals have no recorded value</strong>
          <span>{conversionCount ?? 0} conversion(s) in {timeframe}; no value is available to chart.</span>
        </p>
      ) : (
        <>
          <div className={styles.headlineRow}>
            <div className={styles.headlineMetrics}>
              <span className={styles.headlineCash}>
                {formatCurrency(totalConvertedValue)}
              </span>
              <span className={styles.headlineBaseline}>
                Converted contract value
              </span>
            </div>
          </div>

          <div
            className={styles.canvasContainer}
            ref={containerRef}
            role="img"
            tabIndex={0}
            aria-label={"Converted contract value chart for " + timeframe + ". Use arrow keys to inspect periods."}
            onKeyDown={handleChartKeyDown}
            onPointerMove={(event) => handlePointer(event.clientX)}
            onPointerLeave={() => setActiveIdx(null)}
          >
            <svg
              viewBox={"0 0 " + svgWidth + " " + svgHeight}
              className={styles.chartSvg}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id={"rdc-area-grad-" + id}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#ea002a" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#ea002a" stopOpacity="0" />
                </linearGradient>
              </defs>
              {gridLines.map((line, index) => (
                <g key={"grid-" + index}>
                  <line
                    x1={chartLeft}
                    y1={line.y}
                    x2={chartRight}
                    y2={line.y}
                    className={styles.gridLine}
                  />
                  <text
                    x={chartLeft - 12}
                    y={line.y + 4}
                    textAnchor="end"
                    className={styles.yAxisText}
                  >
                    {formatAxis(line.value)}
                  </text>
                </g>
              ))}
              <path
                d={areaPath}
                fill={"url(#rdc-area-grad-" + id + ")"}
                stroke="none"
                className={styles.areaWashPath}
              />
              <path
                d={curvePath}
                fill="none"
                stroke="#ea002a"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.cashSpline}
              />
              {coordinates.map((point, index) => (
                <text
                  key={"label-" + index}
                  x={point.x}
                  y={chartBottom + 22}
                  textAnchor="middle"
                  className={styles.xAxisText}
                >
                  {dataPoints[index].month}
                </text>
              ))}
              {activePoint && (
                <g className={styles.scrubberGroup}>
                  <line
                    x1={activePoint.x}
                    y1={chartTop}
                    x2={activePoint.x}
                    y2={chartBottom}
                    className={styles.crosshairGuide}
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r={5.5}
                    fill="#ffffff"
                    stroke="#ea002a"
                    strokeWidth={2.5}
                  />
                </g>
              )}
            </svg>

            {activePoint && activeData && (
              <div
                className={styles.obsidianTooltip}
                style={{
                  left: tooltipLeft + "%",
                  transform:
                    tooltipLeft > 75
                      ? "translateX(-100%)"
                      : tooltipLeft < 25
                        ? "translateX(0)"
                        : "translateX(-50%)",
                }}
                role="status"
                aria-live="polite"
              >
                <span className={styles.tooltipPeriod}>
                  {activeData.fullPeriod}
                </span>
                <strong className={styles.tooltipVal}>
                  {activeData.cashFormatted}
                </strong>
              </div>
            )}
          </div>

          <table className={styles.srOnly}>
            <caption>
              Converted contract value by period for {timeframe}
            </caption>
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col">Converted contract value</th>
              </tr>
            </thead>
            <tbody>
              {dataPoints.map((point) => (
                <tr key={point.fullPeriod}>
                  <th scope="row">{point.fullPeriod}</th>
                  <td>{point.cashFormatted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};
