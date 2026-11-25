"use client";

/**
 * @file UpcomingSlaCard.tsx
 * @description Master Upcoming Milestones & SLA Card modeled 1:1 after the Fundora benchmark archetype.
 *              Tall card featuring monogram brand avatars, due date metadata, Swiss tabular valuations,
 *              urgency status badges, chevron navigation, and a full-width View All button.
 * @module admin/components/Dashboard/UpcomingSlaCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from "react";
import { useRouter } from "next/navigation";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./UpcomingSlaCard.module.scss";

export interface UpcomingSlaItem {
  id: string;
  title: string;
  dateStr: string;
  amount: number | null;
  status: string;
  badgeType: "scheduled" | "today" | "overdue";
  monogram: string;
  colorType: "red" | "green" | "coral" | "blue";
}

export interface UpcomingSlaCardProps {
  records?: OverviewRecord[];
  financials?: boolean;
  onOpenRecord?: (record: OverviewRecord) => void;
}

export const UpcomingSlaCard: React.FC<UpcomingSlaCardProps> = ({
  records,
  financials = true,
  onOpenRecord,
}) => {
  const router = useRouter();
  const [referenceNowMs] = React.useState<number>(() => Date.now());

  const { displayItems, scheduledTotalCount, slaPercentage } = React.useMemo(() => {
    if (!records || records.length === 0) {
      return { displayItems: [], scheduledTotalCount: 0, slaPercentage: null as number | null };
    }

    const withDue = records
      .filter((r) => Boolean(r.due) && r.stageBucket !== "converted" && r.stageBucket !== "lost")
      .sort((a, b) => Date.parse(a.due!) - Date.parse(b.due!));

    const colors: ("red" | "green" | "coral" | "blue")[] = ["red", "green", "coral", "blue"];
    let onTimeCount = 0;

    const items = withDue.map((rec, idx) => {
      const d = new Date(rec.due!);
      const dueTime = d.getTime();
      const isOverdue = Number.isFinite(dueTime) && dueTime < referenceNowMs;
      const isToday =
        Number.isFinite(dueTime) && !isOverdue && dueTime - referenceNowMs < 86400000;
      const daysDiff = Math.abs(Math.round((referenceNowMs - dueTime) / 86400000));

      if (!isOverdue) onTimeCount++;

      const badgeType: "scheduled" | "today" | "overdue" = isOverdue
        ? "overdue"
        : isToday
        ? "today"
        : "scheduled";

      const statusStr = isOverdue
        ? `Overdue ${daysDiff > 0 ? `${daysDiff}d` : "1d"}`
        : isToday
        ? "Due Today"
        : "Scheduled";

      const dateFormatted = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });

      return {
        id: rec.id,
        title: rec.company || rec.name || "Client Engagement",
        dateStr: dateFormatted,
        amount: typeof rec.expectedValue === "number" ? rec.expectedValue : null,
        status: statusStr,
        badgeType,
        monogram: (rec.name ? rec.name.charAt(0) : "M").toUpperCase(),
        colorType: colors[idx % colors.length],
      };
    });

    const pct = withDue.length > 0 ? Math.round((onTimeCount / withDue.length) * 100) : null;
    return {
      displayItems: items.slice(0, 4),
      scheduledTotalCount: withDue.length,
      slaPercentage: pct,
    };
  }, [records, referenceNowMs]);

  return (
    <article
      className={styles.cardContainer}
      aria-label="Upcoming Commitments and Milestone SLA Ledger"
    >
      <header className={styles.headerRow}>
        <div className={styles.titleCluster}>
          <h2 className={styles.title}>Upcoming Milestones & SLA</h2>
          <p className={styles.subtitle}>
            {scheduledTotalCount} Scheduled Commitment{scheduledTotalCount === 1 ? "" : "s"}
            {slaPercentage !== null ? ` · ${slaPercentage}% On-Time SLA` : ""}
          </p>
        </div>

        <button
          type="button"
          className={styles.addButton}
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("open-new-lead-modal"));
            }
          }}
          aria-label="Add new milestone or SLA commitment"
        >
          +
        </button>
      </header>

      <div className={styles.itemsList}>
        {displayItems.length === 0 ? (
          <div className={styles.emptyItemsState} role="status">
            No upcoming follow-ups or SLA commitments scheduled.
          </div>
        ) : displayItems.map((item) => {
          const avatarClass =
            item.colorType === "green"
              ? styles.avatarGreen
              : item.colorType === "coral"
              ? styles.avatarCoral
              : item.colorType === "blue"
              ? styles.avatarBlue
              : styles.avatarRed;

          const badgeClass =
            item.badgeType === "today"
              ? styles.badgeToday
              : item.badgeType === "overdue"
              ? styles.badgeOverdue
              : styles.badgeScheduled;

          const matchedRecord = records?.find((r) => r.id === item.id);

          return (
            <div
              key={item.id}
              className={styles.itemCard}
              onClick={() => {
                if (matchedRecord && onOpenRecord) {
                  onOpenRecord(matchedRecord);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (matchedRecord && onOpenRecord) {
                    onOpenRecord(matchedRecord);
                  }
                }
              }}
            >
              <div className={styles.itemTopRow}>
                <div className={styles.avatarGroup}>
                  <div className={`${styles.avatar} ${avatarClass}`} aria-hidden="true">
                    {item.monogram}
                  </div>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    <span className={styles.itemDate}>{item.dateStr}</span>
                  </div>
                </div>

                <svg className={styles.chevronIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              <div className={styles.itemBottomRow}>
                <span className={styles.amount}>
                  {!financials
                    ? "Confidential"
                    : item.amount !== null
                    ? formatCrmCurrency(item.amount)
                    : "Unset"}
                </span>

                <span className={`${styles.urgencyBadge} ${badgeClass}`}>
                  {item.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.viewAllButton}
        onClick={() => router.push("/admin/tasks?queue=upcoming")}
      >
        <span>View All Milestone Commitments</span>
        <svg className={styles.btnArrow} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      </button>
    </article>
  );
};
