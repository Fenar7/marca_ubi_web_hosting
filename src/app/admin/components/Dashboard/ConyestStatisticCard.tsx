"use client";

import React, { useState } from "react";
import styles from "./ConyestStatisticCard.module.scss";

export interface StatisticCategoryItem {
  percentage: number;
  label: string;
  amount: string;
  color: string;
  badgeTextColor: string;
}

const DEFAULT_EXPENSE_CATEGORIES: StatisticCategoryItem[] = [
  { percentage: 60, label: "Rent & Living", amount: "$12,100", color: "#1f4740", badgeTextColor: "#ffffff" },
  { percentage: 15, label: "Groceries", amount: "$3,000", color: "#9dd980", badgeTextColor: "#0f172a" },
  { percentage: 12, label: "Transportation", amount: "$2,000", color: "#8bdf1d", badgeTextColor: "#0f172a" },
  { percentage: 8, label: "Utilities", amount: "$1,600", color: "#d6f7c7", badgeTextColor: "#0f172a" },
  { percentage: 5, label: "Entertainment", amount: "$1,400", color: "#e6f9d8", badgeTextColor: "#0f172a" },
];

const DEFAULT_INCOME_CATEGORIES: StatisticCategoryItem[] = [
  { percentage: 45, label: "Lead Discovery", amount: "$19,150", color: "#1f4740", badgeTextColor: "#ffffff" },
  { percentage: 25, label: "Proposal Sent", amount: "$10,640", color: "#9dd980", badgeTextColor: "#0f172a" },
  { percentage: 15, label: "Negotiation", amount: "$6,380", color: "#8bdf1d", badgeTextColor: "#0f172a" },
  { percentage: 10, label: "Contract Review", amount: "$4,250", color: "#d6f7c7", badgeTextColor: "#0f172a" },
  { percentage: 5, label: "Closed Retainers", amount: "$2,140", color: "#e6f9d8", badgeTextColor: "#0f172a" },
];

export interface ConyestStatisticCardProps {
  expensesTotal?: string;
  incomeTotal?: string;
  expenseItems?: StatisticCategoryItem[];
  incomeItems?: StatisticCategoryItem[];
}

/**
 * ConyestStatisticCard renders the segmented donut chart and stage breakdown:
 * - Tab switcher (Income vs Expense) with active chartreuse underline.
 * - Precision SVG Donut with center total and stage labels.
 * - Colored percentage badges matching the exact Conyest palette tokens.
 */
export function ConyestStatisticCard({
  expensesTotal = "$28,358",
  incomeTotal = "$42,560",
  expenseItems = DEFAULT_EXPENSE_CATEGORIES,
  incomeItems = DEFAULT_INCOME_CATEGORIES,
}: ConyestStatisticCardProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"income" | "expense">("expense");

  const items = activeTab === "expense" ? expenseItems : incomeItems;
  const currentTotal = activeTab === "expense" ? expensesTotal : incomeTotal;
  const currentLabel = activeTab === "expense" ? "Total Expenses" : "Total Income";

  // SVG Donut calculation (Radius: 60, circumference = 2 * PI * 60 = 376.99)
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <article className={styles.statisticCard} aria-label="Commercial stage distribution statistics">
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Statistic</h2>
        <button
          type="button"
          className={styles.periodDropdown}
          aria-label="Filter statistic timeframe"
        >
          <span>This Month</span>
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
      </header>

      {/* Subtabs: Income vs Expense */}
      <nav className={styles.tabRow} aria-label="Category breakdown tabs">
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "income" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("income")}
          aria-selected={activeTab === "income"}
          role="tab"
        >
          Income
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "expense" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("expense")}
          aria-selected={activeTab === "expense"}
          role="tab"
        >
          Expense
        </button>
      </nav>

      {/* Donut Chart Container */}
      <div className={styles.donutWrapper}>
        <svg
          className={styles.donutSvg}
          viewBox="0 0 170 170"
          role="img"
          aria-label={`${currentLabel}: ${currentTotal}`}
        >
          {items.map((item) => {
            const dashArray = `${(item.percentage / 100) * circumference} ${circumference}`;
            const dashOffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += item.percentage;

            return (
              <circle
                key={item.label}
                cx="85"
                cy="85"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="24"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>

        <div className={styles.donutCenter}>
          <span className={styles.donutCenterLabel}>{currentLabel}</span>
          <strong className={styles.donutCenterAmount}>{currentTotal}</strong>
        </div>
      </div>

      {/* Category Breakdown Rows */}
      <ul className={styles.breakdownList}>
        {items.map((item) => (
          <li key={item.label} className={styles.breakdownItem}>
            <div className={styles.itemLeft}>
              <span
                className={styles.pctBadge}
                style={{
                  backgroundColor: item.color,
                  color: item.badgeTextColor,
                }}
              >
                {item.percentage}%
              </span>
              <span className={styles.itemLabel}>{item.label}</span>
            </div>
            <strong className={styles.itemAmount}>{item.amount}</strong>
          </li>
        ))}
      </ul>
    </article>
  );
}
