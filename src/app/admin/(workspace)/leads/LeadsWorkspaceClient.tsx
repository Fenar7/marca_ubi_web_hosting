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
import {
  LeadsDataGrid,
  type InlineStatusOption,
} from '@/app/admin/components/LeadsTable';
import { ClientDossierDrawer } from '@/app/admin/components/DossierDrawer';
import { StageTransitionModal } from '@/app/admin/components/modals/StageTransitionModal';
import { BatchReassignModal, ConvertLeadToDealModal, type LeadForConversion } from '@/app/admin/components/modals';
import { FollowUpScheduler } from '@/app/admin/components/Scheduler';
import { calculateOverdueTier } from '@/app/admin/components/Badges';
import type { OverdueLeadSummary } from '@/app/lib/workload-schemas';
import type { GuardedTransitionResultPayload } from '@/app/lib/stage-transition-schemas';
import type { LeadPriority } from '@/types/crm';
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
  revisit_date?: string | null;
  created_at: string;
}

export interface LeadsWorkspaceClientProps {
  initialLeads: HydratedLeadItem[];
  availableSources?: FilterDropdownOption[];
  availableAssignees?: FilterDropdownOption[];
  availableStatuses?: InlineStatusOption[];
  userRole?: string;
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
 * In accordance with PRD §14.2 & §15.19 alert suppression rules, leads in
 * 'On Hold' status are suppressed from overdue queues while CURRENT_DATE < revisit_date.
 */
function isLeadOverdue(lead: HydratedLeadItem): boolean {
  return calculateOverdueTier(lead.next_follow_up, {
    bucket: lead.bucket,
    statusName: lead.status_name,
    revisitDate: lead.revisit_date,
  }).isOverdue;
}

function LeadsWorkspaceContent({
  initialLeads,
  availableSources: initialSources,
  availableAssignees: initialAssignees,
  availableStatuses: initialStatuses,
  userRole,
}: LeadsWorkspaceClientProps): React.ReactElement {
  const searchParams = useSearchParams();

  // Local state initialized with server-hydrated leads for optimistic in-memory reconciliation
  const [leads, setLeads] = useState<HydratedLeadItem[]>(initialLeads);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  // Read initial filter values from URL search parameters
  const bucketParam = searchParams.get('bucket');
  const searchParam = searchParams.get('search') || searchParams.get('q') || '';
  const sourceParam = searchParams.get('source');
  const assigneeParam = searchParams.get('assigned_to');
  const priorityParam = searchParams.get('priority');
  const stageParam = searchParams.get('stage');

  const leadIdParam = searchParams.get('leadId');

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

  // Client 360 Slide-over Drawer State: hydrated from URL search parameter upon deep-link navigation
  const [activeDrawerLeadId, setActiveDrawerLeadId] = useState<string | null>(leadIdParam);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(Boolean(leadIdParam));

  // Guarded Stage Transition Modal State (Negotiation, Lost, Converted)
  const [stageModalState, setStageModalState] = useState<{
    isOpen: boolean;
    leadId: string | null;
    targetStatus: { id: string; name: string; bucket: FunnelBucket } | null;
  }>({
    isOpen: false,
    leadId: null,
    targetStatus: null,
  });

  // Precision Follow-up Scheduler Modal State
  const [schedulerState, setSchedulerState] = useState<{
    isOpen: boolean;
    leadId: string | null;
    leadName?: string | null;
    company?: string | null;
    currentFollowUpDate?: string | null;
  }>({
    isOpen: false,
    leadId: null,
    leadName: null,
    company: null,
    currentFollowUpDate: null,
  });

  // Guarded Batch Lead Reassignment Modal State
  const [isBatchReassignOpen, setIsBatchReassignOpen] = useState<boolean>(false);

  // 1-Click Inbound Lead Conversion Modal State
  const [convertModalState, setConvertModalState] = useState<{
    isOpen: boolean;
    lead: LeadForConversion | null;
  }>({
    isOpen: false,
    lead: null,
  });

  // Shallow URL Synchronizer for Client 360 drawer: preserves ?leadId=<uuid> for bookmarking & persistence
  const handleOpenDrawer = useCallback((id: string) => {
    setActiveDrawerLeadId(id);
    setIsDrawerOpen(true);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('leadId') !== id) {
        url.searchParams.set('leadId', id);
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    }
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setActiveDrawerLeadId(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('leadId')) {
        url.searchParams.delete('leadId');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    }
  }, []);

  useEffect(() => {
    const handleOpenDrawerEvent = (e: Event): void => {
      const customEvt = e as CustomEvent<{ leadId?: string } | string>;
      const id =
        typeof customEvt.detail === 'string'
          ? customEvt.detail
          : customEvt.detail?.leadId;
      if (id) {
        handleOpenDrawer(id);
      }
    };

    window.addEventListener('open-lead-drawer', handleOpenDrawerEvent);
    return () => window.removeEventListener('open-lead-drawer', handleOpenDrawerEvent);
  }, [handleOpenDrawer]);

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
        url.searchParams.set('source_id', nextSource);
      } else {
        url.searchParams.delete('source');
        url.searchParams.delete('source_id');
      }

      if (nextAssignee) {
        url.searchParams.set('assigned_to', nextAssignee);
        url.searchParams.set('assignee_id', nextAssignee);
      } else {
        url.searchParams.delete('assigned_to');
        url.searchParams.delete('assignee_id');
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
    setSelectedSourceId(searchParams.get('source_id') || searchParams.get('source') || null);
    setSelectedAssigneeId(
      searchParams.get('assigned_to') || searchParams.get('assignee_id') || null
    );
    setSelectedPriority(searchParams.get('priority') || null);
    setSelectedStageId(searchParams.get('stage') || null);
  }, [searchParams]);

  // Derive catalog dropdown options dynamically if not passed directly from server props
  const availableSources = useMemo<FilterDropdownOption[]>(() => {
    if (initialSources && initialSources.length > 0) {
      return initialSources;
    }
    const map = new Map<string, FilterDropdownOption>();
    for (const lead of leads) {
      if (lead.lead_source_id && lead.lead_source_name) {
        map.set(lead.lead_source_id, {
          id: lead.lead_source_id,
          label: lead.lead_source_name,
          colorCode: lead.lead_source_color || '#1f242f',
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [leads, initialSources]);

  const availableAssignees = useMemo<FilterDropdownOption[]>(() => {
    if (initialAssignees && initialAssignees.length > 0) {
      return initialAssignees;
    }
    const map = new Map<string, FilterDropdownOption>();
    for (const lead of leads) {
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
  }, [leads, initialAssignees]);

  // Resolved pipeline stages for inline stage transitions
  const resolvedStatuses = useMemo<InlineStatusOption[]>(() => {
    if (initialStatuses && initialStatuses.length > 0) {
      return initialStatuses;
    }
    const map = new Map<string, InlineStatusOption>();
    for (const lead of leads) {
      if (lead.status_id && lead.status_name) {
        map.set(lead.status_id, {
          id: lead.status_id,
          name: lead.status_name,
          bucket: lead.bucket,
          color_code: lead.status_color || '#1f242f',
        });
      }
    }
    return Array.from(map.values());
  }, [initialStatuses, leads]);

  useEffect(() => {
    const handleOpenStageModal = (e: Event): void => {
      const customEvt = e as CustomEvent<{
        leadId: string;
        targetStatus?: { id: string; name: string; bucket: FunnelBucket };
        targetStatusId?: string;
        targetStageName?: string;
      }>;
      const detail = customEvt.detail;
      if (!detail || !detail.leadId) return;

      let target = detail.targetStatus;
      if (!target && detail.targetStatusId) {
        const match = resolvedStatuses.find((s) => s.id === detail.targetStatusId);
        if (match) {
          target = { id: match.id, name: match.name, bucket: match.bucket };
        }
      }
      if (!target && detail.targetStageName) {
        const match = resolvedStatuses.find(
          (s) => s.name.toLowerCase() === detail.targetStageName?.toLowerCase()
        );
        if (match) {
          target = { id: match.id, name: match.name, bucket: match.bucket };
        }
      }

      if (target) {
        setStageModalState({
          isOpen: true,
          leadId: detail.leadId,
          targetStatus: target,
        });
      }
    };

    window.addEventListener('open-stage-modal', handleOpenStageModal);
    return () => window.removeEventListener('open-stage-modal', handleOpenStageModal);
  }, [resolvedStatuses]);

  // Listener for programmatic open-scheduler-modal events
  useEffect(() => {
    const handleOpenSchedulerModal = (e: Event): void => {
      const customEvt = e as CustomEvent<{
        leadId: string;
        leadName?: string | null;
        company?: string | null;
        currentFollowUpDate?: string | null;
      }>;
      const detail = customEvt.detail;
      if (!detail || !detail.leadId) return;

      const matchedLead = leads.find((l) => l.id === detail.leadId);
      setSchedulerState({
        isOpen: true,
        leadId: detail.leadId,
        leadName: detail.leadName || matchedLead?.name || null,
        company: detail.company || matchedLead?.company || null,
        currentFollowUpDate: detail.currentFollowUpDate || matchedLead?.next_follow_up || null,
      });
    };

    window.addEventListener('open-scheduler-modal', handleOpenSchedulerModal);
    return () => window.removeEventListener('open-scheduler-modal', handleOpenSchedulerModal);
  }, [leads]);

  // Listener for lead-updated custom events to synchronize workspace data grid
  useEffect(() => {
    const handleLeadUpdatedEvent = (e: Event): void => {
      const customEvt = e as CustomEvent<{
        leadId: string;
        field?: string;
        status?: InlineStatusOption;
        nextFollowUp?: string;
        revisitDate?: string;
      }>;
      const detail = customEvt.detail;
      if (!detail || !detail.leadId) return;

      setLeads((prev) =>
        prev.map((l) => {
          if (l.id !== detail.leadId) return l;
          return {
            ...l,
            status_id: detail.status?.id || l.status_id,
            status_name: detail.status?.name || l.status_name,
            status_color: detail.status?.color_code || l.status_color,
            bucket: detail.status?.bucket || l.bucket,
            next_follow_up:
              detail.nextFollowUp !== undefined ? detail.nextFollowUp : l.next_follow_up,
            revisit_date:
              detail.revisitDate !== undefined ? detail.revisitDate : l.revisit_date,
            updated_at: new Date().toISOString(),
          };
        })
      );
    };

    window.addEventListener('lead-updated', handleLeadUpdatedEvent);
    return () => window.removeEventListener('lead-updated', handleLeadUpdatedEvent);
  }, []);

  // Listener for programmatic open-batch-reassign events
  useEffect(() => {
    const handleOpenBatchReassignModal = (): void => {
      setIsBatchReassignOpen(true);
    };

    window.addEventListener('open-batch-reassign', handleOpenBatchReassignModal);
    return () => window.removeEventListener('open-batch-reassign', handleOpenBatchReassignModal);
  }, []);

  // Listener for programmatic open-convert-lead-modal events
  useEffect(() => {
    const handleOpenConvertModal = (e: Event): void => {
      const customEvt = e as CustomEvent<string | { leadId?: string; lead?: LeadForConversion }>;
      const detail = customEvt.detail;
      if (!detail) return;
      const target =
        typeof detail === 'string'
          ? leads.find((l) => l.id === detail)
          : detail.lead || (detail.leadId ? leads.find((l) => l.id === detail.leadId) : undefined);

      if (target) {
        setConvertModalState({
          isOpen: true,
          lead: {
            id: target.id,
            lead_id: target.lead_id,
            name: target.name,
            company: target.company,
            service_category: target.service_category,
            expected_value: target.expected_value,
            assigned_to: target.assigned_to,
            priority: target.priority,
          },
        });
      }
    };

    window.addEventListener('open-convert-lead-modal', handleOpenConvertModal);
    return () => window.removeEventListener('open-convert-lead-modal', handleOpenConvertModal);
  }, [leads]);


  // Memoized overdue lead summaries for batch reassign modal
  const overdueSummaries = useMemo<OverdueLeadSummary[]>(() => {
    return leads
      .filter(isLeadOverdue)
      .map((l) => {
        const tierCalc = calculateOverdueTier(l.next_follow_up, {
          bucket: l.bucket,
          statusName: l.status_name,
          revisitDate: l.revisit_date,
        });
        return {
          id: l.id,
          leadId: l.lead_id,
          name: l.name,
          company: l.company || 'Private Client',
          expectedValue: l.expected_value,
          priority: l.priority,
          nextFollowUp: l.next_follow_up || '',
          statusName: l.status_name,
          currentAssigneeId: l.assigned_to || null,
          currentAssigneeName: l.assigned_to_name || 'Unassigned',
          tier: tierCalc.tier,
          overdueLabel: tierCalc.label,
        };
      });
  }, [leads]);

  // Memoized representative list for destination selection in batch reassignment
  const availableRepsForModal = useMemo(() => {
    return (availableAssignees || [])
      .filter((a) => a.id && a.id !== 'all')
      .map((a) => ({
        id: a.id,
        fullName: a.label,
        role: 'Sales Representative',
        email: '',
      }));
  }, [availableAssignees]);

  const handleBatchReassignSuccess = (
    _count: number,
    destinationName: string,
    leadIds?: string[],
    destinationUserId?: string
  ): void => {
    setIsBatchReassignOpen(false);
    if (leadIds && destinationUserId && leadIds.length > 0) {
      setLeads((prev) =>
        prev.map((l) =>
          leadIds.includes(l.id)
            ? { ...l, assigned_to: destinationUserId, assigned_to_name: destinationName }
            : l
        )
      );
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('popstate'));
    }
  };

  // Real-time record counts per bucket
  const counts = useMemo<BucketCounts>(() => {
    return {
      all: leads.length,
      open: leads.filter((l) => l.bucket === 'open').length,
      potential: leads.filter((l) => l.bucket === 'potential').length,
      converted: leads.filter((l) => l.bucket === 'converted').length,
      lost: leads.filter((l) => l.bucket === 'lost').length,
      overdue: leads.filter(isLeadOverdue).length,
    };
  }, [leads]);

  // In-memory filtered leads with multi-dimensional criteria evaluation
  const filteredLeads = useMemo<HydratedLeadItem[]>(() => {
    const q = searchQuery.toLowerCase().trim();

    return leads.filter((lead) => {
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
    leads,
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

  // Optimistic handler for inline status changes
  const handleInlineStatusChange = useCallback(
    (leadId: string, newStatus: InlineStatusOption): void => {
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                status_id: newStatus.id,
                status_name: newStatus.name,
                status_color: newStatus.color_code,
                bucket: newStatus.bucket,
              }
            : lead
        )
      );
    },
    []
  );

  // Optimistic handler for inline priority changes
  const handleInlinePriorityChange = useCallback(
    (leadId: string, newPriority: LeadPriority): void => {
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                priority: newPriority,
              }
            : lead
        )
      );
    },
    []
  );

  // Handler for confirmed guarded stage transition (Negotiation, Lost, Converted)
  const handleStageTransitionSuccess = useCallback(
    (payload: GuardedTransitionResultPayload): void => {
      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== payload.leadId) return lead;
          return {
            ...lead,
            status_id: payload.newStatusId,
            status_name: payload.newStatusName,
            bucket: payload.bucket,
            expected_value:
              payload.expectedValue !== undefined ? payload.expectedValue : lead.expected_value,
            revisit_date:
              payload.revisitDate !== undefined ? payload.revisitDate : lead.revisit_date,
            next_follow_up:
              payload.nextFollowUp !== undefined ? payload.nextFollowUp : lead.next_follow_up,
            updated_at: payload.updatedAt || new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  // Handler for scheduled precision follow-up touchpoint
  const handleFollowUpScheduled = useCallback(
    (leadId: string, nextFollowUp: string): void => {
      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== leadId) return lead;
          return {
            ...lead,
            next_follow_up: nextFollowUp,
            updated_at: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  return (
    <>
      {/* High-Performance Multi-Filter Action Bar */}
      <FilterActionBar
        scope="leads"
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

      {/* Overdue Stalled Pipeline Escalation Banner */}
      {selectedBucket === 'overdue' && counts.overdue > 0 && (
        <div className={styles.overdueNoticeBanner} role="region" aria-label="Overdue SLA Alert">
          <div className={styles.overdueNoticeLeft}>
            <div className={styles.overdueNoticeIcon} aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className={styles.overdueNoticeTitle}>
                {counts.overdue} Overdue {counts.overdue === 1 ? 'Touchpoint' : 'Touchpoints'} Requiring Escalation
              </p>
              <p className={styles.overdueNoticeSub}>
                Reallocate stalled accounts across active sales personnel to restore pipeline velocity.
              </p>
            </div>
          </div>
          {userRole !== 'viewer' && (
            <button
              type="button"
              className={styles.batchReassignTriggerBtn}
              onClick={() => setIsBatchReassignOpen(true)}
              aria-label="Launch batch reassignment modal"
            >
              Batch Reassign Overdue Leads
            </button>
          )}
        </div>
      )}

      {/* Inbound Speed-to-Lead Triage Banner */}
      {selectedBucket === 'open' && counts.open > 0 && (
        <div className={styles.inboundTriageBanner} role="region" aria-label="Inbound Discovery Triage">
          <div className={styles.overdueNoticeLeft}>
            <div className={styles.inboundTriageIcon} aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <p className={styles.overdueNoticeTitle}>
                {counts.open} Inbound {counts.open === 1 ? 'Inquiry' : 'Inquiries'} in Speed-to-Lead Triage
              </p>
              <p className={styles.overdueNoticeSub}>
                Qualify incoming briefs and convert high-intent prospective engagements into active pipeline deals.
              </p>
            </div>
          </div>
          {filteredLeads.length > 0 && userRole !== 'viewer' && (
            <button
              type="button"
              className={styles.convertTriggerBtn}
              onClick={() => {
                const target = filteredLeads.find((l) => l.bucket === 'open') || filteredLeads[0];
                if (target) {
                  setConvertModalState({
                    isOpen: true,
                    lead: {
                      id: target.id,
                      lead_id: target.lead_id,
                      name: target.name,
                      company: target.company,
                      service_category: target.service_category,
                      expected_value: target.expected_value,
                      assigned_to: target.assigned_to,
                      priority: target.priority,
                    },
                  });
                }
              }}
              aria-label="Convert lead to pipeline deal"
            >
              1-Click Convert to Deal
            </button>
          )}
        </div>
      )}

      {/* Commercial Leads Virtualized Data Grid */}
      <LeadsDataGrid
        leads={filteredLeads}
        availableStatuses={resolvedStatuses}
        onStatusChange={handleInlineStatusChange}
        onPriorityChange={handleInlinePriorityChange}
        userRole={userRole}
      />

      {/* Slide-over Client 360 Degree Dossier Drawer */}
      <ClientDossierDrawer
        leadId={activeDrawerLeadId}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onLeadUpdated={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('popstate'));
          }
        }}
      />

      {/* Guarded Pipeline Stage Transition Modal (Negotiation, Lost, Converted, On Hold) */}
      {stageModalState.isOpen && stageModalState.leadId && stageModalState.targetStatus && (
        <StageTransitionModal
          isOpen={stageModalState.isOpen}
          onClose={() =>
            setStageModalState({ isOpen: false, leadId: null, targetStatus: null })
          }
          leadId={stageModalState.leadId}
          targetStatus={stageModalState.targetStatus}
          dealIdCode={leads.find((l) => l.id === stageModalState.leadId)?.lead_id}
          dealName={
            leads.find((l) => l.id === stageModalState.leadId)?.company ||
            leads.find((l) => l.id === stageModalState.leadId)?.name
          }
          currentExpectedValue={
            leads.find((l) => l.id === stageModalState.leadId)?.expected_value
          }
          onSuccess={handleStageTransitionSuccess}
        />
      )}

      {/* Precision Follow-up Date-Time Scheduler Modal */}
      {schedulerState.isOpen && schedulerState.leadId && (
        <FollowUpScheduler
          isOpen={schedulerState.isOpen}
          leadId={schedulerState.leadId}
          leadName={schedulerState.leadName}
          company={schedulerState.company}
          currentFollowUpDate={schedulerState.currentFollowUpDate}
          onClose={() =>
            setSchedulerState({
              isOpen: false,
              leadId: null,
              leadName: null,
              company: null,
              currentFollowUpDate: null,
            })
          }
          onSuccess={(scheduledIso: string) => {
            if (schedulerState.leadId) {
              handleFollowUpScheduled(schedulerState.leadId, scheduledIso);
            }
          }}
        />
      )}

      {/* Guarded Batch Lead Reassignment Modal */}
      {isBatchReassignOpen && (
        <BatchReassignModal
          isOpen={isBatchReassignOpen}
          overdueLeads={overdueSummaries}
          availableReps={availableRepsForModal}
          onClose={() => setIsBatchReassignOpen(false)}
          onSuccess={handleBatchReassignSuccess}
        />
      )}

      {/* 1-Click Inbound Lead Conversion Modal */}
      {convertModalState.isOpen && convertModalState.lead && (
        <ConvertLeadToDealModal
          isOpen={convertModalState.isOpen}
          lead={convertModalState.lead}
          availableAssignees={availableAssignees}
          availableStatuses={resolvedStatuses}
          onClose={() => setConvertModalState({ isOpen: false, lead: null })}
          onSuccess={(_convertedId) => {
            setConvertModalState({ isOpen: false, lead: null });
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('popstate'));
            }
          }}
        />
      )}
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
