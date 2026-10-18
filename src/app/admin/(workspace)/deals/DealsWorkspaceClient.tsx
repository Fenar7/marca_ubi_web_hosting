'use client';

/**
 * @file DealsWorkspaceClient.tsx
 * @description Interactive Client Component for the Pipeline Deals Workspace (/admin/deals).
 *              Renders interactive commercial deal cards, stage filtering, valuation sorting,
 *              and dispatches centralized dossier drawer inspection events.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useMemo } from 'react';
import styles from './DealsWorkspaceClient.module.scss';

export interface HydratedDealItem {
  id: string;
  lead_id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  expected_value: number;
  priority: 'High' | 'Medium' | 'Low';
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  status_id: string;
  lead_source_id: string;
  assigned_to_name: string;
  status_name: string;
  status_bucket: 'open' | 'potential' | 'converted' | 'lost';
  status_color: string;
  source_name: string;
}

interface DealsWorkspaceClientProps {
  initialDeals: HydratedDealItem[];
  sources?: Array<{ id: string; name: string }>;
  profiles?: Array<{ id: string; full_name: string; email: string; role: string }>;
  statuses?: Array<{ id: string; name: string; sort_order: number; bucket: string; color_code: string }>;
}

function formatDealValue(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function DealsWorkspaceClient({
  initialDeals,
  statuses,
}: DealsWorkspaceClientProps): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<'all' | 'open' | 'potential' | 'converted'>('all');

  const filteredDeals = useMemo(() => {
    return initialDeals.filter((deal) => {
      const matchesSearch =
        deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deal.company && deal.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        deal.lead_id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBucket =
        selectedBucket === 'all' || deal.status_bucket === selectedBucket;

      return matchesSearch && matchesBucket;
    });
  }, [initialDeals, searchTerm, selectedBucket]);

  const handleInspectDeal = (dealId: string): void => {
    window.dispatchEvent(
      new CustomEvent('open-lead-drawer', { detail: { leadId: dealId } })
    );
  };

  return (
    <div className={styles.clientContainer}>
      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <svg
            className={styles.searchIcon}
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search deals by client, company, or deal ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.bucketFilterGroup}>
          <button
            type="button"
            className={`${styles.filterPill} ${selectedBucket === 'all' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedBucket('all')}
          >
            All Deals ({initialDeals.length})
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${selectedBucket === 'open' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedBucket('open')}
          >
            Active
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${selectedBucket === 'potential' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedBucket('potential')}
          >
            Potential
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${selectedBucket === 'converted' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedBucket('converted')}
          >
            Converted
          </button>
        </div>
      </div>

      {/* Deals Data Grid */}
      <div className={styles.gridCard}>
        <div className={styles.tableHeader}>
          <span className={styles.colId}>Deal Ref</span>
          <span className={styles.colClient}>Client & Company</span>
          <span className={styles.colStage}>Stage</span>
          <span className={styles.colValue}>Contract Valuation</span>
          <span className={styles.colPriority}>Priority</span>
          <span className={styles.colOwner}>Representative</span>
          <span className={styles.colAction}>Action</span>
        </div>

        {filteredDeals.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No deals match the selected criteria.</p>
            <p className={styles.emptySub}>Adjust filters or log a new commercial opportunity.</p>
          </div>
        ) : (
          <div className={styles.tableBody}>
            {filteredDeals.map((deal) => {
              const priorityClass =
                deal.priority === 'High'
                  ? styles.priorityHigh
                  : deal.priority === 'Medium'
                  ? styles.priorityMedium
                  : styles.priorityLow;

              return (
                <div
                  key={deal.id}
                  className={styles.dealRow}
                  onClick={() => handleInspectDeal(deal.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleInspectDeal(deal.id);
                    }
                  }}
                >
                  <span className={styles.colId}>
                    <code className={styles.monoId}>{deal.lead_id}</code>
                  </span>

                  <div className={styles.colClient}>
                    <span className={styles.clientName}>{deal.name}</span>
                    <span className={styles.companyName}>
                      {deal.company || 'Private Account'}
                    </span>
                  </div>

                  <span className={styles.colStage}>
                    <span
                      className={styles.stagePill}
                      style={{
                        backgroundColor: `${deal.status_color}18`,
                        borderColor: `${deal.status_color}40`,
                        color: deal.status_color,
                      }}
                    >
                      {deal.status_name}
                    </span>
                  </span>

                  <span className={styles.colValue}>
                    <span className={styles.valueNumber}>
                      {formatDealValue(deal.expected_value)}
                    </span>
                  </span>

                  <span className={styles.colPriority}>
                    <span className={`${styles.priorityBadge} ${priorityClass}`}>
                      {deal.priority}
                    </span>
                  </span>

                  <span className={styles.colOwner}>
                    <span className={styles.ownerText}>{deal.assigned_to_name}</span>
                  </span>

                  <div className={styles.colAction}>
                    <button
                      type="button"
                      className={styles.inspectButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspectDeal(deal.id);
                      }}
                      title="Inspect Client 360 Dossier"
                    >
                      View 360°
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
