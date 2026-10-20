'use client';

/**
 * @file InlineStatusSelect.tsx
 * @description High-performance inline commercial pipeline stage selector powered by React 19 `useOptimistic`.
 *              Delivers instantaneous (<10ms) stage transitions with automatic rollback on network
 *              or validation failures, while guarding terminal conversions and losses via event triggers.
 * @module app/admin/components/LeadsTable/InlineStatusSelect
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useEffect, useOptimistic, useTransition } from 'react';
import type { FunnelBucket } from '@/types/crm';
import { updateLeadStatusInlineAction } from '@/app/actions/leadInlineActions';
import styles from './InlineStatusSelect.module.scss';

export interface InlineStatusOption {
  id: string;
  name: string;
  bucket: FunnelBucket;
  color_code: string;
  sort_order?: number;
}

export interface InlineStatusSelectProps {
  /** Primary key UUID of the commercial inquiry */
  leadId: string;
  /** Current active stage coordinates */
  currentStatus: InlineStatusOption;
  /** Available pipeline stages from agency taxonomy */
  availableStatuses: InlineStatusOption[];
  /** Callback fired upon confirmed stage alteration */
  onStatusChange?: (leadId: string, newStatus: InlineStatusOption) => void;
  /** Optional custom class name */
  className?: string;
  /** Disables interactive selector */
  disabled?: boolean;
}

/**
 * Safely converts hex colors (including 3-digit shorthand) to rgba with explicit opacity
 * to prevent invalid hex concatenation like #fff18.
 */
function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  if (c.length === 6) {
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

export function InlineStatusSelect({
  leadId,
  currentStatus,
  availableStatuses,
  onStatusChange,
  className,
  disabled = false,
}: InlineStatusSelectProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [openUpward, setOpenUpward] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  // React 19 optimistic state: updates UI immediately, auto-reverts on transition failure
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    currentStatus,
    (_state: InlineStatusOption, nextStatus: InlineStatusOption) => nextStatus
  );

  // Dismiss popover on outside click and Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollParent = containerRef.current.closest(`.${styles.virtualScrollContainer}`) as HTMLElement | null;
      let spaceBelow = window.innerHeight - rect.bottom;
      if (scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect();
        const spaceInsideParent = parentRect.bottom - rect.bottom;
        spaceBelow = Math.min(spaceBelow, spaceInsideParent);
      }
      if (spaceBelow < 270 && rect.top > 200) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelectStatus = (targetStatus: InlineStatusOption, e: React.MouseEvent): void => {
    e.stopPropagation();
    setIsOpen(false);

    if (targetStatus.id === optimisticStatus.id) {
      return;
    }

    // Guarded Transitions: Converted, Lost, Negotiation, and On Hold require formal disclosures, valuations, or revisit dates
    const isGuardedStage =
      targetStatus.bucket === 'converted' ||
      targetStatus.bucket === 'lost' ||
      targetStatus.name.toLowerCase() === 'negotiation' ||
      targetStatus.name.toLowerCase() === 'on hold';

    if (isGuardedStage) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('open-stage-modal', {
            detail: { leadId, targetStatus },
          })
        );
      }
      return;
    }

    startTransition(async () => {
      // 1. Instant optimistic visual feedback
      setOptimisticStatus(targetStatus);

      try {
        // 2. Execute Server Action
        const result = await updateLeadStatusInlineAction(leadId, targetStatus.id);

        if (result.success && result.data?.statusDetails) {
          onStatusChange?.(leadId, result.data.statusDetails);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('lead-updated', {
                detail: { leadId, field: 'status', status: result.data.statusDetails },
              })
            );
          }
        } else {
          // Rollback occurs automatically when transition finishes without local commit
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('crm-toast', {
                detail: {
                  type: 'error',
                  message: result.error || 'Failed to update deal stage. Reverting.',
                },
              })
            );
          }
        }
      } catch {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('crm-toast', {
              detail: {
                type: 'error',
                message: 'Network connection failure. Action reverted.',
              },
            })
          );
        }
      }
    });
  };

  const rawColor = optimisticStatus.color_code?.toLowerCase().trim();
  const isWhite = !rawColor || rawColor === '#ffffff' || rawColor === '#fff' || rawColor === 'white';
  const statusColor = isWhite ? '#475569' : optimisticStatus.color_code || '#1f242f';

  return (
    <div
      ref={containerRef}
      className={`${styles.statusSelectContainer} ${className || ''}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`${styles.statusPillBtn} ${isPending ? styles.isPendingShimmer : ''}`}
        style={{
          background: hexToRgba(statusColor, 0.1),
          borderColor: hexToRgba(statusColor, 0.3),
          color: statusColor,
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current stage: ${optimisticStatus.name}. Click to change pipeline status.`}
      >
        <span
          className={styles.statusDot}
          style={{
            background: statusColor,
            boxShadow: `0 0 6px ${hexToRgba(statusColor, 0.5)}`,
          }}
          aria-hidden="true"
        />
        <span className={styles.statusLabel}>{optimisticStatus.name}</span>
        <span
          className={`${styles.dropdownChevron} ${isOpen ? styles.chevronOpen : ''}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          className={`${styles.popoverMenu} ${openUpward ? styles.popoverMenuUp : ''}`}
          role="listbox"
          aria-label="Select pipeline stage"
        >
          <div className={styles.popoverHeader}>Funnel Stage</div>
          {availableStatuses.map((status) => {
            const isSelected = status.id === optimisticStatus.id;
            const isGuarded = status.bucket === 'converted' || status.bucket === 'lost';
            const rawItemColor = status.color_code?.toLowerCase().trim();
            const isItemWhite = !rawItemColor || rawItemColor === '#ffffff' || rawItemColor === '#fff' || rawItemColor === 'white';
            const itemColor = isItemWhite ? '#475569' : status.color_code || '#1f242f';

            return (
              <button
                key={status.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={(e) => handleSelectStatus(status, e)}
                className={`
                  ${styles.popoverItem}
                  ${isSelected ? styles.selectedItem : ''}
                  ${isGuarded ? styles.guardedItem : ''}
                `}
              >
                <div className={styles.itemLeft}>
                  <span
                    className={styles.statusDot}
                    style={{ background: itemColor }}
                    aria-hidden="true"
                  />
                  <span>{status.name}</span>
                </div>

                {isGuarded && !isSelected && (
                  <span className={styles.guardedTag}>Modal</span>
                )}

                {isSelected && (
                  <span className={styles.checkMark} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
