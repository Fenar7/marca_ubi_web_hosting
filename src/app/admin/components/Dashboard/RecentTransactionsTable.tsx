"use client";

/**
 * @file RecentTransactionsTable.tsx
 * @description Master Recent Transactions Table modeled 1:1 after the Fundora benchmark archetype.
 *              Displays monospace activity timestamps, monogram branding avatars,
 *              Swiss tabular amounts, and emerald status pills.
 * @module admin/components/Dashboard/RecentTransactionsTable
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import type { OverviewRecord } from "./OverviewWorkspace";
import styles from "./RecentTransactionsTable.module.scss";

export interface TransactionItem {
  id: string;
  title: string;
  category: string;
  monogram: string;
  theme: "blue" | "rose" | "purple";
  date: string;
  amount: number | null;
  status: string;
  isConverted: boolean;
}

export interface RecentTransactionsTableProps {
  records?: OverviewRecord[];
  financials?: boolean;
  onOpenRecord?: (record: OverviewRecord) => void;
}

export const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({
  records,
  financials = true,
  onOpenRecord,
}) => {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside() {
      setOpenMenuId(null);
    }
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openMenuId]);

  const displayItems: TransactionItem[] = React.useMemo(() => {
    if (!records || records.length === 0) {
      return [];
    }

    return records.slice(0, 4).map((rec, idx) => {
      const themes: ("blue" | "rose" | "purple")[] = ["blue", "rose", "purple"];
      const d = new Date(rec.createdAt);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayStr = days[d.getUTCDay()] || "Wed";
      const timeStr = d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      });

      return {
        id: rec.id,
        title: rec.company || rec.name || "Client Advisory",
        category: rec.serviceCategory || "Commercial Engagement",
        monogram: (rec.name ? rec.name.charAt(0) : "M").toUpperCase(),
        theme: themes[idx % themes.length],
        date: `${dayStr} ${timeStr} UTC`,
        amount: typeof rec.expectedValue === "number" ? rec.expectedValue : null,
        status: rec.stage || "Active",
        isConverted: rec.stageBucket === "converted",
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
          onClick={() => router.push("/admin/deals?bucket=converted")}
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
            {displayItems.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyTableState}>
                  No recent pipeline deals or conversions recorded in this window.
                </td>
              </tr>
            ) : displayItems.map((item) => {
              const themeClass =
                item.theme === "rose"
                  ? styles.iconRose
                  : item.theme === "purple"
                  ? styles.iconPurple
                  : styles.iconBlue;

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
                    {!financials ? (
                      "Confidential"
                    ) : item.amount !== null ? (
                      formatCrmCurrency(item.amount)
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    <span className={styles.statusPill}>
                      {item.status}
                    </span>
                  </td>

                  <td className={styles.actionCell}>
                    <div className={styles.actionMenuWrapper}>
                      <button
                        type="button"
                        className={styles.actionMenuButton}
                        aria-label={`Options for ${item.title}`}
                        aria-expanded={openMenuId === item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId((prev) => (prev === item.id ? null : item.id));
                        }}
                      >
                        ···
                      </button>
                      {openMenuId === item.id && (
                        <div
                          className={styles.actionPopover}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className={styles.popoverItem}
                            onClick={() => {
                              setOpenMenuId(null);
                              if (matchedRecord && onOpenRecord) {
                                onOpenRecord(matchedRecord);
                              }
                            }}
                          >
                            Inspect Dossier
                          </button>
                          <button
                            type="button"
                            className={styles.popoverItem}
                            onClick={() => {
                              setOpenMenuId(null);
                              router.push(`/admin/deals/${item.id}`);
                            }}
                          >
                            <span>Open Full Page</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                              <line x1="7" y1="17" x2="17" y2="7" />
                              <polyline points="7 7 17 7 17 17" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className={styles.tableFooter}>
        <button
          type="button"
          className={styles.viewAllTransactionsBtn}
          onClick={() => router.push("/admin/deals")}
        >
          <span>View All Pipeline Transactions &amp; Ledger</span>
          <svg className={styles.btnArrow} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </button>
      </footer>
    </article>
  );
};
