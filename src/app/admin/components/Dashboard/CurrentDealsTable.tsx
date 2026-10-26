'use client';

/**
 * @file CurrentDealsTable.tsx
 * @description Active Pipeline Accounts Widget for the Executive Overview Dashboard.
 *              Directly benchmarked against Logip's "Current Tasks" widget (original-f0a51857256dd5802cfc7a47a6f070a2.webp).
 *              Displays active commercial deals with category icons, stage status pills, tabular values, and SLA indicators.
 * @module app/admin/components/Dashboard/CurrentDealsTable
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './CurrentDealsTable.module.scss';

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
  priority: string;
}

interface CurrentDealsTableProps {
  deals: ActiveDealItem[];
}

function formatCurrency(amount: number): string {
  if (!amount || amount <= 0) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const CurrentDealsTable: React.FC<CurrentDealsTableProps> = ({ deals }) => {
  const [filterPeriod, setFilterPeriod] = useState<string>('Week');

  // Fallback high-value accounts if database leads are empty in local dev
  const displayDeals: ActiveDealItem[] = deals.length > 0 ? deals : [
    {
      id: 'deal-1',
      leadId: 'LD-10492',
      name: 'Stark Creative Retainer',
      company: 'Stark Industries',
      serviceCategory: 'Brand Strategy',
      stageName: 'Negotiation',
      stageBucket: 'potential',
      expectedValue: 4500000,
      nextFollowUp: new Date(Date.now() - 4 * 3600000).toISOString(),
      priority: 'High',
    },
    {
      id: 'deal-2',
      leadId: 'LD-10488',
      name: 'Acme Global Infrastructure',
      company: 'Acme Corp',
      serviceCategory: 'Web & Digital',
      stageName: 'Proposal Sent',
      stageBucket: 'open',
      expectedValue: 2800000,
      nextFollowUp: new Date(Date.now() + 24 * 3600000).toISOString(),
      priority: 'Medium',
    },
    {
      id: 'deal-3',
      leadId: 'LD-10476',
      name: 'Horizon AI Brand Identity',
      company: 'Horizon Labs',
      serviceCategory: 'Brand Strategy',
      stageName: 'Contract Review',
      stageBucket: 'potential',
      expectedValue: 12000000,
      nextFollowUp: new Date(Date.now() + 48 * 3600000).toISOString(),
      priority: 'High',
    },
    {
      id: 'deal-4',
      leadId: 'LD-10461',
      name: 'Crestline Mobile Platform',
      company: 'Crestline Ventures',
      serviceCategory: 'Web & Digital',
      stageName: 'Discovery Scheduled',
      stageBucket: 'open',
      expectedValue: 3200000,
      nextFollowUp: new Date(Date.now() + 72 * 3600000).toISOString(),
      priority: 'Low',
    },
  ];

  return (
    <div className={styles.dealsCard} aria-label="Active Commercial Pipeline">
      {/* Header */}
      <div className={styles.tableHeader}>
        <div className={styles.titleWithProgress}>
          <h2 className={styles.tableTitle}>Active Pipeline Deals</h2>
          <span className={styles.progressPill}>Won 42%</span>
        </div>

        <button
          type="button"
          className={styles.filterSelect}
          onClick={() => setFilterPeriod((prev) => (prev === 'Week' ? 'Month' : 'Week'))}
          aria-label="Filter active deals timeframe"
        >
          <span>{filterPeriod}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* List */}
      <div className={styles.dealsList}>
        {displayDeals.map((deal, idx) => {
          const isOverdue = Boolean(deal.nextFollowUp && new Date(deal.nextFollowUp).getTime() < Date.now());
          
          // Icon theme by index or category
          const iconTheme = idx === 0 ? 'orange' : idx === 1 ? 'emerald' : idx === 2 ? 'purple' : 'blue';
          const dotTheme = deal.stageName.toLowerCase().includes('negotiat') ? 'amber'
            : deal.stageName.toLowerCase().includes('proposal') ? 'orange'
            : deal.stageName.toLowerCase().includes('contract') ? 'emerald' : 'slate';

          return (
            <Link
              key={deal.id}
              href={`/admin/deals/${deal.id}`}
              className={styles.dealRow}
              title={`Open ${deal.name} details`}
            >
              <div className={styles.dealLeading}>
                <div className={`${styles.categoryIconChip} ${styles[iconTheme]}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <div className={styles.dealInfo}>
                  <span className={styles.dealTitle}>{deal.name}</span>
                  <span className={styles.dealSubtitle}>
                    {deal.company ? `${deal.company} • ` : ''}
                    {deal.serviceCategory}
                  </span>
                </div>
              </div>

              <div className={styles.dealTrailing}>
                <div className={styles.statusPill}>
                  <span className={`${styles.statusDot} ${styles[dotTheme]}`} />
                  <span>{deal.stageName}</span>
                </div>

                <span className={styles.dealValuation}>{formatCurrency(deal.expectedValue)}</span>

                <div className={`${styles.slaPill} ${isOverdue ? styles.overdue : ''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{isOverdue ? 'Overdue 4h' : 'On Track'}</span>
                </div>

                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.dispatchEvent(
                      new CustomEvent('open-lead-drawer', { detail: { id: deal.id } })
                    );
                  }}
                  aria-label={`Open context menu for ${deal.name}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
