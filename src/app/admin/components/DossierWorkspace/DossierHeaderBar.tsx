'use client';

/**
 * @file DossierHeaderBar.tsx
 * @description Master navigation and primary action header bar for the Client 360° Workspace.
 *              Integrates:
 *              - Back navigation targeting /admin/leads or /admin/deals based on operational context.
 *              - Accessible breadcrumbs with a Raycast monospace copy token chip.
 *              - Editorial entity heading with mandatory trailing period (e.g. 'Morar Group 8500.').
 *              - Status selector pill with semantic radar dot and animated stage dropdown.
 *              - High-contrast specular primary action buttons meeting WCAG 44px minimum tap targets.
 * @module components/DossierWorkspace/DossierHeaderBar
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { FunnelStatus } from '@/types/crm';
import styles from './LeadDossierWorkspace.module.scss';

export interface DossierHeaderBarProps {
  /** Unique human-readable deal identifier token (e.g. 'LD-10343') */
  leadIdCode: string;
  /** Client company or registered enterprise title */
  companyName: string | null;
  /** Primary decision-maker full name */
  contactName: string;
  /** Currently active commercial funnel stage */
  currentStatus: FunnelStatus;
  /** Catalog of active pipeline stages available for transitions */
  funnelStatuses: FunnelStatus[];
  /** Workspace mode driving breadcrumbs and return navigation */
  workspaceMode: 'leads' | 'deals';
  /** Flag denoting whether the inquiry has already graduated to a converted deal */
  isConverted: boolean;
  /** Callback triggered when a new pipeline stage is selected from the dropdown */
  onStatusSelect: (statusId: string) => void;
  /** Callback opening the Edit Scope modal dialog */
  onOpenEditScope: () => void;
  /** Callback opening the Follow-Up Touchpoint Scheduler */
  onOpenScheduler: () => void;
  /** Optional callback opening the Convert to Deal dialog */
  onOpenConvertToDeal?: () => void;
  /** Mutation lock preventing redundant clicks during server actions */
  isPending?: boolean;
}

export function DossierHeaderBar({
  leadIdCode,
  companyName,
  contactName,
  currentStatus,
  funnelStatuses,
  workspaceMode,
  isConverted,
  onStatusSelect,
  onOpenEditScope,
  onOpenScheduler,
  onOpenConvertToDeal,
  isPending = false,
}: DossierHeaderBarProps): React.ReactElement {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    if (isStatusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  // Clean up copy tooltip timer
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyToken = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(leadIdCode).catch(() => {
        // Fallback for restricted clipboard contexts
      });
      setIsCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  }, [leadIdCode]);

  // Formatted heading with architectural trailing period (e.g. 'Morar Group 8500.')
  const entityTitle = (companyName?.trim() || contactName.trim() || 'Private Client') + '.';
  const backTarget = workspaceMode === 'deals' ? '/admin/deals' : '/admin/leads';
  const backLabel = workspaceMode === 'deals' ? 'Back to Deals' : 'Back to Leads';
  const breadcrumbSection = workspaceMode === 'deals' ? 'Deals Pipeline' : 'Inbound Leads';

  return (
    <header className={styles.headerBar}>
      {/* 1. Navigation Rail & Breadcrumbs */}
      <div className={styles.headerTopRow}>
        <div className={styles.breadcrumbsNav}>
          <Link href={backTarget} className={styles.backLink} aria-label={`Return to ${backLabel}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ width: 14, height: 14 }}>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>{backLabel}</span>
          </Link>

          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbItem}>MARCA UBI CRM</span>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbItem}>{breadcrumbSection}</span>
          <span className={styles.breadcrumbSeparator}>/</span>

          {/* Raycast Monospace Token Chip */}
          <button
            type="button"
            onClick={handleCopyToken}
            className={styles.tokenChip}
            title="Click to copy deal reference ID"
            aria-label={`Copy reference code ${leadIdCode}`}
          >
            <span>{leadIdCode}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {isCopied && (
              <span className={styles.tokenCopiedTooltip} role="status">
                Copied!
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Primary Headline & Action Rail */}
      <div className={styles.headerMainRow}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.entityHeading}>{entityTitle}</h1>

          {/* Interactive Status Selector Pill */}
          <div className={styles.statusSelectorWrapper} ref={dropdownRef}>
            <button
              type="button"
              className={styles.statusPillTrigger}
              onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isStatusDropdownOpen}
              disabled={isPending}
            >
              <span
                className={styles.radarDot}
                style={{ backgroundColor: currentStatus.color_code || '#ff6100' }}
                aria-hidden="true"
              />
              <span>{currentStatus.name}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ width: 12, height: 12, marginLeft: 2 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isStatusDropdownOpen && (
              <div className={styles.statusDropdownMenu} role="listbox" aria-label="Pipeline stage options">
                {funnelStatuses.map((st) => {
                  const isActive = st.id === currentStatus.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={`${styles.statusDropdownOption} ${isActive ? styles.activeOption : ''}`}
                      onClick={() => {
                        setIsStatusDropdownOpen(false);
                        if (!isActive) {
                          onStatusSelect(st.id);
                        }
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: st.color_code || '#9ca3af',
                            display: 'inline-block',
                          }}
                        />
                        <span>{st.name}</span>
                      </span>
                      <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#6b7280' }}>
                        {st.bucket}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Primary Action Button Suite */}
        <div className={styles.headerActionsRail}>
          {!isConverted && onOpenConvertToDeal && (
            <button
              type="button"
              onClick={onOpenConvertToDeal}
              className={styles.btnConvertDeal}
              disabled={isPending}
              aria-label="Convert this inquiry into an active pipeline deal"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ width: 15, height: 15 }}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Convert to Deal</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenEditScope}
            className={styles.btnSecondaryAction}
            disabled={isPending}
            aria-label="Edit commercial deal parameters and contact coordinates"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>Edit Scope</span>
          </button>

          <button
            type="button"
            onClick={onOpenScheduler}
            className={styles.btnSecondaryAction}
            disabled={isPending}
            aria-label="Schedule client follow-up touchpoint"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Schedule Touchpoint</span>
          </button>
        </div>
      </div>
    </header>
  );
}
