'use client';

/**
 * @file LeadsDataGrid.tsx
 * @description Virtualized, high-performance commercial data grid powered by `@tanstack/react-virtual`.
 *              Delivers 60fps scrolling across 10,000+ commercial inquiries with fixed 72px row rhythm,
 *              dynamic overscan buffers, multi-select batch check state, client monogram avatars,
 *              in-context Client 360 Drawer dispatch, and mobile card reflow (< 768px).
 * @module app/admin/components/LeadsTable/LeadsDataGrid
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { HydratedLeadItem } from '@/app/admin/(workspace)/leads/LeadsWorkspaceClient';
import { InlineStatusSelect, type InlineStatusOption } from './InlineStatusSelect';
import { InlinePrioritySelect } from './InlinePrioritySelect';
import { LeadMobileCard } from './LeadMobileCard';
import { OverdueBadge } from '@/app/admin/components/Badges';
import type { LeadPriority } from '@/types/crm';
import { updateLeadAssignee } from '@/app/actions/leads';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import styles from './LeadsDataGrid.module.scss';

export interface LeadsDataGridProps {
  /** Filtered commercial leads queue */
  leads: HydratedLeadItem[];
  /** Available pipeline stages for inline stage transitions */
  availableStatuses: InlineStatusOption[];
  /** Optional set of selected lead IDs for batch actions */
  selectedLeadIds?: Set<string>;
  /** Optional callback fired when a lead selection checkbox toggles */
  onToggleSelect?: (leadId: string, event: React.MouseEvent | React.KeyboardEvent) => void;
  /** Optional callback fired when Select All toggles */
  onSelectAll?: () => void;
  /** Optional callback fired when an inline stage modification confirms */
  onStatusChange?: (leadId: string, newStatus: InlineStatusOption) => void;
  /** Optional callback fired when an inline priority modification confirms */
  onPriorityChange?: (leadId: string, newPriority: LeadPriority) => void;
  /** Optional focused row index for keyboard traversal (J/K) */
  focusedRowIndex?: number;
  /** Active personnel options for inline representative assignment */
  availableAssignees?: Array<{ id: string; label: string }>;
  /** Callback fired after successful inline representative assignment */
  onAssigneeChange?: (leadId: string, newAssigneeId: string, newAssigneeName: string) => void;
  /** Financial visibility permission flag */
  canViewFinancials?: boolean;
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
  return formatCrmCurrency(amount);
}

function getMonogramInitials(company: string | null, name: string): string {
  const base = company && company.trim().length > 0 ? company : name;
  const parts = base.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return base.substring(0, 2).toUpperCase() || 'MU';
}

export function LeadsDataGrid({
  leads,
  availableStatuses,
  selectedLeadIds = new Set(),
  onToggleSelect,
  onSelectAll,
  onStatusChange,
  onPriorityChange,
  focusedRowIndex = -1,
  availableAssignees = [],
  onAssigneeChange,
  canViewFinancials = true,
  userRole,
  className,
}: LeadsDataGridProps): React.ReactElement {
  const parentRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortAscending, setSortAscending] = useState<boolean>(true);
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);

  const canAssignInline =
    (userRole === 'admin' || userRole === 'sales_manager') && availableAssignees.length > 0;

  const handleInlineAssigneeChange = async (leadId: string, newAssigneeId: string) => {
    if (!newAssigneeId || !canAssignInline) return;
    setAssigningLeadId(leadId);
    const matched = availableAssignees.find((a) => a.id === newAssigneeId);
    try {
      const res = await updateLeadAssignee(leadId, newAssigneeId);
      if (res.success) {
        onAssigneeChange?.(leadId, newAssigneeId, matched?.label || 'Representative');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('crm-toast', {
              detail: { type: 'success', message: `Assigned lead to ${matched?.label || 'representative'}.` },
            })
          );
        }
      } else if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('crm-toast', {
            detail: { type: 'error', message: res.error || 'Failed to assign lead.' },
          })
        );
      }
    } catch {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('crm-toast', {
            detail: { type: 'error', message: 'Network error assigning lead.' },
          })
        );
      }
    } finally {
      setAssigningLeadId(null);
    }
  };

  const isAllSelected = leads.length > 0 && selectedLeadIds.size === leads.length;
  const isPartiallySelected = selectedLeadIds.size > 0 && !isAllSelected;

  const handleToggleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortAscending((prev) => !prev);
    } else {
      setSortField(field);
      setSortAscending(true);
    }
  };

  const sortedLeads = useMemo(() => {
    if (!sortField) return leads;
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
        if (!aValid) return 1;
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

  const rowVirtualizer = useVirtualizer({
    count: sortedLeads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 6,
  });

  const router = useRouter();
  const handleRowClick = (leadId: string): void => {
    router.push(`/admin/leads/${leadId}`);
  };

  const handleCopyLeadId = (leadIdStr: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(leadIdStr);
      setCopiedId(leadIdStr);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (leads.length === 0) {
    return (
      <div className={`${styles.emptyState} ${className || ''}`} role="status">
        <div className={styles.emptyIcon} aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h3 className={styles.emptyTitle}>No matching commercial inquiries found</h3>
        <p className={styles.emptySubtitle}>
          Adjust active search terms or clear category filters to view full pipeline records.
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.gridContainer} ${className || ''}`}>
      <div
        ref={parentRef}
        className={styles.virtualScrollContainer}
        role="table"
        aria-rowcount={sortedLeads.length + 1}
        aria-label="Lead queue"
        tabIndex={0}
      >
        {/* Sticky Table Header (10 Dedicated Columns) */}
        <div className={styles.tableHeader} role="row">
          {/* Col 0: Multi-Select Checkbox */}
          <div className={styles.thCheckboxCol} role="columnheader">
            <input
              type="checkbox"
              aria-label="Select all leads on current page"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isPartiallySelected;
              }}
              onChange={onSelectAll}
              className={styles.rowCheckbox}
            />
          </div>

          <button
            type="button"
            role="columnheader"
            aria-sort={sortField === 'lead_id' ? (sortAscending ? 'ascending' : 'descending') : 'none'}
            className={styles.sortableHeaderCol}
            onClick={() => handleToggleSort('lead_id')}
          >
            <span>Lead ID</span>
            {sortField === 'lead_id' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
          >
            <span>Client &amp; Org</span>
            {sortField === 'name' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
          >
            <span>Service Scope</span>
            {sortField === 'service_category' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
          >
            <span>Funnel Stage</span>
            {sortField === 'status_name' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
          >
            <span>Expected Value</span>
            {sortField === 'expected_value' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
          >
            <span>Representative</span>
            {sortField === 'assigned_to_name' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
          >
            <span>Priority</span>
            {sortField === 'priority' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
          >
            <span>Next SLA</span>
            {sortField === 'next_follow_up' && (
              <span className={styles.sortArrow} aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
          role="rowgroup"
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

            const clientInitials = getMonogramInitials(lead.company, lead.name);
            const isCopied = copiedId === lead.lead_id;
            const isSelected = selectedLeadIds.has(lead.id);
            const isFocused = focusedRowIndex === virtualRow.index;

            const currentStatusOption: InlineStatusOption = {
              id: lead.status_id,
              name: lead.status_name,
              bucket: lead.bucket,
              color_code: lead.status_color || '#111111',
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
                aria-rowindex={virtualRow.index + 2}
                className={`${styles.virtualRow} ${isSelected ? styles.rowSelected : ''} ${isFocused ? styles.rowFocused : ''}`}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  zIndex: sortedLeads.length - virtualRow.index,
                }}
                onClick={() => handleRowClick(lead.id)}
                role="row"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && e.key === 'Enter') {
                    handleRowClick(lead.id);
                  }
                }}
                aria-label={`Lead ${lead.lead_id}: ${lead.name}`}
              >
                {/* Col 0: Checkbox */}
                <div
                  role="cell"
                  className={styles.checkboxCell}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    aria-label={`Select lead ${lead.lead_id}`}
                    checked={isSelected}
                    onChange={(e) => onToggleSelect?.(lead.id, e as unknown as React.MouseEvent)}
                    className={styles.rowCheckbox}
                  />
                </div>

                {/* Col 1: Lead ID Monospace Token */}
                <div role="cell">
                  <button
                    type="button"
                    onClick={(e) => handleCopyLeadId(lead.lead_id, e)}
                    className={styles.leadIdToken}
                    title="Click to copy Lead ID"
                    aria-label={`Copy Lead ID ${lead.lead_id}`}
                  >
                    {isCopied ? (
                      <span className={styles.copiedState}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied
                      </span>
                    ) : (
                      <span>{lead.lead_id}</span>
                    )}
                  </button>
                </div>

                {/* Col 2: Client Monogram Avatar + Organization Dual-Line */}
                <div role="cell" className={styles.clientMetaWithAvatar}>
                  <div className={styles.monogramAvatar} aria-hidden="true">
                    {clientInitials}
                  </div>
                  <div className={styles.clientTextCol}>
                    <span className={styles.clientName} title={lead.name}>
                      {lead.name}
                    </span>
                    <span className={styles.companyTitle} title={lead.company || undefined}>
                      {lead.company || 'Private Client'}
                    </span>
                  </div>
                </div>

                {/* Col 3: Service Scope */}
                <div role="cell">
                  <span className={styles.serviceCategory}>
                    {lead.service_category}
                  </span>
                </div>

                {/* Col 4: Inline Funnel Stage Selector */}
                <div role="cell">
                  <InlineStatusSelect
                    leadId={lead.id}
                    currentStatus={currentStatusOption}
                    availableStatuses={availableStatuses}
                    onStatusChange={onStatusChange}
                    disabled={userRole === 'viewer'}
                  />
                </div>

                {/* Col 5: Expected Value Numerals */}
                <div role="cell">
                  <span className={styles.dealValue}>
                    {canViewFinancials ? formatCurrency(lead.expected_value) : 'Restricted'}
                  </span>
                </div>

                {/* Col 6: Inline Representative Assignment or Read-only Badge */}
                <div role="cell" onClick={(e) => e.stopPropagation()}>
                  {canAssignInline ? (
                    <select
                      aria-label={`Assign representative for ${lead.name}`}
                      value={lead.assigned_to || ''}
                      disabled={assigningLeadId === lead.id}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleInlineAssigneeChange(lead.id, e.target.value);
                      }}
                      className={styles.inlineRepSelect}
                    >
                      <option value="" disabled>Unassigned</option>
                      {availableAssignees.map((rep) => (
                        <option key={rep.id} value={rep.id}>
                          {rep.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      className={styles.repBadge}
                      title={lead.assigned_to_name || 'Unassigned'}
                    >
                      {lead.assigned_to && (
                        <div className={styles.repAvatar} aria-hidden="true">
                          {repInitials}
                        </div>
                      )}
                      <span>{lead.assigned_to_name || 'Unassigned'}</span>
                    </div>
                  )}
                </div>

                {/* Col 7: Inline Priority Selector */}
                <div role="cell" className={styles.priorityCol}>
                  <InlinePrioritySelect
                    leadId={lead.id}
                    currentPriority={lead.priority}
                    onPriorityChange={onPriorityChange}
                    disabled={userRole === 'viewer'}
                  />
                </div>

                {/* Col 8: Next SLA Touchpoint */}
                <div
                  role="cell"
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

                {/* Col 9: Streamlined Action Controls Strip */}
                <div
                  role="cell"
                  className={styles.actionsCol}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Inspect in Drawer CTA */}
                  <button
                    type="button"
                    className={styles.drawerInspectBtn}
                    onClick={() => handleRowClick(lead.id)}
                    title="Slide out Client 360 Dossier"
                    aria-label={`Open dossier for ${lead.name}`}
                  >
                    <span>Dossier</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </button>

                  {/* Direct Link to dedicated page */}
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className={styles.directPageLink}
                    title="Open full page"
                    aria-label={`Open dedicated page for ${lead.name}`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Touch Card Fallback (< 768px) */}
      <div className={styles.mobileCardFeed}>
        {sortedLeads.map((lead) => (
          <LeadMobileCard
            key={lead.id}
            lead={lead}
            availableStatuses={availableStatuses}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            canViewFinancials={canViewFinancials}
            userRole={userRole}
          />
        ))}
      </div>
    </div>
  );
}
