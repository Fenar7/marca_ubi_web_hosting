"use client";

import React, { useState } from "react";
import styles from "./ConyestMetricsGrid.module.scss";

export interface ConyestMetricsGridProps {
  userName?: string;
  balanceAmount?: string;
  incomeAmount?: string;
  incomeDelta?: string;
  incomeSubtitle?: string;
  expensesAmount?: string;
  expensesDelta?: string;
  expensesSubtitle?: string;
  savingAmount?: string;
  savingDelta?: string;
  savingSubtitle?: string;
  cardExp?: string;
  cardCvv?: string;
}

/**
 * ConyestMetricsGrid presents the signature 4-card top metric band:
 * 1. Deep forest obsidian virtual account card with fluid concentric watermarks & toggle switch.
 * 2. Total Income scorecard with green positive delta pill.
 * 3. Total Expenses scorecard with red negative delta pill.
 * 4. Total Saving scorecard with green positive delta pill.
 *
 * Invariant: Preserves tabular numerics and explicit accessibility contrast.
 */
export function ConyestMetricsGrid({
  userName = "JAMIE SMITH",
  balanceAmount = "$432,568",
  incomeAmount = "$42,560",
  incomeDelta = "↗ 2.84%",
  incomeSubtitle = "Last month $38,568",
  expensesAmount = "$28,358",
  expensesDelta = "↘ 4.78%",
  expensesSubtitle = "Last month $26,340",
  savingAmount = "$14,202",
  savingDelta = "↗ 1.98%",
  savingSubtitle = "Last month $12,230",
  cardExp = "11/29",
  cardCvv = "232",
}: ConyestMetricsGridProps): React.ReactElement {
  const [isVirtualCardActive, setIsVirtualCardActive] = useState(true);

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
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1.5"
          />
          <path
            d="M90 150C90 89.2487 139.249 40 200 40"
            stroke="rgba(148, 230, 34, 0.16)"
            strokeWidth="1.5"
          />
        </svg>

        <div className={styles.virtualTopRow}>
          <span className={styles.virtualUserTag}>{userName}</span>
          <button
            type="button"
            className={`${styles.toggleSwitch} ${!isVirtualCardActive ? styles.toggleOff : ""}`}
            onClick={() => setIsVirtualCardActive((prev) => !prev)}
            aria-label="Toggle virtual card active status"
            aria-pressed={isVirtualCardActive}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        <div className={styles.virtualBalanceArea}>
          <span className={styles.virtualLabel}>Balance</span>
          <strong className={styles.virtualAmount}>{balanceAmount}</strong>
        </div>

        <div className={styles.virtualFooterRow}>
          <div className={styles.virtualMetaItem}>
            <span>EXP</span>
            <strong>{cardExp}</strong>
          </div>
          <div className={styles.virtualMetaItem}>
            <span>CVV</span>
            <strong>{cardCvv}</strong>
          </div>
        </div>
      </article>

      {/* Card 2: Total Income */}
      <article className={styles.scorecard} aria-label="Total Income summary">
        <h2 className={styles.cardTitle}>Total Income</h2>
        <div className={styles.metricValue}>{incomeAmount}</div>
        <footer className={styles.cardFooter}>
          <span className={`${styles.trendPill} ${styles.trendPositive}`}>
            {incomeDelta}
          </span>
          <span className={styles.subtitle}>{incomeSubtitle}</span>
        </footer>
      </article>

      {/* Card 3: Total Expenses */}
      <article className={styles.scorecard} aria-label="Total Expenses summary">
        <h2 className={styles.cardTitle}>Total Expenses</h2>
        <div className={styles.metricValue}>{expensesAmount}</div>
        <footer className={styles.cardFooter}>
          <span className={`${styles.trendPill} ${styles.trendNegative}`}>
            {expensesDelta}
          </span>
          <span className={styles.subtitle}>{expensesSubtitle}</span>
        </footer>
      </article>

      {/* Card 4: Total Saving */}
      <article className={styles.scorecard} aria-label="Total Saving summary">
        <h2 className={styles.cardTitle}>Total Saving</h2>
        <div className={styles.metricValue}>{savingAmount}</div>
        <footer className={styles.cardFooter}>
          <span className={`${styles.trendPill} ${styles.trendPositive}`}>
            {savingDelta}
          </span>
          <span className={styles.subtitle}>{savingSubtitle}</span>
        </footer>
      </article>
    </section>
  );
}
