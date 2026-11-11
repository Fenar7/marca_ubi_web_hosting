"use client";

import React from "react";
import styles from "./ConyestMetricsGrid.module.scss";

export interface ConyestMetricsGridProps {
  userName?: string;
  balanceAmount?: string;
  metaLabel1?: string;
  metaVal1?: string;
  metaLabel2?: string;
  metaVal2?: string;
  card2Title?: string;
  incomeAmount?: string;
  incomeDelta?: string;
  incomeSubtitle?: string;
  card3Title?: string;
  expensesAmount?: string;
  expensesDelta?: string;
  expensesSubtitle?: string;
  card4Title?: string;
  savingAmount?: string;
  savingDelta?: string;
  savingSubtitle?: string;
}

/**
 * ConyestMetricsGrid presents the signature 4-card commercial telemetry band:
 * 1. Signature Obsidian Commercial Desk Card with live status indicator and executive metadata.
 * 2. Closed Converted Value scorecard with positive delta trend pill and prior-period baseline.
 * 3. Weighted Pipeline Potential scorecard with probability ratio and active deal count.
 * 4. Commercial Velocity scorecard with deal cycle turnaround and realization benchmarks.
 *
 * Invariant: Preserves tabular numerics and explicit accessibility contrast. Zero USD dummy signs.
 */
export function ConyestMetricsGrid({
  userName = "MARCA UBI DESK",
  balanceAmount = "₹ 65,40,000",
  metaLabel1 = "ACTIVE DEALS",
  metaVal1 = "39 Deals",
  metaLabel2 = "WEIGHTED",
  metaVal2 = "₹ 28,35,800",
  card2Title = "Closed Converted Value",
  incomeAmount = "₹ 23,54,500",
  incomeDelta = "↗ +14.2%",
  incomeSubtitle = "vs previous 30 days",
  card3Title = "Weighted Pipeline Potential",
  expensesAmount = "₹ 28,35,800",
  expensesDelta = "43.4%",
  expensesSubtitle = "Stage probability weighted · 39 deals",
  card4Title = "Commercial Velocity",
  savingAmount = "18.4 days",
  savingDelta = "Target < 21d",
  savingSubtitle = "Average intake-to-close velocity",
}: ConyestMetricsGridProps): React.ReactElement {
  const isIncomeNegative = incomeDelta.includes("↘") || incomeDelta.includes("-");
  const isExpensesNegative = expensesDelta.includes("↘") || expensesDelta.includes("-");
  const isSavingNegative = savingDelta.includes("↘") || savingDelta.includes("-");

  return (
    <section className={styles.metricsGrid} aria-label="Executive financial telemetry">
      {/* Card 1: Virtual Obsidian Account Card */}
      <article className={styles.virtualCard} aria-label="Commercial Account Card">
        <svg
          className={styles.virtualWatermark}
          viewBox="0 0 190 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M50 150C50 67.1573 117.157 0 200 0"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1.5"
          />
          <path
            d="M10 150C10 45.1966 88.1966 -33 183 -33"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="1.5"
          />
          <path
            d="M90 150C90 89.2487 139.249 40 200 40"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1.5"
          />
        </svg>

        <div className={styles.virtualTopRow}>
          <span className={styles.virtualUserTag}>{userName}</span>
          <div className={styles.activeDeskBadge}>
            <span className={styles.activeDot} aria-hidden="true" />
            <span>Active Desk</span>
          </div>
        </div>

        <div className={styles.virtualBalanceArea}>
          <span className={styles.virtualLabel}>Active Pipeline</span>
          <strong className={styles.virtualAmount}>{balanceAmount}</strong>
        </div>

        <div className={styles.virtualFooterRow}>
          <div className={styles.virtualMetaItem}>
            <span>{metaLabel1}</span>
            <strong>{metaVal1}</strong>
          </div>
          <div className={styles.virtualMetaItem}>
            <span>{metaLabel2}</span>
            <strong>{metaVal2}</strong>
          </div>
        </div>
      </article>

      {/* Card 2: Converted Revenue */}
      <article className={styles.scorecard} aria-label={`${card2Title} summary`}>
        <h2 className={styles.cardTitle}>{card2Title}</h2>
        <div className={styles.metricValue}>{incomeAmount}</div>
        <footer className={styles.cardFooter}>
          <span
            className={`${styles.trendPill} ${isIncomeNegative ? styles.trendNegative : styles.trendPositive}`}
          >
            {incomeDelta}
          </span>
          <span className={styles.subtitle}>{incomeSubtitle}</span>
        </footer>
      </article>

      {/* Card 3: Weighted Potential */}
      <article className={styles.scorecard} aria-label={`${card3Title} summary`}>
        <h2 className={styles.cardTitle}>{card3Title}</h2>
        <div className={styles.metricValue}>{expensesAmount}</div>
        <footer className={styles.cardFooter}>
          <span
            className={`${styles.trendPill} ${isExpensesNegative ? styles.trendNegative : styles.trendNeutral}`}
          >
            {expensesDelta}
          </span>
          <span className={styles.subtitle}>{expensesSubtitle}</span>
        </footer>
      </article>

      {/* Card 4: Commercial Velocity */}
      <article className={styles.scorecard} aria-label={`${card4Title} summary`}>
        <h2 className={styles.cardTitle}>{card4Title}</h2>
        <div className={styles.metricValue}>{savingAmount}</div>
        <footer className={styles.cardFooter}>
          <span
            className={`${styles.trendPill} ${isSavingNegative ? styles.trendNegative : styles.trendPositive}`}
          >
            {savingDelta}
          </span>
          <span className={styles.subtitle}>{savingSubtitle}</span>
        </footer>
      </article>
    </section>
  );
}
