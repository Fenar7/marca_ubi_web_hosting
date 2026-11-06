'use client';

/**
 * @file IngestionWorkspaceClient.tsx
 * @description Interactive Client Component for Website Inquiries & Webhook Capture (/admin/ingestion).
 *              Renders live database-driven telemetry, expandable Raw Webhook Payload Inspector,
 *              and an interactive "Simulate Inbound Brief" Testing Console.
 * @module app/admin/(workspace)/ingestion/components/IngestionWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { simulateInboundBriefAction } from '@/app/actions/settings';
import { formatBudgetTierLabel } from '@/app/admin/lib/currency';
import styles from './IngestionWorkspaceClient.module.scss';

export interface IngestionTelemetryData {
  inboundCount24h: number | null;
  dedupMerges24h: number | null;
  dedupWindowHours: number | null;
  botRateLimit: number | null;
  endpointHealth: string;
}

export interface InboundSubmissionItem {
  id: string;
  lead_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  service_category: string;
  expected_value: number;
  created_at: string;
  brief_payload: Record<string, unknown> | null;
}

export interface IngestionActivityItem {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface IngestionWorkspaceClientProps {
  telemetry: IngestionTelemetryData;
  recentSubmissions: InboundSubmissionItem[];
  recentActivities: IngestionActivityItem[];
  submissionsUnavailable: boolean;
  activitiesUnavailable: boolean;
  canSimulate: boolean;
}

export function IngestionWorkspaceClient({
  telemetry,
  recentSubmissions,
  recentActivities,
  submissionsUnavailable,
  activitiesUnavailable,
  canSimulate,
}: IngestionWorkspaceClientProps): React.ReactElement {
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);
  const [expandedPayloadId, setExpandedPayloadId] = useState<string | null>(null);
  const [copiedPayloadId, setCopiedPayloadId] = useState<string | null>(null);

  // Simulation form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    serviceCategory: 'Web & Digital',
    budgetBracket: '',
    message: '',
  });

  const [isPending, startTransition] = useTransition();
  const [simulationResult, setSimulationResult] = useState<{
    success: boolean;
    leadId?: string;
    isDuplicate?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleCloseModal = useCallback(() => {
    setIsSimulateModalOpen(false);
    triggerBtnRef.current?.focus();
  }, []);

  // Focus management and keyboard accessibility for modal
  useEffect(() => {
    if (isSimulateModalOpen) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCloseModal();
          return;
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSimulateModalOpen, handleCloseModal]);

  const handleTogglePayload = (id: string) => {
    setExpandedPayloadId((prev) => (prev === id ? null : id));
  };

  const handleCopyPayload = (id: string, payload: Record<string, unknown> | null) => {
    if (!payload || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(JSON.stringify(payload, null, 2))
      .then(() => {
        setCopiedPayloadId(id);
        setTimeout(() => setCopiedPayloadId(null), 2000);
      })
      .catch(() => {});
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSimulate || isPending) return;

    startTransition(async () => {
      const result = await simulateInboundBriefAction(formData);
      setSimulationResult(result);
    });
  };

  const handleOpenLeadDrawer = (leadId: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-lead-drawer', { detail: { leadId } })
      );
    }
  };

  return (
    <div className={styles.workspaceRoot}>
      {/* Action Bar */}
      <div className={styles.topBar}>
        <div>
          <span className={styles.codeBadge}>POST /api/sales-funnel/ingest</span>
        </div>
        {canSimulate && (
          <button
            ref={triggerBtnRef}
            type="button"
            className={styles.simulateTriggerBtn}
            onClick={() => {
              setSimulationResult(null);
              setIsSimulateModalOpen(true);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Simulate Inbound Brief</span>
          </button>
        )}
      </div>

      {/* Live Database-Driven Telemetry Ribbon */}
      <section className={styles.telemetryGrid} aria-label="Ingestion Health Metrics">
        <div className={styles.telemetryCard}>
          <span className={styles.telemetryKey}>Endpoint Health</span>
          <div className={styles.telemetryVal}>
            <span>{telemetry.endpointHealth}</span>
          </div>
          <span className={styles.telemetrySub}>
            Endpoint health is not measured here.
          </span>
        </div>

        <div className={styles.telemetryCard}>
          <span className={styles.telemetryKey}>New leads (24 hours)</span>
          <div className={styles.telemetryVal}>{telemetry.inboundCount24h ?? 'Unavailable'}</div>
          <span className={styles.telemetrySub}>
            All sources; synthetic benchmark records excluded.
          </span>
        </div>

        <div className={styles.telemetryCard}>
          <span className={styles.telemetryKey}>Smart Merges (24H)</span>
          <div className={styles.telemetryVal}>{telemetry.dedupMerges24h ?? 'Unavailable'}</div>
          <span className={styles.telemetrySub}>
            {telemetry.dedupWindowHours === null ? 'Configuration unavailable' : `Configured window: ${telemetry.dedupWindowHours} hours`}
          </span>
        </div>

        <div className={styles.telemetryCard}>
          <span className={styles.telemetryKey}>Bot Shield Guard</span>
          <div className={styles.telemetryVal}>{telemetry.botRateLimit === null ? 'Unavailable' : `${telemetry.botRateLimit} req/m`}</div>
          <span className={styles.telemetrySub}>
            Configured request limit
          </span>
        </div>
      </section>

      {/* Recent Inbound Submissions & Raw Payload Inspector */}
      <section className={styles.sectionCard} aria-label="Recent Inbound Submissions">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent leads</h2>
          <span className={styles.countTag}>Latest {recentSubmissions.length}</span>
        </div>

        {submissionsUnavailable ? <div className={styles.emptyState} role="status">Recent leads could not be loaded. Refresh to try again.</div> : recentSubmissions.length === 0 ? (
          <div className={styles.emptyState}>
            <span>No recent leads found.</span>
          </div>
        ) : (
          <div className={styles.submissionsList}>
            {recentSubmissions.map((sub) => {
              const isExpanded = expandedPayloadId === sub.id;
              const hasPayload = sub.brief_payload && Object.keys(sub.brief_payload).length > 0;

              return (
                <div key={sub.id} className={styles.submissionCard}>
                  <div className={styles.submissionSummary}>
                    <div className={styles.submissionLeft}>
                      <button
                        type="button"
                        className={styles.dealIdToken}
                        onClick={() => handleOpenLeadDrawer(sub.id)}
                        title="View deal in Client 360 Dossier"
                        aria-label={`Open Client 360 Dossier for ${sub.lead_id}`}
                      >
                        {sub.lead_id}
                      </button>
                      <div>
                        <span className={styles.clientName}>{sub.name}</span>
                        {sub.company && <span className={styles.clientCompany}> · {sub.company}</span>}
                      </div>
                      <span className={styles.clientContact}>
                        {sub.email || sub.phone || 'No contact provided'}
                      </span>
                    </div>

                    <div className={styles.submissionRight}>
                      <span className={styles.categoryTag}>{sub.service_category}</span>
                      <time className={styles.timestamp}>
                        {new Date(sub.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                      {hasPayload && (
                        <button
                          type="button"
                          className={styles.inspectBtn}
                          onClick={() => handleTogglePayload(sub.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`payload-viewer-${sub.id}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <polyline points={isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                          </svg>
                          <span>{isExpanded ? 'Hide Payload' : 'Inspect JSON'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && hasPayload && (
                    <div id={`payload-viewer-${sub.id}`} className={styles.payloadViewer}>
                      <div className={styles.payloadHeader}>
                        <span className={styles.payloadTitle}>Raw Webhook Brief Payload (JSON).</span>
                        <button
                          type="button"
                          className={styles.copyPayloadBtn}
                          onClick={() => handleCopyPayload(sub.id, sub.brief_payload)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>{copiedPayloadId === sub.id ? 'Copied!' : 'Copy JSON'}</span>
                        </button>
                      </div>
                      <pre className={styles.jsonBox}>
                        {JSON.stringify(sub.brief_payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Ingestion & Smart Merge Activity Feed */}
      <section className={styles.sectionCard} aria-label="Ingestion Event Activity Feed">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent lead activity</h2>
          <span className={styles.countTag}>{recentActivities.length} Events</span>
        </div>

        {activitiesUnavailable ? <div className={styles.emptyState} role="status">Activity could not be loaded. Refresh to try again.</div> : recentActivities.length === 0 ? (
          <div className={styles.emptyState}>
            <span>No recent activity found.</span>
          </div>
        ) : (
          <div className={styles.activityList}>
            {recentActivities.map((act) => {
              let badgeClass = styles.default;
              if (act.activity_type === 'duplicate_inquiry') badgeClass = styles.duplicate;
              if (act.activity_type === 'system_event') badgeClass = styles.system;

              return (
                <div key={act.id} className={styles.activityRow}>
                  <div className={styles.activityLeft}>
                    <span className={`${styles.activityBadge} ${badgeClass}`}>
                      {act.activity_type.replace(/_/g, ' ')}
                    </span>
                    <span className={styles.activityDesc}>{act.description}</span>
                  </div>
                  <time className={styles.activityTime}>
                    {new Date(act.created_at).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Interactive Simulate Inbound Brief Modal */}
      {isSimulateModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="simulate-modal-title"
        >
          <div ref={modalRef} className={styles.modalContent}>
            <header className={styles.modalHeader}>
              <h3 id="simulate-modal-title" className={styles.modalTitle}>
                Simulate Inbound Website Brief.
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleSimulateSubmit}>
              <div className={styles.modalBody}>
                <p className={styles.emptyState}>Simulation records are clearly marked and excluded from reporting. A contact match against a live lead is blocked.</p>
                {simulationResult && (
                  <div
                    className={
                      simulationResult.success
                        ? simulationResult.isDuplicate
                          ? styles.resultDuplicate
                          : styles.resultSuccess
                        : styles.resultError
                    }
                  >
                    <strong>{simulationResult.isDuplicate ? 'Smart Merge Triggered: ' : simulationResult.success ? 'Success: ' : 'Error: '}</strong>
                    <span>{simulationResult.message || simulationResult.error}</span>
                  </div>
                )}

                <div className={styles.fieldGroup}>
                  <label htmlFor="sim-name" className={styles.fieldLabel}>Client Name *</label>
                  <input
                    ref={nameInputRef}
                    id="sim-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={styles.fieldInput}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="sim-company" className={styles.fieldLabel}>Company Name</label>
                  <input
                    id="sim-company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className={styles.fieldInput}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="sim-email" className={styles.fieldLabel}>Email Address *</label>
                  <input
                    id="sim-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={styles.fieldInput}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="sim-phone" className={styles.fieldLabel}>Phone Number *</label>
                  <input
                    id="sim-phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={styles.fieldInput}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="sim-service" className={styles.fieldLabel}>Service Category</label>
                  <select
                    id="sim-service"
                    value={formData.serviceCategory}
                    onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                    className={styles.fieldSelect}
                  >
                    <option value={'\u20b95L - \u20b910L'}>{formatBudgetTierLabel('\u20b95L - \u20b910L')}</option>
                    <option value={'\u20b910L - \u20b915L'}>{formatBudgetTierLabel('\u20b910L - \u20b915L')}</option>
                    <option value={'\u20b915L - \u20b925L'}>{formatBudgetTierLabel('\u20b915L - \u20b925L')}</option>
                    <option value={'\u20b925L+'}>{formatBudgetTierLabel('\u20b925L+')}</option>
                    <option value="Full-Suite Advisory">Full-Suite Advisory</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="sim-budget" className={styles.fieldLabel}>Budget Bracket</label>
                  <select
                    id="sim-budget"
                    value={formData.budgetBracket}
                    onChange={(e) => setFormData({ ...formData, budgetBracket: e.target.value })}
                    className={styles.fieldSelect}
                  >
                    <option value="₹5L - ₹10L">{formatBudgetTierLabel('₹5L - ₹10L')}</option>
                    <option value="₹10L - ₹15L">{formatBudgetTierLabel('₹10L - ₹15L')}</option>
                    <option value="₹15L - ₹25L">{formatBudgetTierLabel('₹15L - ₹25L')}</option>
                    <option value="₹25L+">{formatBudgetTierLabel('₹25L+')}</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="sim-msg" className={styles.fieldLabel}>Project Brief / Notes</label>
                  <textarea
                    id="sim-msg"
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className={styles.fieldTextarea}
                  />
                </div>
              </div>

              <footer className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCloseModal}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={styles.submitBtn}
                >
                  {isPending ? 'Simulating Intake...' : 'Submit Inbound Brief'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}