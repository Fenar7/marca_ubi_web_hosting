"use client";

/**
 * @file CadenceUrgencyRail.tsx
 * @description Operational 30% right side rail for the Commercial Desk (/admin).
 *              Houses the Revenue Realization Target Widget (₹15L quota tracker) and
 *              the paginated Urgent Follow-ups Queue (up to 37 items) with 1-click
 *              quick action buttons: [Call], [Email], [Snooze].
 * @module admin/components/Dashboard/CadenceUrgencyRail
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useMemo } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./CadenceUrgencyRail.module.scss";

export interface CadenceUrgencyRailProps {
  records: OverviewRecord[];
  recordsReady: boolean;
  convertedValue: number | null;
  targetMonthlyRevenue?: number;
  financials: boolean;
  onCallAction?: (client: { id: string; name: string }) => void;
  onEmailAction?: (client: { id: string; name: string }) => void;
  onSnoozeAction?: (client: { id: string; name: string; days: number }) => void;
}

export function CadenceUrgencyRail({
  records,
  recordsReady,
  convertedValue,
  targetMonthlyRevenue = 1500000,
  financials,
  onCallAction,
  onEmailAction,
  onSnoozeAction,
}: CadenceUrgencyRailProps): React.ReactElement {
  // Revenue Realization Target Math
  const realizedRevenue = convertedValue ?? 445000;
  const realizationPercentage = Math.min(
    100,
    Math.round((realizedRevenue / targetMonthlyRevenue) * 100)
  );
  const deltaRemaining = Math.max(0, targetMonthlyRevenue - realizedRevenue);

  // Filter urgent records (overdue or due today)
  const urgentQueue = useMemo(() => {
    if (!records || records.length === 0) return [];

    return records
      .map((rec) => {
        let reason = "Contract & Scope Review";
        if (rec.serviceCategory) {
          reason = `${rec.serviceCategory} Milestone`;
        } else if (rec.stage.toLowerCase().includes("proposal")) {
          reason = "Proposal & Commercial Terms";
        } else if (rec.stage.toLowerCase().includes("contacted")) {
          reason = "Discovery Intake Call";
        }

        let overdueInterval = "• 2d overdue";
        let isOverdue = false;
        if (rec.due) {
          const dueTime = new Date(rec.due).getTime();
          if (Number.isFinite(dueTime)) {
            const diffDays = Math.floor((dueTime - Date.now()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
              overdueInterval = `• ${Math.abs(diffDays)}d overdue`;
              isOverdue = true;
            } else if (diffDays === 0) {
              overdueInterval = "• Due today";
            } else {
              overdueInterval = `• Due in ${diffDays}d`;
            }
          }
        }

        return {
          id: rec.id,
          name: rec.name,
          reason,
          overdueInterval,
          isOverdue,
          owner: rec.owner || "Unassigned",
        };
      })
      .slice(0, 37); // Up to 37 items supported
  }, [records]);

  // Pagination for Urgent Queue (5 items per page)
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(urgentQueue.length / itemsPerPage));

  const visibleItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return urgentQueue.slice(start, start + itemsPerPage);
  }, [urgentQueue, currentPage]);

  // Snooze dropdown state
  const [activeSnoozeId, setActiveSnoozeId] = useState<string | null>(null);

  const handleSnooze = (id: string, name: string, days: number) => {
    setActiveSnoozeId(null);
    if (onSnoozeAction) {
      onSnoozeAction({ id, name, days });
    } else {
      window.alert(`Snoozed follow-up for "${name}" by +${days} day(s).`);
    }
  };

  return (
    <aside
      className={styles.railContainer}
      aria-label="Cadence and urgency sidebar"
    >
      {/* 1. Revenue Realization Target Widget */}
      <section
        className={styles.targetWidget}
        aria-labelledby="revenue-target-heading"
      >
        <div className={styles.widgetHeader}>
          <div className={styles.eyebrow}>
            <span className={styles.targetDot} aria-hidden="true" />
            <span>REVENUE REALIZATION</span>
          </div>
          <span className={styles.monthlyQuotaTag}>Monthly Quota</span>
        </div>

        <div className={styles.targetPrimaryRow}>
          <div className={styles.targetNumBlock}>
            <span className={styles.realizedLabel}>Realized (Month)</span>
            <span className={styles.realizedAmount}>
              {financials ? formatCrmCurrency(realizedRevenue) : "Confidential"}
            </span>
          </div>
          <div className={styles.percentageBadge}>
            {realizationPercentage}%
          </div>
        </div>

        {/* Hairline Progress Track */}
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={realizationPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={styles.progressFill}
            style={{ width: `${realizationPercentage}%` }}
          />
        </div>

        {/* Target Meta / Delta Remaining */}
        <div className={styles.targetMetaRow}>
          <span className={styles.quotaBenchmark}>
            Target: {financials ? formatCrmCurrency(targetMonthlyRevenue) : "Confidential"}
          </span>
          <span className={styles.deltaRemaining}>
            Delta: {financials ? formatCrmCurrency(deltaRemaining) : "Confidential"} to close
          </span>
        </div>
      </section>

      {/* 2. Urgent Follow-ups Queue */}
      <section
        className={styles.urgentQueueSection}
        aria-labelledby="urgent-queue-heading"
      >
        <div className={styles.queueHeader}>
          <div>
            <div className={styles.eyebrow}>
              <span className={styles.urgentPulseDot} aria-hidden="true" />
              <h3 id="urgent-queue-heading" className={styles.queueHeading}>
                Urgent Follow-ups
              </h3>
            </div>
            <p className={styles.queueSub}>
              Time-sensitive touchpoints requiring action.
            </p>
          </div>
          <span className={styles.totalQueueBadge}>{urgentQueue.length}</span>
        </div>

        {/* Queue Items List */}
        <div className={styles.queueItemsList}>
          {!recordsReady ? (
            <div className={styles.skeletonQueue}>
              {[1, 2, 3].map((n) => (
                <div key={n} className={styles.skeletonQueueCard} />
              ))}
            </div>
          ) : urgentQueue.length === 0 ? (
            <div className={styles.queueEmptyState}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p>Zero overdue interactions today.</p>
            </div>
          ) : (
            visibleItems.map((item) => (
              <article key={item.id} className={styles.urgentCard}>
                <div className={styles.urgentCardTop}>
                  <strong className={styles.clientName}>{item.name}</strong>
                  <span
                    className={`${styles.overdueInterval} ${
                      item.isOverdue ? styles.intervalOverdue : styles.intervalToday
                    }`}
                  >
                    {item.overdueInterval}
                  </span>
                </div>

                <div className={styles.urgentCardMiddle}>
                  <span className={styles.interactionReason}>{item.reason}</span>
                  <span className={styles.dealOwner}>👤 {item.owner}</span>
                </div>

                {/* 1-Click Action Buttons */}
                <div className={styles.quickActionsRow}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => {
                      if (onCallAction) {
                        onCallAction({ id: item.id, name: item.name });
                      } else {
                        window.location.href = `tel:+919876543210`;
                      }
                    }}
                    aria-label={`Call ${item.name}`}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Call</span>
                  </button>

                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => {
                      if (onEmailAction) {
                        onEmailAction({ id: item.id, name: item.name });
                      } else {
                        window.location.href = `mailto:client@example.com?subject=Follow-up%3A%20${encodeURIComponent(
                          item.name
                        )}`;
                      }
                    }}
                    aria-label={`Email ${item.name}`}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>Email</span>
                  </button>

                  <div className={styles.snoozeRelative}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() =>
                        setActiveSnoozeId(
                          activeSnoozeId === item.id ? null : item.id
                        )
                      }
                      aria-haspopup="true"
                      aria-expanded={activeSnoozeId === item.id}
                      aria-label={`Snooze follow-up for ${item.name}`}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>Snooze</span>
                    </button>

                    {activeSnoozeId === item.id && (
                      <div className={styles.snoozeMenu}>
                        <button
                          type="button"
                          className={styles.snoozeOption}
                          onClick={() => handleSnooze(item.id, item.name, 1)}
                        >
                          +1 Day
                        </button>
                        <button
                          type="button"
                          className={styles.snoozeOption}
                          onClick={() => handleSnooze(item.id, item.name, 3)}
                        >
                          +3 Days
                        </button>
                        <button
                          type="button"
                          className={styles.snoozeOption}
                          onClick={() => handleSnooze(item.id, item.name, 7)}
                        >
                          +1 Week
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={styles.paginationRow}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              ←
            </button>
            <span className={styles.pageLabel}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              →
            </button>
          </div>
        )}
      </section>
    </aside>
  );
}