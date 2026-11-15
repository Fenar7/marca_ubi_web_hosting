"use client";

/**
 * @file CommercialDealsLedger.tsx
 * @description Master Commercial Deals Ledger modeled 1:1 after the AI Manager Lead List archetype.
 *              Features 5-segment horizontal progress pip bars, SLA urgency indicators,
 *              instantaneous search, filter tabs, and direct stage advancement triggers.
 * @module admin/components/Dashboard/CommercialDealsLedger
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./CommercialDealsLedger.module.scss";

export type LedgerFilterTab = "all" | "high_value" | "overdue" | "today";

export interface CommercialDealsLedgerProps {
  records?: OverviewRecord[];
  recordsReady?: boolean;
  financials?: boolean;
  onAdvanceStage?: (record: OverviewRecord) => void;
  onOpenDossier?: (record: OverviewRecord) => void;
}

function getInitials(name: string): string {
  if (!name) return "CL";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Resolves the 5-segment pip fill level and percentage for a given stage */
function getStagePipProgress(stageName: string): { filled: number; percentage: number; color: string } {
  const norm = stageName.trim().toLowerCase();
  if (norm.includes("won") || norm.includes("converted")) {
    return { filled: 5, percentage: 100, color: "#059669" };
  }
  if (norm.includes("negotiation") || norm.includes("review")) {
    return { filled: 4, percentage: 85, color: "#ea002a" };
  }
  if (norm.includes("proposal") || norm.includes("pitch")) {
    return { filled: 4, percentage: 80, color: "#d97706" };
  }
  if (norm.includes("qualified") || norm.includes("discovery")) {
    return { filled: 3, percentage: 60, color: "#111111" };
  }
  if (norm.includes("contacted") || norm.includes("follow")) {
    return { filled: 2, percentage: 40, color: "#111111" };
  }
  return { filled: 1, percentage: 20, color: "#111111" };
}

/** Determines SLA urgency intervals */
function getUrgencyStatus(due: string | null): { text: string; isOverdue: boolean } {
  if (!due) return { text: "• In cadence", isOverdue: false };
  const time = new Date(due).getTime();
  if (!Number.isFinite(time)) return { text: "• In cadence", isOverdue: false };

  const now = Date.now();
  const diffDays = Math.floor((time - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `⚠️ ${Math.abs(diffDays)}d overdue`, isOverdue: true };
  }
  if (diffDays === 0) {
    return { text: "• Due today", isOverdue: false };
  }
  return { text: `• Due in ${diffDays}d`, isOverdue: false };
}

export const CommercialDealsLedger: React.FC<CommercialDealsLedgerProps> = ({
  records = [],
  recordsReady = true,
  financials = true,
  onAdvanceStage,
  onOpenDossier,
}) => {
  const [activeTab, setActiveTab] = useState<LedgerFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Tab counts
  const highValueCount = useMemo(
    () => records.filter((r) => (r.expectedValue ?? 0) >= 1000000).length,
    [records]
  );
  const overdueCount = useMemo(
    () => records.filter((r) => getUrgencyStatus(r.due).isOverdue).length,
    [records]
  );
  const todayCount = useMemo(
    () => records.filter((r) => getUrgencyStatus(r.due).text === "• Due today").length,
    [records]
  );

  // Filtering pipeline
  const filteredRecords = useMemo(() => {
    let list = records;

    // Tab filter
    if (activeTab === "high_value") {
      list = list.filter((r) => (r.expectedValue ?? 0) >= 1000000);
    } else if (activeTab === "overdue") {
      list = list.filter((r) => getUrgencyStatus(r.due).isOverdue);
    } else if (activeTab === "today") {
      list = list.filter((r) => getUrgencyStatus(r.due).text === "• Due today");
    }

    // Search query filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.name, r.company, r.leadId, r.serviceCategory, r.owner, r.stage].some(
          (val) => val?.toLowerCase().includes(q)
        )
      );
    }

    return list;
  }, [records, activeTab, searchQuery]);

  const displayedRecords = useMemo(() => {
    return filteredRecords.slice(0, 10);
  }, [filteredRecords]);

  return (
    <section
      className={styles.ledgerCard}
      aria-labelledby="commercial-ledger-title"
    >
      <header className={styles.ledgerHeader}>
        <div className={styles.headerTitleBlock}>
          <div className={styles.eyebrowRow}>
            <span className={styles.dot} aria-hidden="true" />
            <p className={styles.eyebrow}>Commercial Pipeline &amp; Action Queue</p>
          </div>
          <h2 className={styles.title} id="commercial-ledger-title">
            Commercial Opportunities
          </h2>
          <p className={styles.subtitle}>
            Enterprise opportunities, stage velocity progress pips, and instantaneous actions
          </p>
        </div>

        <div className={styles.searchWrapper}>
          <label className={styles.searchLabel} htmlFor="ledger-search-input">
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
              className={styles.searchIcon}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className={styles.srOnly}>Search opportunities</span>
          </label>
          <input
            id="ledger-search-input"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals, company, rep..."
          />
        </div>
      </header>

      {/* Filter Tabs */}
      <div className={styles.filterToolbar}>
        <div className={styles.tabsRow} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={`${styles.tabBtn} ${
              activeTab === "all" ? styles.tabBtnActive : ""
            }`}
            onClick={() => setActiveTab("all")}
          >
            <span>All Deals</span>
            <span className={styles.countBadge}>{records.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "high_value"}
            className={`${styles.tabBtn} ${
              activeTab === "high_value" ? styles.tabBtnActive : ""
            }`}
            onClick={() => setActiveTab("high_value")}
          >
            <span>High Value (&gt; ₹10L)</span>
            <span className={styles.countBadge}>{highValueCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overdue"}
            className={`${styles.tabBtn} ${
              activeTab === "overdue" ? styles.tabBtnActive : ""
            }`}
            onClick={() => setActiveTab("overdue")}
          >
            <span>Overdue Action</span>
            <span className={`${styles.countBadge} ${overdueCount > 0 ? styles.countBadgeOverdue : ""}`}>
              {overdueCount}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "today"}
            className={`${styles.tabBtn} ${
              activeTab === "today" ? styles.tabBtnActive : ""
            }`}
            onClick={() => setActiveTab("today")}
          >
            <span>Scheduled Today</span>
            <span className={styles.countBadge}>{todayCount}</span>
          </button>
        </div>
      </div>

      <div className={styles.tableResponsiveWrapper}>
        <table className={styles.dealsTable}>
          <thead>
            <tr>
              <th scope="col">Opportunity / client</th>
              <th scope="col">Service</th>
              <th scope="col">Stage &amp; progress</th>
              <th scope="col">Expected value</th>
              <th scope="col">Account owner</th>
              <th scope="col" style={{ textAlign: "right", paddingRight: "1.4rem" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {!recordsReady ? (
              <tr>
                <td colSpan={6} className={styles.emptyState} role="status">
                  Loading opportunities...
                </td>
              </tr>
            ) : displayedRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState} role="status">
                  No commercial opportunities match your filter.
                </td>
              </tr>
            ) : (
              displayedRecords.map((deal) => {
                const pip = getStagePipProgress(deal.stage);
                const urgency = getUrgencyStatus(deal.due);
                const displayName = deal.company || deal.name;

                return (
                  <tr key={deal.id} className={styles.tableRow}>
                    {/* Opportunity & Client Monogram */}
                    <td>
                      <div className={styles.clientCell}>
                        <div className={styles.avatarPill} aria-hidden="true">
                          {getInitials(displayName)}
                        </div>
                        <Link
                          className={styles.dealLink}
                          href={deal.href || `/admin/leads?id=${encodeURIComponent(deal.id)}`}
                          onClick={(e) => {
                            if (onOpenDossier) {
                              e.preventDefault();
                              onOpenDossier(deal);
                            }
                          }}
                        >
                          <strong className={styles.dealTitle}>
                            {displayName}
                          </strong>
                          <div className={styles.dealMeta}>
                            <span className={styles.leadIdTag}>{deal.leadId}</span>
                            <span className={styles.dotDivider}>·</span>
                            <span>{deal.serviceCategory || "Advisory"}</span>
                          </div>
                        </Link>
                      </div>
                    </td>

                    {/* Service Category */}
                    <td>
                      <span className={styles.serviceTag}>
                        {deal.serviceCategory || "Web & Digital"}
                      </span>
                    </td>

                    {/* Stage & Multi-Segment Progress Pips */}
                    <td>
                      <div className={styles.stageProgressCell}>
                        <div className={styles.stageTokenRow}>
                          <span className={styles.stageName}>{deal.stage}</span>
                          {urgency.isOverdue && (
                            <span className={styles.overdueTag}>{urgency.text}</span>
                          )}
                        </div>

                        {/* 5-segment pip bar */}
                        <div className={styles.pipTrack} aria-label={`${deal.stage} progress: ${pip.percentage}%`}>
                          {[1, 2, 3, 4, 5].map((segmentIdx) => (
                            <span
                              key={segmentIdx}
                              className={`${styles.pipSegment} ${
                                segmentIdx <= pip.filled ? styles.pipSegmentFilled : ""
                              }`}
                              style={segmentIdx <= pip.filled ? { backgroundColor: pip.color } : {}}
                            />
                          ))}
                          <span className={styles.pipPercentage}>{pip.percentage}%</span>
                        </div>
                      </div>
                    </td>

                    {/* Value */}
                    <td className={styles.amount}>
                      {financials
                        ? formatCrmCurrency(deal.expectedValue ?? 0)
                        : "Confidential"}
                    </td>

                    {/* Owner */}
                    <td>
                      <span className={styles.ownerBadge}>
                        {deal.owner || "Unassigned"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className={styles.actionsCluster}>
                        <button
                          type="button"
                          className={styles.advanceBtn}
                          onClick={() => {
                            if (onAdvanceStage) {
                              onAdvanceStage(deal);
                            }
                          }}
                          aria-label={`Advance stage for ${deal.name}`}
                        >
                          <span>Advance</span>
                          <span aria-hidden="true">→</span>
                        </button>

                        <Link
                          href={deal.href || `/admin/leads?id=${encodeURIComponent(deal.id)}`}
                          className={styles.dossierBtn}
                          title={`Open dossier for ${deal.name}`}
                          aria-label={`Open dossier for ${deal.name}`}
                          onClick={(e) => {
                            if (onOpenDossier) {
                              e.preventDefault();
                              onOpenDossier(deal);
                            }
                          }}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <line x1="7" y1="17" x2="17" y2="7" />
                            <polyline points="7 7 17 7 17 17" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className={styles.tableFooter}>
        <span className={styles.sampleNote}>
          Showing {displayedRecords.length} of {filteredRecords.length} opportunities
        </span>
        <Link href="/admin/deals" className={styles.openDealsLink}>
          <span>Open all deals</span>
          <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </section>
  );
};
