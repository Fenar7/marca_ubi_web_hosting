"use client";

import React, { useState } from "react";
import styles from "./ConyestCashflowCard.module.scss";

export interface MonthlyCashflowPoint {
  month: string;
  fullName: string;
  income: number;
  expense: number;
  incomeFormatted: string;
  expenseFormatted: string;
}

const DEFAULT_MONTHS: MonthlyCashflowPoint[] = [
  { month: "Jan", fullName: "January", income: 720000, expense: 450000, incomeFormatted: "₹ 7,20,000", expenseFormatted: "₹ 4,50,000" },
  { month: "Feb", fullName: "February", income: 320000, expense: 680000, incomeFormatted: "₹ 3,20,000", expenseFormatted: "₹ 6,80,000" },
  { month: "Mar", fullName: "March", income: 510000, expense: 420000, incomeFormatted: "₹ 5,10,000", expenseFormatted: "₹ 4,20,000" },
  { month: "Apr", fullName: "April", income: 760000, expense: 310000, incomeFormatted: "₹ 7,60,000", expenseFormatted: "₹ 3,10,000" },
  { month: "May", fullName: "May", income: 540000, expense: 440000, incomeFormatted: "₹ 5,40,000", expenseFormatted: "₹ 4,40,000" },
  { month: "Jun", fullName: "June", income: 680000, expense: 350000, incomeFormatted: "₹ 6,80,000", expenseFormatted: "₹ 3,50,000" },
  { month: "Jul", fullName: "July", income: 310000, expense: 410000, incomeFormatted: "₹ 3,10,000", expenseFormatted: "₹ 4,10,000" },
  { month: "Aug", fullName: "August", income: 954000, expense: 823000, incomeFormatted: "₹ 9,54,000", expenseFormatted: "₹ 8,23,000" },
  { month: "Sep", fullName: "September", income: 710000, expense: 430000, incomeFormatted: "₹ 7,10,000", expenseFormatted: "₹ 4,30,000" },
  { month: "Oct", fullName: "October", income: 620000, expense: 410000, incomeFormatted: "₹ 6,20,000", expenseFormatted: "₹ 4,10,000" },
  { month: "Nov", fullName: "November", income: 840000, expense: 710000, incomeFormatted: "₹ 8,40,000", expenseFormatted: "₹ 7,10,000" },
  { month: "Dec", fullName: "December", income: 590000, expense: 320000, incomeFormatted: "₹ 5,90,000", expenseFormatted: "₹ 3,20,000" },
];

export interface ConyestCashflowCardProps {
  cardTitle?: string;
  balanceLabel?: string;
  totalBalance?: string;
  data?: MonthlyCashflowPoint[];
}

/** Format currency numbers for compact Y-axis charts without losing clarity */
function formatCompactInr(amount: number): string {
  if (amount === 0) return "0";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 10000000) {
    return `${sign}${(abs / 10000000).toFixed(1)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}${(abs / 100000).toFixed(0)}L`;
  }
  if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(0)}k`;
  }
  return `${sign}${abs}`;
}

/**
 * ConyestCashflowCard renders the dual-directional commercial pipeline velocity bar chart:
 * - Upper bars extend upwards: Deal Intake (new inquiries and pipeline value in INR).
 * - Lower bars extend downwards: Converted Won Contracts in INR.
 * - Dynamic coordinate scaling calibrated for Indian Rupee Lakhs/Crores.
 * - Active month capsule with interactive popover tooltip.
 */
export function ConyestCashflowCard({
  cardTitle = "Pipeline Velocity",
  balanceLabel = "Total Deal Intake",
  totalBalance = "₹ 65,40,000",
  data = DEFAULT_MONTHS,
}: ConyestCashflowCardProps): React.ReactElement {
  const currentMonthIdx = new Date().getUTCMonth();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    Math.min(currentMonthIdx, data.length - 1),
  );
  const activeMonth = data[selectedMonthIndex] || data[0];

  // SVG Coordinate Geometry (680 x 240)
  const svgWidth = 680;
  const svgHeight = 240;
  const leftMargin = 45;
  const rightMargin = 20;
  const chartWidth = svgWidth - leftMargin - rightMargin;
  const zeroY = 125; // 0 baseline
  const positiveRange = 95; // height from zero to top
  const negativeRange = 80; // height from zero to bottom

  // Compute dynamic scale based on the largest data value
  const rawMax = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    100000,
  );
  // Round up to clean ceiling (e.g., nearest 100,000 or 1,000,000)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const maxScale = Math.ceil(rawMax / magnitude) * magnitude;

  const colWidth = chartWidth / data.length;
  const barWidth = 24;

  const yPositions = [
    { label: formatCompactInr(maxScale), y: zeroY - positiveRange },
    { label: formatCompactInr(maxScale / 2), y: zeroY - positiveRange / 2 },
    { label: "0", y: zeroY },
    { label: formatCompactInr(-maxScale / 2), y: zeroY + negativeRange / 2 },
    { label: formatCompactInr(-maxScale), y: zeroY + negativeRange },
  ];

  const activeColCenter = leftMargin + selectedMonthIndex * colWidth + colWidth / 2;
  const activePercentX = (activeColCenter / svgWidth) * 100;

  return (
    <article className={styles.cashflowCard} aria-label={`${cardTitle} analysis`}>
      <header className={styles.cardHeader}>
        <div className={styles.titleArea}>
          <h2 className={styles.cardTitle}>{cardTitle}</h2>
          <div className={styles.balanceRow}>
            <span className={styles.balanceLabel}>{balanceLabel}</span>
            <strong className={styles.balanceAmount}>{totalBalance}</strong>
          </div>
        </div>

        <div className={styles.controlsArea}>
          <button
            type="button"
            className={styles.periodSelector}
            aria-label="Filter timeline timeframe"
          >
            <span>This Year</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <ul className={styles.legendList}>
            <li className={styles.legendItem}>
              <span className={styles.legendIncomeDot} aria-hidden="true" />
              <span>Deal Intake</span>
            </li>
            <li className={styles.legendItem}>
              <span className={styles.legendExpenseDot} aria-hidden="true" />
              <span>Won Contracts</span>
            </li>
          </ul>
        </div>
      </header>

      <div className={styles.chartContainer}>
        {/* Floating Tooltip Popover */}
        <div
          className={styles.popoverTooltip}
          style={{ left: `${activePercentX}%` }}
          role="tooltip"
          aria-live="polite"
        >
          <div className={styles.popoverHeader}>{activeMonth.fullName}</div>
          <div className={styles.popoverRow}>
            <span>Deal Intake</span>
            <strong>{activeMonth.incomeFormatted}</strong>
          </div>
          <div className={styles.popoverRow}>
            <span>Won Contracts</span>
            <strong>{activeMonth.expenseFormatted}</strong>
          </div>
        </div>

        <svg
          className={styles.chartSvg}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Dual-directional monthly commercial pipeline bar chart"
        >
          {/* Horizontal Grid Lines & Y-Labels */}
          {yPositions.map((p) => (
            <g key={p.label}>
              <text x={leftMargin - 12} y={p.y + 4} className={styles.axisLabel}>
                {p.label}
              </text>
              <line
                x1={leftMargin}
                y1={p.y}
                x2={svgWidth - rightMargin}
                y2={p.y}
                className={p.label === "0" ? styles.zeroLine : styles.gridLine}
              />
            </g>
          ))}

          {/* Active Month Capsule Halo Pill */}
          {activeColCenter && (
            <rect
              x={activeColCenter - barWidth / 2 - 6}
              y={zeroY - positiveRange - 6}
              width={barWidth + 12}
              height={positiveRange + negativeRange + 12}
              rx={16}
              className={styles.activeHalo}
            />
          )}

          {/* Month Columns */}
          {data.map((point, index) => {
            const xCenter = leftMargin + index * colWidth + colWidth / 2;
            const barX = xCenter - barWidth / 2;

            // Bar heights normalized to dynamic scale
            const incomeH = Math.max(
              2,
              Math.min(positiveRange, (point.income / maxScale) * positiveRange),
            );
            const expenseH = Math.max(
              2,
              Math.min(negativeRange, (point.expense / maxScale) * negativeRange),
            );

            const isSelected = index === selectedMonthIndex;

            return (
              <g
                key={point.month}
                className={`${styles.barColumn} ${isSelected ? styles.selectedColumn : ""}`}
                onClick={() => setSelectedMonthIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedMonthIndex(index);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${point.fullName}: Intake ${point.incomeFormatted}, Converted ${point.expenseFormatted}`}
              >
                {/* Upper Intake Bar */}
                <rect
                  x={barX}
                  y={zeroY - incomeH}
                  width={barWidth}
                  height={incomeH}
                  rx={6}
                  className={styles.incomeBar}
                />

                {/* Lower Won Contracts Bar */}
                <rect
                  x={barX}
                  y={zeroY}
                  width={barWidth}
                  height={expenseH}
                  rx={6}
                  className={styles.expenseBar}
                />

                {/* X-Axis Month Label */}
                <text
                  x={xCenter}
                  y={svgHeight - 12}
                  className={`${styles.monthLabel} ${isSelected ? styles.selectedMonthLabel : ""}`}
                >
                  {point.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </article>
  );
}
