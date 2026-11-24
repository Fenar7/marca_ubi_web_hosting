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

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import Link from 'next/link';
import type {
  ClientWorkItem,
  ClientWorkDeliveryStage,
  ClientWorkHealthStatus,
} from '@/types/crm';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
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
  profiles?: Array<{
    id: string;
    full_name: string;
    email?: string;
    role?: string;
  }>;
  directoryAvailable?: boolean;
  userId?: string;
  sample?: boolean;
  canOpenDeals?: boolean;
}

const STAGE_OPTIONS: Array<{ key: ClientWorkDeliveryStage; label: string }> = [
  { key: 'kickoff', label: 'Kickoff' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'design_ui_ux', label: 'Design' },
  { key: 'development', label: 'Development' },
  { key: 'review_qa', label: 'QA and review' },
  { key: 'delivered', label: 'Delivered' },
];

const HEALTH_LABELS: Record<ClientWorkHealthStatus, string> = {
  on_track: 'On track',
  at_risk: 'At risk',
  blocked: 'Blocked',
  completed: 'Completed',
};
const HEALTH_OPTIONS = Object.entries(HEALTH_LABELS);
const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const iconPath = {
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  calendar: 'M4 5h16v15H4zM4 10h16M8 3v4m8-4v4',
  chevron: 'm6 9 6 6 6-6',
  alert: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5v5m0 4h.01',
  folder:
    'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2M3 7v11a1 1 0 0 0 1 1h14l4-8H6l-3 7',
  search: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm4.5 11 5 5',
  close: 'm6 6 12 12M6 18 18 6',
};

function WorksIcon({
  name,
  size,
  className,
}: {
  name: keyof typeof iconPath;
  size: number;
  className?: string;
}): React.ReactElement {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={iconPath[name]} />
    </svg>
  );
}

/** Date-only delivery commitments use UTC so the displayed day survives hydration and timezone changes. */
function projectDate(value: string | null, fallback: string): React.ReactNode {
  const date = new Date(value ?? '');
  return Number.isFinite(date.getTime()) ? (
    <time dateTime={date.toISOString()}>{dateFormat.format(date)}</time>
  ) : (
    fallback
  );
}

/** Mirrors the server's role and portfolio gate for UI affordances. Server actions still authorize every write. */
function canEditProject(
  work: ClientWorkItem,
  role?: string,
  userId?: string,
  sample = false,
): boolean {
  return (
    !sample &&
    !!role &&
    role !== 'viewer' &&
    (role === 'admin' ||
      role === 'sales_manager' ||
      Boolean(
        userId &&
        (work.creative_lead_id === userId || work.tech_lead_id === userId),
      ))
  );
}

export function WorksWorkspaceClient({
  initialWorks,
  userRole,
  profiles = [],
  directoryAvailable = true,
  userId,
  sample = false,
  canOpenDeals = false,
}: WorksWorkspaceClientProps): React.ReactElement {
  const [works, setWorks] = useState<ClientWorkItem[]>(initialWorks);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHealth, setSelectedHealth] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);

  // Directorial Assignment Dialog State
  const [assigningWork, setAssigningWork] = useState<ClientWorkItem | null>(
    null,
  );
  const [selectedCreativeLead, setSelectedCreativeLead] = useState<string>('');
  const [selectedTechLead, setSelectedTechLead] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [workError, setWorkError] = useState<string | null>(null);
  const [pendingWorks, setPendingWorks] = useState<Set<string>>(new Set());
  const pendingRef = useRef(new Set<string>());

  // Serialize updates per project so a failed optimistic write cannot undo a later change.
  const beginUpdate = useCallback((workId: string): boolean => {
    if (pendingRef.current.has(workId)) return false;
    pendingRef.current.add(workId);
    setPendingWorks(new Set(pendingRef.current));
    setWorkError(null);
    return true;
  }, []);
  const endUpdate = useCallback((workId: string): void => {
    pendingRef.current.delete(workId);
    setPendingWorks(new Set(pendingRef.current));
  }, []);

  // Synchronize state when server hydration updates
  useEffect(() => {
    setWorks(initialWorks);
  }, [initialWorks]);

  const directorDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = directorDialog.current;
    if (assigningWork && dialog && !dialog.open) dialog.showModal();
  }, [assigningWork]);
  const canAssignDirectors =
    !sample &&
    directoryAvailable &&
    (userRole === 'admin' || userRole === 'sales_manager');
  const hasFilters = Boolean(
    searchTerm.trim() || selectedHealth !== 'all' || selectedStage !== 'all',
  );
  const attention = [
    ...works.filter((work) => work.health_status === 'blocked'),
    ...works.filter((work) => work.health_status === 'at_risk'),
  ];

  const filteredWorks = useMemo(() => {
    return works.filter((work) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        work.client_name.toLowerCase().includes(q) ||
        work.project_code.toLowerCase().includes(q) ||
        (work.company && work.company.toLowerCase().includes(q)) ||
        work.service_scope.toLowerCase().includes(q);

      const matchesHealth =
        selectedHealth === 'all' || work.health_status === selectedHealth;
      const matchesStage =
        selectedStage === 'all' || work.delivery_stage === selectedStage;

      return matchesSearch && matchesHealth && matchesStage;
    });
  }, [works, searchTerm, selectedHealth, selectedStage]);

  const deliverySummary = useMemo(
    () => ({
      loaded: works.length,
      delivered: works.filter((work) => work.health_status === 'completed')
        .length,
    }),
    [works],
  );

  /**
   * Toggles milestone status between pending and completed with single-item rollback.
   */
  const handleToggleMilestone = useCallback(
    async (
      workId: string,
      milestoneId: string,
      currentStatus: string,
    ): Promise<void> => {
      const currentItem = works.find((w) => w.id === workId);
      if (
        !currentItem ||
        !canEditProject(currentItem, userRole, userId, sample) ||
        !beginUpdate(workId)
      )
        return;
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
                  completed_at:
                    nextStatus === 'completed'
                      ? new Date().toISOString()
                      : null,
                }
              : m,
          );
          return {
            ...item,
            milestones: updatedMilestones,
          };
        }),
      );

      const result = await updateClientWorkMilestoneAction({
        workId,
        milestoneId,
        status: nextStatus,
      }).catch((error: unknown) => {
        console.error('[works] Milestone update failed:', error);
        return {
          success: false,
          error: 'Unable to update this milestone. Please try again.',
        };
      });

      if (!result.success) {
        // Targeted rollback for this project only
        setWorks((prev) =>
          prev.map((item) =>
            item.id === workId
              ? { ...item, milestones: previousMilestones }
              : item,
          ),
        );
        console.error(
          '[WorksWorkspaceClient] Milestone update failed:',
          result.error,
        );
        setWorkError(
          result.error || 'Unable to update this milestone. Please try again.',
        );
      }
      endUpdate(workId);
    },
    [works, userRole, userId, sample, beginUpdate, endUpdate],
  );

  /**
   * Updates delivery stage for a client work with single-item rollback.
   */
  const handleChangeStage = useCallback(
    async (
      workId: string,
      newStage: ClientWorkDeliveryStage,
    ): Promise<void> => {
      const currentItem = works.find((w) => w.id === workId);
      if (
        !currentItem ||
        !canEditProject(currentItem, userRole, userId, sample) ||
        !beginUpdate(workId)
      )
        return;
      const previousStage = currentItem.delivery_stage;
      const previousHealth = currentItem.health_status;

      // Targeted optimistic update
      setWorks((prev) =>
        prev.map((item) => {
          if (item.id !== workId) return item;
          return {
            ...item,
            delivery_stage: newStage,
            health_status:
              newStage === 'delivered' ? 'completed' : item.health_status,
          };
        }),
      );

      const result = await updateClientWorkStageAction({
        workId,
        stage: newStage,
      }).catch((error: unknown) => {
        console.error('[works] Stage update failed:', error);
        return {
          success: false,
          error: 'Unable to update the project stage. Please try again.',
        };
      });

      if (!result.success) {
        // Targeted rollback
        setWorks((prev) =>
          prev.map((item) =>
            item.id === workId
              ? {
                  ...item,
                  delivery_stage: previousStage,
                  health_status: previousHealth,
                }
              : item,
          ),
        );
        console.error(
          '[WorksWorkspaceClient] Stage transition failed:',
          result.error,
        );
        setWorkError(
          result.error ||
            'Unable to update the project stage. Please try again.',
        );
      }
      endUpdate(workId);
    },
    [works, userRole, userId, sample, beginUpdate, endUpdate],
  );

  /**
   * Updates operational health status for a client work with single-item rollback.
   */
  const handleChangeHealth = useCallback(
    async (
      workId: string,
      newHealth: ClientWorkHealthStatus,
    ): Promise<void> => {
      const currentItem = works.find((w) => w.id === workId);
      if (
        !currentItem ||
        !canEditProject(currentItem, userRole, userId, sample) ||
        !beginUpdate(workId)
      )
        return;
      const previousHealth = currentItem.health_status;

      // Targeted optimistic update
      setWorks((prev) =>
        prev.map((item) => {
          if (item.id !== workId) return item;
          return {
            ...item,
            health_status: newHealth,
          };
        }),
      );

      const result = await updateClientWorkHealthAction({
        workId,
        healthStatus: newHealth,
      }).catch((error: unknown) => {
        console.error('[works] Health update failed:', error);
        return {
          success: false,
          error: 'Unable to update project health. Please try again.',
        };
      });

      if (!result.success) {
        // Targeted rollback
        setWorks((prev) =>
          prev.map((item) =>
            item.id === workId
              ? { ...item, health_status: previousHealth }
              : item,
          ),
        );
        console.error(
          '[WorksWorkspaceClient] Health status update failed:',
          result.error,
        );
        setWorkError(
          result.error || 'Unable to update project health. Please try again.',
        );
      }
      endUpdate(workId);
    },
    [works, userRole, userId, sample, beginUpdate, endUpdate],
  );

  const handleOpenDirectorModal = (work: ClientWorkItem): void => {
    if (!canAssignDirectors) return;
    setAssigningWork(work);
    setSelectedCreativeLead(work.creative_lead_id || '');
    setSelectedTechLead(work.tech_lead_id || '');
    setAssignError(null);
  };

  const handleSaveDirectors = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!assigningWork || !canAssignDirectors || !beginUpdate(assigningWork.id))
      return;

    setIsAssigning(true);
    setAssignError(null);

    const cLeadId = selectedCreativeLead ? selectedCreativeLead : null;
    const tLeadId = selectedTechLead ? selectedTechLead : null;

    const res = await assignClientWorkDirectorsAction({
      workId: assigningWork.id,
      creativeLeadId: cLeadId,
      techLeadId: tLeadId,
    }).catch((error: unknown) => {
      console.error('[works] Director assignment failed:', error);
      return {
        success: false,
        error: 'Unable to assign directors. Please try again.',
      };
    });

    setIsAssigning(false);
    endUpdate(assigningWork.id);

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
            : item,
        ),
      );
      directorDialog.current?.close();
    }
  };

  /** Clear every list control in one operation so the filtered-empty state has a predictable recovery. */
  function resetFilters(): void {
    setSearchTerm('');
    setSelectedHealth('all');
    setSelectedStage('all');
  }

  return (
    <div className={styles.clientContainer}>
      {sample && (
        <div className={styles.sampleBanner}>
          <span>
            <strong>Sample portfolio</strong> · Fictional projects, read-only
          </span>
          <Link href="/admin/works?sample=0">
            Back to live projects{' '}
            <WorksIcon name="arrow" size={14} aria-hidden="true" />
          </Link>
        </div>
      )}
      {workError && (
        <p className={styles.actionError} role="alert">
          {workError}
        </p>
      )}
      {works.length > 0 && (
        <section className={styles.overview} aria-label="Delivery overview">
          <div className={styles.pipeline}>
            <header>
              <h2>Delivery pipeline</h2>
              <span>
                {deliverySummary.loaded} loaded · {deliverySummary.delivered}{' '}
                completed
              </span>
            </header>
            <div className={styles.stageRail}>
              {STAGE_OPTIONS.map(({ key, label }) => {
                const count = works.filter(
                  (work) => work.delivery_stage === key,
                ).length;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selectedStage === key}
                    onClick={() =>
                      setSelectedStage(selectedStage === key ? 'all' : key)
                    }
                  >
                    <strong>{count}</strong>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <aside
            className={styles.attention}
            aria-labelledby="delivery-attention"
          >
            <h2 id="delivery-attention">
              <WorksIcon name="alert" size={17} aria-hidden="true" /> Needs
              attention <span>{attention.length}</span>
            </h2>
            {attention.length ? (
              <ul>
                {attention.slice(0, 3).map((work) => (
                  <li key={work.id}>
                    <button
                      type="button"
                      onClick={() => {
                        resetFilters();
                        setExpandedWorkId(work.id);
                        window.requestAnimationFrame(() => {
                          const trigger = document.getElementById(
                            'project-toggle-' + work.id,
                          );
                          trigger?.scrollIntoView({ block: 'nearest' });
                          trigger?.focus({ preventScroll: true });
                        });
                      }}
                    >
                      <span>{work.company || work.client_name}</span>
                      <span
                        className={styles.health}
                        data-health={work.health_status}
                      >
                        {HEALTH_LABELS[work.health_status]}
                      </span>
                      <WorksIcon name="arrow" size={15} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No blocked or at-risk projects.</p>
            )}
            {attention.length > 3 && (
              <div className={styles.attentionFilters}>
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    setSelectedHealth('blocked');
                  }}
                >
                  View blocked
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    setSelectedHealth('at_risk');
                  }}
                >
                  View at risk
                </button>
              </div>
            )}
          </aside>
        </section>
      )}

      <section className={styles.register} aria-labelledby="project-register">
        <header className={styles.registerHeading}>
          <h2 id="project-register">Projects</h2>
          <span role="status">
            {filteredWorks.length} of {works.length} shown
          </span>
        </header>
        {works.length > 0 && (
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <WorksIcon name="search" size={17} aria-hidden="true" />
              <span className={styles.srOnly}>Search projects</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search client, project, or scope"
              />
            </label>
            <div className={styles.filters}>
              <label>
                <span className={styles.srOnly}>Project health</span>
                <select
                  value={selectedHealth}
                  onChange={(event) => setSelectedHealth(event.target.value)}
                >
                  <option value="all">Any health</option>
                  {HEALTH_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={styles.srOnly}>Delivery stage</span>
                <select
                  value={selectedStage}
                  onChange={(event) => setSelectedStage(event.target.value)}
                >
                  <option value="all">All stages</option>
                  {STAGE_OPTIONS.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {hasFilters && (
                <button type="button" onClick={resetFilters}>
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {filteredWorks.length === 0 ? (
          <div className={styles.empty}>
            <WorksIcon name="folder" size={24} aria-hidden="true" />
            <h3>
              {hasFilters ? 'No matching projects' : 'No client projects yet'}
            </h3>
            <p>
              {hasFilters
                ? 'Try a different search or clear the filters.'
                : 'When a deal converts, its delivery project will appear here.'}
            </p>
            {hasFilters ? (
              <button type="button" onClick={resetFilters}>
                Clear filters
              </button>
            ) : (
              canOpenDeals && (
                <Link href="/admin/deals">
                  Open Deals{' '}
                  <WorksIcon name="arrow" size={16} aria-hidden="true" />
                </Link>
              )
            )}
          </div>
        ) : (
          <div className={styles.projectList}>
            {filteredWorks.map((work) => {
              const finished = work.milestones.filter(
                (milestone) => milestone.status === 'completed',
              ).length;
              const total = work.milestones.length;
              const stageLabel =
                STAGE_OPTIONS.find(({ key }) => key === work.delivery_stage)
                  ?.label ?? work.delivery_stage;
              const expanded = expandedWorkId === work.id;
              const editable = canEditProject(work, userRole, userId, sample);
              const busy = pendingWorks.has(work.id);
              const title = work.company || work.client_name;
              return (
                <article
                  key={work.id}
                  aria-label={title}
                  aria-busy={busy}
                  className={styles.project}
                >
                  <button
                    type="button"
                    id={'project-toggle-' + work.id}
                    className={styles.projectRow}
                    aria-expanded={expanded}
                    aria-controls={'project-panel-' + work.id}
                    onClick={() => setExpandedWorkId(expanded ? null : work.id)}
                  >
                    <span className={styles.projectIdentity}>
                      <span className={styles.projectCode}>
                        {work.project_code}
                      </span>
                      <strong>{title}</strong>
                      <span>{work.service_scope}</span>
                    </span>
                    <span className={styles.rowItem}>
                      <span>Stage</span>
                      <strong>{stageLabel}</strong>
                    </span>
                    <span className={styles.rowItem}>
                      <span>Health</span>
                      <strong
                        className={styles.health}
                        data-health={work.health_status}
                      >
                        {HEALTH_LABELS[work.health_status] || 'Unknown'}
                      </strong>
                    </span>
                    <span className={styles.rowItem}>
                      <span>Milestones</span>
                      <strong>
                        {total
                          ? finished + ' of ' + total + ' done'
                          : 'No milestones'}
                      </strong>
                    </span>
                    <span className={styles.rowItem}>
                      <span>
                        <WorksIcon
                          name="calendar"
                          size={14}
                          aria-hidden="true"
                        />{' '}
                        Target delivery
                      </span>
                      <strong>
                        {projectDate(work.target_delivery_date, 'Not set')}
                      </strong>
                    </span>
                    <WorksIcon
                      name="chevron"
                      className={styles.disclosureIcon}
                      size={18}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    id={'project-panel-' + work.id}
                    className={styles.projectPanel}
                    hidden={!expanded}
                  >
                    {expanded && (
                      <>
                        <section
                          className={styles.checklist}
                          aria-label="Milestones"
                        >
                          <h3>Milestones</h3>
                          {total ? (
                            <>
                              <progress
                                aria-label="Milestone completion"
                                max={total}
                                value={finished}
                              />
                              <ul>
                                {work.milestones.map((milestone) => (
                                  <li key={milestone.id}>
                                    {editable ? (
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked={
                                            milestone.status === 'completed'
                                          }
                                          disabled={busy}
                                          onChange={() =>
                                            void handleToggleMilestone(
                                              work.id,
                                              milestone.id,
                                              milestone.status,
                                            )
                                          }
                                        />
                                        {milestone.title}
                                      </label>
                                    ) : (
                                      <span>{milestone.title}</span>
                                    )}
                                    <span
                                      className={styles.milestoneStatus}
                                      data-status={milestone.status}
                                    >
                                      {milestone.status === 'completed'
                                        ? 'Done'
                                        : milestone.status === 'in_progress'
                                          ? 'In progress'
                                          : 'Pending'}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          ) : (
                            <p>No milestones have been recorded.</p>
                          )}
                        </section>
                        <section
                          className={styles.projectMeta}
                          aria-label="Project information"
                        >
                          <h3>Project information</h3>
                          <dl>
                            <div>
                              <dt>Client contact</dt>
                              <dd>{work.client_name}</dd>
                            </div>
                            <div>
                              <dt>Creative director</dt>
                              <dd>
                                {work.creative_lead?.full_name ??
                                  (work.creative_lead_id
                                    ? 'Name unavailable'
                                    : 'Unassigned')}
                              </dd>
                            </div>
                            <div>
                              <dt>Technical director</dt>
                              <dd>
                                {work.tech_lead?.full_name ??
                                  (work.tech_lead_id
                                    ? 'Name unavailable'
                                    : 'Unassigned')}
                              </dd>
                            </div>
                            <div>
                              <dt>Kickoff</dt>
                              <dd>
                                {projectDate(work.kickoff_date, 'Not set')}
                              </dd>
                            </div>
                            <div>
                              <dt>Contract value</dt>
                              <dd>{formatCrmCurrency(work.contract_value)}</dd>
                            </div>
                          </dl>
                          {editable && (
                            <div className={styles.editControls}>
                              <label>
                                Delivery stage
                                <select
                                  value={work.delivery_stage}
                                  disabled={busy}
                                  onChange={(event) =>
                                    void handleChangeStage(
                                      work.id,
                                      event.target
                                        .value as ClientWorkDeliveryStage,
                                    )
                                  }
                                >
                                  {STAGE_OPTIONS.map(({ key, label }) => (
                                    <option value={key} key={key}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Project health
                                <select
                                  value={work.health_status}
                                  disabled={busy}
                                  onChange={(event) =>
                                    void handleChangeHealth(
                                      work.id,
                                      event.target
                                        .value as ClientWorkHealthStatus,
                                    )
                                  }
                                >
                                  {HEALTH_OPTIONS.map(([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          )}
                          {canAssignDirectors && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleOpenDirectorModal(work)}
                            >
                              Assign directors
                            </button>
                          )}
                        </section>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <dialog
        ref={directorDialog}
        className={styles.directorDialog}
        aria-labelledby="assign-directors-title"
        onCancel={(event) => {
          if (isAssigning) event.preventDefault();
        }}
        onClose={() => setAssigningWork(null)}
      >
        {assigningWork && (
          <form onSubmit={handleSaveDirectors}>
            <header>
              <div>
                <h2 id="assign-directors-title">Assign directors</h2>
                <p>{assigningWork.company || assigningWork.client_name}</p>
              </div>
              <button
                type="button"
                disabled={isAssigning}
                onClick={() => directorDialog.current?.close()}
                aria-label="Close dialog"
              >
                <WorksIcon name="close" size={18} aria-hidden="true" />
              </button>
            </header>
            {assignError && (
              <p className={styles.actionError} role="alert">
                {assignError}
              </p>
            )}
            <label>
              Creative director
              <select
                value={selectedCreativeLead}
                onChange={(event) =>
                  setSelectedCreativeLead(event.target.value)
                }
                disabled={isAssigning}
              >
                <option value="">Unassigned</option>
                {profiles.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Technical director
              <select
                value={selectedTechLead}
                onChange={(event) => setSelectedTechLead(event.target.value)}
                disabled={isAssigning}
              >
                <option value="">Unassigned</option>
                {profiles.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </select>
            </label>
            <footer>
              <button
                type="button"
                disabled={isAssigning}
                onClick={() => directorDialog.current?.close()}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAssigning}
                className={styles.primary}
              >
                {isAssigning ? 'Saving…' : 'Save directors'}
              </button>
            </footer>
          </form>
        )}
      </dialog>
    </div>
  );
}
