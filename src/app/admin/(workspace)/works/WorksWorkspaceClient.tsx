'use client';

/**
 * @file WorksWorkspaceClient.tsx
 * @description Interactive Client Component for Client Works & Project Deliverables (/admin/works).
 *              Displays post-conversion creative engagements with an interactive milestone completion
 *              checklist, dynamic production stage progression, operational delivery health status controls,
 *              and administrative directorial assignment governance (Creative Lead, Technical Lead).
 *              Enforces sub-16ms optimistic UI updates with resilient single-item rollback.
 * @module app/admin/(workspace)/works/WorksWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { ClientWorkItem, ClientWorkDeliveryStage, ClientWorkHealthStatus } from '@/types/crm';
import {
  updateClientWorkMilestoneAction,
  updateClientWorkStageAction,
  updateClientWorkHealthAction,
  assignClientWorkDirectorsAction,
} from '@/app/actions/works';
import styles from './WorksWorkspaceClient.module.scss';

interface WorksWorkspaceClientProps {
  initialWorks: ClientWorkItem[];
  userRole?: string;
  profiles?: Array<{ id: string; full_name: string; email?: string; role?: string }>;
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

const STAGE_OPTIONS: Array<{ key: ClientWorkDeliveryStage; label: string }> = [
  { key: 'kickoff', label: '1. Kickoff & Alignment' },
  { key: 'strategy', label: '2. Brand Strategy' },
  { key: 'design_ui_ux', label: '3. UI/UX Design' },
  { key: 'development', label: '4. Production Build' },
  { key: 'review_qa', label: '5. Client QA & Review' },
  { key: 'delivered', label: '6. Delivered & Complete' },
];

const HEALTH_LABELS: Record<ClientWorkHealthStatus, { label: string; className: string }> = {
  on_track: { label: 'On Track', className: styles.healthOnTrack },
  at_risk: { label: 'At Risk', className: styles.healthAtRisk },
  blocked: { label: 'Blocked', className: styles.healthBlocked },
  completed: { label: 'Delivered', className: styles.healthCompleted },
};

export function WorksWorkspaceClient({
  initialWorks,
  userRole,
  profiles = [],
}: WorksWorkspaceClientProps): React.ReactElement {
  const [works, setWorks] = useState<ClientWorkItem[]>(initialWorks);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHealth, setSelectedHealth] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);

  // Directorial Assignment Dialog State
  const [assigningWork, setAssigningWork] = useState<ClientWorkItem | null>(null);
  const [selectedCreativeLead, setSelectedCreativeLead] = useState<string>('');
  const [selectedTechLead, setSelectedTechLead] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Synchronize state when server hydration updates
  useEffect(() => {
    setWorks(initialWorks);
  }, [initialWorks]);

  const isViewer = userRole === 'viewer';
  const canAssignDirectors = userRole === 'admin' || userRole === 'sales_manager';

  const filteredWorks = useMemo(() => {
    return works.filter((work) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        work.client_name.toLowerCase().includes(q) ||
        work.project_code.toLowerCase().includes(q) ||
        (work.company && work.company.toLowerCase().includes(q)) ||
        work.service_scope.toLowerCase().includes(q);

      const matchesHealth = selectedHealth === 'all' || work.health_status === selectedHealth;
      const matchesStage = selectedStage === 'all' || work.delivery_stage === selectedStage;

      return matchesSearch && matchesHealth && matchesStage;
    });
  }, [works, searchTerm, selectedHealth, selectedStage]);

  /**
   * Toggles milestone status between pending and completed with single-item rollback.
   */
  const handleToggleMilestone = useCallback(
    async (workId: string, milestoneId: string, currentStatus: string): Promise<void> => {
      if (isViewer) return;

      const currentItem = works.find((w) => w.id === workId);
      if (!currentItem) return;
      const previousMilestones = currentItem.milestones;

      const nextStatus: 'pending' | 'completed' =
        currentStatus === 'completed' ? 'pending' : 'completed';

      // Targeted optimistic update
      setWorks((prev) =>
        prev.map((item) => {
          if (item.id !== workId) return item;
          const updatedMilestones = item.milestones.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  status: nextStatus,
                  completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
                }
              : m
          );
          return {
            ...item,
            milestones: updatedMilestones,
          };
        })
      );

      const result = await updateClientWorkMilestoneAction({
        workId,
        milestoneId,
        status: nextStatus,
      });

      if (!result.success) {
        // Targeted rollback for this project only
        setWorks((prev) =>
          prev.map((item) =>
            item.id === workId ? { ...item, milestones: previousMilestones } : item
          )
        );
        console.error('[WorksWorkspaceClient] Milestone update failed:', result.error);
      }
    },
    [works, isViewer]
  );

  /**
   * Updates delivery stage for a client work with single-item rollback.
   */
  const handleChangeStage = useCallback(
    async (workId: string, newStage: ClientWorkDeliveryStage): Promise<void> => {
      if (isViewer) return;

      const currentItem = works.find((w) => w.id === workId);
      if (!currentItem) return;
      const previousStage = currentItem.delivery_stage;
      const previousHealth = currentItem.health_status;

      // Targeted optimistic update
      setWorks((prev) =>
        prev.map((item) => {
          if (item.id !== workId) return item;
          return {
            ...item,
            delivery_stage: newStage,
            health_status: newStage === 'delivered' ? 'completed' : item.health_status,
          };
        })
      );

      const result = await updateClientWorkStageAction({
        workId,
        stage: newStage,
      });

      if (!result.success) {
        // Targeted rollback
        setWorks((prev) =>
          prev.map((item) =>
            item.id === workId
              ? { ...item, delivery_stage: previousStage, health_status: previousHealth }
              : item
          )
        );
        console.error('[WorksWorkspaceClient] Stage transition failed:', result.error);
      }
    },
    [works, isViewer]
  );

  /**
   * Updates operational health status for a client work with single-item rollback.
   */
  const handleChangeHealth = useCallback(
    async (workId: string, newHealth: ClientWorkHealthStatus): Promise<void> => {
      if (isViewer) return;

      const currentItem = works.find((w) => w.id === workId);
      if (!currentItem) return;
      const previousHealth = currentItem.health_status;

      // Targeted optimistic update
      setWorks((prev) =>
        prev.map((item) => {
          if (item.id !== workId) return item;
          return {
            ...item,
            health_status: newHealth,
          };
        })
      );

      const result = await updateClientWorkHealthAction({
        workId,
        healthStatus: newHealth,
      });

      if (!result.success) {
        // Targeted rollback
        setWorks((prev) =>
          prev.map((item) =>
            item.id === workId ? { ...item, health_status: previousHealth } : item
          )
        );
        console.error('[WorksWorkspaceClient] Health status update failed:', result.error);
      }
    },
    [works, isViewer]
  );

  const handleOpenDirectorModal = (work: ClientWorkItem): void => {
    setAssigningWork(work);
    setSelectedCreativeLead(work.creative_lead_id || '');
    setSelectedTechLead(work.tech_lead_id || '');
    setAssignError(null);
  };

  const handleSaveDirectors = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!assigningWork) return;

    setIsAssigning(true);
    setAssignError(null);

    const cLeadId = selectedCreativeLead ? selectedCreativeLead : null;
    const tLeadId = selectedTechLead ? selectedTechLead : null;

    const res = await assignClientWorkDirectorsAction({
      workId: assigningWork.id,
      creativeLeadId: cLeadId,
      techLeadId: tLeadId,
    });

    setIsAssigning(false);

    if (!res.success) {
      setAssignError(res.error || 'Failed to assign project directors.');
    } else {
      const cLead = profiles.find((p) => p.id === cLeadId);
      const tLead = profiles.find((p) => p.id === tLeadId);

      setWorks((prev) =>
        prev.map((item) =>
          item.id === assigningWork.id
            ? {
                ...item,
                creative_lead_id: cLeadId,
                tech_lead_id: tLeadId,
                creative_lead: cLead ? { full_name: cLead.full_name } : null,
                tech_lead: tLead ? { full_name: tLead.full_name } : null,
              }
            : item
        )
      );
      setAssigningWork(null);
    }
  };

  return (
    <div className={styles.clientContainer}>
      {/* Search & Filter Toolbar */}
      <div className={styles.toolbar}>
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
            placeholder="Search projects by client, project code (PRJ-1001), or scope..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filterPills}>
          <button
            type="button"
            className={`${styles.filterPill} ${selectedHealth === 'all' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedHealth('all')}
          >
            All Projects ({works.length})
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${selectedHealth === 'on_track' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedHealth('on_track')}
          >
            On Track
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${selectedHealth === 'at_risk' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedHealth('at_risk')}
          >
            At Risk
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${selectedHealth === 'completed' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedHealth('completed')}
          >
            Delivered
          </button>
        </div>

        <div className={styles.stageFilterGroup}>
          <span className={styles.filterLabel}>Stage:</span>
          {[
            { key: 'all', label: 'All' },
            { key: 'kickoff', label: 'Kickoff' },
            { key: 'strategy', label: 'Strategy' },
            { key: 'design_ui_ux', label: 'UI/UX' },
            { key: 'development', label: 'Development' },
            { key: 'review_qa', label: 'QA' },
            { key: 'delivered', label: 'Delivered' },
          ].map((stg) => (
            <button
              key={stg.key}
              type="button"
              className={`${styles.stagePillBtn} ${selectedStage === stg.key ? styles.stagePillBtnActive : ''}`}
              onClick={() => setSelectedStage(stg.key)}
            >
              {stg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Client Works Deliverable Cards */}
      {filteredWorks.length === 0 ? (
        <div className={styles.emptyCard}>
          <p className={styles.emptyTitle}>No matching client engagements</p>
          <p className={styles.emptySub}>
            Adjust your search query or stage filters to review active delivery contracts.
          </p>
        </div>
      ) : (
        <div className={styles.worksGrid}>
          {filteredWorks.map((work) => {
            const healthConfig = HEALTH_LABELS[work.health_status] || HEALTH_LABELS.on_track;
            const completedMilestones = work.milestones.filter((m) => m.status === 'completed').length;
            const totalMilestones = work.milestones.length;
            const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
            const isMilestoneExpanded = expandedWorkId === work.id;

            return (
              <article key={work.id} className={styles.workCard}>
                {/* Top Card Identity Bar */}
                <div className={styles.cardHeader}>
                  <div className={styles.projectIdentity}>
                    <span className={styles.projectCode}>{work.project_code}</span>
                    <span className={styles.contractValue}>{formatCurrency(work.contract_value)}</span>
                  </div>

                  <div className={styles.healthSelectWrapper}>
                    {isViewer ? (
                      <span className={`${styles.healthBadge} ${healthConfig.className}`}>
                        <span className={styles.statusDot} />
                        {healthConfig.label}
                      </span>
                    ) : (
                      <select
                        className={`${styles.healthSelect} ${healthConfig.className}`}
                        value={work.health_status}
                        onChange={(e) => handleChangeHealth(work.id, e.target.value as ClientWorkHealthStatus)}
                        aria-label={`Update operational health for ${work.project_code}`}
                      >
                        <option value="on_track">On Track</option>
                        <option value="at_risk">At Risk</option>
                        <option value="blocked">Blocked</option>
                        <option value="completed">Delivered</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Client & Scope Description */}
                <div className={styles.clientDetails}>
                  <h3 className={styles.clientTitle}>{work.client_name}</h3>
                  <span className={styles.companyName}>{work.company || 'Private Account'}</span>
                  <span className={styles.serviceScope}>{work.service_scope}</span>
                </div>

                {/* Production Stage Selector & Progress Bar */}
                <div className={styles.stageBlock}>
                  <div className={styles.stageHeaderRow}>
                    <div className={styles.stageLabelArea}>
                      <span className={styles.stageCaption}>Production Stage</span>
                    </div>

                    {isViewer ? (
                      <span className={styles.stageReadout}>
                        {STAGE_OPTIONS.find((s) => s.key === work.delivery_stage)?.label || work.delivery_stage}
                      </span>
                    ) : (
                      <select
                        className={styles.stageSelect}
                        value={work.delivery_stage}
                        onChange={(e) => handleChangeStage(work.id, e.target.value as ClientWorkDeliveryStage)}
                        aria-label={`Advance production delivery stage for ${work.project_code}`}
                      >
                        {STAGE_OPTIONS.map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Milestone Progress Meter */}
                  <div className={styles.meterContainer}>
                    <div className={styles.meterTrack}>
                      <div
                        className={styles.meterFill}
                        style={{ width: `${progressPercent}%` }}
                        aria-valuenow={progressPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Milestone completion progress"
                        role="progressbar"
                      />
                    </div>
                    <span className={styles.meterText}>
                      {completedMilestones}/{totalMilestones} Milestones ({progressPercent}%)
                    </span>
                  </div>
                </div>

                {/* Interactive Milestone Completion Checklist */}
                <div className={styles.milestonesContainer}>
                  <div className={styles.milestonesHeader}>
                    <span className={styles.milestonesSectionTitle}>Milestone Deliverables</span>
                    <button
                      type="button"
                      className={styles.stagePillBtn}
                      onClick={() => setExpandedWorkId(isMilestoneExpanded ? null : work.id)}
                      aria-expanded={isMilestoneExpanded}
                    >
                      {isMilestoneExpanded ? 'Hide Checklist' : `Checklist (${completedMilestones}/${totalMilestones})`}
                    </button>
                  </div>

                  {isMilestoneExpanded && (
                    <div className={styles.milestonesList} role="group" aria-label="Milestone checklist">
                      {work.milestones.map((m) => {
                        const isCompleted = m.status === 'completed';
                        const isInProgress = m.status === 'in_progress';

                        return (
                          <div
                            key={m.id}
                            className={`${styles.milestoneItem} ${isCompleted ? styles.milestoneItemCompleted : ''}`}
                            onClick={() => handleToggleMilestone(work.id, m.id, m.status)}
                            role="checkbox"
                            aria-checked={isCompleted}
                            tabIndex={isViewer ? -1 : 0}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                handleToggleMilestone(work.id, m.id, m.status);
                              }
                            }}
                          >
                            <span
                              className={`${styles.milestoneCheckbox} ${
                                isCompleted
                                  ? styles.milestoneCheckboxChecked
                                  : isInProgress
                                  ? styles.milestoneCheckboxInProgress
                                  : ''
                              }`}
                              aria-hidden="true"
                            >
                              {isCompleted ? (
                                <svg
                                  viewBox="0 0 24 24"
                                  width="12"
                                  height="12"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : isInProgress ? (
                                <svg viewBox="0 0 24 24" width="8" height="8" fill="currentColor">
                                  <circle cx="12" cy="12" r="5" />
                                </svg>
                              ) : null}
                            </span>
                            <span
                              className={`${styles.milestoneTitle} ${
                                isCompleted ? styles.milestoneTitleCompleted : ''
                              }`}
                            >
                              {m.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Director Ownership Governance & Dates */}
                <div className={styles.cardFooter}>
                  <div className={styles.directorsArea}>
                    {work.creative_lead && (
                      <span className={styles.directorBadge} title="Creative Director">
                        CD: {work.creative_lead.full_name}
                      </span>
                    )}
                    {work.tech_lead && (
                      <span className={styles.directorBadge} title="Technical Director">
                        TD: {work.tech_lead.full_name}
                      </span>
                    )}
                    {!work.creative_lead && !work.tech_lead && (
                      <span className={styles.unassignedDirector}>Directors Pending</span>
                    )}
                    {canAssignDirectors && (
                      <button
                        type="button"
                        className={styles.assignDirectorsBtn}
                        onClick={() => handleOpenDirectorModal(work)}
                        aria-label={`Assign directors for ${work.project_code}`}
                      >
                        Assign
                      </button>
                    )}
                  </div>

                  <span className={styles.kickoffDate}>
                    Kickoff: {new Date(work.kickoff_date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Directorial Assignment Modal Dialog */}
      {assigningWork && (
        <div
          className={styles.directorModalBackdrop}
          onClick={() => setAssigningWork(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-directors-title"
        >
          <div
            className={styles.directorModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.directorModalHeader}>
              <h3 id="assign-directors-title" className={styles.directorModalTitle}>
                Assign Project Directors.
              </h3>
              <button
                type="button"
                className={styles.directorModalClose}
                onClick={() => setAssigningWork(null)}
                aria-label="Close dialog"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveDirectors} className={styles.directorModalBody}>
              <p className={styles.directorModalSubtitle}>
                {assigningWork.project_code} • {assigningWork.client_name} ({assigningWork.company || 'Private'})
              </p>

              {assignError && (
                <div className={styles.directorModalError} role="alert">
                  {assignError}
                </div>
              )}

              <div className={styles.directorFormGroup}>
                <label htmlFor="select-creative-director" className={styles.directorLabel}>
                  Creative Director
                </label>
                <select
                  id="select-creative-director"
                  className={styles.directorSelect}
                  value={selectedCreativeLead}
                  onChange={(e) => setSelectedCreativeLead(e.target.value)}
                  disabled={isAssigning}
                >
                  <option value="">Unassigned</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.directorFormGroup}>
                <label htmlFor="select-technical-director" className={styles.directorLabel}>
                  Technical Director
                </label>
                <select
                  id="select-technical-director"
                  className={styles.directorSelect}
                  value={selectedTechLead}
                  onChange={(e) => setSelectedTechLead(e.target.value)}
                  disabled={isAssigning}
                >
                  <option value="">Unassigned</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.directorModalActions}>
                <button
                  type="button"
                  className={styles.directorCancelBtn}
                  onClick={() => setAssigningWork(null)}
                  disabled={isAssigning}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.directorSubmitBtn}
                  disabled={isAssigning}
                >
                  {isAssigning ? 'Saving...' : 'Save Directors'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
