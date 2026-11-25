"use client";

/**
 * @file LuxuryVirtualCard.tsx
 * @description Master Executive VIP Virtual Card Widget modeled 1:1 after the Conyest/Finlo luxury archetype.
 *              Features dark obsidian/forest backdrop, concentric SVG watermark arcs,
 *              large tabular valuation, and executive metadata chips.
 * @module admin/components/Dashboard/LuxuryVirtualCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from "react";
import { useRouter } from "next/navigation";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import styles from "./LuxuryVirtualCard.module.scss";

export interface LuxuryVirtualCardProps {
  userName?: string;
  balance?: number | null;
  dealCount?: number | null;
  winRate?: number | null;
  periodLabel?: string;
  cohort?: { eligible: number; won: number } | null;
  financials?: boolean;
}

export const LuxuryVirtualCard: React.FC<LuxuryVirtualCardProps> = ({
  userName = "MARCA UBI DESK",
  balance = null,
  dealCount = 0,
  winRate = null,
  periodLabel = "Last 30 Days",
  cohort,
  financials = true,
}) => {
  const router = useRouter();
  const displayBalance =
    financials && balance !== null ? formatCrmCurrency(balance) : "Confidential";

  const resolvedWinRate =
    cohort && cohort.eligible > 0
      ? Math.round((cohort.won / cohort.eligible) * 100)
      : typeof winRate === "number"
        ? winRate
        : null;

  return (
    <article
      className={styles.virtualCard}
      aria-label="Executive Commercial Desk Virtual Balance Card"
    >
      {/* Subtle Concentric Luxury Vector Watermark */}
      <svg
        className={styles.watermarkSvg}
        viewBox="0 0 320 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="280" cy="40" r="140" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.5" />
        <circle cx="280" cy="40" r="100" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1.5" />
        <circle cx="280" cy="40" r="60" stroke="rgba(234, 0, 42, 0.12)" strokeWidth="1.5" />
        <circle cx="280" cy="40" r="24" fill="rgba(234, 0, 42, 0.08)" />
      </svg>

      {/* Top Header: Moniker Only (Toggle Removed) */}
      <div className={styles.cardHeader}>
        <div className={styles.monikerGroup}>
          <span className={styles.monikerPrefix}>EXECUTIVE DESK</span>
          <h2 className={styles.monikerTitle}>{userName}</h2>
        </div>
      </div>

      {/* Mid Body: Clickable Balance Drill-Down with Arrow Icon */}
      <div
        className={styles.cardBody}
        role="button"
        tabIndex={0}
        onClick={() => router.push("/admin/deals?bucket=open")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            router.push("/admin/deals?bucket=open");
          }
        }}
        aria-label={`Active Commercial Balance ${displayBalance}. Click to inspect active pipeline deals.`}
      >
        <div className={styles.balanceHeaderRow}>
          <span className={styles.balanceLabel}>Active Commercial Balance</span>
          <svg
            className={styles.cardArrow}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </div>
        <div className={styles.balanceRow}>
          <span className={styles.balanceAmount}>{displayBalance}</span>
        </div>
      </div>

      {/* Bottom Footer: Executive Metadata Chips */}
      <footer className={styles.cardFooter}>
        <div className={styles.metaChip}>
          <span className={styles.metaLabel}>PERIOD</span>
          <span className={styles.metaValue}>{periodLabel}</span>
        </div>
        <div className={styles.metaChip}>
          <span className={styles.metaLabel}>WIN RATE</span>
          <span className={styles.metaValue}>
            {resolvedWinRate !== null ? `${resolvedWinRate}%` : "--"}
          </span>
        </div>
        <div
          className={`${styles.metaChip} ${styles.interactiveChip}`}
          role="button"
          tabIndex={0}
          onClick={() => router.push("/admin/deals?bucket=open")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              router.push("/admin/deals?bucket=open");
            }
          }}
          aria-label={`View ${dealCount ?? 0} active deals in pipeline`}
        >
          <span className={styles.metaLabel}>ACTIVE</span>
          <span className={styles.metaValue}>{dealCount ?? 0} DEALS</span>
        </div>
      </footer>
    </article>
  );
};
