"use client";

/**
 * @file CommercialVelocityBarChart.tsx
 * @description Master Commercial Velocity Dual-Bar Chart modeled 1:1 after the Finexy archetype.
 *              Displays monthly vertical column bars with rounded pill caps (Intake vs. Realized),
 *              subtle hairline gridlines, INR axis milestones, and an interactive hover scrubber.
 * @module admin/components/Dashboard/CommercialVelocityBarChart
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useMemo, useState } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { DynamicRevenueSplinePoint } from "@/app/admin/lib/timeframeUtils";
import styles from "./CommercialVelocityBarChart.module.scss";

export interface MonthlyBarData {
  month: string;
  intake: number;
  realized: number;
}

export interface CommercialVelocityBarChartProps {
  chart?: DynamicRevenueSplinePoint[];
  totalIntake?: number | null;
  totalRealized?: number | null;
  financials?: boolean;
}

export const CommercialVelocityBarChart: React.FC<CommercialVelocityBarChartProps> = ({
  chart = [],
  totalIntake = null,
  totalRealized = null,
  financials = true,
}) => {
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);

  // Compute monthly column buckets based directly on live CRM timeframe points or real calendar intervals
  const monthlyData = useMemo<MonthlyBarData[]>(() => {
    if (chart && chart.length > 0) {
      const pointCount = chart.length;
      const baseIntakePerPoint = totalIntake && totalIntake > 0 ? Math.round(totalIntake / pointCount) : 0;
      return chart.map((pt) => ({
        month: pt.month,
        intake: baseIntakePerPoint,
        realized: pt.cashVal || 0,
      }));
    }

    // Default 6-month cadence calendar when timeframe points are not pre-bucketed
    const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
    const baseIntake = totalIntake ?? 0;
    const baseRealized = totalRealized ?? 0;
    const pointIntake = baseIntake > 0 ? Math.round(baseIntake / months.length) : 0;
    const pointRealized = baseRealized > 0 ? Math.round(baseRealized / months.length) : 0;

    return months.map((m) => ({
      month: m,
      intake: pointIntake,
      realized: pointRealized,
    }));
  }, [chart, totalIntake, totalRealized]);

  // Dimensions for SVG
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Max scale calculation
  const maxVal = useMemo(() => {
    const highest = Math.max(...monthlyData.map((d) => Math.max(d.intake, d.realized)), 2000000);
    return Math.ceil(highest / 500000) * 500000;
  }, [monthlyData]);

  // Y-axis milestones (0, 5L, 10L, 15L, 20L)
  const yMilestones = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  // Column calculations
  const colWidth = chartWidth / monthlyData.length;
  const barWidth = 14;
  const barGap = 4;

  const activeItem = activeHoverIndex !== null ? monthlyData[activeHoverIndex] : null;

  return (
    <article
      className={styles.cardContainer}
      aria-labelledby="commercial-velocity-title"
    >
      <header className={styles.chartHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.eyebrowRow}>
            <span className={styles.statusDot} aria-hidden="true" />
            <p className={styles.eyebrow}>Cadence Intelligence</p>
          </div>
          <h2 className={styles.title} id="commercial-velocity-title">
            Commercial Velocity
          </h2>
          <p className={styles.subtitle}>
            Monthly pipeline intake vs. converted revenue
          </p>
        </div>

        <div className={styles.controlsGroup}>
          <div className={styles.legendRow}>
            <div className={styles.legendItem}>
              <span className={styles.legendSquareIntake} aria-hidden="true" />
              <span>Pipeline Intake</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendSquareRealized} aria-hidden="true" />
              <span>Realized Revenue</span>
            </div>
          </div>

          <select className={styles.timeframeSelect} aria-label="Select velocity window">
            <option value="6m">Last 6 Months</option>
            <option value="ytd">Year to Date</option>
            <option value="12m">Trailing 12M</option>
          </select>
        </div>
      </header>

      <div className={styles.svgWrapper}>
        {/* Floating Tooltip Scrubber */}
        {activeItem && (
          <div className={styles.tooltipContainer} role="status" aria-live="polite">
            <span className={styles.tooltipMonth}>{activeItem.month} 2026</span>
            <div className={styles.tooltipValues}>
              <span>Intake: <strong>{financials ? formatCrmCurrency(activeItem.intake) : "Confidential"}</strong></span>
              <span>·</span>
              <span>Realized: <strong>{financials ? formatCrmCurrency(activeItem.realized) : "Confidential"}</strong></span>
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={styles.chartSvg}
          role="img"
          aria-label="Commercial velocity dual-bar chart showing monthly intake vs realized revenue"
        >
          {/* Horizontal Hairline Gridlines and Y-Axis Labels */}
          {yMilestones.map((milestone, idx) => {
            const y = paddingTop + chartHeight - (milestone / maxVal) * chartHeight;
            const labelStr =
              milestone === 0
                ? "₹ 0"
                : milestone >= 10000000
                  ? `₹ ${(milestone / 10000000).toFixed(1)}Cr`
                  : `₹ ${(milestone / 100000).toFixed(0)}L`;

            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  className={styles.gridLine}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  className={styles.axisText}
                >
                  {labelStr}
                </text>
              </g>
            );
          })}

          {/* Monthly Dual Columns */}
          {monthlyData.map((item, idx) => {
            const centerX = paddingLeft + idx * colWidth + colWidth / 2;
            const intakeHeight = Math.max(4, (item.intake / maxVal) * chartHeight);
            const realizedHeight = (item.realized / maxVal) * chartHeight;

            const intakeX = centerX - barWidth - barGap / 2;
            const intakeY = paddingTop + chartHeight - intakeHeight;

            const realizedX = centerX + barGap / 2;
            const realizedY = paddingTop + chartHeight - Math.max(3, realizedHeight);

            return (
              <g
                key={idx}
                onMouseEnter={() => setActiveHoverIndex(idx)}
                onMouseLeave={() => setActiveHoverIndex(null)}
              >
                {/* Invisible wide hit area for seamless hovering */}
                <rect
                  x={paddingLeft + idx * colWidth}
                  y={paddingTop}
                  width={colWidth}
                  height={chartHeight}
                  className={styles.columnHoverArea}
                />

                {/* Intake Bar (Charcoal) */}
                <rect
                  x={intakeX}
                  y={intakeY}
                  width={barWidth}
                  height={intakeHeight}
                  rx="4"
                  className={styles.barIntake}
                />

                {/* Realized Bar (Brand Red) */}
                <rect
                  x={realizedX}
                  y={realizedY}
                  width={barWidth}
                  height={Math.max(3, realizedHeight)}
                  rx="4"
                  className={styles.barRealized}
                />

                {/* Month Label */}
                <text
                  x={centerX}
                  y={svgHeight - 12}
                  className={styles.monthText}
                >
                  {item.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </article>
  );
};
