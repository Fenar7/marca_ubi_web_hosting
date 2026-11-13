"use client";

import React from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewQueue } from "@/app/admin/lib/dashboardContracts";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./ConyestTransactionsTable.module.scss";

export type TransactionStatus =
  | "Completed"
  | "Overdue"
  | "Due Today"
  | "Pending"
  | "Unassigned";

export interface TransactionRow {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  amount: string;
  stage: string;
  owner: string;
  status: TransactionStatus;
  isUrgent?: boolean;
  href?: string | null;
}

export interface ConyestTransactionsTableProps {
  records?: OverviewRecord[];
  recordsReady?: boolean;
  selectedQueue?: OverviewQueue;
  queueCounts?: Record<OverviewQueue, number | null>;
  onSelectQueue?: (queue: OverviewQueue) => void;
  canTasks?: boolean;
  financials?: boolean;
}

/** Get initials for avatar */
function getInitials(name: string): string {
  if (!name) return "CL";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * ConyestTransactionsTable presents the commercial follow-up queue and recent engagements:
 * - Queue filter tabs (Overdue, Today, Unassigned) with live operational counts.
 * - Humanized two-tier client rows (client avatar + name + domain/scope subtitle).
 * - Subtle relative urgency indicators instead of screaming red blocks.
 * - Tabular currency numerals in full Indian Rupees (en-IN).
 * - Click-through navigation to full deal dossier or preview drawer.
 */
export function ConyestTransactionsTable({
  records,
  recordsReady = true,
  selectedQueue = "today",
  queueCounts,
  onSelectQueue,
  canTasks = true,
  financials = true,
}: ConyestTransactionsTableProps): React.ReactElement {
  // Convert CRM OverviewRecords into hydrated TransactionRows
  const rows: TransactionRow[] =
    records && records.length > 0
      ? records.map((rec) => {
          let dateStr = "Scheduled";
          let timeStr = "UTC";
          const timestampToParse = rec.due || rec.createdAt;
          if (timestampToParse) {
            const d = new Date(timestampToParse);
            if (Number.isFinite(d.getTime())) {
              dateStr = `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
              timeStr = d.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              });
            }
          }

          let status: TransactionStatus = "Pending";
          let isUrgent = false;
          if (
            rec.stage.toLowerCase().includes("won") ||
            rec.stage.toLowerCase().includes("converted")
          ) {
            status = "Completed";
          } else if (selectedQueue === "overdue") {
            status = "Overdue";
            isUrgent = true;
          } else if (selectedQueue === "today") {
            status = "Due Today";
          } else if (selectedQueue === "unassigned") {
            status = "Unassigned";
          }

          const amountDisplay =
            rec.expectedValue !== null && rec.expectedValue !== undefined
              ? formatCrmCurrency(rec.expectedValue)
              : canTasks && !financials
                ? "Confidential"
                : "—";

          return {
            id: rec.id,
            name: rec.name,
            type: rec.serviceCategory || rec.company || "Enterprise Scope",
            date: dateStr,
            time: timeStr,
            amount: amountDisplay,
            stage: rec.stage,
            owner: rec.owner,
            status,
            isUrgent,
            href: rec.href,
          };
        })
      : [];

  const handleRowClick = (row: TransactionRow): void => {
    if (row.href) {
      window.location.href = row.href;
    } else {
      window.dispatchEvent(
        new CustomEvent("open-lead-drawer", {
          detail: { leadId: row.id, id: row.id },
        }),
      );
    }
  };

  const getStatusBadgeClass = (status: TransactionStatus): string => {
    switch (status) {
      case "Overdue":
        return styles.statusOverdue;
      case "Due Today":
        return styles.statusDueToday;
      case "Completed":
        return styles.statusCompleted;
      case "Unassigned":
        return styles.statusUnassigned;
      default:
        return styles.statusPending;
    }
  };

  return (
    <article
      className={styles.transactionsCard}
      aria-label="Commercial engagements and operational queue"
    >
      <header className={styles.cardHeader}>
        <div className={styles.titleArea}>
          <h3 className={styles.cardTitle}>Commercial Engagements</h3>
        </div>

        <div className={styles.headerControls}>
          <button
            type="button"
            className={styles.periodDropdown}
            aria-label="Filter transaction period"
          >
            <span>Current Scope</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </header>

      {/* Queue Filter Tabs (Overdue, Today, Unassigned) */}
      {canTasks && onSelectQueue && queueCounts && (
        <div className={styles.queueTabs} role="tablist" aria-label="Queue views">
          {(["overdue", "today", "unassigned"] as OverviewQueue[]).map((q) => {
            const count = queueCounts[q] ?? 0;
            const isOverdueTab = q === "overdue" && count > 0;
            return (
              <button
                key={q}
                type="button"
                role="tab"
                aria-selected={selectedQueue === q}
                className={`${styles.queueTab} ${selectedQueue === q ? styles.activeQueueTab : ""}`}
                onClick={() => onSelectQueue(q)}
              >
                <span style={{ textTransform: "capitalize" }}>{q}</span>
                <span
                  className={`${styles.tabCountPill} ${isOverdueTab ? styles.tabCountOverdue : ""}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Transactions Data Table */}
      <div className={styles.tableWrapper}>
        {!recordsReady ? (
          <div className={styles.emptyState}>Records couldn&apos;t be loaded.</div>
        ) : rows.length === 0 ? (
          <div className={styles.emptyState}>No active touchpoints in this queue.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Client &amp; Scope</th>
                <th scope="col">Schedule</th>
                <th scope="col">Expected Value</th>
                <th scope="col">Stage &amp; Owner</th>
                <th scope="col">Status &amp; Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} onClick={() => handleRowClick(row)} className={styles.tableRow}>
                  <td className={styles.clientCell}>
                    <div className={styles.clientCluster}>
                      <span className={styles.clientAvatar}>{getInitials(row.name)}</span>
                      <div className={styles.clientInfo}>
                        <span className={styles.clientName}>{row.name}</span>
                        <span className={styles.clientScope}>{row.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.dateCell}>
                    <div className={styles.scheduleCluster}>
                      <span className={styles.scheduleDate}>{row.date}</span>
                      {row.isUrgent ? (
                        <span className={styles.urgencyText}>• Overdue Follow-up</span>
                      ) : (
                        <span className={styles.scheduleTime}>{row.time}</span>
                      )}
                    </div>
                  </td>
                  <td className={styles.amountCell}>{row.amount}</td>
                  <td className={styles.ownerCell}>
                    <div className={styles.ownerCluster}>
                      <span className={styles.stagePill}>{row.stage}</span>
                      <span className={styles.ownerName}>{row.owner}</span>
                    </div>
                  </td>
                  <td className={styles.statusCell}>
                    <div className={styles.actionCluster}>
                      <span className={`${styles.statusPill} ${getStatusBadgeClass(row.status)}`}>
                        {row.status}
                      </span>
                      <button
                        type="button"
                        className={styles.dossierBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(row);
                        }}
                        aria-label={`Open dossier for ${row.name}`}
                      >
                        Open ↗
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </article>
  );
}
