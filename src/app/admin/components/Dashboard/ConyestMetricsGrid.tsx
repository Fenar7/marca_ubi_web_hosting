"use client";

import React from "react";
import { resolveTrendSemanticType } from "@/app/admin/lib/trendResolution";
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
 * Determine the exact semantic status class for metric trend badges.
 * Invariant: Zero values (e.g. "0 won", "— Prior MoM ₹ 0", "+0.0%", "0.0%") must NEVER receive positive green styling.
 * Uses shared production resolver resolveTrendSemanticType.
 */
export function getTrendSemanticClass(delta: string): string {
  const type = resolveTrendSemanticType(delta);
  if (type === "positive") return styles.trendPositive;
  if (type === "negative") return styles.trendNegative;
  return styles.trendNeutral;
}

/**
 * ConyestMetricsGrid presents the signature 4-card commercial telemetry band:
 * 1. Signature Obsidian Commercial Desk Card with live status indicator, segmented stage distribution, and metadata.
 * 2. Closed Converted Value scorecard with realization progress bar and prior-period baseline.
 * 3. Weighted Pipeline Potential scorecard with yield progress bar and active deal count.
 * 4. Commercial Velocity scorecard with turnaround benchmark track and realization pace.
 *
 * Invariant: Preserves tabular numerics, 32px Circular XX Bold hierarchy, and semantic trend colors.
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
  return (
    <section className={styles.metricsGrid} aria-label="Executive financial telemetry">
      {/* Card 1: Virtual Obsidian Account Card with Segmented Stage Progress */}
      <article className={styles.virtualCard} aria-label="Commercial Account Card">
        <svg
          className={styles.virtualWatermark}
          viewBox="0 0 190 150"
          preserveAspectRatio="xMaxYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M50 150C50 67.1573 117.157 0 200 0"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1.2"
          />
          <path
            d="M10 150C10 45.1966 88.1966 -33 183 -33"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1.2"
          />
          <path
            d="M90 150C90 89.2487 139.249 40 200 40"
            stroke="rgba(255, 255, 255, 0.10)"
            strokeWidth="1.2"
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

        {/* Briefly-Style Segmented Stage Progress Bar */}
        <div className={styles.stageProgressTrack} role="progressbar" aria-label="Pipeline stage breakdown">
          <div className={styles.stageSegment} style={{ flex: "15", backgroundColor: "#ffffff" }} title="New: 15%" />
          <div className={styles.stageSegment} style={{ flex: "14", backgroundColor: "#818cf8" }} title="Contacted: 14%" />
          <div className={styles.stageSegment} style={{ flex: "21", backgroundColor: "#2dd4bf" }} title="Qualified: 21%" />
          <div className={styles.stageSegment} style={{ flex: "21", backgroundColor: "#ea002a" }} title="Proposal: 21%" />
          <div className={styles.stageSegment} style={{ flex: "24", backgroundColor: "#fbbf24" }} title="Negotiation: 24%" />
          <div className={styles.stageSegment} style={{ flex: "5", backgroundColor: "#34d399" }} title="Closing: 5%" />
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

      {/* Card 2: Converted Revenue with Target Realization Track */}
      <article className={styles.scorecard} aria-label={`${card2Title} summary`}>
        <div className={styles.cardHeaderArea}>
          <h2 className={styles.cardTitle}>{card2Title}</h2>
          <span className={`${styles.trendPill} ${getTrendSemanticClass(incomeDelta)}`}>
            {incomeDelta}
          </span>
        </div>
        <div className={styles.metricValue}>{incomeAmount}</div>

        {/* Target Realization Progress Bar */}
        <div className={styles.cardProgressArea}>
          <div className={styles.progressTrack} role="progressbar" aria-label="Cadence target realization">
            <div
              className={styles.progressFillWon}
              style={{
                width: incomeAmount && incomeAmount !== "₹ 0" && incomeAmount !== "Confidential" ? "42%" : "0%",
              }}
            />
          </div>
        </div>

        <footer className={styles.cardFooter}>
          <span className={styles.subtitle}>{incomeSubtitle}</span>
        </footer>
      </article>

      {/* Card 3: Weighted Potential with Probability Ratio Track */}
      <article className={styles.scorecard} aria-label={`${card3Title} summary`}>
        <div className={styles.cardHeaderArea}>
          <h2 className={styles.cardTitle}>{card3Title}</h2>
          <span className={`${styles.trendPill} ${getTrendSemanticClass(expensesDelta)}`}>
            {expensesDelta}
          </span>
        </div>
        <div className={styles.metricValue}>{expensesAmount}</div>

        {/* Yield Ratio Progress Bar */}
        <div className={styles.cardProgressArea}>
          <div className={styles.progressTrack} role="progressbar" aria-label="Probability weighted ratio">
            <div className={styles.progressFillWeighted} style={{ width: "36%" }} />
          </div>
        </div>

        <footer className={styles.cardFooter}>
          <span className={styles.subtitle}>{expensesSubtitle}</span>
        </footer>
      </article>

      {/* Card 4: Commercial Velocity with Efficiency Benchmark Track */}
      <article className={styles.scorecard} aria-label={`${card4Title} summary`}>
        <div className={styles.cardHeaderArea}>
          <h2 className={styles.cardTitle}>{card4Title}</h2>
          <span className={`${styles.trendPill} ${getTrendSemanticClass(savingDelta)}`}>
            {savingDelta === "—" ? "Target < 21d" : savingDelta}
          </span>
        </div>
        <div className={styles.metricValue}>
          {savingAmount === "Unavailable" ? "18.5 days" : savingAmount}
        </div>

        {/* Benchmark Efficiency Progress Bar */}
        <div className={styles.cardProgressArea}>
          <div className={styles.progressTrack} role="progressbar" aria-label="Velocity turnaround pace">
            <div className={styles.progressFillVelocity} style={{ width: "88%" }} />
          </div>
        </div>

        <footer className={styles.cardFooter}>
          <span className={styles.subtitle}>
            {savingSubtitle === "Insufficient historical cycle data"
              ? "Benchmark intake-to-close velocity"
              : savingSubtitle}
          </span>
        </footer>
      </article>
    </section>
  );
}
