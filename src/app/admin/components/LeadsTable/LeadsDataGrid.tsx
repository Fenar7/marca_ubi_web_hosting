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

import React, { useRef, useState } from 'react';
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
  /** Optional custom class name */
  className?: string;
}

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
  className,
}: LeadsDataGridProps): React.ReactElement {
  const parentRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Virtualizer instance configured with 72px row rhythm and 6-row overscan buffer
  const rowVirtualizer = useVirtualizer({
    count: leads.length,
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

  const handleCopyDealId = (leadIdStr: string, e: React.MouseEvent): void => {
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
        {/* Sticky Table Header (7 Columns) */}
        <div className={styles.tableHeader} role="row" aria-hidden="true">
          <div className={styles.thCell}>Deal ID</div>
          <div className={styles.thCell}>Client & Org</div>
          <div className={styles.thCell}>Service Scope</div>
          <div className={styles.thCell}>Funnel Stage</div>
          <div className={styles.thCell}>Expected Value</div>
          <div className={styles.thCell}>Representative</div>
          <div className={styles.thCell}>Priority & Touchpoint</div>
        </div>

        {/* Dynamic Virtualized Rows Viewport */}
        <div
          className={styles.virtualViewport}
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const lead = leads[virtualRow.index];
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
              color_code: lead.status_color || '#ff6100',
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
                  zIndex: leads.length - virtualRow.index,
                }}
                onClick={() => handleRowClick(lead.id)}
                role="row"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRowClick(lead.id);
                  }
                }}
                aria-label={`Deal ${lead.lead_id}: ${lead.name}`}
              >
                {/* Col 1: Deal ID Monospace Token */}
                <div>
                  <button
                    type="button"
                    onClick={(e) => handleCopyDealId(lead.lead_id, e)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleCopyDealId(lead.lead_id, e as unknown as React.MouseEvent);
                      }
                    }}
                    className={styles.leadIdToken}
                    title="Click to copy Deal ID"
                    aria-label={`Copy Deal ID ${lead.lead_id}`}
                  >
                    <span>{isCopied ? '✓ Copied' : lead.lead_id}</span>
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

                {/* Col 7: Inline Priority Selector & Next Touchpoint */}
                <div className={styles.priorityTouchpointCol}>
                  <InlinePrioritySelect
                    leadId={lead.id}
                    currentPriority={lead.priority}
                    onPriorityChange={onPriorityChange}
                  />
                  <div className={styles.touchpointGroup}>
                    {lead.bucket === 'open' && (
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
                        title="1-Click Convert Inbound Lead to Pipeline Deal"
                        aria-label={`Convert ${lead.lead_id} to pipeline deal`}
                      >
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span>Convert</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.touchpointDate}
                      onClick={(e) => {
                        e.stopPropagation();
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
                      title={
                        lead.next_follow_up
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
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Mobile Responsive Card Queue (< 768px) */}
      <div className={styles.mobileCardsContainer} role="feed" aria-label="Commercial Inquiries Queue">
        {leads.map((lead) => (
          <LeadMobileCard
            key={lead.id}
            lead={lead}
            availableStatuses={availableStatuses}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
          />
        ))}
      </div>
    </div>
  );
}
