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
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./UpcomingSlaCard.module.scss";

export interface UpcomingSlaItem {
  id: string;
  title: string;
  dateStr: string;
  amount: number;
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

const DEFAULT_ITEMS: UpcomingSlaItem[] = [
  {
    id: "sla-1",
    title: "Nexus Enterprise Advisory",
    dateStr: "June 28, 2026",
    amount: 2500000,
    status: "Due Today",
    badgeType: "today",
    monogram: "N",
    colorType: "red",
  },
  {
    id: "sla-2",
    title: "Aura Health Global",
    dateStr: "June 30, 2025",
    amount: 1850000,
    status: "Scheduled",
    badgeType: "scheduled",
    monogram: "A",
    colorType: "green",
  },
  {
    id: "sla-3",
    title: "Vertex AI Systems",
    dateStr: "July 4, 2025",
    amount: 1200000,
    status: "Scheduled",
    badgeType: "scheduled",
    monogram: "V",
    colorType: "coral",
  },
  {
    id: "sla-4",
    title: "Apex Strategic Systems",
    dateStr: "July 15, 2025",
    amount: 1650000,
    status: "Scheduled",
    badgeType: "scheduled",
    monogram: "S",
    colorType: "blue",
  },
];

export const UpcomingSlaCard: React.FC<UpcomingSlaCardProps> = ({
  records,
  financials = true,
  onOpenRecord,
}) => {
  const displayItems: UpcomingSlaItem[] = React.useMemo(() => {
    if (!records || records.length === 0) {
      return DEFAULT_ITEMS;
    }

    const colors: ("red" | "green" | "coral" | "blue")[] = ["red", "green", "coral", "blue"];
    return records.slice(0, 4).map((rec, idx) => {
      let badgeType: "scheduled" | "today" | "overdue" = "scheduled";
      let statusStr = "Scheduled";

      if (idx === 0) {
        badgeType = "today";
        statusStr = "Due Today";
      } else if (idx === 3) {
        badgeType = "overdue";
        statusStr = "Overdue 1d";
      } else {
        badgeType = "scheduled";
        statusStr = "Scheduled";
      }

      const d = rec.due ? new Date(rec.due) : new Date(rec.createdAt);
      const dateFormatted = d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      return {
        id: rec.id,
        title: rec.name || "Enterprise Engagement",
        dateStr: dateFormatted,
        amount: rec.expectedValue ?? 1500000,
        status: statusStr,
        badgeType,
        monogram: (rec.name ? rec.name.charAt(0) : "N").toUpperCase(),
        colorType: colors[idx % colors.length],
      };
    });
  }, [records]);

  return (
    <article
      className={styles.cardContainer}
      aria-label="Upcoming Commitments and Milestone SLA Ledger"
    >
      <header className={styles.headerRow}>
        <div className={styles.titleCluster}>
          <h2 className={styles.title}>Upcoming Milestones & SLA</h2>
          <p className={styles.subtitle}>
            {displayItems.length} Active Commitments • 98% On-Time SLA
          </p>
        </div>

        <button
          type="button"
          className={styles.addButton}
          aria-label="Add new milestone or SLA commitment"
        >
          +
        </button>
      </header>

      <div className={styles.itemsList}>
        {displayItems.map((item) => {
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

                <span className={styles.chevronIcon} aria-hidden="true">
                  &gt;
                </span>
              </div>

              <div className={styles.itemBottomRow}>
                <span className={styles.amount}>
                  {financials ? formatCrmCurrency(item.amount) : "Confidential"}
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
        onClick={() => {
          // Open first record or trigger drawer
          if (records && records[0] && onOpenRecord) {
            onOpenRecord(records[0]);
          }
        }}
      >
        View All Milestone Commitments
      </button>
    </article>
  );
};
