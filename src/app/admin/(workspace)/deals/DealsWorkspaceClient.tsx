'use client';

/**
 * @file DealsWorkspaceClient.tsx
 * @description Interactive Client Component for the Pipeline Deals Workspace (/admin/deals).
 *              Features a switchable Interactive Kanban Board (grouped by funnel stages with column
 *              pipeline valuation sums and 1-click stage advancement) alongside an interactive,
 *              sortable Data Grid. Integrated with Client 360° Dossier Drawer and guarded StageTransitionModal.
 * @module app/admin/(workspace)/deals/DealsWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { FunnelBucket } from '@/types/crm';
import { updateLeadStatusInlineAction } from '@/app/actions/leadInlineActions';
import { ClientDossierDrawer } from '@/app/admin/components/DossierDrawer';
import { StageTransitionModal } from '@/app/admin/components/modals/StageTransitionModal';
import type { GuardedTransitionResultPayload } from '@/app/lib/stage-transition-schemas';
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

export interface FunnelStatusItem {
  id: string;
  name: string;
  sort_order: number;
  bucket: string;
  color_code: string;
}

interface DealsWorkspaceClientProps {
  initialDeals: HydratedDealItem[];
  sources?: Array<{ id: string; name: string }>;
  profiles?: Array<{ id: string; full_name: string; email: string; role: string }>;
  statuses?: FunnelStatusItem[];
  userRole?: string;
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

type SortField = 'lead_id' | 'name' | 'status_name' | 'expected_value' | 'priority' | 'assigned_to_name';

export function DealsWorkspaceClient({
  initialDeals,
  statuses = [],
  userRole,
}: DealsWorkspaceClientProps): React.ReactElement {
  const searchParams = useSearchParams();
  const bucketParam = searchParams.get('bucket');
  const assignedToParam = searchParams.get('assigned_to');
  const searchParam = searchParams.get('search') || searchParams.get('q') || '';

  const initialBucket: 'all' | 'open' | 'potential' | 'converted' =
    bucketParam === 'potential' || bucketParam === 'converted' || bucketParam === 'open'
      ? bucketParam
      : 'all';

  const [deals, setDeals] = useState<HydratedDealItem[]>(initialDeals);

  // Synchronize state when server hydration updates
  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [selectedBucket, setSelectedBucket] = useState<'all' | 'open' | 'potential' | 'converted'>(initialBucket);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(assignedToParam);
  const [sortField, setSortField] = useState<SortField>('expected_value');
  const [sortAscending, setSortAscending] = useState(false);

  // Synchronize with URL search parameters on route navigation
  useEffect(() => {
    if (bucketParam && ['open', 'potential', 'converted'].includes(bucketParam)) {
      setSelectedBucket(bucketParam as 'open' | 'potential' | 'converted');
    }
    if (assignedToParam !== null) {
      setSelectedAssigneeId(assignedToParam);
    }
  }, [bucketParam, assignedToParam]);

  // Drawer and modal state
  const [activeDrawerDealId, setActiveDrawerDealId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [stageModalState, setStageModalState] = useState<{
    isOpen: boolean;
    leadId: string | null;
    targetStatus: { id: string; name: string; bucket: FunnelBucket } | null;
  }>({
    isOpen: false,
    leadId: null,
    targetStatus: null,
  });

  // Sorted stages for Kanban columns
  const sortedStages = useMemo(() => {
    return [...statuses].sort((a, b) => a.sort_order - b.sort_order);
  }, [statuses]);

  // Filtered deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        deal.name.toLowerCase().includes(q) ||
        (deal.company && deal.company.toLowerCase().includes(q)) ||
        deal.lead_id.toLowerCase().includes(q) ||
        deal.assigned_to_name.toLowerCase().includes(q);

      const matchesBucket =
        selectedBucket === 'all' || deal.status_bucket === selectedBucket;

      const matchesAssignee =
        !selectedAssigneeId || deal.assigned_to === selectedAssigneeId;

      return matchesSearch && matchesBucket && matchesAssignee;
    });
  }, [deals, searchTerm, selectedBucket, selectedAssigneeId]);

  // Sorted deals for Table view
  const sortedTableDeals = useMemo(() => {
    const list = [...filteredDeals];
    list.sort((a, b) => {
      let valA: string | number = a[sortField];
      let valB: string | number = b[sortField];

      if (sortField === 'expected_value') {
        valA = a.expected_value || 0;
        valB = b.expected_value || 0;
      } else if (sortField === 'priority') {
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        valA = priorityWeight[a.priority] || 0;
        valB = priorityWeight[b.priority] || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortAscending ? -1 : 1;
      if (valA > valB) return sortAscending ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredDeals, sortField, sortAscending]);

  const handleToggleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortAscending((prev) => !prev);
    } else {
      setSortField(field);
      setSortAscending(false);
    }
  };

  const handleInspectDeal = (dealId: string): void => {
    setActiveDrawerDealId(dealId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = (): void => {
    setIsDrawerOpen(false);
    setActiveDrawerDealId(null);
  };

  // Synchronize with global open-lead-drawer events dispatched by header / URL sync
  useEffect(() => {
    const handleOpenDrawerEvent = (e: Event): void => {
      const customEvt = e as CustomEvent<{ leadId?: string } | string>;
      const id =
        typeof customEvt.detail === 'string'
          ? customEvt.detail
          : customEvt.detail?.leadId;
      if (id) {
        handleInspectDeal(id);
      }
    };
    window.addEventListener('open-lead-drawer', handleOpenDrawerEvent);
    return () => window.removeEventListener('open-lead-drawer', handleOpenDrawerEvent);
  }, []);

  /**
   * Evaluates if advancing to a target status triggers guarded requirements.
   */
  const isGuardedStatus = (statusName: string, bucket: string): boolean => {
    const norm = statusName.toLowerCase();
    return (
      bucket === 'converted' ||
      bucket === 'lost' ||
      norm.includes('negotiation') ||
      norm.includes('converted') ||
      norm.includes('lost') ||
      norm.includes('hold')
    );
  };

  /**
   * 1-Click stage progression from Kanban card controls.
   */
  const handleMoveStage = useCallback(
    async (deal: HydratedDealItem, direction: 'prev' | 'next'): Promise<void> => {
      if (userRole === 'viewer') return;

      const currentIndex = sortedStages.findIndex((s) => s.id === deal.status_id);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (targetIndex < 0 || targetIndex >= sortedStages.length) return;

      const targetStage = sortedStages[targetIndex];

      // Check if guarded transition
      if (isGuardedStatus(targetStage.name, targetStage.bucket)) {
        setStageModalState({
          isOpen: true,
          leadId: deal.id,
          targetStatus: {
            id: targetStage.id,
            name: targetStage.name,
            bucket: targetStage.bucket as FunnelBucket,
          },
        });
        return;
      }

      // Optimistic in-memory update
      setDeals((prev) =>
        prev.map((d) =>
          d.id === deal.id
            ? {
                ...d,
                status_id: targetStage.id,
                status_name: targetStage.name,
                status_bucket: targetStage.bucket as HydratedDealItem['status_bucket'],
                status_color: targetStage.color_code,
              }
            : d
        )
      );

      // Perform server mutation
      const res = await updateLeadStatusInlineAction(deal.id, targetStage.id);
      if (!res.success) {
        // Targeted rollback for this deal only
        setDeals((prev) =>
          prev.map((d) => (d.id === deal.id ? deal : d))
        );
        console.error('[DealsWorkspaceClient] Stage transition failed:', res.error);
      }
    },
    [sortedStages, userRole]
  );

  const handleStageTransitionSuccess = (payload: GuardedTransitionResultPayload): void => {
    const matchingStage = sortedStages.find((s) => s.id === payload.newStatusId);
    setDeals((prev) =>
      prev.map((d) =>
        d.id === payload.leadId
          ? {
              ...d,
              status_id: payload.newStatusId,
              status_name: payload.newStatusName,
              status_bucket: payload.bucket as HydratedDealItem['status_bucket'],
              status_color: matchingStage?.color_code || d.status_color,
              expected_value:
                payload.expectedValue !== undefined ? payload.expectedValue : d.expected_value,
              updated_at: payload.updatedAt || new Date().toISOString(),
            }
          : d
      )
    );
  };

  return (
    <div className={styles.clientContainer}>
      {/* Search & Operational Controls Toolbar */}
      <div className={styles.topControlBar}>
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
            placeholder="Search deals by client, company, deal ref, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.rightControls}>
          {/* View Mode Toggle */}
          <div className={styles.viewModeToggle} role="group" aria-label="View Mode Switcher">
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === 'kanban' ? styles.viewModeBtnActive : ''}`}
              onClick={() => setViewMode('kanban')}
              aria-pressed={viewMode === 'kanban'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="11" rx="1" />
              </svg>
              Kanban Board
            </button>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === 'table' ? styles.viewModeBtnActive : ''}`}
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Data Grid
            </button>
          </div>

          {/* Bucket Filter Pills */}
          <div className={styles.bucketFilterGroup} role="group" aria-label="Bucket Filter">
            <button
              type="button"
              className={`${styles.filterPill} ${selectedBucket === 'all' ? styles.filterPillActive : ''}`}
              onClick={() => setSelectedBucket('all')}
            >
              All ({deals.length})
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
      </div>

      {selectedAssigneeId && (
        <div className={styles.activeFilterNotice}>
          <span>
            Filtering by Representative: <strong>{deals.find((d) => d.assigned_to === selectedAssigneeId)?.assigned_to_name || 'Assigned Representative'}</strong>
          </span>
          <button
            type="button"
            className={styles.clearFilterBtn}
            onClick={() => setSelectedAssigneeId(null)}
            aria-label="Clear representative filter"
          >
            Clear Filter
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className={styles.kanbanBoardContainer} aria-label="Interactive Deals Kanban Board">
          {sortedStages.map((stage, stageIdx) => {
            const stageDeals = filteredDeals.filter((d) => d.status_id === stage.id);
            const totalStageValuation = stageDeals.reduce((sum, d) => sum + (d.expected_value || 0), 0);

            return (
              <section key={stage.id} className={styles.kanbanColumn} aria-label={`Stage ${stage.name}`}>
                {/* Column Header Strip */}
                <div className={styles.columnHeader}>
                  <div className={styles.columnTitleRow}>
                    <div className={styles.columnIdentity}>
                      <span
                        className={styles.columnStatusDot}
                        style={{ backgroundColor: stage.color_code || '#1f242f' }}
                        aria-hidden="true"
                      />
                      <h2 className={styles.columnTitle}>{stage.name}</h2>
                    </div>
                    <span className={styles.columnCountBadge}>{stageDeals.length}</span>
                  </div>

                  <div className={styles.columnValuationRow}>
                    <span className={styles.columnValuationLabel}>Pipeline Value</span>
                    <span className={styles.columnValuationSum}>
                      {formatDealValue(totalStageValuation)}
                    </span>
                  </div>
                </div>

                {/* Column Card List */}
                <div className={styles.columnCardList}>
                  {stageDeals.length === 0 ? (
                    <div className={styles.emptyColumnState}>No deals in this stage</div>
                  ) : (
                    stageDeals.map((deal) => {
                      const priorityClass =
                        deal.priority === 'High'
                          ? styles.priorityHigh
                          : deal.priority === 'Medium'
                          ? styles.priorityMedium
                          : styles.priorityLow;

                      const initials = deal.assigned_to_name
                        .split(' ')
                        .filter(Boolean)
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <article
                          key={deal.id}
                          className={styles.kanbanCard}
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
                          <div className={styles.cardTopRow}>
                            <span className={styles.cardIdBadge}>{deal.lead_id}</span>
                            <span className={`${styles.priorityBadge} ${priorityClass}`}>
                              {deal.priority}
                            </span>
                          </div>

                          <div className={styles.cardClientBlock}>
                            <h3 className={styles.cardClientName}>{deal.name}</h3>
                            <span className={styles.cardCompanyName}>
                              {deal.company || 'Private Account'}
                            </span>
                          </div>

                          <div className={styles.cardValueRow}>
                            <span className={styles.cardValueLabel}>Valuation</span>
                            <span className={styles.cardValueAmount}>
                              {formatDealValue(deal.expected_value)}
                            </span>
                          </div>

                          <div className={styles.cardFooter}>
                            <div className={styles.cardOwnerInfo} title={deal.assigned_to_name}>
                              <div className={styles.avatarMonogram}>{initials || 'MU'}</div>
                              <span className={styles.cardOwnerName}>{deal.assigned_to_name}</span>
                            </div>

                            <div
                              className={styles.cardQuickActions}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className={styles.stageMoveBtn}
                                title={userRole === 'viewer' ? 'Read-only access' : 'Move to previous stage'}
                                disabled={stageIdx === 0 || userRole === 'viewer'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStage(deal, 'prev');
                                }}
                                onKeyDown={(e) => e.stopPropagation()}
                                aria-label={`Move ${deal.lead_id} to previous stage`}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <polyline points="15 18 9 12 15 6" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className={styles.stageMoveBtn}
                                title={userRole === 'viewer' ? 'Read-only access' : 'Advance to next stage'}
                                disabled={stageIdx === sortedStages.length - 1 || userRole === 'viewer'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStage(deal, 'next');
                                }}
                                onKeyDown={(e) => e.stopPropagation()}
                                aria-label={`Advance ${deal.lead_id} to next stage`}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* SORTABLE DATA GRID (TABLE) VIEW */}
      {viewMode === 'table' && (
        <div className={styles.gridCard}>
          <div className={styles.tableHeader}>
            <button
              type="button"
              className={styles.sortableHeaderCol}
              onClick={() => handleToggleSort('lead_id')}
            >
              Deal Ref{' '}
              {sortField === 'lead_id' && (
                <span className={styles.sortArrow} aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                  </svg>
                </span>
              )}
            </button>
            <button
              type="button"
              className={styles.sortableHeaderCol}
              onClick={() => handleToggleSort('name')}
            >
              Client & Company{' '}
              {sortField === 'name' && (
                <span className={styles.sortArrow} aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                  </svg>
                </span>
              )}
            </button>
            <button
              type="button"
              className={styles.sortableHeaderCol}
              onClick={() => handleToggleSort('status_name')}
            >
              Stage{' '}
              {sortField === 'status_name' && (
                <span className={styles.sortArrow} aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                  </svg>
                </span>
              )}
            </button>
            <button
              type="button"
              className={styles.sortableHeaderCol}
              onClick={() => handleToggleSort('expected_value')}
            >
              Contract Valuation{' '}
              {sortField === 'expected_value' && (
                <span className={styles.sortArrow} aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                  </svg>
                </span>
              )}
            </button>
            <button
              type="button"
              className={styles.sortableHeaderCol}
              onClick={() => handleToggleSort('priority')}
            >
              Priority{' '}
              {sortField === 'priority' && (
                <span className={styles.sortArrow} aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                  </svg>
                </span>
              )}
            </button>
            <button
              type="button"
              className={styles.sortableHeaderCol}
              onClick={() => handleToggleSort('assigned_to_name')}
            >
              Representative{' '}
              {sortField === 'assigned_to_name' && (
                <span className={styles.sortArrow} aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                  </svg>
                </span>
              )}
            </button>
            <span className={styles.colAction}>Action</span>
          </div>

          {sortedTableDeals.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No deals match the selected criteria.</p>
              <p className={styles.emptySub}>Adjust filters or log a new commercial opportunity.</p>
            </div>
          ) : (
            <div className={styles.tableBody}>
              {sortedTableDeals.map((deal) => {
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
      )}

      {/* Client 360° Slide-over Dossier Drawer */}
      <ClientDossierDrawer
        leadId={activeDrawerDealId}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onLeadUpdated={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('popstate'));
          }
        }}
      />

      {/* Guarded Stage Transition Modal */}
      {stageModalState.isOpen && stageModalState.leadId && stageModalState.targetStatus && (
        <StageTransitionModal
          isOpen={stageModalState.isOpen}
          onClose={() =>
            setStageModalState({ isOpen: false, leadId: null, targetStatus: null })
          }
          leadId={stageModalState.leadId}
          targetStatus={stageModalState.targetStatus}
          dealIdCode={deals.find((d) => d.id === stageModalState.leadId)?.lead_id}
          dealName={
            deals.find((d) => d.id === stageModalState.leadId)?.company ||
            deals.find((d) => d.id === stageModalState.leadId)?.name
          }
          currentExpectedValue={
            deals.find((d) => d.id === stageModalState.leadId)?.expected_value
          }
          onSuccess={handleStageTransitionSuccess}
        />
      )}
    </div>
  );
}
