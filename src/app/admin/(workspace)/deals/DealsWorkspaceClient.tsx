'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { FunnelBucket } from '@/types/crm';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import { updateLeadStatusInlineAction } from '@/app/actions/leadInlineActions';
import { ClientDossierDrawer } from '@/app/admin/components/DossierDrawer';
import { StageTransitionModal } from '@/app/admin/components/modals/StageTransitionModal';
import { OverdueBadge } from '@/app/admin/components/Badges';
import type { GuardedTransitionResultPayload } from '@/app/lib/stage-transition-schemas';
import { DealsKanbanBoard } from './DealsKanbanBoard';
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
  revisit_date?: string | null;
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
  is_active?: boolean;
}

interface DealsWorkspaceClientProps {
  initialDeals: HydratedDealItem[];
  pagination?: React.ReactNode;
  lookupNotice?: string;
  sources?: Array<{ id: string; name: string }>;
  statuses?: FunnelStatusItem[];
  userRole?: string;
}

function formatDealValue(amount: number): string {
  return formatCrmCurrency(amount);
}

type SortField =
  | 'lead_id'
  | 'name'
  | 'status_name'
  | 'expected_value'
  | 'priority'
  | 'assigned_to_name'
  | 'next_follow_up';

export function DealsWorkspaceClient({
  initialDeals,
  pagination,
  lookupNotice,
  statuses = [],
  userRole,
}: DealsWorkspaceClientProps): React.ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bucketParam = searchParams.get('bucket');
  const assignedToParam = searchParams.get('assigned_to');
  const searchParam = searchParams.get('search') || searchParams.get('q') || '';

  const initialBucket: 'all' | 'open' | 'potential' | 'converted' | 'lost' =
    bucketParam === 'potential' || bucketParam === 'converted' || bucketParam === 'open' || bucketParam === 'lost'
      ? bucketParam
      : 'all';

  const [deals, setDeals] = useState<HydratedDealItem[]>(initialDeals);
  const moveLock = useRef(false);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moveNotice, setMoveNotice] = useState('');

  // Synchronize state when server hydration updates
  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  const viewMode = searchParams.get('view') === 'table' ? 'table' : 'kanban';
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [selectedBucket, setSelectedBucket] = useState<'all' | 'open' | 'potential' | 'converted' | 'lost'>(initialBucket);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(assignedToParam);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sortField, setSortField] = useState<SortField>('expected_value');
  const [sortAscending, setSortAscending] = useState(false);

  // Synchronize with URL search parameters on route navigation
  useEffect(() => {
    setSelectedBucket(bucketParam && ['open', 'potential', 'converted', 'lost'].includes(bucketParam)
      ? bucketParam as 'open' | 'potential' | 'converted' | 'lost' : 'all');
    setSelectedAssigneeId(assignedToParam);
  }, [bucketParam, assignedToParam]);

  useEffect(() => { if (!searchTimer.current) setSearchTerm(searchParam); }, [searchParam]);
  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);

  const updateServerFilter = (key: string, value: string | null): void => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') params.set(key, value);
    else params.delete(key);
    if (key !== 'view') params.delete('page');
    const query = params.toString();
    router.replace(query ? `/admin/deals?${query}` : '/admin/deals', { scroll: false });
  };

  const updateSearch = (value: string): void => {
    setSearchTerm(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (value.trim()) params.set('search', value.trim());
      else params.delete('search');
      params.delete('q');
      params.delete('page');
      const query = params.toString();
      router.replace(query ? `/admin/deals?${query}` : '/admin/deals', { scroll: false });
      searchTimer.current = null;
    }, 300);
  };

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
      const matchesBucket =
        selectedBucket === 'all' || deal.status_bucket === selectedBucket;

      const matchesAssignee =
        !selectedAssigneeId || deal.assigned_to === selectedAssigneeId;

      return matchesBucket && matchesAssignee;
    });
  }, [deals, selectedBucket, selectedAssigneeId]);

  // Sorted deals for Table view
  const sortedTableDeals = useMemo(() => {
    const list = [...filteredDeals];
    list.sort((a, b) => {
      if (sortField === 'expected_value') {
        const valA = a.expected_value || 0;
        const valB = b.expected_value || 0;
        if (valA < valB) return sortAscending ? -1 : 1;
        if (valA > valB) return sortAscending ? 1 : -1;
        return 0;
      }

      if (sortField === 'priority') {
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        const valA = priorityWeight[a.priority] || 0;
        const valB = priorityWeight[b.priority] || 0;
        if (valA < valB) return sortAscending ? -1 : 1;
        if (valA > valB) return sortAscending ? 1 : -1;
        return 0;
      }

      if (sortField === 'next_follow_up') {
        const aTime = a.next_follow_up ? new Date(a.next_follow_up).getTime() : NaN;
        const bTime = b.next_follow_up ? new Date(b.next_follow_up).getTime() : NaN;
        const aValid = !Number.isNaN(aTime);
        const bValid = !Number.isNaN(bTime);
        if (!aValid && !bValid) return 0;
        if (!aValid) return 1; // SQL NULLS LAST standard
        if (!bValid) return -1;
        return sortAscending ? aTime - bTime : bTime - aTime;
      }

      const valA = (a[sortField] ?? '').toString().toLowerCase();
      const valB = (b[sortField] ?? '').toString().toLowerCase();

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

  const handleInspectDeal = useCallback((dealId: string): void => {
    router.push(`/admin/deals/${dealId}`);
  }, [router]);

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
  }, [handleInspectDeal]);

  /** Board drops and the Move control share the same authorized workflow. Commit a card position only after the server confirms it. */
  async function handleMoveStage(deal: HydratedDealItem, destination: FunnelStatusItem): Promise<void> {
    if (userRole === 'viewer' || moveLock.current || stageModalState.isOpen) return;
    const target = sortedStages.find((stage) => stage.id === destination.id);
    const current = deals.find((item) => item.id === deal.id);
    if (!target || target.is_active === false || !current || current.status_id === target.id) return;

    setMoveError(null);
    setMoveNotice('');
    const targetName = target.name.trim().toLowerCase();
    if (target.bucket === 'converted' || target.bucket === 'lost' ||
        targetName === 'negotiation' || targetName === 'on hold') {
      setStageModalState({
        isOpen: true,
        leadId: current.id,
        targetStatus: { id: target.id, name: target.name, bucket: target.bucket as FunnelBucket },
      });
      return;
    }

    moveLock.current = true;
    setMovingLeadId(current.id);
    try {
      const result = await updateLeadStatusInlineAction(current.id, target.id);
      if (!result.success) throw new Error(result.error || 'The stage change could not be saved.');
      const confirmed = result.data?.statusDetails;
      setDeals((previous) => previous.map((item) => item.id === current.id ? {
        ...item,
        status_id: confirmed?.id ?? target.id,
        status_name: confirmed?.name ?? target.name,
        status_bucket: (confirmed?.bucket ?? target.bucket) as FunnelBucket,
        status_color: confirmed?.color_code ?? target.color_code,
        updated_at: result.data?.updatedAt ?? item.updated_at,
      } : item));
      setMoveNotice(`${current.name} moved to ${confirmed?.name ?? target.name}.`);
      router.refresh();
    } catch (error) {
      console.error('[deals] Stage change failed', error);
      setMoveError('Could not confirm the stage change. Refresh before trying again.');
    } finally {
      moveLock.current = false;
      setMovingLeadId(null);
    }
  }

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
              updated_at: payload.updatedAt || d.updated_at,
              next_follow_up: payload.nextFollowUp === undefined ? d.next_follow_up : payload.nextFollowUp,
              revisit_date: payload.revisitDate === undefined ? d.revisit_date : payload.revisitDate,
            }
          : d
      )
    );
    setMoveNotice(`Moved to ${payload.newStatusName}.`);
    router.refresh();
  };

  return (
    <div className={styles.clientContainer}>
      {moveError && <p className={styles.moveError} role="alert">{moveError}</p>}
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
            aria-label="Search deals by name, company or reference"
            placeholder="Search name, company or deal reference..."
            value={searchTerm}
            onChange={(e) => updateSearch(e.target.value)}
          />
        </div>

        <div className={styles.rightControls}>
          {/* View Mode Toggle */}
          <div className={styles.viewModeToggle} role="group" aria-label="View Mode Switcher">
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === 'kanban' ? styles.viewModeBtnActive : ''}`}
              onClick={() => updateServerFilter('view', null)}
              aria-pressed={viewMode === 'kanban'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="11" rx="1" />
              </svg>
              Board
            </button>
            <button
              type="button"
              className={`${styles.viewModeBtn} ${viewMode === 'table' ? styles.viewModeBtnActive : ''}`}
              onClick={() => updateServerFilter('view', 'table')}
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
              Table
            </button>
          </div>

          {/* Bucket Filter Pills */}
          <div className={styles.bucketFilterGroup} role="group" aria-label="Bucket Filter">
            <button
              type="button"
              className={`${styles.filterPill} ${selectedBucket === 'all' ? styles.filterPillActive : ''}`}
              onClick={() => { setSelectedBucket('all'); updateServerFilter('bucket', null); }}
              aria-pressed={selectedBucket === 'all'}
            >
              All stages
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${selectedBucket === 'open' ? styles.filterPillActive : ''}`}
              onClick={() => { setSelectedBucket('open'); updateServerFilter('bucket', 'open'); }}
              aria-pressed={selectedBucket === 'open'}
            >
              Active
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${selectedBucket === 'potential' ? styles.filterPillActive : ''}`}
              onClick={() => { setSelectedBucket('potential'); updateServerFilter('bucket', 'potential'); }}
              aria-pressed={selectedBucket === 'potential'}
            >
              Potential
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${selectedBucket === 'converted' ? styles.filterPillActive : ''}`}
              onClick={() => { setSelectedBucket('converted'); updateServerFilter('bucket', 'converted'); }}
              aria-pressed={selectedBucket === 'converted'}
            >
              Converted
            </button>
            <button type="button" className={`${styles.filterPill} ${selectedBucket === 'lost' ? styles.filterPillActive : ''}`}
              onClick={() => { setSelectedBucket('lost'); updateServerFilter('bucket', 'lost'); }} aria-pressed={selectedBucket === 'lost'}>
              Lost
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
            onClick={() => { setSelectedAssigneeId(null); updateServerFilter('assigned_to', null); }}
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

      {lookupNotice && (
        <div className={styles.lookupNotice}>
          <span role="status">{lookupNotice}</span>
          <button type="button" onClick={() => router.refresh()}>Retry</button>
        </div>
      )}
      {moveNotice && <p className={styles.moveNotice} role="status">{moveNotice}</p>}

      {viewMode === 'kanban' && (
        <DealsKanbanBoard stages={sortedStages} deals={filteredDeals}
          userRole={userRole} movingDealId={movingLeadId} onMove={handleMoveStage} />
      )}

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
            <button
              type="button"
              className={styles.sortableHeaderCol}
              onClick={() => handleToggleSort('next_follow_up')}
              aria-label={`Sort by Next SLA Touchpoint, currently ${sortField === 'next_follow_up' ? (sortAscending ? 'ascending' : 'descending') : 'unsorted'}`}
            >
              Next SLA{' '}
              {sortField === 'next_follow_up' && (
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

                    <div className={styles.colSla}>
                      <span className={styles.slaDateText}>
                        {deal.next_follow_up
                          ? new Date(deal.next_follow_up).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'None'}
                      </span>
                      <OverdueBadge
                        nextFollowUp={deal.next_follow_up}
                        statusName={deal.status_name}
                        revisitDate={deal.revisit_date}
                        bucket={deal.status_bucket}
                        variant="short"
                      />
                    </div>

                    <div className={styles.colAction}>
                      <button
                        type="button"
                        className={styles.inspectButton}
                        onClick={() => handleInspectDeal(deal.id)}
                        title="Inspect Client 360 Dossier"
                        aria-label={`Inspect dossier for ${deal.lead_id}`}
                      >
                        <span>View 360°</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {pagination}

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
