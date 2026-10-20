'use client';

/**
 * @file LeadDossierWorkspaceClient.tsx
 * @description Master interactive Client 360° Lead/Deal Dossier Workspace client component.
 *              Integrates:
 *              - 7:5 asymmetric operational grid (desktop) collapsing to a fluid stack (< 768px).
 *              - Deep obsidian surface palette (#050505 bg, #0e0e11 surface, #141418 elevated, #ff6100 accents).
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

import React, { useState, useTransition, useCallback, useMemo } from 'react';
import type {
  LeadWithRelations,
  LeadActivityWithActor,
  FunnelStatus,
  CrmUserRole,
  FunnelBucket,
  LeadPriority,
  LeadActivityType,
} from '@/types/crm';
import type { LeadDossierData } from '../DossierDrawer/ClientDossierDrawer';
import {
  formatDossierCurrency,
  sanitizeTelUri,
  createWhatsAppUri,
  getDossierInitials,
  formatRelativeTime,
  formatCallDuration,
  parseMentionsAndTags,
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
      color_code: '#ff6100',
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

export function LeadDossierWorkspaceClient({
  lead: initialLeadInput,
  initialActivities,
  funnelStatuses,
  teamAssignees,
  userRole,
  workspaceMode,
}: LeadDossierWorkspaceClientProps): React.ReactElement {
  // 1. Normalized State Model
  const [currentLead, setCurrentLead] = useState<LeadDossierData>(() =>
    normalizeToDossier(initialLeadInput, funnelStatuses, teamAssignees)
  );
  const [activities, setActivities] = useState<LeadActivityWithActor[]>(initialActivities);
  const [isPending, startTransition] = useTransition();
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);

  // 2. Modal Presentation Controllers
  const [isEditScopeOpen, setIsEditScopeOpen] = useState<boolean>(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState<boolean>(false);
  const [isConvertToDealOpen, setIsConvertToDealOpen] = useState<boolean>(false);
  const [isGuardedTransitionOpen, setIsGuardedTransitionOpen] = useState<boolean>(false);
  const [guardedTargetStatus, setGuardedTargetStatus] = useState<FunnelStatus | null>(null);

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

  // -------------------------------------------------------------------------
  // Handlers: Activity Logging & Optimistic State Updates
  // -------------------------------------------------------------------------

  const handleActivityLogged = useCallback((newActivity: LeadActivityWithActor) => {
    setActivities((prev) => [newActivity, ...prev]);
  }, []);

  const handleStatusSelect = useCallback(
    (targetStatusId: string) => {
      const target = funnelStatuses.find((s) => s.id === targetStatusId);
      if (!target) return;

      setStatusErrorMessage(null);

      // Guarded transition check: converted or lost or complex transitions require dialog disclosures
      if (target.bucket === 'converted') {
        setIsConvertToDealOpen(true);
        return;
      }

      if (
        target.bucket === 'lost' ||
        target.name.toLowerCase().includes('negotiat') ||
        target.name.toLowerCase().includes('hold')
      ) {
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
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          setCurrentLead(previousLead);
          setActivities((prev) => prev.filter((a) => a.id !== syntheticActivity.id));
          setStatusErrorMessage(`Network error updating stage: ${msg}`);
        }
      });
    },
    [funnelStatuses, currentLead, userRole]
  );

  const handleEditScopeSuccess = useCallback((updated: Partial<LeadDossierData>) => {
    setCurrentLead((prev) => ({ ...prev, ...updated }));
    setIsEditScopeOpen(false);

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
  }, [currentLead.id, userRole]);

  const handleScheduleSuccess = useCallback((newFollowUpIso: string) => {
    setCurrentLead((prev) => ({ ...prev, next_follow_up: newFollowUpIso }));
    setIsSchedulerOpen(false);

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
  }, [currentLead.id, userRole]);

  const handleConvertToDealSuccess = useCallback(() => {
    const convertedStatus = funnelStatuses.find((s) => s.bucket === 'converted');
    setCurrentLead((prev) => ({
      ...prev,
      bucket: 'converted',
      converted_at: new Date().toISOString(),
      status_id: convertedStatus?.id || prev.status_id,
      status_name: convertedStatus?.name || 'Deal Converted',
      status_color: convertedStatus?.color_code || '#22c55e',
    }));
    setIsConvertToDealOpen(false);
  }, [funnelStatuses]);

  const handleGuardedTransitionSuccess = useCallback(
    (payload: { statusId: string; statusName: string; bucket: FunnelBucket }) => {
      setCurrentLead((prev) => ({
        ...prev,
        status_id: payload.statusId,
        status_name: payload.statusName,
        bucket: payload.bucket,
      }));
      setIsGuardedTransitionOpen(false);
      setGuardedTargetStatus(null);
    },
    []
  );

  const handleAssigneeChange = useCallback(
    (newAssigneeId: string) => {
      if (userRole !== 'admin' && userRole !== 'sales_manager') return;

      const previousAssignee = currentLead.assigned_to;
      const targetAssignee = teamAssignees.find((a) => a.id === newAssigneeId);

      setCurrentLead((prev) => ({
        ...prev,
        assigned_to: newAssigneeId || null,
        assigned_to_name: targetAssignee?.full_name || 'Unassigned',
      }));

      startTransition(async () => {
        try {
          const res = await updateLeadAssignee(currentLead.id, newAssigneeId || undefined);
          if (!res.success) {
            setCurrentLead((prev) => ({
              ...prev,
              assigned_to: previousAssignee,
            }));
            setStatusErrorMessage(res.error || 'Failed to reassign deal.');
          }
        } catch {
          setCurrentLead((prev) => ({
            ...prev,
            assigned_to: previousAssignee,
          }));
        }
      });
    },
    [currentLead.id, currentLead.assigned_to, userRole, teamAssignees]
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
        onStatusSelect={handleStatusSelect}
        onOpenEditScope={() => setIsEditScopeOpen(true)}
        onOpenScheduler={() => setIsSchedulerOpen(true)}
        onOpenConvertToDeal={!isConverted ? () => setIsConvertToDealOpen(true) : undefined}
        isPending={isPending}
      />

      {/* Global Status Mutation Error Feedback */}
      {statusErrorMessage && (
        <div className={styles.composerErrorBanner} style={{ marginBottom: 16 }}>
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
        inquiryCount={1}
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
                <span>Organization & Client Intelligence.</span>
              </h2>
              <span className={styles.badgePill}>{currentLead.industry || 'Commercial / Luxury'}</span>
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
                  <span className={styles.contactValueUntruncated} style={{ color: '#6b7280' }}>
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
                    <span className={styles.contactValueUntruncated} style={{ color: '#6b7280' }}>
                      No phone coordinate provided
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.keyValuePair} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.fieldLabel}>Direct Email</span>
                {currentLead.email ? (
                  <a
                    href={`mailto:${currentLead.email}`}
                    className={styles.coordinateDeepLink}
                    style={{ width: 'fit-content' }}
                    title={`Dispatch email to ${currentLead.email}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span className={styles.contactValueUntruncated}>{currentLead.email}</span>
                  </a>
                ) : (
                  <span className={styles.contactValueUntruncated} style={{ color: '#6b7280' }}>
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
                <span>Executive Deal Notes.</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsEditScopeOpen(true)}
                className={styles.btnRescheduleMini}
              >
                Edit Notes
              </button>
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
                <span>Omnichannel Activity Ledger.</span>
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
                {activities.map((act) => {
                  const metadata = (act.metadata as Record<string, unknown>) || {};
                  const parsed = parseMentionsAndTags(act.description);

                  return (
                    <article key={act.id} className={styles.timelineItem}>
                      <div className={styles.timelineGlyphDot} aria-hidden="true">
                        {renderTimelineGlyph(act.activity_type)}
                      </div>

                      <div className={styles.timelineCard}>
                        <div className={styles.timelineHeader}>
                          <div className={styles.timelineAuthorMeta}>
                            <span className={styles.avatarInitials}>
                              {getDossierInitials(act.actor_name)}
                            </span>
                            <span className={styles.timelineActorName}>{act.actor_name}</span>
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

                        {/* Metadata Pills */}
                        {(Boolean(metadata.duration_seconds) ||
                          Boolean(metadata.outcome) ||
                          Boolean(metadata.meeting_type) ||
                          Boolean(metadata.message_category)) && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
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
          />

          {/* Component 2: Commercial Assignment & Deal Routing */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader} style={{ marginBottom: 14 }}>
              <h2 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <polyline points="17 11 19 13 23 9" />
                </svg>
                <span>Personnel & Routing.</span>
              </h2>
            </div>

            <div className={styles.metaCardList}>
              <div className={styles.metaCardRow}>
                <span className={styles.fieldLabel}>Designated Lead Owner</span>
                {userRole === 'admin' || userRole === 'sales_manager' ? (
                  <select
                    value={currentLead.assigned_to || ''}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className={styles.composerSelect}
                    style={{ width: 'auto', minWidth: 160 }}
                  >
                    <option value="">Unassigned</option>
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
            <div className={styles.sectionHeader} style={{ marginBottom: 12 }}>
              <h2 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Follow-Up Commitment.</span>
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
                <button
                  type="button"
                  onClick={() => setIsSchedulerOpen(true)}
                  className={styles.btnRescheduleMini}
                >
                  Reschedule
                </button>
              </div>
            ) : (
              <div className={styles.briefEmptyBanner} style={{ padding: 16 }}>
                <p style={{ margin: '0 0 10px 0' }}>No future follow-up commitment scheduled.</p>
                <button
                  type="button"
                  onClick={() => setIsSchedulerOpen(true)}
                  className={styles.btnSecondaryAction}
                  style={{ width: '100%' }}
                >
                  Schedule Touchpoint Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Sticky Bottom Action Dock (Mobile < 768px, 44px tap targets) */}
      <nav className={styles.mobileActionDock} aria-label="Mobile deal actions">
        {!isConverted && (
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

      {/* 5. Modals Suite */}
      {isEditScopeOpen && (
        <EditLeadModal
          isOpen={isEditScopeOpen}
          onClose={() => setIsEditScopeOpen(false)}
          lead={currentLead}
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
          currentExpectedValue={currentLead.expected_value}
          onSuccess={(res) =>
            handleGuardedTransitionSuccess({
              statusId: res.newStatusId,
              statusName: guardedTargetStatus.name,
              bucket: guardedTargetStatus.bucket,
            })
          }
        />
      )}
    </div>
  );
}
