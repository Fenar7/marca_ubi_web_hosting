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
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import styles from "./LuxuryVirtualCard.module.scss";

export interface LuxuryVirtualCardProps {
  userName?: string;
  balance?: number | null;
  dealCount?: number | null;
  winRate?: number | null;
  financials?: boolean;
}

export const LuxuryVirtualCard: React.FC<LuxuryVirtualCardProps> = ({
  userName = "MARCA UBI DESK",
  balance = null,
  dealCount = 39,
  winRate = 84,
  financials = true,
}) => {
  const displayBalance =
    financials && balance !== null ? formatCrmCurrency(balance) : "Confidential";

  return (
    <article
      className={styles.virtualCard}
      aria-label="Executive Commercial Desk Virtual Balance Card"
    >
      {/* Subtle Concentric Luxury Vector Watermark with Champagne Titanium Alloy Stroke */}
      <svg
        className={styles.watermarkSvg}
        viewBox="0 0 320 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="280" cy="40" r="140" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.5" />
        <circle cx="280" cy="40" r="100" stroke="rgba(197, 160, 89, 0.08)" strokeWidth="1.5" />
        <circle cx="280" cy="40" r="60" stroke="rgba(197, 160, 89, 0.16)" strokeWidth="1.5" />
        <circle cx="280" cy="40" r="24" fill="rgba(197, 160, 89, 0.08)" />
      </svg>

      {/* Top Header: Moniker Only (Toggle Removed) */}
      <div className={styles.cardHeader}>
        <div className={styles.monikerGroup}>
          <span className={styles.monikerPrefix}>EXECUTIVE DESK</span>
          <h2 className={styles.monikerTitle}>{userName}</h2>
        </div>
      </div>

      {/* Mid Body: Balance Label & Tabular Numerical Amount */}
      <div className={styles.cardBody}>
        <span className={styles.balanceLabel}>Active Commercial Balance</span>
        <div className={styles.balanceRow}>
          <span className={styles.balanceAmount}>{displayBalance}</span>
        </div>
      </div>

      {/* Bottom Footer: Executive Metadata Chips */}
      <footer className={styles.cardFooter}>
        <div className={styles.metaChip}>
          <span className={styles.metaLabel}>PERIOD</span>
          <span className={styles.metaValue}>Q4 2026</span>
        </div>
        <div className={styles.metaChip}>
          <span className={styles.metaLabel}>WIN RATE</span>
          <span className={styles.metaValue}>{winRate}%</span>
        </div>
        <div className={styles.metaChip}>
          <span className={styles.metaLabel}>ACTIVE</span>
          <span className={styles.metaValue}>{dealCount ?? 0} DEALS</span>
        </div>
      </footer>
    </article>
  );
};
