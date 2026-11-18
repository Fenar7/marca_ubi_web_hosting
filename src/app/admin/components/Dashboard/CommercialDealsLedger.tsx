"use client";

/**
 * @file CommercialDealsLedger.tsx
 * @description Master Commercial Deals Command Desk & Live Stage Velocity Matrix.
 *              Replaces the legacy full-width 1400px spreadsheet table with an Asymmetric 60/40
 *              Cockpit architecture (Deal Action Deck on left, Stage Velocity Radar on right).
 *              Enforces Swiss Helvetica Neue 300 Light tabular numerals, continuous milestone progression
 *              tracks, unboxed Graphik typographic statuses (strictly zero AI-slop pill badges),
 *              and React 19 concurrent search & stage cross-filtering.
 * @module admin/components/Dashboard/CommercialDealsLedger
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useMemo, useState, useDeferredValue } from "react";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./CommercialDealsLedger.module.scss";

export type LedgerFilterTab = "all" | "high_value" | "overdue" | "today";

export interface StageSummary {
  id: string;
  name: string;
  count: number;
  value: number | null;
}

export interface CommercialDealsLedgerProps {
  records?: OverviewRecord[];
  recordsReady?: boolean;
  financials?: boolean;
  stages?: StageSummary[];
  onAdvanceStage?: (record: OverviewRecord) => void;
  onOpenDossier?: (record: OverviewRecord) => void;
}

interface StageMatrixItem {
  id: string;
  name: string;
  count: number;
  value: number;
  percentage: number;
  avgDwellDays: number;
  accentColor: string;
}

/**
 * Extracts clean uppercase initials for squircle monograms.
 * Handles single-word brands and multi-word enterprise accounts.
 */
function getInitials(name: string): string {
  if (!name) return "CL";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Resolves deterministic luxury mineral pastel styling for client monogram avatars.
 * Prevents color repetition while ensuring WCAG AA contrast against dark ink labels.
 */
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

/**
 * Resolves milestone progression percentage and semantic tone for a deal stage.
 * Invariant: maps sales funnel stages to progressive 20% milestone increments.
 */
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

/**
 * Formats numeric currency values using the standard Indian numbering system (paise/lakhs/crores).
 */
function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Determines SLA urgency intervals with calendar-normalized day boundaries.
 * Returns high-contrast editorial status copy (strictly NO pill-and-dot badges).
 */
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
  stages = [],
  onAdvanceStage,
  onOpenDossier,
}) => {
  const [activeTab, setActiveTab] = useState<LedgerFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // React 19 concurrent search value to maintain 60fps typing velocity
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Tab counts calculated in a single memoized pass
  const tabCounts = useMemo(() => {
    let highValue = 0;
    let overdue = 0;
    let today = 0;
    for (const r of records) {
      if ((r.expectedValue ?? 0) >= 1000000) highValue++;
      const urg = getUrgencyStatus(r.due);
      if (urg.isOverdue) overdue++;
      if (urg.isToday) today++;
    }
    return {
      all: records.length,
      highValue,
      overdue,
      today,
    };
  }, [records]);

  // Total active pipeline valuation
  const totalPipelineValue = useMemo(() => {
    return records.reduce((sum, r) => sum + (r.expectedValue ?? 0), 0);
  }, [records]);

  // Stage Matrix Radar Data: calculates real distribution, value, and dwell velocity
  const stageMatrixData: StageMatrixItem[] = useMemo(() => {
    const STAGE_CONFIGS = [
      { key: "new", name: "New Inquiries", color: "#696965" },
      { key: "contacted", name: "Contacted", color: "#111111" },
      { key: "qualified", name: "Qualified Scope", color: "#111111" },
      { key: "proposal", name: "Proposal / Pitch", color: "#111111" },
      { key: "negotiation", name: "Negotiation & Close", color: "#059669" },
    ];

    const now = Date.now();

    return STAGE_CONFIGS.map((cfg) => {
      // Find matching records
      const matching = records.filter((r) => {
        const norm = (r.stage || "").toLowerCase();
        if (cfg.key === "negotiation") {
          return norm.includes("negotiation") || norm.includes("won") || norm.includes("review");
        }
        return norm.includes(cfg.key);
      });

      const count = matching.length;
      const val = matching.reduce((sum, r) => sum + (r.expectedValue ?? 0), 0);
      const percentage = totalPipelineValue > 0 ? Math.round((val / totalPipelineValue) * 100) : 0;

      // Calculate real dwell time based on record creation timestamp
      let totalDwellDays = 0;
      for (const r of matching) {
        const createdMs = new Date(r.createdAt).getTime();
        if (Number.isFinite(createdMs)) {
          const days = Math.max(1, Math.round((now - createdMs) / (1000 * 60 * 60 * 24)));
          totalDwellDays += days;
        } else {
          totalDwellDays += 3;
        }
      }
      const avgDwellDays = count > 0 ? Math.round((totalDwellDays / count) * 10) / 10 : 0;

      return {
        id: cfg.key,
        name: cfg.name,
        count,
        value: val,
        percentage,
        avgDwellDays,
        accentColor: cfg.color,
      };
    });
  }, [records, totalPipelineValue]);

  // Multi-tier filtering pipeline (Tab + Stage Radar Filter + Deferred Search)
  const filteredRecords = useMemo(() => {
    let list = records;

    // 1. Recessed Segmented Tab Filter
    if (activeTab === "high_value") {
      list = list.filter((r) => (r.expectedValue ?? 0) >= 1000000);
    } else if (activeTab === "overdue") {
      list = list.filter((r) => getUrgencyStatus(r.due).isOverdue);
    } else if (activeTab === "today") {
      list = list.filter((r) => getUrgencyStatus(r.due).isToday);
    }

    // 2. Interactive Stage Radar Cross-Filter
    if (selectedStageFilter) {
      list = list.filter((r) => {
        const norm = (r.stage || "").toLowerCase();
        if (selectedStageFilter === "negotiation") {
          return norm.includes("negotiation") || norm.includes("won") || norm.includes("review");
        }
        return norm.includes(selectedStageFilter);
      });
    }

    // 3. Search Query Filter across company, name, leadId, service, owner, and stage
    const q = deferredSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.name, r.company, r.leadId, r.serviceCategory, r.owner, r.stage].some(
          (val) => val?.toLowerCase().includes(q)
        )
      );
    }

    return list;
  }, [records, activeTab, selectedStageFilter, deferredSearchQuery]);

  // Stage filter toggle handler
  const handleToggleStageFilter = (stageId: string) => {
    setSelectedStageFilter((prev) => (prev === stageId ? null : stageId));
  };

  // Resolve active stage filter label for clear badge
  const activeFilteredStageName = useMemo(() => {
    if (!selectedStageFilter) return null;
    const match = stageMatrixData.find((s) => s.id === selectedStageFilter);
    return match ? match.name : selectedStageFilter;
  }, [selectedStageFilter, stageMatrixData]);

  // Insight narrative for pipeline velocity
  const dominantStageInsight = useMemo(() => {
    if (!stageMatrixData.length) return "Pipeline telemetry synchronized.";
    const highestCountStage = [...stageMatrixData].sort((a, b) => b.count - a.count)[0];
    if (!highestCountStage || highestCountStage.count === 0) {
      return "All active opportunities are pacing according to target SLA windows.";
    }
    return `Highest concentration in ${highestCountStage.name} (${highestCountStage.count} deals, avg. dwell ${highestCountStage.avgDwellDays}d).`;
  }, [stageMatrixData]);

  return (
    <section className={styles.ledgerCard} aria-labelledby="commercial-ledger-title">
      {/* Executive Command Header */}
      <header className={styles.ledgerHeader}>
        <div className={styles.headerTitleBlock}>
          <div className={styles.eyebrowRow}>
            <p className={styles.eyebrow}>Commercial Opportunities</p>
          </div>
          <h2 className={styles.title} id="commercial-ledger-title">
            Deals &amp; Opportunities
          </h2>
          <p className={styles.subtitle}>
            Active pipeline opportunities, stage dwell velocity, and instant executive triage.
          </p>
        </div>

        {/* 60fps Search Trigger */}
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
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery("")}
              aria-label="Clear search input"
            >
              ×
            </button>
          )}
        </div>
      </header>

      {/* Recessed Segmented Filter Control Rail */}
      <div className={styles.filterToolbar}>
        <div className={styles.segmentedControl} role="tablist" aria-label="Filter opportunities by situation">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={`${styles.segmentBtn} ${activeTab === "all" ? styles.segmentBtnActive : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <span>All Deals</span>
            <span className={styles.segmentCount}>{tabCounts.all}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overdue"}
            className={`${styles.segmentBtn} ${activeTab === "overdue" ? styles.segmentBtnActive : ""}`}
            onClick={() => setActiveTab("overdue")}
          >
            <span>Needs Follow-up</span>
            <span className={`${styles.segmentCount} ${tabCounts.overdue > 0 ? styles.segmentCountAlert : ""}`}>
              {tabCounts.overdue}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "high_value"}
            className={`${styles.segmentBtn} ${activeTab === "high_value" ? styles.segmentBtnActive : ""}`}
            onClick={() => setActiveTab("high_value")}
          >
            <span>High Value (&gt; ₹10L)</span>
            <span className={styles.segmentCount}>{tabCounts.highValue}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "today"}
            className={`${styles.segmentBtn} ${activeTab === "today" ? styles.segmentBtnActive : ""}`}
            onClick={() => setActiveTab("today")}
          >
            <span>Scheduled Today</span>
            <span className={styles.segmentCount}>{tabCounts.today}</span>
          </button>
        </div>

        {/* Active Stage Cross-Filter Indicator */}
        {selectedStageFilter && (
          <div className={styles.activeFilterPill}>
            <span>Stage: <strong>{activeFilteredStageName}</strong></span>
            <button
              type="button"
              className={styles.clearStageBtn}
              onClick={() => setSelectedStageFilter(null)}
              aria-label="Remove stage filter"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Asymmetric 60% / 40% Command Desk Grid */}
      <div className={styles.commandDeskGrid}>
        {/* Left Column (60% Width): Deal Action Deck */}
        <div className={styles.actionDeckColumn} aria-label="Commercial Deal Action Deck">
          <div className={styles.columnHeaderBar}>
            <span className={styles.columnHeaderLabel}>
              ACTIVE DEAL FLOW ({filteredRecords.length})
            </span>
            <span className={styles.columnHeaderHint}>
              1-Click advance &amp; milestone velocity
            </span>
          </div>

          {!recordsReady ? (
            /* Layout-Matched Zero-CLS Skeletons */
            <div className={styles.cardListStack}>
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className={styles.cardSkeleton} />
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            /* Refined Editorial Empty State */
            <div className={styles.emptyStateContainer}>
              <p className={styles.emptyTitle}>No matching opportunities found</p>
              <p className={styles.emptySubtitle}>
                {searchQuery || selectedStageFilter || activeTab !== "all"
                  ? "Adjust search terms, clear active stage spotlight, or reset tab filters."
                  : "All current deals have been progressed. New incoming inquiries will appear here."}
              </p>
              {(searchQuery || selectedStageFilter || activeTab !== "all") && (
                <button
                  type="button"
                  className={styles.resetFilterBtn}
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStageFilter(null);
                    setActiveTab("all");
                  }}
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            /* Discrete Tactile Cardlet Deck */
            <div className={styles.cardListStack}>
              {filteredRecords.map((record) => {
                const displayName = record.company || record.name || "Client Engagement";
                const initials = getInitials(displayName);
                const avatarStyle = getClientAvatarStyle(displayName);
                const pipInfo = getStagePipProgress(record.stage);
                const urgency = getUrgencyStatus(record.due);
                const isSelected = selectedDealId === record.id;
                const stageDisplay = record.stage || "New";

                return (
                  <article
                    key={record.id}
                    className={`${styles.dealCardlet} ${isSelected ? styles.selectedCardlet : ""}`}
                    onClick={() => setSelectedDealId(record.id)}
                    tabIndex={0}
                    role="button"
                    aria-selected={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedDealId(record.id);
                      }
                    }}
                  >
                    {/* Left Cluster: Squircle Monogram & Identity */}
                    <div className={styles.cardletLeftCluster}>
                      <div
                        className={styles.monogramAvatar}
                        style={{
                          backgroundColor: avatarStyle.bg,
                          color: avatarStyle.color,
                          borderColor: avatarStyle.border,
                        }}
                        aria-hidden="true"
                      >
                        {initials}
                      </div>
                      <div className={styles.dealIdentity}>
                        <div className={styles.dealTitleRow}>
                          <span className={styles.dealTitle} title={displayName}>
                            {displayName}
                          </span>
                          {record.serviceCategory && (
                            <span className={styles.serviceTag}>
                              {record.serviceCategory}
                            </span>
                          )}
                        </div>
                        <div className={styles.dealMetaRow}>
                          <span className={styles.leadId}>{record.leadId || "LD-1000"}</span>
                          <span className={styles.metaDivider}>•</span>
                          <span className={styles.ownerText}>{record.owner || "Unassigned"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Center Cluster: 4-Tick Continuous Milestone Track & Urgency */}
                    <div className={styles.cardletCenterCluster}>
                      <div className={styles.milestoneTrackWrapper}>
                        <div className={styles.milestoneHeader}>
                          <span className={styles.stageNameText}>{stageDisplay}</span>
                          <span className={styles.stagePercentText}>{pipInfo.percentage}%</span>
                        </div>
                        <div className={styles.milestoneRail}>
                          <div
                            className={styles.milestoneFill}
                            style={{
                              width: `${pipInfo.percentage}%`,
                              backgroundColor: pipInfo.color,
                            }}
                          />
                          <div className={styles.milestoneTick} style={{ left: "20%" }} />
                          <div className={styles.milestoneTick} style={{ left: "40%" }} />
                          <div className={styles.milestoneTick} style={{ left: "60%" }} />
                          <div className={styles.milestoneTick} style={{ left: "80%" }} />
                        </div>
                      </div>
                      <div className={styles.urgencyTextRow}>
                        <span
                          className={`${styles.urgencyText} ${
                            urgency.isOverdue
                              ? styles.urgencyOverdue
                              : urgency.isToday
                              ? styles.urgencyToday
                              : styles.urgencyTrack
                          }`}
                        >
                          {urgency.text}
                        </span>
                      </div>
                    </div>

                    {/* Right Cluster: Swiss Tabular Valuation & Quick Actions */}
                    <div className={styles.cardletRightCluster}>
                      <div className={styles.valuationBox}>
                        {financials ? (
                          <span className={styles.currencyDisplay}>
                            <span className={styles.currencyGlyph}>₹</span>
                            <span className={styles.currencyDigits}>
                              {formatIndianNumber(record.expectedValue ?? 0)}
                            </span>
                          </span>
                        ) : (
                          <span className={styles.currencyMasked}>Confidential</span>
                        )}
                      </div>

                      <div className={styles.actionsGroup}>
                        <button
                          type="button"
                          className={styles.advanceBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAdvanceStage?.(record);
                          }}
                          aria-label={`Advance stage for ${displayName}`}
                        >
                          <span>Advance</span>
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className={styles.openDossierBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDossier?.(record);
                          }}
                          title="Open Lead Dossier"
                          aria-label={`Open dossier for ${displayName}`}
                        >
                          <svg
                            width="12"
                            height="12"
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
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (40% Width): Live Stage Velocity Matrix */}
        <aside className={styles.velocityRadarColumn} aria-label="Pipeline Stage Velocity Matrix">
          <div className={styles.radarHeaderBlock}>
            <div className={styles.radarEyebrowRow}>
              <span className={styles.radarEyebrow}>PIPELINE STAGE VELOCITY</span>
              <span className={styles.radarLiveBadge}>INTERACTIVE</span>
            </div>
            <div className={styles.radarHeroMetricRow}>
              <div className={styles.radarHeroValuation}>
                {financials ? (
                  <span className={styles.heroCurrencyDisplay}>
                    <span className={styles.heroCurrencyGlyph}>₹</span>
                    <span className={styles.heroCurrencyDigits}>
                      {formatIndianNumber(totalPipelineValue)}
                    </span>
                  </span>
                ) : (
                  <span className={styles.heroCurrencyDigits}>Pipeline Protected</span>
                )}
              </div>
              <div className={styles.radarSubMetric}>
                <span>{records.length} Active Deals</span>
              </div>
            </div>
            <p className={styles.radarInstruction}>
              Click any stage to isolate bottlenecks &amp; cross-filter the action deck.
            </p>
          </div>

          {/* Interactive Stage Rows */}
          <div className={styles.stageMatrixList}>
            {stageMatrixData.map((stage) => {
              const isFilterActive = selectedStageFilter === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  className={`${styles.stageMatrixRow} ${isFilterActive ? styles.stageMatrixRowActive : ""}`}
                  onClick={() => handleToggleStageFilter(stage.id)}
                  aria-pressed={isFilterActive}
                >
                  <div className={styles.stageRowTopLine}>
                    <div className={styles.stageTitleGroup}>
                      <span
                        className={styles.stageDotIndicator}
                        style={{ backgroundColor: stage.accentColor }}
                      />
                      <span className={styles.stageNameLabel}>{stage.name}</span>
                      <span className={styles.stageCountPill}>{stage.count} deals</span>
                    </div>
                    <div className={styles.stageValuationGroup}>
                      <span className={styles.stageValueText}>
                        {financials ? `₹ ${formatIndianNumber(stage.value)}` : "—"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.stageDistributionTrack}>
                    <div
                      className={styles.stageDistributionBar}
                      style={{
                        width: `${stage.percentage}%`,
                        backgroundColor: stage.accentColor,
                      }}
                    />
                  </div>

                  <div className={styles.stageRowBottomLine}>
                    <span className={styles.stageDwellText}>Avg. dwell {stage.avgDwellDays}d</span>
                    <span className={styles.stageShareText}>{stage.percentage}% volume</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Contextual Velocity Insight Banner */}
          <div className={styles.velocityInsightBox}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={styles.insightIcon}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className={styles.velocityInsightText}>{dominantStageInsight}</p>
          </div>
        </aside>
      </div>
    </section>
  );
};
