"use client";

/**
 * @file CommercialDealsTable.tsx
 * @description Master Commercial Deals & Opportunities Ledger for Marca Ubi Commercial Desk.
 *              Inspired by Amirul Islam's table archetype: features client initials avatars,
 *              Raycast monospace token badges, tabular currency values, and direct dossier navigation.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

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

function getInitials(name: string): string {
  if (!name) return "CL";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Shows bounded recent opportunities with search and status token badges. */
export const CommercialDealsTable: React.FC<CommercialDealsTableProps> = ({
  deals = [],
  dataStatus = "ready",
}) => {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return deals;
    return deals.filter((deal) =>
      [
        deal.name,
        deal.company,
        deal.leadId,
        deal.owner,
        deal.serviceCategory,
        deal.stageName,
      ].some((value) => value?.toLocaleLowerCase().includes(normalized))
    );
  }, [deals, query]);

  return (
    <section
      className={styles.tableCard}
      aria-labelledby="recent-opportunities-title"
    >
      <header className={styles.tableHeader}>
        <div className={styles.headerTitleBlock}>
          <div className={styles.eyebrowRow}>
            <span className={styles.dot} aria-hidden="true" />
            <p className={styles.eyebrow}>Active Pipeline Ledger</p>
          </div>
          <h2 className={styles.title} id="recent-opportunities-title">
            Recent Opportunities
          </h2>
          <p className={styles.subtitle}>
            Latest 10 active records · search applies to this sample
          </p>
        </div>

        <div className={styles.searchWrapper}>
          <label className={styles.searchLabel} htmlFor="deals-search-input">
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
            <span className={styles.srOnly}>Search recent opportunities</span>
          </label>
          <input
            id="deals-search-input"
            className={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search deals, company, rep..."
          />
        </div>
      </header>

      <div className={styles.tableResponsiveWrapper}>
        <table className={styles.dealsTable}>
          <thead>
            <tr>
              <th scope="col">Opportunity / client</th>
              <th scope="col">Stage</th>
              <th scope="col">Expected value</th>
              <th scope="col">Account owner</th>
              <th scope="col" className={styles.thActions}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {dataStatus === "unavailable" ? (
              <tr>
                <td colSpan={5} className={styles.emptyState} role="status">
                  Recent opportunity data is unavailable.
                </td>
              </tr>
            ) : matches.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState} role="status">
                  {deals.length
                    ? "No opportunities match your search filter."
                    : "No active commercial opportunities in the current window."}
                </td>
              </tr>
            ) : (
              matches.map((deal) => (
                <tr key={deal.id} className={styles.tableRow}>
                  {/* Opportunity & Client Monogram */}
                  <td>
                    <div className={styles.clientCell}>
                      <div className={styles.avatarPill} aria-hidden="true">
                        {getInitials(deal.company || deal.name)}
                      </div>
                      <Link
                        className={styles.dealLink}
                        href={`/admin/leads?id=${encodeURIComponent(deal.id)}`}
                      >
                        <strong className={styles.dealTitle}>
                          {deal.company || deal.name}
                        </strong>
                        <div className={styles.dealMeta}>
                          <span className={styles.leadIdTag}>{deal.leadId}</span>
                          <span className={styles.dotDivider}>·</span>
                          <span className={styles.categoryTag}>
                            {deal.serviceCategory}
                          </span>
                        </div>
                      </Link>
                    </div>
                  </td>

                  {/* Stage Raycast Token */}
                  <td>
                    <div className={styles.stageCell}>
                      <span className={styles.stageToken}>
                        <span className={styles.stageDot} aria-hidden="true" />
                        <span>{deal.stageName}</span>
                      </span>
                      {deal.isOverdue && (
                        <span className={styles.overdueBadge}>Overdue</span>
                      )}
                    </div>
                  </td>

                  {/* Value */}
                  <td className={styles.amount}>
                    {formatCrmCurrency(deal.expectedValue)}
                  </td>

                  {/* Owner */}
                  <td>
                    <span className={styles.ownerBadge}>
                      {deal.owner || "Unassigned"}
                    </span>
                  </td>

                  {/* Action Link */}
                  <td className={styles.tdActions}>
                    <Link
                      href={`/admin/leads?id=${encodeURIComponent(deal.id)}`}
                      className={styles.actionBtn}
                      title={`Open dossier for ${deal.name}`}
                      aria-label={`Open dossier for ${deal.name}`}
                    >
                      <svg
                        width="13"
                        height="13"
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className={styles.tableFooter}>
        <span className={styles.sampleNote}>
          Showing {matches.length} of {deals.length} active opportunities
        </span>
        <Link href="/admin/deals" className={styles.openDealsLink}>
          <span>Open all deals</span>
          <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </section>
  );
};
