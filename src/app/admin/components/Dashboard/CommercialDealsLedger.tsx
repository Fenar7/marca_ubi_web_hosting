"use client";

/**
 * @file CommercialDealsLedger.tsx
 * @description Master Commercial Deals & Opportunities Ledger implementing the Marca Ubi
 *              Editorial Luxury standard. Features concurrent search filtering (useDeferredValue),
 *              recessed segmented rail controls, continuous tactile milestone progress tracks,
 *              Swiss Helvetica Neue 300 Light tabular numerals, and zero-CLS skeleton states.
 * @module admin/components/Dashboard/CommercialDealsLedger
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useMemo, useState, useDeferredValue } from "react";
import Link from "next/link";
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

/** Extracts clean uppercase initials for squircle monograms */
function getInitials(name: string): string {
  if (!name) return "CL";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Resolves deterministic luxury mineral pastel styling for client monogram avatar */
function getClientAvatarStyle(name: string): { bg: string; color: string; border: string } {
  const PALETTES = [
    { bg: "#f1f3f7", color: "#2c3a50", border: "#dce3ec" }, // Soft Slate
    { bg: "#f6f3ee", color: "#4a3e35", border: "#e8e2d8" }, // Warm Taupe
    { bg: "#eef4f0", color: "#264332", border: "#d5e5db" }, // Mineral Sage
    { bg: "#f9f6f0", color: "#453c29", border: "#ede5d5" }, // Desert Sand
    { bg: "#f0f3f9", color: "#243b53", border: "#d9e2ec" }, // Nordic Indigo
    { bg: "#fdf2f4", color: "#6e2938", border: "#f7d6dd" }, // Rose Quartz
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

/** Resolves the milestone progression percentage and semantic tone for a given deal stage */
function getStagePipProgress(stageName: string): { filled: number; percentage: number; color: string } {
  const norm = stageName ? stageName.trim().toLowerCase() : "";
  if (norm.includes("won") || norm.includes("converted")) {
    return { filled: 5, percentage: 100, color: "#059669" };
  }
  if (norm.includes("negotiation") || norm.includes("review")) {
    return { filled: 4, percentage: 85, color: "#111111" };
  }
  if (norm.includes("proposal") || norm.includes("pitch")) {
    return { filled: 4, percentage: 80, color: "#111111" };
  }
  if (norm.includes("qualified") || norm.includes("discovery")) {
    return { filled: 3, percentage: 60, color: "#111111" };
  }
  if (norm.includes("contacted") || norm.includes("follow")) {
    return { filled: 2, percentage: 40, color: "#111111" };
  }
  return { filled: 1, percentage: 20, color: "#111111" };
}

/** Determines SLA urgency intervals with calendar-normalized cadence */
function getUrgencyStatus(due: string | null): { text: string; isOverdue: boolean; isToday: boolean } {
  if (!due) return { text: "On track", isOverdue: false, isToday: false };
  const target = new Date(due);
  if (!Number.isFinite(target.getTime())) return { text: "On track", isOverdue: false, isToday: false };

  const now = new Date();
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Follow-up ${Math.abs(diffDays)}d ago`, isOverdue: true, isToday: false };
  }
  if (diffDays === 0) {
    return { text: "Due today", isOverdue: false, isToday: true };
  }
  return { text: `Due in ${diffDays}d`, isOverdue: false, isToday: false };
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
  const deferredSearchQuery = useDeferredValue(searchQuery);

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
    () => records.filter((r) => getUrgencyStatus(r.due).isToday).length,
    [records]
  );

  // Filtering pipeline using deferred query for 60fps typing velocity
  const filteredRecords = useMemo(() => {
    let list = records;

    // Tab filter
    if (activeTab === "high_value") {
      list = list.filter((r) => (r.expectedValue ?? 0) >= 1000000);
    } else if (activeTab === "overdue") {
      list = list.filter((r) => getUrgencyStatus(r.due).isOverdue);
    } else if (activeTab === "today") {
      list = list.filter((r) => getUrgencyStatus(r.due).isToday);
    }

    // Search query filter
    const q = deferredSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.name, r.company, r.leadId, r.serviceCategory, r.owner, r.stage].some(
          (val) => val?.toLowerCase().includes(q)
        )
      );
    }

    return list;
  }, [records, activeTab, deferredSearchQuery]);

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
            <p className={styles.eyebrow}>Commercial Opportunities</p>
          </div>
          <h2 className={styles.title} id="commercial-ledger-title">
            Deals &amp; Opportunities
          </h2>
          <p className={styles.subtitle}>
            Active pipeline deals, stage progress, and upcoming actions.
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

      {/* Recessed Segmented Filter Control Rail */}
      <div className={styles.filterToolbar}>
        <div
          className={styles.segmentedControl}
          role="tablist"
          aria-label="Filter opportunities by urgency or deal value"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={`${styles.segmentBtn} ${
              activeTab === "all" ? styles.segmentBtnActive : ""
            }`}
            onClick={() => setActiveTab("all")}
          >
            <span>All Deals</span>
            <span className={styles.segmentCount}>{records.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "high_value"}
            className={`${styles.segmentBtn} ${
              activeTab === "high_value" ? styles.segmentBtnActive : ""
            }`}
            onClick={() => setActiveTab("high_value")}
          >
            <span>High Value (&gt; ₹10L)</span>
            <span className={styles.segmentCount}>{highValueCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overdue"}
            className={`${styles.segmentBtn} ${
              activeTab === "overdue" ? styles.segmentBtnActive : ""
            }`}
            onClick={() => setActiveTab("overdue")}
          >
            <span>Needs Follow-up</span>
            <span
              className={`${styles.segmentCount} ${
                overdueCount > 0 ? styles.segmentCountAlert : ""
              }`}
            >
              {overdueCount}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "today"}
            className={`${styles.segmentBtn} ${
              activeTab === "today" ? styles.segmentBtnActive : ""
            }`}
            onClick={() => setActiveTab("today")}
          >
            <span>Scheduled Today</span>
            <span className={styles.segmentCount}>{todayCount}</span>
          </button>
        </div>
      </div>

      {/* Desktop View: Semantic High-Density Table (>= 840px) */}
      <div className={styles.desktopTableWrapper}>
        <table className={styles.dealsTable}>
          <thead>
            <tr>
              <th scope="col">Deal / Client</th>
              <th scope="col">Service</th>
              <th scope="col">Stage &amp; Progress</th>
              <th scope="col" style={{ textAlign: "right" }}>Expected Value</th>
              <th scope="col">Owner</th>
              <th scope="col" style={{ textAlign: "right", paddingRight: "1.4rem" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {!recordsReady ? (
              // Zero-CLS Layout-Matched Skeleton Rows
              [...Array(5)].map((_, i) => (
                <tr key={`skeleton-${i}`} className={styles.skeletonRow} aria-hidden="true">
                  <td>
                    <div className={styles.clientCell}>
                      <div className={styles.skeletonAvatar} />
                      <div className={styles.skeletonMeta}>
                        <div className={styles.skeletonLineLong} />
                        <div className={styles.skeletonLineShort} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.skeletonPill} />
                  </td>
                  <td>
                    <div className={styles.skeletonStageBlock}>
                      <div className={styles.skeletonLineShort} />
                      <div className={styles.skeletonTrack} />
                    </div>
                  </td>
                  <td>
                    <div className={styles.skeletonValue} />
                  </td>
                  <td>
                    <div className={styles.skeletonOwner} />
                  </td>
                  <td>
                    <div className={styles.skeletonActions} />
                  </td>
                </tr>
              ))
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
                const displayName = deal.company || deal.name || "Untitled Opportunity";
                const avatarStyle = getClientAvatarStyle(displayName);
                const digitsOnly = Math.round(deal.expectedValue ?? 0).toLocaleString("en-IN");

                return (
                  <tr key={deal.id} className={styles.tableRow}>
                    {/* Opportunity & Client Monogram */}
                    <td>
                      <div className={styles.clientCell}>
                        <div
                          className={styles.avatarSquircle}
                          style={{
                            backgroundColor: avatarStyle.bg,
                            color: avatarStyle.color,
                            borderColor: avatarStyle.border,
                          }}
                          aria-hidden="true"
                        >
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
                            <span className={styles.serviceMetaText}>{deal.serviceCategory || "Advisory"}</span>
                          </div>
                        </Link>
                      </div>
                    </td>

                    {/* Service Category */}
                    <td>
                      <span className={styles.serviceText}>
                        {deal.serviceCategory || "Web & Digital"}
                      </span>
                    </td>

                    {/* Stage & Continuous Milestone Progress Track */}
                    <td>
                      <div className={styles.stageProgressCell}>
                        <div className={styles.stageTokenRow}>
                          <span className={styles.stageName}>{deal.stage}</span>
                          <span className={styles.stageSeparator}>·</span>
                          <span className={styles.stagePercentage}>{pip.percentage}%</span>
                        </div>

                        {/* Continuous Milestone Track with 4 Hairline Stage Divider Ticks */}
                        <div
                          className={styles.milestoneTrack}
                          role="progressbar"
                          aria-valuenow={pip.percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${deal.stage} progress: ${pip.percentage}%`}
                        >
                          <div
                            className={styles.milestoneBar}
                            style={{
                              width: `${pip.percentage}%`,
                              backgroundColor: pip.color,
                            }}
                          />
                          <span className={styles.milestoneTick} style={{ left: "20%" }} aria-hidden="true" />
                          <span className={styles.milestoneTick} style={{ left: "40%" }} aria-hidden="true" />
                          <span className={styles.milestoneTick} style={{ left: "60%" }} aria-hidden="true" />
                          <span className={styles.milestoneTick} style={{ left: "80%" }} aria-hidden="true" />
                        </div>

                        {/* SLA Cadence Text (Unboxed Editorial Typography) */}
                        <div className={styles.cadenceRow}>
                          {urgency.isToday ? (
                            <span className={styles.cadenceToday}>{urgency.text}</span>
                          ) : urgency.isOverdue ? (
                            <span className={styles.cadenceOverdue}>{urgency.text}</span>
                          ) : (
                            <span className={styles.cadenceMuted}>{urgency.text}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Swiss Tabular Numeral Value */}
                    <td className={styles.amountCell}>
                      {financials ? (
                        <div className={styles.currencyDisplay}>
                          <span className={styles.currencyGlyph}>₹</span>
                          <span className={styles.currencyDigits}>{digitsOnly}</span>
                        </div>
                      ) : (
                        <span className={styles.confidentialText}>Confidential</span>
                      )}
                    </td>

                    {/* Executive Representative Indicator (Purging Owner Pill Badge) */}
                    <td>
                      <div className={styles.ownerCell}>
                        {deal.owner ? (
                          <>
                            <div className={styles.ownerAvatar} aria-hidden="true">
                              {getInitials(deal.owner)}
                            </div>
                            <span className={styles.ownerName}>{deal.owner}</span>
                          </>
                        ) : (
                          <span className={styles.ownerUnassigned}>Unassigned</span>
                        )}
                      </div>
                    </td>

                    {/* Tactile Actions Pair */}
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
                          aria-label={`Advance stage for ${displayName}`}
                        >
                          <span>Advance</span>
                          <span aria-hidden="true">→</span>
                        </button>

                        <Link
                          href={deal.href || `/admin/leads?id=${encodeURIComponent(deal.id)}`}
                          className={styles.dossierBtn}
                          title={`Open dossier for ${displayName}`}
                          aria-label={`Open dossier for ${displayName}`}
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

      {/* Mobile Reflow Dual View: High-Density Editorial Cards (< 840px down to 320px) */}
      <div className={styles.mobileCardsContainer}>
        {!recordsReady ? (
          [...Array(3)].map((_, i) => (
            <div key={`m-skeleton-${i}`} className={styles.mobileCardSkeleton} aria-hidden="true">
              <div className={styles.skeletonLineLong} />
              <div className={styles.skeletonLineShort} />
            </div>
          ))
        ) : displayedRecords.length === 0 ? (
          <div className={styles.emptyState}>
            No commercial opportunities match your filter.
          </div>
        ) : (
          displayedRecords.map((deal) => {
            const pip = getStagePipProgress(deal.stage);
            const urgency = getUrgencyStatus(deal.due);
            const displayName = deal.company || deal.name || "Untitled Opportunity";
            const avatarStyle = getClientAvatarStyle(displayName);
            const digitsOnly = Math.round(deal.expectedValue ?? 0).toLocaleString("en-IN");

            return (
              <article key={`mob-${deal.id}`} className={styles.mobileDealCard}>
                <div className={styles.mobileTopRow}>
                  <div className={styles.clientCell}>
                    <div
                      className={styles.avatarSquircle}
                      style={{
                        backgroundColor: avatarStyle.bg,
                        color: avatarStyle.color,
                        borderColor: avatarStyle.border,
                      }}
                      aria-hidden="true"
                    >
                      {getInitials(displayName)}
                    </div>
                    <div className={styles.mobileTitleBlock}>
                      <strong className={styles.dealTitle}>{displayName}</strong>
                      <div className={styles.dealMeta}>
                        <span className={styles.leadIdTag}>{deal.leadId}</span>
                        <span className={styles.dotDivider}>·</span>
                        <span className={styles.serviceMetaText}>{deal.serviceCategory || "Advisory"}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.mobileValueBlock}>
                    {financials ? (
                      <div className={styles.currencyDisplay}>
                        <span className={styles.currencyGlyph}>₹</span>
                        <span className={styles.currencyDigits}>{digitsOnly}</span>
                      </div>
                    ) : (
                      <span className={styles.confidentialText}>Confidential</span>
                    )}
                  </div>
                </div>

                <div className={styles.mobileMiddleRow}>
                  <div className={styles.stageTokenRow}>
                    <span className={styles.stageName}>{deal.stage}</span>
                    <span className={styles.stageSeparator}>·</span>
                    <span className={styles.stagePercentage}>{pip.percentage}%</span>
                  </div>

                  <div
                    className={styles.milestoneTrack}
                    role="progressbar"
                    aria-valuenow={pip.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${deal.stage} progress: ${pip.percentage}%`}
                  >
                    <div
                      className={styles.milestoneBar}
                      style={{
                        width: `${pip.percentage}%`,
                        backgroundColor: pip.color,
                      }}
                    />
                    <span className={styles.milestoneTick} style={{ left: "20%" }} aria-hidden="true" />
                    <span className={styles.milestoneTick} style={{ left: "40%" }} aria-hidden="true" />
                    <span className={styles.milestoneTick} style={{ left: "60%" }} aria-hidden="true" />
                    <span className={styles.milestoneTick} style={{ left: "80%" }} aria-hidden="true" />
                  </div>

                  <div className={styles.mobileCadenceAndOwner}>
                    {urgency.isToday ? (
                      <span className={styles.cadenceToday}>{urgency.text}</span>
                    ) : urgency.isOverdue ? (
                      <span className={styles.cadenceOverdue}>{urgency.text}</span>
                    ) : (
                      <span className={styles.cadenceMuted}>{urgency.text}</span>
                    )}

                    <div className={styles.ownerCell}>
                      {deal.owner ? (
                        <>
                          <div className={styles.ownerAvatar} aria-hidden="true">
                            {getInitials(deal.owner)}
                          </div>
                          <span className={styles.ownerName}>{deal.owner}</span>
                        </>
                      ) : (
                        <span className={styles.ownerUnassigned}>Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.mobileActionsRow}>
                  <button
                    type="button"
                    className={styles.advanceBtn}
                    onClick={() => {
                      if (onAdvanceStage) {
                        onAdvanceStage(deal);
                      }
                    }}
                    aria-label={`Advance stage for ${displayName}`}
                  >
                    <span>Advance Stage</span>
                    <span aria-hidden="true">→</span>
                  </button>

                  <Link
                    href={deal.href || `/admin/leads?id=${encodeURIComponent(deal.id)}`}
                    className={styles.dossierBtn}
                    title={`Open dossier for ${displayName}`}
                    aria-label={`Open dossier for ${displayName}`}
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
              </article>
            );
          })
        )}
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
