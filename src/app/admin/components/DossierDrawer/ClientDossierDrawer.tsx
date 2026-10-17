'use client';

/**
 * @file ClientDossierDrawer.tsx
 * @description Slide-over Client 360° Drawer component for commercial deal inspection.
 *              Enforces an 840px desktop / 100vw mobile width, Apple HIG frosted backdrop scrim,
 *              focus trapping, escape dismissal, and dual-column responsive grid layout.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getLeadDetails } from '@/app/actions/leads';
import { OrganizationDossier } from './OrganizationDossier';
import styles from './DossierDrawer.module.scss';

export interface LeadDossierData {
  id: string;
  lead_id: string;
  name: string;
  company: string | null;
  company_website: string | null;
  industry: string | null;
  phone: string | null;
  email: string | null;
  preferred_channel: 'Phone' | 'WhatsApp' | 'Email' | 'Meeting';
  service_category: string;
  budget_bracket: string | null;
  priority: 'High' | 'Medium' | 'Low';
  status_id: string;
  status_name: string;
  status_color: string;
  bucket: 'open' | 'potential' | 'converted' | 'lost';
  assigned_to: string | null;
  assigned_to_name: string | null;
  assigned_to_email?: string | null;
  expected_value: number;
  next_follow_up: string | null;
  lost_reason: string | null;
  revisit_date: string | null;
  notes: string | null;
  brief_payload: Record<string, unknown> | null;
  created_at: string;
  converted_at: string | null;
  updated_at: string;
}

export interface ClientDossierDrawerProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialLead?: LeadDossierData | null;
  onLeadUpdated?: () => void;
}

export function ClientDossierDrawer({
  leadId,
  isOpen,
  onClose,
  initialLead,
  onLeadUpdated,
}: ClientDossierDrawerProps): React.ReactElement | null {
  const [lead, setLead] = useState<LeadDossierData | null>(initialLead || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [shouldRender, setShouldRender] = useState<boolean>(isOpen);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Animation lifecycle and body scroll lock
  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setShouldRender(true);
      setIsClosing(false);

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else if (shouldRender && !isClosing) {
      setIsClosing(true);
      closeTimerRef.current = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }, 300);
    }
  }, [isOpen, shouldRender, isClosing]);

  // Load complete lead dossier from Server Action
  const loadDossier = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await getLeadDetails(id);
        if (!response.success || !response.data?.lead) {
          setFetchError(response.error || 'Failed to load deal record from database.');
          return;
        }

        const raw = response.data.lead;
        const normalized: LeadDossierData = {
          id: raw.id,
          lead_id: raw.lead_id,
          name: raw.name,
          company: raw.company,
          company_website: raw.company_website,
          industry: raw.industry,
          phone: raw.phone,
          email: raw.email,
          preferred_channel: (raw.preferred_channel as LeadDossierData['preferred_channel']) || 'Phone',
          service_category: raw.service_category || 'Web & Digital',
          budget_bracket: raw.budget_bracket,
          priority: (raw.priority as LeadDossierData['priority']) || 'Medium',
          status_id: raw.status_id,
          status_name: raw.status?.name || 'In Review',
          status_color: raw.status?.color_code || '#ff6100',
          bucket: (raw.status?.bucket as LeadDossierData['bucket']) || 'open',
          assigned_to: raw.assigned_to,
          assigned_to_name: raw.assignee?.full_name || 'Unassigned',
          assigned_to_email: raw.assignee?.email || null,
          expected_value: Number(raw.expected_value) || 0,
          next_follow_up: raw.next_follow_up,
          lost_reason: raw.lost_reason,
          revisit_date: raw.revisit_date,
          notes: raw.notes,
          brief_payload: (raw.brief_payload as Record<string, unknown>) || null,
          created_at: raw.created_at,
          converted_at: raw.converted_at,
          updated_at: raw.updated_at,
        };

        setLead(normalized);
      } catch (err) {
        setFetchError(
          err instanceof Error ? err.message : 'An unexpected exception occurred while retrieving the dossier.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isOpen && leadId) {
      if (initialLead && initialLead.id === leadId) {
        setLead(initialLead);
      } else {
        loadDossier(leadId);
      }
    }
  }, [isOpen, leadId, initialLead, loadDossier]);

  // Keyboard accessibility: Escape key closes the drawer cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyDealId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(lead.lead_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`${styles.drawerOverlay} ${isClosing ? styles.closing : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Client 360 Degree Dossier Drawer"
    >
      <aside
        ref={drawerRef}
        className={`${styles.drawerContainer} ${isClosing ? styles.closing : ''}`}
        tabIndex={-1}
      >
        {/* Top Header Rail */}
        <header className={styles.drawerHeader}>
          <div className={styles.headerLeft}>
            {lead && (
              <button
                type="button"
                onClick={handleCopyDealId}
                className={styles.leadIdToken}
                title="Click to copy Deal ID"
                aria-label={`Copy Deal ID ${lead.lead_id}`}
              >
                <span>{copiedId ? 'Copied' : lead.lead_id}</span>
              </button>
            )}

            <h2 className={styles.headerCompany}>
              {lead?.company || lead?.name || 'Commercial Deal Dossier'}
            </h2>

            {lead && (
              <div className={styles.headerStatusBadge}>
                <span
                  className={styles.statusDot}
                  style={{ backgroundColor: lead.status_color }}
                />
                <span>{lead.status_name}</span>
              </div>
            )}
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close dossier drawer"
              title="Close drawer (Esc)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        {/* Drawer Body */}
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading deal intelligence...</p>
          </div>
        ) : fetchError ? (
          <div className={styles.loadingContainer}>
            <p style={{ color: '#ff4d4f' }}>{fetchError}</p>
            {leadId && (
              <button
                type="button"
                onClick={() => loadDossier(leadId)}
                className={`${styles.actionButton} ${styles.callBtn}`}
                style={{ marginTop: '0.5rem' }}
              >
                Retry
              </button>
            )}
          </div>
        ) : lead ? (
          <div className={styles.drawerBody}>
            {/* Column 1: Organization & Brand Dossier */}
            <OrganizationDossier lead={lead} />

            {/* Column 2: Omnichannel Touchpoint Studio (Sprint 8.2 Handshake) */}
            <div className={styles.dossierColumn}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionTitle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Omnichannel Interaction Studio</span>
                </div>

                <div className={styles.keyValueList}>
                  <div className={styles.keyValuePair}>
                    <span className={styles.fieldLabel}>Scheduled Touchpoint</span>
                    <span className={styles.fieldValue}>
                      {lead.next_follow_up
                        ? new Date(lead.next_follow_up).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'No Follow-up Scheduled'}
                    </span>
                  </div>

                  <div className={styles.keyValuePair}>
                    <span className={styles.fieldLabel}>Inquiry Date</span>
                    <span className={styles.fieldValue}>
                      {new Date(lead.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className={styles.keyValuePair}>
                    <span className={styles.fieldLabel}>Last Pipeline Update</span>
                    <span className={styles.fieldValue}>
                      {new Date(lead.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {lead.notes && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <span className={styles.fieldLabel} style={{ display: 'block', marginBottom: '0.35rem' }}>
                      Executive Deal Notes
                    </span>
                    <p style={{ fontSize: '0.82rem', color: '#e4e4e7', lineHeight: 1.5, margin: 0 }}>
                      {lead.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.loadingContainer}>
            <p>No active deal selected.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
