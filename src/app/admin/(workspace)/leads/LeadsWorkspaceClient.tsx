'use client';

/**
 * @file LeadsWorkspaceClient.tsx
 * @description Interactive Client Component for the Deals & Inquiries Workspace (/admin/leads).
 *              Integrates the Multi-Filter Action Bar, pipeline bucket segmented tabs, debounced search,
 *              instantaneous client-side filtering, sub-16ms URL state synchronization, and drawer triggers.
 * @module app/admin/(workspace)/leads/LeadsWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { FunnelBucket } from '@/types/crm';
import {
  FilterActionBar,
  type BucketTabId,
  type BucketCounts,
  type FilterDropdownOption,
} from '@/app/admin/components/FilterActionBar';
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
  lead_source_id?: string | null;
  lead_source_name?: string | null;
  lead_source_color?: string | null;
  next_follow_up: string | null;
  created_at: string;
}

export interface LeadsWorkspaceClientProps {
  initialLeads: HydratedLeadItem[];
  availableSources?: FilterDropdownOption[];
  availableAssignees?: FilterDropdownOption[];
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

/**
 * Evaluates whether a lead has an overdue follow-up timestamp.
 * A lead is overdue if next_follow_up is earlier than current clock time
 * and its lifecycle status is neither converted nor lost.
 */
function isLeadOverdue(lead: HydratedLeadItem): boolean {
  if (!lead.next_follow_up) return false;
  if (lead.bucket === 'converted' || lead.bucket === 'lost') return false;
  return new Date(lead.next_follow_up).getTime() < Date.now();
}

function LeadsWorkspaceContent({
  initialLeads,
  availableSources: initialSources,
  availableAssignees: initialAssignees,
}: LeadsWorkspaceClientProps): React.ReactElement {
  const searchParams = useSearchParams();

  // Read initial filter values from URL search parameters
  const bucketParam = searchParams.get('bucket');
  const searchParam = searchParams.get('search') || searchParams.get('q') || '';
  const sourceParam = searchParams.get('source');
  const assigneeParam = searchParams.get('assigned_to');
  const priorityParam = searchParams.get('priority');
  const stageParam = searchParams.get('stage');

  const validBuckets: BucketTabId[] = ['all', 'open', 'potential', 'converted', 'lost', 'overdue'];
  const initialBucket: BucketTabId = validBuckets.includes(bucketParam as BucketTabId)
    ? (bucketParam as BucketTabId)
    : 'all';

  const [selectedBucket, setSelectedBucket] = useState<BucketTabId>(initialBucket);
  const [searchQuery, setSearchQuery] = useState<string>(searchParam);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(sourceParam);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(assigneeParam);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(priorityParam);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(stageParam);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /**
   * Shallow URL Synchronizer: writes active filter state into window.history in < 16ms
   * without triggering a Next.js server component re-render or layout jitter.
   * Dispatches a native popstate event so KpiRibbon remains reactively synchronized.
   */
  const updateUrlParams = useCallback(
    (updates: {
      bucket?: BucketTabId;
      search?: string;
      source?: string | null;
      assigned_to?: string | null;
      priority?: string | null;
      stage?: string | null;
    }): void => {
      if (typeof window === 'undefined') return;

      const url = new URL(window.location.href);

      // Determine updated parameter values
      const nextBucket = updates.bucket !== undefined ? updates.bucket : selectedBucket;
      const nextSearch = updates.search !== undefined ? updates.search : searchQuery;
      const nextSource = updates.source !== undefined ? updates.source : selectedSourceId;
      const nextAssignee =
        updates.assigned_to !== undefined ? updates.assigned_to : selectedAssigneeId;
      const nextPriority = updates.priority !== undefined ? updates.priority : selectedPriority;
      const nextStage = updates.stage !== undefined ? updates.stage : selectedStageId;

      if (nextBucket && nextBucket !== 'all') {
        url.searchParams.set('bucket', nextBucket);
      } else {
        url.searchParams.delete('bucket');
      }

      if (nextSearch && nextSearch.trim().length > 0) {
        url.searchParams.set('search', nextSearch.trim());
      } else {
        url.searchParams.delete('search');
        url.searchParams.delete('q');
      }

      if (nextSource) {
        url.searchParams.set('source', nextSource);
      } else {
        url.searchParams.delete('source');
      }

      if (nextAssignee) {
        url.searchParams.set('assigned_to', nextAssignee);
      } else {
        url.searchParams.delete('assigned_to');
      }

      if (nextPriority) {
        url.searchParams.set('priority', nextPriority);
      } else {
        url.searchParams.delete('priority');
      }

      if (nextStage) {
        url.searchParams.set('stage', nextStage);
      } else {
        url.searchParams.delete('stage');
      }

      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      window.dispatchEvent(new Event('popstate'));
    },
    [
      selectedBucket,
      searchQuery,
      selectedSourceId,
      selectedAssigneeId,
      selectedPriority,
      selectedStageId,
    ]
  );

  // Sync state if URL changes externally (e.g. browser back/forward or external deep links)
  useEffect(() => {
    const rawBucket = searchParams.get('bucket');
    if (validBuckets.includes(rawBucket as BucketTabId)) {
      setSelectedBucket(rawBucket as BucketTabId);
    } else {
      setSelectedBucket('all');
    }

    setSearchQuery(searchParams.get('search') || searchParams.get('q') || '');
    setSelectedSourceId(searchParams.get('source'));
    setSelectedAssigneeId(searchParams.get('assigned_to'));
    setSelectedPriority(searchParams.get('priority'));
    setSelectedStageId(searchParams.get('stage'));
  }, [searchParams]);

  // Derive catalog dropdown options dynamically if not passed directly from server props
  const availableSources = useMemo<FilterDropdownOption[]>(() => {
    if (initialSources && initialSources.length > 0) {
      return initialSources;
    }
    const map = new Map<string, FilterDropdownOption>();
    for (const lead of initialLeads) {
      if (lead.lead_source_id && lead.lead_source_name) {
        map.set(lead.lead_source_id, {
          id: lead.lead_source_id,
          label: lead.lead_source_name,
          colorCode: lead.lead_source_color || '#ff6100',
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [initialLeads, initialSources]);

  const availableAssignees = useMemo<FilterDropdownOption[]>(() => {
    if (initialAssignees && initialAssignees.length > 0) {
      return initialAssignees;
    }
    const map = new Map<string, FilterDropdownOption>();
    for (const lead of initialLeads) {
      if (lead.assigned_to && lead.assigned_to_name && lead.assigned_to_name !== 'Unassigned') {
        const initials = lead.assigned_to_name
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();
        map.set(lead.assigned_to, {
          id: lead.assigned_to,
          label: lead.assigned_to_name,
          avatarText: initials,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [initialLeads, initialAssignees]);

  // Real-time record counts per bucket
  const counts = useMemo<BucketCounts>(() => {
    return {
      all: initialLeads.length,
      open: initialLeads.filter((l) => l.bucket === 'open').length,
      potential: initialLeads.filter((l) => l.bucket === 'potential').length,
      converted: initialLeads.filter((l) => l.bucket === 'converted').length,
      lost: initialLeads.filter((l) => l.bucket === 'lost').length,
      overdue: initialLeads.filter(isLeadOverdue).length,
    };
  }, [initialLeads]);

  // In-memory filtered leads with multi-dimensional criteria evaluation
  const filteredLeads = useMemo<HydratedLeadItem[]>(() => {
    const q = searchQuery.toLowerCase().trim();

    return initialLeads.filter((lead) => {
      // 1. Bucket condition
      if (selectedBucket === 'overdue') {
        if (!isLeadOverdue(lead)) return false;
      } else if (selectedBucket !== 'all') {
        if (lead.bucket !== selectedBucket) return false;
      }

      // 2. Stage filter condition (from deep link or KPI ribbon drilldown)
      if (selectedStageId && lead.status_id !== selectedStageId) {
        return false;
      }

      // 3. Lead Source filter condition
      if (selectedSourceId && lead.lead_source_id !== selectedSourceId) {
        return false;
      }

      // 4. Assigned Representative filter condition
      if (selectedAssigneeId && lead.assigned_to !== selectedAssigneeId) {
        return false;
      }

      // 5. Priority tier filter condition
      if (selectedPriority && lead.priority.toLowerCase() !== selectedPriority.toLowerCase()) {
        return false;
      }

      // 6. Search query condition (multi-attribute match)
      if (!q) return true;

      return (
        lead.lead_id.toLowerCase().includes(q) ||
        lead.name.toLowerCase().includes(q) ||
        (lead.company && lead.company.toLowerCase().includes(q)) ||
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
    selectedSourceId,
    selectedAssigneeId,
    selectedPriority,
    selectedStageId,
  ]);

  // Action handlers updating local state and URL parameters
  const handleBucketChange = (bucket: BucketTabId): void => {
    setSelectedBucket(bucket);
    updateUrlParams({ bucket });
  };

  const handleSearchChange = (query: string): void => {
    setSearchQuery(query);
    updateUrlParams({ search: query });
  };

  const handleSourceChange = (sourceId: string | null): void => {
    setSelectedSourceId(sourceId);
    updateUrlParams({ source: sourceId });
  };

  const handleAssigneeChange = (assigneeId: string | null): void => {
    setSelectedAssigneeId(assigneeId);
    updateUrlParams({ assigned_to: assigneeId });
  };

  const handlePriorityChange = (priority: string | null): void => {
    setSelectedPriority(priority);
    updateUrlParams({ priority });
  };

  const handleStageClear = (): void => {
    setSelectedStageId(null);
    updateUrlParams({ stage: null });
  };

  const handleClearAll = (): void => {
    setSelectedBucket('all');
    setSearchQuery('');
    setSelectedSourceId(null);
    setSelectedAssigneeId(null);
    setSelectedPriority(null);
    setSelectedStageId(null);
    updateUrlParams({
      bucket: 'all',
      search: '',
      source: null,
      assigned_to: null,
      priority: null,
      stage: null,
    });
  };

  // Dispatches global custom event to open Client 360 Drawer
  const handleRowClick = (leadId: string): void => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-lead-drawer', { detail: { leadId } }));
    }
  };

  // Deal ID copy with transient feedback
  const handleCopyDealId = (e: React.MouseEvent, leadIdText: string): void => {
    e.stopPropagation();
    navigator.clipboard.writeText(leadIdText);
    setCopiedId(leadIdText);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <>
      {/* High-Performance Multi-Filter Action Bar */}
      <FilterActionBar
        counts={counts}
        selectedBucket={selectedBucket}
        searchQuery={searchQuery}
        selectedSourceId={selectedSourceId}
        selectedAssigneeId={selectedAssigneeId}
        selectedPriority={selectedPriority}
        selectedStageId={selectedStageId}
        availableSources={availableSources}
        availableAssignees={availableAssignees}
        onBucketChange={handleBucketChange}
        onSearchChange={handleSearchChange}
        onSourceChange={handleSourceChange}
        onAssigneeChange={handleAssigneeChange}
        onPriorityChange={handlePriorityChange}
        onStageClear={handleStageClear}
        onClearAll={handleClearAll}
      />

      {/* Commercial Leads Data Table */}
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
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()
                  : 'UN';

                let followUpText = 'No touchpoint';
                if (lead.next_follow_up) {
                  const d = new Date(lead.next_follow_up);
                  followUpText = d.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }

                return (
                  <tr
                    key={lead.id}
                    className={styles.tableRow}
                    onClick={() => handleRowClick(lead.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`View deal ${lead.lead_id} for ${lead.name}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(lead.id);
                      }
                    }}
                  >
                    <td>
                      <button
                        type="button"
                        className={styles.leadIdToken}
                        onClick={(e) => handleCopyDealId(e, lead.lead_id)}
                        title="Click to copy Deal ID"
                      >
                        <span>{lead.lead_id}</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                          {copiedId === lead.lead_id ? '✓' : '⧉'}
                        </span>
                      </button>
                    </td>
                    <td>
                      <div className={styles.clientMeta}>
                        <span className={styles.clientName}>{lead.name}</span>
                        {lead.company && (
                          <span className={styles.companyTitle}>{lead.company}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={styles.companyTitle} style={{ color: '#cccccc' }}>
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
