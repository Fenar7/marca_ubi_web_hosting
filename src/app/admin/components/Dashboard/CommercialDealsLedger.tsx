"use client";

/**
 * @file CommercialDealsLedger.tsx
 * @description Commercial Deals Queue & Live Pipeline Stage Summary for Marca Ubi CRM.
 *              Implements a flat, unboxed editorial layout (single container with hairline-divided
 *              rows and an aligned monochrome stage rail), UTC-reconciled follow-up urgency,
 *              real database stage counts/ages, and full en-IN INR formatting.
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
  onOpenDossier?: (record: OverviewRecord) => void;
}

interface ComputedStageRow {
  key: string;
  name: string;
  count: number;
  value: number | null;
  proportion: number;
  avgStageAgeDays: number | null;
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
 * Matches a deal record to a database stage summary by ID first,
 * falling back to case-insensitive stage name comparison.
 */
function recordMatchesStage(record: OverviewRecord, stage: { id: string; name: string }): boolean {
  if (record.stageId && stage.id && record.stageId === stage.id) {
    return true;
  }
  return record.stage.trim().toLowerCase() === stage.name.trim().toLowerCase();
}

/**
 * Computes UTC-aligned urgency status matching `/admin/tasks` day boundaries.
 * Never calls `Date.now()` or `new Date()` without a deterministic anchor.
 */
function getUtcUrgencyStatus(due: string | null, utcStartIso: string, utcEndIso: string): UrgencyState {
  if (!due) {
    return { text: "On track", tone: "track", isOverdue: false, isToday: false };
  }

  const window = { start: utcStartIso, end: utcEndIso, date: utcStartIso.slice(0, 10) };
  const isOverdue = isFollowUpInQueue("overdue", due, window);
  const isToday = isFollowUpInQueue("today", due, window);

  const dueDate = new Date(due);
  const startMs = Date.parse(utcStartIso);
  if (!Number.isFinite(dueDate.getTime()) || !Number.isFinite(startMs)) {
    return { text: "On track", tone: "track", isOverdue: false, isToday: false };
  }

  const dueUtcDayMs = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
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
function computeAvgStageAgeDays(matchingRecords: OverviewRecord[], anchorMs: number): number | null {
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
  onOpenDossier,
}) => {
  const [activeTab, setActiveTab] = useState<LedgerFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStageKey, setSelectedStageKey] = useState<string | null>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Deterministic UTC day window anchored to server `generatedAt` (or epoch 0 if omitted)
  const utcWindow = useMemo(() => {
    const anchorDate = generatedAt ? new Date(generatedAt) : new Date(0);
    return getUtcDayWindow(Number.isFinite(anchorDate.getTime()) ? anchorDate : new Date(0));
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
      if (financials && record.expectedValue !== null && record.expectedValue > HIGH_VALUE_THRESHOLD_INR) {
        highValue += 1;
      }
      const urgency = getUtcUrgencyStatus(record.due, utcWindow.start, utcWindow.end);
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
        proportion = Math.min(100, Math.max(0, Math.round((stage.value / resolvedTotalValue) * 100)));
      } else if (resolvedTotalCount > 0) {
        proportion = Math.min(100, Math.max(0, Math.round((stage.count / resolvedTotalCount) * 100)));
      }

      return {
        key,
        name: stage.name,
        count: stage.count,
        value: stage.value,
        proportion,
        avgStageAgeDays,
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
      list = list.filter((r) => r.expectedValue !== null && r.expectedValue > HIGH_VALUE_THRESHOLD_INR);
    } else if (activeTab === "overdue") {
      list = list.filter((r) => getUtcUrgencyStatus(r.due, utcWindow.start, utcWindow.end).isOverdue);
    } else if (activeTab === "today") {
      list = list.filter((r) => getUtcUrgencyStatus(r.due, utcWindow.start, utcWindow.end).isToday);
    }

    if (selectedStageObj) {
      list = list.filter((r) =>
        recordMatchesStage(r, { id: selectedStageObj.key, name: selectedStageObj.name })
      );
    }

    const q = deferredSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.name, r.company, r.leadId, r.serviceCategory, r.owner, r.stage].some((val) =>
          val?.toLowerCase().includes(q)
        )
      );
    }

    return list;
  }, [records, activeTab, financials, utcWindow, selectedStageObj, deferredSearchQuery]);

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedStageKey || activeTab !== "all");

  function handleResetFilters(): void {
    setSearchQuery("");
    setSelectedStageKey(null);
    setActiveTab("all");
  }

  return (
    <section className={styles.ledgerCard} aria-labelledby="commercial-ledger-title">
      {/* Header */}
      <header className={styles.ledgerHeader}>
        <div className={styles.headerTitleBlock}>
          <p className={styles.eyebrow}>Commercial Opportunities</p>
          <h2 className={styles.title} id="commercial-ledger-title">
            Deals &amp; Opportunities
          </h2>
          <p className={styles.subtitle}>
            Active follow-up queue and live stage distribution across open pipeline.
          </p>
        </div>

        <div className={styles.headerRightActions}>
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
              <span className={styles.srOnly}>Search opportunities</span>
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
        </div>
      </header>

      {/* Filter Bar */}
      <div className={styles.filterToolbar}>
        <div className={styles.filterGroup} role="group" aria-label="Filter opportunities">
          <button
            type="button"
            aria-pressed={activeTab === "all"}
            className={`${styles.filterBtn} ${activeTab === "all" ? styles.filterBtnActive : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <span>All Deals</span>
            <span className={styles.filterCount}>{tabCounts.all}</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === "overdue"}
            className={`${styles.filterBtn} ${activeTab === "overdue" ? styles.filterBtnActive : ""}`}
            onClick={() => setActiveTab("overdue")}
          >
            <span>Needs Follow-up</span>
            <span
              className={`${styles.filterCount} ${
                tabCounts.overdue > 0 && activeTab !== "overdue" ? styles.filterCountAlert : ""
              }`}
            >
              {tabCounts.overdue}
            </span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === "today"}
            className={`${styles.filterBtn} ${activeTab === "today" ? styles.filterBtnActive : ""}`}
            onClick={() => setActiveTab("today")}
          >
            <span>Scheduled Today</span>
            <span className={styles.filterCount}>{tabCounts.today}</span>
          </button>

          {financials && (
            <button
              type="button"
              aria-pressed={activeTab === "high_value"}
              className={`${styles.filterBtn} ${activeTab === "high_value" ? styles.filterBtnActive : ""}`}
              onClick={() => setActiveTab("high_value")}
            >
              <span>Over ₹ 10,00,000</span>
              <span className={styles.filterCount}>{tabCounts.highValue}</span>
            </button>
          )}
        </div>

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
      </div>

      {/* Main Two-Column Unboxed Split */}
      <div className={styles.commandDeskGrid}>
        {/* Left Column: Active Deal Queue */}
        <div className={styles.queueColumn} aria-label="Active Deal Queue">
          <div className={styles.columnHeaderBar}>
            <h3 className={styles.columnHeaderLabel}>
              Active Deal Queue ({filteredRecords.length})
            </h3>
            <span className={styles.columnHeaderHint}>UTC follow-up priority</span>
          </div>

          {recordsReady === undefined ? (
            <div className={styles.skeletonList} aria-busy="true" aria-label="Loading active deals">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className={styles.rowSkeleton} />
              ))}
            </div>
          ) : recordsReady === false ? (
            <div className={styles.unavailableBanner} role="alert">
              <div className={styles.unavailableCopy}>
                <p className={styles.unavailableTitle}>Deal queue unavailable</p>
                <p className={styles.unavailableSubtitle}>
                  Unable to load active opportunities right now. Please refresh or open the full deals workspace.
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
              <p className={styles.emptyTitle}>No matching opportunities</p>
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
            <ul className={styles.dealList}>
              {filteredRecords.map((record) => {
                const displayName = record.company || record.name || "Client Engagement";
                const initials = getInitials(displayName);
                const urgency = getUtcUrgencyStatus(record.due, utcWindow.start, utcWindow.end);
                const isAdvancing = pendingRecordId === record.id;

                return (
                  <li key={record.id} className={styles.dealRow}>
                    {/* Identity & Metadata */}
                    <div className={styles.rowIdentity}>
                      <div className={styles.monogramAvatar} aria-hidden="true">
                        {initials}
                      </div>
                      <div className={styles.identityContent}>
                        <div className={styles.titleLine}>
                          {record.href ? (
                            <Link
                              href={record.href}
                              className={styles.dealTitleLink}
                              title={displayName}
                              onClick={() => onOpenDossier?.(record)}
                            >
                              {displayName}
                            </Link>
                          ) : (
                            <span className={styles.dealTitleText} title={displayName}>
                              {displayName}
                            </span>
                          )}
                          {record.serviceCategory && (
                            <span className={styles.serviceCategoryText}>
                              · {record.serviceCategory}
                            </span>
                          )}
                        </div>
                        <div className={styles.metaLine}>
                          <span className={styles.leadId}>{record.leadId || "LD-1000"}</span>
                          <span aria-hidden="true">·</span>
                          <span className={styles.stageLabel}>{record.stage}</span>
                          <span aria-hidden="true">·</span>
                          <span className={styles.ownerText}>{record.owner || "Unassigned"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Urgency & Monetary Value */}
                    <div className={styles.rowStatusAndValue}>
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

                      {financials && (
                        <span className={styles.dealValue}>
                          {record.expectedValue !== null
                            ? formatCrmCurrency(record.expectedValue)
                            : "—"}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
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
                              <span className={styles.spinner} aria-hidden="true" />
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
                          onClick={() => onOpenDossier?.(record)}
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
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right Column: Pipeline Now · Stage Summary */}
        <aside className={styles.stageSummaryColumn} aria-label="Pipeline Now Stage Summary">
          <div className={styles.summaryHeader}>
            <p className={styles.summaryEyebrow}>Pipeline Now · Stage Summary</p>
            <div className={styles.summaryHeroRow}>
              {!pipelineReady ? (
                <p className={styles.summaryUnavailable}>Pipeline unavailable</p>
              ) : financials ? (
                <>
                  <p className={styles.summaryHeroValue}>
                    {formatCrmCurrency(totalSummaryValue)}
                  </p>
                  <span className={styles.summaryHeroCount}>
                    {totalSummaryCount} {totalSummaryCount === 1 ? "active deal" : "active deals"}
                  </span>
                </>
              ) : (
                <p className={styles.summaryHeroValue}>
                  {totalSummaryCount} {totalSummaryCount === 1 ? "Active Deal" : "Active Deals"}
                </p>
              )}
            </div>
            <p className={styles.summaryHint}>
              Select a stage below to filter the active queue.
            </p>
          </div>

          <div className={styles.stageList}>
            {stageRows.map((stage) => {
              const isSelected = selectedStageKey === stage.key;

              return (
                <button
                  key={stage.key}
                  type="button"
                  aria-pressed={isSelected}
                  className={`${styles.stageButton} ${isSelected ? styles.stageButtonSelected : ""}`}
                  onClick={() =>
                    setSelectedStageKey((prev) => (prev === stage.key ? null : stage.key))
                  }
                >
                  <div className={styles.stageTopRow}>
                    <div className={styles.stageNameGroup}>
                      <span className={styles.stageName}>{stage.name}</span>
                      <span className={styles.stageCount}>{stage.count} deals</span>
                    </div>
                    {financials && (
                      <span className={styles.stageValue}>
                        {stage.value !== null ? formatCrmCurrency(stage.value) : "—"}
                      </span>
                    )}
                  </div>

                  <div className={styles.stageTrack} aria-hidden="true">
                    <div
                      className={`${styles.stageFill} ${isSelected ? styles.stageFillSelected : ""}`}
                      style={{ width: `${stage.proportion}%` }}
                    />
                  </div>

                  {stage.avgStageAgeDays !== null && (
                    <div className={styles.stageMetaRow}>
                      <span className={styles.stageAgeText}>
                        Avg. stage age: {stage.avgStageAgeDays}d
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
};
