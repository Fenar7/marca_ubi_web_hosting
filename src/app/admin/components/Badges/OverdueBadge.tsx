'use client';

/**
 * @file OverdueBadge.tsx
 * @description Tiered visual alert badge for overdue prospect touchpoints.
 *              Dynamically adjusts color, typography, and animation based on elapsed overdue duration:
 *              - < 24 Hours: Amber warning pill (#f59e0b)
 *              - 24 to 72 Hours: Vivid orange warning pill (#ff6100)
 *              - > 72 Hours: Pulsing red critical alert pill (#ef4444)
 *              Strictly suppresses rendering for terminal stages and 'On Hold' accounts.
 * @module admin/components/Badges/OverdueBadge
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import { calculateOverdueTier, type OverdueCalculationOptions } from './badgeUtils';
import styles from './OverdueBadge.module.scss';

export interface OverdueBadgeProps extends OverdueCalculationOptions {
  /** Scheduled follow-up ISO string */
  nextFollowUp: string | null | undefined;
  /** Presentation format variant: full ("Overdue: Due 3h ago") or short ("Due 3h ago") */
  variant?: 'full' | 'short';
  /** Optional custom CSS class name */
  className?: string;
}

export function OverdueBadge({
  nextFollowUp,
  bucket,
  statusName,
  revisitDate,
  nowMs,
  variant = 'full',
  className = '',
}: OverdueBadgeProps): React.ReactElement | null {
  const result = calculateOverdueTier(nextFollowUp, {
    bucket,
    statusName,
    revisitDate,
    nowMs,
  });

  if (!result.isOverdue || result.tier === 'none') {
    return null;
  }

  const displayText = variant === 'short' ? result.shortLabel : result.label;

  let tierClass = styles.amber;
  if (result.tier === 'orange') {
    tierClass = styles.orange;
  } else if (result.tier === 'red_pulse') {
    tierClass = styles.redPulse;
  }

  return (
    <span
      className={`${styles.badge} ${tierClass} ${className}`.trim()}
      role="status"
      aria-label={result.label}
      title={`Touchpoint overdue: scheduled for ${new Date(nextFollowUp || '').toLocaleString()}`}
    >
      <span className={styles.dot} aria-hidden="true" />
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{displayText}</span>
    </span>
  );
}
