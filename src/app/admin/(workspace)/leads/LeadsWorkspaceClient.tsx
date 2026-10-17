'use client';

/**
 * @file LeadsWorkspaceClient.tsx
 * @description Interactive Client Component for the Deals & Inquiries Workspace (/admin/leads).
 *              Provides instantaneous client-side search filtering, URL deep-linking support,
 *              clickable table row triggers for the Client 360 Drawer, and 1-click clipboard tokens.
 * @module app/admin/(workspace)/leads/LeadsWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { FunnelBucket } from '@/types/crm';
import styles from './leads.module.scss';

export interface HydratedLeadItem {
  id: string;
  lead_id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  preferred_channel: string;
  service_category: string;
  expected_value: number;
  priority: string;
  status_id: string;
  status_name: string;
  status_color: string;
  bucket: FunnelBucket;
  assigned_to?: string | null;
  assigned_to_name: string;
  next_follow_up: string | null;
  created_at: string;
}

interface LeadsWorkspaceClientProps {
  initialLeads: HydratedLeadItem[];
}

function formatCurrency(amount: number): string {
  if (!amount || amount <= 0) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

function LeadsWorkspaceContent({
  initialLeads,
}: LeadsWorkspaceClientProps): React.ReactElement {
  const searchParams = useSearchParams();

  // URL query parameter synchronization
  const bucketParam = searchParams.get('bucket');
  const stageParam = searchParams.get('stage');
  const assignedToParam = searchParams.get('assigned_to');

  const [selectedBucket, setSelectedBucket] = useState<'all' | FunnelBucket>(
    bucketParam === 'open' ||
      bucketParam === 'potential' ||
      bucketParam === 'converted' ||
      bucketParam === 'lost'
      ? bucketParam
      : 'all'
  );

  const [activeStageFilter, setActiveStageFilter] = useState<string | null>(stageParam);
  const [activeAssigneeFilter, setActiveAssigneeFilter] = useState<string | null>(
    assignedToParam
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (
      bucketParam === 'open' ||
      bucketParam === 'potential' ||
      bucketParam === 'converted' ||
      bucketParam === 'lost'
    ) {
      setSelectedBucket(bucketParam);
    }
  }, [bucketParam]);

  useEffect(() => {
    setActiveStageFilter(stageParam);
  }, [stageParam]);

  useEffect(() => {
    setActiveAssigneeFilter(assignedToParam);
  }, [assignedToParam]);

  // Bucket counts
  const counts = useMemo(() => {
    return {
      all: initialLeads.length,
      open: initialLeads.filter((l) => l.bucket === 'open').length,
      potential: initialLeads.filter((l) => l.bucket === 'potential').length,
      converted: initialLeads.filter((l) => l.bucket === 'converted').length,
      lost: initialLeads.filter((l) => l.bucket === 'lost').length,
    };
  }, [initialLeads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return initialLeads.filter((lead) => {
      // Stage filter check (from deep links)
      if (activeStageFilter && lead.status_id !== activeStageFilter) {
        return false;
      }

      // Assignee filter check (from deep links)
      if (activeAssigneeFilter && lead.assigned_to !== activeAssigneeFilter) {
        return false;
      }

      // Bucket check
      if (selectedBucket !== 'all' && lead.bucket !== selectedBucket) {
        return false;
      }

      // Search query check
      if (!q) return true;
      return (
        lead.name.toLowerCase().includes(q) ||
        (lead.company && lead.company.toLowerCase().includes(q)) ||
        lead.lead_id.toLowerCase().includes(q) ||
        (lead.email && lead.email.toLowerCase().includes(q)) ||
        (lead.phone && lead.phone.toLowerCase().includes(q)) ||
        lead.service_category.toLowerCase().includes(q) ||
        lead.assigned_to_name.toLowerCase().includes(q)
      );
    });
  }, [
    initialLeads,
    selectedBucket,
    searchQuery,
    activeStageFilter,
    activeAssigneeFilter,
  ]);

  // Handle row click: dispatches global custom event to open Client 360 Drawer
  const handleRowClick = (leadId: string): void => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-lead-drawer', { detail: { leadId } })
      );
    }
  };

  // Handle Deal ID copy
  const handleCopyDealId = (e: React.MouseEvent, leadIdText: string): void => {
    e.stopPropagation();
    navigator.clipboard.writeText(leadIdText);
    setCopiedId(leadIdText);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Clear specific deep-link filters
  const handleClearStageFilter = (): void => {
    setActiveStageFilter(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('stage');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  const handleClearAssigneeFilter = (): void => {
    setActiveAssigneeFilter(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('assigned_to');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  return (
    <>
      {/* Active Filter Indicators */}
      {(activeStageFilter || activeAssigneeFilter) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 1rem',
            background: 'rgba(255, 97, 0, 0.08)',
            border: '1px solid rgba(255, 97, 0, 0.25)',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: '#ffffff',
          }}
        >
          <span style={{ color: '#ff6100', fontWeight: 600 }}>Active Filters:</span>
          {activeStageFilter && (
            <button
              type="button"
              onClick={handleClearStageFilter}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.74rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <span>Stage Filter Active</span>
              <span style={{ color: '#ff6100' }}>✕</span>
            </button>
          )}
          {activeAssigneeFilter && (
            <button
              type="button"
              onClick={handleClearAssigneeFilter}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.74rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <span>Representative Filter Active</span>
              <span style={{ color: '#ff6100' }}>✕</span>
            </button>
          )}
        </div>
      )}

      {/* Controls Bar: Bucket Tabs & Search */}
      <div className={styles.controlsBar}>
        <div className={styles.bucketTabs} role="tablist" aria-label="Pipeline Stages">
          <button
            type="button"
            role="tab"
            aria-selected={selectedBucket === 'all'}
            onClick={() => setSelectedBucket('all')}
            className={`${styles.tabBtn} ${selectedBucket === 'all' ? styles.tabBtnActive : ''}`}
          >
            <span>All Deals</span>
            <span className={styles.tabCount}>{counts.all}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedBucket === 'open'}
            onClick={() => setSelectedBucket('open')}
            className={`${styles.tabBtn} ${selectedBucket === 'open' ? styles.tabBtnActive : ''}`}
          >
            <span>Open</span>
            <span className={styles.tabCount}>{counts.open}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedBucket === 'potential'}
            onClick={() => setSelectedBucket('potential')}
            className={`${styles.tabBtn} ${selectedBucket === 'potential' ? styles.tabBtnActive : ''}`}
          >
            <span>Potential</span>
            <span className={styles.tabCount}>{counts.potential}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedBucket === 'converted'}
            onClick={() => setSelectedBucket('converted')}
            className={`${styles.tabBtn} ${selectedBucket === 'converted' ? styles.tabBtnActive : ''}`}
          >
            <span>Won</span>
            <span className={styles.tabCount}>{counts.converted}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedBucket === 'lost'}
            onClick={() => setSelectedBucket('lost')}
            className={`${styles.tabBtn} ${selectedBucket === 'lost' ? styles.tabBtnActive : ''}`}
          >
            <span>Lost</span>
            <span className={styles.tabCount}>{counts.lost}</span>
          </button>
        </div>

        <div className={styles.searchBox}>
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
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals, company, or rep..."
            className={styles.searchInput}
            aria-label="Filter deals"
          />
        </div>
      </div>

      {/* Leads Data Table */}
      <div className={styles.tableWrapper}>
        {filteredLeads.length === 0 ? (
          <div className={styles.emptyState}>
            <span>No prospective deals matching the current filter criteria.</span>
          </div>
        ) : (
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th>Deal ID</th>
                <th>Client & Company</th>
                <th>Service</th>
                <th>Stage</th>
                <th>Valuation</th>
                <th>Assigned Rep</th>
                <th>Next Touchpoint</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const repInitials = lead.assigned_to_name
                  ? lead.assigned_to_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()
                  : 'UN';

                const followUpText = lead.next_follow_up
                  ? new Date(lead.next_follow_up).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—';

                return (
                  <tr
                    key={lead.id}
                    className={styles.tableRow}
                    onClick={() => handleRowClick(lead.id)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRowClick(lead.id);
                    }}
                    aria-label={`Open Client 360 dossier for ${lead.name}`}
                  >
                    <td>
                      <span
                        className={styles.leadIdToken}
                        onClick={(e) => handleCopyDealId(e, lead.lead_id)}
                        title="Click to copy Deal ID"
                      >
                        {lead.lead_id}
                        {copiedId === lead.lead_id ? (
                          <span style={{ color: '#10b981', fontSize: '0.62rem' }}>✓</span>
                        ) : null}
                      </span>
                    </td>
                    <td>
                      <div className={styles.clientMeta}>
                        <span className={styles.clientName}>{lead.name}</span>
                        <span className={styles.companyTitle}>
                          {lead.company || 'Private Client'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>
                        {lead.service_category}
                      </span>
                    </td>
                    <td>
                      <span
                        className={styles.statusPill}
                        style={{
                          background: `${lead.status_color || '#ff6100'}18`,
                          border: `1px solid ${lead.status_color || '#ff6100'}35`,
                          color: lead.status_color || '#ff6100',
                        }}
                      >
                        ● {lead.status_name}
                      </span>
                    </td>
                    <td>
                      <span className={styles.dealValue}>
                        {formatCurrency(lead.expected_value)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.repBadge}>
                        <div className={styles.repAvatar}>{repInitials}</div>
                        <span>{lead.assigned_to_name}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          color: '#a1a1aa',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                        }}
                      >
                        {followUpText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export function LeadsWorkspaceClient(
  props: LeadsWorkspaceClientProps
): React.ReactElement {
  return (
    <Suspense fallback={null}>
      <LeadsWorkspaceContent {...props} />
    </Suspense>
  );
}
