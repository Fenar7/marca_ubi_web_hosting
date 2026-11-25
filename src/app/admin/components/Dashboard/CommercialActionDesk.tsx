"use client";

/**
 * @file CommercialActionDesk.tsx
 * @description Primary 70% main working surface of the Commercial Desk (/admin).
 *              Features tabbed filtering ([All Deals], [High Value (> ₹10L)], [Stalled / Needs Follow-up]),
 *              seamless stage flow selection binding, real-time client search, and high-density
 *              two-tier client rows with Apple HIG squircles and 1-click action buttons.
 * @module admin/components/Dashboard/CommercialActionDesk
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./CommercialActionDesk.module.scss";

export type DeskFilterTab = "all" | "high_value" | "stalled";

export interface CommercialActionDeskProps {
  records: OverviewRecord[];
  recordsReady: boolean;
  stages: { id: string; name: string; count: number; value: number | null }[];
  selectedStageId: string | null;
  onSelectStage: (stageId: string | null) => void;
  financials: boolean;
  canTasks: boolean;
  onAdvanceStage?: (record: OverviewRecord) => void;
  onOpenDossier?: (record: OverviewRecord) => void;
}

function getInitials(name: string): string {
  if (!name) return "CL";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Resolves semantic color configuration for stage badge pills */
function getStageBadgeStyle(stageName: string): { bg: string; text: string; border: string } {
  const norm = stageName.trim().toLowerCase();
  if (norm.includes("new") || norm.includes("inbox") || norm.includes("intake")) {
    return { bg: "rgba(24, 24, 27, 0.08)", text: "#18181b", border: "#cbd5e1" };
  }
  if (norm.includes("contacted") || norm.includes("follow")) {
    return { bg: "rgba(99, 102, 241, 0.10)", text: "#4f46e5", border: "#c7d2fe" };
  }
  if (norm.includes("qualified") || norm.includes("discovery")) {
    return { bg: "rgba(13, 148, 136, 0.10)", text: "#0f766e", border: "#99f6e4" };
  }
  if (norm.includes("proposal") || norm.includes("pitch")) {
    return { bg: "rgba(217, 119, 6, 0.10)", text: "#b45309", border: "#fde68a" };
  }
  if (norm.includes("negotiation") || norm.includes("review")) {
    return { bg: "rgba(234, 0, 42, 0.09)", text: "#ea002a", border: "#fecdd3" };
  }
  if (norm.includes("won") || norm.includes("converted")) {
    return { bg: "rgba(5, 150, 105, 0.10)", text: "#047857", border: "#a7f3d0" };
  }
  return { bg: "rgba(113, 113, 122, 0.10)", text: "#52525b", border: "#d4d4d8" };
}

type UrgencyKind = "overdue" | "today" | "upcoming" | "stage" | "normal";

/** Computes days in stage and urgency interval relative to a stable mount timestamp. */
function getUrgencyTelemetry(
  due: string | null,
  createdAt: string,
  referenceNowMs: number
): { kind: UrgencyKind; text: string; isUrgent: boolean } {
  if (due) {
    const dueTime = new Date(due).getTime();
    if (Number.isFinite(dueTime)) {
      const diffMs = dueTime - referenceNowMs;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        return { kind: "overdue", text: `${Math.abs(diffDays)}d overdue`, isUrgent: true };
      }
      if (diffDays === 0) {
        return { kind: "today", text: "Due today", isUrgent: false };
      }
      return { kind: "upcoming", text: `Due in ${diffDays}d`, isUrgent: false };
    }
  }

  const createdTime = new Date(createdAt).getTime();
  if (Number.isFinite(createdTime)) {
    const days = Math.max(1, Math.floor((referenceNowMs - createdTime) / (1000 * 60 * 60 * 24)));
    return { kind: "stage", text: `${days}d in stage`, isUrgent: days > 14 };
  }

  return { kind: "normal", text: "Normal cadence", isUrgent: false };
}

export function CommercialActionDesk({
  records,
  recordsReady,
  stages,
  selectedStageId,
  onSelectStage,
  financials,
  canTasks,
  onAdvanceStage,
}: CommercialActionDeskProps): React.ReactElement {
  const [referenceNowMs] = useState<number>(() => Date.now());
  const [activeTab, setActiveTab] = useState<DeskFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const activeStageObject = useMemo(() => {
    if (!selectedStageId) return null;
    return stages.find((s) => s.id === selectedStageId) || null;
  }, [selectedStageId, stages]);

  // Client-side filtering pipeline (Tab -> Stage Filter -> Search Query)
  const filteredRecords = useMemo(() => {
    if (!records || records.length === 0) return [];

    return records.filter((rec) => {
      // 1. Stage Flow Bar filter
      if (activeStageObject) {
        const matchesStage =
          rec.stage.trim().toLowerCase() === activeStageObject.name.trim().toLowerCase() ||
          rec.stage.trim().toLowerCase().includes(activeStageObject.name.trim().toLowerCase());
        if (!matchesStage) return false;
      }

      // 2. Tab filter
      if (activeTab === "high_value") {
        if (!rec.expectedValue || rec.expectedValue < 1000000) return false;
      } else if (activeTab === "stalled") {
        const urgency = getUrgencyTelemetry(rec.due, rec.createdAt, referenceNowMs);
        if (!urgency.isUrgent) return false;
      }

      // 3. Search query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const matches =
          rec.name.toLowerCase().includes(q) ||
          (rec.company && rec.company.toLowerCase().includes(q)) ||
          (rec.serviceCategory && rec.serviceCategory.toLowerCase().includes(q)) ||
          rec.leadId.toLowerCase().includes(q) ||
          rec.owner.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [records, activeStageObject, activeTab, searchQuery, referenceNowMs]);

  return (
    <section
      className={styles.deskContainer}
      aria-labelledby="commercial-action-desk-title"
    >
      {/* Action Desk Header */}
      <header className={styles.deskHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrowRow}>
            <h2 id="commercial-action-desk-title" className={styles.deskTitle}>
              Commercial Action Desk
            </h2>
          </div>
          <p className={styles.deskDescription}>
            Active enterprise opportunities, velocity telemetry, and instantaneous progression.
          </p>
        </div>

        {/* Real-time Search Box */}
        <div className={styles.searchBox}>
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
          <input
            type="search"
            placeholder="Search deals, clients, owners…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Filter active commercial opportunities"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery("")}
              aria-label="Clear search input"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Interactive Filter Tabs and Active Stage Badge */}
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
            <span className={styles.countBadge}>
              {records.filter((r) => (r.expectedValue ?? 0) >= 1000000).length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "stalled"}
            className={`${styles.tabBtn} ${
              activeTab === "stalled" ? styles.tabBtnActive : ""
            }`}
            onClick={() => setActiveTab("stalled")}
          >
            <span>Stalled / Follow-up</span>
            <span className={styles.countBadge}>
              {
                records.filter((r) => getUrgencyTelemetry(r.due, r.createdAt, referenceNowMs).isUrgent)
                  .length
              }
            </span>
          </button>
        </div>

        {activeStageObject && (
          <div className={styles.activeStageTag}>
            <span>Stage: {activeStageObject.name}</span>
            <button
              type="button"
              className={styles.removeStageFilterBtn}
              onClick={() => onSelectStage(null)}
              aria-label="Remove stage filter"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Desk Content Ledger */}
      <div className={styles.ledgerBody}>
        {!recordsReady ? (
          /* Skeletons matching exact row layout (Zero Layout Shift) */
          <div className={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.skeletonRow}>
                <div className={styles.skeletonAvatar} />
                <div className={styles.skeletonTextCol}>
                  <div className={styles.skeletonLineLong} />
                  <div className={styles.skeletonLineShort} />
                </div>
                <div className={styles.skeletonValueCol} />
                <div className={styles.skeletonActionsCol} />
              </div>
            ))}
          </div>
        ) : filteredRecords.length === 0 ? (
          /* Clean Empty State */
          <div className={styles.emptyState}>
            <div className={styles.emptyIconCircle}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No matching opportunities</h3>
            <p className={styles.emptySubtitle}>
              {activeStageObject
                ? `No records found in stage "${activeStageObject.name}".`
                : activeTab === "high_value"
                  ? "No deals currently valued above ₹ 10,00,000."
                  : activeTab === "stalled"
                    ? "All clear — zero deals are currently stalled or overdue."
                    : "No deals match your search criteria."}
            </p>
            {(activeStageObject || activeTab !== "all" || searchQuery) && (
              <button
                type="button"
                className={styles.resetFiltersBtn}
                onClick={() => {
                  onSelectStage(null);
                  setActiveTab("all");
                  setSearchQuery("");
                }}
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          /* High-Density Two-Tier Client Rows */
          <div className={styles.rowsList} role="feed">
            {filteredRecords.map((record) => {
              const stageBadge = getStageBadgeStyle(record.stage);
              const urgency = getUrgencyTelemetry(record.due, record.createdAt, referenceNowMs);

              return (
                <article
                  key={record.id}
                  className={styles.clientRow}
                  aria-labelledby={`deal-title-${record.id}`}
                >
                  {/* Top Tier: Left (Avatar + Client Identity) and Right (Value + Stage) */}
                  <div className={styles.tierTop}>
                    <div className={styles.clientIdentityBlock}>
                      {/* Apple HIG Squircle Avatar */}
                      <div
                        className={styles.squircleAvatar}
                        aria-hidden="true"
                        title={record.name}
                      >
                        {getInitials(record.name)}
                      </div>

                      <div className={styles.nameBlock}>
                        <div className={styles.primaryNameLine}>
                          <span
                            id={`deal-title-${record.id}`}
                            className={styles.legalClientName}
                          >
                            {record.name}
                          </span>
                          <span className={styles.leadIdTag}>
                            {record.leadId}
                          </span>
                        </div>
                        <div className={styles.secondaryScopeLine}>
                          {record.company ? `${record.company} · ` : ""}
                          {record.serviceCategory || "Enterprise Consultation"}
                        </div>
                      </div>
                    </div>

                    <div className={styles.dealValuationBlock}>
                      <span className={styles.dealAmount}>
                        {financials && record.expectedValue !== null
                          ? formatCrmCurrency(record.expectedValue)
                          : financials
                            ? "₹ 0"
                            : "Confidential"}
                      </span>
                      <span
                        className={styles.stagePill}
                        style={{
                          backgroundColor: stageBadge.bg,
                          color: stageBadge.text,
                          borderColor: stageBadge.border,
                        }}
                      >
                        {record.stage}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Tier: Urgency Telemetry + Deal Owner + Direct Action Buttons */}
                  <div className={styles.tierBottom}>
                    <div className={styles.telemetryGroup}>
                      <span
                        className={`${styles.urgencyTag} ${
                          urgency.isUrgent ? styles.urgencyCritical : styles.urgencyNormal
                        }`}
                      >
                        {urgency.kind === "overdue" && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        )}
                        {urgency.kind === "stage" && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        )}
                        <span>{urgency.text}</span>
                      </span>
                      <span className={styles.separatorDot} aria-hidden="true">•</span>
                      <span className={styles.ownerText}>
                        Lead: <strong>{record.owner || "Unassigned"}</strong>
                      </span>
                    </div>

                    <div className={styles.actionButtonsCluster}>
                      {/* Advance Stage Trigger */}
                      {canTasks && (
                        <button
                          type="button"
                          className={styles.advanceStageBtn}
                          onClick={() => {
                            if (onAdvanceStage) {
                              onAdvanceStage(record);
                            }
                          }}
                          aria-label={`Advance stage for ${record.name}`}
                        >
                          <span>Advance Stage</span>
                          <svg className={styles.btnArrow} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                      )}

                      {/* Open Dossier Trigger */}
                        <Link
                          href={record.href || `/admin/leads/${record.id}`}
                          className={styles.openDossierBtn}
                          aria-label={`Open full dossier for ${record.name}`}
                        >
                          <span>Open Dossier</span>
                          <svg className={styles.btnArrow} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                            <line x1="7" y1="17" x2="17" y2="7" />
                            <polyline points="7 7 17 7 17 17" />
                          </svg>
                        </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}