"use client";

/**
 * @file LuxuryVirtualCard.tsx
 * @description Obsidian Executive anchor card for the Marca Ubi Commercial Desk.
 *              Displays visible open pipeline valuation (or active deal count when financials
 *              are restricted), cohort win summary, and an accessible drill-down link.
 * @module admin/components/Dashboard/LuxuryVirtualCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from "react";
import Link from "next/link";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import styles from "./LuxuryVirtualCard.module.scss";

export interface LuxuryVirtualCardProps {
  userName?: string;
  balance?: number | null;
  dealCount?: number | null;
  periodLabel?: string;
  cohort?: { eligible: number; won: number } | null;
  financials?: boolean;
  pipelineReady?: boolean;
  recordRoute?: string | null;
}

/**
 * Renders the Obsidian Executive Visible Pipeline card with 1:1 sibling numeral
 * typography and explicit unavailable / restricted-financials states.
 */
export const LuxuryVirtualCard: React.FC<LuxuryVirtualCardProps> = ({
  userName = "MARCA UBI DESK",
  balance = null,
  dealCount = 0,
  periodLabel = "Last 30 Days",
  cohort,
  financials = true,
  pipelineReady = true,
  recordRoute,
}) => {
  const safeDealCount = dealCount ?? 0;
  const isUnavailable =
    pipelineReady === false || (financials && balance === null);

  const canNavigateToDeals = Boolean(recordRoute);
  const resolvedDealsHref = `${recordRoute ?? "/admin/deals"}?bucket=open`;

  const cohortText = cohort
    ? cohort.eligible > 0
      ? `Cohort (${periodLabel}): ${cohort.won} of ${cohort.eligible} won (${Math.round((cohort.won / cohort.eligible) * 100)}%)`
      : `Cohort (${periodLabel}): No new leads`
    : null;

  return (
    <article
      className={styles.virtualCard}
      aria-label={`Visible Pipeline snapshot for ${userName}`}
    >
      <header className={styles.cardHeader}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.eyebrowRow}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span className={styles.eyebrow}>VISIBLE PIPELINE</span>
          </div>
          <span className={styles.scopeSubtitle}>Current open &amp; potential deals</span>
        </div>

        <span className={styles.dealsCapsule}>
          {safeDealCount} {safeDealCount === 1 ? "Deal" : "Deals"}
        </span>
      </header>

      <div className={styles.cardBody}>
        {isUnavailable ? (
          <p className={styles.unavailableText}>Pipeline unavailable</p>
        ) : financials && balance !== null ? (
          <p className={styles.heroFigure}>{formatCrmCurrency(balance)}</p>
        ) : (
          <p className={styles.heroFigure}>
            {safeDealCount} Active {safeDealCount === 1 ? "Deal" : "Deals"}
          </p>
        )}
      </div>

      <footer className={styles.cardFooter}>
        {canNavigateToDeals ? (
          <Link href={resolvedDealsHref} className={styles.dealsLink}>
            <span>Open pipeline</span>
            <svg
              className={styles.linkChevron}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ) : (
          <span className={styles.dealsText}>Active deals summary</span>
        )}

        {cohortText && <span className={styles.cohortText}>{cohortText}</span>}
      </footer>
    </article>
  );
};
