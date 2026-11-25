'use client';

/**
 * @file LeadsWorkspaceClient.tsx
 * @description Interactive Client Component for the Deals & Inquiries Workspace (/admin/leads).
 *              Integrates the QuickMetricsRibbon telemetry summary, FilterActionBar, virtualized
 *              LeadsDataGrid with TanStack Virtual, FloatingBatchActionBar, in-context Client 360 Drawer,
 *              batch status transition dialog, batch reassignment wizard, and keyboard hotkeys (J/K/X/Enter/Esc).
 * @module app/admin/(workspace)/leads/LeadsWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useMemo, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { FunnelBucket } from '@/types/crm';
import {
  FilterActionBar,
  type BucketTabId,
  type BucketCounts,
  type FilterDropdownOption,
} from '@/app/admin/components/FilterActionBar';
import {
  LeadsDataGrid,
  FloatingBatchActionBar,
  type InlineStatusOption,
} from '@/app/admin/components/LeadsTable';
import { QuickMetricsRibbon } from './components/QuickMetricsRibbon/QuickMetricsRibbon';
import { StageTransitionModal } from '@/app/admin/components/modals/StageTransitionModal';
import {
  BatchReassignModal,
  BatchStageModal,
  ConvertLeadToDealModal,
  type LeadForConversion,
} from '@/app/admin/components/modals';
import { FollowUpScheduler } from '@/app/admin/components/Scheduler';
import { calculateOverdueTier } from '@/app/admin/components/Badges';
import { exportLeadsCsvAction } from '@/app/actions/batchLeads';
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
  pagination?: React.ReactNode;
  lookupNotice?: string;
  availableSources?: FilterDropdownOption[];
  availableAssignees?: FilterDropdownOption[];
  availableStatuses?: InlineStatusOption[];
  userRole?: string;
  telemetryMetrics?: {
    totalInquiries: number;
    activeTriageCount: number;
    overdueCount: number;
    totalPipelineValue: number;
  };
  globalBucketCounts?: BucketCounts;
  canViewFinancials?: boolean;
}

const VALID_BUCKETS: BucketTabId[] = ['all', 'open', 'potential', 'converted', 'lost', 'overdue'];

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
  pagination,
  lookupNotice,
  availableSources: initialSources,
  availableAssignees: initialAssignees,
  availableStatuses: initialStatuses,
  userRole = 'viewer',
  telemetryMetrics,
  globalBucketCounts,
  canViewFinancials = true,
}: LeadsWorkspaceClientProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Listen for manual lead creations to refresh workspace data
  useEffect(() => {
    const handleLeadCreated = () => {
      router.refresh();
    };
    window.addEventListener('lead-created', handleLeadCreated);
    return () => window.removeEventListener('lead-created', handleLeadCreated);
  }, [router]);

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



  const initialBucket: BucketTabId = VALID_BUCKETS.includes(bucketParam as BucketTabId)
    ? (bucketParam as BucketTabId)
    : 'all';

  const [selectedBucket, setSelectedBucket] = useState<BucketTabId>(initialBucket);
  const [searchQuery, setSearchQuery] = useState<string>(searchParam);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(sourceParam);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(assigneeParam);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(priorityParam);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(stageParam);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestedQueryRef = useRef<string | null>(null);



  // Multi-select batch operations state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
  const [isBatchStageModalOpen, setIsBatchStageModalOpen] = useState<boolean>(false);
  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);

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



  /**
   * Shallow URL Synchronizer: writes active filter state into window.history in < 16ms
   * without triggering a Next.js server component re-render or layout jitter.
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

      url.searchParams.delete('page');
      const nextSearchString = url.search ? url.search.slice(1) : '';
      requestedQueryRef.current = nextSearchString;
      router.replace(url.pathname + (url.search ? url.search : ''), { scroll: false });
    },
    [
      selectedBucket,
      searchQuery,
      selectedSourceId,
      selectedAssigneeId,
      selectedPriority,
      selectedStageId,
      router,
    ]
  );

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Sync state if URL changes externally without clobbering active typing
  useEffect(() => {
    const currentParamsString = searchParams.toString();
    if (requestedQueryRef.current === currentParamsString) {
      requestedQueryRef.current = null;
    }

    const rawBucket = searchParams.get('bucket');
    if (VALID_BUCKETS.includes(rawBucket as BucketTabId)) {
      setSelectedBucket(rawBucket as BucketTabId);
    } else {
      setSelectedBucket('all');
    }

    if (!searchDebounceRef.current && requestedQueryRef.current === null) {
      setSearchQuery(searchParams.get('search') || searchParams.get('q') || '');
    }
    setSelectedSourceId(searchParams.get('source_id') || searchParams.get('source') || null);
    setSelectedAssigneeId(
      searchParams.get('assigned_to') || searchParams.get('assignee_id') || null
    );
    setSelectedPriority(searchParams.get('priority') || null);
    setSelectedStageId(searchParams.get('stage') || null);
  }, [searchParams]);

  // Available sources list
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
          colorCode: lead.lead_source_color || '#111111',
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [leads, initialSources]);

  // Available assignees list
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
          color_code: lead.status_color || '#111111',
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

  // Programmatic open-scheduler-modal listener
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

  // Lead-updated custom events listener
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

  // Programmatic open-batch-reassign listener
  useEffect(() => {
    const handleOpenBatchReassignModal = (): void => {
      setIsBatchReassignOpen(true);
    };

    window.addEventListener('open-batch-reassign', handleOpenBatchReassignModal);
    return () => window.removeEventListener('open-batch-reassign', handleOpenBatchReassignModal);
  }, []);

  // Programmatic open-convert-lead-modal listener
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

  // Candidate summaries for batch reassignment: prioritizes user selections, falling back to overdue queue
  const selectedOrOverdueSummaries = useMemo<OverdueLeadSummary[]>(() => {
    if (selectedLeadIds.size > 0) {
      return leads
        .filter((l) => selectedLeadIds.has(l.id))
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
    }
    return overdueSummaries;
  }, [leads, selectedLeadIds, overdueSummaries]);

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
    setSelectedLeadIds(new Set());
    if (typeof window !== 'undefined') {
      router.refresh();
    }
  };

  // Use exact server-computed workspace bucket counts whenever available
  const counts = useMemo<BucketCounts>(() => {
    if (globalBucketCounts) return globalBucketCounts;
    return {
      all: leads.length,
      open: leads.filter((l) => l.bucket === 'open').length,
      potential: leads.filter((l) => l.bucket === 'potential').length,
      converted: leads.filter((l) => l.bucket === 'converted').length,
      lost: leads.filter((l) => l.bucket === 'lost').length,
      overdue: leads.filter(isLeadOverdue).length,
    };
  }, [globalBucketCounts, leads]);

  // Quick Telemetry KPIs for the header ribbon
  const quickTelemetry = useMemo(() => {
    if (telemetryMetrics) return telemetryMetrics;
    const activeTriageCount = leads.filter(
      (l) => l.bucket === 'open' || l.bucket === 'potential'
    ).length;
    const overdueCount = leads.filter(isLeadOverdue).length;
    const totalPipelineValue = leads
      .filter((l) => l.bucket === 'open' || l.bucket === 'potential')
      .reduce((sum, l) => sum + (l.expected_value || 0), 0);
    return {
      totalInquiries: leads.length,
      activeTriageCount,
      overdueCount,
      totalPipelineValue,
    };
  }, [telemetryMetrics, leads]);

  // In-memory filtered leads with multi-dimensional criteria evaluation
  const filteredLeads = useMemo<HydratedLeadItem[]>(() => {
    return leads.filter((lead) => {
      if (selectedBucket === 'overdue') {
        if (!isLeadOverdue(lead)) return false;
      } else if (selectedBucket !== 'all') {
        if (lead.bucket !== selectedBucket) return false;
      }

      if (selectedStageId && lead.status_id !== selectedStageId) {
        return false;
      }

      if (selectedSourceId && lead.lead_source_id !== selectedSourceId) {
        return false;
      }

      if (selectedAssigneeId && lead.assigned_to !== selectedAssigneeId) {
        return false;
      }

      if (selectedPriority && lead.priority.toLowerCase() !== selectedPriority.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [
    leads,
    selectedBucket,
    selectedSourceId,
    selectedAssigneeId,
    selectedPriority,
    selectedStageId,
  ]);

  // Batch Selection Callbacks
  const handleToggleSelect = useCallback((leadId: string): void => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((): void => {
    setSelectedLeadIds((prev) => {
      if (prev.size === filteredLeads.length) {
        return new Set();
      }
      return new Set(filteredLeads.map((l) => l.id));
    });
  }, [filteredLeads]);

  const handleClearSelection = useCallback((): void => {
    setSelectedLeadIds(new Set());
  }, []);

  // Batch Stage Advancement Callback
  const handleBatchStageSuccess = useCallback(
    (_affectedCount: number, targetStatusName: string, statusId: string): void => {
      const targetOption = resolvedStatuses.find((s) => s.id === statusId);
      setLeads((prev) =>
        prev.map((l) => {
          if (!selectedLeadIds.has(l.id)) return l;
          return {
            ...l,
            status_id: statusId,
            status_name: targetStatusName,
            status_color: targetOption?.color_code || l.status_color,
            bucket: targetOption?.bucket || l.bucket,
            updated_at: new Date().toISOString(),
          };
        })
      );
      setSelectedLeadIds(new Set());
      if (typeof window !== 'undefined') {
        router.refresh();
      }
    },
    [resolvedStatuses, selectedLeadIds, router]
  );

  // Batch CSV Export Callback
  const handleBatchExportCsv = useCallback(async (): Promise<void> => {
    if (selectedLeadIds.size === 0) return;
    setIsExportingCsv(true);
    try {
      const result = await exportLeadsCsvAction({
        leadIds: Array.from(selectedLeadIds),
      });

      if (result.success && result.data) {
        const blob = new Blob([result.data.csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', result.data.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('crm-toast', {
            detail: {
              type: 'error',
              title: 'Export Failed',
              description: result.error || 'Failed to export selected leads.',
            },
          })
        );
      }
    } catch (err: unknown) {
      console.error('[leads-workspace] CSV export error:', err);
    } finally {
      setIsExportingCsv(false);
    }
  }, [selectedLeadIds]);

  // Keyboard navigation shortcuts: J/K to traverse rows, X to select, Enter to open drawer, Esc to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.min(prev + 1, filteredLeads.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'x' || e.key === ' ') {
        if (focusedRowIndex >= 0 && focusedRowIndex < filteredLeads.length) {
          e.preventDefault();
          handleToggleSelect(filteredLeads[focusedRowIndex].id);
        }
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]'
        );
        if (searchInput) {
          searchInput.focus();
        }
      } else if (e.key === 'Enter') {
        if (focusedRowIndex >= 0 && focusedRowIndex < filteredLeads.length) {
          e.preventDefault();
          router.push(`/admin/leads/${filteredLeads[focusedRowIndex].id}`);
        }
      } else if (e.key === 'Escape') {
        if (selectedLeadIds.size > 0) {
          e.preventDefault();
          handleClearSelection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    filteredLeads,
    focusedRowIndex,
    handleToggleSelect,
    router,
    selectedLeadIds.size,
    handleClearSelection,
  ]);

  // Action handlers updating local state and URL parameters
  const handleBucketChange = (bucket: BucketTabId): void => {
    setSelectedBucket(bucket);
    updateUrlParams({ bucket });
  };

  const handleSearchChange = (query: string): void => {
    setSearchQuery(query);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      updateUrlParams({ search: query });
    }, 300);
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

  const conversionCandidate =
    selectedBucket === 'open' && userRole !== 'viewer'
      ? filteredLeads.find((lead) => lead.bucket === 'open')
      : undefined;

  return (
    <section className={styles.inboxWorkspace} aria-label="Lead inbox">
      {/* Editorial Luxury Quick Telemetry Ribbon */}
      <QuickMetricsRibbon
        totalInquiries={quickTelemetry.totalInquiries}
        activeTriageCount={quickTelemetry.activeTriageCount}
        overdueCount={quickTelemetry.overdueCount}
        totalPipelineValue={quickTelemetry.totalPipelineValue}
        canViewFinancials={canViewFinancials}
      />

      <div className={styles.inboxControls}>
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
      </div>

      {lookupNotice && (
        <div className={styles.lookupNotice}>
          <span role="status">{lookupNotice}</span>
          <button type="button" onClick={() => router.refresh()}>
            Retry
          </button>
        </div>
      )}

      {selectedBucket === 'overdue' && counts.overdue > 0 && userRole !== 'viewer' && (
        <div className={styles.queueAction}>
          <span>Batch actions apply to overdue leads on this page.</span>
          <button
            type="button"
            className={styles.batchReassignTriggerBtn}
            onClick={() => setIsBatchReassignOpen(true)}
          >
            Reassign overdue leads
          </button>
        </div>
      )}

      {conversionCandidate && (
        <div className={styles.queueAction}>
          <span>{conversionCandidate.name}</span>
          <button
            type="button"
            className={styles.convertTriggerBtn}
            onClick={() => setConvertModalState({ isOpen: true, lead: conversionCandidate })}
          >
            Convert to deal
          </button>
        </div>
      )}

      {/* Commercial Leads Virtualized Data Grid */}
      <div className={styles.inboxRecords}>
        {filteredLeads.length !== counts.all && (
          <div className={styles.inboxRecordsHeading} role="status">
            {filteredLeads.length.toLocaleString('en-IN')} matching on this page
          </div>
        )}
        <LeadsDataGrid
          className={styles.queueGrid}
          leads={filteredLeads}
          availableStatuses={resolvedStatuses}
          selectedLeadIds={selectedLeadIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          focusedRowIndex={focusedRowIndex}
          onStatusChange={handleInlineStatusChange}
          onPriorityChange={handleInlinePriorityChange}
          availableAssignees={availableAssignees}
          canViewFinancials={canViewFinancials}
          onAssigneeChange={(leadId, newAssigneeId, newAssigneeName) => {
            setLeads((prev) =>
              prev.map((l) =>
                l.id === leadId
                  ? { ...l, assigned_to: newAssigneeId, assigned_to_name: newAssigneeName }
                  : l
              )
            );
            router.refresh();
          }}
          userRole={userRole}
        />
      </div>

      {pagination && <div className={styles.queueFooter}>{pagination}</div>}

      {/* Fixed Floating Batch Operations Dock */}
      <FloatingBatchActionBar
        selectedCount={selectedLeadIds.size}
        onTransitionStage={() => setIsBatchStageModalOpen(true)}
        onReassign={() => setIsBatchReassignOpen(true)}
        onExportCsv={handleBatchExportCsv}
        onClear={handleClearSelection}
        isExporting={isExportingCsv}
      />

      {/* Batch Stage Advancement Modal */}
      <BatchStageModal
        isOpen={isBatchStageModalOpen}
        selectedLeadIds={Array.from(selectedLeadIds)}
        availableStatuses={resolvedStatuses}
        onClose={() => setIsBatchStageModalOpen(false)}
        onSuccess={handleBatchStageSuccess}
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
          overdueLeads={selectedOrOverdueSummaries}
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
          onSuccess={() => {
            setConvertModalState({ isOpen: false, lead: null });
            if (typeof window !== 'undefined') {
              router.refresh();
            }
          }}
        />
      )}
    </section>
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
