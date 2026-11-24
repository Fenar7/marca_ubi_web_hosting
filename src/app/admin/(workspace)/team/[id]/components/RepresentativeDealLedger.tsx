'use client';

/**
 * @file RepresentativeDealLedger.tsx
 * @description Linear Fluid table archetype presenting all commercial opportunities
 *              and closed deals assigned to the representative with live bucket filtering.
 * @module app/admin/team/[id]/components/RepresentativeDealLedger
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { LeadWithRelations } from '@/types/crm';
import { getPersonnelDeals } from '@/app/actions/team';
import { formatRupees } from '@/app/lib/team-utils';
import styles from './RepresentativeDealLedger.module.scss';

interface RepresentativeDealLedgerProps {
  userId: string;
  initialDeals?: LeadWithRelations[];
  canViewFinancials?: boolean;
}

type BucketFilter = 'all' | 'open' | 'potential' | 'converted' | 'lost';

export function RepresentativeDealLedger({
  userId,
  initialDeals = [],
  canViewFinancials = true,
}: RepresentativeDealLedgerProps): React.ReactElement {
  const [deals, setDeals] = useState<LeadWithRelations[]>(initialDeals);
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(initialDeals.length);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isPending, startTransition] = useTransition();
  const requestSeqRef = useRef(0);

  const pageSize = 8;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchDeals = useCallback(
    (targetBucket: BucketFilter, query: string, targetPage: number) => {
      const seq = ++requestSeqRef.current;
      startTransition(async () => {
        const res = await getPersonnelDeals(userId, {
          statusBucket: targetBucket,
          timeRange: 'all',
          search: query.trim() || undefined,
          page: targetPage,
          pageSize,
        });

        if (seq !== requestSeqRef.current) return;
        if (res.success && res.data) {
          setDeals(res.data.deals);
          setTotalCount(res.data.totalCount);
          setTotalPages(res.data.totalPages);
          setPage(res.data.page);
        }
      });
    },
    [userId, pageSize]
  );

  // Fetch deals when filter, debounced search, or page state transitions
  useEffect(() => {
    fetchDeals(bucketFilter, debouncedQuery, page);
  }, [fetchDeals, bucketFilter, debouncedQuery, page]);

  const handleTabChange = (newBucket: BucketFilter): void => {
    setBucketFilter(newBucket);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const getStatusBadgeStyle = (status?: { name: string; bucket: string; color_code?: string }) => {
    if (!status) return { bg: '#efefed', color: '#454542', border: '#d8d8d4' };
    switch (status.bucket) {
      case 'converted':
        return { bg: 'rgba(16, 185, 129, 0.08)', color: '#065f46', border: 'rgba(6, 95, 70, 0.28)' };
      case 'lost':
        return { bg: 'rgba(234, 0, 42, 0.08)', color: '#9c001e', border: 'rgba(156, 0, 30, 0.28)' };
      case 'potential':
        return { bg: 'rgba(217, 119, 6, 0.08)', color: '#92400e', border: 'rgba(180, 83, 9, 0.28)' };
      default:
        return { bg: 'rgba(67, 56, 202, 0.07)', color: '#3730a3', border: 'rgba(67, 56, 202, 0.25)' };
    }
  };

  return (
    <div className={styles.ledgerCard}>
      <div className={styles.ledgerHeader}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Commercial Deal Ledger</h2>
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.bucketTabs} role="tablist" aria-label="Deal status filters">
            <button
              type="button"
              role="tab"
              aria-selected={bucketFilter === 'all'}
              className={`${styles.tabButton} ${bucketFilter === 'all' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('all')}
            >
              All Deals
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={bucketFilter === 'open'}
              className={`${styles.tabButton} ${bucketFilter === 'open' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('open')}
            >
              Open
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={bucketFilter === 'potential'}
              className={`${styles.tabButton} ${bucketFilter === 'potential' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('potential')}
            >
              In Negotiation
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={bucketFilter === 'converted'}
              className={`${styles.tabButton} ${bucketFilter === 'converted' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('converted')}
            >
              Won
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={bucketFilter === 'lost'}
              className={`${styles.tabButton} ${bucketFilter === 'lost' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('lost')}
            >
              Lost
            </button>
          </div>

          <div className={styles.searchBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Filter deals by company or client..."
              aria-label="Search deals"
            />
          </div>
        </div>
      </div>

      <div className={styles.tableContainer} tabIndex={0} aria-label="Deals scroll area">
        <table className={styles.dealTable}>
          <thead>
            <tr>
              <th scope="col">Identifier</th>
              <th scope="col">Client & Organization</th>
              <th scope="col">Status</th>
              <th scope="col">Valuation</th>
              <th scope="col">Updated</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.emptyState}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <p>{isPending ? 'Updating deal ledger...' : 'No commercial records match the selected filter criteria.'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              deals.map((deal) => {
                const badge = getStatusBadgeStyle(deal.status);
                return (
                  <tr key={deal.id}>
                    <td>
                      <span className={styles.codeChip}>{deal.lead_id}</span>
                    </td>
                    <td>
                      <div className={styles.clientMeta}>
                        <span className={styles.clientName}>{deal.name}</span>
                        {deal.company && (
                          <span className={styles.companyName}>{deal.company}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={styles.statusPill}
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {deal.status?.name || 'In Progress'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.valuationText}>
                        {canViewFinancials ? formatRupees(deal.expected_value || 0) : 'Restricted'}
                      </span>
                    </td>
                    <td className={styles.updatedCell}>
                      {new Date(deal.updated_at || deal.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <Link
                        href={`/admin/leads/${deal.id}`}
                        className={styles.inspectLink}
                        title={`Inspect deal ${deal.lead_id}`}
                      >
                        <span>Dossier</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.paginationFooter}>
        <span>
          Showing {deals.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(page * pageSize, totalCount)} of {totalCount} records
        </span>

        <div className={styles.pageControls}>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isPending}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isPending}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
