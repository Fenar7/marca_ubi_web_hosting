"use client";

/**
 * @file LuxurySlaFeedCard.tsx
 * @description Upcoming SLA Milestones & Client Follow-ups Feed.
 *              Displays priority deals with countdowns, urgency badges, and deal navigation hooks.
 * @module admin/components/Dashboard/LuxurySlaFeedCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useMemo } from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./LuxurySlaFeedCard.module.scss";

export interface LuxurySlaFeedCardProps {
  records?: OverviewRecord[];
  onOpenDossier?: (record: OverviewRecord) => void;
  financials?: boolean;
}

interface SlaStatus {
  text: string;
  type: "overdue" | "today" | "upcoming";
}

function resolveSlaStatus(due: string | null): SlaStatus {
  if (!due) return { text: "On track", type: "upcoming" };
  const time = new Date(due).getTime();
  if (!Number.isFinite(time)) return { text: "On track", type: "upcoming" };

  const now = Date.now();
  const diffDays = Math.floor((time - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Overdue ${Math.abs(diffDays)}d`, type: "overdue" };
  }
  if (diffDays === 0) {
    return { text: "Due Today", type: "today" };
  }
  return { text: `Due in ${diffDays}d`, type: "upcoming" };
}

function getClientInitials(name: string): string {
  if (!name) return "CL";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const LuxurySlaFeedCard: React.FC<LuxurySlaFeedCardProps> = ({
  records = [],
  onOpenDossier,
  financials = true,
}) => {
  // Sort records: Overdue first, then Today, then Upcoming
  const prioritizedMilestones = useMemo(() => {
    return [...records]
      .map((r) => ({
        record: r,
        sla: resolveSlaStatus(r.due),
      }))
      .sort((a, b) => {
        const order = { overdue: 0, today: 1, upcoming: 2 };
        return order[a.sla.type] - order[b.sla.type];
      })
      .slice(0, 3);
  }, [records]);

  return (
    <article
      className={styles.slaCard}
      aria-label="Upcoming commercial client milestones and SLA deadlines feed"
    >
      <header className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <h2 className={styles.cardTitle}>Upcoming Milestones</h2>
          <span className={styles.cardSubtitle}>Actionable SLA commitments</span>
        </div>
        <span className={styles.pendingBadge}>
          {prioritizedMilestones.length} Priority
        </span>
      </header>

      {prioritizedMilestones.length === 0 ? (
        <div className={styles.emptyState}>
          <span>All commercial milestones currently on schedule.</span>
        </div>
      ) : (
        <ul className={styles.milestoneList} role="list">
          {prioritizedMilestones.map(({ record, sla }) => {
            const initials = getClientInitials(record.name);

            return (
              <li key={record.id} className={styles.milestoneItem}>
                <div className={styles.itemMain}>
                  {/* Client Monogram Avatar */}
                  <div className={styles.avatarMonogram}>
                    <span>{initials}</span>
                  </div>

                  {/* Deal Details */}
                  <div className={styles.detailGroup}>
                    <button
                      type="button"
                      className={styles.dealNameLink}
                      onClick={() => onOpenDossier?.(record)}
                      title={`View deal for ${record.name}`}
                    >
                      {record.name}
                    </button>
                    <span className={styles.serviceLine}>
                      {record.serviceCategory || "Full-Suite Advisory"} • {record.stage}
                    </span>
                  </div>
                </div>

                <div className={styles.itemMeta}>
                  {/* SLA Urgency Pill Badge */}
                  <span
                    className={`${styles.slaPill} ${
                      sla.type === "overdue"
                        ? styles.slaPillOverdue
                        : sla.type === "today"
                          ? styles.slaPillToday
                          : styles.slaPillUpcoming
                    }`}
                  >
                    {sla.text}
                  </span>

                  {/* Expected Value */}
                  <span className={styles.valueText}>
                    {financials && record.expectedValue
                      ? formatCrmCurrency(record.expectedValue)
                      : "Confidential"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer Quick Action */}
      <footer className={styles.cardFooter}>
        <span className={styles.footerHint}>
          Follow-up reminders reflect active deal due dates
        </span>
      </footer>
    </article>
  );
};
