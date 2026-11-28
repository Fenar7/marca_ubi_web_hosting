"use client";

/**
 * @file CommercialDealsLedger.tsx
 * @description 3-Tier Commercial Deals Ledger & Live Stage Pipeline Strip for Marca Ubi CRM.
 *              Tier A: Single-row editorial header with compact pipeline summary, search, and View All Deals.
 *              Tier B: Full-width horizontal interactive stage pipeline strip with proportional bar
 *                      and semantic multi-color stage filter cards (real DB stages + stageEnteredAt ages).
 *              Tier C: Wrapping 44px quick-filter toolbar with UTC urgency & high-value (> ₹ 10,00,000) toggles.
 *              Tier D: Full-width 6-column editorial data table (responsive stacked cards < 900px).
 * @module admin/components/Dashboard/CommercialDealsLedger
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import { getUtcDayWindow, isFollowUpInQueue } from "@/app/admin/lib/followUpQueue";
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
  canTasks?: boolean;
  stages?: StageSummary[];
  pipelineReady?: boolean;
  pipelineCount?: number | null;
  pipelineValue?: number | null;
  generatedAt?: string;
  recordRoute?: string | null;
  pendingRecordId?: string | null;
  onAdvanceStage?: (record: OverviewRecord) => void;
}

type StageToneKey =
  | "new"
  | "contacted"
  | "hold"
  | "qualified"
  | "proposal"
  | "negotiation";

type PracticeToneKey =
  | "branding"
  | "web"
  | "mobile"
  | "design"
  | "advisory";

interface ComputedStageRow {
  key: string;
  name: string;
  count: number;
  value: number | null;
  proportion: number;
  avgStageAgeDays: number | null;
  tone: StageToneKey;
}

interface UrgencyState {
  text: string;
  tone: "overdue" | "today" | "track";
  isOverdue: boolean;
  isToday: boolean;
}

const HIGH_VALUE_THRESHOLD_INR = 1_000_000;
const MS_PER_DAY = 86_400_000;

/** Extracts clean uppercase initials for uniform squircle monograms. */
function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "CL";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

/**
 * Maps a database stage name to a curated WCAG AA semantic color token.
 */
function getStageTone(stageName: string): StageToneKey {
  const normalized = stageName.trim().toLowerCase();
  if (normalized.includes("new") || normalized.includes("intake")) return "new";
  if (normalized.includes("contact")) return "contacted";
  if (normalized.includes("hold") || normalized.includes("park")) return "hold";
  if (normalized.includes("qualif")) return "qualified";
  if (normalized.includes("proposal")) return "proposal";
  if (
    normalized.includes("negotiat") ||
    normalized.includes("closing") ||
    normalized.includes("won")
  ) {
    return "negotiation";
  }
  return "hold";
}

/**
 * Maps a practice / service category string to a semantic pill token.
 */
function getPracticeTone(category: string | null): PracticeToneKey {
  const normalized = (category ?? "").trim().toLowerCase();
  if (normalized.includes("brand")) return "branding";
  if (normalized.includes("web") || normalized.includes("digital")) return "web";
  if (normalized.includes("mobile") || normalized.includes("app")) return "mobile";
  if (
    normalized.includes("ui") ||
    normalized.includes("ux") ||
    normalized.includes("design")
  ) {
    return "design";
  }
  return "advisory";
}

/**
 * Matches a deal record to a database stage summary by ID first,
 * falling back to case-insensitive stage name comparison.
 */
function recordMatchesStage(
  record: OverviewRecord,
  stage: { id: string; name: string }
): boolean {
  if (record.stageId && stage.id && record.stageId === stage.id) {
    return true;
  }
  return record.stage.trim().toLowerCase() === stage.name.trim().toLowerCase();
}

/**
 * Computes UTC-aligned urgency status matching `/admin/tasks` day boundaries.
 * Never calls `Date.now()` or `new Date()` without a deterministic anchor.
 */
function getUtcUrgencyStatus(
  due: string | null,
  utcStartIso: string,
  utcEndIso: string
): UrgencyState {
  if (!due) {
    return { text: "On track", tone: "track", isOverdue: false, isToday: false };
  }

  const window = {
    start: utcStartIso,
    end: utcEndIso,
    date: utcStartIso.slice(0, 10),
  };
  const isOverdue = isFollowUpInQueue("overdue", due, window);
  const isToday = isFollowUpInQueue("today", due, window);

  const dueDate = new Date(due);
  const startMs = Date.parse(utcStartIso);
  if (!Number.isFinite(dueDate.getTime()) || !Number.isFinite(startMs)) {
    return { text: "On track", tone: "track", isOverdue: false, isToday: false };
  }

  const dueUtcDayMs = Date.UTC(
    dueDate.getUTCFullYear(),
    dueDate.getUTCMonth(),
    dueDate.getUTCDate()
  );
  const dayDelta = Math.round((dueUtcDayMs - startMs) / MS_PER_DAY);

  if (isOverdue) {
    const overdueDays = Math.max(1, Math.abs(dayDelta));
    return {
      text: `Overdue · ${overdueDays}d ago`,
      tone: "overdue",
      isOverdue: true,
      isToday: false,
    };
  }

  if (isToday) {
    return {
      text: "Due today",
      tone: "today",
      isOverdue: false,
      isToday: true,
    };
  }

  const upcomingDays = Math.max(1, dayDelta);
  return {
    text: `Due in ${upcomingDays}d`,
    tone: "track",
    isOverdue: false,
    isToday: false,
  };
}

/**
 * Computes average days in current stage from `record.stageEnteredAt`
 * anchored to `generatedAt`. Returns `null` if no valid timestamps exist.
 */
function computeAvgStageAgeDays(
  matchingRecords: OverviewRecord[],
  anchorMs: number
): number | null {
  if (!Number.isFinite(anchorMs)) return null;

  let totalDays = 0;
  let validCount = 0;

  for (const record of matchingRecords) {
    if (!record.stageEnteredAt) continue;
    const enteredMs = Date.parse(record.stageEnteredAt);
    if (!Number.isFinite(enteredMs)) continue;
    const days = Math.max(0, Math.round((anchorMs - enteredMs) / MS_PER_DAY));
    totalDays += days;
    validCount += 1;
  }

  if (validCount === 0) return null;
  return Math.round(totalDays / validCount);
}

const STAGE_TONE_CARD_CLASS: Record<StageToneKey, string> = {
  new: styles.stageToneNew,
  contacted: styles.stageToneContacted,
  hold: styles.stageToneHold,
  qualified: styles.stageToneQualified,
  proposal: styles.stageToneProposal,
  negotiation: styles.stageToneNegotiation,
};

const STAGE_TONE_PILL_CLASS: Record<StageToneKey, string> = {
  new: styles.stagePillNew,
  contacted: styles.stagePillContacted,
  hold: styles.stagePillHold,
  qualified: styles.stagePillQualified,
  proposal: styles.stagePillProposal,
  negotiation: styles.stagePillNegotiation,
};

const PRACTICE_TONE_CLASS: Record<PracticeToneKey, string> = {
  branding: styles.practiceBranding,
  web: styles.practiceWeb,
  mobile: styles.practiceMobile,
  design: styles.practiceDesign,
  advisory: styles.practiceAdvisory,
};

export const CommercialDealsLedger: React.FC<CommercialDealsLedgerProps> = ({
  records = [],
  recordsReady,
  financials = true,
  canTasks = true,
  stages,
  pipelineReady = true,
  pipelineCount,
  pipelineValue,
  generatedAt,
  recordRoute = "/admin/deals",
  pendingRecordId = null,
  onAdvanceStage,
}) => {
  const [activeTab, setActiveTab] = useState<LedgerFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStageKey, setSelectedStageKey] = useState<string | null>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Deterministic UTC day window anchored to server `generatedAt` (or epoch 0 if omitted)
  const utcWindow = useMemo(() => {
    const anchorDate = generatedAt ? new Date(generatedAt) : new Date(0);
    return getUtcDayWindow(
      Number.isFinite(anchorDate.getTime()) ? anchorDate : new Date(0)
    );
  }, [generatedAt]);

  const anchorMs = useMemo(() => {
    if (!generatedAt) return NaN;
    return Date.parse(generatedAt);
  }, [generatedAt]);

  // Single-pass urgency & filter tab counts
  const tabCounts = useMemo(() => {
    let highValue = 0;
    let overdue = 0;
    let today = 0;

    for (const record of records) {
      if (
        financials &&
        record.expectedValue !== null &&
        record.expectedValue > HIGH_VALUE_THRESHOLD_INR
      ) {
        highValue += 1;
      }
      const urgency = getUtcUrgencyStatus(
        record.due,
        utcWindow.start,
        utcWindow.end
      );
      if (urgency.isOverdue) overdue += 1;
      if (urgency.isToday) today += 1;
    }

    return {
      all: records.length,
      highValue,
      overdue,
      today,
    };
  }, [records, financials, utcWindow]);

  // Build real DB stage summary list (preserving all configured stages including "On Hold")
  const stageRows: ComputedStageRow[] = useMemo(() => {
    const baseStages: StageSummary[] =
      stages && stages.length > 0
        ? stages
        : (() => {
            const grouped = new Map<string, StageSummary>();
            for (const record of records) {
              const key = record.stageId || record.stage || "New";
              const existing = grouped.get(key);
              const val = financials ? (record.expectedValue ?? 0) : null;
              if (existing) {
                existing.count += 1;
                if (financials && existing.value !== null && val !== null) {
                  existing.value += val;
                }
              } else {
                grouped.set(key, {
                  id: key,
                  name: record.stage || "New",
                  count: 1,
                  value: val,
                });
              }
            }
            return Array.from(grouped.values());
          })();

    const resolvedTotalCount =
      pipelineCount !== undefined && pipelineCount !== null
        ? pipelineCount
        : baseStages.reduce((sum, s) => sum + s.count, 0);

    const resolvedTotalValue =
      pipelineValue !== undefined && pipelineValue !== null
        ? pipelineValue
        : baseStages.reduce((sum, s) => sum + (s.value ?? 0), 0);

    return baseStages.map((stage) => {
      const key = stage.id || stage.name;
      const matching = records.filter((r) => recordMatchesStage(r, stage));
      const avgStageAgeDays = computeAvgStageAgeDays(matching, anchorMs);

      let proportion = 0;
      if (financials && resolvedTotalValue > 0 && stage.value !== null) {
        proportion = Math.min(
          100,
          Math.max(0, Math.round((stage.value / resolvedTotalValue) * 100))
        );
      } else if (resolvedTotalCount > 0) {
        proportion = Math.min(
          100,
          Math.max(0, Math.round((stage.count / resolvedTotalCount) * 100))
        );
      }

      return {
        key,
        name: stage.name,
        count: stage.count,
        value: stage.value,
        proportion,
        avgStageAgeDays,
        tone: getStageTone(stage.name),
      };
    });
  }, [stages, records, financials, pipelineCount, pipelineValue, anchorMs]);

  const totalSummaryCount = useMemo(() => {
    if (pipelineCount !== undefined && pipelineCount !== null) return pipelineCount;
    return stageRows.reduce((sum, s) => sum + s.count, 0);
  }, [pipelineCount, stageRows]);

  const totalSummaryValue = useMemo(() => {
    if (pipelineValue !== undefined && pipelineValue !== null) return pipelineValue;
    return stageRows.reduce((sum, s) => sum + (s.value ?? 0), 0);
  }, [pipelineValue, stageRows]);

  const selectedStageObj = useMemo(() => {
    if (!selectedStageKey) return null;
    return stageRows.find((s) => s.key === selectedStageKey) ?? null;
  }, [selectedStageKey, stageRows]);

  // Multi-tier filtering: Tab + Stage Cross-Filter + Deferred Search
  const filteredRecords = useMemo(() => {
    let list = records;

    if (activeTab === "high_value" && financials) {
      list = list.filter(
        (r) => r.expectedValue !== null && r.expectedValue > HIGH_VALUE_THRESHOLD_INR
      );
    } else if (activeTab === "overdue") {
      list = list.filter(
        (r) => getUtcUrgencyStatus(r.due, utcWindow.start, utcWindow.end).isOverdue
      );
    } else if (activeTab === "today") {
      list = list.filter(
        (r) => getUtcUrgencyStatus(r.due, utcWindow.start, utcWindow.end).isToday
      );
    }

    if (selectedStageObj) {
      list = list.filter((r) =>
        recordMatchesStage(r, {
          id: selectedStageObj.key,
          name: selectedStageObj.name,
        })
      );
    }

    const q = deferredSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.name, r.company, r.leadId, r.serviceCategory, r.owner, r.stage].some(
          (val) => val?.toLowerCase().includes(q)
        )
      );
    }

    return list;
  }, [
    records,
    activeTab,
    financials,
    utcWindow,
    selectedStageObj,
    deferredSearchQuery,
  ]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedStageKey || activeTab !== "all"
  );

  function handleResetFilters(): void {
    setSearchQuery("");
    setSelectedStageKey(null);
    setActiveTab("all");
  }

  return (
    <section
      className={styles.ledgerCard}
      aria-labelledby="commercial-ledger-title"
    >
      {/* Tier A: Single-Row Editorial Header */}
      <header className={styles.ledgerHeader}>
        <div className={styles.headerTitleBlock}>
          <p className={styles.eyebrow}>Active Pipeline</p>
          <div className={styles.titleSummaryRow}>
            <h2 className={styles.title} id="commercial-ledger-title">
              Deals &amp; Opportunities
            </h2>
            <p className={styles.inlineSummary}>
              {!pipelineReady ? (
                <span className={styles.summaryUnavailable}>
                  Pipeline unavailable
                </span>
              ) : financials ? (
                <>
                  <span className={styles.summaryFigure}>
                    {formatCrmCurrency(totalSummaryValue)}
                  </span>
                  <span aria-hidden="true" className={styles.summarySeparator}>
                    ·
                  </span>
                  <span>
                    {totalSummaryCount}{" "}
                    {totalSummaryCount === 1 ? "active deal" : "active deals"}
                  </span>
                </>
              ) : (
                <span>
                  {totalSummaryCount}{" "}
                  {totalSummaryCount === 1 ? "active deal" : "active deals"}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className={styles.headerRightActions}>
          <div className={styles.searchWrapper}>
            <label className={styles.searchLabel} htmlFor="ledger-search-input">
              <svg
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
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className={styles.srOnly}>Search deals</span>
            </label>
            <input
              id="ledger-search-input"
              type="search"
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
                <svg
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {recordRoute && (
            <Link href={recordRoute} className={styles.viewAllDealsLink}>
              <span>View All Deals</span>
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
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </Link>
          )}
        </div>
      </header>

      {/* Tier B: Full-Width Horizontal Interactive Stage Pipeline Strip */}
      {pipelineReady && stageRows.length > 0 && (
        <div
          className={styles.stagePipelineStrip}
          aria-label="Pipeline stage distribution"
        >
          <div className={styles.pipelineBarTrack} aria-hidden="true">
            {stageRows.map((stage) => {
              if (stage.proportion <= 0 && stage.count <= 0) return null;
              const widthPct = stage.proportion > 0 ? stage.proportion : 2;
              return (
                <div
                  key={stage.key}
                  className={`${styles.pipelineBarSegment} ${STAGE_TONE_CARD_CLASS[stage.tone]}`}
                  style={{ width: `${widthPct}%` }}
                />
              );
            })}
          </div>

          <div className={styles.stageStripGrid}>
            {stageRows.map((stage) => {
              const isSelected = selectedStageKey === stage.key;
              return (
                <button
                  key={stage.key}
                  type="button"
                  aria-pressed={isSelected}
                  className={`${styles.stageCardBtn} ${STAGE_TONE_CARD_CLASS[stage.tone]} ${
                    isSelected ? styles.stageCardBtnSelected : ""
                  }`}
                  onClick={() =>
                    setSelectedStageKey((prev) =>
                      prev === stage.key ? null : stage.key
                    )
                  }
                >
                  <div className={styles.stageCardTop}>
                    <span className={styles.stageCardName}>{stage.name}</span>
                    <span className={styles.stageCardCount}>{stage.count}</span>
                  </div>

                  {financials && (
                    <div className={styles.stageCardValue}>
                      {stage.value !== null
                        ? formatCrmCurrency(stage.value)
                        : "—"}
                    </div>
                  )}

                  {stage.avgStageAgeDays !== null && (
                    <div className={styles.stageCardAge}>
                      Avg. age: {stage.avgStageAgeDays}d
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier C: Quick Filter Toolbar */}
      <div className={styles.filterToolbar}>
        <div className={styles.filterGroup} role="group" aria-label="Filter deals">
          <button
            type="button"
            aria-pressed={activeTab === "all"}
            className={`${styles.filterBtn} ${
              activeTab === "all" ? styles.filterBtnActive : ""
            }`}
            onClick={() => setActiveTab("all")}
          >
            <span>All Deals</span>
            <span className={styles.filterCount}>{tabCounts.all}</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === "overdue"}
            className={`${styles.filterBtn} ${
              activeTab === "overdue" ? styles.filterBtnActive : ""
            }`}
            onClick={() => setActiveTab("overdue")}
          >
            <span>Needs Follow-up</span>
            <span
              className={`${styles.filterCount} ${
                tabCounts.overdue > 0 && activeTab !== "overdue"
                  ? styles.filterCountAlert
                  : ""
              }`}
            >
              {tabCounts.overdue}
            </span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === "today"}
            className={`${styles.filterBtn} ${
              activeTab === "today" ? styles.filterBtnActive : ""
            }`}
            onClick={() => setActiveTab("today")}
          >
            <span>Scheduled Today</span>
            <span className={styles.filterCount}>{tabCounts.today}</span>
          </button>

          {financials && (
            <button
              type="button"
              aria-pressed={activeTab === "high_value"}
              className={`${styles.filterBtn} ${
                activeTab === "high_value" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setActiveTab("high_value")}
            >
              <span>Over ₹ 10,00,000</span>
              <span className={styles.filterCount}>{tabCounts.highValue}</span>
            </button>
          )}
        </div>

        <div className={styles.filterMetaRight}>
          {selectedStageObj && (
            <div className={styles.activeStageChip}>
              <span>
                Stage: <strong>{selectedStageObj.name}</strong>
              </span>
              <button
                type="button"
                className={styles.clearStageBtn}
                onClick={() => setSelectedStageKey(null)}
                aria-label={`Clear stage filter ${selectedStageObj.name}`}
              >
                <svg
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          <span className={styles.queueCountHint}>
            Showing {filteredRecords.length} of {records.length} · Sorted by follow-up due (UTC)
          </span>
        </div>
      </div>

      {/* Tier D: Full-Width 6-Column Editorial Data Table */}
      <div className={styles.tableRegion} aria-label="Active Deal Queue">
        {recordsReady === undefined ? (
          <div
            className={styles.skeletonList}
            aria-busy="true"
            aria-label="Loading active deals"
          >
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className={styles.rowSkeleton} />
            ))}
          </div>
        ) : recordsReady === false ? (
          <div className={styles.unavailableBanner} role="alert">
            <div className={styles.unavailableCopy}>
              <p className={styles.unavailableTitle}>Deal queue unavailable</p>
              <p className={styles.unavailableSubtitle}>
                Unable to load active opportunities right now. Please refresh or
                open the full deals workspace.
              </p>
            </div>
            {recordRoute && (
              <Link href={recordRoute} className={styles.unavailableLink}>
                Open Deals
              </Link>
            )}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className={styles.emptyStateContainer}>
            <p className={styles.emptyTitle}>No matching deals</p>
            <p className={styles.emptySubtitle}>
              {hasActiveFilters
                ? "No active deals match your current filter or search selection."
                : "No active deals are currently in the queue."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className={styles.resetFilterBtn}
                onClick={handleResetFilters}
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <table className={styles.dealsTable}>
            <thead>
              <tr>
                <th scope="col">Client / Deal</th>
                <th scope="col">Practice</th>
                <th scope="col">Stage</th>
                <th scope="col">Follow-up / SLA</th>
                {financials && (
                  <th scope="col" className={styles.alignRightHeader}>
                    Value
                  </th>
                )}
                <th scope="col" className={styles.alignRightHeader}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const displayName =
                  record.company || record.name || "Client Engagement";
                const initials = getInitials(displayName);
                const urgency = getUtcUrgencyStatus(
                  record.due,
                  utcWindow.start,
                  utcWindow.end
                );
                const stageTone = getStageTone(record.stage);
                const practiceTone = getPracticeTone(record.serviceCategory);
                const isAdvancing = pendingRecordId === record.id;

                return (
                  <tr key={record.id} className={styles.dealTableRow}>
                    <td className={styles.clientCell}>
                      <div className={styles.rowIdentity}>
                        <div
                          className={`${styles.monogramAvatar} ${STAGE_TONE_PILL_CLASS[stageTone]}`}
                          aria-hidden="true"
                        >
                          {initials}
                        </div>
                        <div className={styles.identityContent}>
                          {record.href ? (
                            <Link
                              href={record.href}
                              className={styles.dealTitleLink}
                              title={displayName}
                            >
                              {displayName}
                            </Link>
                          ) : (
                            <span
                              className={styles.dealTitleText}
                              title={displayName}
                            >
                              {displayName}
                            </span>
                          )}
                          <div className={styles.metaLine}>
                            <span className={styles.leadId}>
                              {record.leadId || "LD-1000"}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className={styles.ownerText}>
                              {record.owner || "Unassigned"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className={styles.practiceCell}>
                      <span
                        className={`${styles.practicePill} ${PRACTICE_TONE_CLASS[practiceTone]}`}
                      >
                        {record.serviceCategory || "Advisory"}
                      </span>
                    </td>

                    <td className={styles.stageCell}>
                      <span
                        className={`${styles.stagePill} ${STAGE_TONE_PILL_CLASS[stageTone]}`}
                      >
                        {record.stage}
                      </span>
                    </td>

                    <td className={styles.urgencyCell}>
                      <span
                        className={`${styles.urgencyBadge} ${
                          urgency.tone === "overdue"
                            ? styles.urgencyOverdue
                            : urgency.tone === "today"
                            ? styles.urgencyToday
                            : styles.urgencyTrack
                        }`}
                      >
                        {urgency.text}
                      </span>
                    </td>

                    {financials && (
                      <td className={styles.valueCell}>
                        <span className={styles.dealValue}>
                          {record.expectedValue !== null
                            ? formatCrmCurrency(record.expectedValue)
                            : "—"}
                        </span>
                      </td>
                    )}

                    <td className={styles.actionsCell}>
                      <div className={styles.rowActions}>
                        {canTasks && (
                          <button
                            type="button"
                            className={styles.advanceBtn}
                            disabled={isAdvancing}
                            aria-busy={isAdvancing}
                            onClick={() => onAdvanceStage?.(record)}
                            aria-label={`Advance stage for ${displayName}`}
                          >
                            {isAdvancing ? (
                              <>
                                <span
                                  className={styles.spinner}
                                  aria-hidden="true"
                                />
                                <span>Advancing…</span>
                              </>
                            ) : (
                              <span>Advance</span>
                            )}
                          </button>
                        )}

                        {record.href && (
                          <Link
                            href={record.href}
                            className={styles.openLink}
                            aria-label={`Open ${displayName}`}
                          >
                            <span>Open</span>
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
                              <line x1="7" y1="17" x2="17" y2="7" />
                              <polyline points="7 7 17 7 17 17" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
