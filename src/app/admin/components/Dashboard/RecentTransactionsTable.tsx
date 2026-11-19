"use client";

/**
 * @file RecentTransactionsTable.tsx
 * @description Master Recent Transactions Table modeled 1:1 after the Fundora benchmark archetype.
 *              Displays monospace activity timestamps, monogram branding avatars,
 *              Swiss tabular amounts, and emerald status pills.
 * @module admin/components/Dashboard/RecentTransactionsTable
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from "react";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./RecentTransactionsTable.module.scss";

export interface TransactionItem {
  id: string;
  title: string;
  category: string;
  monogram: string;
  theme: "cobalt" | "bronze" | "rosegold";
  date: string;
  amount: number;
  status: string;
}

export interface RecentTransactionsTableProps {
  records?: OverviewRecord[];
  financials?: boolean;
  onOpenRecord?: (record: OverviewRecord) => void;
}

const DEFAULT_TRANSACTIONS: TransactionItem[] = [
  {
    id: "tx-1",
    title: "Mobile App Platform",
    category: "Web & Digital",
    monogram: "M",
    theme: "cobalt",
    date: "Wed 10:29 AM",
    amount: 2550000,
    status: "Success",
  },
  {
    id: "tx-2",
    title: "Strategic Architecture",
    category: "Full-Suite Advisory",
    monogram: "S",
    theme: "bronze",
    date: "Wed 10:29 AM",
    amount: 1850000,
    status: "Success",
  },
  {
    id: "tx-3",
    title: "Brand Identity System",
    category: "UI/UX & Branding",
    monogram: "B",
    theme: "rosegold",
    date: "Tue 03:45 PM",
    amount: 1200000,
    status: "Success",
  },
];

export const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({
  records,
  financials = true,
  onOpenRecord,
}) => {
  // If actual records are supplied, map top 3 converted/potential records
  const displayItems: TransactionItem[] = React.useMemo(() => {
    if (!records || records.length === 0) {
      return DEFAULT_TRANSACTIONS;
    }

    return records.slice(0, 3).map((rec, idx) => {
      const themes: ("cobalt" | "bronze" | "rosegold")[] = ["cobalt", "bronze", "rosegold"];
      const d = new Date(rec.createdAt);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayStr = days[d.getDay()] || "Wed";
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      return {
        id: rec.id,
        title: rec.name || "Client Advisory",
        category: rec.serviceCategory || "Commercial Engagement",
        monogram: (rec.name ? rec.name.charAt(0) : "M").toUpperCase(),
        theme: themes[idx % themes.length],
        date: `${dayStr} ${timeStr}`,
        amount: rec.expectedValue ?? 1500000,
        status: "Success",
      };
    });
  }, [records]);

  return (
    <article
      className={styles.cardContainer}
      aria-label="Recent Transactions Activity Ledger"
    >
      <header className={styles.tableHeader}>
        <h2 className={styles.title}>Recent Transaction</h2>

        <button
          type="button"
          className={styles.filterButton}
          aria-label="Filter recent transactions"
        >
          <span>Filter</span>
          <span className={styles.filterIcon} aria-hidden="true">
            ☷
          </span>
        </button>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.transactionsTable}>
          <thead>
            <tr className={styles.tableHeadRow}>
              <th scope="col">Activity</th>
              <th scope="col">Date</th>
              <th scope="col">Total Amount</th>
              <th scope="col">Status</th>
              <th scope="col" aria-label="Actions">
                ···
              </th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, index) => {
              const themeClass =
                item.theme === "bronze"
                  ? styles.iconBronze
                  : item.theme === "rosegold"
                  ? styles.iconRoseGold
                  : styles.iconCobalt;

              const matchedRecord = records?.find((r) => r.id === item.id);

              return (
                <tr
                  key={item.id}
                  className={styles.tableBodyRow}
                  onClick={() => {
                    if (matchedRecord && onOpenRecord) {
                      onOpenRecord(matchedRecord);
                    }
                  }}
                  style={{ cursor: matchedRecord && onOpenRecord ? "pointer" : "default" }}
                >
                  <td className={styles.activityCell}>
                    <div className={`${styles.activityIcon} ${themeClass}`} aria-hidden="true">
                      {item.monogram}
                    </div>
                    <div className={styles.activityInfo}>
                      <span className={styles.activityTitle}>{item.title}</span>
                      <span className={styles.activitySubtitle}>{item.category}</span>
                    </div>
                  </td>

                  <td className={styles.dateCell}>{item.date}</td>

                  <td className={styles.amountCell}>
                    <span className={styles.positivePrefix}>+</span>
                    {financials ? formatCrmCurrency(item.amount) : "Confidential"}
                  </td>

                  <td>
                    <span className={styles.statusPill}>
                      <span aria-hidden="true">✔</span> {item.status}
                    </span>
                  </td>

                  <td className={styles.actionCell}>
                    <button
                      type="button"
                      className={styles.actionMenuButton}
                      aria-label={`Options for ${item.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      ···
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
};
