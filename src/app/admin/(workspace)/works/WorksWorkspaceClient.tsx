'use client';

/**
 * @file WorksWorkspaceClient.tsx
 * @description Interactive Client Component for Client Works & Project Deliverables (/admin/works).
 *              Displays post-conversion creative engagements with milestone progress meters,
 *              health status indicators, director assignments, and stage transition controls.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useMemo } from 'react';
import type { ClientWorkItem, ClientWorkDeliveryStage, ClientWorkHealthStatus } from '@/types/crm';
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

const STAGE_LABELS: Record<ClientWorkDeliveryStage, string> = {
  kickoff: 'Kickoff & Alignment',
  strategy: 'Brand Strategy',
  design_ui_ux: 'UI/UX Design Systems',
  development: 'Production Development',
  review_qa: 'Client QA & Review',
  delivered: 'Completed & Delivered',
};

const HEALTH_LABELS: Record<ClientWorkHealthStatus, { label: string; className: string }> = {
  on_track: { label: 'On Track', className: styles.healthOnTrack },
  at_risk: { label: 'At Risk', className: styles.healthAtRisk },
  blocked: { label: 'Blocked', className: styles.healthBlocked },
  completed: { label: 'Delivered', className: styles.healthCompleted },
};

export function WorksWorkspaceClient({ initialWorks }: WorksWorkspaceClientProps): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHealth, setSelectedHealth] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const filteredWorks = useMemo(() => {
    return initialWorks.filter((work) => {
      const matchesSearch =
        work.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (work.company && work.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        work.service_scope.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesHealth = selectedHealth === 'all' || work.health_status === selectedHealth;
      const matchesStage = selectedStage === 'all' || work.delivery_stage === selectedStage;

      return matchesSearch && matchesHealth && matchesStage;
    });
  }, [initialWorks, searchTerm, selectedHealth, selectedStage]);

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
            placeholder="Search projects by client, code (PRJ-1001), or scope..."
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
            All Projects ({initialWorks.length})
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
      </div>

      {/* Projects Grid */}
      {filteredWorks.length === 0 ? (
        <div className={styles.emptyCard}>
          <p className={styles.emptyTitle}>No active client projects match your filters.</p>
          <p className={styles.emptySub}>
            Projects are automatically instantiated when deals transition to the Converted stage.
          </p>
        </div>
      ) : (
        <div className={styles.worksGrid}>
          {filteredWorks.map((work) => {
            const healthMeta = HEALTH_LABELS[work.health_status] || HEALTH_LABELS.on_track;
            const completedMilestones = work.milestones.filter((m) => m.status === 'completed').length;
            const totalMilestones = work.milestones.length || 5;
            const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

            return (
              <article key={work.id} className={styles.workCard}>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.projectIdentity}>
                    <span className={styles.projectCode}>{work.project_code}</span>
                    <span className={`${styles.healthBadge} ${healthMeta.className}`}>
                      <span className={styles.statusDot} aria-hidden="true" />
                      {healthMeta.label}
                    </span>
                  </div>
                  <span className={styles.contractValue}>{formatCurrency(work.contract_value)}</span>
                </div>

                {/* Client & Scope Details */}
                <div className={styles.clientDetails}>
                  <h2 className={styles.clientTitle}>{work.client_name}</h2>
                  <span className={styles.companyName}>{work.company || 'Private Account'}</span>
                  <span className={styles.serviceScope}>{work.service_scope}</span>
                </div>

                {/* Current Stage Strip */}
                <div className={styles.stageBlock}>
                  <div className={styles.stageLabelArea}>
                    <span className={styles.stageCaption}>Active Production Stage</span>
                    <span className={styles.stageName}>
                      {STAGE_LABELS[work.delivery_stage] || work.delivery_stage}
                    </span>
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
                    Kickoff: {new Date(work.kickoff_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
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
