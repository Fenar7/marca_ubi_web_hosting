"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { formatCrmCurrency } from "@/app/admin/lib/currency";
import styles from "./CommercialDealsTable.module.scss";

export interface ActiveDealItem {
  id: string;
  leadId: string;
  name: string;
  company?: string | null;
  serviceCategory: string;
  stageName: string;
  stageBucket: string;
  expectedValue: number;
  nextFollowUp?: string | null;
  isOverdue?: boolean;
  priority: string;
  owner?: string | null;
}

export interface CommercialDealsTableProps {
  deals?: ActiveDealItem[];
  dataStatus?: "ready" | "unavailable";
}

/** Shows only the bounded recent opportunity sample; search scope is stated explicitly. */
export const CommercialDealsTable: React.FC<CommercialDealsTableProps> = ({ deals = [], dataStatus = "ready" }) => {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return deals;
    return deals.filter((deal) => [deal.name, deal.company, deal.leadId, deal.owner, deal.serviceCategory]
      .some((value) => value?.toLocaleLowerCase().includes(normalized)));
  }, [deals, query]);

  return (
    <section className={styles.tableCard} aria-labelledby="recent-opportunities-title">
      <header className={styles.tableHeader}>
        <div>
          <h2 className={styles.title} id="recent-opportunities-title">Recent opportunities</h2>
          <p className={styles.subtitle}>Latest 10 active records · search applies to this sample</p>
        </div>
        <label className={styles.searchPillWrapper}>
          <span className={styles.srOnly}>Search recent opportunities</span>
          <input className={styles.searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this list" />
        </label>
      </header>
      <div className={styles.tableResponsiveWrapper}>
        <table className={styles.dealsTable}>
          <thead><tr><th scope="col">Opportunity</th><th scope="col">Stage</th><th scope="col">Value</th><th scope="col">Owner</th></tr></thead>
          <tbody>
            {dataStatus === "unavailable" ? (
              <tr><td colSpan={4} className={styles.emptyState} role="status">Recent opportunity data is unavailable.</td></tr>
            ) : matches.length === 0 ? (
              <tr><td colSpan={4} className={styles.emptyState} role="status">{deals.length ? "No records match this search." : "No active opportunities to show."}</td></tr>
            ) : matches.map((deal) => (
              <tr key={deal.id}>
                <td><Link className={styles.dealLink} href={`/admin/leads?id=${encodeURIComponent(deal.id)}`}><strong>{deal.company || deal.name}</strong><span>{deal.leadId} · {deal.serviceCategory}</span></Link></td>
                <td><span className={styles.stageLabel}>{deal.stageName}</span>{deal.isOverdue && <span className={styles.overdueLabel}>Follow-up overdue</span>}</td>
                <td className={styles.amount}>{formatCrmCurrency(deal.expectedValue)}</td>
                <td>{deal.owner || "Unassigned"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className={styles.tableFooter}><Link href="/admin/deals">Open all deals <span aria-hidden="true">→</span></Link></footer>
    </section>
  );
};
