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

const DEFAULT_VALUE_CATEGORIES: StatisticCategoryItem[] = [
  { percentage: 45, label: "Lead Discovery", amount: "₹ 29,43,000", color: "#111111", badgeTextColor: "#ffffff" },
  { percentage: 25, label: "Proposal Sent", amount: "₹ 16,35,000", color: "#ea002a", badgeTextColor: "#ffffff" },
  { percentage: 15, label: "Negotiation", amount: "₹ 9,81,000", color: "#454542", badgeTextColor: "#ffffff" },
  { percentage: 10, label: "Qualified Scope", amount: "₹ 6,54,000", color: "#696965", badgeTextColor: "#ffffff" },
  { percentage: 5, label: "Closing Review", amount: "₹ 3,27,000", color: "#10b981", badgeTextColor: "#ffffff" },
];

const DEFAULT_VOLUME_CATEGORIES: StatisticCategoryItem[] = [
  { percentage: 36, label: "Lead Discovery", amount: "14 deals", color: "#111111", badgeTextColor: "#ffffff" },
  { percentage: 26, label: "Proposal Sent", amount: "10 deals", color: "#ea002a", badgeTextColor: "#ffffff" },
  { percentage: 18, label: "Negotiation", amount: "7 deals", color: "#454542", badgeTextColor: "#ffffff" },
  { percentage: 13, label: "Qualified Scope", amount: "5 deals", color: "#696965", badgeTextColor: "#ffffff" },
  { percentage: 7, label: "Closing Review", amount: "3 deals", color: "#10b981", badgeTextColor: "#ffffff" },
];

export interface ConyestStatisticCardProps {
  cardTitle?: string;
  primaryTabLabel?: string;
  secondaryTabLabel?: string;
  expensesTotal?: string;
  incomeTotal?: string;
  expenseItems?: StatisticCategoryItem[];
  incomeItems?: StatisticCategoryItem[];
}

/**
 * ConyestStatisticCard renders the segmented donut chart and funnel stage distribution:
 * - Sub-tab switcher ("By Value" vs "By Volume") with active underline indicator.
 * - Precision SVG Donut with center total and stage labels.
 * - Colored percentage badges matching the exact Swiss Luxury tokens.
 *
 * Invariant: Displays authentic CRM pipeline distribution; zero household grocery/rent categories.
 */
export function ConyestStatisticCard({
  cardTitle = "Pipeline Distribution",
  primaryTabLabel = "By Value",
  secondaryTabLabel = "By Volume",
  expensesTotal = "₹ 65,40,000",
  incomeTotal = "39 Deals",
  expenseItems = DEFAULT_VALUE_CATEGORIES,
  incomeItems = DEFAULT_VOLUME_CATEGORIES,
}: ConyestStatisticCardProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"value" | "volume">("value");

  const items = activeTab === "value" ? expenseItems : incomeItems;
  const currentTotal = activeTab === "value" ? expensesTotal : incomeTotal;
  const currentLabel = activeTab === "value" ? "Active Pipeline" : "Total Volume";

  // SVG Donut calculation (Radius: 60, circumference = 2 * PI * 60 = 376.99)
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <article className={styles.statisticCard} aria-label={`${cardTitle} statistics`}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{cardTitle}</h2>
        <button
          type="button"
          className={styles.periodDropdown}
          aria-label="Filter statistic timeframe"
        >
          <span>Current Pipeline</span>
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

      {/* Subtabs: By Value vs By Volume */}
      <nav className={styles.tabRow} aria-label="Category breakdown tabs">
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "value" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("value")}
          aria-selected={activeTab === "value"}
          role="tab"
        >
          {primaryTabLabel}
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "volume" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("volume")}
          aria-selected={activeTab === "volume"}
          role="tab"
        >
          {secondaryTabLabel}
        </button>
      </nav>

      {/* Donut Chart Container */}
      <div className={styles.donutWrapper}>
        <svg
          className={styles.donutSvg}
          viewBox="0 0 160 160"
          role="img"
          aria-label={`${currentLabel}: ${currentTotal}`}
        >
          {/* Base track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="18"
          />

          {/* Render individual category segments */}
          {items.map((cat) => {
            const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += cat.percentage;

            return (
              <circle
                key={cat.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={cat.color}
                strokeWidth="18"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={styles.donutSegment}
              />
            );
          })}
        </svg>

        {/* Center Text inside Donut */}
        <div className={styles.donutCenter}>
          <span className={styles.centerLabel}>{currentLabel}</span>
          <strong className={styles.centerTotal}>{currentTotal}</strong>
        </div>
      </div>

      {/* Breakdown List */}
      <ul className={styles.categoryList} aria-label="Commercial stage list">
        {items.map((cat) => (
          <li key={cat.label} className={styles.categoryRow}>
            <div className={styles.catLeft}>
              <span
                className={styles.percentageBadge}
                style={{
                  backgroundColor: cat.color,
                  color: cat.badgeTextColor,
                }}
              >
                {cat.percentage}%
              </span>
              <span className={styles.categoryLabel}>{cat.label}</span>
            </div>
            <strong className={styles.categoryAmount}>{cat.amount}</strong>
          </li>
        ))}
      </ul>
    </article>
  );
}
