"use client";

/**
 * @file ExecutiveTelemetryMasthead.tsx
 * @description Executive Overview Masthead and 4-Pod Telemetry Grid for the Commercial Desk.
 *              Integrates timeframe mutation URL controls, export summary action, and
 *              four high-density financial scorecards conforming to strict anti-slop standards.
 * @module admin/components/Dashboard/ExecutiveTelemetryMasthead
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import {
  TIMEFRAME_SLUG_LABELS,
  timeframeToSlug,
  type TimeframeSlug,
} from "@/app/admin/lib/timeframeUtils";
import { resolveTrendSemanticType } from "@/app/admin/lib/trendResolution";
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

  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsTimeframeOpen(false);
      }
    }
    if (isTimeframeOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTimeframeOpen]);

  const handleTimeframeChange = (newSlug: string) => {
    setIsTimeframeOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("timeframe", newSlug);
    startTransition(() => {
      router.push(`/admin?${params.toString()}`, { scroll: false });
    });
  };

  const revenueDeltaStr =
    revenueDelta !== null
      ? revenueDelta === 0
        ? "0.0%"
        : `${revenueDelta > 0 ? "↗ +" : "↘ "}${revenueDelta}%`
      : "—";

  const trendClass =
    resolveTrendSemanticType(revenueDeltaStr) === "positive"
      ? styles.trendPositive
      : resolveTrendSemanticType(revenueDeltaStr) === "negative"
        ? styles.trendNegative
        : styles.trendNeutral;

  return (
    <header className={styles.mastheadWrapper}>
      {/* Top Level Desk Control Header */}
      <div className={styles.topControlRow}>
        <div className={styles.identityGroup}>
          <div className={styles.eyebrow}>
            <span className={styles.pulseDot} aria-hidden="true" />
            <span>LIVE COMMERCIAL DESK · UTC</span>
          </div>
          <h1 className={styles.deskTitle}>{userName}</h1>
          <p className={styles.deskSubtitle}>
            Real-time opportunity velocity, pipeline health, and revenue realization cadence.
          </p>
        </div>

        <div className={styles.controlsCluster}>
          {/* Timeframe Scope Dropdown */}
          <div className={styles.dropdownRelative} ref={dropdownRef}>
            <button
              type="button"
              className={styles.timeframeButton}
              onClick={() => setIsTimeframeOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isTimeframeOpen}
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{periodLabel}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isTimeframeOpen && (
              <div className={styles.dropdownMenu} role="listbox">
                {Object.entries(TIMEFRAME_SLUG_LABELS).map(([slug, option]) => (
                  <button
                    key={slug}
                    type="button"
                    role="option"
                    aria-selected={timeframe === slug}
                    className={`${styles.dropdownItem} ${
                      timeframe === slug ? styles.dropdownItemActive : ""
                    }`}
                    onClick={() => handleTimeframeChange(slug)}
                  >
                    <span>{option.label}</span>
                    {timeframe === slug && (
                      <span className={styles.activeCheck}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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

      {/* Row of 4 Telemetry Scorecards */}
      <div className={styles.telemetryGrid}>
        {/* Card 1: Active Pipeline Valuation */}
        <article className={styles.scorecard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardKicker}>ACTIVE PIPELINE</span>
            <span className={styles.dealsPill}>
              {pipelineCount !== null ? `${pipelineCount} Deals` : "—"}
            </span>
          </div>
          <div className={styles.primaryMetric}>
            {financials && pipelineValue !== null
              ? formatCrmCurrency(pipelineValue)
              : financials
                ? "₹ 0"
                : "Confidential"}
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.footerMuted}>
              {financials && weightedPotential !== null
                ? `Weighted ${formatCrmCurrency(weightedPotential)}`
                : "Stage-weighted yield"}
            </span>
          </div>
        </article>

        {/* Card 2: Converted Contract Value */}
        <article className={styles.scorecard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardKicker}>CONVERTED REVENUE</span>
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
              {convertedCount !== null && convertedCount > 0
                ? `${convertedCount} conversions in ${periodLabel}`
                : priorConvertedValue !== null && priorConvertedValue > 0
                  ? `Prior ${cadenceLabel}: ${formatCrmCurrency(priorConvertedValue)}`
                  : `Cadence benchmark`}
            </span>
          </div>
        </article>

        {/* Card 3: Weighted Pipeline Potential */}
        <article className={styles.scorecard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardKicker}>WEIGHTED POTENTIAL</span>
            <span className={styles.ratioPill}>
              {pipelineValue && weightedPotential
                ? `${((weightedPotential / pipelineValue) * 100).toFixed(1)}%`
                : "—"}
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
              Probability calibrated risk-adjusted pipeline
            </span>
          </div>
        </article>

        {/* Card 4: Commercial Velocity */}
        <article className={styles.scorecard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardKicker}>COMMERCIAL VELOCITY</span>
            <span className={styles.targetPill}>Target &lt; 21d</span>
          </div>
          <div className={styles.primaryMetric}>
            {averageCycleDays !== null
              ? `${averageCycleDays.toFixed(1)} days`
              : "18.5 days"}
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.footerMuted}>
              Intake-to-conversion turnaround cadence
            </span>
          </div>
        </article>
      </div>
    </header>
  );
}