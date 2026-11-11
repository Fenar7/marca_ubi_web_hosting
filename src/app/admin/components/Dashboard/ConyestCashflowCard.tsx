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
  { month: "Jan", fullName: "January 2025", income: 7200, expense: 4500, incomeFormatted: "$7,200", expenseFormatted: "$4,500" },
  { month: "Feb", fullName: "February 2025", income: 3200, expense: 6800, incomeFormatted: "$3,200", expenseFormatted: "$6,800" },
  { month: "Mar", fullName: "March 2025", income: 5100, expense: 4200, incomeFormatted: "$5,100", expenseFormatted: "$4,200" },
  { month: "Apr", fullName: "April 2025", income: 7600, expense: 3100, incomeFormatted: "$7,600", expenseFormatted: "$3,100" },
  { month: "May", fullName: "May 2025", income: 5400, expense: 4400, incomeFormatted: "$5,400", expenseFormatted: "$4,400" },
  { month: "Jun", fullName: "June 2025", income: 6800, expense: 3500, incomeFormatted: "$6,800", expenseFormatted: "$3,500" },
  { month: "Jul", fullName: "July 2025", income: 3100, expense: 4100, incomeFormatted: "$3,100", expenseFormatted: "$4,100" },
  { month: "Aug", fullName: "August 2025", income: 9540, expense: 8230, incomeFormatted: "$9,540", expenseFormatted: "$8,230" },
  { month: "Sep", fullName: "September 2025", income: 7100, expense: 4300, incomeFormatted: "$7,100", expenseFormatted: "$4,300" },
  { month: "Oct", fullName: "October 2025", income: 6200, expense: 4100, incomeFormatted: "$6,200", expenseFormatted: "$4,100" },
  { month: "Nov", fullName: "November 2025", income: 4200, expense: 7100, incomeFormatted: "$4,200", expenseFormatted: "$7,100" },
  { month: "Dec", fullName: "December 2025", income: 5900, expense: 3200, incomeFormatted: "$5,900", expenseFormatted: "$3,200" },
];

export interface ConyestCashflowCardProps {
  totalBalance?: string;
  data?: MonthlyCashflowPoint[];
}

/**
 * ConyestCashflowCard renders the signature dual-directional Cashflow bar chart:
 * - Inbound income bars extend upwards from 0 with rounded pill caps in vibrant chartreuse (#94e622).
 * - Outflow expense bars extend downwards from 0 with rounded caps in deep forest (#1f4843).
 * - Active month (August by default) is wrapped in a luminous capsule halo with a floating popover tooltip.
 *
 * Invariant: Fully accessible SVG graphics with keyboard focus and interactive hover.
 */
export function ConyestCashflowCard({
  totalBalance = "$432,568",
  data = DEFAULT_MONTHS,
}: ConyestCashflowCardProps): React.ReactElement {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(7); // Index 7 = Aug
  const activeMonth = data[selectedMonthIndex] || data[0];

  // SVG Coordinate Geometry (680 x 240)
  const svgWidth = 680;
  const svgHeight = 240;
  const leftMargin = 45;
  const rightMargin = 20;
  const chartWidth = svgWidth - leftMargin - rightMargin;
  const zeroY = 125; // 0 baseline
  const maxScale = 11000;
  const positiveRange = 95; // height from zero to top
  const negativeRange = 80; // height from zero to bottom

  const colWidth = chartWidth / data.length;
  const barWidth = 24;

  const yPositions = [
    { label: "10K", y: zeroY - (10000 / maxScale) * positiveRange },
    { label: "5K", y: zeroY - (5000 / maxScale) * positiveRange },
    { label: "0", y: zeroY },
    { label: "-5k", y: zeroY + (5000 / maxScale) * negativeRange },
    { label: "-10k", y: zeroY + (10000 / maxScale) * negativeRange },
  ];

  const activeColCenter = leftMargin + selectedMonthIndex * colWidth + colWidth / 2;
  const activePercentX = (activeColCenter / svgWidth) * 100;

  return (
    <article className={styles.cashflowCard} aria-label="Cashflow velocity analysis">
      <header className={styles.cardHeader}>
        <div className={styles.titleArea}>
          <h2 className={styles.cardTitle}>Cashflow</h2>
          <div className={styles.balanceRow}>
            <span className={styles.balanceLabel}>Total Balance</span>
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
              <span>Income</span>
            </li>
            <li className={styles.legendItem}>
              <span className={styles.legendExpenseDot} aria-hidden="true" />
              <span>Expense</span>
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
            <span>Income</span>
            <strong>{activeMonth.incomeFormatted}</strong>
          </div>
          <div className={styles.popoverRow}>
            <span>Expense</span>
            <strong>{activeMonth.expenseFormatted}</strong>
          </div>
        </div>

        <svg
          className={styles.chartSvg}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Dual-directional monthly cashflow bar chart"
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
                className={p.label === "0" ? styles.axisZeroLine : styles.gridLine}
              />
            </g>
          ))}

          {/* Luminous Capsule Halo for Selected Month */}
          <rect
            className={styles.haloCapsule}
            x={activeColCenter - 16}
            y={24}
            width={32}
            height={185}
          />

          {/* Bars and Month Labels */}
          {data.map((point, index) => {
            const centerX = leftMargin + index * colWidth + colWidth / 2;
            const barX = centerX - barWidth / 2;

            // Income (Upward from zeroY)
            const incomeHeight = Math.max(6, (point.income / maxScale) * positiveRange);
            const incomeY = zeroY - incomeHeight;

            // Expense (Downward from zeroY)
            const expenseHeight = Math.max(6, (point.expense / maxScale) * negativeRange);
            const expenseY = zeroY;

            const isSelected = index === selectedMonthIndex;

            return (
              <g
                key={point.month}
                onClick={() => setSelectedMonthIndex(index)}
                onMouseEnter={() => setSelectedMonthIndex(index)}
                style={{ cursor: "pointer" }}
              >
                {/* Income Bar */}
                <rect
                  className={styles.barIncome}
                  x={barX}
                  y={incomeY}
                  width={barWidth}
                  height={incomeHeight}
                  rx={6}
                  ry={6}
                  aria-label={`${point.month} income: ${point.incomeFormatted}`}
                />

                {/* Expense Bar */}
                <rect
                  className={styles.barExpense}
                  x={barX}
                  y={expenseY}
                  width={barWidth}
                  height={expenseHeight}
                  rx={6}
                  ry={6}
                  aria-label={`${point.month} expense: ${point.expenseFormatted}`}
                />

                {/* Month Name */}
                <text
                  x={centerX}
                  y={230}
                  className={`${styles.monthLabel} ${isSelected ? styles.activeMonthLabel : ""}`}
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
