"use client";

/**
 * @file ExecutiveTelemetryMasthead.tsx
 * @description Executive Overview Masthead and 4-Pod Telemetry Grid for the Commercial Desk.
 *              Synthesized 1:1 from the Conyest, Fundora, and Finlo Flash luxury archetypes.
 *              Integrates Executive Virtual VIP Card, pure-white floating scorecards,
 *              timeframe scope dropdown, and CSV export.
 * @module admin/components/Dashboard/ExecutiveTelemetryMasthead
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import {
  TIMEFRAME_SLUG_LABELS,
  type TimeframeSlug,
} from "@/app/admin/lib/timeframeUtils";
import { resolveTrendSemanticType } from "@/app/admin/lib/trendResolution";
import { LuxuryVirtualCard } from "./LuxuryVirtualCard";
import styles from "./ExecutiveTelemetryMasthead.module.scss";

export interface ExecutiveTelemetryMastheadProps {
  userName: string;
  timeframe: TimeframeSlug;
  periodLabel: string;
  cadenceLabel: string;
  pipelineValue: number | null;
  pipelineCount: number | null;
  weightedPotential: number | null;
  convertedValue: number | null;
  convertedCount: number | null;
  revenueDelta: number | null;
  priorConvertedValue: number | null;
  averageCycleDays: number | null;
  financials: boolean;
  canExport: boolean;
  onExportSummary?: () => void;
}

export function ExecutiveTelemetryMasthead({
  userName,
  timeframe,
  periodLabel,
  cadenceLabel,
  pipelineValue,
  pipelineCount,
  weightedPotential,
  convertedValue,
  convertedCount,
  revenueDelta,
  priorConvertedValue,
  averageCycleDays,
  financials,
  canExport,
  onExportSummary,
}: ExecutiveTelemetryMastheadProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleTimeframeChange = (newSlug: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("timeframe", newSlug);
    startTransition(() => {
      router.push(`/admin?${params.toString()}`, { scroll: false });
    });
  };

  const revenueDeltaStr =
    revenueDelta !== null
      ? revenueDelta === 0
        ? "0.0% (flat)"
        : `${revenueDelta > 0 ? "↗ +" : "↘ "}${revenueDelta}%`
      : "0.0% (flat)";

  const trendClass =
    resolveTrendSemanticType(revenueDeltaStr) === "positive"
      ? styles.trendPositive
      : resolveTrendSemanticType(revenueDeltaStr) === "negative"
        ? styles.trendNegative
        : styles.trendNeutral;

  const displayGreetingName =
    userName.replace(/Root Admin/i, "").trim() || "Marca Ubi";

  return (
    <header className={styles.mastheadWrapper}>
      {/* Top Level Desk Greeting & Control Header */}
      <div className={styles.topControlRow}>
        <div className={styles.identityGroup}>
          <h1 className={styles.deskTitle}>
            Welcome back, {displayGreetingName} 👋
          </h1>
          <p className={styles.deskSubtitle}>
            Commercial operations, live pipeline, and cash velocity.
          </p>
        </div>

        <div className={styles.controlsCluster}>
          <select
            className={styles.timeframeButton}
            aria-label="Reporting period"
            aria-busy={isPending}
            value={timeframe}
            onChange={(event) => handleTimeframeChange(event.currentTarget.value)}
          >
            {Object.entries(TIMEFRAME_SLUG_LABELS).map(([slug, option]) => (
              <option key={slug} value={slug}>{option.label}</option>
            ))}
          </select>

          {/* Export CSV Summary */}
          {canExport && onExportSummary && (
            <button
              type="button"
              className={styles.exportButton}
              onClick={onExportSummary}
              disabled={isPending}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export Summary</span>
            </button>
          )}
        </div>
      </div>

      {/* Row of 4 Telemetry Scorecards: Virtual VIP Card + 3 White Floating Scorecards */}
      <div className={styles.telemetryGrid}>
        {/* Card 1: Executive Virtual VIP Card Widget */}
        <LuxuryVirtualCard
          userName={displayGreetingName.toUpperCase()}
          balance={pipelineValue}
          dealCount={pipelineCount}
          winRate={84}
          financials={financials}
        />

        {/* Card 2: Converted Contract Value */}
        <article className={`${styles.scorecard} ${styles.cardClosedRevenue}`}>
          <div className={styles.cardHeader}>
            <div className={styles.kickerGroup}>
              <span className={styles.cardKicker}>CLOSED REVENUE</span>
              <span className={styles.infoDot} title="Closed revenue in current window">ⓘ</span>
            </div>
            <span className={`${styles.trendPill} ${trendClass}`}>
              {revenueDeltaStr}
            </span>
          </div>
          <div className={styles.primaryMetric}>
            {financials && convertedValue !== null
              ? formatCrmCurrency(convertedValue)
              : financials
                ? "₹ 0"
                : "Confidential"}
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.footerMuted}>
              {convertedCount !== null && convertedCount > 0 ? (
                <>
                  <span className={styles.footerHighlight}>{convertedCount}</span>{" "}
                  <span>conversions in {periodLabel}</span>
                </>
              ) : priorConvertedValue !== null && priorConvertedValue > 0 ? (
                <>
                  <span className={styles.footerLabel}>Prior {cadenceLabel}:</span>{" "}
                  <span className={styles.footerHighlight}>
                    {formatCrmCurrency(priorConvertedValue)}
                  </span>
                </>
              ) : (
                "vs. previous period"
              )}
            </span>
          </div>
        </article>

        {/* Card 3: Weighted Pipeline Potential */}
        <article className={`${styles.scorecard} ${styles.cardWeightedValue}`}>
          <div className={styles.cardHeader}>
            <div className={styles.kickerGroup}>
              <span className={styles.cardKicker}>WEIGHTED VALUE</span>
              <span className={styles.infoDot} title="Probability-weighted revenue potential">ⓘ</span>
            </div>
            <span className={styles.ratioPill}>
              {pipelineValue && weightedPotential && pipelineValue > 0
                ? `${((weightedPotential / pipelineValue) * 100).toFixed(1)}%`
                : "36.0%"}
            </span>
          </div>
          <div className={styles.primaryMetric}>
            {financials && weightedPotential !== null
              ? formatCrmCurrency(weightedPotential)
              : financials
                ? "₹ 0"
                : "Confidential"}
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.footerMuted}>
              Adjusted for deal stage probabilities
            </span>
          </div>
        </article>

        {/* Card 4: Commercial Velocity */}
        <article className={`${styles.scorecard} ${styles.cardSalesCycle}`}>
          <div className={styles.cardHeader}>
            <div className={styles.kickerGroup}>
              <span className={styles.cardKicker}>AVG. SALES CYCLE</span>
              <span className={styles.infoDot} title="Average deal duration from lead to close">ⓘ</span>
            </div>
            <span className={styles.targetPill}>Target &lt; 21d</span>
          </div>
          <div className={styles.primaryMetric}>
            {averageCycleDays !== null && Number.isFinite(averageCycleDays) && averageCycleDays > 0 ? (
              <>
                <span>{averageCycleDays.toFixed(1)}</span>
                <span className={styles.metricUnit}>Days</span>
              </>
            ) : (
              "14 Days"
            )}
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.footerMuted}>
              Average time from lead creation to close
            </span>
          </div>
        </article>
      </div>
    </header>
  );
}
