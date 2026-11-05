"use client";

import React from "react";
import Link from "next/link";
import type { ExecutiveDashboardKpis } from "./types";
import styles from "./ExecutiveKpiGrid.module.scss";

export interface ExecutiveKpiGridProps {
  kpis?: ExecutiveDashboardKpis | null;
  cadenceLabel?: string;
  dataStatus?: "ready" | "unavailable";
}

/** Missing comparisons remain unavailable because a zero baseline cannot yield a truthful rate. */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDelta(
  value: number | null | undefined,
  cadence: string,
): string {
  if (value === null || value === undefined) return "Comparison unavailable";
  const sign = value > 0 ? "+" : "";
  return sign + value.toFixed(1) + "% " + cadence;
}

function deltaClass(value: number | null | undefined): string {
  if (value === null || value === undefined) return styles.neutral;
  return value >= 0 ? styles.positive : styles.negative;
}

export const ExecutiveKpiGrid: React.FC<ExecutiveKpiGridProps> = ({
  kpis,
  cadenceLabel,
  dataStatus,
}) => {
  if (!kpis || dataStatus === "unavailable") {
    return (
      <section
        className={styles.gridContainer}
        aria-label="Executive key performance indicators"
      >
        <p className={styles.unavailableState} role="status">
          Dashboard metrics are unavailable. Try again when the CRM data source
          is reachable.
        </p>
      </section>
    );
  }

  const cadence = cadenceLabel || kpis.cadenceLabel || "comparison";
  const cards = [
    {
      label: "Active Pipeline",
      value: formatCurrency(kpis.totalPipelineValue),
      delta: kpis.pipelineDeltaPercentage,
      footer:
        kpis.weightedPipelineValue === null
          ? "Weighted value unavailable"
          : "Weighted value: " + formatCurrency(kpis.weightedPipelineValue),
      href: "/admin/deals",
      iconClass: styles.skyBlue,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      label: "Converted Contract Value",
      value: formatCurrency(kpis.convertedRevenueValue),
      delta: kpis.revenueDeltaPercentage,
      footer:
        kpis.convertedDealsCount.toLocaleString("en-IN") +
        " conversions among leads created in this period",
      href: "/admin/analytics",
      iconClass: styles.mintGreen,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "Active Deals",
      value: kpis.activeDealsCount.toLocaleString("en-IN"),
      delta: kpis.dealsDeltaPercentage,
      footer:
        kpis.slaOnTrackPercentage === null ||
        kpis.slaOnTrackPercentage === undefined
          ? "Follow-up SLA unavailable"
          : kpis.slaOnTrackPercentage.toFixed(1) + "% follow-ups on track",
      href: "/admin/deals",
      iconClass: styles.lavender,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Win Conversion Rate",
      value:
        kpis.conversionWinRate === null
          ? "Unavailable"
          : kpis.conversionWinRate.toFixed(1) + "%",
      delta: kpis.winRateDeltaPercentage,
      footer:
        kpis.averageSalesCycleDays === null ||
        kpis.averageSalesCycleDays === undefined
          ? "Sales cycle unavailable"
          : "Average sales cycle: " +
            kpis.averageSalesCycleDays.toFixed(1) +
            " days",
      href: "/admin/analytics",
      iconClass: styles.warmAmber,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
  ];

  return (
    <section
      className={styles.gridContainer}
      aria-label="Executive key performance indicators"
    >
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className={styles.kpiCard}
          aria-label={card.label + ": " + card.value + ". " + card.footer}
        >
          <div className={styles.cardTopRow}>
            <div className={styles.iconChip + " " + card.iconClass}>
              {card.icon}
            </div>
            <span className={styles.circleBtn} aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.kpiLabel}>{card.label}</span>
            <div className={styles.metricRow}>
              <span className={styles.kpiValue}>{card.value}</span>
              <span className={styles.deltaPill + " " + deltaClass(card.delta)}>
                {formatDelta(card.delta, cadence)}
              </span>
            </div>
          </div>
          <div className={styles.cardFooter}>{card.footer}</div>
        </Link>
      ))}
    </section>
  );
};
