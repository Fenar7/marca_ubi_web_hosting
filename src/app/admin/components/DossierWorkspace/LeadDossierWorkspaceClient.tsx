'use client';

/**
 * @file LeadDossierWorkspaceClient.tsx
 * @description Master interactive Client 360° Lead/Deal Dossier Workspace client component.
 *              Integrates:
 *              - 7:5 asymmetric operational grid (desktop) collapsing to a fluid stack (< 768px).
 *              - Accordion Executive Advisory × Sypher Minimalist Light SaaS Architecture.
 *              - Anti-glare light canvas (var(--admin-canvas-bg)) and crisp pure white cards.
 *              - Real-time commercial KPI ribbon (Expected Valuation, Priority SLA, Win Probability).
 *              - Zero-truncation contact coordinates with RFC 3966 tel: and WhatsApp wa.me deep links.
 *              - Notion-callout aesthetic for Original Ingestion Briefs and Executive Deal Notes.
 *              - Sticky rapid touchpoint composer with single-line 5-column duration buttons.
 *              - Omnichannel immutable activity timeline with @mention and #tag token parsing.
 *              - Modals: Edit Scope, Precision Follow-Up Scheduler, Convert to Deal, and Guarded Stage Transitions.
 *              - Mobile sticky bottom action dock with 44px tap targets.
 * @module components/DossierWorkspace/LeadDossierWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type {
  LeadWithRelations,
  LeadActivityWithActor,
  FunnelStatus,
  CrmUserRole,
  FunnelBucket,
  LeadActivityType,
  LeadDetailPayload,
} from '@/types/crm';
import type { LeadDossierData } from '../DossierDrawer/ClientDossierDrawer';
import {
  sanitizeTelUri,
  createWhatsAppUri,
  getDossierInitials,
  formatRelativeTime,
  formatCallDuration,
  parseMentionsAndTags,
  formatAuditDeltaNarrative,
} from '../DossierDrawer/dossierUtils';
import { updateLeadStatusInlineAction } from '@/app/actions/leadInlineActions';
import { updateLeadAssignee } from '@/app/actions/leads';
import { DossierHeaderBar } from './DossierHeaderBar';
import { CommercialKpiRibbon } from './CommercialKpiRibbon';
import { IngestionBriefMatrix } from './IngestionBriefMatrix';
import { RapidTouchpointComposer } from './RapidTouchpointComposer';
import { EditLeadModal, ConvertLeadToDealModal } from '@/app/admin/components/modals';
import { FollowUpScheduler } from '@/app/admin/components/Scheduler';
import { StageTransitionModal } from '@/app/admin/components/modals/StageTransitionModal';
import styles from './LeadDossierWorkspace.module.scss';

export interface LeadDossierWorkspaceClientProps {
  /** Commercial inquiry or qualified deal record */
  lead: LeadDossierData | LeadWithRelations;
  /** Initial chronological activity ledger entries */
  initialActivities: LeadActivityWithActor[];
  /** Pipeline funnel stages catalog */
  funnelStatuses: FunnelStatus[];
  /** Active commercial personnel available for assignment */
  teamAssignees: Array<{ id: string; full_name: string; email?: string; role?: string }>;
  /** Current authenticated operator commercial role */
  userRole: CrmUserRole;
  /** Active workspace operational mode */
  workspaceMode: 'leads' | 'deals';
  /** Auto-spawned post-conversion Client Work project summary when converted */
  linkedWork?: LeadDetailPayload['linkedWork'];
  /** Whether caller holds permission to inspect commercial valuations */
  canViewFinancials?: boolean;
}

/**
 * Normalizes input lead data into a uniform LeadDossierData interface.
 * Guarantees zero missing properties whether the caller passed a database relation or drawer record.
 */
function normalizeToDossier(
  input: LeadDossierData | LeadWithRelations,
  statuses: FunnelStatus[],
  assignees: Array<{ id: string; full_name: string; email?: string }>
): LeadDossierData {
  if ('status_name' in input && typeof input.status_name === 'string') {
    return input as LeadDossierData;
  }

  const raw = input as LeadWithRelations;
  const matchedStatus =
    raw.status ||
    statuses.find((s) => s.id === raw.status_id) || {
      id: raw.status_id,
      name: 'Inbound Inquiry',
      bucket: 'open' as FunnelBucket,
      color_code: 'var(--admin-status-amber-dot, #f59e0b)',
      sort_order: 1,
      is_active: true,
      created_at: raw.created_at,
    };

  const matchedAssignee =
    raw.assignee || assignees.find((a) => a.id === raw.assigned_to);

  return {
    id: raw.id,
    lead_id: raw.lead_id,
    name: raw.name,
    company: raw.company,
    company_website: raw.company_website,
    industry: raw.industry,
    phone: raw.phone,
    email: raw.email,
    preferred_channel: raw.preferred_channel || 'Phone',
    service_category: raw.service_category || 'Web & Digital',
    budget_bracket: raw.budget_bracket,
    priority: raw.priority || 'Medium',
    status_id: raw.status_id,
    status_name: matchedStatus.name,
    status_color: matchedStatus.color_code,
    bucket: matchedStatus.bucket,
    assigned_to: raw.assigned_to,
    assigned_to_name: matchedAssignee?.full_name || null,
    assigned_to_email: matchedAssignee?.email || null,
    expected_value: raw.expected_value || 0,
    next_follow_up: raw.next_follow_up,
    lost_reason: raw.lost_reason,
    revisit_date: raw.revisit_date,
    notes: raw.notes,
    brief_payload: raw.brief_payload || null,
    inquiry_count: raw.inquiry_count || 1,
    created_at: raw.created_at,
    converted_at: raw.converted_at,
    updated_at: raw.updated_at,
  };
}

/**
 * Returns glyph element corresponding to omnichannel activity classification.
 */
function renderTimelineGlyph(type: LeadActivityType): React.ReactElement {
  switch (type) {
    case 'call_logged':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case 'whatsapp_sent':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
    case 'email_sent':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      );
    case 'meeting_notes':
    case 'meeting_held':
    case 'follow_up_scheduled':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'status_change':
    case 'priority_change':
    case 'reassignment':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'system_event':
    case 'field_update':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'note_added':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
  }
}

interface SingleTimelineItem {
  kind: 'single';
  activity: LeadActivityWithActor;
  narrative: string;
  isSystemInternal: boolean;
  deltaPills: string[];
}

interface GroupedSystemCluster {
  kind: 'system_group';
  id: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  created_at: string;
  events: Array<{
    activity: LeadActivityWithActor;
    narrative: string;
    deltaPills: string[];
  }>;
}

type TimelineDisplayItem = SingleTimelineItem | GroupedSystemCluster;

function isAutomatedSystemEvent(act: LeadActivityWithActor): boolean {
  if (act.activity_type === 'system_event') return true;
  if (act.description === 'Automated system update' || act.description === 'System telemetry cadence verified') return true;
  if (!act.actor_id && (act.activity_type === 'field_update' || act.actor_name?.toLowerCase().includes('system'))) {
    return true;
  }
  return false;
}

export function LeadDossierWorkspaceClient({
  lead: initialLeadInput,
  initialActivities,
  funnelStatuses,
  teamAssignees,
  userRole,
  workspaceMode,
  linkedWork = null,
  canViewFinancials = true,
}: LeadDossierWorkspaceClientProps): React.ReactElement {
  const router = useRouter();
  // 1. Normalized State Model synced cleanly when server props refresh
  const [prevInitialLeadInput, setPrevInitialLeadInput] = useState(initialLeadInput);
  const [currentLead, setCurrentLead] = useState<LeadDossierData>(() =>
    normalizeToDossier(initialLeadInput, funnelStatuses, teamAssignees)
  );
  if (initialLeadInput !== prevInitialLeadInput) {
    setPrevInitialLeadInput(initialLeadInput);
    setCurrentLead(normalizeToDossier(initialLeadInput, funnelStatuses, teamAssignees));
  }

  const [prevLinkedWork, setPrevLinkedWork] = useState<LeadDetailPayload['linkedWork']>(linkedWork);
  const [currentLinkedWork, setCurrentLinkedWork] = useState<LeadDetailPayload['linkedWork']>(linkedWork);
  if (linkedWork !== prevLinkedWork) {
    setPrevLinkedWork(linkedWork);
    setCurrentLinkedWork(linkedWork);
  }

  const [prevInitialActivities, setPrevInitialActivities] = useState<LeadActivityWithActor[]>(initialActivities);
  const [activities, setActivities] = useState<LeadActivityWithActor[]>(initialActivities);
  if (initialActivities !== prevInitialActivities) {
    setPrevInitialActivities(initialActivities);
    setActivities(initialActivities);
  }

  const [isPending, startTransition] = useTransition();
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);

  // 2. Modal Presentation Controllers
  const [isEditScopeOpen, setIsEditScopeOpen] = useState<boolean>(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState<boolean>(false);
  const [isConvertToDealOpen, setIsConvertToDealOpen] = useState<boolean>(false);
  const [isGuardedTransitionOpen, setIsGuardedTransitionOpen] = useState<boolean>(false);
  const [guardedTargetStatus, setGuardedTargetStatus] = useState<FunnelStatus | null>(null);

  // Synchronize dynamic lead reference code (e.g. 'LD-10343') with top shell breadcrumbs
  useEffect(() => {
    if (typeof window !== 'undefined' && currentLead.lead_id) {
      window.dispatchEvent(
        new CustomEvent('admin-breadcrumb-label-update', {
          detail: {
            path: window.location.pathname,
            label: currentLead.lead_id,
          },
        })
      );
    }
  }, [currentLead.lead_id]);

  // 3. Computed Coordinates & Telephony Links
  const telUri = useMemo(() => sanitizeTelUri(currentLead.phone), [currentLead.phone]);
  const whatsAppUri = useMemo(
    () => createWhatsAppUri(currentLead.phone, currentLead.lead_id, currentLead.name),
    [currentLead.phone, currentLead.lead_id, currentLead.name]
  );

  const websiteUrl = useMemo(() => {
    const raw = currentLead.company_website?.trim();
    if (!raw) return null;
    return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  }, [currentLead.company_website]);

  const currentStatusObject = useMemo(() => {
    return (
      funnelStatuses.find((s) => s.id === currentLead.status_id) || {
        id: currentLead.status_id,
        name: currentLead.status_name,
        bucket: currentLead.bucket,
        color_code: currentLead.status_color,
        sort_order: 1,
        is_active: true,
        created_at: currentLead.created_at,
      }
    );
  }, [funnelStatuses, currentLead.status_id, currentLead.status_name, currentLead.bucket, currentLead.status_color, currentLead.created_at]);

  const isConverted = currentLead.bucket === 'converted' || Boolean(currentLead.converted_at);

  // Expanded state map for consecutive automated system event drawers
  const [expandedGroupIds, setExpandedGroupIds] = useState<Record<string, boolean>>({});

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroupIds((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  // Living Delta Decoder & System Event Grouping Engine
  const timelineItems: TimelineDisplayItem[] = useMemo(() => {
    const result: TimelineDisplayItem[] = [];
    let currentSystemCluster: LeadActivityWithActor[] = [];

    const flushCluster = () => {
      if (currentSystemCluster.length === 0) return;

      if (currentSystemCluster.length === 1) {
        const act = currentSystemCluster[0];
        const decoded = formatAuditDeltaNarrative(
          act.description,
          act.metadata as { changes?: Record<string, { old: unknown; new: unknown }> },
          funnelStatuses,
          teamAssignees
        );
        result.push({
          kind: 'single',
          activity: act,
          narrative: decoded.narrative,
          isSystemInternal: decoded.isSystemInternal,
          deltaPills: decoded.deltaPills,
        });
      } else {
        const count = currentSystemCluster.length;
        const latestEvent = currentSystemCluster[0];
        const eventDate = new Date(latestEvent.created_at);
        const dateLabel = isNaN(eventDate.getTime())
          ? 'Recent'
          : eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const decodedEvents = currentSystemCluster.map((act) => {
          const decoded = formatAuditDeltaNarrative(
            act.description,
            act.metadata as { changes?: Record<string, { old: unknown; new: unknown }> },
            funnelStatuses,
            teamAssignees
          );
          return {
            activity: act,
            narrative: decoded.narrative,
            deltaPills: decoded.deltaPills,
          };
        });

        const uniquePills = Array.from(new Set(decodedEvents.flatMap((e) => e.deltaPills)));
        const subtitle =
          uniquePills.length > 0
            ? `Fields: ${uniquePills.slice(0, 3).join(', ')}${uniquePills.length > 3 ? ` +${uniquePills.length - 3} more` : ''}`
            : 'Automated background audit trace';

        result.push({
          kind: 'system_group',
          id: `sys-group-${latestEvent.id}`,
          title: `${count} automated field updates on ${dateLabel}`,
          subtitle,
          dateLabel,
          created_at: latestEvent.created_at,
          events: decodedEvents,
        });
      }
      currentSystemCluster = [];
    };

    for (const act of activities) {
      if (isAutomatedSystemEvent(act)) {
        currentSystemCluster.push(act);
      } else {
        flushCluster();
        const decoded = formatAuditDeltaNarrative(
          act.description,
          act.metadata as { changes?: Record<string, { old: unknown; new: unknown }> },
          funnelStatuses,
          teamAssignees
        );
        result.push({
          kind: 'single',
          activity: act,
          narrative: decoded.narrative,
          isSystemInternal: decoded.isSystemInternal,
          deltaPills: decoded.deltaPills,
        });
      }
    }

    flushCluster();
    return result;
  }, [activities, funnelStatuses, teamAssignees]);

  // Handlers: Activity Logging & Optimistic State Updates

  const handleActivityLogged = useCallback((newActivity: LeadActivityWithActor) => {
    setActivities((prev) => [newActivity, ...prev]);
    router.refresh();
  }, [router]);

  const handleStatusSelect = useCallback(
    (targetStatusId: string) => {
      const target = funnelStatuses.find((s) => s.id === targetStatusId);
      if (!target) return;

      setStatusErrorMessage(null);

      // Guarded transition check: converted transitions require financial permission and final contract confirmation
      if (target.bucket === 'converted') {
        if (!canViewFinancials) {
          setStatusErrorMessage('Financial permission is required to finalize contract valuation and convert deals.');
          return;
        }
        setGuardedTargetStatus(target);
        setIsGuardedTransitionOpen(true);
        return;
      }

      if (
        target.bucket === 'lost' ||
        target.name.toLowerCase().includes('negotiat') ||
        target.name.toLowerCase().includes('hold')
      ) {
        if (!canViewFinancials && target.name.toLowerCase().includes('negotiat')) {
          setStatusErrorMessage('Financial permission is required to set Negotiation valuation.');
          return;
        }
        setGuardedTargetStatus(target);
        setIsGuardedTransitionOpen(true);
        return;
      }

      // Optimistic execution for standard forward progress stages
      const previousLead = { ...currentLead };
      const optimisticStatusName = target.name;
      const optimisticBucket = target.bucket;
      const optimisticColor = target.color_code;

      setCurrentLead((prev) => ({
        ...prev,
        status_id: target.id,
        status_name: optimisticStatusName,
        status_color: optimisticColor,
        bucket: optimisticBucket,
      }));

      const syntheticActivity: LeadActivityWithActor = {
        id: `optimistic-${Date.now()}`,
        lead_id: currentLead.id,
        actor_id: null,
        activity_type: 'status_change',
        description: `Stage updated from "${previousLead.status_name}" to "${optimisticStatusName}".`,
        metadata: {
          previous_status_name: previousLead.status_name,
          new_status_name: optimisticStatusName,
        },
        created_at: new Date().toISOString(),
        actor_name: 'You',
        actor_role: userRole,
      };

      setActivities((prev) => [syntheticActivity, ...prev]);

      startTransition(async () => {
        try {
          const result = await updateLeadStatusInlineAction(currentLead.id, target.id);
          if (!result.success) {
            // Rollback optimistic state
            setCurrentLead(previousLead);
            setActivities((prev) => prev.filter((a) => a.id !== syntheticActivity.id));
            setStatusErrorMessage(result.error || 'Failed to update deal stage. Reverted to previous status.');
          } else {
            router.refresh();
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          setCurrentLead(previousLead);
          setActivities((prev) => prev.filter((a) => a.id !== syntheticActivity.id));
          setStatusErrorMessage(`Network error updating stage: ${msg}`);
        }
      });
    },
    [funnelStatuses, currentLead, userRole, canViewFinancials, router]
  );

  const handleEditScopeSuccess = useCallback((updated: Partial<LeadDossierData>) => {
    setCurrentLead((prev) => ({ ...prev, ...updated }));
    setIsEditScopeOpen(false);
    router.refresh();

    const auditLog: LeadActivityWithActor = {
      id: `edit-${Date.now()}`,
      lead_id: currentLead.id,
      actor_id: null,
      activity_type: 'field_update',
      description: 'Commercial deal scope and contact coordinates updated.',
      metadata: { fields: Object.keys(updated) },
      created_at: new Date().toISOString(),
      actor_name: 'You',
      actor_role: userRole,
    };
    setActivities((prev) => [auditLog, ...prev]);
  }, [currentLead.id, userRole, router]);

  const handleScheduleSuccess = useCallback((newFollowUpIso: string) => {
    setCurrentLead((prev) => ({ ...prev, next_follow_up: newFollowUpIso }));
    setIsSchedulerOpen(false);
    router.refresh();

    const scheduleLog: LeadActivityWithActor = {
      id: `schedule-${Date.now()}`,
      lead_id: currentLead.id,
      actor_id: null,
      activity_type: 'follow_up_scheduled',
      description: `Follow-up touchpoint scheduled for ${new Date(newFollowUpIso).toLocaleString('en-IN')}.`,
      metadata: { scheduled_for: newFollowUpIso },
      created_at: new Date().toISOString(),
      actor_name: 'You',
      actor_role: userRole,
    };
    setActivities((prev) => [scheduleLog, ...prev]);
  }, [currentLead.id, userRole, router]);

  const handleConvertToDealSuccess = useCallback(() => {
    const qualifiedStatus =
      funnelStatuses.find((s) => s.bucket === 'potential') ||
      funnelStatuses.find((s) => s.id === currentLead.status_id);
    setCurrentLead((prev) => ({
      ...prev,
      bucket: qualifiedStatus?.bucket || 'potential',
      status_id: qualifiedStatus?.id || prev.status_id,
      status_name: qualifiedStatus?.name || prev.status_name,
      status_color: qualifiedStatus?.color_code || prev.status_color,
    }));
    setIsConvertToDealOpen(false);
    router.refresh();
  }, [funnelStatuses, currentLead.status_id, router]);

  const handleGuardedTransitionSuccess = useCallback(
    (payload: {
      statusId: string;
      statusName: string;
      bucket: FunnelBucket;
      convertedAt?: string | null;
      expectedValue?: number;
      workId?: string | null;
      projectCode?: string | null;
    }) => {
      setCurrentLead((prev) => ({
        ...prev,
        status_id: payload.statusId,
        status_name: payload.statusName,
        bucket: payload.bucket,
        converted_at: payload.convertedAt !== undefined ? payload.convertedAt : prev.converted_at,
        expected_value:
          typeof payload.expectedValue === 'number' ? payload.expectedValue : prev.expected_value,
      }));
      if (payload.workId && payload.projectCode) {
        setCurrentLinkedWork({
          id: payload.workId,
          project_code: payload.projectCode,
          delivery_stage: 'kickoff',
          health_status: 'on_track',
        });
      }
      // Keep ConvertedCelebrationModal mounted so confetti and Client Works CTA remain visible until dismissed
      if (payload.bucket !== 'converted') {
        setIsGuardedTransitionOpen(false);
        setGuardedTargetStatus(null);
      }
      router.refresh();
    },
    [router]
  );

  const handleAssigneeChange = useCallback(
    (newAssigneeId: string) => {
      if (userRole !== 'admin' && userRole !== 'sales_manager') return;
      if (!newAssigneeId) return;

      const previousAssignee = currentLead.assigned_to;
      const previousAssigneeName = currentLead.assigned_to_name;
      const targetAssignee = teamAssignees.find((a) => a.id === newAssigneeId);

      setStatusErrorMessage(null);
      setCurrentLead((prev) => ({
        ...prev,
        assigned_to: newAssigneeId,
        assigned_to_name: targetAssignee?.full_name || previousAssigneeName,
      }));

      startTransition(async () => {
        try {
          const res = await updateLeadAssignee(currentLead.id, newAssigneeId);
          if (!res.success) {
            setCurrentLead((prev) => ({
              ...prev,
              assigned_to: previousAssignee,
              assigned_to_name: previousAssigneeName,
            }));
            const errMsg = res.error || 'Failed to reassign deal.';
            setStatusErrorMessage(errMsg);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('crm-toast', { detail: { type: 'error', message: errMsg } }));
            }
          } else {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('crm-toast', {
                  detail: {
                    type: 'success',
                    message: `Assigned to ${targetAssignee?.full_name || 'team representative'}.`,
                  },
                })
              );
            }
            router.refresh();
          }
        } catch (err: unknown) {
          setCurrentLead((prev) => ({
            ...prev,
            assigned_to: previousAssignee,
            assigned_to_name: previousAssigneeName,
          }));
          const errMsg = err instanceof Error ? err.message : 'Network error updating assignee.';
          setStatusErrorMessage(errMsg);
        }
      });
    },
    [currentLead.id, currentLead.assigned_to, currentLead.assigned_to_name, userRole, teamAssignees, router]
  );

  return (
    <div className={styles.workspaceContainer}>
      {/* 1. Master Header Navigation Bar */}
      <DossierHeaderBar
        leadIdCode={currentLead.lead_id}
        companyName={currentLead.company}
        contactName={currentLead.name}
        currentStatus={currentStatusObject}
        funnelStatuses={funnelStatuses}
        workspaceMode={workspaceMode}
        isConverted={isConverted}
        isReadOnly={userRole === 'viewer'}
        onStatusSelect={handleStatusSelect}
        onOpenEditScope={() => setIsEditScopeOpen(true)}
        onOpenScheduler={() => setIsSchedulerOpen(true)}
        onOpenConvertToDeal={
          !isConverted &&
          workspaceMode === 'leads' &&
          currentLead.bucket === 'open' &&
          (userRole === 'admin' || userRole === 'sales_manager')
            ? () => setIsConvertToDealOpen(true)
            : undefined
        }
        onMarkWon={
          !isConverted &&
          userRole !== 'viewer' &&
          canViewFinancials &&
          currentLead.bucket !== 'open' &&
          currentLead.bucket !== 'lost'
            ? () => {
                const wonStatus = funnelStatuses.find((st) => st.bucket === 'converted');
                if (wonStatus) {
                  setGuardedTargetStatus(wonStatus);
                  setIsGuardedTransitionOpen(true);
                }
              }
            : undefined
        }
        isPending={isPending}
      />

      {/* Post-Conversion Client Works Delivery Banner */}
      {isConverted && (
        <div className={styles.linkedWorkBanner} role="region" aria-label="Converted Delivery Project">
          <div className={styles.linkedWorkMeta}>
            <span className={styles.linkedWorkCode}>
              {currentLinkedWork?.project_code || 'PROJECT SPAWNED'}
            </span>
            <span className={styles.linkedWorkSummary}>
              Deal converted to Won client work
              {currentLinkedWork
                ? ` · Stage: ${currentLinkedWork.delivery_stage.replace(/_/g, ' ').toUpperCase()} · Health: ${currentLinkedWork.health_status.replace(/_/g, ' ').toUpperCase()}`
                : ' · Delivery board active'}
            </span>
          </div>
          <Link
            href={
              currentLinkedWork?.id
                ? `/admin/works?workId=${encodeURIComponent(currentLinkedWork.id)}`
                : '/admin/works'
            }
            className={styles.linkedWorkCta}
          >
            <span>View Project in Client Works</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      )}

      {/* Global Status Mutation Error Feedback */}
      {statusErrorMessage && (
        <div className={`${styles.composerErrorBanner} ${styles.statusErrorSpacing}`}>
          {statusErrorMessage}
        </div>
      )}

      {/* 2. Commercial KPI Ribbon (3 Stripe Scorecards) */}
      <CommercialKpiRibbon
        expectedValue={currentLead.expected_value}
        budgetBracket={currentLead.budget_bracket}
        priority={currentLead.priority}
        statusBucket={currentLead.bucket}
        statusName={currentLead.status_name}
        inquiryCount={currentLead.inquiry_count || 1}
        canViewFinancials={canViewFinancials}
      />

      {/* 3. 7:5 Asymmetric Operational Grid */}
      <div className={styles.workspaceGrid}>
        {/* Left Column (7fr): Intelligence & Dossier Records */}
        <div className={styles.columnLeft}>
          {/* Card A: Organization & Client Intelligence (Zero Truncation) */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                  <path d="M9 22v-4h6v4" />
                  <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
                </svg>
                <span>Organization & Client Intelligence</span>
              </h2>
              <span className={styles.badgePill}>{currentLead.industry || 'Sector Unspecified'}</span>
            </div>

            <div className={styles.keyValueGrid}>
              <div className={styles.keyValuePair}>
                <span className={styles.fieldLabel}>Company Name</span>
                <span className={styles.contactValueUntruncated}>
                  {currentLead.company || 'Private Client'}
                </span>
              </div>

              <div className={styles.keyValuePair}>
                <span className={styles.fieldLabel}>Verified Domain</span>
                {websiteUrl ? (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.coordinateDeepLink}
                    title={`Visit ${websiteUrl}`}
                  >
                    <span>{currentLead.company_website}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ) : (
                  <span className={styles.contactEmptyValue}>
                    Not Provided
                  </span>
                )}
              </div>

              <div className={styles.keyValuePair}>
                <span className={styles.fieldLabel}>Primary Decision Maker</span>
                <span className={styles.contactValueUntruncated}>
                  {currentLead.name || 'Private Contact'}
                </span>
              </div>

              <div className={styles.keyValuePair}>
                <span className={styles.fieldLabel}>Preferred Outreach Coordinate</span>
                <div className={styles.contactCoordinateRow}>
                  {telUri && (
                    <a href={telUri} className={styles.coordinateDeepLink} title="Direct Telephone Call">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span className={styles.contactValueUntruncated}>{currentLead.phone}</span>
                    </a>
                  )}

                  {whatsAppUri && (
                    <a
                      href={whatsAppUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.coordinateDeepLink}
                      title="Open WhatsApp Deep Link"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {!telUri && !whatsAppUri && (
                    <span className={styles.contactEmptyValue}>
                      No phone coordinate provided
                    </span>
                  )}
                </div>
              </div>

              <div className={`${styles.keyValuePair} ${styles.fullGridSpan}`}>
                <span className={styles.fieldLabel}>Direct Email</span>
                {currentLead.email ? (
                  <a
                    href={`mailto:${currentLead.email}`}
                    className={`${styles.coordinateDeepLink} ${styles.fitContentLink}`}
                    title={`Dispatch email to ${currentLead.email}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span className={styles.contactValueUntruncated}>{currentLead.email}</span>
                  </a>
                ) : (
                  <span className={styles.contactEmptyValue}>
                    No email address registered
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card B: Original Ingestion Brief Matrix */}
          <IngestionBriefMatrix
            payload={currentLead.brief_payload}
            serviceCategory={currentLead.service_category}
            budgetBracket={currentLead.budget_bracket}
          />

          {/* Card C: Executive Deal Notes (Notion-Callout Aesthetic) */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span>Executive Deal Notes</span>
              </h2>
              {userRole !== 'viewer' && (
                <button
                  type="button"
                  onClick={() => setIsEditScopeOpen(true)}
                  className={styles.btnRescheduleMini}
                >
                  Edit Notes
                </button>
              )}
            </div>

            {currentLead.notes ? (
              <div className={styles.notionCallout}>
                <p className={styles.notionCalloutQuote}>{currentLead.notes}</p>
                <div className={styles.notionCalloutMeta}>
                  <span>Confidential Internal Intelligence</span>
                  <span>•</span>
                  <span>Updated {formatRelativeTime(currentLead.updated_at)}</span>
                </div>
              </div>
            ) : (
              <div className={styles.briefEmptyBanner}>
                No executive notes recorded yet. Use the Touchpoint Composer on the right or Edit Scope
                to record confidential commercial notes.
              </div>
            )}
          </div>

          {/* Card D: Immutable Omnichannel Activity Ledger Timeline */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Omnichannel Activity Ledger</span>
              </h2>
              <span className={styles.badgePill}>{activities.length} Recorded Touchpoints</span>
            </div>

            {activities.length === 0 ? (
              <div className={styles.timelineEmptyState}>
                No interactions logged yet. Log calls, WhatsApp chats, or notes using the composer on
                the right.
              </div>
            ) : (
              <div className={styles.timelineContainer} role="feed" aria-label="Lead Activity Ledger">
                {timelineItems.map((item) => {
                  if (item.kind === 'single') {
                    const act = item.activity;
                    const metadata = (act.metadata as Record<string, unknown>) || {};
                    const isSystemActor = !act.actor_name || act.actor_name === 'System Staff';
                    const displayActorName = isSystemActor ? 'System Cadence Engine' : act.actor_name;
                    const displayActorInitials = isSystemActor ? 'SC' : getDossierInitials(act.actor_name);
                    const narrativeToParse = item.narrative || act.description;
                    const parsed = parseMentionsAndTags(narrativeToParse);

                    return (
                      <article key={act.id} className={styles.timelineItem}>
                        <div className={styles.timelineGlyphDot} aria-hidden="true">
                          {renderTimelineGlyph(act.activity_type)}
                        </div>

                        <div className={styles.timelineCard}>
                          <div className={styles.timelineHeader}>
                            <div className={styles.timelineAuthorMeta}>
                              <span className={styles.avatarInitials}>
                                {displayActorInitials}
                              </span>
                              <span className={styles.timelineActorName}>{displayActorName}</span>
                              <span className={styles.timelineEventTag}>
                                • {act.activity_type.replace(/_/g, ' ')}
                              </span>
                            </div>

                            <time className={styles.timelineTimestamp} dateTime={act.created_at}>
                              {formatRelativeTime(act.created_at)}
                            </time>
                          </div>

                          <div className={styles.timelineBodyText}>
                            {parsed.map((part, pIdx) => {
                              if (part.type === 'mention') {
                                return (
                                  <span key={pIdx} className={styles.mentionHighlight}>
                                    {part.value}
                                  </span>
                                );
                              }
                              if (part.type === 'tag') {
                                return (
                                  <span key={pIdx} className={styles.tagHighlight}>
                                    {part.value}
                                  </span>
                                );
                              }
                              return <React.Fragment key={pIdx}>{part.value}</React.Fragment>;
                            })}
                          </div>

                          {/* Metadata & Audit Delta Pills */}
                          {(Boolean(metadata.duration_seconds) ||
                            Boolean(metadata.outcome) ||
                            Boolean(metadata.meeting_type) ||
                            Boolean(metadata.message_category) ||
                            Boolean(metadata.subject) ||
                            item.deltaPills.length > 0) && (
                            <div className={styles.timelineMetaPillsRow}>
                              {item.deltaPills.map((pill, pillIdx) => (
                                <span key={`delta-${pillIdx}`} className={styles.badgePill}>
                                  {pill}
                                </span>
                              ))}
                              {typeof metadata.subject === 'string' && metadata.subject.trim() && (
                                <span className={styles.badgePill}>Subject: {metadata.subject}</span>
                              )}
                              {typeof metadata.duration_seconds === 'number' && (
                                <span className={styles.badgePill}>
                                  Duration: {formatCallDuration(metadata.duration_seconds)}
                                </span>
                              )}
                              {typeof metadata.outcome === 'string' && (
                                <span className={styles.badgePill}>{metadata.outcome}</span>
                              )}
                              {typeof metadata.meeting_type === 'string' && (
                                <span className={styles.badgePill}>{metadata.meeting_type}</span>
                              )}
                              {typeof metadata.message_category === 'string' && (
                                <span className={styles.badgePill}>{metadata.message_category}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  }

                  // Grouped System Cluster / Expandable Summary Drawer
                  const isExpanded = Boolean(expandedGroupIds[item.id]);
                  return (
                    <div key={item.id} className={styles.timelineItem}>
                      <div className={styles.timelineGlyphDot} aria-hidden="true">
                        {renderTimelineGlyph('system_event')}
                      </div>

                      <div className={styles.systemGroupCard}>
                        <button
                          type="button"
                          className={styles.systemGroupHeader}
                          onClick={() => toggleGroup(item.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`drawer-${item.id}`}
                        >
                          <div className={styles.systemGroupLeft}>
                            <div className={styles.systemGroupGlyph} aria-hidden="true">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                              </svg>
                            </div>
                            <div className={styles.systemGroupTitleBlock}>
                              <span className={styles.systemGroupTitle}>{item.title}</span>
                              <span className={styles.systemGroupSubtitle}>{item.subtitle}</span>
                            </div>
                          </div>

                          <div className={styles.systemGroupRight}>
                            <span className={styles.systemGroupCountBadge}>{item.events.length} events</span>
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className={`${styles.systemGroupChevron} ${
                                isExpanded ? styles.chevronOpen : ''
                              }`}
                              aria-hidden="true"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                        </button>

                        {isExpanded && (
                          <div id={`drawer-${item.id}`} className={styles.systemGroupBody}>
                            {item.events.map((ev) => (
                              <div key={ev.activity.id} className={styles.systemDeltaRow}>
                                <div className={styles.systemDeltaNarrative}>
                                  <div>{ev.narrative}</div>
                                  {ev.deltaPills.length > 0 && (
                                    <div className={styles.systemDeltaPillsRow}>
                                      {ev.deltaPills.map((pill, pIdx) => (
                                        <span key={pIdx} className={styles.deltaFieldPill}>
                                          {pill}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <time className={styles.systemDeltaTime} dateTime={ev.activity.created_at}>
                                  {formatRelativeTime(ev.activity.created_at)}
                                </time>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5fr): Sticky Operational Controls & Commercial Meta */}
        <div className={styles.columnRight}>
          {/* Component 1: Sticky Rapid Touchpoint Composer */}
          <RapidTouchpointComposer
            leadId={currentLead.id}
            onActivityLogged={handleActivityLogged}
            readOnly={userRole === 'viewer'}
          />

          {/* Component 2: Commercial Assignment & Deal Routing */}
          <div className={styles.sectionCard}>
            <div className={`${styles.sectionHeader} ${styles.sectionHeaderCompact}`}>
              <h2 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <polyline points="17 11 19 13 23 9" />
                </svg>
                <span>Personnel & Routing</span>
              </h2>
            </div>

            <div className={styles.metaCardList}>
              <div className={styles.metaCardRow}>
                <label htmlFor="dossier-owner-select" className={styles.fieldLabel}>
                  Designated Lead Owner
                </label>
                {userRole === 'admin' || userRole === 'sales_manager' ? (
                  <select
                    id="dossier-owner-select"
                    aria-label="Designated Lead Owner"
                    value={currentLead.assigned_to || ''}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className={`${styles.composerSelect} ${styles.ownerSelectCompact}`}
                  >
                    <option value="" disabled>Unassigned</option>
                    {teamAssignees.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={styles.badgePill}>
                    {currentLead.assigned_to_name || 'Unassigned'}
                  </span>
                )}
              </div>

              <div className={styles.metaCardRow}>
                <span className={styles.fieldLabel}>Service Category</span>
                <span className={styles.fieldValue}>{currentLead.service_category}</span>
              </div>

              <div className={styles.metaCardRow}>
                <span className={styles.fieldLabel}>Preferred Outreach</span>
                <span className={styles.badgePill}>{currentLead.preferred_channel}</span>
              </div>

              <div className={styles.metaCardRow}>
                <span className={styles.fieldLabel}>Initial Ingestion Date</span>
                <span className={styles.timelineTimestamp}>
                  {new Date(currentLead.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Component 3: Next Precision Follow-Up Schedule Card */}
          <div className={styles.sectionCard}>
            <div className={`${styles.sectionHeader} ${styles.sectionHeaderTight}`}>
              <h2 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Follow-Up Commitment</span>
              </h2>
            </div>

            {currentLead.next_follow_up ? (
              <div className={styles.followUpCountdownCard}>
                <div className={styles.followUpDetails}>
                  <span className={styles.followUpTimeTitle}>
                    {new Date(currentLead.next_follow_up).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className={styles.followUpRelativeBadge}>
                    Due {formatRelativeTime(currentLead.next_follow_up)}
                  </span>
                </div>
                {userRole !== 'viewer' && (
                  <button
                    type="button"
                    onClick={() => setIsSchedulerOpen(true)}
                    className={styles.btnRescheduleMini}
                  >
                    Reschedule
                  </button>
                )}
              </div>
            ) : (
              <div className={`${styles.briefEmptyBanner} ${styles.followUpEmptyCard}`}>
                <p className={styles.followUpEmptyCopy}>No future follow-up commitment scheduled.</p>
                {userRole !== 'viewer' && (
                  <button
                    type="button"
                    onClick={() => setIsSchedulerOpen(true)}
                    className={`${styles.btnSecondaryAction} ${styles.fullWidthBtn}`}
                  >
                    Schedule Touchpoint Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Sticky Bottom Action Dock (Mobile < 768px, 44px tap targets) */}
      {userRole !== 'viewer' && (
      <nav className={styles.mobileActionDock} aria-label="Mobile deal actions">
        {!isConverted && currentLead.bucket === 'open' && (userRole === 'admin' || userRole === 'sales_manager') && (
          <button
            type="button"
            onClick={() => setIsConvertToDealOpen(true)}
            className={`${styles.mobileDockBtn} ${styles.mobilePrimary}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ width: 14, height: 14 }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Convert</span>
          </button>
        )}
        {!isConverted && canViewFinancials && currentLead.bucket !== 'open' && currentLead.bucket !== 'lost' && (
          <button
            type="button"
            onClick={() => {
              const wonStatus = funnelStatuses.find((st) => st.bucket === 'converted');
              if (wonStatus) {
                setGuardedTargetStatus(wonStatus);
                setIsGuardedTransitionOpen(true);
              }
            }}
            className={`${styles.mobileDockBtn} ${styles.mobilePrimary}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ width: 14, height: 14 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Mark Won</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsEditScopeOpen(true)}
          className={`${styles.mobileDockBtn} ${styles.mobileSecondary}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ width: 14, height: 14 }}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Edit Scope</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSchedulerOpen(true)}
          className={`${styles.mobileDockBtn} ${styles.mobileSecondary}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ width: 14, height: 14 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Schedule</span>
        </button>
      </nav>
      )}

      {/* 5. Modals Suite */}
      {isEditScopeOpen && (
        <EditLeadModal
          isOpen={isEditScopeOpen}
          onClose={() => setIsEditScopeOpen(false)}
          lead={currentLead}
          canViewFinancials={canViewFinancials}
          onSuccess={handleEditScopeSuccess}
        />
      )}

      {isSchedulerOpen && (
        <FollowUpScheduler
          isOpen={isSchedulerOpen}
          leadId={currentLead.id}
          leadName={currentLead.name}
          company={currentLead.company}
          currentFollowUpDate={currentLead.next_follow_up}
          onClose={() => setIsSchedulerOpen(false)}
          onSuccess={handleScheduleSuccess}
        />
      )}

      {isConvertToDealOpen && (
        <ConvertLeadToDealModal
          isOpen={isConvertToDealOpen}
          onClose={() => setIsConvertToDealOpen(false)}
          lead={{
            id: currentLead.id,
            lead_id: currentLead.lead_id,
            name: currentLead.name,
            company: currentLead.company,
            service_category: currentLead.service_category,
            expected_value: currentLead.expected_value,
            assigned_to: currentLead.assigned_to,
            priority: currentLead.priority,
          }}
          availableAssignees={teamAssignees.map((a) => ({ id: a.id, label: a.full_name }))}
          availableStatuses={funnelStatuses.map((s) => ({
            id: s.id,
            name: s.name,
            bucket: s.bucket,
          }))}
          onSuccess={handleConvertToDealSuccess}
        />
      )}

      {isGuardedTransitionOpen && guardedTargetStatus && (
        <StageTransitionModal
          isOpen={isGuardedTransitionOpen}
          onClose={() => {
            setIsGuardedTransitionOpen(false);
            setGuardedTargetStatus(null);
          }}
          leadId={currentLead.id}
          targetStatus={{
            id: guardedTargetStatus.id,
            name: guardedTargetStatus.name,
            bucket: guardedTargetStatus.bucket,
          }}
          dealIdCode={currentLead.lead_id}
          dealName={currentLead.company || currentLead.name}
          currentExpectedValue={canViewFinancials ? currentLead.expected_value : undefined}
          onSuccess={(res) =>
            handleGuardedTransitionSuccess({
              statusId: res.newStatusId,
              statusName: guardedTargetStatus.name,
              bucket: guardedTargetStatus.bucket,
              convertedAt: res.convertedAt ?? null,
              expectedValue: res.expectedValue,
              workId: res.workId ?? null,
              projectCode: res.projectCode ?? null,
            })
          }
        />
      )}
    </div>
  );
}
