'use client';

/**
 * @file LeadDetailModal.tsx
 * @description Centered Client 360 Lead Dossier modal window engineered according to
 *              Apple Human Interface Guidelines (HIG) and Linear fluid modal physics.
 *              Replaces right-hand drawers with an expansive 2-column operational layout,
 *              smooth enter/exit animations, and accidental dismissal protection.
 * @module app/admin/components/modals/LeadDetailModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import {
  getLeadDetails,
  updateLeadStatus,
  updateLeadAssignee,
  addLeadTouchpoint,
  updateLeadDealParameters,
} from '@/app/actions/leads';
import { formatDealValuation } from '@/app/lib/team-utils';
import type {
  LeadDetailDto,
  LeadActivityItem,
  FunnelStatusOption,
} from '@/app/lib/lead-detail-types';
import type { AssigneeOption } from '@/app/lib/lead-schemas';
import type { CurrentUserSession } from '@/app/admin/components/layout/UserProfileDropdown';
import { useModalAnimation } from './useModalAnimation';
import styles from './LeadDetailModal.module.scss';

export interface LeadDetailModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUserSession;
  onLeadUpdated?: () => void;
}

type ActiveTab = 'overview' | 'brief' | 'activities' | 'touchpoint';

export function LeadDetailModal({
  leadId,
  isOpen,
  onClose,
  currentUser,
  onLeadUpdated,
}: LeadDetailModalProps): React.ReactElement | null {
  const { shouldRender, isClosing, handleAnimationEnd } = useModalAnimation({
    isOpen,
    exitDurationMs: 180,
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Hydrated lead data state
  const [lead, setLead] = useState<LeadDetailDto | null>(null);
  const [activities, setActivities] = useState<LeadActivityItem[]>([]);
  const [funnelStatuses, setFunnelStatuses] = useState<FunnelStatusOption[]>([]);
  const [teamAssignees, setTeamAssignees] = useState<AssigneeOption[]>([]);

  // Stage dropdown popover state
  const [isStageMenuOpen, setIsStageMenuOpen] = useState<boolean>(false);
  const stageMenuRef = useRef<HTMLDivElement>(null);

  // Valuation inline edit state
  const [isEditingValuation, setIsEditingValuation] = useState<boolean>(false);
  const [valuationInput, setValuationInput] = useState<string>('');

  // Internal notes editor state
  const [notesInput, setNotesInput] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  // Fast touchpoint logger state
  const [touchpointType, setTouchpointType] = useState<
    'call_logged' | 'whatsapp_sent' | 'meeting_notes' | 'note_added'
  >('call_logged');
  const [touchpointNote, setTouchpointNote] = useState<string>('');
  const [touchpointFollowUp, setTouchpointFollowUp] = useState<string>('');
  const [isLoggingTouchpoint, setIsLoggingTouchpoint] = useState<boolean>(false);

  // Deal owner selector state
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

  // Clipboard copy state
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Accidental dismissal protection state
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);

  const [, startTransition] = useTransition();

  // Load complete lead dossier from Server Action
  const loadDossier = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await getLeadDetails(id);
        if (response.success && response.lead) {
          setLead(response.lead);
          setActivities(response.activities || []);
          setFunnelStatuses(response.funnelStatuses || []);
          setTeamAssignees(response.teamAssignees || []);
          setValuationInput(String(response.lead.expected_value || 0));
          setNotesInput(response.lead.notes || '');
        } else {
          setFetchError(response.error || 'Failed to retrieve client dossier.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Dossier retrieval fault.';
        setFetchError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isOpen && leadId) {
      loadDossier(leadId);
      setActiveTab('overview');
      setIsStageMenuOpen(false);
      setIsEditingValuation(false);
      setTouchpointNote('');
      setTouchpointFollowUp('');
      setShowDiscardModal(false);
    }
  }, [isOpen, leadId, loadDossier]);

  // Click outside listener for Stage dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent): void => {
      if (stageMenuRef.current && !stageMenuRef.current.contains(e.target as Node)) {
        setIsStageMenuOpen(false);
      }
    };
    if (isStageMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isStageMenuOpen]);

  // Handle Close Attempt with Dirty Check
  const handleRequestClose = useCallback(() => {
    if (touchpointNote.trim().length > 0) {
      setShowDiscardModal(true);
    } else {
      onClose();
    }
  }, [touchpointNote, onClose]);

  // Keyboard navigation: Escape key closes modal or inner popovers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (isOpen && e.key === 'Escape') {
        if (isStageMenuOpen) {
          setIsStageMenuOpen(false);
        } else if (isEditingValuation) {
          setIsEditingValuation(false);
        } else if (showDiscardModal) {
          setShowDiscardModal(false);
        } else {
          handleRequestClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isStageMenuOpen, isEditingValuation, showDiscardModal, handleRequestClose]);

  if (!shouldRender) return null;

  // Handle Clipboard Copy of Deal ID Token
  const handleCopyDealId = (): void => {
    if (!lead?.lead_id) return;
    navigator.clipboard.writeText(lead.lead_id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Handle Stage Advancement
  const handleSelectStage = (statusId: string): void => {
    if (!lead) return;
    setIsStageMenuOpen(false);
    startTransition(async () => {
      const result = await updateLeadStatus(lead.id, statusId);
      if (result.success) {
        await loadDossier(lead.id);
        onLeadUpdated?.();
      }
    });
  };

  // Handle Valuation Save
  const handleSaveValuation = (): void => {
    if (!lead) return;
    const numericVal = parseFloat(valuationInput) || 0;
    setIsEditingValuation(false);
    startTransition(async () => {
      const result = await updateLeadDealParameters(lead.id, {
        expectedValue: numericVal,
      });
      if (result.success) {
        await loadDossier(lead.id);
        onLeadUpdated?.();
      }
    });
  };

  // Handle Internal Notes Save
  const handleSaveNotes = async (): Promise<void> => {
    if (!lead) return;
    setIsSavingNotes(true);
    try {
      const result = await updateLeadDealParameters(lead.id, {
        notes: notesInput,
      });
      if (result.success) {
        await loadDossier(lead.id);
        onLeadUpdated?.();
      }
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Handle Deal Reassignment
  const handleReassign = async (newAssigneeId: string): Promise<void> => {
    if (!lead || !newAssigneeId) return;
    setIsReassigning(true);
    try {
      const result = await updateLeadAssignee(lead.id, newAssigneeId);
      if (result.success) {
        await loadDossier(lead.id);
        onLeadUpdated?.();
      }
    } finally {
      setIsReassigning(false);
    }
  };

  // Handle Touchpoint Submission
  const handleLogTouchpoint = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!lead || !touchpointNote.trim()) return;

    setIsLoggingTouchpoint(true);
    try {
      const isoFollowUp = touchpointFollowUp
        ? new Date(touchpointFollowUp).toISOString()
        : null;

      const result = await addLeadTouchpoint(lead.id, {
        activityType: touchpointType,
        description: touchpointNote.trim(),
        nextFollowUp: isoFollowUp,
      });

      if (result.success) {
        setTouchpointNote('');
        setTouchpointFollowUp('');
        await loadDossier(lead.id);
        setActiveTab('activities');
        onLeadUpdated?.();
      }
    } finally {
      setIsLoggingTouchpoint(false);
    }
  };

  const cleanPhone = lead?.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
  const canReassign =
    currentUser.role === 'admin' || currentUser.role === 'sales_manager';

  // Parse creative brief payload safely
  const briefPayload = lead?.brief_payload || {};
  const hasBriefContent =
    briefPayload &&
    Object.keys(briefPayload).some(
      (k) =>
        k !== 'created_via' &&
        k !== 'creator_id' &&
        k !== 'creator_name' &&
        k !== 'creator_role' &&
        k !== 'phone_warning' &&
        k !== 'created_at' &&
        briefPayload[k]
    );

  const briefTimeline = (briefPayload.timeline as string) || (briefPayload.target_launch as string);
  const briefBudget = (briefPayload.budgetBracket as string) || (briefPayload.budget as string);
  const briefServices = (briefPayload.requestedServices as string[]) || (briefPayload.services as string[]);
  const briefScope = (briefPayload.projectScope as string) || (briefPayload.scope as string) || (briefPayload.goals as string);
  const briefNotes = (briefPayload.extraNotes as string) || (briefPayload.message as string) || (briefPayload.notes as string);

  return (
    <div
      className={`${styles.modalOverlay} ${isClosing ? styles.overlayClosing : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleRequestClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Client 360 Dossier Modal"
    >
      <div
        className={`${styles.modalDialog} ${isClosing ? styles.dialogClosing : ''}`}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* Pinned Modal Header (72px) */}
        <header className={styles.modalHeader}>
          <div className={styles.headerLeftBlock}>
            <div className={styles.tokenStageGroup}>
              {lead?.lead_id && (
                <button
                  type="button"
                  className={styles.dealIdToken}
                  onClick={handleCopyDealId}
                  title="Click to copy Deal ID"
                >
                  <span>[{lead.lead_id}]</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              )}
              {isCopied && <span className={styles.copiedBadge}>Copied!</span>}

              {/* Stage Pill Selector */}
              <div className={styles.stageDropdownWrapper} ref={stageMenuRef}>
                <button
                  type="button"
                  className={styles.stagePillButton}
                  onClick={() => setIsStageMenuOpen((prev) => !prev)}
                  style={{
                    borderColor: `${lead?.status_color || '#ff6100'}60`,
                    color: lead?.status_color || '#ff6100',
                    background: `${lead?.status_color || '#ff6100'}15`,
                  }}
                >
                  <span>●</span>
                  <span>{lead?.status_name || 'Active Deal'}</span>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isStageMenuOpen && (
                  <div className={styles.stageMenu}>
                    {funnelStatuses.map((status) => (
                      <button
                        key={status.id}
                        type="button"
                        className={`${styles.stageMenuItem} ${
                          status.id === lead?.status_id ? styles.stageMenuItemActive : ''
                        }`}
                        onClick={() => handleSelectStage(status.id)}
                      >
                        <span style={{ color: status.color_code }}>●</span>
                        <span>{status.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.headerIdentity}>
              <h2 className={styles.clientHeading}>{lead?.name || 'Loading Dossier...'}</h2>
              <p className={styles.companyHeading}>
                {lead?.company || 'Private Client Engagement'}
                {lead?.industry ? ` · ${lead.industry}` : ''}
              </p>
            </div>
          </div>

          <div className={styles.headerRightBlock}>
            {/* Valuation Inline Editor */}
            <div className={styles.valuationBlock}>
              <span className={styles.valLabel}>Valuation:</span>
              {isEditingValuation ? (
                <input
                  type="number"
                  className={styles.valEditInput}
                  value={valuationInput}
                  onChange={(e) => setValuationInput(e.target.value)}
                  onBlur={handleSaveValuation}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveValuation();
                    if (e.key === 'Escape') setIsEditingValuation(false);
                  }}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  className={styles.valDisplay}
                  onClick={() => setIsEditingValuation(true)}
                  title="Click to edit expected valuation"
                >
                  <span>{formatDealValuation(lead?.expected_value || 0)}</span>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
              )}
            </div>

            <button
              type="button"
              className={styles.closeButton}
              onClick={handleRequestClose}
              aria-label="Close dossier modal"
            >
              <span>✕</span>
              <kbd className={styles.escBadge}>Esc</kbd>
            </button>
          </div>
        </header>

        {/* Pinned Tab Bar (44px) */}
        <nav className={styles.tabsNav} aria-label="Dossier Tabs">
          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === 'overview' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview & Contact
          </button>
          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === 'brief' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('brief')}
          >
            Creative Brief
          </button>
          <button
            type="button"
            className={`${styles.tabItem} ${
              activeTab === 'activities' ? styles.tabItemActive : ''
            }`}
            onClick={() => setActiveTab('activities')}
          >
            Activity Ledger ({activities.length})
          </button>
          <button
            type="button"
            className={`${styles.tabItem} ${
              activeTab === 'touchpoint' ? styles.tabItemActive : ''
            }`}
            onClick={() => setActiveTab('touchpoint')}
          >
            + Log Touchpoint
          </button>
        </nav>

        {/* Scrollable Modal Content Body */}
        <div className={styles.modalBody}>
          {isLoading ? (
            <div className={styles.skeletonWrapper}>
              <div className={styles.skeletonLine} style={{ width: '60%' }} />
              <div className={styles.skeletonLine} style={{ width: '90%', height: '32px' }} />
              <div className={styles.skeletonLine} style={{ width: '75%' }} />
              <div className={styles.skeletonLine} style={{ width: '40%' }} />
              <div className={styles.skeletonLine} style={{ width: '85%', height: '80px' }} />
            </div>
          ) : fetchError ? (
            <div className={styles.emptyNotice}>
              <p style={{ color: '#ef4444' }}>{fetchError}</p>
              {leadId && (
                <button
                  type="button"
                  className={styles.saveNotesBtn}
                  onClick={() => loadDossier(leadId)}
                  style={{ marginTop: '0.75rem' }}
                >
                  Retry Dossier Load
                </button>
              )}
            </div>
          ) : lead ? (
            <>
              {/* Tab 1: Overview & Contact (2-Column Balanced Architecture) */}
              {activeTab === 'overview' && (
                <>
                  <div className={styles.overviewGrid}>
                    {/* Left Column: Contact Coordinates */}
                    <section className={styles.cardSection}>
                      <h3 className={styles.sectionHeading}>Contact Coordinates</h3>
                      <div className={styles.gridPairs}>
                        <div className={styles.dataPair}>
                          <span className={styles.pairLabel}>Telephone Coordinate</span>
                          <div className={styles.pairValue}>
                            {lead.phone ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <a href={`tel:${lead.phone}`} className={styles.clickableLink}>
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                  >
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                  </svg>
                                  <span>{lead.phone}</span>
                                </a>
                                {cleanPhone && (
                                  <a
                                    href={`https://wa.me/${cleanPhone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.whatsappLink}
                                    title="Open direct WhatsApp conversation"
                                  >
                                    WhatsApp
                                  </a>
                                )}
                              </span>
                            ) : (
                              <span style={{ color: '#71717a' }}>Not Provided</span>
                            )}
                          </div>
                        </div>

                        <div className={styles.dataPair}>
                          <span className={styles.pairLabel}>Email Address</span>
                          <div className={styles.pairValue}>
                            {lead.email ? (
                              <a href={`mailto:${lead.email}`} className={styles.clickableLink}>
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                  <polyline points="22,6 12,13 2,6" />
                                </svg>
                                <span>{lead.email}</span>
                              </a>
                            ) : (
                              <span style={{ color: '#71717a' }}>Not Provided</span>
                            )}
                          </div>
                        </div>

                        <div className={styles.dataPair}>
                          <span className={styles.pairLabel}>Service Category</span>
                          <div className={styles.pairValue}>
                            <span className={styles.briefTag}>{lead.service_category}</span>
                          </div>
                        </div>

                        <div className={styles.dataPair}>
                          <span className={styles.pairLabel}>Acquisition Channel</span>
                          <div className={styles.pairValue}>
                            <span
                              style={{
                                color: lead.lead_source_color || '#ff6100',
                                fontWeight: 600,
                              }}
                            >
                              ● {lead.lead_source_name || 'Website Direct'}
                            </span>
                          </div>
                        </div>

                        <div className={styles.dataPair}>
                          <span className={styles.pairLabel}>Preferred Channel</span>
                          <div className={styles.pairValue}>{lead.preferred_channel}</div>
                        </div>

                        <div className={styles.dataPair}>
                          <span className={styles.pairLabel}>Deal Priority</span>
                          <div className={styles.pairValue}>
                            <span
                              style={{
                                color:
                                  lead.priority === 'High'
                                    ? '#ef4444'
                                    : lead.priority === 'Medium'
                                    ? '#f59e0b'
                                    : '#10b981',
                                fontWeight: 600,
                              }}
                            >
                              {lead.priority} Priority
                            </span>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Right Column: Account Assignment & Governance */}
                    <section className={styles.cardSection}>
                      <h3 className={styles.sectionHeading}>Account Assignment & Controls</h3>
                      <div className={styles.dataPair}>
                        <span className={styles.pairLabel}>Assigned Representative</span>
                        {canReassign ? (
                          <select
                            className={styles.ownerSelect}
                            value={lead.assigned_to || ''}
                            disabled={isReassigning}
                            onChange={(e) => handleReassign(e.target.value)}
                          >
                            <option value="">Select Representative...</option>
                            {teamAssignees.map((assignee) => (
                              <option key={assignee.id} value={assignee.id}>
                                {assignee.fullName} ({assignee.role.replace('_', ' ')})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={styles.pairValue}>{lead.assignee_name}</span>
                        )}
                      </div>

                      <div className={styles.dataPair}>
                        <span className={styles.pairLabel}>Stage Name</span>
                        <div className={styles.pairValue}>
                          <span style={{ color: lead.status_color || '#ff6100', fontWeight: 600 }}>
                            ● {lead.status_name}
                          </span>
                        </div>
                      </div>

                      <div className={styles.dataPair}>
                        <span className={styles.pairLabel}>Registered On</span>
                        <span className={styles.pairValue}>
                          {new Date(lead.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </section>
                  </div>

                  {/* Full-Width Row: Commercial Notes & Strategic Directives */}
                  <section className={styles.cardSection}>
                    <h3 className={styles.sectionHeading}>Commercial Notes & Directives</h3>
                    <textarea
                      className={styles.notesTextarea}
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveNotes();
                        }
                      }}
                      placeholder="Enter internal deal notes, executive context, or client preferences..."
                      rows={4}
                    />
                    <div className={styles.notesFooterRow}>
                      <span className={styles.notesShortcutHint}>
                        Press <strong>⌘ + Enter</strong> or <strong>Ctrl + Enter</strong> to save
                      </span>
                      <button
                        type="button"
                        className={styles.saveNotesBtn}
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes || notesInput === (lead.notes || '')}
                      >
                        {isSavingNotes ? 'Saving Notes...' : 'Save Notes'}
                      </button>
                    </div>
                  </section>
                </>
              )}

              {/* Tab 2: Creative Brief */}
              {activeTab === 'brief' && (
                <section className={styles.briefCard}>
                  {hasBriefContent ? (
                    <>
                      {briefTimeline && (
                        <div className={styles.briefBlock}>
                          <span className={styles.briefLabel}>Timeline & Target Launch</span>
                          <div className={styles.briefContent}>{briefTimeline}</div>
                        </div>
                      )}

                      {briefBudget && (
                        <div className={styles.briefBlock}>
                          <span className={styles.briefLabel}>Budget Bracket</span>
                          <div className={styles.briefContent}>{briefBudget}</div>
                        </div>
                      )}

                      {briefServices && (
                        <div className={styles.briefBlock}>
                          <span className={styles.briefLabel}>Requested Services</span>
                          <div className={styles.briefTagList}>
                            {Array.isArray(briefServices) ? (
                              briefServices.map((srv, idx) => (
                                <span key={idx} className={styles.briefTag}>
                                  {srv}
                                </span>
                              ))
                            ) : (
                              <span className={styles.briefTag}>{String(briefServices)}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {briefScope && (
                        <div className={styles.briefBlock}>
                          <span className={styles.briefLabel}>Project Scope & Goals</span>
                          <div className={styles.briefContent}>{briefScope}</div>
                        </div>
                      )}

                      {briefNotes && (
                        <div className={styles.briefBlock}>
                          <span className={styles.briefLabel}>Client Notes & Specifications</span>
                          <div className={styles.briefContent}>{briefNotes}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.emptyNotice}>
                      <p>
                        No creative brief payload attached to this inquiry. Ingestion occurred via
                        manual CRM workspace drawer or direct phone capture.
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* Tab 3: Activity & Communication Ledger */}
              {activeTab === 'activities' && (
                <section className={styles.cardSection}>
                  <h3 className={styles.sectionHeading}>Chronological Audit Trail</h3>
                  {activities.length === 0 ? (
                    <div className={styles.emptyNotice}>
                      <span>No communication events or stage advances recorded yet.</span>
                    </div>
                  ) : (
                    <div className={styles.activityFeed}>
                      {activities.map((act) => (
                        <div key={act.id} className={styles.activityItem}>
                          <div className={styles.activityMeta}>
                            <span className={styles.actorName}>{act.actor_name}</span>
                            <span>·</span>
                            <span className={styles.activityTime}>
                              {new Date(act.created_at).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className={styles.activityDesc}>{act.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Tab 4: Fast Touchpoint Logger */}
              {activeTab === 'touchpoint' && (
                <form className={styles.touchpointForm} onSubmit={handleLogTouchpoint}>
                  <h3 className={styles.sectionHeading}>Fast Omnichannel Logger</h3>

                  <div className={styles.radioGroup}>
                    <label
                      className={`${styles.radioLabel} ${
                        touchpointType === 'call_logged' ? styles.radioLabelActive : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="touchpointType"
                        value="call_logged"
                        checked={touchpointType === 'call_logged'}
                        onChange={() => setTouchpointType('call_logged')}
                      />
                      <span>Call Logged</span>
                    </label>

                    <label
                      className={`${styles.radioLabel} ${
                        touchpointType === 'whatsapp_sent' ? styles.radioLabelActive : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="touchpointType"
                        value="whatsapp_sent"
                        checked={touchpointType === 'whatsapp_sent'}
                        onChange={() => setTouchpointType('whatsapp_sent')}
                      />
                      <span>WhatsApp Sent</span>
                    </label>

                    <label
                      className={`${styles.radioLabel} ${
                        touchpointType === 'meeting_notes' ? styles.radioLabelActive : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="touchpointType"
                        value="meeting_notes"
                        checked={touchpointType === 'meeting_notes'}
                        onChange={() => setTouchpointType('meeting_notes')}
                      />
                      <span>Meeting Held</span>
                    </label>

                    <label
                      className={`${styles.radioLabel} ${
                        touchpointType === 'note_added' ? styles.radioLabelActive : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="touchpointType"
                        value="note_added"
                        checked={touchpointType === 'note_added'}
                        onChange={() => setTouchpointType('note_added')}
                      />
                      <span>Internal Note</span>
                    </label>
                  </div>

                  <div className={styles.dataPair}>
                    <span className={styles.pairLabel}>Interaction Notes</span>
                    <textarea
                      className={styles.notesTextarea}
                      value={touchpointNote}
                      onChange={(e) => setTouchpointNote(e.target.value)}
                      placeholder="Document conversation summary, client requirements, pricing pushback, or agreements..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className={styles.dataPair}>
                    <span className={styles.pairLabel}>Schedule Next Follow-up (Optional)</span>
                    <input
                      type="datetime-local"
                      className={styles.touchpointInput}
                      value={touchpointFollowUp}
                      onChange={(e) => setTouchpointFollowUp(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.logTouchpointBtn}
                    disabled={isLoggingTouchpoint || !touchpointNote.trim()}
                  >
                    {isLoggingTouchpoint ? 'Logging...' : 'Log Touchpoint'}
                  </button>
                </form>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Accidental Dismissal Modal */}
      {showDiscardModal && (
        <div className={styles.discardModalOverlay}>
          <div className={styles.discardModal} role="alertdialog">
            <h4 className={styles.discardTitle}>Unsaved Touchpoint Note</h4>
            <p className={styles.discardText}>
              You have entered notes in the Touchpoint Logger that have not been logged. Closing the
              dossier will discard these modifications.
            </p>
            <div className={styles.discardActions}>
              <button
                type="button"
                className={styles.cancelDiscardBtn}
                onClick={() => setShowDiscardModal(false)}
              >
                Continue Editing
              </button>
              <button
                type="button"
                className={styles.confirmDiscardBtn}
                onClick={() => {
                  setShowDiscardModal(false);
                  setTouchpointNote('');
                  setTouchpointFollowUp('');
                  onClose();
                }}
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
