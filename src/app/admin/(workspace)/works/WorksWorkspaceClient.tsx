'use client';

/**
 * @file WorksWorkspaceClient.tsx
 * @description Interactive Client Component for Client Works & Project Deliverables (/admin/works).
 *              Displays post-conversion creative engagements with an interactive milestone completion
 *              checklist, dynamic production stage progression, and operational delivery health status controls.
 *              Enforces sub-16ms optimistic UI updates with resilient Server Action reconciliation.
 * @module app/admin/(workspace)/works/WorksWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { ClientWorkItem, ClientWorkDeliveryStage, ClientWorkHealthStatus } from '@/types/crm';
import {
  updateClientWorkMilestoneAction,
  updateClientWorkStageAction,
  updateClientWorkHealthAction,
} from '@/app/actions/works';
import styles from './WorksWorkspaceClient.module.scss';

interface WorksWorkspaceClientProps {
  initialWorks: ClientWorkItem[];
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

export function WorksWorkspaceClient({ initialWorks }: WorksWorkspaceClientProps): React.ReactElement {
  const [works, setWorks] = useState<ClientWorkItem[]>(initialWorks);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHealth, setSelectedHealth] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);

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
   * Toggles milestone status between pending and completed.
   */
  const handleToggleMilestone = useCallback(
    async (workId: string, milestoneId: string, currentStatus: string): Promise<void> => {
      const nextStatus: 'pending' | 'completed' =
        currentStatus === 'completed' ? 'pending' : 'completed';

      // Optimistic update
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
        // Rollback on failure
        setWorks(initialWorks);
        console.error('[WorksWorkspaceClient] Milestone update failed:', result.error);
      }
    },
    [initialWorks]
  );

  /**
   * Updates delivery stage for a client work.
   */
  const handleChangeStage = useCallback(
    async (workId: string, newStage: ClientWorkDeliveryStage): Promise<void> => {
      // Optimistic update
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
        setWorks(initialWorks);
        console.error('[WorksWorkspaceClient] Stage transition failed:', result.error);
      }
    },
    [initialWorks]
  );

  /**
   * Updates operational health status for a client work.
   */
  const handleChangeHealth = useCallback(
    async (workId: string, newHealth: ClientWorkHealthStatus): Promise<void> => {
      // Optimistic update
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
        setWorks(initialWorks);
        console.error('[WorksWorkspaceClient] Health status update failed:', result.error);
      }
    },
    [initialWorks]
  );

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

      {/* Projects Grid */}
      {filteredWorks.length === 0 ? (
        <div className={styles.emptyCard}>
          <p className={styles.emptyTitle}>No active client projects match your filters.</p>
          <p className={styles.emptySub}>
            Projects are automatically instantiated when commercial opportunities reach the Converted stage.
          </p>
        </div>
      ) : (
        <div className={styles.worksGrid}>
          {filteredWorks.map((work) => {
            const healthMeta = HEALTH_LABELS[work.health_status] || HEALTH_LABELS.on_track;
            const completedMilestones = work.milestones.filter((m) => m.status === 'completed').length;
            const totalMilestones = work.milestones.length || 5;
            const progressPercent =
              totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
            const isMilestoneExpanded = expandedWorkId === work.id;

            return (
              <article key={work.id} className={styles.workCard}>
                {/* Card Header with Interactive Health Selector */}
                <div className={styles.cardHeader}>
                  <div className={styles.projectIdentity}>
                    <span className={styles.projectCode}>{work.project_code}</span>
                    <select
                      className={styles.healthSelect}
                      value={work.health_status}
                      onChange={(e) =>
                        handleChangeHealth(work.id, e.target.value as ClientWorkHealthStatus)
                      }
                      aria-label="Update operational health status"
                    >
                      <option value="on_track">● On Track</option>
                      <option value="at_risk">● At Risk</option>
                      <option value="blocked">● Blocked</option>
                      <option value="completed">● Delivered</option>
                    </select>
                  </div>
                  <span className={styles.contractValue}>{formatCurrency(work.contract_value)}</span>
                </div>

                {/* Client & Scope Details */}
                <div className={styles.clientDetails}>
                  <h2 className={styles.clientTitle}>{work.client_name}</h2>
                  <span className={styles.companyName}>{work.company || 'Private Account'}</span>
                  <span className={styles.serviceScope}>{work.service_scope}</span>
                </div>

                {/* Current Stage Strip with Interactive Stage Selector */}
                <div className={styles.stageBlock}>
                  <div className={styles.stageHeaderRow}>
                    <div className={styles.stageLabelArea}>
                      <span className={styles.stageCaption}>Active Production Stage</span>
                    </div>
                    <select
                      className={styles.stageSelect}
                      value={work.delivery_stage}
                      onChange={(e) =>
                        handleChangeStage(work.id, e.target.value as ClientWorkDeliveryStage)
                      }
                      aria-label="Update delivery stage"
                    >
                      {STAGE_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
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
                            tabIndex={0}
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
                              {isCompleted ? '✓' : isInProgress ? '•' : ''}
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

                {/* Director Ownership & Dates */}
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
    </div>
  );
}
