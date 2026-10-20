'use client';

/**
 * @file LeadsDataGrid.tsx
 * @description Virtualized, high-performance commercial data grid powered by `@tanstack/react-virtual`.
 *              Delivers 60fps scrolling across 10,000+ commercial inquiries with fixed 72px row rhythm,
 *              dynamic overscan buffers, React 19 optimistic inline stage & priority mutations,
 *              and automatic mobile breakpoint reflow to fluid touch cards (< 768px).
 * @module app/admin/components/LeadsTable/LeadsDataGrid
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useRef, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { HydratedLeadItem } from '@/app/admin/(workspace)/leads/LeadsWorkspaceClient';
import { InlineStatusSelect, type InlineStatusOption } from './InlineStatusSelect';
import { InlinePrioritySelect } from './InlinePrioritySelect';
import { LeadMobileCard } from './LeadMobileCard';
import { OverdueBadge } from '@/app/admin/components/Badges';
import type { LeadPriority } from '@/types/crm';
import styles from './LeadsDataGrid.module.scss';

export interface LeadsDataGridProps {
  /** Filtered commercial leads queue */
  leads: HydratedLeadItem[];
  /** Available pipeline stages for inline stage transitions */
  availableStatuses: InlineStatusOption[];
  /** Optional callback fired when an inline stage modification confirms */
  onStatusChange?: (leadId: string, newStatus: InlineStatusOption) => void;
  /** Optional callback fired when an inline priority modification confirms */
  onPriorityChange?: (leadId: string, newPriority: LeadPriority) => void;
  /** Optional user role for role-based authorization */
  userRole?: string;
  /** Optional custom class name */
  className?: string;
}

type SortField =
  | 'lead_id'
  | 'name'
  | 'service_category'
  | 'status_name'
  | 'expected_value'
  | 'assigned_to_name'
  | 'priority'
  | 'next_follow_up';

function formatCurrency(amount: number): string {
  if (!amount || amount <= 0) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function LeadsDataGrid({
  leads,
  availableStatuses,
  onStatusChange,
  onPriorityChange,
  userRole,
  className,
}: LeadsDataGridProps): React.ReactElement {
  const parentRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('lead_id');
  const [sortAscending, setSortAscending] = useState<boolean>(true);

  const handleToggleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortAscending((prev) => !prev);
    } else {
      setSortField(field);
      setSortAscending(true);
    }
  };

  const sortedLeads = useMemo(() => {
    const cloned = [...leads];
    cloned.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (sortField === 'expected_value') {
        const aNum = Number(aVal) || 0;
        const bNum = Number(bVal) || 0;
        return sortAscending ? aNum - bNum : bNum - aNum;
      }

      if (sortField === 'priority') {
        const weight: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        const aW = weight[String(aVal)] || 0;
        const bW = weight[String(bVal)] || 0;
        return sortAscending ? aW - bW : bW - aW;
      }

      if (sortField === 'next_follow_up') {
        const aTime = a.next_follow_up ? new Date(a.next_follow_up).getTime() : NaN;
        const bTime = b.next_follow_up ? new Date(b.next_follow_up).getTime() : NaN;
        const aValid = !Number.isNaN(aTime);
        const bValid = !Number.isNaN(bTime);
        if (!aValid && !bValid) return 0;
        if (!aValid) return 1; // SQL NULLS LAST standard: null/invalid dates always sort to bottom
        if (!bValid) return -1;
        return sortAscending ? aTime - bTime : bTime - aTime;
      }

      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      if (aStr < bStr) return sortAscending ? -1 : 1;
      if (aStr > bStr) return sortAscending ? 1 : -1;
      return 0;
    });
    return cloned;
  }, [leads, sortField, sortAscending]);

  // Virtualizer instance configured with 72px row rhythm and 6-row overscan buffer
  const rowVirtualizer = useVirtualizer({
    count: sortedLeads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 6,
  });

  const handleRowClick = (leadId: string): void => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-lead-drawer', { detail: { leadId } })
      );
    }
  };

  const handleCopyLeadId = (leadIdStr: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(leadIdStr);
      setCopiedId(leadIdStr);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Render empty state if filtered queue is zero
  if (leads.length === 0) {
    return (
      <div className={`${styles.emptyState} ${className || ''}`} role="status">
        <div className={styles.emptyStateTitle}>No commercial inquiries found</div>
        <p>No pipeline records match the active criteria. Try broadening your search or reset filters.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.gridContainer} ${className || ''}`}>
      {/* 1. Desktop & Tablet Virtualized Data Grid (768px+) */}
      <div
        ref={parentRef}
        className={styles.virtualScrollContainer}
        role="region"
        aria-label="Commercial Pipeline Data Grid"
        tabIndex={0}
      >
        {/* Sticky Table Header (9 Dedicated Columns) with Sort Controls */}
        <div className={styles.tableHeader} role="row">
          <button
            type="button"
            role="columnheader"
            aria-sort={sortField === 'lead_id' ? (sortAscending ? 'ascending' : 'descending') : 'none'}
            className={styles.sortableHeaderCol}
            onClick={() => handleToggleSort('lead_id')}
            aria-label={`Sort by Lead ID, currently ${sortField === 'lead_id' ? (sortAscending ? 'ascending' : 'descending') : 'unsorted'}`}
          >
            <span>Lead ID</span>
            {sortField === 'lead_id' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </span>
            )}
          </button>

          <button
            type="button"
            role="columnheader"
            aria-sort={sortField === 'name' ? (sortAscending ? 'ascending' : 'descending') : 'none'}
            className={styles.sortableHeaderCol}
            onClick={() => handleToggleSort('name')}
            aria-label={`Sort by Client & Organization, currently ${sortField === 'name' ? (sortAscending ? 'ascending' : 'descending') : 'unsorted'}`}
          >
            <span>Client & Org</span>
            {sortField === 'name' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </span>
            )}
          </button>

          <button
            type="button"
            role="columnheader"
            aria-sort={sortField === 'service_category' ? (sortAscending ? 'ascending' : 'descending') : 'none'}
            className={styles.sortableHeaderCol}
            onClick={() => handleToggleSort('service_category')}
            aria-label={`Sort by Service Scope, currently ${sortField === 'service_category' ? (sortAscending ? 'ascending' : 'descending') : 'unsorted'}`}
          >
            <span>Service Scope</span>
            {sortField === 'service_category' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </span>
            )}
          </button>

          <button
            type="button"
            role="columnheader"
            aria-sort={sortField === 'status_name' ? (sortAscending ? 'ascending' : 'descending') : 'none'}
            className={styles.sortableHeaderCol}
            onClick={() => handleToggleSort('status_name')}
            aria-label={`Sort by Funnel Stage, currently ${sortField === 'status_name' ? (sortAscending ? 'ascending' : 'descending') : 'unsorted'}`}
          >
            <span>Funnel Stage</span>
            {sortField === 'status_name' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </span>
            )}
          </button>

          <button
            type="button"
            role="columnheader"
            aria-sort={sortField === 'expected_value' ? (sortAscending ? 'ascending' : 'descending') : 'none'}
            className={styles.sortableHeaderCol}
            onClick={() => handleToggleSort('expected_value')}
            aria-label={`Sort by Expected Valuation, currently ${sortField === 'expected_value' ? (sortAscending ? 'ascending' : 'descending') : 'unsorted'}`}
          >
            <span>Expected Value</span>
            {sortField === 'expected_value' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </span>
            )}
          </button>

          <button
            type="button"
            role="columnheader"
            aria-sort={sortField === 'assigned_to_name' ? (sortAscending ? 'ascending' : 'descending') : 'none'}
            className={styles.sortableHeaderCol}
            onClick={() => handleToggleSort('assigned_to_name')}
            aria-label={`Sort by Representative, currently ${sortField === 'assigned_to_name' ? (sortAscending ? 'ascending' : 'descending') : 'unsorted'}`}
          >
            <span>Representative</span>
            {sortField === 'assigned_to_name' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </span>
            )}
          </button>

          <button
            type="button"
            role="columnheader"
            aria-sort={sortField === 'priority' ? (sortAscending ? 'ascending' : 'descending') : 'none'}
            className={styles.sortableHeaderCol}
            onClick={() => handleToggleSort('priority')}
            aria-label={`Sort by Priority Tier, currently ${sortField === 'priority' ? (sortAscending ? 'ascending' : 'descending') : 'unsorted'}`}
          >
            <span>Priority</span>
            {sortField === 'priority' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </span>
            )}
          </button>

          <button
            type="button"
            role="columnheader"
            aria-sort={sortField === 'next_follow_up' ? (sortAscending ? 'ascending' : 'descending') : 'none'}
            className={styles.sortableHeaderCol}
            onClick={() => handleToggleSort('next_follow_up')}
            aria-label={`Sort by Next SLA Touchpoint, currently ${sortField === 'next_follow_up' ? (sortAscending ? 'ascending' : 'descending') : 'unsorted'}`}
          >
            <span>Next SLA</span>
            {sortField === 'next_follow_up' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {sortAscending ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </span>
            )}
          </button>

          <div className={styles.headerColActions} role="columnheader">
            <span>Actions</span>
          </div>
        </div>

        {/* Dynamic Virtualized Rows Viewport */}
        <div
          className={styles.virtualViewport}
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const lead = sortedLeads[virtualRow.index];
            if (!lead) return null;

            const repInitials = (lead.assigned_to_name || 'Unassigned')
              .split(' ')
              .filter(Boolean)
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();

            const isCopied = copiedId === lead.lead_id;

            const currentStatusOption: InlineStatusOption = {
              id: lead.status_id,
              name: lead.status_name,
              bucket: lead.bucket,
              color_code: lead.status_color || '#1f242f',
            };

            const followUpText = lead.next_follow_up
              ? new Date(lead.next_follow_up).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'None';

            return (
              <div
                key={lead.id}
                data-index={virtualRow.index}
                className={styles.virtualRow}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  zIndex: sortedLeads.length - virtualRow.index,
                }}
                onClick={() => handleRowClick(lead.id)}
                role="row"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRowClick(lead.id);
                  }
                }}
                aria-label={`Lead ${lead.lead_id}: ${lead.name}`}
              >
                {/* Col 1: Lead ID Monospace Token */}
                <div>
                  <button
                    type="button"
                    onClick={(e) => handleCopyLeadId(lead.lead_id, e)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleCopyLeadId(lead.lead_id, e as unknown as React.MouseEvent);
                      }
                    }}
                    className={styles.leadIdToken}
                    title="Click to copy Lead ID"
                    aria-label={`Copy Lead ID ${lead.lead_id}`}
                  >
                    {isCopied ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied
                      </span>
                    ) : (
                      <span>{lead.lead_id}</span>
                    )}
                  </button>
                </div>

                {/* Col 2: Client & Organization Dual-Line */}
                <div className={styles.clientMeta}>
                  <span className={styles.clientName}>{lead.name}</span>
                  <span className={styles.companyTitle}>
                    {lead.company || 'Private Client'}
                  </span>
                </div>

                {/* Col 3: Service Scope */}
                <div>
                  <span className={styles.serviceCategory}>
                    {lead.service_category}
                  </span>
                </div>

                {/* Col 4: Inline Funnel Stage Selector */}
                <div>
                  <InlineStatusSelect
                    leadId={lead.id}
                    currentStatus={currentStatusOption}
                    availableStatuses={availableStatuses}
                    onStatusChange={onStatusChange}
                    disabled={userRole === 'viewer'}
                  />
                </div>

                {/* Col 5: Expected Value Numerals */}
                <div>
                  <span className={styles.dealValue}>
                    {formatCurrency(lead.expected_value)}
                  </span>
                </div>

                {/* Col 6: Assigned Representative Badge */}
                <div>
                  <div
                    className={styles.repBadge}
                    title={lead.assigned_to_name || 'Unassigned'}
                  >
                    <div className={styles.repAvatar}>{repInitials}</div>
                    <span>{lead.assigned_to_name}</span>
                  </div>
                </div>

                {/* Col 7: Inline Priority Selector */}
                <div className={styles.priorityCol}>
                  <InlinePrioritySelect
                    leadId={lead.id}
                    currentPriority={lead.priority}
                    onPriorityChange={onPriorityChange}
                    disabled={userRole === 'viewer'}
                  />
                </div>

                {/* Col 8: Next SLA Touchpoint */}
                <div
                  className={styles.slaCol}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={styles.touchpointDate}
                    disabled={userRole === 'viewer'}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (userRole === 'viewer') return;
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(
                          new CustomEvent('open-scheduler-modal', {
                            detail: {
                              leadId: lead.id,
                              leadName: lead.name,
                              company: lead.company,
                              currentFollowUpDate: lead.next_follow_up,
                            },
                          })
                        );
                      }
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter' || e.key === ' ') {
                        if (userRole === 'viewer') return;
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(
                            new CustomEvent('open-scheduler-modal', {
                              detail: {
                                leadId: lead.id,
                                leadName: lead.name,
                                company: lead.company,
                                currentFollowUpDate: lead.next_follow_up,
                              },
                            })
                          );
                        }
                      }
                    }}
                    title={
                      userRole === 'viewer'
                        ? 'Read-only access'
                        : lead.next_follow_up
                        ? `Next Touchpoint: ${new Date(lead.next_follow_up).toLocaleString()} (Click to reschedule)`
                        : 'Click to schedule next touchpoint'
                    }
                    aria-label={`Schedule follow-up for ${lead.company || lead.name}`}
                  >
                      {followUpText}
                    </button>
                    <OverdueBadge
                      nextFollowUp={lead.next_follow_up}
                      statusName={lead.status_name}
                      revisitDate={lead.revisit_date}
                      bucket={lead.bucket}
                      variant="short"
                    />
                </div>

                {/* Col 9: Action Controls Strip */}
                <div
                  className={styles.actionsCol}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {lead.bucket === 'open' && userRole !== 'viewer' && (
                    <button
                      type="button"
                      className={styles.rowConvertBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(
                            new CustomEvent('open-convert-lead-modal', {
                              detail: { leadId: lead.id },
                            })
                          );
                        }
                      }}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter' || e.key === ' ') {
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(
                              new CustomEvent('open-convert-lead-modal', {
                                detail: { leadId: lead.id },
                              })
                            );
                          }
                        }
                      }}
                      title="1-Click Convert Inbound Lead to Pipeline Deal"
                      aria-label={`Convert ${lead.lead_id} to pipeline deal`}
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      <span>Convert</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.rowInspectBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(lead.id);
                    }}
                    title="Open Client Dossier & Touchpoint Notes"
                    aria-label={`Inspect dossier for ${lead.company || lead.name} (${lead.lead_id})`}
                  >
                    <span>View</span>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  <div className={styles.rowQuickActions}>
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className={styles.actionBtn}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        title={`Direct Phone Call: ${lead.phone}`}
                        aria-label={`Call ${lead.name} at ${lead.phone}`}
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </a>
                    )}
                  </div>
                  </div>
                </div>
            );
          })}
        </div>
      </div>

      {/* 2. Mobile Responsive Card Queue (< 768px) */}
      <div className={styles.mobileCardsContainer} role="feed" aria-label="Commercial Inquiries Queue">
        {sortedLeads.map((lead) => (
          <LeadMobileCard
            key={lead.id}
            lead={lead}
            availableStatuses={availableStatuses}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            userRole={userRole}
          />
        ))}
      </div>
    </div>
  );
}
